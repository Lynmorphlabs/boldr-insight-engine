import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  tickets,
  kbEntries,
  formatDate,
  type Ticket,
  type Lane,
  type Persona,
  type TicketStatus,
} from "@/data";
import {
  AlertTriangle,
  Check,
  Edit3,
  FileWarning,
  Sparkles,
  ShieldCheck,
  Mail,
  MessageSquare,
  Send,
  X,
  PlusCircle,
  Inbox as InboxIcon,
  BookPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// "Routed to" only makes sense when it points OUTSIDE the CS desk
// (e.g. service centre, Shopify ops, B2B). The user of this app IS cs@boldr.co.
const INTERNAL_CS_ROUTES = new Set(["cs@boldr.co", "CS", "cs"]);
function isExternalRoute(routedTo?: string) {
  return !!routedTo && !INTERNAL_CS_ROUTES.has(routedTo);
}

export const Route = createFileRoute("/inbox")({
  head: () => ({
    meta: [
      { title: "Email Ops · Boldr CI Engine" },
      { name: "description", content: "Triage 70 customer tickets with AI-extracted intent, lane, persona, KB match, and human-approved drafts. Knowledge gaps auto-draft a new KB entry for 1-click approval." },
      { property: "og:title", content: "Email Ops · Boldr CI Engine" },
      { property: "og:description", content: "AI triage with human-approved replies — never a customer-facing chatbot." },
    ],
  }),
  component: InboxPage,
});

const LANES: { value: Lane | "all"; label: string }[] = [
  { value: "all", label: "All lanes" },
  { value: "knowledge_gap", label: "Knowledge gap" },
  { value: "servicing", label: "Servicing" },
  { value: "engraving", label: "Engraving" },
  { value: "materials_safety", label: "Materials & safety" },
  { value: "strap_compatibility", label: "Strap compatibility" },
  { value: "product_general", label: "Product general" },
  { value: "order_status", label: "Order status" },
];

const PERSONAS: (Persona | "all")[] = [
  "all",
  "Health-Conscious Buyer",
  "Gifter",
  "Enthusiast / Collector",
  "Active / Outdoor Buyer",
  "Sustainability Advocate",
  "—",
];

const STATUSES: { value: TicketStatus | "all"; label: string; tone: string }[] = [
  { value: "all", label: "Any status", tone: "" },
  { value: "open", label: "Open", tone: "bg-warning-soft text-foreground" },
  { value: "pending_reply", label: "Pending reply", tone: "bg-ember-soft text-foreground" },
  { value: "resolved", label: "Resolved", tone: "bg-success-soft text-foreground" },
  { value: "escalated", label: "Escalated", tone: "bg-destructive-soft text-foreground" },
];

function laneLabel(l: Lane) {
  return LANES.find((x) => x.value === l)?.label ?? l;
}

function statusTone(s: TicketStatus) {
  return STATUSES.find((x) => x.value === s)?.tone ?? "";
}

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === "email") return <Mail className="h-3 w-3" />;
  return <MessageSquare className="h-3 w-3" />;
}

