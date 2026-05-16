## Problem

The right-hand AI panel shows this empty state when a ticket has a KB match but no pre-baked `draftedReply`:

> KB match queued — draft will appear after CS staff confirms tone selection.

Same flavour of weirdness as the "routed to CS staff" copy:
- The reader **is** CS — there is no separate person to "confirm tone."
- "Tone selection" is a workflow step that doesn't exist anywhere in the app. It was filler copy to justify why no draft was rendered.
- In the seed data, ~70 tickets are `answeredByKb: true` but only ~5 carry a hand-written `draftedReply`. The other ~65 hit this message — so the dead-end copy is the *default* experience, not an edge case.

The real reason there's no draft is: the demo data only ships drafts for a few flagship tickets. The UX should not invent a fake "queued for tone" step to cover that gap.

## Proposed change (UI only)

When `answeredByKb` is true, **always** show a usable drafted reply. If `draftedReply` exists on the ticket, render it as-is. If not, synthesise one client-side from the matched KB entry — that's exactly what the system claims to do anyway ("KB match → drafted reply in Boldr brand voice"). No fake queue, no fake tone step.

### 1. Synthesis rule (deterministic, client-side)

For tickets with `answeredByKb: true` and no `draftedReply`:

```text
Hi {firstName},

Thanks for reaching out about Boldr. {kbEntry.answer}

Let me know if anything else is unclear.

— Boldr Customer Care
```

- `firstName` = `ticket.customer.split(" ")[0]`
- `kbEntry` = top match from `ticket.kbMatches` (highest similarity)
- If multiple KB matches exist, use only the top one for the body; list the others as "Also referenced: KB-### · KB-###" under the draft.

A tiny "Drafted from KB-### · {similarity}%" caption sits above the reply so CS knows where it came from. The existing **Approve & send / Edit / Reject** buttons stay exactly the same — they now work for every KB-answered ticket, not just the 5 hand-authored ones.

### 2. Remove the "queued / tone" copy entirely

Delete this block from `AiPanel`:

```tsx
{!ticket.isGap && !ticket.draftReply && (
  <div ...>KB match queued — draft will appear after CS staff confirms tone selection.</div>
)}
```

Collapse the surrounding branch to a single "always render a draft when KB-answered" card.

### 3. What about the rare "no KB match AND not a gap" case?

If `answeredByKb` is false **and** `isKnowledgeGap` is false (a ticket that's neither — e.g. order-status tickets routed to Shopify), keep a short, honest empty state:

> No KB answer needed — this ticket is handled in {routedTo}.

If `routedTo` is internal/CS, just say "Reply manually below" with an inline textarea + send button (mirrors the gap form, minus the KB save).

### 4. Edit affordance gets real

Today the "Edit" button is decorative. Tiny upgrade: clicking Edit swaps the read-only reply for an editable textarea seeded with the same text. Approve & send still works, now against the edited content. (Client-side only — no persistence.)

## Why this matters

- Kills the second "CS handing off to CS" dead end on the same screen.
- Makes the KB-match path demoable on **every** answerable ticket, not just the 5 flagship ones.
- Reinforces the core narrative: AI extracts intent → matches KB → drafts in brand voice → human approves. One uninterrupted loop.

## Out of scope

- Real LLM-generated brand-voice rewrite of the KB answer (deterministic template is good enough for v1 and is honest about what the system is doing).
- Persisting edited drafts.
- Multiple-language tone variants.

## Files touched

- `src/routes/inbox.tsx` — synthesise draft from top KB match when `draftedReply` is missing; remove the "queued/tone" empty state; small inline-edit affordance for the Edit button; honest empty state for the rare not-KB / not-gap case.
- `src/data.ts` — no changes (KB entries already carry the answer text).
