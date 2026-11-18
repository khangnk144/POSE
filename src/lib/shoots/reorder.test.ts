import { describe, expect, it } from 'vitest';
import { changedPositions, moveItem, newPoseIds, nextPosition, toPositions } from './reorder';

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

describe('toPositions / changedPositions', () => {
  it('numbers contiguously from 0', () => {
    expect(toPositions(['x', 'y'])).toEqual([
      { poseId: 'x', position: 0 },
      { poseId: 'y', position: 1 },
    ]);
  });
  it('lists only rows whose position changed', () => {
    expect(changedPositions(['a', 'b', 'c'], ['a', 'c', 'b'])).toEqual([
      { poseId: 'c', position: 1 },
      { poseId: 'b', position: 2 },
    ]);
    expect(changedPositions(['a', 'b'], ['a', 'b'])).toEqual([]);
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
