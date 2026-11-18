import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { signPaths } from '@/lib/shoots/signed-urls';
import type { Database } from '@/lib/types/database';

export type PlaceListItem = {
  id: string;
  name: string;
  address: string | null;
  mapsUrl: string | null;
  note: string | null;
  createdBy: string;
  poseCount: number;
  /** Signed thumbnail of the newest pose at this place that has an image. */
  coverUrl: string | null;
};

type Client = SupabaseClient<Database>;

/** All places A-Z with published-pose count and a cover from the newest pose that has an image. */
export async function listPlaces(supabase: Client): Promise<PlaceListItem[]> {
  const { data: places, error } = await supabase
    .from('places')
    .select('id, name, address, maps_url, note, created_by')
    .order('name');
  if (error) throw new Error(error.message);
  if (places.length === 0) return [];

  const { data: poses, error: posesError } = await supabase
    .from('poses')
    .select('place_id, created_at, pose_images(thumb_path, position)')
    .eq('status', 'published')
    .in('place_id', places.map((p) => p.id))
    .order('created_at', { ascending: false });
  if (posesError) throw new Error(posesError.message);

  const counts = new Map<string, number>();
  const coverPath = new Map<string, string>();
  for (const pose of poses) {
    if (!pose.place_id) continue;
    counts.set(pose.place_id, (counts.get(pose.place_id) ?? 0) + 1);
    if (!coverPath.has(pose.place_id)) {
      const first = [...pose.pose_images].sort((a, b) => a.position - b.position)[0];
      if (first) coverPath.set(pose.place_id, first.thumb_path);
    }
  }

  const urls = await signPaths(supabase, [...coverPath.values()]);
  return places.map((p) => ({
    id: p.id,
    name: p.name,
    address: p.address,
    mapsUrl: p.maps_url,
    note: p.note,
    createdBy: p.created_by,
    poseCount: counts.get(p.id) ?? 0,
    coverUrl: urls.get(coverPath.get(p.id) ?? '') ?? null,
  }));
}

/** One place, or null when it does not exist. */
export async function getPlace(supabase: Client, id: string) {
  const { data, error } = await supabase
    .from('places')
    .select('id, name, address, maps_url, note, created_by')
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}
