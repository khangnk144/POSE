import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import type { ClaudeImage } from './claude-client';
import { MAX_STORED_BYTES, toClaudeImage } from './image-input';

/**
 * Download already-uploaded pose images (as the signed-in member, so RLS and storage policies
 * apply) for the model. Uses the full image, falling back to the thumbnail when the full one is
 * too big. Returns null when any id is unknown, unreadable or not a valid image.
 */
export async function loadStoredImages(
  supabase: SupabaseClient<Database>,
  imageIds: string[],
): Promise<ClaudeImage[] | null> {
  const { data: rows, error } = await supabase
    .from('pose_images')
    .select('id, full_path, thumb_path')
    .in('id', imageIds);
  if (error || !rows || rows.length !== new Set(imageIds).size) return null;

  const byId = new Map(rows.map((r) => [r.id, r]));
  const images: ClaudeImage[] = [];
  for (const id of imageIds) {
    const row = byId.get(id);
    if (!row) return null;
    const image = await downloadOne(supabase, [row.full_path, row.thumb_path]);
    if (!image) return null;
    images.push(image);
  }
  return images;
}

async function downloadOne(supabase: SupabaseClient<Database>, paths: string[]): Promise<ClaudeImage | null> {
  for (const path of paths) {
    const { data, error } = await supabase.storage.from('pose-images').download(path);
    if (error || !data) continue;
    const image = toClaudeImage(new Uint8Array(await data.arrayBuffer()), MAX_STORED_BYTES);
    if (image) return image;
  }
  return null;
}
