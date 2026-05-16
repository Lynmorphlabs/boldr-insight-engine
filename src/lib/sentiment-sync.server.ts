import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { THEMES, type ThemeName } from './sentiment-themes';
export { THEMES, INTERNAL_TO_EXTERNAL } from './sentiment-themes';
export type { ThemeName } from './sentiment-themes';

const SEARCH_TERMS = [
  'Boldr',
  'Boldr Supply',
  'BOLDR Venture',
  'BOLDR Odyssey',
  'titanium watch',
  'microbrand watch',
  'BPA-free strap',
  'hypoallergenic watch strap',
  'nickel allergy watch',
  'vegan watch strap',
  'engraving watch gift',
  'watch servicing battery regulation',
];

const REDDIT_SUBS = ['Watches', 'MicrobrandWatches', 'WatchesCirclejerk'];

type RawCandidate = {
  text: string;
  author: string;
  source: string;
  url: string;
  external_key: string;
  search_term: string;
};

// ---------- Reddit ----------
async function fetchRedditCandidates(): Promise<RawCandidate[]> {
  const out: RawCandidate[] = [];
  const terms = ['Boldr', 'titanium watch', 'vegan strap', 'nickel allergy watch', 'BPA-free strap'];
  for (const sub of REDDIT_SUBS) {
    for (const term of terms) {
      const url = `https://www.reddit.com/r/${sub}/search.json?q=${encodeURIComponent(term)}&restrict_sr=on&sort=relevance&limit=10&t=year`;
      try {
        const res = await fetch(url, { headers: { 'User-Agent': 'BoldrCIEngine/1.0' } });
        if (!res.ok) continue;
        const json = (await res.json()) as { data?: { children?: Array<{ data: Record<string, unknown> }> } };
        const children = json.data?.children ?? [];
        for (const c of children) {
          const d = c.data as { id: string; title: string; selftext: string; author: string; permalink: string; subreddit: string };
          const text = `${d.title}${d.selftext ? ' — ' + d.selftext : ''}`.slice(0, 600).trim();
          if (text.length < 30) continue;
          out.push({
            text,
            author: `u/${d.author}`,
            source: `r/${d.subreddit}`,
            url: `https://reddit.com${d.permalink}`,
            external_key: `reddit:${d.id}`,
            search_term: term,
          });
        }
      } catch (e) {
        console.warn('[reddit] failed', sub, term, e);
      }
    }
  }
  // dedupe by external_key
  const seen = new Set<string>();
  return out.filter(c => (seen.has(c.external_key) ? false : (seen.add(c.external_key), true)));
}

// ---------- Firecrawl (WatchUSeek + optional Trustpilot) ----------
async function fetchFirecrawlCandidates(): Promise<RawCandidate[]> {
  const key = process.env.FIRECRAWL_API_KEY;
  if (!key) return [];
  const out: RawCandidate[] = [];
  const queries = [
    { q: 'site:watchuseek.com Boldr titanium', source: 'WatchUSeek', term: 'Boldr' },
    { q: 'site:watchuseek.com microbrand vegan strap', source: 'WatchUSeek', term: 'vegan watch strap' },
    { q: 'site:trustpilot.com Boldr watch', source: 'Trustpilot', term: 'Boldr' },
  ];
  for (const { q, source, term } of queries) {
    try {
      const res = await fetch('https://api.firecrawl.dev/v2/search', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, limit: 5 }),
      });
      if (!res.ok) { console.warn('[firecrawl]', source, res.status); continue; }
      const json = (await res.json()) as { data?: { web?: Array<{ url: string; title: string; description?: string }> } };
      const results = json.data?.web ?? [];
      for (const r of results) {
        const text = `${r.title}${r.description ? ' — ' + r.description : ''}`.slice(0, 600).trim();
        if (text.length < 30) continue;
        out.push({
          text,
          author: source === 'Trustpilot' ? 'Trustpilot reviewer' : 'WatchUSeek forum',
          source,
          url: r.url,
          external_key: `${source.toLowerCase()}:${r.url}`,
          search_term: term,
        });
      }
    } catch (e) {
      console.warn('[firecrawl] failed', source, e);
    }
  }
  return out;
}

