create table if not exists public.spell_check_rules (
  id uuid primary key default gen_random_uuid(),
  wrong_text text not null,
  suggestion text not null,
  message text,
  type text not null default 'spelling' check (type in ('spelling', 'spacing')),
  is_active boolean not null default true,
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (wrong_text, suggestion)
);

create index if not exists spell_check_rules_active_order_idx
  on public.spell_check_rules (is_active, sort_order, wrong_text);

alter table public.spell_check_rules enable row level security;

drop policy if exists "Admin users can read spell check rules" on public.spell_check_rules;
drop policy if exists "Admins can insert spell check rules" on public.spell_check_rules;
drop policy if exists "Admins can update spell check rules" on public.spell_check_rules;
drop policy if exists "Admins can delete spell check rules" on public.spell_check_rules;

create policy "Admin users can read spell check rules"
  on public.spell_check_rules
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(auth.jwt() ->> 'email')
    )
  );

create policy "Admins can insert spell check rules"
  on public.spell_check_rules
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(auth.jwt() ->> 'email')
        and au.role in ('super_admin', 'admin')
    )
  );

create policy "Admins can update spell check rules"
  on public.spell_check_rules
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(auth.jwt() ->> 'email')
        and au.role in ('super_admin', 'admin')
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(auth.jwt() ->> 'email')
        and au.role in ('super_admin', 'admin')
    )
  );

create policy "Admins can delete spell check rules"
  on public.spell_check_rules
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users au
      where lower(au.email) = lower(auth.jwt() ->> 'email')
        and au.role in ('super_admin', 'admin')
    )
  );

insert into public.spell_check_rules (wrong_text, suggestion, message, type, sort_order)
values
  ('어딧', '어디 있', '''어딧''은 ''어디 있''으로 쓰는 것이 자연스럽습니다.', 'spelling', 10),
  ('어딨', '어디 있', '''어딨''은 ''어디 있''으로 풀어 쓰는 것이 자연스럽습니다.', 'spelling', 20),
  ('는쥐', '는지', '''는쥐''는 ''는지''로 씁니다.', 'spelling', 30),
  ('할수', '할 수', '''할 수''는 띄어 씁니다.', 'spacing', 40),
  ('되요', '돼요', '''되요''는 ''돼요''로 쓰는 것이 자연스럽습니다.', 'spelling', 50),
  ('몇일', '며칠', '''몇일''은 ''며칠''로 씁니다.', 'spelling', 60)
on conflict (wrong_text, suggestion) do update
set
  message = excluded.message,
  type = excluded.type,
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();
