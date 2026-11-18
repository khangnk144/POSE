import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';

/**
 * Toggle the current user's favorite on a pose (insert or delete a row in `favorites`).
 *
 * @returns the new state: true when the pose is now a favorite.
 * @throws when the request fails; callers revert their optimistic UI and show a toast.
 */
export async function toggleFavorite(poseId: string): Promise<boolean> {
  const supabase = createSupabaseBrowserClient();

  // RLS limits deletes to the caller's own row, so no user id filter is needed.
  const removed = await supabase.from('favorites').delete().eq('pose_id', poseId).select('pose_id');
  if (removed.error) throw new Error(`unfavorite failed: ${removed.error.message}`);
  if (removed.data.length > 0) return false;

  // user_id defaults to auth.uid().
  const added = await supabase.from('favorites').insert({ pose_id: poseId });
  if (added.error) {
    // A double tap raced us and the row already exists: the pose is a favorite.
    if (added.error.code === '23505') return true;
    throw new Error(`favorite failed: ${added.error.message}`);
  }
  return true;
}