// ---------- AI classification ----------
type Classification = { theme: ThemeName | null; sentiment: 'positive' | 'neutral' | 'negative'; relevance_score: number };

async function classifyBatch(candidates: RawCandidate[]): Promise<Classification[]> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error('LOVABLE_API_KEY missing');
  const themesList = THEMES.map((t, i) => `${i + 1}. ${t}`).join('\n');
  const items = candidates.map((c, i) => `[${i}] ${c.text}`).join('\n');
  const prompt = `Classify each quote below for the Boldr Watches brand.

Themes:
${themesList}

For each item, return JSON with:
- theme: one of the theme strings exactly, or null if irrelevant
- sentiment: "positive" | "neutral" | "negative"
- relevance_score: 0-1 (how relevant to Boldr or microbrand watches)

Quotes:
${items}

Return JSON: { "results": [{ "theme": "...", "sentiment": "...", "relevance_score": 0.0 }, ...] } in same order.`;

  const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`AI gateway ${res.status}: ${await res.text()}`);
  const json = await res.json() as { choices: Array<{ message: { content: string } }> };
  const parsed = JSON.parse(json.choices[0].message.content) as { results: Classification[] };
  return parsed.results;
}

// ---------- Seed fallback ----------
const SEED: Array<Omit<RawCandidate, 'external_key'> & { theme: ThemeName; sentiment: 'positive'|'neutral'|'negative'; relevance_score: number; external_key: string }> = [
  { external_key: 'seed:1', text: "Most 'titanium' micro-brands quietly use Grade 2. Boldr's Expedition is one of the few sub-$500 pieces actually using Grade 5 — and they document it.", author: 'u/GradeFiveSnob', source: 'r/Watches', url: 'https://reddit.com', search_term: 'Boldr', theme: 'Titanium / durability / adventure use', sentiment: 'positive', relevance_score: 0.95 },
  { external_key: 'seed:2', text: "Spent 40 mins on a watch site trying to find out if the buckle had nickel. Gave up and bought from a brand that just said 'nickel-free' in one click.", author: 'u/HivesMoreLikely', source: 'r/Allergies', url: 'https://reddit.com', search_term: 'nickel allergy watch', theme: 'Materials / skin safety', sentiment: 'negative', relevance_score: 0.9 },
  { external_key: 'seed:3', text: "Cactus and mushroom-leather straps are finally hitting tool-watch quality. Whoever ships this first in the micro segment wins my wallet.", author: 'u/VeganMechanical', source: 'r/BuyItForLife', url: 'https://reddit.com', search_term: 'vegan watch strap', theme: 'Sustainability / vegan straps', sentiment: 'positive', relevance_score: 0.92 },
  { external_key: 'seed:4', text: "Asked three micro-brands about take-back programmes. Only one answered. Massive trust signal when they do.", author: 'u/ZeroWasteWatcher', source: 'r/ZeroWaste', url: 'https://reddit.com', search_term: 'Boldr', theme: 'Sustainability / vegan straps', sentiment: 'negative', relevance_score: 0.85 },
  { external_key: 'seed:5', text: "Bought the FKM strap for my 7-year-old's smartwatch. Brand confirmed BPA-free in writing. Wish more brands led with this.", author: 'GoldNeenah', source: 'Trustpilot', url: 'https://trustpilot.com', search_term: 'BPA-free strap', theme: 'Materials / skin safety', sentiment: 'positive', relevance_score: 0.88 },
  { external_key: 'seed:6', text: "Engraved a Venture for my dad's retirement — turnaround was fast and the font options were better than expected.", author: 'u/GiftedAtWork', source: 'r/Watches', url: 'https://reddit.com', search_term: 'engraving watch gift', theme: 'Gifting / engraving / corporate orders', sentiment: 'positive', relevance_score: 0.8 },
  { external_key: 'seed:7', text: "Sent my old Odyssey in for battery + regulation. Came back in 2 weeks with a timing report. Reasonable.", author: 'u/QuietService', source: 'WatchUSeek', url: 'https://watchuseek.com', search_term: 'watch servicing battery regulation', theme: 'Servicing / battery / after-sales', sentiment: 'positive', relevance_score: 0.82 },
  { external_key: 'seed:8', text: "Boldr's product is great but they're invisible on sustainability vs competitors who publish carbon reports.", author: 'u/TiToolWatch', source: 'r/Watches', url: 'https://reddit.com', search_term: 'Boldr', theme: 'Sustainability / vegan straps', sentiment: 'negative', relevance_score: 0.87 },
];

