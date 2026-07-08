begin;

create extension if not exists pgcrypto;

alter table public.comments
  add column if not exists is_secret boolean not null default false,
  add column if not exists password_hash text;

update public.comments
set is_secret = false
where is_secret is null;

create index if not exists comments_secret_active_idx
on public.comments (post_id, is_secret, created_at desc)
where coalesce(is_deleted, false) = false;

create or replace function public.is_admin_role(allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
      and role = any(allowed_roles)
  );
$$;

create or replace function public.list_public_comments(target_post_id uuid)
returns table (
  id uuid,
  post_id uuid,
  parent_id uuid,
  author_name text,
  body text,
  is_admin_reply boolean,
  is_secret boolean,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.post_id,
    c.parent_id,
    c.author_name,
    case when coalesce(c.is_secret, false) then null else c.body end as body,
    coalesce(c.is_admin_reply, false) as is_admin_reply,
    coalesce(c.is_secret, false) as is_secret,
    c.status::text as status,
    c.created_at
  from public.comments c
  where c.post_id = target_post_id
    and c.status = 'approved'
    and coalesce(c.is_deleted, false) = false
  order by c.created_at desc;
$$;

create or replace function public.create_public_comment(
  target_post_id uuid,
  visitor_name text,
  comment_body text,
  secret boolean default false,
  secret_password text default null
)
returns table (
  id uuid,
  post_id uuid,
  parent_id uuid,
  author_name text,
  body text,
  is_admin_reply boolean,
  is_secret boolean,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_comment public.comments%rowtype;
begin
  if length(trim(coalesce(visitor_name, ''))) = 0 or length(trim(coalesce(comment_body, ''))) = 0 then
    raise exception '댓글 이름과 내용을 입력해 주세요.';
  end if;

  if coalesce(secret, false) and length(coalesce(secret_password, '')) < 4 then
    raise exception '비밀글 비밀번호는 4자 이상 입력해 주세요.';
  end if;

  insert into public.comments (
    post_id,
    author_name,
    body,
    is_admin_reply,
    is_deleted,
    is_secret,
    password_hash,
    status
  )
  values (
    target_post_id,
    trim(visitor_name),
    trim(comment_body),
    false,
    false,
    coalesce(secret, false),
    case when coalesce(secret, false) then crypt(secret_password, gen_salt('bf')) else null end,
    'approved'
  )
  returning * into inserted_comment;

  return query
  select
    inserted_comment.id,
    inserted_comment.post_id,
    inserted_comment.parent_id,
    inserted_comment.author_name,
    case when coalesce(inserted_comment.is_secret, false) then null else inserted_comment.body end,
    coalesce(inserted_comment.is_admin_reply, false),
    coalesce(inserted_comment.is_secret, false),
    inserted_comment.status::text,
    inserted_comment.created_at;
end;
$$;

create or replace function public.reveal_secret_comment(
  target_comment_id uuid,
  secret_password text
)
returns table (
  ok boolean,
  message text,
  comment_id uuid,
  body text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_comment public.comments%rowtype;
  root_comment public.comments%rowtype;
  root_id uuid;
begin
  select *
  into target_comment
  from public.comments
  where id = target_comment_id
    and coalesce(is_deleted, false) = false
    and status = 'approved';

  if not found then
    return query select false, '비밀글을 찾을 수 없습니다.', null::uuid, null::text;
    return;
  end if;

  root_id := coalesce(target_comment.parent_id, target_comment.id);

  select *
  into root_comment
  from public.comments
  where id = root_id
    and coalesce(is_deleted, false) = false
    and status = 'approved';

  if not found or not coalesce(root_comment.is_secret, false) then
    return query select false, '비밀글이 아닙니다.', null::uuid, null::text;
    return;
  end if;

  if root_comment.password_hash is null
    or root_comment.password_hash <> crypt(coalesce(secret_password, ''), root_comment.password_hash) then
    return query select false, '비밀번호가 올바르지 않습니다.', null::uuid, null::text;
    return;
  end if;

  return query
  select
    true,
    '확인되었습니다.',
    c.id,
    c.body
  from public.comments c
  where (c.id = root_comment.id or c.parent_id = root_comment.id)
    and c.status = 'approved'
    and coalesce(c.is_deleted, false) = false
  order by c.created_at asc;
end;
$$;

create or replace function public.delete_secret_comment(
  target_comment_id uuid,
  secret_password text
)
returns table (
  ok boolean,
  message text,
  deleted_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
declare
  target_comment public.comments%rowtype;
  root_comment public.comments%rowtype;
  root_id uuid;
begin
  select *
  into target_comment
  from public.comments
  where id = target_comment_id
    and coalesce(is_deleted, false) = false
    and status = 'approved';

  if not found then
    return query select false, '비밀글을 찾을 수 없습니다.', null::uuid;
    return;
  end if;

  root_id := coalesce(target_comment.parent_id, target_comment.id);

  select *
  into root_comment
  from public.comments
  where id = root_id
    and coalesce(is_deleted, false) = false
    and status = 'approved';

  if not found or not coalesce(root_comment.is_secret, false) then
    return query select false, '비밀글이 아닙니다.', null::uuid;
    return;
  end if;

  if root_comment.password_hash is null
    or root_comment.password_hash <> crypt(coalesce(secret_password, ''), root_comment.password_hash) then
    return query select false, '비밀번호가 올바르지 않습니다.', null::uuid;
    return;
  end if;

  return query
  with updated as (
    update public.comments
    set is_deleted = true
    where (id = root_comment.id or parent_id = root_comment.id)
      and coalesce(is_deleted, false) = false
    returning id
  )
  select true, '삭제 처리되었습니다.', updated.id
  from updated;
end;
$$;

create or replace function public.list_admin_comments()
returns table (
  id uuid,
  post_id uuid,
  parent_id uuid,
  author_name text,
  body text,
  is_admin_reply boolean,
  is_secret boolean,
  status text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin_role(array['super_admin', 'admin', 'editor']) then
    raise exception '관리자 권한이 없습니다.' using errcode = '42501';
  end if;

  return query
  select
    c.id,
    c.post_id,
    c.parent_id,
    c.author_name,
    c.body,
    coalesce(c.is_admin_reply, false),
    coalesce(c.is_secret, false),
    c.status::text,
    c.created_at
  from public.comments c
  where coalesce(c.is_deleted, false) = false
  order by c.created_at desc;
end;
$$;

create or replace function public.admin_soft_delete_comment(target_comment_id uuid)
returns table (
  ok boolean,
  message text,
  deleted_id uuid
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin_role(array['super_admin', 'admin']) then
    raise exception '댓글 삭제 권한이 없습니다.' using errcode = '42501';
  end if;

  return query
  with updated as (
    update public.comments
    set is_deleted = true
    where (id = target_comment_id or parent_id = target_comment_id)
      and coalesce(is_deleted, false) = false
    returning id
  )
  select true, '삭제 처리되었습니다.', updated.id
  from updated;

  if not found then
    return query select false, '삭제할 댓글을 찾을 수 없습니다.', null::uuid;
  end if;
end;
$$;

create or replace function public.create_admin_comment_reply(
  target_parent_id uuid,
  reply_body text
)
returns table (
  id uuid,
  post_id uuid,
  parent_id uuid,
  author_name text,
  body text,
  is_admin_reply boolean,
  is_secret boolean,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_comment public.comments%rowtype;
  inserted_reply public.comments%rowtype;
begin
  if not public.is_admin_role(array['super_admin', 'admin']) then
    raise exception '답글 작성 권한이 없습니다.' using errcode = '42501';
  end if;

  if length(trim(coalesce(reply_body, ''))) = 0 then
    raise exception '답글 내용을 입력해 주세요.';
  end if;

  select *
  into parent_comment
  from public.comments
  where id = target_parent_id
    and coalesce(is_deleted, false) = false;

  if not found then
    raise exception '원 댓글을 찾을 수 없습니다.';
  end if;

  insert into public.comments (
    post_id,
    parent_id,
    author_name,
    body,
    is_admin_reply,
    is_deleted,
    is_secret,
    password_hash,
    status
  )
  values (
    parent_comment.post_id,
    parent_comment.id,
    '시네마틱 유니버스 관리자',
    trim(reply_body),
    true,
    false,
    coalesce(parent_comment.is_secret, false),
    null,
    'approved'
  )
  returning * into inserted_reply;

  return query
  select
    inserted_reply.id,
    inserted_reply.post_id,
    inserted_reply.parent_id,
    inserted_reply.author_name,
    inserted_reply.body,
    coalesce(inserted_reply.is_admin_reply, false),
    coalesce(inserted_reply.is_secret, false),
    inserted_reply.status::text,
    inserted_reply.created_at;
end;
$$;

alter table public.comments enable row level security;

drop policy if exists "Public read approved comments" on public.comments;
drop policy if exists "Public insert comments" on public.comments;
drop policy if exists "Public insert visitor comments" on public.comments;
drop policy if exists "Admins insert comment replies" on public.comments;
drop policy if exists "Admins soft delete comments" on public.comments;
drop policy if exists "Admin read comments" on public.comments;
drop policy if exists "Admin update comments" on public.comments;
drop policy if exists "Admin soft delete comments" on public.comments;
drop policy if exists "No direct comments select" on public.comments;
drop policy if exists "No direct comments insert" on public.comments;
drop policy if exists "No direct comments update" on public.comments;

create policy "No direct comments select"
on public.comments
for select
to anon, authenticated
using (false);

create policy "No direct comments insert"
on public.comments
for insert
to anon, authenticated
with check (false);

create policy "No direct comments update"
on public.comments
for update
to anon, authenticated
using (false)
with check (false);

revoke select, insert, update, delete on public.comments from anon, authenticated;

grant execute on function public.list_public_comments(uuid) to anon, authenticated;
grant execute on function public.create_public_comment(uuid, text, text, boolean, text) to anon, authenticated;
grant execute on function public.reveal_secret_comment(uuid, text) to anon, authenticated;
grant execute on function public.delete_secret_comment(uuid, text) to anon, authenticated;
grant execute on function public.list_admin_comments() to authenticated;
grant execute on function public.admin_soft_delete_comment(uuid) to authenticated;
grant execute on function public.create_admin_comment_reply(uuid, text) to authenticated;

commit;
