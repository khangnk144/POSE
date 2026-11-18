import type { PoseDraft } from '@/lib/schemas/pose-draft-schema';
import type { PeopleCount } from '@/lib/types/pose';
import { postAi } from './ai-http';

export type SuggestResponse = {
  scene: { summary: string; light: string; setting: string[]; tips: string[] };
  matches: { poseId: string; reason: string; cameraTip?: string }[];
  ideas: (Partial<PoseDraft> & { title: string; status: 'draft' })[];
};

/**
 * Ask the AI for poses that fit a scene photo (`POST /api/ai/suggest`). Paid call: only run it
 * from an explicit tap. `photo` must already be a JPEG <= 1024px (see shrink-image.ts).
 * Throws AiClientError (see ai-http.ts), including `scene_unclear` with the model's explanation.
 */
export function requestSuggest(photo: Blob, peopleCount: PeopleCount | undefined, signal?: AbortSignal): Promise<SuggestResponse> {
  const form = new FormData();
  form.append('image', photo, 'scene.jpg');
  if (peopleCount) form.append('peopleCount', peopleCount);
  return postAi<SuggestResponse>('/api/ai/suggest', { body: form, signal });
}
