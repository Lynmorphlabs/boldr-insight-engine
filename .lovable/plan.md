## Problem

The current knowledge gap panel says "Not in KB — routed to CS staff" and shows a `Routed to: cs@boldr.co` row. But the person reading this screen *is* CS staff. Routing CS → CS is a dead end, and the "Auto-drafted KB entry" below it implies the AI already wrote the answer — which contradicts the whole point of a knowledge gap (the AI does not know).

## Proposed change (UI only, frontend)

Reframe the knowledge-gap card so the CS agent on this screen is the one who supplies the answer. The AI's job stops at "I don't know this — here's the structured question." The human's job is to type the canonical answer once, which then becomes the new KB entry.

### 1. Replace "Routed to" semantics

In the AI triage attribute panel:
- Drop the `Routed to: cs@boldr.co` row when it just points back at CS.
- Keep `Routed to` only when it points somewhere meaningful and external (e.g. `service@boldr.co` for repairs, `admin.shopify.com` for order ops, `corporate@boldr.co` for B2B). For internal-CS values, hide the row.

### 2. Rewrite the Knowledge Gap banner

Change the copy from "Not in KB — routed to CS staff" to something that owns the action, e.g.:

> **Knowledge gap — needs your answer**
> AI couldn't answer from the KB and didn't guess. Write the canonical answer once; it becomes KB entry and auto-resolves future tickets like this.

### 3. Replace "Auto-drafted KB entry" with "Draft KB entry from CS"

This is the core change. Today the card pretends the AI drafted the answer. Replace it with an editable form the CS agent fills in:

```text
DRAFT KB ENTRY (from this ticket)
Category   [Materials & Safety        ▾]   ← prefilled from ticket.lane
Question   [Are Boldr movements resistant to magnetic fields?]   ← prefilled from ticket.intent, editable
Answer     [                                                  ]
           [  ← empty textarea, CS types the canonical answer  ]
           [                                                  ]
Tags       [magnetic, movement, miyota]   ← chips, prefilled from extracted entities

Source of truth   ( ) My own knowledge   ( ) Confirmed with supplier   ( ) Pending confirmation
                  ← required radio; "Pending" saves as draft, not live KB

[ Save as KB entry & reply to customer ]   [ Save draft only ]
```

Behavior (all client-side for v1, no backend writes):
- Save button is disabled until Answer has content AND a source-of-truth is selected.
- On save: show a sonner toast "KB-### created · ticket TKT-#### linked", flip the ticket's local state to "resolved", and replace the gap card with a compact "KB-### created from this ticket" confirmation that links to the new entry.
- "Pending confirmation" saves it as draft (greyed badge, not counted in live KB) and keeps the ticket in `pending_reply`.

### 4. Reply composition reuses the answer

Below the KB form, add a small "Reply to customer" preview that auto-wraps the typed answer in Boldr brand voice scaffolding (greeting + the answer + signoff). CS hits **Approve & send**. One keystroke flow: type answer → it becomes both the KB entry and the customer reply.

### 5. Knowledge gap list view

On the inbox list, knowledge-gap tickets get a subtle "Needs answer" affordance (small ember dot next to the status badge — does NOT add a second badge, respecting the one-status-badge rule). Clicking the ticket opens straight into the answer form with the textarea focused.

## Why this matters

- Removes the nonsense CS→CS routing.
- Makes the "knowledge gap → new KB entry" loop a real, demoable action instead of a pre-baked AI fiction.
- Keeps the "AI never hallucinates" promise visible: the AI surfaces the gap; the human owns the answer.
- One human action produces both the customer reply and the durable KB entry — that's the compounding leverage story.

## Out of scope for this change

- Persisting KB entries to the database (v1 stays in local state; the form mutates the in-memory `kbEntries` list so the rest of the app sees the new entry for the session).
- Real assignment/routing engine.
- Multi-reviewer approval workflow on the KB entry.

## Files touched

- `src/routes/inbox.tsx` — gap banner copy, hide internal `routedTo`, replace auto-drafted KB card with editable form + reply preview, list-view "Needs answer" dot.
- `src/data.ts` — no schema change; the existing `autoDraftKb` (category/question/answer) becomes the prefill for the form instead of a finished entry.
