import 'server-only';
import type { ClaudeImage, ImageMediaType } from './claude-client';

/** Uploaded JPEGs are shrunk to <= 1024px by the client, so 1.5 MB is generous. */
export const MAX_UPLOAD_BYTES = 1_500_000;
/** Stored images are webp up to 5 MB; skip the full size above this and use the thumbnail. */
export const MAX_STORED_BYTES = 4_000_000;

/** Detect the real format from magic bytes. Never trust a client-supplied content type. */
export function sniffImageType(bytes: Uint8Array): ImageMediaType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.subarray(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.subarray(8, 12)) === 'WEBP'
  ) {
    return 'image/webp';
  }
  return null;
}

/** Validate bytes as an image Claude accepts and base64 them; null when not an acceptable image. */
export function toClaudeImage(bytes: Uint8Array, maxBytes: number): ClaudeImage | null {
  if (bytes.length === 0 || bytes.length > maxBytes) return null;
  const mediaType = sniffImageType(bytes);
  if (!mediaType) return null;
  return { mediaType, base64: Buffer.from(bytes).toString('base64') };
}
