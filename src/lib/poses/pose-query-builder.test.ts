import { describe, expect, it } from 'vitest';
import {
  applyPoseConditions,
  buildPoseConditions,
  decodeCursor,
  encodeCursor,
  poseCardSelect,
} from './pose-query-builder';

const PUBLISHED = { op: 'eq', column: 'status', value: 'published' };
const ID = '0a1b2c3d-1111-4222-8333-444455556666';
const TS = '2026-11-18T07:30:00.123456+00:00';

describe('buildPoseConditions', () => {
  it('only filters on published status by default', () => {
    expect(buildPoseConditions({})).toEqual([PUBLISHED]);
  });
  it('uses the requested status (drafts)', () => {
    expect(buildPoseConditions({ status: 'draft' })).toEqual([{ op: 'eq', column: 'status', value: 'draft' }]);
  });
  it('search: one accent-free ilike per word on search_text', () => {
    expect(buildPoseConditions({ q: 'Ngồi sofa' })).toEqual([
      PUBLISHED,
      { op: 'ilike', column: 'search_text', pattern: '%ngoi%' },
      { op: 'ilike', column: 'search_text', pattern: '%sofa%' },
    ]);
  });
  it('search: escapes LIKE wildcards', () => {
    expect(buildPoseConditions({ q: '100%' })).toContainEqual({
      op: 'ilike',
      column: 'search_text',
      pattern: '%100\\%%',
    });
  });
  it.each([
    ['people', { people: ['solo', 'duo'] }, 'people_count', ['solo', 'duo']],
    ['posture', { posture: ['sit'] }, 'posture', ['sit']],
    ['height', { height: ['waist'] }, 'camera_height', ['waist']],
    ['tilt', { tilt: ['up'] }, 'camera_tilt', ['up']],
    ['zoom', { zoom: ['1x', '2x'] }, 'zoom', ['1x', '2x']],
    ['orientation', { orientation: ['portrait'] }, 'orientation', ['portrait']],
  ] as const)('%s becomes an IN condition', (_name, filters, column, values) => {
    expect(buildPoseConditions(filters as never)).toContainEqual({ op: 'in', column, values: [...values] });
  });
  it('scenes use array overlap', () => {
    expect(buildPoseConditions({ scenes: ['cafe', 'sofa'] })).toContainEqual({
      op: 'overlaps',
      column: 'scenes',
      values: ['cafe', 'sofa'],
    });
  });
  it('place and creator are equality filters', () => {
    const conditions = buildPoseConditions({ placeId: ID, createdBy: ID });
    expect(conditions).toContainEqual({ op: 'eq', column: 'place_id', value: ID });
    expect(conditions).toContainEqual({ op: 'eq', column: 'created_by', value: ID });
  });
  it('skips empty arrays', () => {
    expect(buildPoseConditions({ people: [], scenes: [] })).toEqual([PUBLISHED]);
  });
  it('combines the "Ngang hông" + "Ngồi" library filter', () => {
    const conditions = buildPoseConditions({ height: ['waist'], posture: ['sit'] });
    expect(conditions).toContainEqual({ op: 'in', column: 'camera_height', values: ['waist'] });
    expect(conditions).toContainEqual({ op: 'in', column: 'posture', values: ['sit'] });
  });
  it('cursor adds a keyset condition on (created_at, id)', () => {
    const conditions = buildPoseConditions({}, { createdAt: TS, id: ID });
    expect(conditions.at(-1)).toEqual({
      op: 'or',
      expression: `created_at.lt."${TS}",and(created_at.eq."${TS}",id.lt.${ID})`,
    });
  });
  it('no cursor condition on the first page', () => {
    expect(buildPoseConditions({}, null).some((c) => c.op === 'or')).toBe(false);
  });
});

describe('cursor encoding', () => {
  it('round-trips', () => {
    expect(decodeCursor(encodeCursor({ createdAt: TS, id: ID }))).toEqual({ createdAt: TS, id: ID });
  });
  it('is url-safe', () => {
    expect(encodeCursor({ createdAt: TS, id: ID })).toMatch(/^[A-Za-z0-9_-]+$/);
  });
  it.each([null, undefined, '', 'not-base64!!', btoa('x|y'), btoa(`${TS}|not-a-uuid`), btoa('a|b|c')])(
    'rejects invalid cursor %s',
    (raw) => {
      expect(decodeCursor(raw as string | null | undefined)).toBeNull();
    },
  );
  it('rejects injection through the cursor', () => {
    expect(decodeCursor(btoa(`${TS}),id.gt.0|${ID}`))).toBeNull();
  });
});

describe('applyPoseConditions', () => {
  it('calls the matching builder method for each condition, in order', () => {
    const calls: unknown[][] = [];
    const proxy: Record<string, (...args: unknown[]) => unknown> = {};
    for (const m of ['eq', 'in', 'overlaps', 'ilike', 'or']) {
      proxy[m] = (...args) => {
        calls.push([m, ...args]);
        return proxy;
      };
    }
    applyPoseConditions(proxy, buildPoseConditions({ q: 'sofa', zoom: ['1x'], scenes: ['cafe'] }));
    expect(calls).toEqual([
      ['eq', 'status', 'published'],
      ['ilike', 'search_text', '%sofa%'],
      ['in', 'zoom', ['1x']],
      ['overlaps', 'scenes', ['cafe']],
    ]);
  });
});

describe('poseCardSelect', () => {
  it('left-embeds the viewer favorite by default', () => {
    expect(poseCardSelect({})).toContain('fav:favorites(user_id)');
  });
  it('inner-joins favorites for favoritesOnly', () => {
    expect(poseCardSelect({ favoritesOnly: true })).toContain('fav:favorites!inner(user_id)');
  });
});
