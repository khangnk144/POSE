export type MapsLinkInput = {
  name: string;
  address?: string | null;
  mapsUrl?: string | null;
};

/** True for well-formed http(s) URLs only (blocks javascript:, data:, ...). */
export function isHttpUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  try {
    const { protocol } = new URL(value.trim());
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Link that opens the place in Google Maps: the saved link when it is a valid http(s) URL,
 * otherwise a search URL built from the name and address.
 */
export function buildMapsUrl({ name, address, mapsUrl }: MapsLinkInput): string {
  if (isHttpUrl(mapsUrl)) return mapsUrl.trim();
  const query = [name, address]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