function InboxPage() {
  const [lane, setLane] = useState<Lane | "all">("all");
  const [persona, setPersona] = useState<Persona | "all">("all");
  const [status, setStatus] = useState<TicketStatus | "all">("all");
  const [kbOnly, setKbOnly] = useState<"all" | "yes" | "no">("all");
  const [escOnly, setEscOnly] = useState(false);

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (lane !== "all" && t.lane !== lane) return false;
      if (persona !== "all" && t.persona !== persona) return false;
      if (status !== "all" && t.status !== status) return false;
      if (kbOnly === "yes" && !t.answeredByKb) return false;
      if (kbOnly === "no" && t.answeredByKb) return false;
      if (escOnly && !t.escalation) return false;
      return true;
    });
  }, [lane, persona, status, kbOnly, escOnly]);

  const [selectedId, setSelectedId] = useState(filtered[0]?.id ?? tickets[0].id);
  const selected = tickets.find((t) => t.id === selectedId) ?? filtered[0] ?? tickets[0];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)_400px] h-[calc(100vh-3.5rem)] min-h-0">
      {/* LEFT — list */}
      <section className="border-r border-border flex flex-col min-h-0 bg-surface">
        <div className="px-4 pt-4 pb-3 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <InboxIcon className="h-3.5 w-3.5 text-ember" />
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Inbox</span>
            </div>
            <span className="text-[11px] text-muted-foreground">{filtered.length} / {tickets.length}</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <FilterSelect value={lane} onChange={(v) => setLane(v as Lane | "all")} options={LANES.map((l) => ({ value: l.value, label: l.label }))} />
            <FilterSelect value={persona} onChange={(v) => setPersona(v as Persona | "all")} options={PERSONAS.map((p) => ({ value: p, label: p === "all" ? "All personas" : p }))} />
            <FilterSelect value={status} onChange={(v) => setStatus(v as TicketStatus | "all")} options={STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
            <FilterSelect value={kbOnly} onChange={(v) => setKbOnly(v as "all" | "yes" | "no")} options={[
              { value: "all", label: "KB · any" },
              { value: "yes", label: "Answered by KB" },
              { value: "no", label: "Not in KB" },
            ]} />
          </div>
          <button
            onClick={() => setEscOnly((v) => !v)}
            className={cn(
              "w-full inline-flex items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] hairline transition-colors",
              escOnly ? "bg-destructive-soft text-foreground" : "bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <AlertTriangle className="h-3 w-3" /> Escalation flagged only
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={cn(
                "relative w-full text-left px-4 py-3 border-b border-border/70 transition-colors",
                t.id === selected.id
                  ? "bg-ember/10 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-ember"
                  : "hover:bg-card/60",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <ChannelIcon channel={t.channel} />
                  <span>{t.id}</span>
                  <span>·</span>
                  <span>{formatDate(t.date)}</span>
                </div>
                <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-[0.1em]", statusTone(t.status))}>
                  {t.isKnowledgeGap && (
                    <span
                      title="Needs your answer"
                      className="h-1.5 w-1.5 rounded-full bg-ember inline-block"
                    />
                  )}
                  {t.status.replace("_", " ")}
                </span>
              </div>
              <div className="mt-1.5 text-[13.5px] font-medium leading-snug line-clamp-1">{t.subject}</div>
              <div className="mt-0.5 text-[12px] text-muted-foreground line-clamp-2">{t.body}</div>
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <Chip>{laneLabel(t.lane)}</Chip>
                <PersonaChip persona={t.persona} />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* CENTRE — ticket detail */}
      <section className="border-r border-border min-h-0 overflow-y-auto">
        <TicketDetail ticket={selected} />
      </section>

      {/* RIGHT — AI panel */}
      <aside className="bg-surface min-h-0 overflow-y-auto">
        <AiPanel ticket={selected} />
      </aside>
    </div>
  );
}

function FilterSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="text-[12px] rounded-md hairline bg-card px-2 py-1.5 outline-none focus:ring-2 focus:ring-ember/30"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded bg-surface-2 px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
      {children}
    </span>
  );
}

export function PersonaChip({ persona, large = false }: { persona: Persona; large?: boolean }) {
  const isNull = persona === "—";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded uppercase tracking-[0.1em]",
        large ? "px-2 py-1 text-[11px]" : "px-1.5 py-0.5 text-[10.5px]",
        isNull
          ? "bg-surface-2 text-muted-foreground"
          : "bg-ember/10 text-ember",
      )}
    >
      {persona}
    </span>
  );
}

function TicketDetail({ ticket }: { ticket: Ticket }) {
  return (
    <div className="px-8 py-7 max-w-3xl boldr-stagger">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
        <ChannelIcon channel={ticket.channel} /> <span>{ticket.channel.replace("_", " ")}</span>
        <span>·</span><span>{ticket.id}</span>
        {ticket.orderId && (<><span>·</span><span>{ticket.orderId}</span></>)}
      </div>
      <h2 className="mt-2 text-[26px] font-display tracking-tight">{ticket.subject}</h2>
      <div className="mt-3 flex items-center gap-3 text-[12.5px] text-muted-foreground">
        <span className="text-foreground font-medium">{ticket.customer}</span>
        <span>·</span><span>{ticket.email}</span>
        <span>·</span><span>{formatDate(ticket.date)}</span>
      </div>

      <div className="mt-6 rounded-md bg-card hairline px-6 py-5">
        <p className="whitespace-pre-wrap text-[14.5px] leading-relaxed text-foreground/90">{ticket.body}</p>
      </div>

      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <Chip>{laneLabel(ticket.lane)}</Chip>
        <PersonaChip persona={ticket.persona} />
        <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.1em]", statusTone(ticket.status))}>
          {ticket.status.replace("_", " ")}
        </span>
      </div>
    </div>
  );
}

