import { createFileRoute } from '@tanstack/react-router';
import { syncAllSources } from '@/lib/kb-sync.server';

export const Route = createFileRoute('/api/public/hooks/kb-sync')({
  server: {
    handlers: {
      POST: async () => {
        try {
          const results = await syncAllSources();
          return Response.json({ ok: true, results });
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return new Response(JSON.stringify({ ok: false, error: msg }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
          });
        }
      },
      GET: async () => Response.json({ ok: true, hint: 'POST to trigger sync' }),
    },
  },
});
