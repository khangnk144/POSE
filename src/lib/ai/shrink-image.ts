import { AiClientError } from './ai-http';

/** Longest edge sent to the AI. Larger photos cost more tokens without better poses. */
export const MAX_EDGE = 1024;

/** Scale a photo down to <= 1024px on its longest edge and re-encode as JPEG. Browser only. */
export async function shrinkToJpeg(file: Blob): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    // imageOrientation applies EXIF rotation so phone photos are not sideways.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    throw new AiClientError('invalid_image');
  }
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new AiClientError('invalid_image');
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
    if (!blob) throw new AiClientError('invalid_image');
    return blob;
  } finally {
    bitmap.close();
  }
}
