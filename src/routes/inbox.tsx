import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  ShoppingBag,
  Package,
  Truck,
  PlugZap,
  TrendingUp,
  Inbox as InboxIcon,
  BookPlus,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getShopifyLookup,
  isShopifyOpsTicket,
  SHOPIFY_CONNECTION_MODE,
  type ShopifyLookup,
} from "@/lib/shopify-ops";
import { Webhooks } from "@/lib/webhooks";

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

const MOCK_TICKET_STATE_STORAGE_KEY = "boldr-inbox-mock-ticket-state";

type PersistedKbSave = { kbId: string; draft: boolean };
type PersistedTicketState = {
  status?: TicketStatus;
  kbSave?: PersistedKbSave;
};

function readMockTicketState(): Record<string, PersistedTicketState> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(MOCK_TICKET_STATE_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as Record<string, PersistedTicketState>;
    return Object.fromEntries(
      Object.entries(parsed).filter(([, value]) => {
        if (!value || typeof value !== "object") return false;
        const hasValidStatus = !value.status || ["open", "pending_reply", "resolved", "escalated"].includes(value.status);
        const hasValidKbSave =
          !value.kbSave ||
          (typeof value.kbSave.kbId === "string" && typeof value.kbSave.draft === "boolean");

        return hasValidStatus && hasValidKbSave;
      }),
    );
  } catch {
    return {};
  }
}

function writeMockTicketState(state: Record<string, PersistedTicketState>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MOCK_TICKET_STATE_STORAGE_KEY, JSON.stringify(state));
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
  const [mockTicketState, setMockTicketState] = useState<Record<string, PersistedTicketState>>({});

  // Always start the Inbox from seed data on load. Any prior per-ticket
  // overrides (e.g. a ticket marked "resolved" in an earlier demo session)
  // are cleared so the demo is reproducible across reloads.
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(MOCK_TICKET_STATE_STORAGE_KEY);
    }
    setMockTicketState({});
    // Notify backend that the inbox list was requested on this session.
    Webhooks.ticketListRequested({
      filters: { lane: "all", persona: "all", status: "all" },
      count: tickets.length,
    });
  }, []);

  const visibleTickets = useMemo(
    () => tickets.map((ticket) => ({
      ...ticket,
      status: mockTicketState[ticket.id]?.status ?? ticket.status,
    })),
    [mockTicketState],
  );

  const filtered = useMemo(() => {
    return visibleTickets.filter((t) => {
      if (lane !== "all" && t.lane !== lane) return false;
      if (persona !== "all" && t.persona !== persona) return false;
      if (status !== "all" && t.status !== status) return false;
      if (kbOnly === "yes" && !t.answeredByKb) return false;
      if (kbOnly === "no" && t.answeredByKb) return false;
      if (escOnly && !t.escalation) return false;
      return true;
    });
  }, [visibleTickets, lane, persona, status, kbOnly, escOnly]);

  const [selectedId, setSelectedId] = useState(tickets[0]?.id ?? "");
  const selected = visibleTickets.find((t) => t.id === selectedId) ?? filtered[0] ?? visibleTickets[0];

  function updateMockTicketState(ticketId: string, patch: PersistedTicketState) {
    setMockTicketState((current) => {
      const next = {
        ...current,
        [ticketId]: {
          ...(current[ticketId] ?? {}),
          ...patch,
        },
      };
      writeMockTicketState(next);
      return next;
    });
  }

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
            <span className="text-[11px] text-muted-foreground">{filtered.length} / {visibleTickets.length}</span>
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
         <AiPanel ticket={selected} persistedState={mockTicketState[selected.id]} onUpdateMockTicketState={updateMockTicketState} />
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
        {isShopifyOpsTicket(ticket) ? (
          <span className="inline-flex items-center gap-1 rounded bg-primary/15 text-primary px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.1em]">
            <ShoppingBag className="h-2.5 w-2.5" /> Shopify Ops
          </span>
        ) : (
          <Chip>{laneLabel(ticket.lane)}</Chip>
        )}
        <PersonaChip persona={ticket.persona} />
        <span className={cn("inline-flex items-center rounded px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.1em]", statusTone(ticket.status))}>
          {ticket.status.replace("_", " ")}
        </span>
      </div>
    </div>
  );
}

