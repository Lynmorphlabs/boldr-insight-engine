import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { tickets, themesNew, type Persona } from '@/data';

const THEME_KEYWORDS: Record<string, string[]> = {
  'Titanium Safety': ['titanium', 'grade 2', 'grade 5', 'magnetic', 'gauss'],
  'Nickel Allergy': ['nickel', 'allergy', 'allergic', 'rash', 'hypoallergenic', 'skin react'],
  'BPA-Free Straps': ['bpa', 'fkm', 'silicone', 'rubber strap'],
  'Sustainability': ['sustain', 'eco', 'carbon', 'recycl', 'packaging', 'environment'],
  'Vegan Straps': ['vegan', 'leather alternative', 'cactus', 'mushroom leather', 'synthetic strap'],
};

export type ThemeCluster = {
  id: string;
  name: string;
  internalCount: number;
  dominantPersona: Persona;
  trend: 'up' | 'down' | 'flat';
  trendPct: number;
  ticketIds: string[];
};

export function computeThemeClusters(): ThemeCluster[] {
  return themesNew.map((th) => {
    const kws = THEME_KEYWORDS[th.name] ?? [th.name.toLowerCase()];
    const matched = tickets.filter((t) => {
      const hay = `${t.subject} ${t.body}`.toLowerCase();
      return kws.some((k) => hay.includes(k.toLowerCase()));
    });
    // Dominant persona among matched tickets (exclude "—")
    const counts = new Map<Persona, number>();
    for (const t of matched) {
      if (t.persona && t.persona !== '—') {
        counts.set(t.persona, (counts.get(t.persona) ?? 0) + 1);
      }
    }
    let dominant: Persona = th.name === 'Sustainability' || th.name === 'Vegan Straps'
      ? 'Sustainability Advocate'
      : th.name === 'Titanium Safety' ? 'Enthusiast / Collector'
      : 'Health-Conscious Buyer';
    let max = 0;
    for (const [p, c] of counts) if (c > max) { max = c; dominant = p; }

    // Trend: this half vs previous half by date ordering — fall back to seed direction
    const sorted = matched
      .map((t) => ({ id: t.id, ts: new Date(t.date).getTime() }))
      .filter((x) => !Number.isNaN(x.ts))
      .sort((a, b) => a.ts - b.ts);
    let trend: 'up' | 'down' | 'flat' = 'flat';
    let trendPct = 0;
    if (sorted.length >= 4) {
      const mid = Math.floor(sorted.length / 2);
      const prev = mid;
      const curr = sorted.length - mid;
      const delta = curr - prev;
      if (delta > 0) { trend = 'up'; trendPct = Math.round((delta / Math.max(prev, 1)) * 100); }
      else if (delta < 0) { trend = 'down'; trendPct = Math.round((-delta / Math.max(prev, 1)) * 100); }
    } else if (matched.length > 0) {
      trend = 'up';
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

type BriefItem = {
  theme: string;
  personas: Persona[];
  gap: string;
  action: string;
};

export type GeneratedBrief = {
  id: string;
  month: string;
  title: string;
  intro: string;
  items: BriefItem[];
  generated_at: string;
};

export async function getLatestBriefRow(): Promise<GeneratedBrief | null> {
  const { data, error } = await supabaseAdmin
    .from('monthly_briefs')
    .select('id, month, title, intro, items, generated_at')
    .order('generated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return { ...data, items: (data.items as unknown as BriefItem[]) ?? [] };
}

export async function generateAndStoreBrief(): Promise<GeneratedBrief> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error('LOVABLE_API_KEY missing');

  const clusters = computeThemeClusters();
  const gapTickets = tickets.filter((t) => t.isKnowledgeGap).slice(0, 12);

  const { data: quotesRows } = await supabaseAdmin
    .from('external_quotes')
    .select('text, source, theme, sentiment, relevance_score')
    .order('relevance_score', { ascending: false })
    .limit(30);
  const quotes = quotesRows ?? [];

  const month = new Date().toLocaleString('en-GB', { month: 'long', year: 'numeric' });

  const prompt = `You are a marketing analyst writing the Boldr Watches Monthly Marketing Brief for ${month}.
The brief headline output is: "what customers are asking that is NOT well-addressed on Boldr product pages".

Live signal:

THEME CLUSTERS (computed from internal tickets):
${clusters.map((c) => `- ${c.name}: ${c.internalCount} tickets · dominant persona: ${c.dominantPersona} · trend ${c.trend} ${c.trendPct}%`).join('\n')}

KNOWLEDGE GAPS (recent tickets with no KB match — direct evidence of PDP/FAQ gaps):
${gapTickets.map((t) => `- ${t.id} [${t.persona}] "${t.subject}" — ${t.body.slice(0, 140)}`).join('\n')}

EXTERNAL QUOTES (top relevance, from Reddit / WatchUSeek / Trustpilot):
${quotes.slice(0, 15).map((q) => `- [${q.source} · ${q.theme} · ${q.sentiment}] "${(q.text ?? '').slice(0, 180)}"`).join('\n')}

Return a JSON object with this exact shape:
{
  "title": "one punchy headline, max 90 chars",
  "intro": "2-3 sentence executive summary tying internal tickets to external sentiment",
  "items": [
    {
      "theme": "<one of: Titanium Safety, Nickel Allergy, BPA-Free Straps, Sustainability, Vegan Straps>",
      "personas": ["<persona names from: Health-Conscious Buyer, Gifter, Enthusiast / Collector, Active / Outdoor Buyer, Sustainability Advocate>"],
      "gap": "1-2 sentence description of what customers ask that PDP/FAQ does not answer well — grounded in the evidence above",
      "action": "1-2 sentence concrete recommendation for marketing/product to close the gap"
    }
  ]
}

Pick the 4 strongest themes. Be concrete and reference real signal (e.g. "5 tickets + 8:1 external ratio"). Return ONLY JSON.`;

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
  const json = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  const parsed = JSON.parse(json.choices[0].message.content) as {
    title: string; intro: string; items: BriefItem[];
  };

  const insert = await supabaseAdmin
    .from('monthly_briefs')
    .insert({
      month,
      title: parsed.title,
      intro: parsed.intro,
      items: parsed.items,
    })
    .select('id, month, title, intro, items, generated_at')
    .single();
  if (insert.error) throw new Error(insert.error.message);
  return { ...insert.data, items: (insert.data.items as unknown as BriefItem[]) ?? [] };
}
