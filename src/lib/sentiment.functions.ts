import { createServerFn } from '@tanstack/react-start';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { runSentimentSync } from './sentiment-sync.server';

export const syncExternalSentiment = createServerFn({ method: 'POST' }).handler(async () => {
  return await runSentimentSync();
});

export const getExternalQuotes = createServerFn({ method: 'GET' }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from('external_quotes')
    .select('id, text, author, source, url, theme, sentiment, relevance_score, search_term, fetched_at')
    .order('fetched_at', { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return { quotes: data ?? [] };
});
