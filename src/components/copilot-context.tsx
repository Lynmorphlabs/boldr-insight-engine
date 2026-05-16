import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { copilotResponses, type CopilotResponse } from "@/data";

export type Turn =
  | { role: "user"; id: string; text: string }
  | { role: "assistant"; id: string; pending?: boolean; answer?: CopilotResponse };

function matchResponse(prompt: string): CopilotResponse {
  const exact = copilotResponses.find((r) => r.prompt === prompt);
  if (exact) return exact;
  const lc = prompt.toLowerCase();
  const fuzzy = copilotResponses.find((r) =>
    r.prompt.toLowerCase().split(/\s+/).some((w) => w.length > 4 && lc.includes(w)),
  );
  return fuzzy ?? copilotResponses[0];
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
    setTurns((t) => [
      ...t,
      { role: "user", id: uid, text: trimmed },
      { role: "assistant", id: aid, pending: true },
    ]);
    setTimeout(() => {
      const answer = matchResponse(trimmed);
      setTurns((t) =>
        t.map((turn) =>
          turn.id === aid ? { role: "assistant", id: aid, pending: false, answer } : turn,
        ),
      );
    }, 500);
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
