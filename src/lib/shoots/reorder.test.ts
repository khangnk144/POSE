import { describe, expect, it } from 'vitest';
import { moveItem, newPoseIds, nextPosition, toPositions } from './reorder';

describe('moveItem', () => {
  it('moves forward and backward', () => {
    expect(moveItem(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd']);
    expect(moveItem(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c']);
  });
  it('does not mutate and clamps the target', () => {
    const src = ['a', 'b', 'c'];
    expect(moveItem(src, 0, 99)).toEqual(['b', 'c', 'a']);
    expect(moveItem(src, 2, -5)).toEqual(['c', 'a', 'b']);
    expect(src).toEqual(['a', 'b', 'c']);
  });
  it('ignores an out-of-range source', () => {
    expect(moveItem(['a', 'b'], 5, 0)).toEqual(['a', 'b']);
  });
});

describe('toPositions', () => {
  it('numbers contiguously from 0', () => {
    expect(toPositions(['x', 'y'])).toEqual([
      { poseId: 'x', position: 0 },
      { poseId: 'y', position: 1 },
    ]);
  });
  it('renumbers every row after a removal left gaps, so no ties remain', () => {
    // stored positions after removing "b": a0 c2 d3 e4; UI list is [a, c, d, e]; user drags e above d
    const order = moveItem(['a', 'c', 'd', 'e'], 3, 2);
    const positions = toPositions(order);
    expect(positions).toEqual([
      { poseId: 'a', position: 0 },
      { poseId: 'c', position: 1 },
      { poseId: 'e', position: 2 },
      { poseId: 'd', position: 3 },
    ]);
    expect(new Set(positions.map((p) => p.position)).size).toBe(positions.length);
  });
});

describe('nextPosition / newPoseIds', () => {
  it('appends after the max position, 0 when empty', () => {
    expect(nextPosition([])).toBe(0);
    expect(nextPosition([0, 4, 2])).toBe(5);
  });
  it('skips poses already in the shoot and duplicates in the request', () => {
    expect(newPoseIds(['a'], ['a', 'b', 'b', 'c'])).toEqual(['b', 'c']);
    expect(newPoseIds([], [])).toEqual([]);
  });
});
