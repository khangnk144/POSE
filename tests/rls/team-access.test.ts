import { beforeAll, describe, expect, it } from 'vitest';
import { admin, anon, createMember, createTestUser, getInviteCode, resetTeam, type TestUser } from './helpers';

describe('join_team and team_settings', () => {
  let first: TestUser;
  let second: TestUser;

  beforeAll(async () => {
    await resetTeam();
  });

  it('rejects a wrong invite code and creates no profile', async () => {
    const stranger = await createTestUser('wrong-code');
    const { data, error } = await stranger.client.rpc('join_team', { invite_code: 'NOPE-NOPE', display_name: 'Stranger' });
    expect(data).toBeNull();
    expect(error?.message).toContain('invalid_invite_code');
    const { data: profile } = await admin.from('profiles').select('id').eq('id', stranger.id);
    expect(profile).toEqual([]);
  });

  it('rejects an empty display name', async () => {
    const user = await createTestUser('no-name');
    const { error } = await user.client.rpc('join_team', { invite_code: await getInviteCode(), display_name: '  ' });
    expect(error?.message).toContain('invalid_display_name');
  });

  it('refuses unauthenticated callers', async () => {
    const { error } = await anon().rpc('join_team', { invite_code: await getInviteCode(), display_name: 'Ghost' });
    expect(error).not.toBeNull();
  });

  it('makes the first joined user admin and later users members', async () => {
    first = await createMember('first', 'Linh');
    second = await createMember('second', 'Mai');
    const { data } = await admin.from('profiles').select('id, role').in('id', [first.id, second.id]);
    const roles = Object.fromEntries((data ?? []).map((p) => [p.id, p.role]));
    expect(roles[first.id]).toBe('admin');
    expect(roles[second.id]).toBe('member');
  });

  it('accepts the invite code case-insensitively and blocks joining twice', async () => {
    const user = await createTestUser('lowercase');
    const code = (await getInviteCode()).toLowerCase();
    const ok = await user.client.rpc('join_team', { invite_code: ` ${code} `, display_name: 'Lan' });
    expect(ok.error).toBeNull();
    const again = await user.client.rpc('join_team', { invite_code: code, display_name: 'Lan' });
    expect(again.error?.message).toContain('already_member');
  });

  it('lets only the admin read team_settings', async () => {
    const asMember = await second.client.from('team_settings').select('invite_code');
    expect(asMember.data).toEqual([]);
    const asAdmin = await first.client.from('team_settings').select('invite_code');
    expect(asAdmin.data).toHaveLength(1);
    const update = await second.client.from('team_settings').update({ invite_code: 'HACKED' }).eq('id', 1).select();
    expect(update.data ?? []).toEqual([]);
    expect(await getInviteCode()).not.toBe('HACKED');
  });

  it('does not let a member promote themselves', async () => {
    const { error } = await second.client.from('profiles').update({ role: 'admin' }).eq('id', second.id);
    expect(error).not.toBeNull();
    const { data } = await admin.from('profiles').select('role').eq('id', second.id).single();
    expect(data?.role).toBe('member');
  });

  it('lets members read each other profiles but not signed-out visitors', async () => {
    const asMember = await second.client.from('profiles').select('id');
    expect((asMember.data ?? []).length).toBeGreaterThanOrEqual(2);
    const asAnon = await anon().from('profiles').select('id');
    expect(asAnon.data ?? []).toEqual([]);
  });
});
