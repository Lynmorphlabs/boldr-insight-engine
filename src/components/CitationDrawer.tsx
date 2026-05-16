import { X, FileText, Globe, Mail, MessageSquare, Tag, AlertTriangle, CheckCircle2, Clock, ExternalLink, Quote, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCopilot, getCitationKey, type CitationRef } from "./copilot-context";
import { tickets, externalSources, formatDate, type Ticket, type ExternalQuote, type ExternalSource } from "@/data";

function findTicket(id: string): Ticket | undefined {
  return tickets.find((t) => t.id === id);
}

function findExternal(id: string): { quote: ExternalQuote; source: ExternalSource } | undefined {
  for (const s of externalSources) {
    const q = s.quotes.find((q) => q.author.includes(id) || String(s.id) === id);
    if (q) return { quote: q, source: s };
  }
  return undefined;
}

const statusTone: Record<Ticket["status"], string> = {
  open: "bg-primary/15 text-primary",
  pending_reply: "bg-ember/15 text-ember",
  escalated: "bg-destructive/15 text-destructive",
  resolved: "bg-success/15 text-success",
};

const sentimentTone: Record<ExternalQuote["sentiment"], string> = {
  positive: "bg-success/15 text-success",
  neutral: "bg-muted text-muted-foreground",
  negative: "bg-destructive/15 text-destructive",
};

