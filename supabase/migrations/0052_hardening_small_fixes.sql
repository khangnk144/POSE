-- Small hardening fixes: function search_path, profile field limits, invite-code length,
-- and removal of an unused Realtime publication entry.

-- consume_ai_quota: same empty search_path as the other definer functions; names are qualified.
create or replace function public.consume_ai_quota(p_user_id uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  insert into public.ai_usage as u (user_id, day, count)
  values (p_user_id, (pg_catalog.now() at time zone 'Asia/Ho_Chi_Minh')::date, 1)
  on conflict (user_id, day)
  do update set count = u.count + 1
  where u.count < p_limit
  returning u.count into v_count;

  -- NULL when the WHERE clause blocked the update: limit reached. Return -1 for that.
  return coalesce(v_count, -1);
end;
$$;

revoke all on function public.consume_ai_quota(uuid, int) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, int) to service_role;

-- profiles: members can PATCH their own avatar_emoji, so bound it (UI limits stay within this).
alter table public.profiles
  add constraint profiles_avatar_emoji_length check (char_length(avatar_emoji) between 1 and 16);

-- team_settings: a short invite code can be brute-forced through join_team. An existing code
-- shorter than 8 characters is replaced by a random one so the constraint can be added;
-- an admin can then set a memorable code from the app.
update public.team_settings
set invite_code = upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8))
where char_length(invite_code) < 8;

alter table public.team_settings drop constraint team_settings_invite_code_check;
alter table public.team_settings
  add constraint team_settings_invite_code_check check (char_length(invite_code) >= 8);

-- Nothing subscribes to postgres_changes (presence is the only Realtime use), so stop publishing.
alter publication supabase_realtime drop table public.poses, public.shoot_items;
