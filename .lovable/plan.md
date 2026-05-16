# Plan — Auto-sync Knowledge Base from Google Drive

Turn the KB into a live mirror of source documents in the Boldr team's Google Drive. Edit FAQ in a Google Sheet or update an SOP in a Google Doc → the KB refreshes within ~10 minutes, auto-drafted entries land in the existing pending-approval queue, and provenance points back to the exact file + revision.

## What you'll see in the UI

- A **Sources rail** that shows, per source: Drive file name, last synced timestamp, revision number, and a colored dot (synced / syncing / error / gap).
- A **"Sync now"** button on each source card (manual refresh) and a global one in the header.
- A **Source detail drawer** opened from any rail item — opens the Drive file in a new tab, shows last 5 sync runs, diff summary ("+3 entries, 1 edited, 2 removed since last sync").
- KB entries gain a small **"From Drive"** chip with the file name; clicking it opens the file at the right heading / row.
- New Drive content lands in the existing **Auto-drafted · pending approval** queue (no schema change to that flow), with provenance "Born from `FAQ-master.gsheet` row 47".

## How sync works

```text
 Google Drive                    Lovable Cloud (Postgres)              UI
 ┌──────────────────┐            ┌──────────────────────────┐         ┌────────────┐
 │ FAQ.gsheet       │  poll      │ kb_sources               │  read   │ /knowledge │
 │ SOP.gsheet       │ ─────────► │ kb_entries (status, prov)│ ──────► │ rail+cards │
 │ Product-Ref.gdoc │  every     │ kb_sync_runs (logs)      │         │            │
 │ Engraving.gdoc   │  ~10 min   │ kb_pending_changes       │         │            │
 │ Servicing.gdoc   │            └──────────────────────────┘         └────────────┘
 └──────────────────┘
```

1. A cron job hits `/api/public/sync/drive` every 10 min (with HMAC).
2. For each row in `kb_sources`, fetch the file's current `revisionId` via Drive API. Skip if unchanged.
3. If changed: fetch contents through the right connector (Sheets API for `.gsheet`, Docs API for `.gdoc`), parse into KB entries.
4. Diff against current `kb_entries` for that source:
   - New rows/headings → insert as `Auto-drafted`
   - Edited bodies → mark existing entry `Pending approval` with new draft stored alongside
   - Removed rows → mark `Archived` (kept for history, hidden from the live KB)
5. Write a `kb_sync_runs` row (counts, duration, error if any).
6. UI loader reads from Postgres — already-rendered components keep working with no changes to their props shape.

## Parsing rules

**Google Sheets (FAQ, SOP):** first row = headers. Required columns: `id`, `question`, `answer`, `category`. Optional: `status_override`. Each row = one entry; `id` is the stable key.

**Google Docs (Product Reference, Engraving Rate Card, Servicing Rate Card):** `Heading 2` = question, following paragraphs until the next H2 = answer, optional `Heading 3` immediately under H2 sets `category` (otherwise inherited from previous H3). Each entry's stable key is `slug(question)`.

## Setup steps (one-time, in this order)

1. **Enable Lovable Cloud** (for Postgres + secrets + cron).
2. **Connect Google Sheets** and **Google Drive** and **Google Docs** connectors (App connector, Boldr team account).
3. Open `/knowledge` → new **"Connect Drive sources"** modal lets an admin pick the 5 files from a Drive file picker (powered by the Drive connector's `files.list`). Selections persist to `kb_sources.drive_file_id`.
4. First sync runs immediately; subsequent syncs run on the 10-min cron.

## Technical section

### Database (one migration)

```sql
-- existing kb_entries gets new columns
alter table kb_entries add column drive_source_id uuid references kb_sources(id);
alter table kb_entries add column drive_row_or_anchor text;  -- "row:47" or "heading:What-grade-of-titanium"
alter table kb_entries add column drive_revision_id text;
alter table kb_entries add column draft_answer text;          -- pending edit, shown in approval queue

create table kb_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,                  -- "FAQ", "SOP", etc.
  kind text not null check (kind in ('sheet','doc')),
  drive_file_id text not null,
  drive_file_name text not null,
  last_synced_at timestamptz,
  last_revision_id text,
  last_status text check (last_status in ('ok','error','syncing')),
  last_error text
);

create table kb_sync_runs (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references kb_sources(id) on delete cascade,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  added int default 0, edited int default 0, removed int default 0,
  status text, error text
);
```
RLS: read-only for `authenticated`; writes only via service role (server functions).

### Server functions (`src/lib/kb-sync.functions.ts`)

- `listKbSources()` — used by the rail.
- `getSyncRuns(sourceId)` — used by the detail drawer.
- `triggerSync(sourceId?)` — manual button; admin-gated via `requireSupabaseAuth` + a `has_role('admin', uid)` check.
- `pickDriveFile(query)` — proxies `GET /drive/v3/files` for the connect-sources modal.

### Server route (`src/routes/api/public/sync/drive.ts`)

POST handler with HMAC-verified secret (`KB_SYNC_SECRET`). Iterates `kb_sources`, calls per-source sync helper, writes `kb_sync_runs`. Returns JSON summary. Cron: `pg_cron` calling `https://project--{id}.lovable.app/api/public/sync/drive` every 10 min.

### Parsers (`src/lib/kb-sync.server.ts`)

- `parseSheet(spreadsheetId, sheetName)` — uses gateway: `GET /google_sheets/v4/spreadsheets/{id}/values/{range}` with range `Sheet1!A:E`. Validates headers with Zod.
- `parseDoc(documentId)` — uses gateway: `GET /google_docs/v1/documents/{id}`. Walks `body.content`, groups by `HEADING_2`, joins `textRun.content`.
- `diffEntries(sourceId, parsed)` — returns `{ adds, edits, removes }`; performs the upsert + status transitions in a single transaction.

### Files to change

- New: migration, `kb-sync.functions.ts`, `kb-sync.server.ts`, `api/public/sync/drive.ts`, `src/components/SourceSyncRail.tsx`, `src/components/SourceDetailDrawer.tsx`, `src/components/ConnectSourcesModal.tsx`.
- Edited: `src/routes/knowledge.tsx` — swap seeded `kbSources`/`kbEntries` for loader data from server functions; mount the new rail components; thread sync status into existing cards.
- `src/data.ts` — keep types (`KbStatus`, `KbSource`, `KbEntry`) but remove seeded arrays; types now describe DB rows.

### Secrets

- `KB_SYNC_SECRET` (HMAC for the cron webhook) — added via secrets tool.
- Google connector keys land automatically when you link the connectors.

### What stays the same

- All current `/knowledge` visuals (themes panel, growth chart, pending queue grid, grouped entries list).
- The approval flow's UX — `Approve` / `Edit` buttons just write back to Postgres (and optionally push the approved edit back into the Sheet, out of scope for this round).

### Out of scope (call out if you want them next)

- Real-time push notifications (Drive `changes.watch`).
- Two-way sync (approved edits writing back to Drive).
- Per-user OAuth / multi-tenant KBs.
