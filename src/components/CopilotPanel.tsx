import { useEffect, useRef } from "react";
import { Sparkles, FileText, Globe, ArrowRight, CornerDownLeft, User, RotateCcw } from "lucide-react";
import { copilotResponses } from "@/data";
import { useCopilot } from "./copilot-context";
import { useState } from "react";

export function CopilotPanel() {
  const { turns, ask, reset, openCitation } = useCopilot();
  const [query, setQuery] = useState("");
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const empty = turns.length === 0;

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  function submit(text: string) {
    if (!text.trim()) return;
    ask(text);
    setQuery("");
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Sub-header actions */}
      {!empty && (
        <div className="flex items-center justify-end mb-3">
          <button
            onClick={() => { reset(); inputRef.current?.focus(); }}
            className="inline-flex items-center gap-1.5 rounded-full hairline bg-surface-2/50 px-3 py-1.5 text-[11.5px] text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"
          >
            <RotateCcw className="h-3 w-3" /> New conversation
          </button>
        </div>
      )}

      {/* Conversation / empty state */}
      <div ref={scrollerRef} className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4">
        {empty ? (
          <div>
            <div className="rounded-2xl hairline bg-surface-2/40 p-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="leading-tight">
                  <div className="text-[13.5px] font-semibold">Ask your data</div>
                  <div className="text-[11px] text-muted-foreground">Answers cite internal tickets + external sources.</div>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-2">Try one of these</div>
              <div className="space-y-2">
                {copilotResponses.map((r) => (
                  <button
                    key={r.prompt}
                    onClick={() => submit(r.prompt)}
                    className="group w-full text-left rounded-xl hairline bg-surface-2/40 hover:bg-surface-2 px-3 py-2.5 transition flex items-center justify-between gap-3"
                  >
                    <span className="text-[12.5px]">{r.prompt}</span>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          turns.map((turn) =>
            turn.role === "user" ? (
              <div key={turn.id} className="flex items-start gap-3 justify-end">
                <div className="rounded-2xl rounded-tr-md gradient-brand text-primary-foreground px-4 py-2.5 text-[13.5px] max-w-[80%] shadow-[0_6px_20px_-10px_oklch(0.78_0.13_295_/_0.6)]">
                  {turn.text}
                </div>
                <div className="h-7 w-7 rounded-full bg-surface-2 hairline flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            ) : (
              <div key={turn.id} className="flex items-start gap-3">
                <div className="h-7 w-7 rounded-full gradient-brand flex items-center justify-center text-primary-foreground shrink-0">
                  <Sparkles className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  {turn.pending ? (
                    <div className="rounded-2xl rounded-tl-md hairline bg-surface-2/40 px-4 py-3 inline-flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "120ms" }} />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "240ms" }} />
                      <span className="ml-1 text-[11.5px] text-muted-foreground">Synthesizing…</span>
                    </div>
                  ) : turn.answer ? (
                    <div className="space-y-2.5">
                      <div className="rounded-2xl rounded-tl-md hairline-strong bg-surface-2/50 px-4 py-3 relative overflow-hidden">
                        <div className="absolute inset-x-0 top-0 h-px gradient-brand opacity-70" />
                        <p className="text-[13.5px] leading-relaxed text-foreground/95 whitespace-pre-wrap">{turn.answer.insight}</p>
                      </div>
                      {turn.answer.citations.length > 0 && (
                        <div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Citations · {turn.answer.citations.length}</div>
                          <div className="space-y-2">
                            {turn.answer.citations.map((c) => (
                              <div key={c.id} className="rounded-xl hairline bg-surface-2/30 p-2.5">
                                <div className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground">
                                  {c.type === "ticket" ? <FileText className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                                  <span className="uppercase tracking-[0.14em]">{c.type === "ticket" ? "Internal ticket" : "External source"}</span>
                                </div>
                                <div className="mt-0.5 text-[12px] font-medium">{c.label}</div>
                                {c.quote && <p className="mt-1 text-[11.5px] text-muted-foreground italic line-clamp-2">"{c.quote}"</p>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            ),
          )
        )}
      </div>

      {/* Composer */}
      <div className="mt-4 rounded-2xl hairline-strong bg-surface-2/60 backdrop-blur p-1.5 flex items-end gap-1.5 focus-within:ring-2 focus-within:ring-primary/40 transition">
        <textarea
          ref={inputRef}
          rows={1}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            e.currentTarget.style.height = "auto";
            e.currentTarget.style.height = Math.min(e.currentTarget.scrollHeight, 120) + "px";
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(query); }
          }}
          placeholder={empty ? 'Try "why is nickel allergy market-wide?"' : "Ask a follow-up… (Shift + Enter for newline)"}
          className="flex-1 resize-none bg-transparent px-3 py-2 text-[13.5px] outline-none placeholder:text-muted-foreground/70 max-h-[120px]"
        />
        <button
          onClick={() => submit(query)}
          disabled={!query.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl gradient-brand text-primary-foreground px-3 py-2 text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition shrink-0"
        >
          Ask <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="mt-2 text-[10.5px] text-muted-foreground">
        Conversation persists across pages · cites internal tickets + external sources · never customer-facing.
      </p>
    </div>
  );
}
