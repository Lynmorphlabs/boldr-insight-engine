
CREATE TABLE public.external_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author text,
  source text NOT NULL,
  url text,
  theme text,
  sentiment text CHECK (sentiment IN ('positive','neutral','negative')),
  relevance_score numeric,
  search_term text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  external_key text NOT NULL,
  UNIQUE (source, external_key)
);

ALTER TABLE public.external_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read external_quotes"
  ON public.external_quotes FOR SELECT
  USING (true);

CREATE INDEX idx_external_quotes_theme ON public.external_quotes(theme);
CREATE INDEX idx_external_quotes_fetched_at ON public.external_quotes(fetched_at DESC);
