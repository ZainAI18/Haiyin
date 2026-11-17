create table public.docking_terms (
  slug text primary key check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and payload ? 'slug' and payload->>'slug' = slug)
);
alter table public.docking_terms enable row level security;
revoke all on public.docking_terms from anon, authenticated;
grant select on public.docking_terms to anon, authenticated;
create policy "Public study catalog" on public.docking_terms for select to anon, authenticated using (true);
