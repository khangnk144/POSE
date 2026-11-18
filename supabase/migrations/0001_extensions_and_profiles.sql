-- Extensions, helper functions, profiles, team settings and the join_team RPC.

create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- unaccent() is only STABLE; wrapping it lets triggers and indexes use it.
create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
strict
set search_path = ''
as $$ select extensions.unaccent('extensions.unaccent'::regdictionary, input) $$;

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_emoji text not null default '🐼',
  avatar_color text not null default 'avatar-1'
    check (avatar_color in ('avatar-1','avatar-2','avatar-3','avatar-4','avatar-5','avatar-6','avatar-7','avatar-8')),
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);

-- Exactly one row (id = 1). Only admins can read or change it.
create table public.team_settings (
  id int primary key default 1 check (id = 1),
  invite_code text not null check (char_length(invite_code) >= 4)
);
-- Random placeholder code; local dev overrides it in seed.sql, production sets it by SQL.
insert into public.team_settings (id, invite_code)
values (1, upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8)));

-- SECURITY DEFINER so policies on profiles can call them without recursion.
create or replace function public.is_member()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select exists (select 1 from public.profiles where id = auth.uid()) $$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin') $$;

-- Called right after sign-up. Verifies the invite code, creates the profile.
-- The first profile ever created becomes admin.
create or replace function public.join_team(invite_code text, display_name text)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  clean_name text := btrim(coalesce(display_name, ''));
  expected text;
  new_role text;
  result public.profiles;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if char_length(clean_name) not between 1 and 40 then
    raise exception 'invalid_display_name' using errcode = '22023';
  end if;

  -- Serialize concurrent joins so only one caller can become the first admin.
  perform pg_advisory_xact_lock(hashtext('join_team'));

  if exists (select 1 from public.profiles where id = uid) then
    raise exception 'already_member' using errcode = '23505';
  end if;

  select ts.invite_code into expected from public.team_settings ts where ts.id = 1;
  if expected is null or upper(btrim(coalesce(join_team.invite_code, ''))) <> upper(expected) then
    raise exception 'invalid_invite_code' using errcode = '28000';
  end if;

  new_role := case when exists (select 1 from public.profiles) then 'member' else 'admin' end;

  insert into public.profiles (id, display_name, avatar_color, role)
  values (uid, clean_name, 'avatar-' || (1 + floor(random() * 8))::int, new_role)
  returning * into result;

  return result;
end;
$$;

revoke all on function public.join_team(text, text) from public, anon;
grant execute on function public.join_team(text, text) to authenticated;
revoke all on function public.is_member() from public, anon;
grant execute on function public.is_member() to authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
