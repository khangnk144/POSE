import {
  type Transport,
  ImportError,
  fetchFollowingRedirects,
  httpsTransport,
  readLimited,
  TIMEOUT_MS,
} from './guarded-fetch';
import { extractOgImage } from './og-image';

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_HTML_BYTES = 1024 * 1024;

export type ImportedImage = { bytes: Uint8Array; contentType: string };

function mimeOf(headers: Record<string, string | string[] | undefined>): string {
  const raw = headers['content-type'];
  return (Array.isArray(raw) ? raw[0] : (raw ?? '')).split(';')[0].trim().toLowerCase();
}

/** SVG is excluded: it can carry scripts and the client pipeline cannot decode it anyway. */
function isRasterImage(mime: string): boolean {
  return mime.startsWith('image/') && mime !== 'image/svg+xml';
}

/**
 * Downloads an image from a public https URL. When the URL is an HTML page, takes its
 * og:image and downloads that instead (one extra hop, through the same guard).
 * One shared time budget (default 10 s) covers every request and the body streaming.
 */
export async function importImage(
  url: string,
  transport: Transport = httpsTransport,
  timeoutMs: number = TIMEOUT_MS,
): Promise<ImportedImage> {
  const signal = AbortSignal.timeout(timeoutMs);
  let { res, finalUrl } = await fetchFollowingRedirects(url, signal, transport);
  let mime = mimeOf(res.headers);

  if (mime === 'text/html' || mime === 'application/xhtml+xml') {
    if (res.status !== 200) {
      res.destroy();
      throw new ImportError('fetch_failed', 'Không mở được trang này');
    }
    const html = new TextDecoder().decode(await readLimited(res, MAX_HTML_BYTES, { truncate: true, signal }));
    const imageUrl = extractOgImage(html, finalUrl);
    if (!imageUrl) throw new ImportError('not_image', 'Trang này không có ảnh xem trước');
    ({ res, finalUrl } = await fetchFollowingRedirects(imageUrl, signal, transport));
    mime = mimeOf(res.headers);
  }

  if (res.status !== 200) {
    res.destroy();
    throw new ImportError('fetch_failed', 'Không tải được ảnh');
  }
  if (!isRasterImage(mime)) {
    res.destroy();
    throw new ImportError('not_image', 'Link này không phải ảnh');
  }
  const declared = Number(res.headers['content-length']);
  if (Number.isFinite(declared) && declared > MAX_IMAGE_BYTES) {
    res.destroy();
    throw new ImportError('too_large', 'Ảnh lớn hơn 10 MB');
  }
  return { bytes: await readLimited(res, MAX_IMAGE_BYTES, { signal }), contentType: mime };
}
