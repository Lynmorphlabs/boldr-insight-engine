import { useState } from "react";
import { Sparkles, FileText, Globe, ArrowRight, CornerDownLeft } from "lucide-react";
import { copilotResponses, type CopilotResponse } from "@/data";
import { cn } from "@/lib/utils";

export function CopilotPanel({
  variant = "dock",
  initialPrompt,
}: {
  variant?: "dock" | "drawer";
  initialPrompt?: string;
}) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<CopilotResponse | null>(null);
  const [loading, setLoading] = useState(false);

  function ask(prompt: string) {
    setQuery(prompt);
    setLoading(true);
    setResponse(null);
    setTimeout(() => {
      const match =
        copilotResponses.find((r) => r.prompt === prompt) ??
        copilotResponses.find((r) =>
          prompt.toLowerCase().includes(r.prompt.toLowerCase().split(" ")[2] ?? ""),
        ) ??
        copilotResponses[0];
      setResponse(match);
      setLoading(false);
    }, 450);
  }

  // Auto-ask if initial prompt provided
  useState(() => {
    if (initialPrompt) ask(initialPrompt);
  });

  const isDock = variant === "dock";

  return (
    <div className={cn("flex flex-col", isDock ? "" : "h-full")}>
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="h-8 w-8 rounded-xl gradient-brand flex items-center justify-center text-primary-foreground shadow-[0_8px_24px_-10px_oklch(0.78_0.13_295_/_0.6)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="leading-tight">
          <div className="text-[14px] font-semibold">Drill deeper with the Copilot</div>
          <div className="text-[11px] text-muted-foreground">
            Ask follow-ups across internal tickets and external sources — answers cite both.
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="rounded-2xl hairline-strong bg-surface-2/60 backdrop-blur p-1.5 flex items-center gap-1.5 focus-within:ring-2 focus-within:ring-primary/40 transition">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && query.trim() && ask(query.trim())}
          placeholder='Try "why is nickel allergy market-wide?"'
          className="flex-1 bg-transparent px-3 py-2 text-[13.5px] outline-none placeholder:text-muted-foreground/70"
        />
        <button
          onClick={() => query.trim() && ask(query.trim())}
          disabled={!query.trim()}
          className="inline-flex items-center gap-1.5 rounded-xl gradient-brand text-primary-foreground px-3 py-2 text-[12px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition"
        >
          Ask <CornerDownLeft className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Suggested prompts */}
      {!response && !loading && (
        <div className="mt-4">
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
            Try one of these
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {copilotResponses.map((r) => (
              <button
                key={r.prompt}
                onClick={() => ask(r.prompt)}
                className="group text-left rounded-xl hairline bg-surface-2/40 hover:bg-surface-2 px-3 py-2.5 transition flex items-center justify-between gap-3"
              >
                <span className="text-[12.5px]">{r.prompt}</span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-4 space-y-2">
          <div className="h-3 w-2/3 rounded bg-surface-2 animate-pulse" />
          <div className="h-3 w-full rounded bg-surface-2 animate-pulse" />
          <div className="h-3 w-4/5 rounded bg-surface-2 animate-pulse" />
        </div>
      )}

      {response && !loading && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-surface-2/50 hairline p-4">
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Query</div>
            <div className="mt-1 text-[13.5px]">{response.prompt}</div>
          </div>
          <div className="rounded-2xl bg-surface-2/60 hairline-strong p-4 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-px gradient-brand" />
            <div className="text-[10.5px] uppercase tracking-[0.16em] gradient-text inline-block">
              Insight
            </div>
            <p className="mt-2 text-[13.5px] leading-relaxed text-foreground/90">{response.insight}</p>
          </div>
          <div>
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground mb-2">
              Citations · {response.citations.length}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {response.citations.map((c) => (
                <div key={c.id} className="rounded-xl hairline bg-surface-2/40 p-3">
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {c.type === "ticket" ? <FileText className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                    <span className="uppercase tracking-[0.14em]">
                      {c.type === "ticket" ? "Internal ticket" : "External source"}
                    </span>
                  </div>
                  <div className="mt-1 text-[12.5px] font-medium">{c.label}</div>
                  {c.quote && (
                    <p className="mt-1.5 text-[12px] text-muted-foreground italic">"{c.quote}"</p>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setResponse(null);
              setQuery("");
            }}
            className="text-[12px] text-primary hover:underline"
          >
            ← Ask another question
          </button>
        </div>
      )}
    </div>
  );
}
