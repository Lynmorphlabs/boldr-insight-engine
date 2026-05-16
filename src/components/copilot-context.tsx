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

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggle: () => void;
  turns: Turn[];
  ask: (prompt: string) => void;
  reset: () => void;
  citation: CitationRef | null;
  openCitation: (c: CitationRef) => void;
  closeCitation: () => void;
};

const CopilotContext = createContext<Ctx | null>(null);

export function CopilotProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const seq = useRef(0);

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
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <CopilotContext.Provider value={{ open, setOpen, toggle, turns, ask, reset }}>
      {children}
    </CopilotContext.Provider>
  );
}

export function useCopilot() {
  const ctx = useContext(CopilotContext);
  if (!ctx) throw new Error("useCopilot must be used inside <CopilotProvider>");
  return ctx;
}
