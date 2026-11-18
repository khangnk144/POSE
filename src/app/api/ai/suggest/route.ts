import { z } from 'zod';
import { claudeFailureResponse, guardAiRequest, jsonError, spendQuotaOrResponse } from '@/lib/ai/ai-route-guard';
import { callClaudeTool } from '@/lib/ai/claude-client';
import { MAX_UPLOAD_BYTES, toClaudeImage } from '@/lib/ai/image-input';
import { parseSuggestOutput } from '@/lib/ai/parse-ai-output';
import { buildCatalog, type CatalogRow } from '@/lib/ai/prompts/pose-catalog';
import { SUGGEST_SYSTEM, SUGGEST_TOOL, suggestUserText } from '@/lib/ai/prompts/suggest-prompt';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { PEOPLE_COUNTS } from '@/lib/types/pose';

export const maxDuration = 60;

/** PostgREST returns at most 1000 rows per request by default; the catalog is capped lower anyway. */
const CATALOG_FETCH_LIMIT = 1000;

const peopleSchema = z.enum(PEOPLE_COUNTS).optional();

export async function POST(request: Request): Promise<Response> {
  const guard = await guardAiRequest();
  if (guard instanceof Response) return guard;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return jsonError('invalid_request', 400);
  }
  const file = form.get('image');
  if (!file || typeof file === 'string') return jsonError('invalid_image', 400);
  const image = toClaudeImage(new Uint8Array(await file.arrayBuffer()), MAX_UPLOAD_BYTES);
  if (!image) return jsonError('invalid_image', 400);
  const rawPeople = form.get('peopleCount');
  const people = peopleSchema.safeParse(typeof rawPeople === 'string' && rawPeople ? rawPeople : undefined);
  if (!people.success) return jsonError('invalid_request', 400);

  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from('poses')
    .select('id, title, posture, people_count, scenes, camera_height')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(CATALOG_FETCH_LIMIT);
  if (error) {
    console.error('[ai] catalog query failed', error.message);
    return jsonError('ai_internal', 500);
  }
  const catalog = buildCatalog((rows ?? []) as CatalogRow[], people.data);

  const blocked = await spendQuotaOrResponse(guard.userId);
  if (blocked) return blocked;

  try {
    const { input, usage } = await callClaudeTool({
      system: SUGGEST_SYSTEM,
      cachedContext: catalog.text,
      userText: suggestUserText(people.data),
      images: [image],
      tool: SUGGEST_TOOL,
      maxTokens: 4000,
      signal: request.signal,
    });
    const result = parseSuggestOutput(input, catalog.refToPoseId);
    console.info('[ai] suggest', { catalog: catalog.refToPoseId.size, truncated: catalog.truncated, ...usage });

    if (!result.clear) return Response.json({ error: 'scene_unclear', message: result.reason }, { status: 422 });
    if (!result.scene.summary && result.matches.length === 0 && result.ideas.length === 0) {
      return jsonError('ai_failed', 502);
    }
    return Response.json({ scene: result.scene, matches: result.matches, ideas: result.ideas });
  } catch (e) {
    return claudeFailureResponse(e);
  }
}
