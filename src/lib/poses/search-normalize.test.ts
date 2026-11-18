import { describe, expect, it } from 'vitest';
import { escapeLikePattern, normalizeSearchText, searchTokens } from './search-normalize';

describe('normalizeSearchText', () => {
  it('removes accents and lowercases so "Ngồi sofa" matches "ngoi sofa"', () => {
    expect(normalizeSearchText('Ngồi SOFA')).toBe('ngoi sofa');
  });
  it('maps đ/Đ to d like the database trigger', () => {
    expect(normalizeSearchText('Đứng dựa tường')).toBe('dung dua tuong');
  });
  it('is stable for composed and decomposed input', () => {
    expect(normalizeSearchText('Café')).toBe(normalizeSearchText('Café'));
  });
  it('collapses whitespace', () => {
    expect(normalizeSearchText('  cầu   thang ')).toBe('cau thang');
  });
});

describe('searchTokens', () => {
  it('splits into normalised words', () => {
    expect(searchTokens('Ngồi sofa')).toEqual(['ngoi', 'sofa']);
  });
  it('returns nothing for empty or missing input', () => {
    expect(searchTokens(undefined)).toEqual([]);
    expect(searchTokens('   ')).toEqual([]);
  });
  it('caps the number of words', () => {
    expect(searchTokens('a b c d e f g h')).toHaveLength(6);
  });
});

describe('escapeLikePattern', () => {
  it('escapes wildcard characters', () => {
    expect(escapeLikePattern('50%_off\\')).toBe('50\\%\\_off\\\\');
  });
});
