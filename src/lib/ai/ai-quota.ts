import 'server-only';

/** Minimal slice of a Supabase client: just `rpc`. Lets tests pass a fake without a database. */
export type QuotaRpcClient = {
  rpc(
    fn: 'consume_ai_quota',
    args: { p_user_id: string; p_limit: number },
  ): PromiseLike<{ data: number | null; error: { message: string } | null }>;
};

export type QuotaResult = { allowed: true; used: number } | { allowed: false };

/**
 * Spend one AI call from the user's daily budget. Atomic in Postgres (see migration
 * 0030): the counter only increments while below `limit`, even under concurrent requests.
 * Must be called with the service-role client; throws on database errors so the route fails
 * closed instead of giving free AI calls.
 */
export async function consumeAiQuota(
  client: QuotaRpcClient,
  userId: string,
  limit: number,
): Promise<QuotaResult> {
  const { data, error } = await client.rpc('consume_ai_quota', { p_user_id: userId, p_limit: limit });
  if (error) throw new Error(`consume_ai_quota failed: ${error.message}`);
  if (typeof data !== 'number') throw new Error('consume_ai_quota returned no number');
  return data < 0 ? { allowed: false } : { allowed: true, used: data };
}
