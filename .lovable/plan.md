# Copilot → right-side slide-over

## Why
The inline dock on /benchmark scrolls the dashboard off-screen the moment a user starts chatting, so the charts and verdict badges they're asking about are no longer visible. A right-side slide-over keeps the dashboard on the left while the conversation runs on the right, and makes the Copilot reachable from every page — not just /benchmark.

## What changes

**1. New global Copilot drawer**
- A right-side panel (~480px wide on desktop, full-width on mobile) that slides in/out with a backdrop blur.
- Houses the existing chat thread component as-is — user/assistant bubbles, citations, typing indicator, "New conversation" button, suggested prompts when empty.
- Closeable via X button, Escape key, or clicking the backdrop.
- The conversation thread persists for the session — closing and reopening returns to the same thread; navigating between pages keeps it intact.

**2. Global open/close state**
- Lifted into a small context provider mounted in the root layout, so the header pill, ⌘K shortcut, and any in-page CTA can all toggle the same drawer and share the same conversation.

**3. Trigger points**
- Header "Ask your data" pill (already present) → opens the drawer instead of scrolling to a dock.
- ⌘K / Ctrl+K keyboard shortcut → toggles it from anywhere.
- /benchmark page keeps a small CTA card where the inline dock used to be: "Drill deeper with the Copilot →" which opens the drawer. No more big inline chat block pushing content down.

**4. Mobile behavior**
- Drawer becomes full-width with a top close bar.
- Backdrop tap closes it.

## Out of scope
- No backend/API change. Responses still come from the seeded `copilotResponses` matcher.
- No persistence across browser reloads (session-only, matches current behavior).
- Inline dock component is removed from /benchmark and replaced with a slim CTA card.

## Technical notes
- `CopilotPanel` (the chat thread UI) is reused inside the drawer with no logic changes.
- New `CopilotProvider` exposes `{ open, setOpen, turns, ask, reset }` so state survives route changes.
- AppShell mounts `<CopilotProvider>` once and renders `<CopilotDrawer />` at the root.
- Existing `openCopilot()` logic in AppShell is simplified — no more conditional scroll-vs-navigate, just `setOpen(true)`.
