
create table public.monthly_briefs (
  id uuid primary key default gen_random_uuid(),
  month text not null,
  title text not null,
  intro text not null,
  items jsonb not null default '[]'::jsonb,
  generated_at timestamptz not null default now()
);

alter table public.monthly_briefs enable row level security;

create policy "Public can read monthly_briefs"
  on public.monthly_briefs for select
  to public using (true);

create index monthly_briefs_generated_at_idx on public.monthly_briefs (generated_at desc);
