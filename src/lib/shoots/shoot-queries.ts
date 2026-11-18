import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { CameraHeight, Zoom } from '@/lib/types/pose';
import type { Database } from '@/lib/types/database';
import { signPaths } from '@/lib/poses/signed-urls';

type Client = SupabaseClient<Database>;

export type ShootListItem = {
  id: string;
  name: string;
  shootDate: string | null;
  placeName: string | null;
  itemCount: number;
  doneCount: number;
};

export type ShootItemView = {
  poseId: string;
  title: string;
  done: boolean;
  thumbUrl: string | null;
  fullUrl: string | null;
  dominantColor: string | null;
  cameraHeight: CameraHeight | null;
  zoom: Zoom | null;
  photographerPosition: string | null;
  steps: string[];
};

export type ShootDetail = {
  id: string;
  name: string;
  shootDate: string | null;
  placeId: string | null;
  placeName: string | null;
  createdBy: string;
  items: ShootItemView[];
};

/** Shoots, newest date first (undated last), with progress counts. */
export async function listShoots(supabase: Client): Promise<ShootListItem[]> {
  const { data, error } = await supabase
    .from('shoots')
    .select('id, name, shoot_date, created_at, places(name), shoot_items(done)')
    .order('shoot_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return data.map((s) => ({
    id: s.id,
    name: s.name,
    shootDate: s.shoot_date,
    placeName: s.places?.name ?? null,
    itemCount: s.shoot_items.length,
    doneCount: s.shoot_items.filter((i) => i.done).length,
  }));
}

/** A shoot with ordered items (title, cover, camera notes) and signed image URLs; null if missing. */
export async function getShoot(supabase: Client, id: string): Promise<ShootDetail | null> {
  const { data: shoot, error } = await supabase
    .from('shoots')
    .select('id, name, shoot_date, place_id, created_by, places(name)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!shoot) return null;

  const { data: rows, error: itemsError } = await supabase
    .from('shoot_items')
    .select(
      'pose_id, position, done, poses(title, camera_height, zoom, photographer_position, model_steps, pose_images(thumb_path, full_path, position, dominant_color))',
    )
    .eq('shoot_id', id)
    .order('position')
    .order('pose_id');
  if (itemsError) throw new Error(itemsError.message);

  const covers = rows.map((r) => [...(r.poses?.pose_images ?? [])].sort((a, b) => a.position - b.position)[0]);
  const urls = await signPaths(
    supabase,
    covers.flatMap((c) => (c ? [c.thumb_path, c.full_path] : [])),
  );

  const items: ShootItemView[] = rows.flatMap((r, i) => {
    if (!r.poses) return [];
    const cover = covers[i];
    return [
      {
        poseId: r.pose_id,
        title: r.poses.title,
        done: r.done,
        thumbUrl: cover ? (urls.get(cover.thumb_path) ?? null) : null,
        fullUrl: cover ? (urls.get(cover.full_path) ?? null) : null,
        dominantColor: cover?.dominant_color ?? null,
        cameraHeight: r.poses.camera_height as CameraHeight | null,
        zoom: r.poses.zoom as Zoom | null,
        photographerPosition: r.poses.photographer_position,
        steps: r.poses.model_steps ?? [],
      },
    ];
  });

  return {
    id: shoot.id,
    name: shoot.name,
    shootDate: shoot.shoot_date,
    placeId: shoot.place_id,
    placeName: shoot.places?.name ?? null,
    createdBy: shoot.created_by,
    items,
  };
}
