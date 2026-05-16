import { supabaseAdmin } from '@/integrations/supabase/client.server';
import type { Json } from '@/integrations/supabase/types';

type SourceRow = {
  id: string;
  slug: string;
  kind: string;
  drive_file_id: string | null;
};

type Entry = {
  external_key: string;
  title: string | null;
  question: string | null;
  answer: string | null;
  category: string | null;
  data: Json | null;
};

// --- CSV parser (handles quoted fields, embedded commas, escaped quotes) ---
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { cur.push(field); field = ''; }
      else if (c === '\n') { cur.push(field); rows.push(cur); cur = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else field += c;
    }
  }
  if (field.length || cur.length) { cur.push(field); rows.push(cur); }
  return rows.filter(r => r.some(c => c.trim().length > 0));
}

function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const [header, ...body] = rows;
  return body.map(r => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? '').trim()])));
}

// --- Per-source parsers ---
function parseRateCard(text: string, slug: string): Entry[] {
  const objs = rowsToObjects(parseCsv(text));
  return objs.map((row, idx) => {
    const firstKey = Object.keys(row)[0];
    const title = row[firstKey];
    return {
      external_key: `${slug}-${idx + 1}`,
      title,
      question: null,
      answer: null,
      category: 'rate_card',
      data: row,
    };
  });
}

function parseCustomerTickets(text: string): Entry[] {
  const objs = rowsToObjects(parseCsv(text));
  return objs.map((row, idx) => ({
    external_key: row.ticket_id || `ticket-${idx + 1}`,
    title: row.subject || row.ticket_id || `Ticket ${idx + 1}`,
    question: row.message_body || null,
    answer: row.agent_notes || null,
    category: row.question_type || 'ticket',
    data: row,
  }));
}

function parseFaq(text: string): Entry[] {
  // Match "Q: ... A: ..." pairs (Q/A can span until the next Q: or end)
  const entries: Entry[] = [];
  const regex = /Q:\s*([\s\S]*?)\s*A:\s*([\s\S]*?)(?=\s*Q:|$)/g;
  let m: RegExpExecArray | null;
  let idx = 0;
  let category: string | null = null;
  // Detect category from headings (lines without Q:/A: that aren't blank)
  const lines = text.split('\n');
  const cats: { line: number; cat: string }[] = [];
  lines.forEach((l, i) => {
    const t = l.trim();
    if (t && !t.startsWith('Q:') && !t.startsWith('A:') && t.length < 60 && !t.includes('?') && !/^(Boldr|Last updated|Maintained)/i.test(t)) {
      cats.push({ line: i, cat: t });
    }
  });
  while ((m = regex.exec(text)) !== null) {
    const question = m[1].replace(/\s+/g, ' ').trim();
    const answer = m[2].replace(/\s+/g, ' ').trim();
    if (!question) continue;
    // Find which category this Q belongs to by line position
    const charIdx = m.index;
    const lineNum = text.slice(0, charIdx).split('\n').length - 1;
    const matchedCat = [...cats].reverse().find(c => c.line < lineNum);
    category = matchedCat?.cat ?? category;
    entries.push({
      external_key: `faq-${++idx}`,
      title: question.slice(0, 120),
      question,
      answer,
      category,
      data: null,
    });
  }
  return entries;
}

function parseSop(text: string): Entry[] {
  // Split by top-level numbered headings: "1. Overview", "2. Reference..."
  const entries: Entry[] = [];
  const parts = text.split(/\n(?=\d{1,2}\.\s+[A-Z])/);
  parts.forEach((part, idx) => {
    const trimmed = part.trim();
    if (!trimmed) return;
    const firstLine = trimmed.split('\n')[0].trim();
    const headingMatch = firstLine.match(/^(\d{1,2})\.\s+(.+)$/);
    if (!headingMatch && idx === 0) return; // skip preamble
    const title = headingMatch ? headingMatch[2] : firstLine.slice(0, 80);
    const key = headingMatch ? `sop-${headingMatch[1]}` : `sop-intro`;
    entries.push({
      external_key: key,
      title,
      question: null,
      answer: trimmed,
      category: 'sop',
      data: null,
    });
  });
  return entries;
}

