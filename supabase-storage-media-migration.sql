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
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.media_assets add column if not exists storage_path text;
alter table public.media_assets add column if not exists file_size integer;
alter table public.media_assets add column if not exists mime_type text;

alter table public.media_assets enable row level security;

drop policy if exists "Public read media" on public.media_assets;
drop policy if exists "Authenticated insert media" on public.media_assets;
drop policy if exists "Authenticated update media" on public.media_assets;
drop policy if exists "Authenticated delete media" on public.media_assets;

create policy "Public read media" on public.media_assets
  for select using (true);

create policy "Authenticated insert media" on public.media_assets
  for insert to authenticated with check (true);

create policy "Authenticated update media" on public.media_assets
  for update to authenticated using (true) with check (true);

create policy "Authenticated delete media" on public.media_assets
  for delete to authenticated using (true);

drop policy if exists "Public read media bucket" on storage.objects;
drop policy if exists "Authenticated upload media bucket" on storage.objects;
drop policy if exists "Authenticated update media bucket" on storage.objects;
drop policy if exists "Authenticated delete media bucket" on storage.objects;

create policy "Public read media bucket" on storage.objects
  for select using (bucket_id = 'media');

create policy "Authenticated upload media bucket" on storage.objects
  for insert to authenticated with check (bucket_id = 'media');

create policy "Authenticated update media bucket" on storage.objects
  for update to authenticated using (bucket_id = 'media') with check (bucket_id = 'media');

create policy "Authenticated delete media bucket" on storage.objects
  for delete to authenticated using (bucket_id = 'media');

grant usage on schema public to anon, authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert, update, delete on public.media_assets to authenticated;

commit;
