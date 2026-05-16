import { createServerFn } from '@tanstack/react-start';
import { syncAllSources, syncSource } from './kb-sync.server';
import { supabaseAdmin } from '@/integrations/supabase/client.server';
import { z } from 'zod';

type SyncOutcome = { ok: boolean; added?: number; removed?: number; total?: number; error?: string };

export const triggerKbSyncAll = createServerFn({ method: 'POST' }).handler(async () => {
  const results = await syncAllSources();
  return results as Record<string, SyncOutcome>;
});

export const triggerKbSyncOne = createServerFn({ method: 'POST' })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(64) }).parse(input))
  .handler(async ({ data }) => {
    const { data: src, error } = await supabaseAdmin
      .from('kb_sources')
      .select('id, slug, kind, drive_file_id')
      .eq('slug', data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!src) throw new Error('Source not found');
    return await syncSource(src as { id: string; slug: string; kind: string; drive_file_id: string | null });
  });