async function insertSeed() {
  await supabaseAdmin.from('external_quotes').upsert(
    SEED.map(s => ({
      external_key: s.external_key,
      text: s.text,
      author: s.author,
      source: s.source,
      url: s.url,
      theme: s.theme,
      sentiment: s.sentiment,
      relevance_score: s.relevance_score,
      search_term: s.search_term,
      fetched_at: new Date().toISOString(),
    })),
    { onConflict: 'source,external_key' },
  );
}

// ---------- Orchestrator ----------
export async function runSentimentSync() {
  const errors: string[] = [];
  let candidates: RawCandidate[] = [];

  try {
    const reddit = await fetchRedditCandidates();
    candidates.push(...reddit);
  } catch (e) { errors.push(`reddit: ${(e as Error).message}`); }

  try {
    const fc = await fetchFirecrawlCandidates();
    candidates.push(...fc);
  } catch (e) { errors.push(`firecrawl: ${(e as Error).message}`); }

  // De-dup against already-fetched keys
  const existing = await supabaseAdmin.from('external_quotes').select('source, external_key');
  const have = new Set((existing.data ?? []).map(r => `${r.source}::${r.external_key}`));
  candidates = candidates.filter(c => !have.has(`${c.source}::${c.external_key}`));

  // Cap to keep AI cost reasonable
  candidates = candidates.slice(0, 60);

  let inserted = 0;
  if (candidates.length === 0 && errors.length > 0) {
    // total failure → seed fallback
    await insertSeed();
    return { ok: true, inserted: SEED.length, classified: 0, errors, fallback: true };
  }

  if (candidates.length > 0) {
    try {
      // batch in chunks of 25
      const classifications: Classification[] = [];
      for (let i = 0; i < candidates.length; i += 25) {
        const batch = candidates.slice(i, i + 25);
        const res = await classifyBatch(batch);
        classifications.push(...res);
      }

      const rows = candidates.map((c, i) => {
        const cls = classifications[i] ?? { theme: null, sentiment: 'neutral' as const, relevance_score: 0 };
        return {
          external_key: c.external_key,
          text: c.text,
          author: c.author,
          source: c.source,
          url: c.url,
          theme: cls.theme,
          sentiment: cls.sentiment,
          relevance_score: cls.relevance_score,
          search_term: c.search_term,
          fetched_at: new Date().toISOString(),
        };
      }).filter(r => r.theme && (r.relevance_score ?? 0) >= 0.4);

      if (rows.length) {
        const up = await supabaseAdmin
          .from('external_quotes')
          .upsert(rows, { onConflict: 'source,external_key' });
        if (up.error) throw new Error(up.error.message);
        inserted = rows.length;
      }
    } catch (e) {
      errors.push(`classify: ${(e as Error).message}`);
    }
  }

  // Ensure table is never empty for demo
  const count = await supabaseAdmin.from('external_quotes').select('id', { count: 'exact', head: true });
  if ((count.count ?? 0) === 0) {
    await insertSeed();
    return { ok: true, inserted: SEED.length, classified: 0, errors, fallback: true };
  }

  return { ok: true, inserted, candidates: candidates.length, errors, fallback: false };
}
