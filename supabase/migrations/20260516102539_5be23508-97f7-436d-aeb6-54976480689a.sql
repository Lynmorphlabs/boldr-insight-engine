
-- Sources: one row per KB section that maps to a Drive file
CREATE TABLE public.kb_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('doc','sheet')),
  drive_url TEXT,
  drive_file_id TEXT,
  last_synced_at TIMESTAMPTZ,
  last_status TEXT CHECK (last_status IN ('ok','error','syncing','idle')) DEFAULT 'idle',
  last_error TEXT,
  entries_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Entries pulled from Drive (kept separate from seeded demo entries)
CREATE TABLE public.kb_synced_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.kb_sources(id) ON DELETE CASCADE,
  external_key TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_id, external_key)
);

CREATE INDEX idx_kb_synced_entries_source ON public.kb_synced_entries(source_id);

-- Audit log of every sync
CREATE TABLE public.kb_sync_runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID REFERENCES public.kb_sources(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL,
  added INTEGER NOT NULL DEFAULT 0,
  removed INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  error TEXT
);

CREATE INDEX idx_kb_sync_runs_source ON public.kb_sync_runs(source_id, started_at DESC);

-- RLS: public read, no public write (server functions use admin client)
ALTER TABLE public.kb_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_synced_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kb_sync_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read kb_sources" ON public.kb_sources FOR SELECT USING (true);
CREATE POLICY "Public can read kb_synced_entries" ON public.kb_synced_entries FOR SELECT USING (true);
CREATE POLICY "Public can read kb_sync_runs" ON public.kb_sync_runs FOR SELECT USING (true);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.kb_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER trg_kb_sources_updated
BEFORE UPDATE ON public.kb_sources
FOR EACH ROW EXECUTE FUNCTION public.kb_touch_updated_at();

-- Seed the 5 source slots
INSERT INTO public.kb_sources (slug, name, kind, sort_order) VALUES
  ('product-reference', 'Product Reference', 'doc',   1),
  ('faq',               'FAQ',                'sheet', 2),
  ('sop',               'SOP',                'sheet', 3),
  ('engraving',         'Engraving Rate Card','doc',   4),
  ('servicing',         'Servicing Rate Card','doc',   5);
