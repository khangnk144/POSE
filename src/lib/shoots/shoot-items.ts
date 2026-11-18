import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { changedPositions, newPoseIds, nextPosition } from './reorder';

/**
 * Append poses to a shoot's shot list. Poses already in the shoot are skipped.
 *
 * @returns how many poses were actually added.
 * @throws when the request fails.
 */
export async function addPosesToShoot(shootId: string, poseIds: string[]): Promise<number> {
  const supabase = createSupabaseBrowserClient();
  const { data: existing, error: readError } = await supabase
    .from('shoot_items')
    .select('pose_id, position')
    .eq('shoot_id', shootId);
  if (readError) throw new Error(readError.message);

  const fresh = newPoseIds(
    existing.map((r) => r.pose_id),
    poseIds,
  );
  if (fresh.length === 0) return 0;

  const start = nextPosition(existing.map((r) => r.position));
  const { error } = await supabase
    .from('shoot_items')
    .insert(fresh.map((pose_id, i) => ({ shoot_id: shootId, pose_id, position: start + i })));
  if (error) throw new Error(error.message);
  return fresh.length;
}

/** Persist a new order. Only rows whose position changed are written. */
export async function saveShootOrder(shootId: string, before: string[], after: string[]): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const results = await Promise.all(
    changedPositions(before, after).map((u) =>
      supabase.from('shoot_items').update({ position: u.position }).eq('shoot_id', shootId).eq('pose_id', u.poseId),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
}

export async function setItemDone(shootId: string, poseId: string, done: boolean): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('shoot_items')
    .update({ done })
    .eq('shoot_id', shootId)
    .eq('pose_id', poseId);
  if (error) throw new Error(error.message);
}

export async function removeShootItem(shootId: string, poseId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from('shoot_items')
    .delete()
    .eq('shoot_id', shootId)
    .eq('pose_id', poseId);
  if (error) throw new Error(error.message);
}
