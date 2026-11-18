/** Pure helpers for ordering the shot list. Positions are 0-based and contiguous. */

export type PositionUpdate = { poseId: string; position: number };

/** Returns a copy of `items` with the element at `from` moved to index `to` (clamped). */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  if (from < 0 || from >= next.length) return next;
  const target = Math.max(0, Math.min(next.length - 1, to));
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
}

/** Contiguous positions (0..n-1) for an ordered list of pose ids. */
export function toPositions(poseIds: readonly string[]): PositionUpdate[] {
  return poseIds.map((poseId, position) => ({ poseId, position }));
}

/** Only the rows whose position differs between the old and new order (fewer writes). */
export function changedPositions(before: readonly string[], after: readonly string[]): PositionUpdate[] {
  const old = new Map(before.map((id, i) => [id, i]));
  return toPositions(after).filter((u) => old.get(u.poseId) !== u.position);
}

/** Next free position when appending to a list whose existing positions are known. */
export function nextPosition(positions: readonly number[]): number {
  return positions.length === 0 ? 0 : Math.max(...positions) + 1;
}

/** Ids not yet in the shoot, de-duplicated, order preserved. */
export function newPoseIds(existing: readonly string[], requested: readonly string[]): string[] {
  const seen = new Set(existing);
  const out: string[] = [];
  for (const id of requested) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out;
}
