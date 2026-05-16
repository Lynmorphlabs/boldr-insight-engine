import { createFileRoute } from "@tanstack/react-router";
import { tickets, themes, monthlyBrief, type Persona } from "@/data";
import { ArrowDown, ArrowRight, ArrowUp, Download, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { PersonaChip } from "./inbox";

export const Route = createFileRoute("/intelligence")({
  head: () => ({
    meta: [
      { title: "Marketing Intelligence · Boldr CI Engine" },
      { name: "description", content: "Weekly theme clusters and the Monthly Marketing Brief — what customers are asking that is not on your product pages, tied to personas and recommended actions." },
      { property: "og:title", content: "Marketing Intelligence · Boldr CI Engine" },
      { property: "og:description", content: "Theme clusters, persona distribution, exportable monthly brief." },
    ],
  }),
  component: IntelligencePage,
});

const FIVE_PERSONAS: Persona[] = [
  "Health-Conscious Buyer",
  "Gifter",
  "Enthusiast / Collector",
  "Active / Outdoor Buyer",
  "Sustainability Advocate",
];

function IntelligencePage() {
  const personaDist = FIVE_PERSONAS.map((p) => ({
    persona: p,
    count: tickets.filter((t) => t.persona === p).length,
  }));

  return (
    <div className="px-5 md:px-8 py-7 boldr-stagger max-w-[1280px]">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Marketing intelligence · {monthlyBrief.month}</p>
          <h2 className="font-display text-[28px] tracking-tight mt-1">What customers are telling us</h2>
          <p className="text-[13.5px] text-muted-foreground mt-1 max-w-2xl">
            Weekly theme clusters from novel questions, persona distribution, and the headline output — the Monthly Marketing Brief.
          </p>
        </div>
      </header>

      <section className="mt-6">
        <SectionHead title="Theme clusters · this month" subtitle="Novel question groupings" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {themes.map((t) => (
            <article key={t.name} className="rounded-md hairline bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="text-[13.5px] font-medium leading-snug">{t.name}</div>
                <TrendArrow trend={t.trend} pct={t.trendPct} />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-display text-[26px] tabular-nums leading-none">{t.internalCount}</span>
                <span className="text-[11px] text-muted-foreground">tickets</span>
              </div>
              <div className="mt-3 pt-3 border-t border-border">
                <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Dominant persona</div>
                <div className="mt-1"><PersonaChip persona={t.dominantPersona} /></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className="mt-7 grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-5">
        <section className="rounded-md hairline bg-card p-5">
          <SectionHead title="Persona distribution" subtitle="Null tickets excluded — 5 personas only" small />
          <div className="mt-3 h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personaDist} layout="vertical" margin={{ top: 4, right: 14, bottom: 4, left: 0 }}>
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="persona" type="category" width={150} tick={{ fontSize: 11, fill: "var(--foreground)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: "var(--ember-soft)", opacity: 0.22 }}
                  contentStyle={{ background: "var(--card)", border: "1px solid var(--border-strong)", borderRadius: 10, fontSize: 12, boxShadow: "var(--shadow-soft)" }}
                  labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
                  itemStyle={{ color: "var(--ember)" }}
                />
                <Bar dataKey="count" fill="var(--ember)" radius={[0, 4, 4, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Of {tickets.length} tickets, {tickets.filter((t) => t.persona === "—").length} are persona "—" (transactional/ops) and excluded from marketing analytics.
          </p>
        </section>

        <section className="rounded-md border-2 border-ember/40 bg-gradient-to-br from-ember-soft/70 via-card to-card p-6 shadow-[0_18px_60px_-32px_oklch(0.62_0.165_45_/_0.5)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.16em] text-ember">
                <Sparkles className="h-3 w-3" /> Monthly marketing brief · {monthlyBrief.month}
              </div>
              <h3 className="mt-1 font-display text-[22px] tracking-tight leading-tight max-w-[34ch]">
                {monthlyBrief.title}
              </h3>
            </div>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] text-primary-foreground hover:opacity-90">
              <Download className="h-3 w-3" /> Export brief
            </button>
          </div>
          <p className="mt-3 text-[13px] text-muted-foreground leading-relaxed">{monthlyBrief.intro}</p>

          <div className="mt-4 divide-y divide-border">
            {monthlyBrief.items.map((item) => (
              <div key={item.theme} className="py-3.5">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="text-[14px] font-medium">{item.theme}</div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.personas.map((p) => <PersonaChip key={p} persona={p} />)}
                  </div>
                </div>
                <div className="mt-1.5 grid sm:grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12.5px]">
                  <span className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground pt-0.5">Gap</span>
                  <span>{item.gap}</span>
                  <span className="text-[10.5px] uppercase tracking-[0.14em] text-ember pt-0.5">Action</span>
                  <span className="text-foreground/90">{item.action}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHead({ title, subtitle, small }: { title: string; subtitle?: string; small?: boolean }) {
  return (
    <div className={cn("mb-3", small && "mb-2")}>
      <div className="flex items-baseline gap-2">
        <h3 className={cn("font-display tracking-tight", small ? "text-[15px]" : "text-[18px]")}>{title}</h3>
        {subtitle && <span className="text-[11px] text-muted-foreground">· {subtitle}</span>}
      </div>
    </div>
  );
}

function TrendArrow({ trend, pct }: { trend: "up" | "down" | "flat"; pct: number }) {
  if (trend === "flat") return <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1"><ArrowRight className="h-3 w-3" />flat</span>;
  if (trend === "down") return <span className="text-[11px] text-success inline-flex items-center gap-1"><ArrowDown className="h-3 w-3" />{pct}%</span>;
  return (
    <span className="text-[11px] text-ember inline-flex items-center gap-1 font-medium">
      <ArrowUp className="h-3 w-3" />+{pct}%
    </span>
  );
}
