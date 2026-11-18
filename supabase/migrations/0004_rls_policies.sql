-- Row level security for every table. Reads need is_member().

alter table public.profiles enable row level security;
alter table public.team_settings enable row level security;
alter table public.places enable row level security;
alter table public.poses enable row level security;
alter table public.pose_images enable row level security;
alter table public.favorites enable row level security;
alter table public.shoots enable row level security;
alter table public.shoot_items enable row level security;
alter table public.ai_usage enable row level security;

-- profiles: rows are created only by join_team(). Users edit their own look, never their role.
create policy profiles_select on public.profiles for select to authenticated using (public.is_member());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
revoke update on public.profiles from authenticated, anon;
grant update (display_name, avatar_emoji, avatar_color) on public.profiles to authenticated;
revoke insert, delete on public.profiles from authenticated, anon;

-- team_settings: admin only
create policy team_settings_select on public.team_settings for select to authenticated using (public.is_admin());
create policy team_settings_update on public.team_settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
revoke insert, delete on public.team_settings from authenticated, anon;

-- places
create policy places_select on public.places for select to authenticated using (public.is_member());
create policy places_insert on public.places for insert to authenticated
  with check (public.is_member() and created_by = auth.uid());
create policy places_update on public.places for update to authenticated
  using (public.is_member()) with check (public.is_member());
create policy places_delete on public.places for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- poses
create policy poses_select on public.poses for select to authenticated using (public.is_member());
create policy poses_insert on public.poses for insert to authenticated
  with check (public.is_member() and created_by = auth.uid());
create policy poses_update on public.poses for update to authenticated
  using (public.is_member()) with check (public.is_member());
create policy poses_delete on public.poses for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- pose_images: wiki-style editing, so any member may add/reorder/remove a pose's images;
-- deleting the pose itself stays creator/admin only (poses_delete above)
create policy pose_images_select on public.pose_images for select to authenticated using (public.is_member());
create policy pose_images_insert on public.pose_images for insert to authenticated
  with check (public.is_member());
create policy pose_images_update on public.pose_images for update to authenticated
  using (public.is_member()) with check (public.is_member());
create policy pose_images_delete on public.pose_images for delete to authenticated
  using (public.is_member());

-- favorites: own rows only
create policy favorites_own on public.favorites for all to authenticated
  using (public.is_member() and user_id = auth.uid())
  with check (public.is_member() and user_id = auth.uid());

-- shoots / shoot_items
create policy shoots_select on public.shoots for select to authenticated using (public.is_member());
create policy shoots_insert on public.shoots for insert to authenticated
  with check (public.is_member() and created_by = auth.uid());
create policy shoots_update on public.shoots for update to authenticated
  using (public.is_member()) with check (public.is_member());
create policy shoots_delete on public.shoots for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());
create policy shoot_items_all on public.shoot_items for all to authenticated
  using (public.is_member()) with check (public.is_member());

-- ai_usage: intentionally no policies; only the service role (bypasses RLS) touches it.
revoke all on public.ai_usage from authenticated, anon;

-- anon never needs direct table access
revoke all on public.profiles, public.team_settings, public.places, public.poses,
  public.pose_images, public.favorites, public.shoots, public.shoot_items from anon;

-- Realtime: new poses and shoot progress (RLS still applies to subscribers)
alter publication supabase_realtime add table public.poses, public.shoot_items;
