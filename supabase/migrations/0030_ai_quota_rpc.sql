-- Atomic per-user daily AI quota. One statement upserts today's row and only increments while
-- below the limit, so concurrent requests can never push the counter past it.
-- Day boundary follows Vietnam time because that is where the team lives.
create or replace function public.consume_ai_quota(p_user_id uuid, p_limit int)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  insert into public.ai_usage as u (user_id, day, count)
  values (p_user_id, (now() at time zone 'Asia/Ho_Chi_Minh')::date, 1)
  on conflict (user_id, day)
  do update set count = u.count + 1
  where u.count < p_limit
  returning u.count into v_count;

  -- NULL when the WHERE clause blocked the update: limit reached. Return -1 for that.
  return coalesce(v_count, -1);
end;
$$;

-- Only the server (service role) may spend quota.
revoke all on function public.consume_ai_quota(uuid, int) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid, int) to service_role;
