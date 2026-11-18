import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
const { from } = vi.hoisted(() => ({ from: vi.fn() }));
vi.mock('@/lib/supabase/admin-client', () => ({ createSupabaseAdminClient: () => ({ from }) }));

import { GET } from './route';

const req = (auth?: string) => new Request('http://localhost/api/health', { headers: auth ? { authorization: auth } : {} });
const dbReturns = (error: { message: string } | null) =>
  from.mockReturnValue({ select: () => ({ limit: () => Promise.resolve({ error }) }) });

describe('GET /api/health', () => {
  const saved = process.env.CRON_SECRET;
  beforeEach(() => {
    process.env.CRON_SECRET = 'cron-secret-1234';
    from.mockReset();
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = saved;
  });

  it('answers 503 without touching the DB when CRON_SECRET is unset', async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(req('Bearer anything'))).status).toBe(503);
    expect(from).not.toHaveBeenCalled();
  });

  it('answers 401 without touching the DB for a missing or wrong secret', async () => {
    expect((await GET(req())).status).toBe(401);
    expect((await GET(req('Bearer wrong'))).status).toBe(401);
    expect(from).not.toHaveBeenCalled();
  });

  it('runs one query and answers ok for the right secret', async () => {
    dbReturns(null);
    const res = await GET(req('Bearer cron-secret-1234'));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(from).toHaveBeenCalledTimes(1);
  });

  it('answers 503 when the database query fails', async () => {
    dbReturns({ message: 'boom' });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect((await GET(req('Bearer cron-secret-1234'))).status).toBe(503);
  });
});
