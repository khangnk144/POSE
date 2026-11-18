import 'server-only';
import { z } from 'zod';
import type { ClaudeImage } from './claude-client';
import { MAX_UPLOAD_BYTES, toClaudeImage } from './image-input';

export const MAX_AUTOFILL_IMAGES = 3;
/** Same cap as `description` in poseDraftSchema and the caption box in the form. */
export const MAX_CAPTION_CHARS = 2000;

const idsSchema = z.array(z.string().uuid()).max(MAX_AUTOFILL_IMAGES);
const captionSchema = z.string().max(MAX_CAPTION_CHARS).optional();

export type AutofillInput = { imageIds: string[]; files: ClaudeImage[]; caption?: string };

/** Blank caption means none. */
function parseCaption(raw: unknown): { ok: true; caption?: string } | { ok: false } {
  const parsed = captionSchema.safeParse(raw ?? undefined);
  if (!parsed.success) return { ok: false };
  const caption = parsed.data?.trim();
  return { ok: true, caption: caption ? caption : undefined };
}

/**
 * JSON `{ imageIds, caption? }` or multipart (`image` files + optional repeated `imageIds` +
 * optional `caption`). Null when anything is invalid, including a caption over the cap.
 */
export async function readAutofillInput(request: Request): Promise<AutofillInput | null> {
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const body = (await request.json()) as { imageIds?: unknown; caption?: unknown } | null;
      const ids = idsSchema.safeParse(body?.imageIds);
      const caption = parseCaption(body?.caption);
      return ids.success && caption.ok ? { imageIds: ids.data, files: [], caption: caption.caption } : null;
    }
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const ids = idsSchema.safeParse(form.getAll('imageIds'));
      const caption = parseCaption(form.get('caption'));
      if (!ids.success || !caption.ok) return null;
      const files: ClaudeImage[] = [];
      for (const entry of form.getAll('image')) {
        if (typeof entry === 'string') return null;
        const image = toClaudeImage(new Uint8Array(await entry.arrayBuffer()), MAX_UPLOAD_BYTES);
        if (!image) return null;
        files.push(image);
      }
      return { imageIds: ids.data, files, caption: caption.caption };
    }
  } catch {
    return null;
  }
  return null;
}
