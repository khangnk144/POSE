/** Longest-edge limits of the stored variants and of the image sent to AI. */
export const FULL_MAX_EDGE = 1600;
export const THUMB_MAX_EDGE = 640;
export const AI_MAX_EDGE = 1024;

export type Size = { width: number; height: number };

/**
 * Scales (width, height) so the longest edge is at most `maxEdge`, keeping the aspect
 * ratio. Never upscales. Both sides are whole pixels and at least 1.
 */
export function fitWithin(width: number, height: number, maxEdge: number): Size {
  if (!(width > 0) || !(height > 0) || !(maxEdge > 0)) {
    throw new RangeError(`Invalid dimensions ${width}x${height} (max ${maxEdge})`);
  }
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width: Math.round(width), height: Math.round(height) };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
