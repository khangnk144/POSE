import { describe, expect, it } from 'vitest';
import { describeGridPosition, parsePoseGrid } from './grid-position';
import { relativeTimeVi } from './relative-time';

describe('parsePoseGrid', () => {
  it('accepts a valid grid and defaults horizon to null', () => {
    expect(parsePoseGrid({ x: 0.33, y: 0.5 })).toEqual({ x: 0.33, y: 0.5, horizon: null });
  });
  it.each([null, undefined, {}, { x: 2, y: 0.5 }, 'x'])('rejects %j', (raw) => {
    expect(parsePoseGrid(raw)).toBeNull();
  });
});

describe('describeGridPosition', () => {
  it('left third', () => {
    expect(describeGridPosition({ x: 0.33, y: 0.5, horizon: null })).toBe('Đặt người ở 1/3 bên trái, giữa.');
  });
  it('right third, upper half, with lower horizon', () => {
    expect(describeGridPosition({ x: 0.67, y: 0.33, horizon: 'lower' })).toBe(
      'Đặt người ở 1/3 bên phải, nửa trên. Đường chân trời nằm ở 1/3 dưới.',
    );
  });
  it('centre', () => {
    expect(describeGridPosition({ x: 0.5, y: 0.5, horizon: null })).toBe('Đặt người ở chính giữa khung.');
  });
});

describe('relativeTimeVi', () => {
  const now = new Date('2026-11-18T12:00:00Z');
  it.each([
    ['2026-11-18T11:59:50Z', 'vừa xong'],
    ['2026-11-18T11:30:00Z', '30 phút trước'],
    ['2026-11-18T09:00:00Z', '3 giờ trước'],
    ['2026-11-15T12:00:00Z', '3 ngày trước'],
    ['2026-08-18T12:00:00Z', '3 tháng trước'],
    ['2024-11-18T12:00:00Z', '2 năm trước'],
  ])('%s -> %s', (iso, expected) => {
    expect(relativeTimeVi(iso, now)).toBe(expected);
  });
});
