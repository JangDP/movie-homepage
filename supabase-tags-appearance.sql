begin;

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create unique index if not exists tags_slug_unique_idx
on public.tags (slug);

create index if not exists tags_sort_order_idx
on public.tags (sort_order, name);

create unique index if not exists site_settings_key_unique_idx
on public.site_settings (key);

alter table public.tags enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Public read tags" on public.tags;
drop policy if exists "Admin insert tags" on public.tags;
drop policy if exists "Admin update tags" on public.tags;
drop policy if exists "Admin delete tags" on public.tags;

create policy "Public read tags" on public.tags
  for select to anon, authenticated
  using (true);

create policy "Admin insert tags" on public.tags
  for insert to authenticated
  with check (public.is_admin_role(array['super_admin', 'admin']));

create policy "Admin update tags" on public.tags
  for update to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']))
  with check (public.is_admin_role(array['super_admin', 'admin']));

create policy "Admin delete tags" on public.tags
  for delete to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']));

drop policy if exists "Public read site settings" on public.site_settings;
drop policy if exists "Admin insert site settings" on public.site_settings;
drop policy if exists "Admin update site settings" on public.site_settings;

create policy "Public read site settings" on public.site_settings
  for select to anon, authenticated
  using (true);

create policy "Admin insert site settings" on public.site_settings
  for insert to authenticated
  with check (public.is_admin_role(array['super_admin', 'admin']));

create policy "Admin update site settings" on public.site_settings
  for update to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']))
  with check (public.is_admin_role(array['super_admin', 'admin']));

grant select on public.tags to anon, authenticated;
grant insert, update, delete on public.tags to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

commit;
