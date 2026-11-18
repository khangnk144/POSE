/** "2026-11-18" -> "18/11/2026"; null for missing or malformed input. Pure string handling, no timezone shift. */
export function formatShootDate(value: string | null | undefined): string | null {
  const m = value ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  return m ? `${m[3]}/${m[2]}/${m[1]}` : null;
}
