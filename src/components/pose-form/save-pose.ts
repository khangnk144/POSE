import type { SupabaseClient } from '@supabase/supabase-js';
import { removeStorageFiles, uploadProcessedImage, type UploadedImage } from '@/lib/images/upload-pose-images';
import type { PoseDraft } from '@/lib/schemas/pose-draft-schema';
import type { Database } from '@/lib/types/database';
import type { ExistingImage, FormImage, NewImage } from './form-image';
import { draftToRow } from './pose-row-mapping';

type Client = SupabaseClient<Database>;
type ImageRow = Database['public']['Tables']['pose_images']['Insert'];

export type SaveProgress = (imageId: string, fraction: number) => void;

function toImageRow(poseId: string, u: UploadedImage, position: number): ImageRow {
  return {
    id: u.id,
    pose_id: poseId,
    position,
    full_path: u.fullPath,
    thumb_path: u.thumbPath,
    width: u.width,
    height: u.height,
    dominant_color: u.dominantColor,
  };
}

const pathsOf = (list: UploadedImage[]) => list.flatMap((u) => [u.fullPath, u.thumbPath]);

/**
 * Uploads all new images in parallel. If any upload fails, the ones that succeeded are
 * removed again (each failed image already cleaned up after itself) and the first error
 * is thrown, so nothing is left in storage.
 */
async function uploadAll(
  supabase: Client,
  poseId: string,
  images: NewImage[],
  onProgress?: SaveProgress,
): Promise<UploadedImage[]> {
  const results = await Promise.allSettled(
    images.map((img) => uploadProcessedImage(supabase, poseId, img.processed, (f) => onProgress?.(img.id, f))),
  );
  const ok = results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
  const failed = results.find((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failed) {
    await removeStorageFiles(supabase, pathsOf(ok));
    throw failed.reason;
  }
  return ok;
}

/**
 * Creates a pose with its images. Files go up first, then the pose row, then the image
 * rows, so a pose never shows up without its images. Any failure removes the uploaded
 * files and the pose row.
 */
export async function createPose(
  supabase: Client,
  draft: PoseDraft,
  images: FormImage[],
  onProgress?: SaveProgress,
): Promise<string> {
  const poseId = crypto.randomUUID();
  const newImages = images.filter((i): i is NewImage => i.kind === 'new');
  const uploaded = await uploadAll(supabase, poseId, newImages, onProgress);
  let poseInserted = false;
  try {
    const { error } = await supabase.from('poses').insert({ ...draftToRow(draft), id: poseId, title: draft.title });
    if (error) throw new Error(error.message);
    poseInserted = true;
    if (uploaded.length > 0) {
      const rows = uploaded.map((u) => toImageRow(poseId, u, images.findIndex((i) => i.id === u.id)));
      const { error: imgError } = await supabase.from('pose_images').insert(rows);
      if (imgError) throw new Error(imgError.message);
    }
    return poseId;
  } catch (err) {
    if (poseInserted) await supabase.from('poses').delete().eq('id', poseId);
    await removeStorageFiles(supabase, pathsOf(uploaded));
    throw err;
  }
}

/**
 * Updates a pose: new files are uploaded first, then the pose row and image rows change,
 * and only at the end are removed images deleted (rows, then storage files).
 * Failure before that point removes the newly uploaded files and leaves old data intact.
 */
export async function updatePose(
  supabase: Client,
  poseId: string,
  draft: PoseDraft,
  images: FormImage[],
  removed: ExistingImage[],
  onProgress?: SaveProgress,
): Promise<void> {
  const newImages = images.filter((i): i is NewImage => i.kind === 'new');
  const uploaded = await uploadAll(supabase, poseId, newImages, onProgress);
  try {
    const { error } = await supabase.from('poses').update(draftToRow(draft)).eq('id', poseId);
    if (error) throw new Error(error.message);

    if (uploaded.length > 0) {
      const rows = uploaded.map((u) => toImageRow(poseId, u, images.findIndex((i) => i.id === u.id)));
      // upsert: a retry after a partial failure must not trip over rows that already exist
      const { error: insError } = await supabase.from('pose_images').upsert(rows, { onConflict: 'id' });
      if (insError) throw new Error(insError.message);
    }
  } catch (err) {
    await removeStorageFiles(supabase, pathsOf(uploaded));
    throw err;
  }

  const kept = images.flatMap((img, position) => (img.kind === 'existing' ? [{ id: img.id, position }] : []));
  const moves = await Promise.all(
    kept.map(({ id, position }) => supabase.from('pose_images').update({ position }).eq('id', id)),
  );
  const moveError = moves.find((m) => m.error)?.error;
  if (moveError) throw new Error(moveError.message);

  if (removed.length > 0) {
    const { error } = await supabase.from('pose_images').delete().in('id', removed.map((r) => r.id));
    if (error) throw new Error(error.message);
    await removeStorageFiles(supabase, removed.flatMap((r) => [r.fullPath, r.thumbPath]));
  }
}
