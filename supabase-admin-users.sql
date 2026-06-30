begin;

create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text not null check (role in ('super_admin', 'admin', 'editor')),
  created_at timestamptz not null default now()
);

delete from public.admin_users
where lower(email) = lower('askskzk7@gmail.com');

insert into public.admin_users (email, role)
values ('akskzk7@gmail.com', 'super_admin')
on conflict (email) do update
set role = 'super_admin';

create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.admin_users
  where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1
$$;

create or replace function public.is_admin_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_admin_role() = any(allowed_roles), false)
$$;

alter table public.admin_users enable row level security;

drop policy if exists "Admin users can read own row" on public.admin_users;
drop policy if exists "Super admins can read admin users" on public.admin_users;
drop policy if exists "Super admins can insert admin users" on public.admin_users;
drop policy if exists "Super admins can update admin users" on public.admin_users;
drop policy if exists "Super admins can delete admin users" on public.admin_users;

create policy "Admin users can read own row" on public.admin_users
  for select to authenticated
  using (lower(email) = lower(auth.jwt() ->> 'email'));

create policy "Super admins can read admin users" on public.admin_users
  for select to authenticated
  using (public.is_admin_role(array['super_admin']));

create policy "Super admins can insert admin users" on public.admin_users
  for insert to authenticated
  with check (public.is_admin_role(array['super_admin']));

create policy "Super admins can update admin users" on public.admin_users
  for update to authenticated
  using (public.is_admin_role(array['super_admin']))
  with check (public.is_admin_role(array['super_admin']));

create policy "Super admins can delete admin users" on public.admin_users
  for delete to authenticated
  using (
    public.is_admin_role(array['super_admin'])
    and lower(email) <> lower(auth.jwt() ->> 'email')
  );

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.media_assets enable row level security;

drop policy if exists "Public insert posts" on public.posts;
drop policy if exists "Public update posts" on public.posts;
drop policy if exists "Admin insert posts" on public.posts;
drop policy if exists "Admins update posts" on public.posts;
drop policy if exists "Editors update posts without delete" on public.posts;

create policy "Admin insert posts" on public.posts
  for insert to authenticated
  with check (public.is_admin_role(array['super_admin', 'admin', 'editor']));

create policy "Admins update posts" on public.posts
  for update to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']))
  with check (public.is_admin_role(array['super_admin', 'admin']));

create policy "Editors update posts without delete" on public.posts
  for update to authenticated
  using (public.is_admin_role(array['editor']) and status <> 'deleted')
  with check (public.is_admin_role(array['editor']) and status <> 'deleted');

drop policy if exists "Authenticated insert media" on public.media_assets;
drop policy if exists "Authenticated update media" on public.media_assets;
drop policy if exists "Authenticated delete media" on public.media_assets;
drop policy if exists "Admin insert media" on public.media_assets;
drop policy if exists "Admin update media" on public.media_assets;
drop policy if exists "Admin delete media" on public.media_assets;

create policy "Admin insert media" on public.media_assets
  for insert to authenticated
  with check (public.is_admin_role(array['super_admin', 'admin']));

create policy "Admin update media" on public.media_assets
  for update to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']))
  with check (public.is_admin_role(array['super_admin', 'admin']));

create policy "Admin delete media" on public.media_assets
  for delete to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']));

drop policy if exists "Authenticated upload media bucket" on storage.objects;
drop policy if exists "Authenticated update media bucket" on storage.objects;
drop policy if exists "Authenticated delete media bucket" on storage.objects;
drop policy if exists "Admin upload media bucket" on storage.objects;
drop policy if exists "Admin update media bucket" on storage.objects;
drop policy if exists "Admin delete media bucket" on storage.objects;

create policy "Admin upload media bucket" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.is_admin_role(array['super_admin', 'admin'])
  );

create policy "Admin update media bucket" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and public.is_admin_role(array['super_admin', 'admin'])
  )
  with check (
    bucket_id = 'media'
    and public.is_admin_role(array['super_admin', 'admin'])
  );

create policy "Admin delete media bucket" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and public.is_admin_role(array['super_admin', 'admin'])
  );

drop policy if exists "Admin read comments" on public.comments;
drop policy if exists "Admin update comments" on public.comments;
drop policy if exists "Admin delete comments" on public.comments;

create policy "Admin read comments" on public.comments
  for select to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']));

create policy "Admin update comments" on public.comments
  for update to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']))
  with check (public.is_admin_role(array['super_admin', 'admin']));

create policy "Admin delete comments" on public.comments
  for delete to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']));

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.admin_users to authenticated;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.is_admin_role(text[]) to authenticated;
grant select, insert, update on public.posts to authenticated;
grant select, insert, update, delete on public.media_assets to authenticated;
grant select, update, delete on public.comments to authenticated;

commit;
