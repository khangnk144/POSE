-- Admins have no daily AI limit (the team owner pays for the API). Their calls are still counted
-- in ai_usage so usage stays visible. Checked by p_user_id: the server calls this with the
-- service role, where auth.uid() (and so is_admin()) is null.
create or replace function public.consume_ai_quota(p_user_id uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_unlimited boolean;
  v_count int;
begin
  select exists (select 1 from public.profiles p where p.id = p_user_id and p.role = 'admin')
    into v_unlimited;

  insert into public.ai_usage as u (user_id, day, count)
  values (p_user_id, (pg_catalog.now() at time zone 'Asia/Ho_Chi_Minh')::date, 1)
  on conflict (user_id, day)
  do update set count = u.count + 1
  where v_unlimited or u.count < p_limit
  returning u.count into v_count;

  -- NULL when the WHERE clause blocked the update: limit reached. Return -1 for that.
  return coalesce(v_count, -1);
end;
$$;
revoke all on function public.consume_ai_quota(uuid, int) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, int) to service_role;
