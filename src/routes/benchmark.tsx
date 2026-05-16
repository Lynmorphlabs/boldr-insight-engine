import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { themes, externalSources, type Verdict } from "@/data";
import { Globe, Quote, AlertOctagon, Compass, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { toast } from "sonner";
import { syncExternalSentiment, getExternalQuotes } from "@/lib/sentiment.functions";
import { THEMES, INTERNAL_TO_EXTERNAL, type ThemeName } from "@/lib/sentiment-themes";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/benchmark")({
  head: () => ({
    meta: [
      { title: "External Sentiment · Boldr CI Engine" },
      { name: "description", content: "Cached external sentiment sync across Reddit, WatchUSeek, Trustpilot — per-theme signal match vs internal tickets." },
    ],
  }),
  component: BenchmarkPage,
});

function verdictTone(v: Verdict) {
  return v === "Boldr-Specific Gap"
    ? "bg-ember text-ember-foreground"
    : "bg-success text-success-foreground";
}

type SignalMatch = "Boldr-Specific Gap" | "Market-Wide Concern" | "Emerging Opportunity";

function classifySignal(internal: number, external: number): { match: SignalMatch; action: string } {
  if (external >= 3 && external >= internal * 2.5 && internal <= 4) {
    return { match: "Market-Wide Concern", action: "Lead with content + paid search — demand exists market-wide; capture it before competitors." };
  }
  if (internal > 0 && external < Math.max(2, internal * 0.5)) {
    return { match: "Boldr-Specific Gap", action: "Fix the PDP / KB — customers ask Boldr about this but the wider market is silent. It's a Boldr clarity gap." };
  }
  if (external >= 2 && internal <= 2) {
    return { match: "Emerging Opportunity", action: "Pilot a small campaign — external chatter is rising before internal tickets. First-mover window." };
  }
  return { match: "Market-Wide Concern", action: "Monitor both signals; align messaging across PDP and social." };
}

function signalTone(m: SignalMatch) {
  if (m === "Boldr-Specific Gap") return "bg-ember text-ember-foreground";
  if (m === "Market-Wide Concern") return "bg-chart-4/20 text-chart-4 border border-chart-4/40";
  return "bg-success text-success-foreground";
}

