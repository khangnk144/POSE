import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { consumeAiQuota, type QuotaRpcClient } from './ai-quota';

/** In-memory stand-in with the same contract as the SQL function (+count until limit, then -1). */
function fakeDb(): QuotaRpcClient {
  const counts = new Map<string, number>();
  return {
    async rpc(_fn, { p_user_id, p_limit }) {
      const current = counts.get(p_user_id) ?? 0;
      if (current >= p_limit) return { data: -1, error: null };
      counts.set(p_user_id, current + 1);
      return { data: current + 1, error: null };
    },
  };
}

describe('consumeAiQuota', () => {
  it('allows 40 calls and blocks the 41st', async () => {
    const db = fakeDb();
    for (let i = 1; i <= 40; i++) {
      expect(await consumeAiQuota(db, 'u1', 40)).toEqual({ allowed: true, used: i });
    }
    expect(await consumeAiQuota(db, 'u1', 40)).toEqual({ allowed: false });
  });

  it('counts users separately', async () => {
    const db = fakeDb();
    await consumeAiQuota(db, 'u1', 1);
    expect(await consumeAiQuota(db, 'u1', 1)).toEqual({ allowed: false });
    expect(await consumeAiQuota(db, 'u2', 1)).toEqual({ allowed: true, used: 1 });
  });

  it('fails closed when the database errors', async () => {
    const db: QuotaRpcClient = { rpc: async () => ({ data: null, error: { message: 'boom' } }) };
    await expect(consumeAiQuota(db, 'u1', 40)).rejects.toThrow('boom');
  });

  it('passes user id and limit to the rpc', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: 1, error: null });
    await consumeAiQuota({ rpc }, 'u9', 7);
    expect(rpc).toHaveBeenCalledWith('consume_ai_quota', { p_user_id: 'u9', p_limit: 7 });
  });
});
