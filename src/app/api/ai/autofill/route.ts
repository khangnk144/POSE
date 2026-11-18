import { z } from 'zod';
import { AUTOFILL_SYSTEM, AUTOFILL_TOOL, autofillUserText } from '@/lib/ai/prompts/autofill-prompt';
import { claudeFailureResponse, guardAiRequest, jsonError, spendQuotaOrResponse } from '@/lib/ai/ai-route-guard';
import { callClaudeTool, type ClaudeImage } from '@/lib/ai/claude-client';
import { MAX_UPLOAD_BYTES, toClaudeImage } from '@/lib/ai/image-input';
import { loadStoredImages } from '@/lib/ai/load-stored-images';
import { parsePoseFields } from '@/lib/ai/parse-ai-output';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export const maxDuration = 60;

const MAX_IMAGES = 3;
const idsSchema = z.array(z.string().uuid()).max(MAX_IMAGES);

type ParsedInput = { imageIds: string[]; files: ClaudeImage[] };

/** JSON `{ imageIds }` or multipart (`image` files + optional repeated `imageIds`). Null when invalid. */
async function readInput(request: Request): Promise<ParsedInput | null> {
  const contentType = request.headers.get('content-type') ?? '';
  try {
    if (contentType.includes('application/json')) {
      const body: unknown = await request.json();
      const ids = idsSchema.safeParse((body as { imageIds?: unknown } | null)?.imageIds);
      return ids.success ? { imageIds: ids.data, files: [] } : null;
    }
    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const ids = idsSchema.safeParse(form.getAll('imageIds'));
      if (!ids.success) return null;
      const files: ClaudeImage[] = [];
      for (const entry of form.getAll('image')) {
        if (typeof entry === 'string') return null;
        const image = toClaudeImage(new Uint8Array(await entry.arrayBuffer()), MAX_UPLOAD_BYTES);
        if (!image) return null;
        files.push(image);
      }
      return { imageIds: ids.data, files };
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: Request): Promise<Response> {
  const guard = await guardAiRequest();
  if (guard instanceof Response) return guard;

  const input = await readInput(request);
  const count = input ? input.imageIds.length + input.files.length : 0;
  if (!input || count < 1 || count > MAX_IMAGES) return jsonError('invalid_images', 400);

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
      userText: autofillUserText(images.length),
      images,
      tool: AUTOFILL_TOOL,
      maxTokens: 1500,
      signal: request.signal,
    });
    const draft = parsePoseFields(raw);
    console.info('[ai] autofill', { images: images.length, fields: Object.keys(draft).length, ...usage });
    if (Object.keys(draft).length === 0) return jsonError('ai_failed', 502);
    return Response.json({ draft });
  } catch (e) {
    return claudeFailureResponse(e);
  }
}
