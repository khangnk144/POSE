import type { PoseDraft } from '@/lib/schemas/pose-draft-schema';
import type { AutofillImage } from '@/lib/types/pose';

/**
 * Ask the AI to fill pose fields from reference images.
 * Calls `POST /api/ai/autofill` and resolves with only the fields the model returned
 * validly. Must only run in response to a user pressing "AI điền giúp".
 *
 * @param images 1-3 uploaded image ids, or one local file (JPEG, <= 1024px).
 * @throws Error with message `ai_quota` when the daily limit is reached (HTTP 429),
 *         `ai_disabled` when no API key is configured, or a generic error otherwise.
 *
 * Owner: AI phase (replaces this stub). Caller: pose form.
 */
export async function requestAutofill(images: AutofillImage[]): Promise<Partial<PoseDraft>> {
  void images;
  throw new Error('not implemented');
}
