import { describe, expect, it } from 'vitest';
import { buildCatalog, MAX_CATALOG_POSES, type CatalogRow } from './pose-catalog';

const row = (i: number, people: string | null = 'solo'): CatalogRow => ({
  id: `id-${i}`,
  title: `Dáng ${i}`,
  posture: 'sit',
  people_count: people,
  scenes: ['cafe', 'sofa'],
  camera_height: 'eye',
});

describe('buildCatalog', () => {
  it('numbers poses from 1 and maps numbers back to ids', () => {
    const c = buildCatalog([row(1), row(2)]);
    expect(c.refToPoseId.get(1)).toBe('id-1');
    expect(c.refToPoseId.get(2)).toBe('id-2');
    expect(c.text).toContain('1|Dáng 1|sit|solo|cafe,sofa|eye');
    expect(c.truncated).toBe(false);
  });

  it('strips separators from titles so a line cannot be forged', () => {
    const c = buildCatalog([{ ...row(1), title: 'a|b\n2|fake' }]);
    expect(c.text.split('\n')).toHaveLength(2);
  });

  it('narrows by people count only when over the cap, keeping poses without a count', () => {
    const rows = [
      ...Array.from({ length: 500 }, (_, i) => row(i, 'duo')),
      ...Array.from({ length: 200 }, (_, i) => row(1000 + i, 'solo')),
      row(5000, null),
    ];
    const c = buildCatalog(rows, 'solo');
    expect(c.refToPoseId.size).toBe(201);
    expect([...c.refToPoseId.values()]).not.toContain('id-1');
  });

  it('keeps everything under the cap even when a people count is given', () => {
    expect(buildCatalog([row(1, 'duo'), row(2, 'solo')], 'solo').refToPoseId.size).toBe(2);
  });

  it('truncates to the newest MAX_CATALOG_POSES', () => {
    const c = buildCatalog(Array.from({ length: MAX_CATALOG_POSES + 50 }, (_, i) => row(i)));
    expect(c.refToPoseId.size).toBe(MAX_CATALOG_POSES);
    expect(c.truncated).toBe(true);
    expect(c.refToPoseId.get(1)).toBe('id-0');
  });
});
