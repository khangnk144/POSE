-- Places, poses (with accent-insensitive search text) and pose images.

create table public.places (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  address text,
  maps_url text,
  note text,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);
create index places_created_at_idx on public.places (created_at desc);

create table public.poses (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text,
  status text not null default 'published' check (status in ('draft','published')),
  people_count text check (people_count in ('solo','duo','group')),
  posture text check (posture in ('stand','sit','lean','lie','walk','squat')),
  scenes text[] not null default '{}',
  tags text[] not null default '{}',
  camera_height text check (camera_height in ('overhead','eye','chest','waist','knee','ground')),
  camera_tilt text check (camera_tilt in ('level','up','down')),
  zoom text check (zoom in ('0.5x','1x','2x','3x','5x')),
  orientation text check (orientation in ('portrait','landscape','square')),
  photographer_position text,
  distance_m numeric(4,1) check (distance_m is null or distance_m >= 0),
  grid jsonb check (
    grid is null or (
      jsonb_typeof(grid) = 'object'
      and (grid->>'x')::numeric between 0 and 1
      and (grid->>'y')::numeric between 0 and 1
      and (grid->>'horizon' is null or grid->>'horizon' = 'lower')
    )
  ),
  model_steps text[] not null default '{}',
  tips text,
  place_id uuid references public.places (id) on delete set null,
  source_url text,
  source_credit text,
  search_text text not null default '',
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.pose_images (
  id uuid primary key default gen_random_uuid(),
  pose_id uuid not null references public.poses (id) on delete cascade,
  position int not null default 0 check (position between 0 and 4),
  full_path text not null,
  thumb_path text not null,
  width int,
  height int,
  dominant_color text
);
create index pose_images_pose_id_idx on public.pose_images (pose_id, position);

create or replace function public.poses_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.search_text := lower(public.immutable_unaccent(concat_ws(' ',
    new.title,
    new.description,
    array_to_string(new.tags, ' '),
    array_to_string(new.scenes, ' '),
    new.photographer_position
  )));
  if tg_op = 'UPDATE' then
    new.updated_at := now();
  end if;
  return new;
end;
$$;

create trigger poses_before_write
before insert or update on public.poses
for each row execute function public.poses_before_write();

create index poses_search_text_trgm_idx on public.poses using gin (search_text extensions.gin_trgm_ops);
create index poses_scenes_idx on public.poses using gin (scenes);
create index poses_tags_idx on public.poses using gin (tags);
create index poses_created_at_idx on public.poses (created_at desc);
create index poses_place_id_idx on public.poses (place_id);
