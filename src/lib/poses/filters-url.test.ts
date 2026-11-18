import { describe, expect, it } from 'vitest';
import type { PoseFilters } from '@/lib/types/pose';
import { countActiveFilters, parseFilters, serializeFilters } from './filters-url';

const UUID = '3f2b1c9e-8a4d-4c1e-9b7a-2d5e6f708192';

describe('filters-url', () => {
  it('round-trips a full filter set', () => {
    const filters: PoseFilters = {
      q: 'ngồi sofa',
      people: ['solo', 'duo'],
      posture: ['sit'],
      scenes: ['cafe', 'sofa'],
      height: ['waist', 'knee'],
      tilt: ['up'],
      zoom: ['0.5x', '1x'],
      orientation: ['portrait'],
      placeId: UUID,
      createdBy: UUID,
      favoritesOnly: true,
      status: 'draft',
    };
    const params = serializeFilters(filters);
    expect(parseFilters(new URLSearchParams(params.toString()))).toEqual(filters);
  });

  it('round-trips empty filters to empty params', () => {
    expect(serializeFilters({}).toString()).toBe('');
    expect(parseFilters(new URLSearchParams())).toEqual({});
  });

  it('accepts Next.js searchParams objects', () => {
    expect(parseFilters({ people: 'solo,group', fav: '1', q: 'biển' })).toEqual({
      people: ['solo', 'group'],
      favoritesOnly: true,
      q: 'biển',
    });
  });

  it('drops invalid values but keeps valid ones', () => {
    const parsed = parseFilters(
      new URLSearchParams('people=solo,alien&zoom=9x&place=not-a-uuid&status=weird&scenes=cafe,Bad Scene'),
    );
    expect(parsed).toEqual({ people: ['solo'], scenes: ['cafe'] });
  });

  it('ignores unknown keys and blank values', () => {
    expect(parseFilters(new URLSearchParams('foo=bar&q=%20%20&people='))).toEqual({});
  });

  it('keeps scenes and zoom values with special characters intact', () => {
    const params = serializeFilters({ zoom: ['0.5x'], scenes: ['green-ery'] });
    expect(params.get('zoom')).toBe('0.5x');
    expect(parseFilters(params)).toEqual({ zoom: ['0.5x'], scenes: ['green-ery'] });
  });

  it('counts active filters without the search text', () => {
    expect(countActiveFilters({ q: 'x' })).toBe(0);
    expect(countActiveFilters({ q: 'x', people: ['solo'], favoritesOnly: true, scenes: [] })).toBe(2);
  });
});
