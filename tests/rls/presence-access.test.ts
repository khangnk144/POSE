import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { admin, anon, createMember, createTestUser, type Client, type TestUser } from './helpers';

const TOPIC = 'team-presence';
const CONNECT_TIMEOUT_MS = 8_000;

/** Joins the presence channel exactly like the app does and reports the final join status. */
function join(client: Client, key: string): Promise<{ status: string; channel: RealtimeChannel }> {
  return new Promise((resolve) => {
    const channel = client.channel(TOPIC, { config: { private: true, presence: { key, enabled: true } } });
    const timer = setTimeout(() => resolve({ status: 'TIMED_OUT', channel }), CONNECT_TIMEOUT_MS);
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        clearTimeout(timer);
        resolve({ status, channel });
      }
    });
  });
}

async function waitFor(check: () => boolean, ms = 8_000): Promise<boolean> {
  const end = Date.now() + ms;
  while (Date.now() < end) {
    if (check()) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return check();
}

describe('private presence channel', () => {
  let alice: TestUser;
  let bob: TestUser;
  let outsider: TestUser; // signed up but never joined the team
  const anonymous = anon();
  const opened: Client[] = [];

  beforeAll(async () => {
    alice = await createMember('presence-alice', 'Alice');
    bob = await createMember('presence-bob', 'Bob');
    outsider = await createTestUser('presence-outsider');
    opened.push(alice.client, bob.client, outsider.client, anonymous);
  });

  afterAll(async () => {
    await Promise.all(opened.map((c) => c.removeAllChannels()));
    for (const u of [alice, bob, outsider]) if (u) await admin.auth.admin.deleteUser(u.id);
  });

  it('refuses an anonymous client', async () => {
    const { status } = await join(anonymous, 'ghost');
    expect(status).not.toBe('SUBSCRIBED');
  });

  it('refuses a signed-in user who is not a team member', async () => {
    const { status } = await join(outsider.client, outsider.id);
    expect(status).not.toBe('SUBSCRIBED');
  });

  it('lets two members join and see each other', async () => {
    const a = await join(alice.client, alice.id);
    const b = await join(bob.client, bob.id);
    expect(a.status).toBe('SUBSCRIBED');
    expect(b.status).toBe('SUBSCRIBED');
    await a.channel.track({ id: alice.id, name: 'Alice' });
    await b.channel.track({ id: bob.id, name: 'Bob' });

    const seen = await waitFor(
      () => Object.keys(a.channel.presenceState()).includes(bob.id) && Object.keys(b.channel.presenceState()).includes(alice.id),
    );
    expect(seen).toBe(true);
  });
});