export function CitationDrawer() {
  const {
    citationTabs,
    activeCitation,
    activeCitationId,
    setActiveCitation,
    closeCitationTab,
    closeAllCitations,
  } = useCopilot();
  const open = citationTabs.length > 0;

  return (
    <>
      {/* Backdrop above copilot */}
      <div
        onClick={closeAllCitations}
        className={cn(
          "fixed inset-0 z-[55] bg-background/50 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />
      {/* Panel */}
      <aside
        aria-hidden={!open}
        className={cn(
          "fixed top-0 right-0 z-[60] h-screen w-full sm:w-[520px] bg-surface/95 backdrop-blur-xl border-l border-border shadow-[0_0_60px_-10px_oklch(0.1_0_0_/_0.7)] flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="absolute inset-y-0 left-0 w-px gradient-brand opacity-70 pointer-events-none" />

        <header className="flex items-center justify-between px-5 h-14 border-b border-border shrink-0">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            <Layers className="h-3.5 w-3.5 text-primary" />
            Evidence · {citationTabs.length} open
          </div>
          <button
            onClick={closeAllCitations}
            className="inline-flex items-center gap-1.5 rounded-full hairline bg-surface-2/50 px-3 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-surface-2 transition"
            aria-label="Close all citations"
          >
            <X className="h-3 w-3" /> Close all
          </button>
        </header>

        {/* Tab strip */}
        <div className="px-3 pt-2 pb-1 border-b border-border shrink-0 overflow-x-auto">
          <div className="flex items-center gap-1.5 min-w-min">
            {citationTabs.map((c) => {
              const key = getCitationKey(c);
              const isActive = key === activeCitationId;
              return (
                <div
                  key={key}
                  className={cn(
                    "group inline-flex items-center gap-1.5 rounded-t-lg px-2.5 py-1.5 text-[11.5px] border-b-2 transition cursor-pointer max-w-[200px]",
                    isActive
                      ? "bg-surface-2/70 border-primary text-foreground hairline-strong border-b-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:bg-surface-2/40",
                  )}
                  onClick={() => setActiveCitation(key)}
                >
                  {c.type === "ticket" ? <FileText className="h-3 w-3 shrink-0" /> : <Globe className="h-3 w-3 shrink-0" />}
                  <span className="truncate font-medium">{c.id}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); closeCitationTab(key); }}
                    className="p-0.5 rounded hover:bg-background/60 text-muted-foreground hover:text-foreground transition"
                    aria-label={`Close ${c.id}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active panel header */}
        {activeCitation && (
          <div className="flex items-center gap-2.5 px-5 py-3 border-b border-border shrink-0">
            <div className="h-8 w-8 rounded-lg bg-surface-2 hairline flex items-center justify-center text-primary shrink-0">
              {activeCitation.type === "ticket" ? <FileText className="h-3.5 w-3.5" /> : <Globe className="h-3.5 w-3.5" />}
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                {activeCitation.type === "ticket" ? "Internal ticket" : "External source"}
              </div>
              <div className="text-[13px] font-semibold truncate">{activeCitation.id}</div>
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {activeCitation ? <ActivePanel citation={activeCitation} /> : null}
        </div>
      </aside>
    </>
  );
}

function ActivePanel({ citation }: { citation: CitationRef }) {
  if (citation.type === "ticket") return <TicketDetail id={citation.id} fallback={citation.label} />;
  return <ExternalDetail id={citation.id} fallback={citation.label} quote={citation.quote} />;
}

function TicketDetail({ id, fallback }: { id: string; fallback: string }) {
  const t = findTicket(id);
  if (!t) {
    return (
      <div className="rounded-xl hairline bg-surface-2/40 p-4 text-[13px] text-muted-foreground">
        {fallback} <span className="text-foreground/70">— ticket not found in current view.</span>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="rounded-2xl hairline-strong bg-surface-2/40 p-4">
        <div className="flex items-center gap-2 flex-wrap text-[10.5px]">
          <span className={cn("inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-medium uppercase tracking-[0.14em]", statusTone[t.status])}>
            {t.status === "resolved" ? <CheckCircle2 className="h-3 w-3" /> : t.status === "escalated" ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
            {t.status.replace("_", " ")}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-surface text-muted-foreground uppercase tracking-[0.14em]">
            <Tag className="h-3 w-3" /> {t.lane.replace(/_/g, " ")}
          </span>
          {t.escalation && (
            <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-destructive/15 text-destructive uppercase tracking-[0.14em]">
              <AlertTriangle className="h-3 w-3" /> escalation
            </span>
          )}
        </div>
        <h3 className="mt-2.5 font-display text-[18px] tracking-tight">{t.subject}</h3>
        <p className="mt-2 text-[13px] text-foreground/85 leading-relaxed">{t.body}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Meta label="Customer" value={t.customer} />
        <Meta label="Channel" value={t.channel} icon={<MessageSquare className="h-3 w-3" />} />
        <Meta label="Date" value={formatDate(t.date)} />
        <Meta label="Persona" value={t.persona} />
        <Meta label="Email" value={t.email} icon={<Mail className="h-3 w-3" />} className="col-span-2" />
        {t.orderId && <Meta label="Order" value={t.orderId} className="col-span-2" />}
      </div>

      <div className="rounded-xl hairline bg-surface-2/30 p-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Intent · confidence</div>
        <div className="mt-1 flex items-center justify-between gap-3">
          <div className="text-[13px] font-medium">{t.intent}</div>
          <div className="text-[12px] font-mono text-primary">{(t.confidence * 100).toFixed(0)}%</div>
        </div>
      </div>

      {t.draftReply && (
        <div className="rounded-xl hairline bg-surface-2/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">AI draft reply</div>
          <pre className="text-[12.5px] text-foreground/85 whitespace-pre-wrap font-sans leading-relaxed">{t.draftReply}</pre>
        </div>
      )}

      {t.autoDraftKb && (
        <div className="rounded-xl hairline bg-surface-2/30 p-3">
          <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Auto-drafted KB entry · {t.autoDraftKb.category}</div>
          <div className="text-[12.5px] font-medium">{t.autoDraftKb.question}</div>
          <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{t.autoDraftKb.answer}</p>
        </div>
      )}
    </div>
  );
}

function ExternalDetail({ id, fallback, quote }: { id: string; fallback: string; quote?: string }) {
  const found = findExternal(id);
  if (!found) {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl hairline-strong bg-surface-2/40 p-4">
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-muted-foreground">{fallback}</div>
          {quote && (
            <blockquote className="mt-2 text-[13px] text-foreground/85 italic leading-relaxed">
              <Quote className="h-3.5 w-3.5 text-primary inline mr-1 -translate-y-0.5" />
              {quote}
            </blockquote>
          )}
        </div>
      </div>
    );
  }
  const { quote: q, source } = found;
  return (
    <div className="space-y-4">
      <div className="rounded-2xl hairline-strong bg-surface-2/40 p-4">
        <div className="flex items-center gap-2 flex-wrap text-[10.5px]">
          <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 font-medium uppercase tracking-[0.14em]", sentimentTone[q.sentiment])}>
            {q.sentiment}
          </span>
          <span className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 bg-surface text-muted-foreground uppercase tracking-[0.14em]">
            <Tag className="h-3 w-3" /> {q.theme}
          </span>
        </div>
        <blockquote className="mt-3 text-[14px] text-foreground/90 italic leading-relaxed">
          <Quote className="h-4 w-4 text-primary inline mr-1.5 -translate-y-0.5" />
          {q.text}
        </blockquote>
        <div className="mt-3 text-[11.5px] text-muted-foreground">
          — <span className="text-foreground/80 font-medium">{q.author}</span> · {q.source} · {formatDate(q.date)}
        </div>
      </div>

      <div className="rounded-xl hairline bg-surface-2/30 p-3">
        <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
          <ExternalLink className="h-3 w-3" /> Source group
        </div>
        <div className="mt-1 text-[13px] font-medium">{source.name}</div>
        <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">{source.justification}</p>
      </div>
    </div>
  );
}

function Meta({ label, value, icon, className }: { label: string; value: string; icon?: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-xl hairline bg-surface-2/30 p-2.5", className)}>
      <div className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">{icon} {label}</div>
      <div className="mt-0.5 text-[12.5px] text-foreground/90 truncate">{value}</div>
    </div>
  );
}
