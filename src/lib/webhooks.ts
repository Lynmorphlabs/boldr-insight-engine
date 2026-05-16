/**
 * Workflow Studio webhook service.
 *
 * Single abstraction layer that frontend code uses to notify backend workflows
 * of UI events. Each event name maps 1:1 to a webhook route on the backend:
 *
 *     {BASE_URL}/{eventName}
 *
 * Base URL is read from `import.meta.env.VITE_WEBHOOK_BASE_URL` and falls back
 * to the Fuseful Workflow Studio default. Calls are fire-and-forget with a
 * short timeout and never throw — UI flows continue regardless of webhook
 * delivery. Failures are logged to the console for observability.
 */

const DEFAULT_BASE_URL = "https://wfstudiobe.fuseful.ai/api/v1/webhooks";

function getBaseUrl(): string {
  const fromEnv =
    typeof import.meta !== "undefined" &&
    (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env?.VITE_WEBHOOK_BASE_URL;
  return (fromEnv || DEFAULT_BASE_URL).replace(/\/+$/, "");
}

// --- Event identifiers --------------------------------------------------
// Names match the workflow contract exactly. Treat them as both API names
// and action / event identifiers.

export type WebhookEvent =
  // Inbox / Tickets
  | "ticketListRequested"
  | "ticketDetailsRequested"
  | "ticketUpdated"
  | "ticketReplySent"
  | "ticketReclassified"
  | "ticketAiReplyGenerated"
  | "ticketReplySourcesFetched"
  | "ticketStatusChanged"
  | "ticketAssigned"
  | "ticketEscalated"
  | "ticketResolved"
  | "ticketClosed"
  | "ticketReopened"
  | "ticketPriorityUpdated"
  | "ticketTagsUpdated"
  | "ticketLaneChanged"
  | "ticketPersonaDetected"
  | "ticketKnowledgeGapDetected"
  // Knowledge Base
  | "knowledgeEntriesListed"
  | "knowledgeEntryFetched"
  | "knowledgeSourcesListed"
  | "knowledgeSourceSynced"
  | "allKnowledgeSourcesSynced"
  | "knowledgeSyncHistoryFetched"
  | "knowledgeGapsFetched"
  | "knowledgeEntryCreated"
  | "knowledgeEntryUpdated"
  | "knowledgeEntryDeleted"
  | "knowledgeSourceConnected"
  | "knowledgeSourceDisconnected"
  | "knowledgeSyncStarted"
  | "knowledgeSyncCompleted"
  | "knowledgeSyncFailed"
  | "knowledgeGapCreated"
  | "knowledgeGapResolved"
  // Intelligence / Themes / Brief
  | "themeInsightsGenerated"
  | "themeEvidenceFetched"
  | "personaBreakdownGenerated"
  | "latestBriefFetched"
  | "intelligenceBriefRegenerated"
  | "briefHistoryFetched"
  | "themeClusterCreated"
  | "themeTrendDetected"
  | "themePriorityUpdated"
  | "briefGenerated"
  | "briefPublished"
  | "briefArchived"
  | "personaShiftDetected"
  | "emergingThemeDetected"
  // External Sentiment / Benchmark
  | "sentimentQuotesFetched"
  | "sentimentThemesGenerated"
  | "externalSentimentSynced"
  | "sentimentSyncHistoryFetched"
  | "competitorBenchmarkFetched"
  | "negativeSentimentDetected"
  | "positiveSentimentSpikeDetected"
  | "brandMentionDetected"
  | "competitorMentionDetected"
  | "sentimentTrendUpdated"
  | "benchmarkComparisonGenerated"
  | "reviewIngested"
  | "socialInsightGenerated"
  // AI Assistant
  | "aiQuestionAsked"
  | "aiConversationContinued"
  | "aiThreadFetched"
  | "aiContextLoaded"
  | "aiResponseGenerated"
  | "aiStreamingStarted"
  | "aiStreamingCompleted"
  | "aiCitationAttached"
  | "aiConversationCreated"
  | "aiConversationArchived"
  | "aiFollowupSuggested"
  | "aiIntentDetected"
  // Auth / User
  | "userLoggedIn"
  | "userLoggedOut"
  | "userSessionFetched"
  | "userProfileFetched"
  | "userAuthenticated"
  | "userUnauthorized"
  | "userSessionExpired"
  | "userRoleUpdated"
  | "userAccessGranted"
  | "userAccessRevoked"
  | "userActivityTracked"
  // Public / System Webhooks
  | "knowledgeBaseSyncTriggered"
  | "ticketIngestionTriggered"
  | "sentimentRefreshTriggered"
  | "externalWebhookReceived"
  | "workflowTriggered"
  | "workflowCompleted"
  | "workflowFailed"
  | "systemSyncTriggered"
  | "backgroundJobStarted"
  | "backgroundJobCompleted"
  | "backgroundJobFailed"
  | "queueMessageReceived"
  | "queueMessageProcessed"
  | "retryProcessTriggered"
  | "cronJobTriggered"
  | "scheduledTaskExecuted"
  | "eventIngested"
  | "dataPipelineStarted"
  | "dataPipelineCompleted"
  | "integrationSyncTriggered";

export type WebhookPayload = Record<string, unknown>;

export type WebhookOptions = {
  /** Treat as a request the UI awaits; default is fire-and-forget. */
  await?: boolean;
  /** Abort after this many ms. Default 8000. */
  timeoutMs?: number;
  /** Number of retry attempts on network failure (only when await=true). */
  retries?: number;
};

// In-flight dedupe so React StrictMode double-mounts don't double-fire
// list/fetch events.
const inflight = new Map<string, Promise<unknown>>();

function dedupeKey(event: WebhookEvent, payload: WebhookPayload) {
  // Light fingerprint: event + ordered keys + scalar values.
  try {
    return event + ":" + JSON.stringify(payload);
  } catch {
    return event;
  }
}

async function doFetch(url: string, body: string, signal: AbortSignal) {
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body,
    signal,
    // Webhook endpoint is cross-origin; no credentials needed.
    credentials: "omit",
    mode: "cors",
    keepalive: true,
  });
}

