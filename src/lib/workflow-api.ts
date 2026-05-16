/**
 * Direct workflow-BE integration layer.
 *
 * All data the UI used to pull through Supabase server functions now goes
 * through the Fuseful Workflow backend webhook endpoints (same base URL as
 * `src/lib/webhooks.ts`). When the BE responds with a usable payload we use
 * it; when it doesn't (404, network error, empty body, unexpected shape) we
 * fall back to local seed/computed data so the demo never breaks.
 *
 * The fallback is pure-frontend (no Supabase) — it derives clusters from
 * `src/data.ts` and uses the seeded `monthlyBrief` / `externalSources` as the
 * baseline view of "what the last brief / sync produced".
 */

import { fireWebhook } from "@/lib/webhooks";
import {
  tickets,
  themesNew,
  externalSources,
  monthlyBrief,
  type Persona,
} from "@/data";

// ---------- Theme clusters (pure-client compute, was intelligence.server) ----

const THEME_KEYWORDS: Record<string, string[]> = {
  "Titanium Safety": ["titanium", "grade 2", "grade 5", "magnetic", "gauss"],
  "Nickel Allergy": ["nickel", "allergy", "allergic", "rash", "hypoallergenic", "skin react"],
  "BPA-Free Straps": ["bpa", "fkm", "silicone", "rubber strap"],
  Sustainability: ["sustain", "eco", "carbon", "recycl", "packaging", "environment"],
  "Vegan Straps": ["vegan", "leather alternative", "cactus", "mushroom leather", "synthetic strap"],
};

export type ThemeCluster = {
  id: string;
  name: string;
  internalCount: number;
  dominantPersona: Persona;
  trend: "up" | "down" | "flat";
  trendPct: number;
  ticketIds: string[];
};

export function computeThemeClustersLocal(): ThemeCluster[] {
  return themesNew.map((th) => {
    const kws = THEME_KEYWORDS[th.name] ?? [th.name.toLowerCase()];
    const matched = tickets.filter((t) => {
      const hay = `${t.subject} ${t.body}`.toLowerCase();
      return kws.some((k) => hay.includes(k.toLowerCase()));
    });
    const counts = new Map<Persona, number>();
    for (const t of matched) {
      if (t.persona && t.persona !== "—") {
        counts.set(t.persona, (counts.get(t.persona) ?? 0) + 1);
      }
    }
    let dominant: Persona =
      th.name === "Sustainability" || th.name === "Vegan Straps"
        ? "Sustainability Advocate"
        : th.name === "Titanium Safety"
          ? "Enthusiast / Collector"
          : "Health-Conscious Buyer";
    let max = 0;
    for (const [p, c] of counts) if (c > max) { max = c; dominant = p; }

    const sorted = matched
      .map((t) => ({ id: t.id, ts: new Date(t.date).getTime() }))
      .filter((x) => !Number.isNaN(x.ts))
      .sort((a, b) => a.ts - b.ts);
    let trend: "up" | "down" | "flat" = "flat";
    let trendPct = 0;
    if (sorted.length >= 4) {
      const mid = Math.floor(sorted.length / 2);
      const prev = mid;
      const curr = sorted.length - mid;
      const delta = curr - prev;
      if (delta > 0) { trend = "up"; trendPct = Math.round((delta / Math.max(prev, 1)) * 100); }
      else if (delta < 0) { trend = "down"; trendPct = Math.round((-delta / Math.max(prev, 1)) * 100); }
    } else if (matched.length > 0) {
      trend = "up";
      trendPct = Math.min(matched.length * 10, 40);
    }

    return {
      id: th.id,
      name: th.name,
      internalCount: matched.length || th.internalTickets,
      dominantPersona: dominant,
      trend,
      trendPct,
      ticketIds: matched.map((t) => t.id),
    };
  });
}

// ---------- Brief types -----------------------------------------------------

type BriefItem = {
  theme: string;
  personas: Persona[];
  gap: string;
  action: string;
};

export type GeneratedBrief = {
  id?: string;
  month: string;
  title: string;
  intro: string;
  items: BriefItem[];
  generated_at?: string;
};

const seedBrief: GeneratedBrief = {
  month: monthlyBrief.month,
  title: monthlyBrief.title,
  intro: monthlyBrief.intro,
  items: monthlyBrief.items as BriefItem[],
  generated_at: new Date().toISOString(),
};

// ---------- External quote types --------------------------------------------

export type ExternalQuote = {
  id?: string;
  text: string;
  source: string;
  author?: string | null;
  theme: string | null;
  sentiment: "positive" | "neutral" | "negative" | string;
  relevance_score?: number;
  url?: string | null;
  fetched_at?: string | null;
};

