/**
 * Toggle the current user's favorite on a pose (insert or delete a row in `favorites`).
 *
 * @returns the new state: true when the pose is now a favorite.
 * @throws when the request fails; callers revert their optimistic UI and show a toast.
 *
 * Owner: library phase (replaces this stub).
 */
export async function toggleFavorite(poseId: string): Promise<boolean> {
  void poseId;
  throw new Error('not implemented');
}
