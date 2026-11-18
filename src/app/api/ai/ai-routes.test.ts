import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
// Session helpers would touch cookies; the 503 path must return before they are ever called.
const { getCurrentUserId } = vi.hoisted(() => ({ getCurrentUserId: vi.fn() }));
vi.mock('@/lib/supabase/session', () => ({ getCurrentUserId, getCurrentProfile: vi.fn() }));
vi.mock('@/lib/supabase/server-client', () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock('@/lib/supabase/admin-client', () => ({ createSupabaseAdminClient: vi.fn() }));

import { POST as autofill } from './autofill/route';
import { POST as suggest } from './suggest/route';

const post = () =>
  new Request('http://localhost/api/ai', {
    method: 'POST',
    body: '{}',
    headers: { 'content-type': 'application/json' },
  });

describe('AI routes without ANTHROPIC_API_KEY', () => {
  const saved = process.env.ANTHROPIC_API_KEY;
  beforeEach(() => {
    delete process.env.ANTHROPIC_API_KEY;
    getCurrentUserId.mockClear();
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = saved;
  });

  it.each([
    ['autofill', autofill],
    ['suggest', suggest],
  ])('%s returns 503 ai_not_configured before auth or body parsing', async (_name, handler) => {
    const res = await handler(post());
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'ai_not_configured' });
    expect(getCurrentUserId).not.toHaveBeenCalled();
  });

  it('treats an empty key as not configured', async () => {
    process.env.ANTHROPIC_API_KEY = '';
    expect((await autofill(post())).status).toBe(503);
  });
});

describe('AI routes with a key but signed out', () => {
  const saved = process.env.ANTHROPIC_API_KEY;
  beforeEach(() => {
    process.env.ANTHROPIC_API_KEY = 'test-key-not-real';
    getCurrentUserId.mockResolvedValue(null);
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = saved;
  });

  it('returns 401', async () => {
    expect((await suggest(post())).status).toBe(401);
    expect((await autofill(post())).status).toBe(401);
  });
});
