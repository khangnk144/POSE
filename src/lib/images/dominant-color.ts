const hex = (n: number) => Math.round(n).toString(16).padStart(2, '0');

/**
 * Average colour (#rrggbb) of RGBA pixel data, ignoring mostly transparent pixels.
 * Used as the placeholder colour while the real image loads. Falls back to a neutral
 * warm grey when there is nothing to average.
 */
export function averageColor(rgba: ArrayLike<number>): string {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 32) continue;
    r += rgba[i];
    g += rgba[i + 1];
    b += rgba[i + 2];
    count++;
  }
  if (count === 0) return '#e8dcd4';
  return `#${hex(r / count)}${hex(g / count)}${hex(b / count)}`;
}
