import { AUTOFILL_SYSTEM, AUTOFILL_TOOL, autofillUserText } from '@/lib/ai/prompts/autofill-prompt';
import { claudeFailureResponse, guardAiRequest, jsonError, spendQuotaOrResponse } from '@/lib/ai/ai-route-guard';
import { MAX_AUTOFILL_IMAGES, readAutofillInput } from '@/lib/ai/autofill-input';
import { callClaudeTool } from '@/lib/ai/claude-client';
import { loadStoredImages } from '@/lib/ai/load-stored-images';
import { parsePoseFields } from '@/lib/ai/parse-ai-output';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export const maxDuration = 60;

export async function POST(request: Request): Promise<Response> {
  const guard = await guardAiRequest();
  if (guard instanceof Response) return guard;

  const input = await readAutofillInput(request);
  const count = input ? input.imageIds.length + input.files.length : 0;
  if (!input || count < 1 || count > MAX_AUTOFILL_IMAGES) return jsonError('invalid_images', 400);

  let images = input.files;
  if (input.imageIds.length > 0) {
    const supabase = await createSupabaseServerClient();
    const stored = await loadStoredImages(supabase, input.imageIds);
    if (!stored) return jsonError('invalid_images', 400);
    images = [...stored, ...input.files];
  }

  const blocked = await spendQuotaOrResponse(guard.userId);
  if (blocked) return blocked;

  try {
    const { input: raw, usage } = await callClaudeTool({
      system: AUTOFILL_SYSTEM,
      // The caption is user-pasted text: it only ever travels inside the delimited data block of
      // the user message, never in the system prompt.
      userText: autofillUserText(images.length, input.caption),
      images,
      tool: AUTOFILL_TOOL,
      maxTokens: 1500,
      signal: request.signal,
    });
    const draft = parsePoseFields(raw);
    console.info('[ai] autofill', {
      images: images.length,
      caption: Boolean(input.caption),
      fields: Object.keys(draft).length,
      ...usage,
    });
    if (Object.keys(draft).length === 0) return jsonError('ai_failed', 502);
    return Response.json({ draft });
  } catch (e) {
    return claudeFailureResponse(e);
  }
}