function parseProductReference(text: string): Entry[] {
  // Split by product header lines containing "SKU:"
  const entries: Entry[] = [];
  const lines = text.split('\n');
  let current: { header: string; body: string[] } | null = null;
  const flush = (idx: number) => {
    if (!current) return;
    const skuMatch = current.header.match(/SKU:\s*([A-Z0-9-]+)/i);
    const nameMatch = current.header.split('|')[0].trim();
    const priceMatch = current.header.match(/SGD\s*([\d.,]+)/i);
    entries.push({
      external_key: skuMatch ? skuMatch[1] : `product-${idx}`,
      title: nameMatch || current.header.slice(0, 80),
      question: null,
      answer: current.body.join('\n').trim(),
      category: 'product',
      data: {
        sku: skuMatch?.[1] ?? null,
        name: nameMatch,
        price_sgd: priceMatch?.[1] ?? null,
        raw: current.header,
      },
    });
  };
  let counter = 0;
  for (const line of lines) {
    if (/SKU:\s*[A-Z0-9-]+/i.test(line)) {
      flush(counter);
      counter++;
      current = { header: line.trim(), body: [] };
    } else if (current) {
      current.body.push(line);
    }
  }
  flush(counter);
  return entries;
}

// --- Fetch + dispatch ---
async function fetchExport(source: SourceRow): Promise<string> {
  if (!source.drive_file_id) throw new Error('No drive_file_id');
  const url = source.kind === 'sheet'
    ? `https://docs.google.com/spreadsheets/d/${source.drive_file_id}/export?format=csv`
    : `https://docs.google.com/document/d/${source.drive_file_id}/export?format=txt`;
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const text = await res.text();
  if (text.startsWith('<!DOCTYPE') || text.includes('<html')) {
    throw new Error('Got HTML — file is not publicly accessible');
  }
  return text;
}

function parseForSlug(slug: string, text: string): Entry[] {
  switch (slug) {
    case 'engraving':
    case 'servicing': return parseRateCard(text, slug);
    case 'customer-ticket': return parseCustomerTickets(text);
    case 'faq': return parseFaq(text);
    case 'sop': return parseSop(text);
    case 'product-reference': return parseProductReference(text);
    default: return [];
  }
}

export async function syncSource(source: SourceRow) {
  const runIns = await supabaseAdmin
    .from('kb_sync_runs')
    .insert({ source_id: source.id, status: 'running' })
    .select('id')
    .single();
  if (runIns.error || !runIns.data) throw new Error(runIns.error?.message);
  const runId = runIns.data.id;

  try {
    const text = await fetchExport(source);
    const entries = parseForSlug(source.slug, text);

    // Get existing keys to compute removed count
    const existing = await supabaseAdmin
      .from('kb_synced_entries')
      .select('external_key')
      .eq('source_id', source.id);
    const existingKeys = new Set((existing.data ?? []).map(r => r.external_key));
    const newKeys = new Set(entries.map(e => e.external_key));
    const toDelete = [...existingKeys].filter(k => !newKeys.has(k));
    const added = [...newKeys].filter(k => !existingKeys.has(k)).length;

    if (entries.length) {
      const upsert = await supabaseAdmin
        .from('kb_synced_entries')
        .upsert(
          entries.map(e => ({ ...e, source_id: source.id, synced_at: new Date().toISOString() })),
          { onConflict: 'source_id,external_key' }
        );
      if (upsert.error) throw new Error(upsert.error.message);
    }

    let removed = 0;
    if (toDelete.length) {
      const del = await supabaseAdmin
        .from('kb_synced_entries')
        .delete()
        .eq('source_id', source.id)
        .in('external_key', toDelete);
      if (del.error) throw new Error(del.error.message);
      removed = toDelete.length;
    }

    await supabaseAdmin.from('kb_sync_runs').update({
      status: 'success',
      finished_at: new Date().toISOString(),
      added, removed, total: entries.length,
    }).eq('id', runId);

    await supabaseAdmin.from('kb_sources').update({
      last_synced_at: new Date().toISOString(),
      last_status: 'success',
      last_error: null,
      entries_count: entries.length,
    }).eq('id', source.id);

    return { ok: true, added, removed, total: entries.length };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabaseAdmin.from('kb_sync_runs').update({
      status: 'error', finished_at: new Date().toISOString(), error: msg,
    }).eq('id', runId);
    await supabaseAdmin.from('kb_sources').update({
      last_status: 'error', last_error: msg,
    }).eq('id', source.id);
    return { ok: false, error: msg };
  }
}

export async function syncAllSources() {
  const { data, error } = await supabaseAdmin
    .from('kb_sources')
    .select('id, slug, kind, drive_file_id')
    .not('drive_file_id', 'is', null);
  if (error) throw new Error(error.message);
  const results: Record<string, unknown> = {};
  for (const src of data ?? []) {
    results[src.slug] = await syncSource(src as SourceRow);
  }
  return results;
}
