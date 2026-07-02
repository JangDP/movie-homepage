-- CineScope home visitor counter
-- Run once in Supabase SQL Editor.

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  page_path text not null default '/',
  visit_date date not null default ((now() at time zone 'Asia/Seoul')::date),
  visited_at timestamptz not null default now()
);

alter table public.site_visits
  add column if not exists visit_date date not null default ((now() at time zone 'Asia/Seoul')::date);

alter table public.site_visits
  drop constraint if exists site_visits_visitor_id_page_path_key;

drop index if exists public.site_visits_unique_daily_idx;

create unique index if not exists site_visits_unique_daily_idx
on public.site_visits(visitor_id, page_path, visit_date);

create index if not exists site_visits_page_path_idx
on public.site_visits(page_path);

create index if not exists site_visits_date_idx
on public.site_visits(visit_date);

alter table public.site_visits enable row level security;

grant select, insert on public.site_visits to anon, authenticated;

drop policy if exists "Public read site visits" on public.site_visits;
create policy "Public read site visits"
on public.site_visits
for select
to anon, authenticated
using (true);

drop policy if exists "Public insert site visits" on public.site_visits;
create policy "Public insert site visits"
on public.site_visits
for insert
to anon, authenticated
with check (
  length(visitor_id) > 0
  and page_path = '/'
);

notify pgrst, 'reload schema';
