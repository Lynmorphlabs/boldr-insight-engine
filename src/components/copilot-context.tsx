import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { copilotResponses, tickets, externalSources, type CopilotResponse } from "@/data";
import { Webhooks } from "@/lib/webhooks";

export type Turn =
  | { role: "user"; id: string; text: string }
  | { role: "assistant"; id: string; pending?: boolean; answer?: CopilotResponse };

function exactOrFuzzy(prompt: string): CopilotResponse | null {
  const exact = copilotResponses.find((r) => r.prompt === prompt);
  if (exact) return exact;
  const lc = prompt.toLowerCase();
  const fuzzy = copilotResponses.find((r) =>
    r.prompt.toLowerCase().split(/\s+/).some((w) => w.length > 4 && lc.includes(w)),
  );
  return fuzzy ?? null;
}

// --- Smart-sounding follow-up generator ----------------------------------
// Pulls real tickets + external quotes from src/data.ts so citations are
// always grounded, even when the answer text is synthesized.

const TOPIC_KEYWORDS: Record<string, string[]> = {
  titanium: ["titanium", "grade 2", "grade 5", "ti "],
  nickel: ["nickel", "allergy", "rash", "hypoallergenic"],
  bpa: ["bpa", "silicone", "strap safety", "skin"],
  sustainability: ["vegan", "sustain", "eco", "recycled"],
  engraving: ["engrav", "personalis", "personalize", "monogram"],
  shipping: ["ship", "delivery", "express", "courier"],
  servicing: ["servic", "battery", "repair", "warranty"],
};

function detectTopic(prompt: string): string | null {
  const lc = prompt.toLowerCase();
  for (const [topic, kws] of Object.entries(TOPIC_KEYWORDS)) {
    if (kws.some((k) => lc.includes(k))) return topic;
  }
  return null;
}

function pickCitations(topic: string | null, priorPrompt: string): CopilotResponse["citations"] {
  const haystack = (topic ?? priorPrompt).toLowerCase();
  const matchedTickets = tickets
    .filter((t) =>
      (t.subject + " " + t.body + " " + t.lane).toLowerCase().includes(haystack.split(" ")[0]),
    )
    .slice(0, 2);
  const allQuotes = externalSources.flatMap((s) => s.quotes.map((q) => ({ ...q, src: s.name })));
  const matchedQuotes = allQuotes
    .filter((q) => (q.text + " " + q.theme).toLowerCase().includes(haystack.split(" ")[0]))
    .slice(0, 2);

  const fallbackTickets = matchedTickets.length ? matchedTickets : tickets.slice(0, 2);
  const fallbackQuotes = matchedQuotes.length ? matchedQuotes : allQuotes.slice(0, 1);

  return [
    ...fallbackTickets.map((t) => ({
      type: "ticket" as const,
      id: t.id,
      label: `${t.id} · ${t.subject}`,
      quote: t.body,
    })),
    ...fallbackQuotes.map((q) => ({
      type: "external" as const,
      id: q.author,
      label: `${q.source} · ${q.author}`,
      quote: q.text,
    })),
  ];
}

function classifyIntent(prompt: string): "scope" | "why" | "action" | "compare" | "timeline" | "generic" {
  const lc = prompt.toLowerCase();
  if (/(how (many|big|large)|how much|volume|%|percent|share|concern|scope|widespread)/.test(lc)) return "scope";
  if (/^why|because|driver|cause|root/.test(lc)) return "why";
  if (/(what should|recommend|next step|action|do about|fix|how do we|plan)/.test(lc)) return "action";
  if (/(vs\.?|versus|compare|difference between)/.test(lc)) return "compare";
  if (/(when|timeline|trend|over time|last (week|month|quarter)|month)/.test(lc)) return "timeline";
  return "generic";
}

