
ALTER TABLE public.kb_synced_entries
  ALTER COLUMN question DROP NOT NULL,
  ALTER COLUMN answer DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS data jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS kb_synced_entries_source_key_idx
  ON public.kb_synced_entries (source_id, external_key);
