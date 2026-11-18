/**
 * Finds the preview image URL of an HTML page (`og:image`, then `twitter:image`).
 * Regex based on purpose: the HTML is untrusted and capped at 1 MB, and only <meta> tags matter.
 */
export function extractOgImage(html: string, baseUrl: URL): string | null {
  const found = new Map<string, string>();
  for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
    const attrs = new Map<string, string>();
    for (const m of tag.matchAll(/([a-z:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi)) {
      attrs.set(m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '');
    }
    const key = (attrs.get('property') ?? attrs.get('name') ?? '').toLowerCase();
    const content = attrs.get('content');
    if (content && !found.has(key)) found.set(key, content);
  }
  const raw =
    found.get('og:image:secure_url') ?? found.get('og:image') ?? found.get('og:image:url') ?? found.get('twitter:image');
  if (!raw) return null;
  try {
    return new URL(decodeEntities(raw), baseUrl).toString();
  } catch {
    return null;
  }
}

function decodeEntities(s: string): string {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