/**
 * Send a webhook event. Default is fire-and-forget — UI continues immediately
 * and the call is best-effort. Pass `{ await: true }` if the UI needs the
 * response.
 */
export function fireWebhook<T = unknown>(
  event: WebhookEvent,
  payload: WebhookPayload = {},
  opts: WebhookOptions = {},
): Promise<T | null> {
  const url = `${getBaseUrl()}/${event}`;
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    ...payload,
  });

  const key = dedupeKey(event, payload);
  const existing = inflight.get(key);
  if (existing && !opts.await) return existing as Promise<T | null>;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), opts.timeoutMs ?? 8000);

  const attempts = Math.max(1, (opts.retries ?? 0) + 1);
  const run = async (): Promise<T | null> => {
    let lastErr: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await doFetch(url, body, controller.signal);
        clearTimeout(timeout);
        if (!res.ok) {
          lastErr = new Error(`Webhook ${event} → ${res.status}`);
          if (res.status < 500) break; // don't retry 4xx
          continue;
        }
        const ct = res.headers.get("content-type") ?? "";
        if (ct.includes("application/json")) {
          return (await res.json()) as T;
        }
        return null;
      } catch (err) {
        lastErr = err;
      }
    }
    clearTimeout(timeout);
    if (opts.await) throw lastErr;
    if (typeof console !== "undefined") {
      // eslint-disable-next-line no-console
      console.debug(`[webhook] ${event} delivery skipped`, lastErr);
    }
    return null;
  };

  const promise = run().finally(() => {
    // Brief dedupe window so multiple identical fires within the same render
    // collapse, but follow-up identical events later still go through.
    setTimeout(() => inflight.delete(key), 500);
  });
  inflight.set(key, promise);
  return promise;
}

// --- Convenience wrappers used across the app ----------------------------

