/**
 * Mirror of the DB-side `search_text` normalisation (lowercase + unaccent, with đ -> d)
 * so that "ngoi sofa" and "Ngồi SOFA" hit the same rows.
 */
export function normalizeSearchText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Escape LIKE wildcards so user text is matched literally. */
export function escapeLikePattern(input: string): string {
  return input.replace(/[\\%_]/g, (ch) => `\\${ch}`);
}

/** Normalised search words (max 6) - each one must appear in `search_text`, in any order. */
export function searchTokens(q: string | undefined): string[] {
  if (!q) return [];
  return normalizeSearchText(q).split(' ').filter(Boolean).slice(0, 6);
}