function synthesizeFollowUp(prompt: string, priorPrompt: string): CopilotResponse {
  const intent = classifyIntent(prompt);
  const topic = detectTopic(prompt) ?? detectTopic(priorPrompt) ?? "this theme";
  const citations = pickCitations(detectTopic(prompt) ?? detectTopic(priorPrompt), priorPrompt);
  const ticketCount = citations.filter((c) => c.type === "ticket").length;
  const extCount = citations.filter((c) => c.type === "external").length;

  const topicLabel = topic === "this theme" ? "this thread" : topic;

  let insight = "";
  switch (intent) {
    case "scope":
      insight = `Yes — material enough to act on, not yet a crisis. Across the last 30 days we logged ${tickets.filter((t) => (t.subject + t.body).toLowerCase().includes(String(topic))).length || 6}+ inbound tickets touching ${topicLabel}, with steady external chatter on WatchUSeek and r/Watches. It's roughly ~4–6% of weekly volume, but skewed toward our highest-LTV personas (Enthusiasts, Health-Conscious Buyers), so the revenue exposure is bigger than the raw count suggests.`;
      break;
    case "why":
      insight = `Three drivers are converging on ${topicLabel}: (1) product pages don't pre-empt the question, so customers ask CS instead; (2) competitor marketing has primed the term in the last quarter; (3) our KB has a partial answer but no canonical explainer, so reps draft inconsistently. The internal tickets below show the same wording recurring almost verbatim — a strong signal that one good explainer would deflect most of them.`;
      break;
    case "action":
      insight = `Recommended next step: publish a short explainer addressing ${topicLabel} directly on the relevant PDPs, then auto-link it from CS templates. Loop the draft through the Sustainability + Product leads for sign-off. Based on similar deflection lifts we've seen on engraving and strap-compat content, expect ~30–40% reduction in inbound on this theme within 2 weeks of publishing.`;
      break;
    case "compare":
      insight = `Short version: the two are closer than customers think, but the framing matters. The internal tickets show buyers asking the comparison in commercial terms ("which should I buy"), while external posts frame it technically ("which is objectively better"). A single explainer that handles both registers — one practical paragraph, one spec table — would cover ~80% of the variations we're seeing.`;
      break;
    case "timeline":
      insight = `Volume on ${topicLabel} has been climbing for ~3 weeks, not spiking. That pattern usually means an organic content shift (a YouTuber, a Reddit thread, or a competitor launch) rather than a defect. Worth watching for another 7 days before treating it as a campaign-level signal, but already worth a KB entry now.`;
      break;
    default:
      insight = `On ${topicLabel}: the signal is consistent across channels. Internal CS tickets and external forum posts are using almost the same phrasing, which usually means the question is genuine confusion rather than a complaint. The cheapest fix is a clear explainer in the KB + PDP; the more expensive fix is a product-page redesign. I'd start with the explainer and measure deflection over 2 weeks.`;
  }

  insight += `\n\nGrounded in ${ticketCount} internal ticket${ticketCount === 1 ? "" : "s"} and ${extCount} external mention${extCount === 1 ? "" : "s"} below.`;

  return { prompt, insight, citations };
}

export type CitationRef = { type: "ticket" | "external"; id: string; label: string; quote?: string };

const STORAGE_KEY = "boldr.copilot.citations";

type Persisted = { tabs: CitationRef[]; activeId: string | null };

function loadPersisted(): Persisted {
  if (typeof window === "undefined") return { tabs: [], activeId: null };
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { tabs: [], activeId: null };
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      tabs: Array.isArray(parsed.tabs) ? parsed.tabs : [],
      activeId: typeof parsed.activeId === "string" ? parsed.activeId : null,
    };
  } catch {
    return { tabs: [], activeId: null };
  }
}

const citationKey = (c: CitationRef) => `${c.type}:${c.id}`;

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  turns: Turn[];
  ask: (prompt: string) => void;
  reset: () => void;
  citationTabs: CitationRef[];
  activeCitationId: string | null;
  activeCitation: CitationRef | null;
  openCitation: (c: CitationRef) => void;
  setActiveCitation: (id: string) => void;
  closeCitationTab: (id: string) => void;
  closeAllCitations: () => void;
};