function BenchmarkPage() {
  const queryClient = useQueryClient();
  const getQuotes = useServerFn(getExternalQuotes);
  const syncFn = useServerFn(syncExternalSentiment);

  const { data: quotesData } = useQuery({
    queryKey: ["external-quotes"],
    queryFn: () => getQuotes(),
    staleTime: 60_000,
  });
  const quotes = quotesData?.quotes ?? [];

  const syncMut = useMutation({
    mutationFn: () => syncFn(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["external-quotes"] });
      if (res.fallback) {
        toast.warning("Live sources unavailable — loaded seeded demo data.", {
          description: res.errors?.join(" · "),
        });
      } else {
        toast.success(`Sync complete — ${res.inserted} new quotes classified.`, {
          description: res.errors?.length ? `Partial: ${res.errors.join(" · ")}` : undefined,
        });
      }
    },
    onError: (e) => toast.error("Sync failed", { description: (e as Error).message }),
  });

  // External counts per theme bucket
  const externalCounts = useMemo(() => {
    const counts = new Map<ThemeName, number>();
    for (const t of THEMES) counts.set(t, 0);
    for (const q of quotes) {
      if (q.theme && counts.has(q.theme as ThemeName)) {
        counts.set(q.theme as ThemeName, (counts.get(q.theme as ThemeName) ?? 0) + 1);
      }
    }
    return counts;
  }, [quotes]);

  // Aggregate internal counts per external-theme bucket
  const internalCounts = useMemo(() => {
    const counts = new Map<ThemeName, number>();
    for (const t of THEMES) counts.set(t, 0);
    for (const theme of themes) {
      const bucket = INTERNAL_TO_EXTERNAL[theme.name];
      if (bucket) counts.set(bucket, (counts.get(bucket) ?? 0) + theme.internalCount);
    }
    // tickets we don't have internal data for stay at 0
    return counts;
  }, []);

  const signalRows = useMemo(() => {
    return THEMES.map((t) => {
      const internal = internalCounts.get(t) ?? 0;
      const external = externalCounts.get(t) ?? 0;
      const sig = classifySignal(internal, external);
      return { theme: t, internal, external, ...sig };
    });
  }, [internalCounts, externalCounts]);

  const chartData = themes.map((t) => ({
    name: t.name,
    Internal: t.internalCount,
    External: t.externalVolume,
  }));
  const [hovered, setHovered] = useState<"Internal" | "External" | null>(null);
  const opacityFor = (key: "Internal" | "External") => (hovered && hovered !== key ? 0.22 : 1);
  const [openTheme, setOpenTheme] = useState<ThemeName | null>(null);
  const themeQuotes = useMemo(
    () => (openTheme ? quotes.filter((q) => q.theme === openTheme) : []),
    [openTheme, quotes],
  );

  const lastSync = quotes[0]?.fetched_at ? new Date(quotes[0].fetched_at) : null;

  return (
    <div className="px-5 md:px-8 py-7 boldr-stagger max-w-[1280px]">
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Bonus · external sentiment benchmarking</p>
          <h2 className="font-display text-[28px] tracking-tight mt-1">Internal signal vs the open market</h2>
          <p className="text-[13.5px] text-muted-foreground mt-1 max-w-2xl">
            Cached sync from Reddit, WatchUSeek, and Trustpilot. Each theme carries a per-theme signal match and recommended action.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            size="sm"
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
            className="gap-2"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", syncMut.isPending && "animate-spin")} />
            {syncMut.isPending ? "Syncing…" : "Sync External Sentiment"}
          </Button>
          <span className="text-[10.5px] text-muted-foreground">
            {lastSync ? `Last sync · ${lastSync.toLocaleString()}` : "Not synced yet"} · {quotes.length} cached quotes
          </span>
        </div>
      </header>

      {/* External Signal Benchmark */}
      <section className="mt-7 rounded-md hairline bg-card p-5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-ember" />
            <h3 className="font-display text-[18px] tracking-tight">External Signal Benchmark</h3>
          </div>
          <span className="text-[11px] text-muted-foreground">{THEMES.length} themes · internal vs external · auto-classified</span>
        </div>
        <div className="space-y-2">
          {signalRows.map((row) => (
            <button
              key={row.theme}
              type="button"
              onClick={() => setOpenTheme(row.theme)}
              className="w-full text-left grid grid-cols-1 md:grid-cols-[1.4fr_auto_auto_auto_1.6fr] gap-3 md:gap-4 items-center rounded-md hairline bg-surface-2/30 px-4 py-3 hover:bg-surface-2/60 hover:hairline-strong transition-colors cursor-pointer"
            >
              <div className="font-display text-[14.5px] tracking-tight">{row.theme}</div>
              <div className="text-[11.5px] text-muted-foreground">
                Internal · <span className="text-foreground font-medium tabular-nums">{row.internal}</span>
              </div>
              <div className="text-[11.5px] text-muted-foreground">
                External · <span className="text-foreground font-medium tabular-nums">{row.external}</span>
              </div>
              <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium tracking-tight justify-self-start", signalTone(row.match))}>
                {row.match === "Boldr-Specific Gap" ? <AlertOctagon className="h-3 w-3" />
                  : row.match === "Emerging Opportunity" ? <TrendingUp className="h-3 w-3" />
                  : <Compass className="h-3 w-3" />}
                {row.match}
              </span>
              <p className="text-[12px] text-foreground/80 leading-relaxed">{row.action}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Drill-down panel */}
      <Sheet open={openTheme !== null} onOpenChange={(o) => !o && setOpenTheme(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="font-display tracking-tight">{openTheme}</SheetTitle>
            <SheetDescription>
              {themeQuotes.length} cached quote{themeQuotes.length === 1 ? "" : "s"} behind this signal · sorted by relevance
            </SheetDescription>
          </SheetHeader>
          <div className="mt-5 space-y-3">
            {themeQuotes.length === 0 ? (
              <div className="rounded-md hairline bg-surface-2/40 p-5 text-center text-[12.5px] text-muted-foreground">
                No cached quotes mapped to this theme yet. Run a sync to populate.
              </div>
            ) : (
              [...themeQuotes]
                .sort((a, b) => (b.relevance_score ?? 0) - (a.relevance_score ?? 0))
                .map((q) => (
                  <article key={q.id} className="rounded-md hairline bg-card p-4">
                    <div className="flex items-center justify-between gap-2 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                      <span className="text-ember">{q.source}</span>
                      <div className="flex items-center gap-2">
                        {q.sentiment && (
                          <span className={cn(
                            "rounded px-1.5 py-0.5 normal-case tracking-normal text-[10.5px]",
                            q.sentiment === "negative" ? "bg-ember-soft/40 text-ember"
                              : q.sentiment === "positive" ? "bg-success/20 text-success"
                              : "bg-surface-2 text-muted-foreground",
                          )}>{q.sentiment}</span>
                        )}
                        <span className="tabular-nums text-foreground/80 normal-case tracking-normal">
                          rel · {(q.relevance_score ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <p className="mt-2 text-[12.5px] text-foreground/90 leading-relaxed">"{q.text}"</p>
                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                      <span><span className="text-foreground font-medium">{q.author ?? "anon"}</span>{q.theme && <> · {q.theme}</>}</span>
                      {q.url && (
                        <a
                          href={q.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline truncate max-w-[55%]"
                        >
                          {q.url.replace(/^https?:\/\//, "").slice(0, 40)}…
                        </a>
                      )}
                    </div>
                  </article>
                ))
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sources */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {externalSources.map((s) => (
          <article key={s.id} className="rounded-md hairline bg-card p-4">
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-ember">
              <Globe className="h-3 w-3" /> Source · {externalSources.indexOf(s) + 1}
            </div>
            <h3 className="mt-1 text-[14px] font-display tracking-tight leading-snug">{s.name}</h3>
            <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{s.justification}</p>
          </article>
        ))}
      </section>

      {/* Comparison chart */}
      <section className="mt-6 rounded-md hairline bg-card p-5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-display text-[18px] tracking-tight">Internal tickets vs external volume</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">Per theme — count of internal tickets against count of external mentions across the 3 sources.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]" onMouseLeave={() => setHovered(null)}>
            {(["Internal", "External"] as const).map((key) => {
              const isActive = hovered === key;
              const isDimmed = hovered !== null && !isActive;
              return (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => setHovered(key)}
                  onFocus={() => setHovered(key)}
                  onBlur={() => setHovered(null)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 transition-all duration-150 cursor-pointer",
                    isActive
                      ? "bg-ember-soft/30 hairline-strong text-foreground -translate-y-[1px]"
                      : isDimmed
                        ? "text-muted-foreground/50 hover:text-foreground"
                        : "text-muted-foreground hover:bg-surface-2/50",
                  )}
                >
                  <span className={cn("h-2 w-2 rounded-sm", key === "Internal" ? "bg-chart-4" : "bg-ember")} />
                  {key}
                </button>
              );
            })}
          </div>
        </div>
        <div className="mt-3 h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 14, bottom: 0, left: -10 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "var(--ember-soft)", opacity: 0.22 }}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border-strong)", borderRadius: 10, fontSize: 12 }}
              />
              <Bar dataKey="Internal" fill="var(--chart-4)" fillOpacity={opacityFor("Internal")} radius={[3, 3, 0, 0]} barSize={22} isAnimationActive={false} />
              <Bar dataKey="External" fill="var(--ember)" fillOpacity={opacityFor("External")} radius={[3, 3, 0, 0]} barSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Per-theme verdict cards (existing) */}
      <section className="mt-7">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-[18px] tracking-tight">Per-theme verdict (internal taxonomy)</h3>
          <span className="text-[11px] text-muted-foreground">5 themes · 2 verdict classes</span>
        </div>
        <div className="space-y-3">
          {themes.map((t) => (
            <article key={t.name} className="rounded-md hairline bg-card overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-[1.1fr_1.4fr_auto] gap-4 p-4 items-start">
                <div>
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Theme</div>
                  <div className="mt-1 font-display text-[18px] tracking-tight">{t.name}</div>
                  <div className="mt-2 flex items-center gap-3 text-[11.5px] text-muted-foreground">
                    <span><span className="text-foreground font-medium tabular-nums">{t.internalCount}</span> internal</span>
                    <span>·</span>
                    <span><span className="text-foreground font-medium tabular-nums">{t.externalVolume}</span> external</span>
                    <span>·</span>
                    <span className="capitalize">{t.externalSentiment} sentiment</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Recommended action</div>
                  <p className="mt-1 text-[13px] text-foreground/90 leading-relaxed">{t.recommendedAction}</p>
                  <p className="mt-1.5 text-[11.5px] text-muted-foreground italic">{t.briefNote}</p>
                </div>
                <div className="md:text-right">
                  <span className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-medium tracking-tight", verdictTone(t.verdict))}>
                    {t.verdict === "Boldr-Specific Gap" ? <AlertOctagon className="h-3.5 w-3.5" /> : <Compass className="h-3.5 w-3.5" />}
                    {t.verdict}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Live quotes */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-[18px] tracking-tight">External quotes (cached)</h3>
          <span className="text-[11px] text-muted-foreground">{quotes.length} quotes · sync to refresh</span>
        </div>
        {quotes.length === 0 ? (
          <div className="rounded-md hairline bg-card p-6 text-center text-[13px] text-muted-foreground">
            No quotes cached yet. Click <span className="text-foreground font-medium">Sync External Sentiment</span> to fetch.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {quotes.slice(0, 24).map((q) => (
              <article key={q.id} className="rounded-md hairline bg-card p-4">
                <Quote className="h-3.5 w-3.5 text-primary" />
                <p className="mt-2 text-[12.5px] text-foreground/90 leading-relaxed">"{q.text}"</p>
                <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between gap-2">
                  <span><span className="text-foreground font-medium">{q.author}</span> · {q.source}</span>
                  <span className="text-right truncate max-w-[50%]">{q.theme}</span>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
