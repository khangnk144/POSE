import { describe, expect, it } from 'vitest';
import { averageColor } from './dominant-color';

describe('averageColor', () => {
  it('averages opaque pixels', () => {
    // red + blue -> (127.5, 0, 127.5) rounds to 128
    expect(averageColor([255, 0, 0, 255, 0, 0, 255, 255])).toBe('#800080');
  });

  it('ignores transparent pixels', () => {
    expect(averageColor([10, 20, 30, 255, 255, 255, 255, 0])).toBe('#0a141e');
  });

  it('returns a neutral colour for empty or fully transparent data', () => {
    expect(averageColor([])).toBe('#e8dcd4');
    expect(averageColor([1, 2, 3, 0])).toBe('#e8dcd4');
  });
});
