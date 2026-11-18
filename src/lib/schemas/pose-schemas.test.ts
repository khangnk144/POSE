import { describe, expect, it } from 'vitest';
import { poseDraftSchema } from './pose-draft-schema';
import { poseFiltersSchema } from './pose-filters-schema';

describe('poseDraftSchema', () => {
  it('requires a non-blank title', () => {
    expect(poseDraftSchema.safeParse({}).success).toBe(false);
    expect(poseDraftSchema.safeParse({ title: '   ' }).success).toBe(false);
  });

  it('applies defaults for a title-only draft', () => {
    const draft = poseDraftSchema.parse({ title: '  Ngồi sofa  ' });
    expect(draft).toEqual({ title: 'Ngồi sofa', status: 'published', scenes: [], tags: [], modelSteps: [] });
  });

  it('accepts a full draft', () => {
    const result = poseDraftSchema.safeParse({
      title: 'Dựa tường',
      status: 'draft',
      peopleCount: 'duo',
      posture: 'lean',
      scenes: ['wall'],
      tags: ['nắng'],
      cameraHeight: 'waist',
      cameraTilt: 'up',
      zoom: '2x',
      orientation: 'portrait',
      photographerPosition: 'Đứng cách 2m',
      distanceM: 2.5,
      grid: { x: 0.33, y: 0.5, horizon: 'lower' },
      modelSteps: ['Tay đặt lên gối'],
      sourceUrl: 'https://pinterest.com/pin/1',
    });
    expect(result.success).toBe(true);
  });

  it.each([
    ['unknown enum', { cameraHeight: 'sky' }],
    ['grid out of range', { grid: { x: 1.2, y: 0.5 } }],
    ['non-http source url', { sourceUrl: 'javascript:alert(1)' }],
    ['bad place id', { placeId: 'abc' }],
    ['negative distance', { distanceM: -1 }],
    ['too many steps', { modelSteps: Array.from({ length: 13 }, () => 'x') }],
  ])('rejects %s', (_name, extra) => {
    expect(poseDraftSchema.safeParse({ title: 'x', ...extra }).success).toBe(false);
  });

  it('defaults grid horizon to null', () => {
    expect(poseDraftSchema.parse({ title: 'x', grid: { x: 0, y: 1 } }).grid).toEqual({ x: 0, y: 1, horizon: null });
  });

  it('partial() lets AI return a subset of fields', () => {
    expect(poseDraftSchema.partial().safeParse({ zoom: '1x' }).success).toBe(true);
  });
});

describe('poseFiltersSchema', () => {
  it('accepts valid filters and rejects bad enum values', () => {
    expect(poseFiltersSchema.safeParse({ people: ['solo'], favoritesOnly: true }).success).toBe(true);
    expect(poseFiltersSchema.safeParse({ zoom: ['10x'] }).success).toBe(false);
    expect(poseFiltersSchema.safeParse({ scenes: ['Has Space'] }).success).toBe(false);
  });
});
