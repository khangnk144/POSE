-- Per-user favorites, shoots (shot lists) and the AI usage counter.

create table public.favorites (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  pose_id uuid not null references public.poses (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, pose_id)
);
create index favorites_pose_id_idx on public.favorites (pose_id);

-- Runs with owner rights so counts include other users' favorites; gated by is_member().
create view public.pose_favorite_counts as
  select pose_id, count(*)::int as favorite_count
  from public.favorites
  where public.is_member()
  group by pose_id;
revoke all on public.pose_favorite_counts from public, anon;
grant select on public.pose_favorite_counts to authenticated;

create table public.shoots (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  shoot_date date,
  place_id uuid references public.places (id) on delete set null,
  created_by uuid not null default auth.uid() references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.shoot_items (
  shoot_id uuid not null references public.shoots (id) on delete cascade,
  pose_id uuid not null references public.poses (id) on delete cascade,
  position int not null default 0,
  done boolean not null default false,
  primary key (shoot_id, pose_id)
);
create index shoot_items_pose_id_idx on public.shoot_items (pose_id);

-- Written only by the server (service role). No policies for regular users.
create table public.ai_usage (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  count int not null default 0,
  primary key (user_id, day)
);
