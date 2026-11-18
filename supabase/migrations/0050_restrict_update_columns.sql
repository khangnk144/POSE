-- Members edit content wiki-style, but server-managed columns (created_by, created_at, id,
-- search_text, updated_at) must stay immutable: otherwise a member could re-assign created_by to
-- themselves and then pass the creator-only delete policy. RLS cannot restrict columns, so the
-- table-level UPDATE grant is replaced by column-level grants that mirror what the app writes.
-- (profiles.role is already excluded by the column grant in 0004; this migration leaves it alone.)

revoke update on public.poses, public.places, public.shoots from authenticated, anon;

grant update (
  title, description, status, people_count, posture, scenes, tags, camera_height, camera_tilt,
  zoom, orientation, photographer_position, distance_m, grid, model_steps, tips, place_id,
  source_url, source_credit
) on public.poses to authenticated;

grant update (name, address, maps_url, note) on public.places to authenticated;

grant update (name, shoot_date, place_id) on public.shoots to authenticated;
