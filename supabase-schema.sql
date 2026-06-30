create table if not exists public.categories (
  id text primary key,
  label text not null,
  href text not null,
  description text,
  sort_order integer default 0,
  visible boolean default true
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  excerpt text,
  body text,
  category_id text not null references public.categories(id),
  author text default '?紐꾩춿?봔',
  published_at date,
  read_time text,
  thumbnail_url text,
  image_alt text,
  tags text[] default '{}',
  status text not null default 'draft' check (status in ('draft', 'published', 'deleted')),
  featured boolean default false,
  view_count integer default 0,
  seo_title text,
  meta_description text,
  og_image_url text,
  created_at timestamptz default now(),
  unique(category_id, slug)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_name text not null,
  body text not null,
  status text not null default 'approved' check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz default now()
);

create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'watched', 'excited', 'dislike')),
  client_id text not null,
  created_at timestamptz default now(),
  unique(post_id, reaction_type, client_id)
);

alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts
  add constraint posts_status_check check (status in ('draft', 'published', 'deleted'));

alter table public.post_reactions add column if not exists post_slug text;
alter table public.post_reactions add column if not exists visitor_id text;
update public.post_reactions set visitor_id = client_id where visitor_id is null and client_id is not null;
update public.post_reactions
set post_slug = posts.slug
from public.posts
where public.post_reactions.post_slug is null
  and public.post_reactions.post_id = posts.id;
create unique index if not exists post_reactions_slug_visitor_type_unique
  on public.post_reactions(post_slug, visitor_id, reaction_type)
  where post_slug is not null and visitor_id is not null;

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  post_slug text not null,
  visitor_id text not null,
  viewed_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists page_views_post_slug_visitor_viewed_idx
  on public.page_views(post_slug, visitor_id, viewed_at desc);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null,
  alt text,
  type text not null default 'image',
  usage text[] default '{}',
  storage_path text,
  file_size integer,
  mime_type text,
  created_at timestamptz default now()
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null,
  updated_at timestamptz default now()
);

drop table if exists public.reactions cascade;

create or replace function public.increment_post_view(target_post_id uuid)
returns integer
language plpgsql
security definer
as $$
declare
  new_count integer;
begin
  update public.posts
  set view_count = coalesce(view_count, 0) + 1
  where id = target_post_id
  returning view_count into new_count;

  return coalesce(new_count, 0);
end;
$$;

alter table public.categories enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.page_views enable row level security;
alter table public.media_assets enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Public read categories" on public.categories;
drop policy if exists "Public read published posts" on public.posts;
drop policy if exists "Public read all posts" on public.posts;
drop policy if exists "Public insert posts" on public.posts;
drop policy if exists "Public update posts" on public.posts;
drop policy if exists "Public read approved comments" on public.comments;
drop policy if exists "Public insert comments" on public.comments;
drop policy if exists "Public read reactions" on public.post_reactions;
drop policy if exists "Public insert reactions" on public.post_reactions;
drop policy if exists "Public read page views" on public.page_views;
drop policy if exists "Public insert page views" on public.page_views;
drop policy if exists "Public read media" on public.media_assets;
drop policy if exists "Authenticated insert media" on public.media_assets;
drop policy if exists "Public read site settings" on public.site_settings;

create policy "Public read categories" on public.categories for select using (true);
create policy "Public read all posts" on public.posts for select using (true);
create policy "Public insert posts" on public.posts for insert with check (true);
create policy "Public update posts" on public.posts for update using (true) with check (true);
create policy "Public read approved comments" on public.comments for select using (status = 'approved');
create policy "Public insert comments" on public.comments for insert with check (true);
create policy "Public read reactions" on public.post_reactions for select using (true);
create policy "Public insert reactions" on public.post_reactions for insert with check (true);
create policy "Public read page views" on public.page_views for select using (true);
create policy "Public insert page views" on public.page_views for insert with check (true);
create policy "Public read media" on public.media_assets for select using (true);
create policy "Authenticated insert media" on public.media_assets for insert to authenticated with check (true);
create policy "Public read site settings" on public.site_settings for select using (true);
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.posts to anon, authenticated;
grant select on public.categories to anon, authenticated;
grant select, insert on public.comments to anon, authenticated;
grant select, insert on public.post_reactions to anon, authenticated;
grant select, insert on public.page_views to anon, authenticated;
grant select on public.media_assets to anon, authenticated;
grant insert on public.media_assets to authenticated;
grant select on public.site_settings to anon, authenticated;
