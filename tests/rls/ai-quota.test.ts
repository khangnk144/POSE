import { beforeAll, describe, expect, it } from 'vitest';
import { admin, anon, createMember, resetTeam, type TestUser } from './helpers';

// `consume_ai_quota` is not in the generated Database types until `npm run db:types` is re-run.
type RpcResult = PromiseLike<{ data: number | null; error: { message: string; code?: string } | null }>;
const spend = (client: { rpc: unknown }, userId: string, limit: number): RpcResult =>
  (client.rpc as (fn: string, args: object) => RpcResult)('consume_ai_quota', { p_user_id: userId, p_limit: limit });

describe('consume_ai_quota', () => {
  let owner: TestUser; // first joined user = admin
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    await resetTeam();
    owner = await createMember('owner', 'Owner');
    alice = await createMember('alice', 'Alice');
    bob = await createMember('bob', 'Bob');
  });

  it('never limits an admin, but still counts their calls', async () => {
    const results: (number | null)[] = [];
    for (let i = 0; i < 4; i++) results.push((await spend(admin, owner.id, 2)).data);
    expect(results).toEqual([1, 2, 3, 4]);
    const { data } = await admin.from('ai_usage').select('count').eq('user_id', owner.id).single();
    expect(data?.count).toBe(4);
  });

  it('counts up to the limit, then returns -1 without incrementing further', async () => {
    const results: (number | null)[] = [];
    for (let i = 0; i < 4; i++) results.push((await spend(admin, alice.id, 3)).data);
    expect(results).toEqual([1, 2, 3, -1]);

    const { data } = await admin.from('ai_usage').select('count').eq('user_id', alice.id).single();
    expect(data?.count).toBe(3);
  });

  it('keeps separate budgets per user', async () => {
    expect((await spend(admin, bob.id, 1)).data).toBe(1);
    expect((await spend(admin, bob.id, 1)).data).toBe(-1);
    expect((await spend(admin, alice.id, 99)).data).toBe(4); // alice's row was 3
  });

  it('never exceeds the limit under concurrent requests', async () => {
    const racer = await createMember('racer', 'Racer');
    const limit = 5;
    const results = await Promise.all(Array.from({ length: 20 }, () => spend(admin, racer.id, limit)));
    const allowed = results.filter((r) => (r.data ?? -1) > 0);
    expect(allowed).toHaveLength(limit);
    const { data } = await admin.from('ai_usage').select('count').eq('user_id', racer.id).single();
    expect(data?.count).toBe(limit);
  });

  it('cannot be called by a signed-in member or anonymous visitor', async () => {
    const asMember = await spend(alice.client, alice.id, 1000);
    expect(asMember.error).not.toBeNull();
    const asAnon = await spend(anon(), alice.id, 1000);
    expect(asAnon.error).not.toBeNull();
  });
});
