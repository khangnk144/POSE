import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { newPoseIds, nextPosition, toPositions } from './reorder';

/**
 * Append poses to a shoot's shot list. Poses already in the shoot are skipped, including ones a
 * teammate added concurrently (the insert ignores primary-key conflicts instead of failing).
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
  const { data: added, error } = await supabase
    .from('shoot_items')
    .upsert(
      fresh.map((pose_id, i) => ({ shoot_id: shootId, pose_id, position: start + i })),
      { onConflict: 'shoot_id,pose_id', ignoreDuplicates: true },
    )
    .select('pose_id');
  if (error) throw new Error(error.message);
  return added.length;
}

/**
 * Persist a new order. Every row is written (0..n-1): removals leave gaps in the stored positions,
 * so writing only the moved rows could leave ties with untouched ones.
 */
export async function saveShootOrder(shootId: string, order: string[]): Promise<void> {
  const supabase = createSupabaseBrowserClient();
  const results = await Promise.all(
    toPositions(order).map((u) =>
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
