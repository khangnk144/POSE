import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import type { ProcessedImage } from './process-image';

export const POSE_IMAGES_BUCKET = 'pose-images';

type Client = SupabaseClient<Database>;

/** Storage paths of one image: `poses/{poseId}/{imageId}-{full|thumb}.webp`. */
export function poseImagePaths(poseId: string, imageId: string) {
  return {
    full: `poses/${poseId}/${imageId}-full.webp`,
    thumb: `poses/${poseId}/${imageId}-thumb.webp`,
  };
}

export type UploadedImage = {
  id: string;
  fullPath: string;
  thumbPath: string;
  width: number;
  height: number;
  dominantColor: string;
};

async function put(supabase: Client, path: string, blob: Blob) {
  const { error } = await supabase.storage
    .from(POSE_IMAGES_BUCKET)
    .upload(path, blob, { contentType: blob.type, cacheControl: '31536000', upsert: true });
  if (error) throw new Error(`Upload ${path}: ${error.message}`);
}

/**
 * Uploads full + thumb of one processed image. `onProgress` gets 0.5 after the full file
 * and 1 after the thumb (the storage client has no byte-level progress). On failure the
 * files of this image that already went up are removed before the error is rethrown.
 */
export async function uploadProcessedImage(
  supabase: Client,
  poseId: string,
  image: ProcessedImage,
  onProgress?: (fraction: number) => void,
): Promise<UploadedImage> {
  const paths = poseImagePaths(poseId, image.id);
  const done: string[] = [];
  try {
    await put(supabase, paths.full, image.full);
    done.push(paths.full);
    onProgress?.(0.5);
    await put(supabase, paths.thumb, image.thumb);
    done.push(paths.thumb);
    onProgress?.(1);
  } catch (err) {
    await removeStorageFiles(supabase, done);
    throw err;
  }
  return {
    id: image.id,
    fullPath: paths.full,
    thumbPath: paths.thumb,
    width: image.width,
    height: image.height,
    dominantColor: image.dominantColor,
  };
}

/** Best-effort removal; never throws (used for cleanup after a failure). */
export async function removeStorageFiles(supabase: Client, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  try {
    await supabase.storage.from(POSE_IMAGES_BUCKET).remove(paths);
  } catch {
    // Cleanup is best effort: a leftover file is harmless, a thrown error would hide the real one.
  }
}
