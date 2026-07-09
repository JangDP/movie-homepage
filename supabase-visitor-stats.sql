-- CineScope / Cinematic Universe visitor analytics migration
-- Run once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.site_visits (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  page_path text not null default '/',
  visit_date date not null default (timezone('Asia/Seoul', now())::date),
  visited_at timestamptz not null default now()
);

alter table public.site_visits
  add column if not exists visitor_id text,
  add column if not exists page_path text default '/',
  add column if not exists visit_date date default (timezone('Asia/Seoul', now())::date),
  add column if not exists visited_at timestamptz default now();

update public.site_visits
set page_path = '/'
where page_path is null or btrim(page_path) = '';

update public.site_visits
set visitor_id = 'legacy_' || id::text
where visitor_id is null or btrim(visitor_id) = '';

update public.site_visits
set visit_date = timezone('Asia/Seoul', coalesce(visited_at, now()))::date
where visit_date is null;

update public.site_visits
set visited_at = now()
where visited_at is null;

alter table public.site_visits
  alter column visitor_id set not null,
  alter column page_path set not null,
  alter column visit_date set not null,
  alter column visited_at set not null;

-- Previous versions may have had a visitor_id + page_path unique constraint.
-- It blocks the same visitor from being counted on a later date, so replace it with a daily constraint.
alter table public.site_visits
  drop constraint if exists site_visits_visitor_id_page_path_key;

delete from public.site_visits a
using public.site_visits b
where a.ctid < b.ctid
  and a.visitor_id = b.visitor_id
  and a.page_path = b.page_path
  and a.visit_date = b.visit_date;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.site_visits'::regclass
      and conname = 'site_visits_visitor_id_page_path_visit_date_key'
  ) then
    alter table public.site_visits
      add constraint site_visits_visitor_id_page_path_visit_date_key
      unique (visitor_id, page_path, visit_date);
  end if;
end $$;

create table if not exists public.visitor_stats (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  page_views integer not null default 0 check (page_views >= 0),
  unique_visitors integer not null default 0 check (unique_visitors >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.visitor_stats (date, page_views, unique_visitors)
select
  visit_date,
  count(*) filter (where page_path <> '__site__')::integer as page_views,
  count(distinct visitor_id)::integer as unique_visitors
from public.site_visits
group by visit_date
on conflict (date) do update
set
  page_views = excluded.page_views,
  unique_visitors = excluded.unique_visitors,
  updated_at = now();

create or replace function public.track_site_visit(
  input_visitor_id text,
  input_page_path text,
  input_visit_date date default (timezone('Asia/Seoul', now())::date)
)
returns public.visitor_stats
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_path text := coalesce(nullif(btrim(input_page_path), ''), '/');
  unique_inserted integer := 0;
  page_inserted integer := 0;
  stats_row public.visitor_stats;
begin
  if input_visitor_id is null or btrim(input_visitor_id) = '' then
    raise exception 'visitor_id is required';
  end if;

  if normalized_path like '/admin%' or normalized_path like '/api%' then
    select * into stats_row
    from public.visitor_stats
    where date = input_visit_date;

    return stats_row;
  end if;

  insert into public.site_visits (visitor_id, page_path, visit_date)
  values (input_visitor_id, '__site__', input_visit_date)
  on conflict (visitor_id, page_path, visit_date) do nothing;
  get diagnostics unique_inserted = row_count;

  insert into public.site_visits (visitor_id, page_path, visit_date)
  values (input_visitor_id, normalized_path, input_visit_date)
  on conflict (visitor_id, page_path, visit_date) do nothing;
  get diagnostics page_inserted = row_count;

  insert into public.visitor_stats (date, page_views, unique_visitors)
  values (input_visit_date, page_inserted, unique_inserted)
  on conflict (date) do update
  set
    page_views = public.visitor_stats.page_views + excluded.page_views,
    unique_visitors = public.visitor_stats.unique_visitors + excluded.unique_visitors,
    updated_at = now()
  returning * into stats_row;

  return stats_row;
end;
$$;

alter table public.site_visits enable row level security;
alter table public.visitor_stats enable row level security;

drop policy if exists "Public insert site visits" on public.site_visits;
create policy "Public insert site visits"
on public.site_visits
for insert
to anon, authenticated
with check (true);

drop policy if exists "Admin read site visits" on public.site_visits;
create policy "Admin read site visits"
on public.site_visits
for select
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.email = lower(auth.email())
      and au.role in ('super_admin', 'admin')
  )
);

drop policy if exists "Public read visitor stats" on public.visitor_stats;
create policy "Public read visitor stats"
on public.visitor_stats
for select
to anon, authenticated
using (true);

drop policy if exists "Admin manage visitor stats" on public.visitor_stats;
create policy "Admin manage visitor stats"
on public.visitor_stats
for all
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where au.email = lower(auth.email())
      and au.role in ('super_admin', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where au.email = lower(auth.email())
      and au.role in ('super_admin', 'admin')
  )
);

grant select on public.visitor_stats to anon, authenticated;
grant insert on public.site_visits to anon, authenticated;
grant execute on function public.track_site_visit(text, text, date) to anon, authenticated;
