/** Lowercase and strip Vietnamese diacritics so "da lat" matches "Đà Lạt". */
export function foldText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .trim();
}

/** Saved places whose name or address contains the query (accent- and case-insensitive). */
export function filterPlaces<T extends { name: string; address: string | null }>(places: T[], query: string): T[] {
  const q = foldText(query);
  if (!q) return places;
  return places.filter((p) => foldText(`${p.name} ${p.address ?? ''}`).includes(q));
}
