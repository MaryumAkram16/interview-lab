-- Run once in your Supabase SQL editor. Public study content stays in GitHub.
create table if not exists public.practice_backups (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now()
);
alter table public.practice_backups enable row level security;
revoke all on public.practice_backups from anon;
grant select, insert, update on public.practice_backups to authenticated;
create policy "Read own backup" on public.practice_backups
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own backup" on public.practice_backups
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own backup" on public.practice_backups
  for update to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