const CopilotContext = createContext<Ctx | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const initial = useRef<Persisted>(loadPersisted());
  const [citationTabs, setCitationTabs] = useState<CitationRef[]>(initial.current.tabs);
  const [activeCitationId, setActiveCitationId] = useState<string | null>(initial.current.activeId);
  const seq = useRef(0);

  // persist tabs
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (citationTabs.length === 0) {
        window.sessionStorage.removeItem(STORAGE_KEY);
      } else {
        window.sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ tabs: citationTabs, activeId: activeCitationId } satisfies Persisted),
        );
      }
    } catch {
      /* ignore quota / privacy errors */
    }
  }, [citationTabs, activeCitationId]);

  const openCitation = useCallback((c: CitationRef) => {
    const key = citationKey(c);
    setCitationTabs((prev) => (prev.some((p) => citationKey(p) === key) ? prev : [...prev, c]));
    setActiveCitationId(key);
  }, []);

  const setActiveCitation = useCallback((id: string) => setActiveCitationId(id), []);

  const closeCitationTab = useCallback((id: string) => {
    setCitationTabs((prev) => {
      const idx = prev.findIndex((p) => citationKey(p) === id);
      if (idx === -1) return prev;
      const next = prev.filter((_, i) => i !== idx);
      setActiveCitationId((current) => {
        if (current !== id) return current;
        if (next.length === 0) return null;
        const fallback = next[Math.max(0, idx - 1)] ?? next[0];
        return citationKey(fallback);
      });
      return next;
    });
  }, []);

  const closeAllCitations = useCallback(() => {
    setCitationTabs([]);
    setActiveCitationId(null);
  }, []);

  const ask = useCallback((prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    seq.current += 1;
    const uid = `u-${seq.current}`;
    const aid = `a-${seq.current}`;
    let priorUserPrompt = "";
    setTurns((t) => {
      for (let i = t.length - 1; i >= 0; i--) {
        const turn = t[i];
        if (turn.role === "user") { priorUserPrompt = turn.text; break; }
      }
      return [
        ...t,
        { role: "user", id: uid, text: trimmed },
        { role: "assistant", id: aid, pending: true },
      ];
    });
    setTimeout(() => {
      // First, try to match a curated response for the seeded prompts.
      // For anything else (i.e. real follow-ups), synthesize a smart-sounding
      // mock answer grounded in real tickets + external quotes.
      const curated = exactOrFuzzy(trimmed);
      const isFollowUp = priorUserPrompt.length > 0;
      const answer = !isFollowUp && curated
        ? curated
        : synthesizeFollowUp(trimmed, priorUserPrompt || trimmed);
      setTurns((t) =>
        t.map((turn) =>
          turn.id === aid ? { role: "assistant", id: aid, pending: false, answer } : turn,
        ),
      );
    }, 600);
  }, []);

  const reset = useCallback(() => setTurns([]), []);
  const toggle = useCallback(() => setOpen((v) => !v), []);

  // ⌘K / Ctrl+K and Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setActiveCitationId((current) => {
          if (current) {
            // close just the active tab on Esc; if none remain, leave copilot open
            setCitationTabs((tabs) => {
              const idx = tabs.findIndex((t) => citationKey(t) === current);
              if (idx === -1) return tabs;
              const next = tabs.filter((_, i) => i !== idx);
              const fallback = next.length ? citationKey(next[Math.max(0, idx - 1)] ?? next[0]) : null;
              setActiveCitationId(fallback);
              return next;
            });
            return current;
          }
          setOpen(false);
          return current;
        });
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const activeCitation =
    citationTabs.find((t) => citationKey(t) === activeCitationId) ?? null;

  return (
    <CopilotContext.Provider
      value={{
        open,
        setOpen,
        toggle,
        turns,
        ask,
        reset,
        citationTabs,
        activeCitationId,
        activeCitation,
        openCitation,
        setActiveCitation,
        closeCitationTab,
        closeAllCitations,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used inside <CopilotProvider>");
  return ctx;
}

export const getCitationKey = citationKey;
