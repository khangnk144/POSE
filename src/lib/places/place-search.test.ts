import { describe, expect, it } from 'vitest';
import { filterPlaces, foldText } from './place-search';

describe('foldText', () => {
  it('removes diacritics, maps đ and lowercases', () => {
    expect(foldText('  Đà Lạt Hồ Xuân Hương ')).toBe('da lat ho xuan huong');
  });
});

describe('filterPlaces', () => {
  const places = [
    { name: 'Cà phê Đồi', address: '12 Lê Lợi' },
    { name: 'Hồ Gươm', address: null },
  ];
  it('matches name or address without accents', () => {
    expect(filterPlaces(places, 'doi')).toHaveLength(1);
    expect(filterPlaces(places, 'le loi')[0].name).toBe('Cà phê Đồi');
    expect(filterPlaces(places, 'GUOM')[0].name).toBe('Hồ Gươm');
  });
  it('returns everything for an empty query and nothing for no match', () => {
    expect(filterPlaces(places, '  ')).toHaveLength(2);
    expect(filterPlaces(places, 'xyz')).toHaveLength(0);
  });
});
