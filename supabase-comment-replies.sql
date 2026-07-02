-- CineScope comment replies migration
-- Run once in Supabase SQL Editor.

alter table public.comments
  add column if not exists parent_id uuid references public.comments(id) on delete cascade,
  add column if not exists is_admin_reply boolean not null default false;

create index if not exists comments_parent_id_idx on public.comments(parent_id);
create index if not exists comments_post_parent_idx on public.comments(post_id, parent_id);

alter table public.comments enable row level security;

grant select, insert, update on public.comments to anon, authenticated;

drop policy if exists "Public read approved comments" on public.comments;
create policy "Public read approved comments"
on public.comments
for select
to anon, authenticated
using (
  status = 'approved'
  and coalesce(is_deleted, false) = false
);

drop policy if exists "Public insert visitor comments" on public.comments;
create policy "Public insert visitor comments"
on public.comments
for insert
to anon, authenticated
with check (
  coalesce(is_admin_reply, false) = false
  and parent_id is null
  and status = 'approved'
  and coalesce(is_deleted, false) = false
);

drop policy if exists "Admins insert comment replies" on public.comments;
create policy "Admins insert comment replies"
on public.comments
for insert
to authenticated
with check (
  is_admin_reply = true
  and parent_id is not null
  and status = 'approved'
  and exists (
    select 1
    from public.admin_users au
    where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and au.role in ('super_admin', 'admin')
  )
);

drop policy if exists "Admins soft delete comments" on public.comments;
create policy "Admins soft delete comments"
on public.comments
for update
to authenticated
using (
  exists (
    select 1
    from public.admin_users au
    where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and au.role in ('super_admin', 'admin')
  )
)
with check (
  exists (
    select 1
    from public.admin_users au
    where lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and au.role in ('super_admin', 'admin')
  )
);
