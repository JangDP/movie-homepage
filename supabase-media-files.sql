begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'media',
  'media',
  true,
  20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.media_files (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  alt text,
  original_url text not null,
  webp_url text not null,
  thumbnail_url text not null,
  original_path text not null,
  webp_path text not null,
  thumbnail_path text not null,
  mime_type text not null,
  size_bytes integer not null check (size_bytes <= 20971520),
  width integer,
  height integer,
  uploaded_by text,
  created_at timestamptz not null default now()
);

create index if not exists media_files_created_at_idx
  on public.media_files(created_at desc);

create index if not exists media_files_title_idx
  on public.media_files(title);

alter table public.media_files enable row level security;

drop policy if exists "Admins can read media files" on public.media_files;
drop policy if exists "Editors can upload media files" on public.media_files;
drop policy if exists "Admins can update media files" on public.media_files;
drop policy if exists "Admins can delete media files" on public.media_files;

create policy "Admins can read media files" on public.media_files
  for select to authenticated
  using (public.is_admin_role(array['super_admin', 'admin', 'editor']));

create policy "Editors can upload media files" on public.media_files
  for insert to authenticated
  with check (public.is_admin_role(array['super_admin', 'admin', 'editor']));

create policy "Admins can update media files" on public.media_files
  for update to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']))
  with check (public.is_admin_role(array['super_admin', 'admin']));

create policy "Admins can delete media files" on public.media_files
  for delete to authenticated
  using (public.is_admin_role(array['super_admin', 'admin']));

drop policy if exists "Admin upload media bucket" on storage.objects;
drop policy if exists "Admin update media bucket" on storage.objects;
drop policy if exists "Admin delete media bucket" on storage.objects;
drop policy if exists "Authenticated upload media bucket" on storage.objects;
drop policy if exists "Authenticated update media bucket" on storage.objects;
drop policy if exists "Authenticated delete media bucket" on storage.objects;
drop policy if exists "Editors upload media bucket" on storage.objects;
drop policy if exists "Admins update media bucket" on storage.objects;
drop policy if exists "Admins delete media bucket" on storage.objects;

create policy "Editors upload media bucket" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'media'
    and public.is_admin_role(array['super_admin', 'admin', 'editor'])
  );

create policy "Admins update media bucket" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'media'
    and public.is_admin_role(array['super_admin', 'admin'])
  )
  with check (
    bucket_id = 'media'
    and public.is_admin_role(array['super_admin', 'admin'])
  );

create policy "Admins delete media bucket" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'media'
    and public.is_admin_role(array['super_admin', 'admin'])
  );

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.media_files to authenticated;

commit;