function AiPanel({ ticket }: { ticket: Ticket }) {
  return (
    <div className="px-5 py-6 space-y-4 boldr-stagger">
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-md bg-ember/10 text-ember flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-medium">AI triage</div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
            Classification confidence {ticket.classifyConfidence}%
          </div>
        </div>
      </div>

      {/* extracted */}
      <div className="rounded-md hairline bg-card p-3.5 space-y-2.5">
        <Row label="Intent" value={ticket.intent} />
        <Row label="Lane" value={laneLabel(ticket.lane)} />
        <Row label="Persona" valueNode={<PersonaChip persona={ticket.persona} />} />
        <Row label="Knowledge gap" value={ticket.isKnowledgeGap ? "Yes" : "No"} />
        <Row label="Requires escalation" value={ticket.requiresEscalation ? "Yes" : "No"} />
        {ticket.routedTo && <Row label="Routed to" value={ticket.routedTo} />}
      </div>

      {/* KB match OR gap */}
      {ticket.isKnowledgeGap ? (
        <div className="rounded-md border border-destructive/40 bg-destructive-soft p-4">
          <div className="flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-destructive" />
            <div className="text-[13px] font-medium">Knowledge Gap</div>
          </div>
          <p className="mt-2 text-[12.5px] text-foreground/80 leading-relaxed">
            Not in KB — routed to CS staff. <span className="font-medium">AI did not hallucinate.</span>
          </p>
        </div>
      ) : ticket.answeredByKb ? (
        <div className="rounded-md hairline bg-card p-3.5">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <div className="text-[12px] font-medium">KB Match</div>
          </div>
          <div className="space-y-1.5">
            {(ticket.kbMatches ?? []).slice(0, 2).map((m) => {
              const kb = kbEntries.find((k) => k.id === m.kbId);
              return (
                <div key={m.kbId} className="flex items-start justify-between gap-2 text-[12.5px]">
                  <div>
                    <div className="font-medium">{kb?.question ?? m.kbId}</div>
                    <div className="text-[11px] text-muted-foreground">{m.kbId} · {kb?.category}</div>
                  </div>
                  <div className="text-[11px] tabular-nums text-ember font-medium">{(m.similarity * 100).toFixed(0)}%</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Answerable: draft reply */}
      {!ticket.isGap && ticket.draftReply && (
        <div className="rounded-md hairline bg-card p-3.5">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[12px] font-medium">Drafted reply</div>
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">Boldr brand voice</div>
          </div>
          <div className="rounded bg-surface p-3 text-[12.5px] whitespace-pre-wrap leading-relaxed text-foreground/85">
            {ticket.draftReply}
          </div>
          <div className="mt-3 flex items-center gap-1.5">
            <button className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] text-primary-foreground hover:opacity-90">
              <Send className="h-3 w-3" /> Approve & send
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md hairline bg-card px-2.5 py-1.5 text-[12px] hover:bg-surface">
              <Edit3 className="h-3 w-3" /> Edit
            </button>
            <button className="inline-flex items-center gap-1.5 rounded-md hairline bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground hover:text-destructive">
              <X className="h-3 w-3" /> Reject
            </button>
          </div>
        </div>
      )}
      {!ticket.isGap && !ticket.draftReply && (
        <div className="rounded-md hairline bg-card p-3.5 text-[12.5px] text-muted-foreground">
          KB match queued — draft will appear after CS staff confirms tone selection.
        </div>
      )}

      {/* Auto-drafted KB — the hero moment */}
      {ticket.isGap && ticket.autoDraftKb && (
        <div className="relative rounded-md border-2 border-ember/40 bg-gradient-to-br from-ember-soft to-card p-4 shadow-[0_8px_30px_-12px_oklch(0.62_0.165_45_/_0.35)]">
          <div className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded bg-ember px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-ember-foreground">
            <PlusCircle className="h-2.5 w-2.5" /> Auto-drafted KB entry
          </div>
          <div className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{ticket.autoDraftKb.category}</div>
          <h4 className="mt-1 text-[14.5px] font-display tracking-tight">{ticket.autoDraftKb.question}</h4>
          <p className="mt-2 text-[12.5px] text-foreground/85 leading-relaxed">{ticket.autoDraftKb.answer}</p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10.5px] text-muted-foreground">Born from {ticket.id} · {formatDate(ticket.date)}</span>
            <button className="inline-flex items-center gap-1.5 rounded-md bg-ember px-3 py-1.5 text-[12px] text-ember-foreground hover:opacity-90">
              <Check className="h-3 w-3" /> Approve KB entry
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, valueNode }: { label: string; value?: string; valueNode?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground pt-0.5">{label}</div>
      <div className="text-[12.5px] text-right max-w-[70%]">{valueNode ?? value}</div>
    </div>
  );
}