export const Webhooks = {
  // Inbox
  ticketListRequested: (p: WebhookPayload) => fireWebhook("ticketListRequested", p),
  ticketDetailsRequested: (p: WebhookPayload) => fireWebhook("ticketDetailsRequested", p),
  ticketReplySent: (p: WebhookPayload) => fireWebhook("ticketReplySent", p),
  ticketAiReplyGenerated: (p: WebhookPayload) => fireWebhook("ticketAiReplyGenerated", p),
  ticketStatusChanged: (p: WebhookPayload) => fireWebhook("ticketStatusChanged", p),
  ticketResolved: (p: WebhookPayload) => fireWebhook("ticketResolved", p),
  ticketEscalated: (p: WebhookPayload) => fireWebhook("ticketEscalated", p),
  ticketReclassified: (p: WebhookPayload) => fireWebhook("ticketReclassified", p),
  ticketKnowledgeGapDetected: (p: WebhookPayload) => fireWebhook("ticketKnowledgeGapDetected", p),
  ticketPersonaDetected: (p: WebhookPayload) => fireWebhook("ticketPersonaDetected", p),
  ticketLaneChanged: (p: WebhookPayload) => fireWebhook("ticketLaneChanged", p),
  // Knowledge
  knowledgeEntriesListed: (p: WebhookPayload) => fireWebhook("knowledgeEntriesListed", p),
  knowledgeSourcesListed: (p: WebhookPayload) => fireWebhook("knowledgeSourcesListed", p),
  knowledgeSourceSynced: (p: WebhookPayload) => fireWebhook("knowledgeSourceSynced", p),
  allKnowledgeSourcesSynced: (p: WebhookPayload) => fireWebhook("allKnowledgeSourcesSynced", p),
  knowledgeSyncStarted: (p: WebhookPayload) => fireWebhook("knowledgeSyncStarted", p),
  knowledgeSyncCompleted: (p: WebhookPayload) => fireWebhook("knowledgeSyncCompleted", p),
  knowledgeSyncFailed: (p: WebhookPayload) => fireWebhook("knowledgeSyncFailed", p),
  knowledgeEntryCreated: (p: WebhookPayload) => fireWebhook("knowledgeEntryCreated", p),
  knowledgeGapCreated: (p: WebhookPayload) => fireWebhook("knowledgeGapCreated", p),
  knowledgeGapResolved: (p: WebhookPayload) => fireWebhook("knowledgeGapResolved", p),
  knowledgeBaseSyncTriggered: (p: WebhookPayload) => fireWebhook("knowledgeBaseSyncTriggered", p),
  // Intelligence
  themeInsightsGenerated: (p: WebhookPayload) => fireWebhook("themeInsightsGenerated", p),
  personaBreakdownGenerated: (p: WebhookPayload) => fireWebhook("personaBreakdownGenerated", p),
  latestBriefFetched: (p: WebhookPayload) => fireWebhook("latestBriefFetched", p),
  intelligenceBriefRegenerated: (p: WebhookPayload) =>
    fireWebhook("intelligenceBriefRegenerated", p),
  briefGenerated: (p: WebhookPayload) => fireWebhook("briefGenerated", p),
  // Benchmark
  sentimentQuotesFetched: (p: WebhookPayload) => fireWebhook("sentimentQuotesFetched", p),
  externalSentimentSynced: (p: WebhookPayload) => fireWebhook("externalSentimentSynced", p),
  competitorBenchmarkFetched: (p: WebhookPayload) => fireWebhook("competitorBenchmarkFetched", p),
  benchmarkComparisonGenerated: (p: WebhookPayload) =>
    fireWebhook("benchmarkComparisonGenerated", p),
  sentimentRefreshTriggered: (p: WebhookPayload) => fireWebhook("sentimentRefreshTriggered", p),
  // AI
  aiQuestionAsked: (p: WebhookPayload) => fireWebhook("aiQuestionAsked", p),
  aiConversationContinued: (p: WebhookPayload) => fireWebhook("aiConversationContinued", p),
  aiResponseGenerated: (p: WebhookPayload) => fireWebhook("aiResponseGenerated", p),
  aiCitationAttached: (p: WebhookPayload) => fireWebhook("aiCitationAttached", p),
  aiConversationCreated: (p: WebhookPayload) => fireWebhook("aiConversationCreated", p),
  aiConversationArchived: (p: WebhookPayload) => fireWebhook("aiConversationArchived", p),
} as const;
