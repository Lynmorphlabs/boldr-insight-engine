import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { themes, externalSources, type Verdict } from "@/data";
import { Globe, Quote, AlertOctagon, Compass, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopilot } from "@/components/copilot-context";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/benchmark")({
  head: () => ({
    meta: [
      { title: "External Sentiment · Boldr CI Engine" },
      { name: "description", content: "Bonus: 3 external sources cross-validate 5 themes. Per-theme verdict — Boldr-Specific Gap vs Market-Wide Opportunity — with recommended action." },
      { property: "og:title", content: "External Sentiment Benchmarking · Boldr" },
      { property: "og:description", content: "Internal tickets vs external mentions with verdict badges." },
    ],
  }),
  component: BenchmarkPage,
});

function verdictTone(v: Verdict) {
  return v === "Boldr-Specific Gap"
    ? "bg-ember text-ember-foreground"
    : "bg-success text-success-foreground";
}

function BenchmarkPage() {
  const chartData = themes.map((t) => ({
    name: t.name,
    Internal: t.internalCount,
    External: t.externalVolume,
  }));
  const [hovered, setHovered] = useState<"Internal" | "External" | null>(null);
  const opacityFor = (key: "Internal" | "External") => (hovered && hovered !== key ? 0.22 : 1);

  return (
    <div className="px-5 md:px-8 py-7 boldr-stagger max-w-[1280px]">
      <header>
        <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Bonus · external sentiment benchmarking</p>
        <h2 className="font-display text-[28px] tracking-tight mt-1">Internal signal vs the open market</h2>
        <p className="text-[13.5px] text-muted-foreground mt-1 max-w-2xl">
          5 themes from this month's ticket flow, cross-validated against 3 external sources. Each theme carries a per-theme verdict and a recommended action.
        </p>
      </header>

      {/* Sources */}
      <section className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
        {externalSources.map((s) => (
          <article key={s.id} className="rounded-md hairline bg-card p-4">
            <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-ember">
              <Globe className="h-3 w-3" /> Source · {externalSources.indexOf(s) + 1}
            </div>
            <h3 className="mt-1 text-[14px] font-display tracking-tight leading-snug">{s.name}</h3>
            <p className="mt-2 text-[12px] text-muted-foreground leading-relaxed">{s.justification}</p>
            <div className="mt-3 pt-3 border-t border-border text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              {s.quotes.length} attributed mentions
            </div>
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
                  <span
                    className={cn(
                      "h-2 w-2 rounded-sm transition-transform",
                      key === "Internal" ? "bg-chart-4" : "bg-ember",
                      isActive && "scale-125 shadow-[0_0_0_3px_oklch(0.72_0.19_45_/_0.25)]",
                    )}
                  />
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
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border-strong)", borderRadius: 10, fontSize: 12, boxShadow: "var(--shadow-soft)" }}
                labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
                itemStyle={{ color: "var(--muted-foreground)" }}
              />
              <Bar dataKey="Internal" fill="var(--chart-4)" fillOpacity={opacityFor("Internal")} radius={[3, 3, 0, 0]} barSize={22} isAnimationActive={false} />
              <Bar dataKey="External" fill="var(--ember)" fillOpacity={opacityFor("External")} radius={[3, 3, 0, 0]} barSize={22} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Per-theme verdict cards */}
      <section className="mt-7">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-[18px] tracking-tight">Per-theme verdict</h3>
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

      {/* Quotes */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="font-display text-[18px] tracking-tight">Attributed external quotes</h3>
          <span className="text-[11px] text-muted-foreground">curated · seeded for demo</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {externalSources.flatMap((s) => s.quotes.map((q) => ({ src: s, q }))).map(({ src, q }, i) => (
            <article key={i} className="rounded-md hairline bg-card p-4">
              <Quote className="h-3.5 w-3.5 text-primary" />
              <p className="mt-2 text-[12.5px] text-foreground/90 leading-relaxed">"{q.text}"</p>
              <div className="mt-3 pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between gap-2">
                <span><span className="text-foreground font-medium">{q.author}</span> · {q.source}</span>
                <span>{q.theme}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

