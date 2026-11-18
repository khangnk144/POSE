import { describe, expect, it } from 'vitest';
import { AI_MAX_EDGE, FULL_MAX_EDGE, THUMB_MAX_EDGE, fitWithin } from './resize-math';

describe('fitWithin', () => {
  it('scales a landscape photo by its width', () => {
    expect(fitWithin(4000, 3000, FULL_MAX_EDGE)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(4000, 3000, THUMB_MAX_EDGE)).toEqual({ width: 640, height: 480 });
  });

  it('scales a portrait photo by its height', () => {
    expect(fitWithin(3024, 4032, FULL_MAX_EDGE)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(3024, 4032, AI_MAX_EDGE)).toEqual({ width: 768, height: 1024 });
  });

  it('keeps a square square', () => {
    expect(fitWithin(2000, 2000, 640)).toEqual({ width: 640, height: 640 });
  });

  it('never upscales small images', () => {
    expect(fitWithin(500, 300, FULL_MAX_EDGE)).toEqual({ width: 500, height: 300 });
    expect(fitWithin(1600, 900, FULL_MAX_EDGE)).toEqual({ width: 1600, height: 900 });
  });

  it('rounds to whole pixels and never returns 0', () => {
    const { width, height } = fitWithin(10000, 7, 640);
    expect(width).toBe(640);
    expect(height).toBe(1);
    expect(Number.isInteger(fitWithin(1999, 1333, 640).height)).toBe(true);
  });

  it('rejects invalid input instead of returning NaN', () => {
    expect(() => fitWithin(0, 100, 640)).toThrow(RangeError);
    expect(() => fitWithin(100, -1, 640)).toThrow(RangeError);
    expect(() => fitWithin(100, 100, 0)).toThrow(RangeError);
    expect(() => fitWithin(Number.NaN, 100, 640)).toThrow(RangeError);
  });
});
