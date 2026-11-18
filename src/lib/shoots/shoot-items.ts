/**
 * Append poses to a shoot's shot list. Poses already in the shoot are skipped.
 *
 * @returns how many poses were actually added.
 * @throws when the request fails.
 *
 * Owner: shoots phase (replaces this stub). Callers: pose card and pose detail.
 */
export async function addPosesToShoot(shootId: string, poseIds: string[]): Promise<number> {
  void shootId;
  void poseIds;
  throw new Error('not implemented');
}
