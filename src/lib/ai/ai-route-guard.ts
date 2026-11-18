import 'server-only';
import { AiCallError } from './claude-client';
import { getDailyLimit } from './ai-config';
import { isAiConfigured } from './ai-availability';
import { consumeAiQuota, type QuotaRpcClient } from './ai-quota';
import { createSupabaseAdminClient } from '@/lib/supabase/admin-client';
import { getCurrentProfile, getCurrentUserId } from '@/lib/supabase/session';

export function jsonError(error: string, status: number): Response {
  return Response.json({ error }, { status });
}

/**
 * First thing every AI route does. 503 when no API key (checked before anything else, even auth),
 * 401 when signed out, 403 when signed in but not a team member.
 */
export async function guardAiRequest(): Promise<{ userId: string } | Response> {
  if (!isAiConfigured()) return jsonError('ai_not_configured', 503);
  const userId = await getCurrentUserId();
  if (!userId) return jsonError('unauthorized', 401);
  if (!(await getCurrentProfile())) return jsonError('forbidden', 403);
  return { userId };
}

/**
 * Spend one call of the user's daily budget. Call it after input validation (bad requests are
 * free) and right before the paid Claude call. Returns a 429 response when the limit is reached,
 * 500 when the counter itself fails (fail closed), null when allowed.
 */
export async function spendQuotaOrResponse(userId: string): Promise<Response | null> {
  try {
    // Cast: `consume_ai_quota` is not in the generated Database types until `npm run db:types`.
    const admin: QuotaRpcClient = createSupabaseAdminClient();
    const result = await consumeAiQuota(admin, userId, getDailyLimit());
    return result.allowed ? null : jsonError('ai_quota', 429);
  } catch (e) {
    console.error('[ai] quota check failed', e);
    return jsonError('ai_internal', 500);
  }
}

/** Translate a failed Claude call to an HTTP response the UI maps to microcopy. */
export function claudeFailureResponse(e: unknown): Response {
  if (e instanceof AiCallError) {
    console.error(`[ai] claude call failed: ${e.kind}: ${e.message}`);
    switch (e.kind) {
      case 'timeout':
        return jsonError('ai_timeout', 504);
      case 'aborted':
        return jsonError('ai_aborted', 499);
      case 'busy':
        return jsonError('ai_busy', 503);
      default:
        return jsonError('ai_failed', 502);
    }
  }
  console.error('[ai] unexpected failure', e);
  return jsonError('ai_internal', 500);
}
