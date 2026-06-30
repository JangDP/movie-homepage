begin;

drop table if exists public.reactions cascade;

alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts
  add constraint posts_status_check check (status in ('draft', 'published', 'deleted'));

alter table public.post_reactions add column if not exists post_slug text;
alter table public.post_reactions add column if not exists visitor_id text;

update public.post_reactions
set visitor_id = client_id
where visitor_id is null and client_id is not null;

update public.post_reactions
set post_slug = posts.slug
from public.posts
where public.post_reactions.post_slug is null
  and public.post_reactions.post_id = posts.id;

delete from public.post_reactions a
using public.post_reactions b
where a.ctid < b.ctid
  and a.post_slug = b.post_slug
  and a.visitor_id = b.visitor_id
  and a.reaction_type = b.reaction_type;

alter table public.post_reactions alter column post_slug set not null;
alter table public.post_reactions alter column visitor_id set not null;

create unique index if not exists post_reactions_slug_visitor_type_unique
  on public.post_reactions(post_slug, visitor_id, reaction_type);

create table if not exists public.page_views (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  post_slug text not null,
  visitor_id text not null,
  viewed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists page_views_post_slug_visitor_viewed_idx
  on public.page_views(post_slug, visitor_id, viewed_at desc);

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

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.page_views enable row level security;

drop policy if exists "Public read all posts" on public.posts;
drop policy if exists "Public read published posts" on public.posts;
drop policy if exists "Public insert posts" on public.posts;
drop policy if exists "Public update posts" on public.posts;

drop policy if exists "Public read approved comments" on public.comments;
drop policy if exists "Public insert comments" on public.comments;

drop policy if exists "Public read reactions" on public.post_reactions;
drop policy if exists "Public insert reactions" on public.post_reactions;

drop policy if exists "Public read page views" on public.page_views;
drop policy if exists "Public insert page views" on public.page_views;

create policy "Public read all posts" on public.posts
  for select using (true);

create policy "Public insert posts" on public.posts
  for insert with check (true);

create policy "Public update posts" on public.posts
  for update using (true) with check (true);

create policy "Public read approved comments" on public.comments
  for select using (status = 'approved');

create policy "Public insert comments" on public.comments
  for insert with check (true);

create policy "Public read reactions" on public.post_reactions
  for select using (true);

create policy "Public insert reactions" on public.post_reactions
  for insert with check (true);

create policy "Public read page views" on public.page_views
  for select using (true);

create policy "Public insert page views" on public.page_views
  for insert with check (true);

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.posts to anon, authenticated;
grant select, insert on public.comments to anon, authenticated;
grant select, insert on public.post_reactions to anon, authenticated;
grant select, insert on public.page_views to anon, authenticated;
grant execute on function public.increment_post_view(uuid) to anon, authenticated;

commit;