function AiPanel({
  ticket,
  persistedState,
  onUpdateMockTicketState,
}: {
  ticket: Ticket;
  persistedState?: PersistedTicketState;
  onUpdateMockTicketState: (ticketId: string, patch: PersistedTicketState) => void;
}) {
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
        <Row
          label="Lane"
          valueNode={
            isShopifyOpsTicket(ticket) ? (
              <span className="inline-flex items-center gap-1 rounded bg-primary/15 text-primary px-1.5 py-0.5 text-[10.5px] uppercase tracking-[0.1em]">
                <ShoppingBag className="h-2.5 w-2.5" /> Shopify Ops
              </span>
            ) : (
              <span>{laneLabel(ticket.lane)}</span>
            )
          }
        />
        <Row label="Persona" valueNode={<PersonaChip persona={ticket.persona} />} />
        <Row label="Knowledge gap" value={ticket.isKnowledgeGap ? "Yes" : "No"} />
        <Row label="Requires escalation" value={ticket.requiresEscalation ? "Yes" : "No"} />
        {!isShopifyOpsTicket(ticket) && isExternalRoute(ticket.routedTo) && (
          <Row label="Routed to" value={ticket.routedTo!} />
        )}
      </div>

      {/* SHOPIFY OPS LANE — replaces KB match + draft entirely */}
      {isShopifyOpsTicket(ticket) ? (
        <ShopifyOpsCard key={ticket.id} ticket={ticket} />
      ) : (
        <>
          {/* KB match OR gap */}
          {ticket.isKnowledgeGap ? (
            <div className="rounded-md border border-destructive/40 bg-destructive-soft p-4">
              <div className="flex items-center gap-2">
                <FileWarning className="h-4 w-4 text-destructive" />
                <div className="text-[13px] font-medium">Knowledge gap — needs your answer</div>
              </div>
              <p className="mt-2 text-[12.5px] text-foreground/80 leading-relaxed">
                AI couldn't answer from the KB and <span className="font-medium">did not guess</span>. Write the
                canonical answer once below — it becomes a KB entry and auto-resolves future tickets like this.
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
          {!ticket.isGap && ticket.answeredByKb && (
            <DraftReplyCard key={ticket.id} ticket={ticket} />
          )}

          {/* Honest empty state: no KB match AND not a gap */}
          {!ticket.isGap && !ticket.answeredByKb && (
            <ManualReplyCard key={ticket.id} ticket={ticket} />
          )}

          {/* CS-authored KB entry form — the hero moment */}
          {ticket.isGap && (
            <KbGapForm
              key={ticket.id}
              ticket={ticket}
              persistedState={persistedState}
              onUpdateMockTicketState={onUpdateMockTicketState}
            />
          )}
        </>
      )}
    </div>
  );
}

type SourceOfTruth = "self" | "supplier" | "pending";

function KbGapForm({
  ticket,
  persistedState,
  onUpdateMockTicketState,
}: {
  ticket: Ticket;
  persistedState?: PersistedTicketState;
  onUpdateMockTicketState: (ticketId: string, patch: PersistedTicketState) => void;
}) {
  const prefill = ticket.autoDraftKb;
  const [category, setCategory] = useState(prefill?.category ?? laneLabel(ticket.lane));
  const [question, setQuestion] = useState(prefill?.question ?? ticket.intent);
  const [answer, setAnswer] = useState("");
  const [source, setSource] = useState<SourceOfTruth>("self");
  const [replyOverride, setReplyOverride] = useState<string | null>(null);
  const [saved, setSaved] = useState<null | { kbId: string; draft: boolean }>(persistedState?.kbSave ?? null);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setSaved(persistedState?.kbSave ?? null);
  }, [persistedState?.kbSave?.draft, persistedState?.kbSave?.kbId, ticket.id]);

  if (saved) {
    return (
      <div className="rounded-md border border-success/40 bg-success-soft/40 p-4">
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-success" />
          <div className="text-[13px] font-medium">
            {saved.draft ? "KB draft saved" : "KB entry created"} · {saved.kbId}
          </div>
        </div>
        <p className="mt-1.5 text-[12px] text-foreground/75 leading-relaxed">
          {saved.draft
            ? `Saved as draft pending confirmation. ${ticket.id} stays in pending_reply until the entry goes live.`
            : `Linked to ${ticket.id}. Reply sent to ${ticket.customer}. Future tickets matching this question will auto-resolve.`}
        </p>
      </div>
    );
  }

  const canSave = answer.trim().length > 0 && status !== "saving";
  const autoReply = answer.trim()
    ? `Hi ${ticket.customer.split(" ")[0]},\n\nThanks for reaching out about Boldr. ${answer.trim()}\n\nLet me know if anything else is unclear.\n\n— Boldr Customer Care`
    : "";
  const reply = replyOverride ?? autoReply;

  async function save(asDraft: boolean) {
    setStatus("saving");
    setErrorMsg(null);
    const kbId = `KB-${String(Math.floor(900 + Math.random() * 99)).padStart(3, "0")}`;
    const toastId = toast.loading(asDraft ? "Saving KB draft…" : "Saving KB & sending reply…");
    try {
      await new Promise((resolve, reject) =>
        setTimeout(() => (Math.random() < 0.08 ? reject(new Error("Network hiccup — please retry")) : resolve(null)), 900),
      );
      toast.success(
        asDraft
          ? `${kbId} saved as draft (pending confirmation)`
          : `${kbId} created · reply sent to ${ticket.customer}`,
        { id: toastId },
      );
      const kbSave = { kbId, draft: asDraft };
      setStatus("idle");
      setSaved(kbSave);
      onUpdateMockTicketState(ticket.id, {
        kbSave,
        status: asDraft ? "pending_reply" : "resolved",
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      toast.error(`Save failed · ${msg}`, { id: toastId });
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  return (
    <div className="relative rounded-md border-2 border-ember/40 bg-gradient-to-br from-ember-soft to-card p-4 shadow-[0_8px_30px_-12px_oklch(0.62_0.165_45_/_0.35)] space-y-3">
      <div className="absolute -top-2.5 left-3 inline-flex items-center gap-1 rounded bg-ember px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-ember-foreground">
        <BookPlus className="h-2.5 w-2.5" /> Draft KB entry from CS
      </div>

      <div className="mt-1 space-y-2.5">
        <Field label="Category">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full text-[12.5px] rounded hairline bg-surface px-2 py-1.5 outline-none focus:ring-2 focus:ring-ember/30"
          />
        </Field>
        <Field label="Question">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full text-[12.5px] rounded hairline bg-surface px-2 py-1.5 outline-none focus:ring-2 focus:ring-ember/30"
          />
        </Field>
        <Field label="Answer">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write the canonical answer. This becomes the KB entry and the customer reply."
            rows={5}
            autoFocus
            className="w-full text-[12.5px] rounded hairline bg-surface px-2 py-1.5 outline-none focus:ring-2 focus:ring-ember/30 leading-relaxed resize-y"
          />
        </Field>

        <div>
          <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mb-1.5">
            Source of truth
          </div>
          <div className="flex flex-col gap-1">
            {([
              ["self", "My own knowledge"],
              ["supplier", "Confirmed with supplier"],
              ["pending", "Pending confirmation (save as draft)"],
            ] as const).map(([val, label]) => (
              <label key={val} className="flex items-center gap-2 text-[12px] cursor-pointer">
                <input
                  type="radio"
                  name={`source-${ticket.id}`}
                  checked={source === val}
                  onChange={() => setSource(val)}
                  className="accent-ember"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {answer.trim() && (
        <div className="rounded bg-surface/70 p-3 hairline">
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
              Reply preview · editable
            </div>
            {replyOverride !== null && (
              <button
                onClick={() => setReplyOverride(null)}
                className="text-[10.5px] text-muted-foreground hover:text-foreground"
              >
                Reset to auto
              </button>
            )}
          </div>
          <textarea
            value={reply}
            onChange={(e) => setReplyOverride(e.target.value)}
            rows={7}
            className="w-full text-[12.5px] rounded bg-surface px-2 py-1.5 hairline outline-none focus:ring-2 focus:ring-ember/30 leading-relaxed resize-y text-foreground/90"
          />
        </div>
      )}

      <div className="space-y-2 pt-1">
        {status === "error" && errorMsg && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2.5 py-2 text-[11.5px] text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <div className="flex-1">
              <div className="font-medium">Couldn't save</div>
              <div className="text-destructive/80">{errorMsg}</div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] text-muted-foreground">
            {status === "saving"
              ? "Saving…"
              : `Born from ${ticket.id} · ${formatDate(ticket.date)}`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => save(true)}
              disabled={!answer.trim() || status === "saving"}
              className="inline-flex items-center gap-1.5 rounded-md hairline bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Save draft
            </button>
            <button
              onClick={() => save(source === "pending")}
              disabled={!canSave}
              className="inline-flex items-center gap-1.5 rounded-md bg-ember px-3 py-1.5 text-[12px] text-ember-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {status === "saving" ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Saving…
                </>
              ) : status === "error" ? (
                <>
                  <AlertTriangle className="h-3 w-3" />
                  Retry save
                </>
              ) : (
                <>
                  <Check className="h-3 w-3" />
                  {source === "pending" ? "Save as draft" : "Save KB & reply"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground mb-1">{label}</div>
      {children}
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

function synthesiseReply(ticket: Ticket, kbAnswer: string) {
  const firstName = ticket.customer.split(" ")[0] || "there";
  return `Hi ${firstName},\n\nThanks for reaching out about Boldr. ${kbAnswer}\n\nLet me know if anything else is unclear.\n\n— Boldr Customer Care`;
}

function DraftReplyCard({ ticket }: { ticket: Ticket }) {
  const topMatch = (ticket.kbMatches ?? [])
    .slice()
    .sort((a, b) => b.similarity - a.similarity)[0];
  const topKb = topMatch ? kbEntries.find((k) => k.id === topMatch.kbId) : undefined;

  const initial =
    ticket.draftReply ??
    (topKb ? synthesiseReply(ticket, topKb.answer) : "");

  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(initial);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="rounded-md border border-success/40 bg-success-soft/40 p-3.5">
        <div className="flex items-center gap-2 text-[12.5px]">
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="font-medium">Reply sent to {ticket.customer}</span>
        </div>
      </div>
    );
  }

  const alsoRefs = (ticket.kbMatches ?? []).slice(1, 3);
  const synthesised = !ticket.draftReply && !!topKb;

  return (
    <div className="rounded-md hairline bg-card p-3.5">
      <div className="flex items-center justify-between mb-2">
        <div className="text-[12px] font-medium">Drafted reply</div>
        <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
          Boldr brand voice
        </div>
      </div>

      {topMatch && (
        <div className="mb-2 text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
          {synthesised ? "Drafted from" : "Based on"} {topMatch.kbId} ·{" "}
          <span className="text-ember tabular-nums">
            {(topMatch.similarity * 100).toFixed(0)}%
          </span>
        </div>
      )}

      {editing ? (
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          autoFocus
          className="w-full rounded bg-surface p-3 text-[12.5px] leading-relaxed text-foreground/90 hairline outline-none focus:ring-2 focus:ring-ember/30 resize-y"
        />
      ) : (
        <div className="rounded bg-surface p-3 text-[12.5px] whitespace-pre-wrap leading-relaxed text-foreground/85">
          {body}
        </div>
      )}

      {alsoRefs.length > 0 && (
        <div className="mt-2 text-[10.5px] text-muted-foreground">
          Also referenced: {alsoRefs.map((m) => m.kbId).join(" · ")}
        </div>
      )}

      <div className="mt-3 flex items-center gap-1.5">
        <button
          onClick={() => {
            setSent(true);
            toast.success(`Reply sent to ${ticket.customer}`);
          }}
          disabled={!body.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-3 w-3" /> Approve & send
        </button>
        <button
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-md hairline bg-card px-2.5 py-1.5 text-[12px] hover:bg-surface"
        >
          <Edit3 className="h-3 w-3" /> {editing ? "Done editing" : "Edit"}
        </button>
        <button
          onClick={() => {
            setBody(initial);
            setEditing(false);
            toast("Draft rejected — reverted to original");
          }}
          className="inline-flex items-center gap-1.5 rounded-md hairline bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground hover:text-destructive"
        >
          <X className="h-3 w-3" /> Reject
        </button>
      </div>
    </div>
  );
}

function ManualReplyCard({ ticket }: { ticket: Ticket }) {
  const external = isExternalRoute(ticket.routedTo);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);

  if (external) {
    return (
      <div className="rounded-md hairline bg-card p-3.5 text-[12.5px] text-foreground/75">
        No KB answer needed — this ticket is handled in{" "}
        <span className="font-medium text-foreground">{ticket.routedTo}</span>.
      </div>
    );
  }

  if (sent) {
    return (
      <div className="rounded-md border border-success/40 bg-success-soft/40 p-3.5">
        <div className="flex items-center gap-2 text-[12.5px]">
          <Check className="h-3.5 w-3.5 text-success" />
          <span className="font-medium">Reply sent to {ticket.customer}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md hairline bg-card p-3.5 space-y-2.5">
      <div className="text-[12px] font-medium">Reply manually</div>
      <p className="text-[11.5px] text-muted-foreground leading-relaxed">
        No KB match for this one. Write the reply here — if it should become a KB entry, flag it
        as a knowledge gap.
      </p>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={5}
        placeholder={`Hi ${ticket.customer.split(" ")[0]},\n\n…`}
        className="w-full rounded bg-surface p-3 text-[12.5px] leading-relaxed text-foreground/90 hairline outline-none focus:ring-2 focus:ring-ember/30 resize-y"
      />
      <div className="flex items-center justify-end">
        <button
          onClick={() => {
            setSent(true);
            toast.success(`Reply sent to ${ticket.customer}`);
          }}
          disabled={!body.trim()}
          className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] text-primary-foreground hover:opacity-90 disabled:opacity-40"
        >
          <Send className="h-3 w-3" /> Send reply
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * SHOPIFY OPS CARD — the connector lane.
 * Demo mode renders mock Admin API results; swap getShopifyLookup for live.
 * ------------------------------------------------------------------------- */

function ShopifyOpsCard({ ticket }: { ticket: Ticket }) {
  const lookup = useMemo<ShopifyLookup>(() => getShopifyLookup(ticket), [ticket]);
  const [ran, setRan] = useState(false);
  const [body, setBody] = useState(lookup.draft);
  const [editing, setEditing] = useState(false);
  const [sent, setSent] = useState(false);
  const [signalQueued, setSignalQueued] = useState(false);

  const KindIcon =
    lookup.kind === "stock_availability"
      ? Package
      : lookup.kind === "shipping_options"
      ? Truck
      : ShoppingBag;

  return (
    <div className="space-y-3">
      {/* Connector status banner */}
      <div className="rounded-md border border-primary/30 bg-primary/5 p-3 flex items-start gap-2.5">
        <div className="h-7 w-7 rounded bg-primary/15 text-primary flex items-center justify-center shrink-0">
          <ShoppingBag className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12px] font-medium">
            Shopify Ops · {SHOPIFY_CONNECTION_MODE === "demo" ? "Demo mode" : "Live"}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
            {SHOPIFY_CONNECTION_MODE === "demo"
              ? "Architected as a connector. Mock Admin API data layer for demo safety — swap for live Shopify on connect."
              : "Connected to Shopify Admin API."}
          </p>
        </div>
        {SHOPIFY_CONNECTION_MODE === "demo" && (
          <button
            disabled
            title="Production-only — placeholder for v1"
            className="inline-flex items-center gap-1 rounded hairline bg-card px-2 py-1 text-[11px] text-muted-foreground"
          >
            <PlugZap className="h-3 w-3" /> Connect Shopify
          </button>
        )}
      </div>

      {/* Lookup card */}
      <div className="rounded-md hairline bg-card p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KindIcon className="h-3.5 w-3.5 text-primary" />
            <div className="text-[12px] font-medium">{lookup.label}</div>
          </div>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] uppercase tracking-[0.12em]",
              ran || lookup.pending
                ? lookup.pending
                  ? "bg-warning-soft text-foreground"
                  : "bg-success-soft text-foreground"
                : "bg-ember-soft text-foreground",
            )}
          >
            {lookup.pending && !ran
              ? "Pending Shopify lookup"
              : ran
              ? lookup.pending
                ? "Pending live data"
                : "Lookup complete"
              : "Lookup required"}
          </span>
        </div>

        {!ran ? (
          <button
            onClick={() => setRan(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12px] text-primary-foreground hover:opacity-90"
          >
            <Sparkles className="h-3 w-3" /> Run Shopify lookup
          </button>
        ) : (
          <ShopifyLookupResult lookup={lookup} />
        )}
      </div>

      {/* Signal */}
      {ran && lookup.signal && (
        <div className="rounded-md border border-ember/40 bg-ember/5 p-3 flex items-start gap-2.5">
          <TrendingUp className="h-3.5 w-3.5 text-ember mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium">
              Marketing / product signal · <span className="text-ember">{lookup.signal.tag}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              {lookup.signal.reason}
            </p>
          </div>
          <button
            onClick={() => {
              setSignalQueued(true);
              toast.success(`Signal "${lookup.signal!.tag}" queued for benchmark engine`);
            }}
            disabled={signalQueued}
            className="inline-flex items-center gap-1 rounded hairline bg-card px-2 py-1 text-[11px] text-foreground hover:bg-surface disabled:opacity-50"
          >
            {signalQueued ? <><Check className="h-3 w-3 text-success" /> Queued</> : "Flag signal"}
          </button>
        </div>
      )}

      {/* Draft reply with human approval (always required) */}
      {ran &&
        (sent ? (
          <div className="rounded-md border border-success/40 bg-success-soft/40 p-3.5">
            <div className="flex items-center gap-2 text-[12.5px]">
              <Check className="h-3.5 w-3.5 text-success" />
              <span className="font-medium">Reply sent to {ticket.customer}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-md hairline bg-card p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[12px] font-medium">Drafted reply</div>
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-muted-foreground">
                Human approval required
              </div>
            </div>
            {editing ? (
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                autoFocus
                className="w-full rounded bg-surface p-3 text-[12.5px] leading-relaxed text-foreground/90 hairline outline-none focus:ring-2 focus:ring-ember/30 resize-y"
              />
            ) : (
              <div className="rounded bg-surface p-3 text-[12.5px] whitespace-pre-wrap leading-relaxed text-foreground/85">
                {body}
              </div>
            )}
            <div className="mt-3 flex items-center gap-1.5">
              <button
                onClick={() => {
                  if (lookup.pending) {
                    toast.error("Cannot mark resolved — Shopify lookup is pending. Confirm with live data first.");
                    return;
                  }
                  setSent(true);
                  toast.success(`Reply sent to ${ticket.customer}`);
                }}
                disabled={!body.trim()}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-2.5 py-1.5 text-[12px] text-primary-foreground hover:opacity-90 disabled:opacity-40"
              >
                <Send className="h-3 w-3" /> Approve & send
              </button>
              <button
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-md hairline bg-card px-2.5 py-1.5 text-[12px] hover:bg-surface"
              >
                <Edit3 className="h-3 w-3" /> {editing ? "Done editing" : "Edit"}
              </button>
              <button
                onClick={() => {
                  setBody(lookup.draft);
                  setEditing(false);
                  toast("Draft rejected — reverted to lookup result");
                }}
                className="inline-flex items-center gap-1.5 rounded-md hairline bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" /> Reject
              </button>
              {lookup.pending && (
                <span className="ml-auto text-[10.5px] text-warning">Cannot resolve until live data confirms.</span>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}

function ShopifyLookupResult({ lookup }: { lookup: ShopifyLookup }) {
  if (lookup.kind === "stock_availability" && lookup.inventory) {
    return (
      <div className="space-y-1.5">
        {lookup.inventory.map((i) => {
          const low = i.available_quantity <= i.low_stock_threshold;
          const out = i.available_quantity === 0;
          return (
            <div key={`${i.sku}-${i.location}`} className="flex items-center justify-between text-[12px] py-1 border-b border-border/60 last:border-0">
              <div className="min-w-0">
                <div className="font-medium truncate">{i.product_name}</div>
                <div className="text-[10.5px] text-muted-foreground">{i.variant_name} · {i.location} · {i.sku}</div>
              </div>
              <span className={cn(
                "tabular-nums text-[11px] rounded px-1.5 py-0.5 uppercase tracking-[0.1em]",
                out ? "bg-destructive-soft text-destructive" : low ? "bg-ember-soft text-ember" : "bg-success-soft text-success",
              )}>
                {out ? "Sold out" : `${i.available_quantity} in stock${low ? " · low" : ""}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  if (lookup.kind === "shipping_options" && lookup.shipping) {
    return (
      <div className="space-y-1.5">
        {lookup.shipping.map((s) => (
          <div key={`${s.method}-${s.destination}`} className="flex items-center justify-between text-[12px] py-1 border-b border-border/60 last:border-0">
            <div>
              <div className="font-medium">{s.method} <span className="text-muted-foreground font-normal">· {s.destination}</span></div>
              <div className="text-[10.5px] text-muted-foreground">{s.eta_days} · {s.cutoff}</div>
            </div>
            <span className="tabular-nums text-[11.5px]">{s.price_sgd === 0 ? "Free" : `SGD ${s.price_sgd}`}</span>
          </div>
        ))}
      </div>
    );
  }

  if (lookup.order) {
    const o = lookup.order;
    return (
      <div className="rounded bg-surface/70 p-2.5 text-[12px] space-y-1">
        <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="tabular-nums">{o.order_id}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Order status</span><span>{o.order_status}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Fulfilment</span><span>{o.fulfillment_status.replace(/_/g, " ")}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{o.shipping_method}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">ETA</span><span>{new Date(o.estimated_delivery).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></div>
        {o.tracking_url && (
          <div className="flex justify-between gap-2 min-w-0">
            <span className="text-muted-foreground shrink-0">Tracking</span>
            <a href={o.tracking_url} target="_blank" rel="noreferrer" className="truncate text-primary hover:underline">{o.tracking_url}</a>
          </div>
        )}
        {o.notes && (
          <div className="pt-1 mt-1 border-t border-border/60 text-[11.5px] text-muted-foreground leading-relaxed">
            {o.notes}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rounded bg-warning-soft/40 p-2.5 text-[12px] text-foreground/80">
      No matching record in mock Shopify data. {lookup.pending ?? "Awaiting customer detail."}
    </div>
  );
}
