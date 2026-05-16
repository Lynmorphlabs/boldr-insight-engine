import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { kbEntries, kbSources, kbGrowth, themes, type KbStatus } from "@/data";
import { BookOpen, Check, FileText, Sparkles, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { triggerKbSyncAll } from "@/lib/kb-sync.functions";
import { Webhooks } from "@/lib/webhooks";
import {
  LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/knowledge")({
  head: () => ({
    meta: [
      { title: "Knowledge Base · Boldr CI Engine" },
      { name: "description", content: "A self-improving KB — every entry shows provenance, status, and source document. Growth over time and a queue of auto-drafted entries awaiting 1-click approval." },
      { property: "og:title", content: "Knowledge Base · Boldr CI Engine" },
      { property: "og:description", content: "Watch the KB grow from customer signal." },
    ],
  }),
  component: KnowledgePage,
});

function statusTone(s: KbStatus) {
  if (s === "Live") return "bg-success-soft text-foreground";
  if (s === "Pending approval") return "bg-warning-soft text-foreground";
  return "bg-ember/15 text-ember";
}

function KnowledgePage() {
  const [activeSource, setActiveSource] = useState<string>("All");
  const syncAll = useServerFn(triggerKbSyncAll);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const results = await syncAll();
      const entries = Object.entries(results);
      const failed = entries.filter(([, r]) => r && (r as { ok?: boolean }).ok === false);
      if (failed.length === 0) {
        const total = entries.reduce((sum, [, r]) => sum + ((r as { total?: number }).total ?? 0), 0);
        setSyncMsg({ tone: "ok", text: `Synced ${entries.length} sources · ${total} entries` });
      } else {
        setSyncMsg({ tone: "err", text: `${failed.length} of ${entries.length} sources failed` });
      }
    } catch (err) {
      setSyncMsg({ tone: "err", text: err instanceof Error ? err.message : "Sync failed" });
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    if (activeSource === "All") return kbEntries;
    return kbEntries.filter((k) => k.source === activeSource);
  }, [activeSource]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof kbEntries>();
    filtered.forEach((e) => {
      const arr = m.get(e.category) ?? [];
      arr.push(e); m.set(e.category, arr);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const pending = kbEntries.filter((k) => k.status !== "Live");
  const liveCount = kbEntries.filter((k) => k.status === "Live").length;

  return (
    <div className="px-5 md:px-8 py-7 boldr-stagger">
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <p className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Self-improving knowledge base</p>
          <h2 className="font-display text-[28px] tracking-tight mt-1">Knowledge Base</h2>
          <p className="text-[13.5px] text-muted-foreground mt-1 max-w-2xl">
            Every entry carries provenance. The KB grows from customer signal — gaps surfaced in Email Ops become draft entries here, queued for staff approval.
          </p>
        </div>
        <div className="flex items-center gap-3 text-[12px]">
          <Stat label="Live entries" value={liveCount} tone="text-success" />
          <Stat label="Pending approval" value={pending.length} tone="text-ember" />
          <Stat label="Source documents" value={kbSources.length} tone="text-foreground" />
        </div>
      </header>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-5">
        {/* Sources rail */}
        <aside className="space-y-1.5">
          <div className="flex items-center justify-between px-1 mb-1">
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-muted-foreground">Sources</div>
            <button
              onClick={handleSync}
              disabled={syncing}
              className={cn(
                "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.12em] transition-colors",
                "text-ember hover:bg-ember/10 disabled:opacity-60 disabled:cursor-not-allowed",
              )}
              title="Pull latest content from Google Drive"
            >
              <RefreshCw className={cn("h-3 w-3", syncing && "animate-spin")} />
              {syncing ? "Syncing…" : "Sync now"}
            </button>
          </div>
          {syncMsg && (
            <div
              className={cn(
                "mx-1 mb-1 rounded px-2 py-1.5 text-[11px] leading-snug",
                syncMsg.tone === "ok"
                  ? "bg-success-soft text-foreground"
                  : "bg-ember/15 text-ember",
              )}
            >
              {syncMsg.text}
            </div>
          )}
          <SourceButton label="All" count={kbEntries.length} active={activeSource === "All"} onClick={() => setActiveSource("All")} />
          {kbSources.map((s) => {
            const count = kbEntries.filter((e) => e.source === s.name).length;
            return (
              <SourceButton
                key={s.name}
                label={s.name}
                desc={s.description}
                count={count}
                active={activeSource === s.name}
                onClick={() => setActiveSource(s.name)}
              />
            );
          })}
        </aside>

        {/* Main */}
        <div className="space-y-6 min-w-0">
          {/* Growth + coverage */}
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr] gap-4">
            <div className="rounded-md hairline bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">KB entries over time</div>
                  <div className="text-[13px] mt-0.5">+12 entries since Nov '25 · <span className="text-success">7 from customer gaps</span></div>
                </div>
                <Sparkles className="h-4 w-4 text-ember" />
              </div>
              <div className="mt-3 h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={kbGrowth} margin={{ top: 10, right: 12, bottom: 0, left: -16 }}>
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={{ stroke: "var(--border)" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={36} />
                    <Tooltip
                      cursor={{ stroke: "var(--ember)", strokeWidth: 1, strokeDasharray: "3 3", opacity: 0.6 }}
                      contentStyle={{ background: "var(--card)", border: "1px solid var(--border-strong)", borderRadius: 10, fontSize: 12, boxShadow: "var(--shadow-soft)" }}
                      labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
                      itemStyle={{ color: "var(--ember)" }}
                    />
                    <Line type="monotone" dataKey="entries" stroke="var(--ember)" strokeWidth={2.2} dot={{ r: 3, fill: "var(--ember)", stroke: "var(--card)", strokeWidth: 1 }} activeDot={{ r: 6, fill: "var(--ember)", stroke: "var(--accent)", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-md hairline bg-card p-5">
              <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Coverage by theme</div>
              <div className="mt-3 space-y-2.5">
                {themes.map((t) => {
                  const coverage = t.verdict === "Boldr-Specific Gap" ? "gap" : "covered";
                  return (
                    <div key={t.name} className="flex items-center justify-between">
                      <div className="text-[13px]">{t.name}</div>
                      {coverage === "covered" ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-success">
                          <ShieldCheck className="h-3 w-3" /> Well covered
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-destructive">
                          <AlertTriangle className="h-3 w-3" /> KB gap
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Pending queue */}
          {pending.length > 0 && (
            <div className="rounded-md border-2 border-ember/40 bg-gradient-to-br from-ember-soft/60 to-card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-ember">Auto-drafted · pending approval</div>
                  <div className="text-[14px] font-display mt-0.5">{pending.length} entries waiting for 1-click approval</div>
                </div>
                <button className="text-[12px] text-ember hover:underline">Review all →</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pending.slice(0, 4).map((p) => (
                  <div key={p.id} className="rounded-md bg-card hairline p-3.5">
                    <div className="flex items-center justify-between">
                      <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em]", statusTone(p.status))}>
                        {p.status}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground">{p.category}</span>
                    </div>
                    <div className="mt-1.5 text-[13.5px] font-medium leading-snug">{p.question}</div>
                    {p.provenance && (
                      <div className="mt-1 text-[10.5px] uppercase tracking-[0.14em] text-ember">{p.provenance}</div>
                    )}
                    <p className="mt-1.5 text-[12px] text-muted-foreground line-clamp-2">{p.answer}</p>
                    <div className="mt-2.5 flex items-center gap-1.5">
                      <button className="inline-flex items-center gap-1 rounded bg-ember px-2 py-1 text-[11px] text-ember-foreground hover:opacity-90">
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button className="rounded hairline bg-card px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Entries grouped */}
          <div className="space-y-5">
            {grouped.map(([cat, items]) => (
              <section key={cat}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-display text-[16px]">{cat}</h3>
                  <span className="text-[11px] text-muted-foreground">{items.length} entries</span>
                </div>
                <div className="rounded-md hairline bg-card divide-y divide-border">
                  {items.map((e) => (
                    <article key={e.id} className="px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                            <FileText className="h-3 w-3" />
                            <span>{e.id}</span>
                            <span>·</span>
                            <span>{e.source}</span>
                          </div>
                          <div className="mt-1 text-[13.5px] font-medium">{e.question}</div>
                          <p className="mt-1 text-[12.5px] text-muted-foreground line-clamp-2">{e.answer}</p>
                          {e.provenance && (
                            <div className="mt-1.5 text-[10.5px] uppercase tracking-[0.14em] text-ember">{e.provenance}</div>
                          )}
                        </div>
                        <span className={cn("shrink-0 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em]", statusTone(e.status))}>
                          {e.status}
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md hairline bg-card px-3 py-2 text-center min-w-[110px]">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn("font-display text-[20px] tabular-nums leading-none mt-1", tone)}>{value}</div>
    </div>
  );
}

function SourceButton({ label, desc, count, active, onClick }: { label: string; desc?: string; count: number; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-md px-3 py-2.5 transition-colors",
        active ? "bg-card hairline" : "hover:bg-card/60",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className={cn("h-3.5 w-3.5", active ? "text-ember" : "text-muted-foreground")} />
          <span className="text-[13px] font-medium">{label}</span>
        </div>
        <span className="text-[11px] text-muted-foreground tabular-nums">{count}</span>
      </div>
      {desc && <p className="mt-0.5 ml-5.5 text-[11px] text-muted-foreground leading-snug">{desc}</p>}
    </button>
  );
}
