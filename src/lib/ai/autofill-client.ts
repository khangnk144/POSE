import type { PoseDraft } from '@/lib/schemas/pose-draft-schema';
import type { AutofillImage } from '@/lib/types/pose';
import { postAi } from './ai-http';

/**
 * Ask the AI to fill pose fields from reference images.
 * Calls `POST /api/ai/autofill` (optionally with the caption the user pasted, max 2000 chars) and resolves with only the fields the model returned
 * validly. Must only run in response to a user pressing "AI điền giúp".
 *
 * @param images 1-3 uploaded image ids, or local files (JPEG, <= 1024px).
 * @throws AiClientError whose `message` is `ai_quota` (daily limit, HTTP 429), `ai_disabled`
 *         (no API key configured), `ai_timeout`, `ai_busy`, `network`, `aborted` or `ai_failed`.
 */
export async function requestAutofill(
  images: AutofillImage[],
  caption?: string,
  signal?: AbortSignal,
): Promise<Partial<PoseDraft>> {
  const ids = images.flatMap((i) => ('imageId' in i ? [i.imageId] : []));
  const files = images.flatMap((i) => ('file' in i ? [i.file] : []));

  const request =
    files.length === 0
      ? { body: JSON.stringify({ imageIds: ids, caption }), headers: { 'content-type': 'application/json' } }
      : { body: toForm(ids, files, caption) };

  const { draft } = await postAi<{ draft: Partial<PoseDraft> }>('/api/ai/autofill', { ...request, signal });
  return draft;
}

function toForm(ids: string[], files: Blob[], caption?: string): FormData {
  const form = new FormData();
  if (caption) form.append('caption', caption);
  for (const id of ids) form.append('imageIds', id);
  files.forEach((file, i) => form.append('image', file, `image-${i}.jpg`));
  return form;
}
