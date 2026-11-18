import { averageColor } from './dominant-color';
import { AI_MAX_EDGE, FULL_MAX_EDGE, THUMB_MAX_EDGE, fitWithin } from './resize-math';

/** Browser-only image pipeline: decode (EXIF-rotated) -> full + thumb WebP -> dominant colour. */

export class ImageProcessError extends Error {
  constructor(
    readonly reason: 'not_image' | 'too_big' | 'heic' | 'decode_failed' | 'encode_failed',
    message: string,
  ) {
    super(message);
    this.name = 'ImageProcessError';
  }
}

export type ProcessedImage = {
  /** Becomes pose_images.id and the file name prefix in storage. */
  id: string;
  full: Blob;
  thumb: Blob;
  /** Size of the full variant. */
  width: number;
  height: number;
  dominantColor: string;
  /** Object URL of the thumb for previews; revoke with URL.revokeObjectURL when dropped. */
  previewUrl: string;
};

const MAX_INPUT_BYTES = 30 * 1024 * 1024;
const FULL_QUALITY = 0.85;
const THUMB_QUALITY = 0.8;
const AI_QUALITY = 0.8;

type AnyCanvas = OffscreenCanvas | HTMLCanvasElement;

function makeCanvas(width: number, height: number): AnyCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function canvasToBlob(canvas: AnyCanvas, type: string, quality: number): Promise<Blob | null> {
  if ('convertToBlob' in canvas) return canvas.convertToBlob({ type, quality }).catch(() => null);
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Encodes as WebP; browsers that cannot encode WebP (they return PNG) get JPEG instead. */
async function encode(canvas: AnyCanvas, quality: number): Promise<Blob> {
  const webp = await canvasToBlob(canvas, 'image/webp', quality);
  if (webp && webp.type === 'image/webp') return webp;
  const jpeg = await canvasToBlob(canvas, 'image/jpeg', quality);
  if (jpeg && jpeg.type === 'image/jpeg') return jpeg;
  throw new ImageProcessError('encode_failed', 'Không nén được ảnh, thử ảnh khác nhé');
}

function draw(bitmap: ImageBitmap, width: number, height: number): AnyCanvas {
  const canvas = makeCanvas(width, height);
  const ctx = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;
  if (!ctx) throw new ImageProcessError('encode_failed', 'Trình duyệt không xử lý được ảnh');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  return canvas;
}

function isHeic(file: Blob & { name?: string }): boolean {
  return /hei[cf]/i.test(file.type) || /\.hei[cf]$/i.test(file.name ?? '');
}

async function decode(file: Blob & { name?: string }): Promise<ImageBitmap> {
  if (file.type && !file.type.startsWith('image/')) {
    throw new ImageProcessError('not_image', 'Đây không phải file ảnh');
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new ImageProcessError('too_big', 'Ảnh quá nặng (trên 30 MB), chọn ảnh nhỏ hơn nhé');
  }
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    try {
      return await createImageBitmap(file); // older Safari rejects the options object
    } catch {
      if (isHeic(file)) {
        throw new ImageProcessError(
          'heic',
          'Máy chưa đọc được ảnh HEIC này. Hãy chọn ảnh JPEG/PNG, hoặc chụp màn hình ảnh rồi chọn lại nhé',
        );
      }
      throw new ImageProcessError('decode_failed', 'Không đọc được ảnh này, thử ảnh khác nhé');
    }
  }
}

/** Decodes `file` and produces the full (1600px) and thumb (640px) variants plus metadata. */
export async function processImage(file: Blob & { name?: string }): Promise<ProcessedImage> {
  const bitmap = await decode(file);
  try {
    const fullSize = fitWithin(bitmap.width, bitmap.height, FULL_MAX_EDGE);
    const thumbSize = fitWithin(bitmap.width, bitmap.height, THUMB_MAX_EDGE);
    const fullCanvas = draw(bitmap, fullSize.width, fullSize.height);
    const thumbCanvas = draw(bitmap, thumbSize.width, thumbSize.height);

    const swatch = draw(bitmap, 16, 16);
    const swatchCtx = swatch.getContext('2d') as OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;
    const dominantColor = averageColor(swatchCtx.getImageData(0, 0, 16, 16).data);

    const [full, thumb] = await Promise.all([encode(fullCanvas, FULL_QUALITY), encode(thumbCanvas, THUMB_QUALITY)]);
    return {
      id: crypto.randomUUID(),
      full,
      thumb,
      width: fullSize.width,
      height: fullSize.height,
      dominantColor,
      previewUrl: URL.createObjectURL(thumb),
    };
  } finally {
    bitmap.close();
  }
}

/** JPEG of at most 1024px on the long edge, the size AI autofill expects. */
export async function makeAiJpeg(source: Blob): Promise<Blob> {
  const bitmap = await decode(source);
  try {
    const size = fitWithin(bitmap.width, bitmap.height, AI_MAX_EDGE);
    const blob = await canvasToBlob(draw(bitmap, size.width, size.height), 'image/jpeg', AI_QUALITY);
    if (!blob) throw new ImageProcessError('encode_failed', 'Không chuẩn bị được ảnh cho AI');
    return blob;
  } finally {
    bitmap.close();
  }
}