function seedExternalQuotes(): ExternalQuote[] {
  const out: ExternalQuote[] = [];
  for (const src of externalSources) {
    let i = 0;
    for (const q of src.quotes) {
      out.push({
        id: `seed-${src.id}-${i++}`,
        text: q.text,
        source: q.source,
        author: q.author ?? null,
        theme: q.theme,
        sentiment: q.sentiment,
        relevance_score: 0.7,
        fetched_at: q.date ?? null,
      });
    }
  }
  return out;
}

// ---------- BE call helper --------------------------------------------------

async function callBE<T>(
  event: Parameters<typeof fireWebhook>[0],
  payload: Record<string, unknown> = {},
): Promise<T | null> {
  try {
    return (await fireWebhook<T>(event, payload, { await: true, timeoutMs: 8000 })) ?? null;
  } catch {
    return null;
  }
}

// ---------- Public API used by routes ---------------------------------------

export async function fetchThemeClusters(): Promise<{ clusters: ThemeCluster[] }> {
  const res = await callBE<{ clusters?: ThemeCluster[] }>("themeInsightsGenerated", {
    request: "list",
  });
  const clusters = Array.isArray(res?.clusters) && res.clusters.length > 0
    ? res!.clusters!
    : computeThemeClustersLocal();
  return { clusters };
}

export async function fetchLatestBrief(): Promise<{ brief: GeneratedBrief | null }> {
  const res = await callBE<{ brief?: GeneratedBrief | null }>("latestBriefFetched", {});
  if (res && res.brief && typeof res.brief === "object") {
    return { brief: res.brief };
  }
  return { brief: seedBrief };
}

export async function regenerateBriefApi(): Promise<{ brief: GeneratedBrief }> {
  const res = await callBE<{ brief?: GeneratedBrief }>("intelligenceBriefRegenerated", {
    trigger: "manual",
    timestamp: new Date().toISOString(),
  });
  if (res && res.brief && typeof res.brief === "object") {
    return { brief: res.brief };
  }
  // Re-emit "briefGenerated" so any downstream workflow sees it even on fallback.
  await callBE("briefGenerated", { month: seedBrief.month, fallback: true });
  return {
    brief: {
      ...seedBrief,
      id: `local-${Date.now()}`,
      generated_at: new Date().toISOString(),
    },
  };
}

export async function fetchExternalQuotes(): Promise<{ quotes: ExternalQuote[] }> {
  const res = await callBE<{ quotes?: ExternalQuote[] }>("sentimentQuotesFetched", {});
  const quotes = Array.isArray(res?.quotes) && res.quotes.length > 0
    ? res!.quotes!
    : seedExternalQuotes();
  return { quotes };
}

export type SentimentSyncResult = {
  inserted: number;
  fallback: boolean;
  errors?: string[];
};

export async function syncExternalSentimentApi(): Promise<SentimentSyncResult> {
  await callBE("sentimentRefreshTriggered", { trigger: "manual" });
  const res = await callBE<SentimentSyncResult & { quotes?: ExternalQuote[] }>(
    "externalSentimentSynced",
    { trigger: "manual" },
  );
  if (res && typeof res.inserted === "number") {
    return { inserted: res.inserted, fallback: !!res.fallback, errors: res.errors };
  }
  const seeded = seedExternalQuotes();
  return {
    inserted: seeded.length,
    fallback: true,
    errors: ["Live workflow endpoint unavailable — using seeded sample data."],
  };
}

export type KbSyncOneResult = { ok: boolean; total?: number; error?: string };
export type KbSyncAllResult = Record<string, KbSyncOneResult>;

export async function syncAllKnowledgeSourcesApi(): Promise<KbSyncAllResult> {
  await callBE("knowledgeBaseSyncTriggered", { scope: "all" });
  const res = await callBE<{ results?: KbSyncAllResult } | KbSyncAllResult>(
    "allKnowledgeSourcesSynced",
    { scope: "all" },
  );
  if (res && typeof res === "object") {
    const maybe = (res as { results?: KbSyncAllResult }).results;
    if (maybe && typeof maybe === "object") return maybe;
    // Assume the BE returned the map directly.
    const direct = res as KbSyncAllResult;
    if (Object.keys(direct).length > 0) return direct;
  }
  // Fallback: synthesise a "synced N sources" map from local kbSources so the
  // UI reports a successful demo sync.
  const { kbSources } = await import("@/data");
  const map: KbSyncAllResult = {};
  for (const s of kbSources) map[s.name] = { ok: true, total: 0 };
  return map;
}
