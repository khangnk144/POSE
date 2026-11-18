import { describe, expect, it } from 'vitest';
import { formatShootDate } from './format-date';

describe('formatShootDate', () => {
  it('formats ISO dates as dd/mm/yyyy', () => {
    expect(formatShootDate('2026-11-18')).toBe('18/11/2026');
  });
  it('returns null for empty or malformed values', () => {
    expect(formatShootDate(null)).toBeNull();
    expect(formatShootDate('')).toBeNull();
    expect(formatShootDate('18/11/2026')).toBeNull();
  });
});
