import { useEffect, useState } from "react";
import { X, Sparkles, FileText, Globe, ArrowRight } from "lucide-react";
import { copilotResponses, type CopilotResponse } from "@/data";
import { cn } from "@/lib/utils";

export function InsightsCopilot({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (!open) document.dispatchEvent(new CustomEvent("boldr:open-copilot"));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function ask(prompt: string) {
    setQuery(prompt);
    setLoading(true);
    setResponse(null);
    setTimeout(() => {
      const match =
        copilotResponses.find((r) => r.prompt === prompt) ??
        copilotResponses.find((r) => prompt.toLowerCase().includes(r.prompt.toLowerCase().split(" ")[2] ?? "")) ??
        copilotResponses[0];
      setResponse(match);
      setLoading(false);
    }, 550);
  }

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] transition-opacity",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed top-0 right-0 z-50 h-screen w-full sm:w-[480px] bg-background border-l border-border shadow-2xl transition-transform duration-300 flex flex-col",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-5 h-14 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-ember/10 text-ember flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5" />
            </div>
            <div className="leading-tight">
              <div className="text-[13.5px] font-medium">Insights Copilot</div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Staff · ask your data</div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-surface text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 border-b border-border">
          <div className="rounded-md hairline-strong bg-card focus-within:ring-2 focus-within:ring-ember/30">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && query.trim() && ask(query.trim())}
              placeholder="e.g. Are nickel-allergy questions rising?"
              className="w-full bg-transparent px-3 py-2.5 text-[13.5px] outline-none placeholder:text-muted-foreground/70"
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Internal analyst tool. Answers cite tickets + external sources. Never customer-facing.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!response && !loading && (
            <div>
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Suggested prompts</div>
              <div className="space-y-1.5">
                {copilotResponses.map((r) => (
                  <button
                    key={r.prompt}
                    onClick={() => ask(r.prompt)}
                    className="group w-full text-left rounded-md hairline bg-card px-3 py-2.5 hover:bg-ember-soft transition-colors flex items-center justify-between gap-3"
                  >
                    <span className="text-[13px]">{r.prompt}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-ember shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="space-y-2">
              <div className="h-3 w-2/3 rounded bg-surface-2 animate-pulse" />
              <div className="h-3 w-full rounded bg-surface-2 animate-pulse" />
              <div className="h-3 w-4/5 rounded bg-surface-2 animate-pulse" />
            </div>
          )}

          {response && !loading && (
            <div className="space-y-4">
              <div className="rounded-md bg-card hairline p-4">
                <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Query</div>
                <div className="mt-1 text-[13.5px]">{response.prompt}</div>
              </div>
              <div className="rounded-md bg-card hairline p-4">
                <div className="text-[10.5px] uppercase tracking-[0.16em] text-ember">Insight</div>
                <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/90">{response.insight}</p>
              </div>
              <div>
                <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Citations</div>
                <div className="space-y-2">
                  {response.citations.map((c) => (
                    <div key={c.id} className="rounded-md hairline bg-card p-3">
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        {c.type === "ticket" ? <FileText className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                        <span className="uppercase tracking-[0.14em]">{c.type === "ticket" ? "Internal ticket" : "External source"}</span>
                      </div>
                      <div className="mt-1 text-[13px] font-medium">{c.label}</div>
                      {c.quote && <p className="mt-1.5 text-[12.5px] text-muted-foreground italic">"{c.quote}"</p>}
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => { setResponse(null); setQuery(""); }}
                className="text-[12px] text-ember hover:underline"
              >
                ← Ask another question
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
