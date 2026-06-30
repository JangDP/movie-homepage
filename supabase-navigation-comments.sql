begin;

alter table public.comments
add column if not exists is_deleted boolean not null default false;

update public.comments
set is_deleted = false
where is_deleted is null;

create index if not exists comments_active_created_at_idx
on public.comments (post_id, created_at desc)
where is_deleted = false;

create unique index if not exists site_settings_key_unique_idx
on public.site_settings (key);

alter table public.comments enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Public read approved comments" on public.comments;
drop policy if exists "Public insert comments" on public.comments;
drop policy if exists "Admin read comments" on public.comments;
drop policy if exists "Admin update comments" on public.comments;
drop policy if exists "Admin soft delete comments" on public.comments;

create policy "Public read approved comments" on public.comments
  for select to anon, authenticated
  using (status = 'approved' and is_deleted = false);

create policy "Public insert comments" on public.comments
  for insert to anon, authenticated
  with check (coalesce(is_deleted, false) = false);

create policy "Admin read comments" on public.comments
  for select to authenticated
  using (public.is_admin_role(array['super_admin', 'admin', 'editor']));

create policy "Admin update comments" on public.comments
  for update to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']))
  with check (public.is_admin_role(array['super_admin', 'admin']));

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

grant select, insert on public.comments to anon, authenticated;
grant update on public.comments to authenticated;
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;

commit;
