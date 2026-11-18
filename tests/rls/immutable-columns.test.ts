import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, createMember, type TestUser } from './helpers';

// Members edit content wiki-style, but server-managed columns must not be writable by them.
// Writes are expected to fail at the privilege level (error), so nothing changes in the row.
describe('immutable columns', () => {
  let owner: TestUser;
  let alice: TestUser;
  let poseId: string;
  let placeId: string;
  let shootId: string;
  let createdAt: string;

  beforeAll(async () => {
    owner = await createMember('cols-owner', 'Owner');
    alice = await createMember('cols-alice', 'Alice');
    const pose = await owner.client.from('poses').insert({ title: 'Dáng gốc' }).select('id, created_at').single();
    const place = await owner.client.from('places').insert({ name: 'Quán A' }).select('id').single();
    const shoot = await owner.client.from('shoots').insert({ name: 'Buổi 1' }).select('id').single();
    if (pose.error || place.error || shoot.error) throw new Error('fixture insert failed');
    poseId = pose.data.id;
    placeId = place.data.id;
    shootId = shoot.data.id;
    createdAt = pose.data.created_at;
  });

  afterAll(async () => {
    await admin.from('shoots').delete().eq('id', shootId);
    await admin.from('poses').delete().eq('id', poseId);
    await admin.from('places').delete().eq('id', placeId);
    for (const u of [owner, alice]) if (u) await admin.auth.admin.deleteUser(u.id);
  });

  it('rejects a member re-assigning created_by on poses, places and shoots', async () => {
    const pose = await alice.client.from('poses').update({ created_by: alice.id }).eq('id', poseId);
    const place = await alice.client.from('places').update({ created_by: alice.id }).eq('id', placeId);
    const shoot = await alice.client.from('shoots').update({ created_by: alice.id }).eq('id', shootId);
    expect(pose.error).not.toBeNull();
    expect(place.error).not.toBeNull();
    expect(shoot.error).not.toBeNull();

    const { data } = await admin.from('poses').select('created_by').eq('id', poseId).single();
    expect(data?.created_by).toBe(owner.id);
    // so the creator-only delete rule still holds
    const del = await alice.client.from('poses').delete().eq('id', poseId).select();
    expect(del.data).toEqual([]);
  });

  it('rejects changing created_at, id and search_text', async () => {
    const created = await alice.client.from('poses').update({ created_at: '2001-01-01T00:00:00Z' }).eq('id', poseId);
    const id = await alice.client.from('poses').update({ id: crypto.randomUUID() }).eq('id', poseId);
    const search = await alice.client.from('poses').update({ search_text: 'hacked' }).eq('id', poseId);
    expect(created.error).not.toBeNull();
    expect(id.error).not.toBeNull();
    expect(search.error).not.toBeNull();
    const { data } = await admin.from('poses').select('created_at').eq('id', poseId).single();
    expect(new Date(data!.created_at).getTime()).toBe(new Date(createdAt).getTime());
  });

  it('rejects a member promoting themselves to admin', async () => {
    const { error } = await alice.client.from('profiles').update({ role: 'admin' }).eq('id', alice.id);
    expect(error).not.toBeNull();
    const { data } = await admin.from('profiles').select('role').eq('id', alice.id).single();
    expect(data?.role).toBe('member');
  });

  it('rejects an oversized avatar_emoji', async () => {
    const { error } = await alice.client.from('profiles').update({ avatar_emoji: 'x'.repeat(17) }).eq('id', alice.id);
    expect(error).not.toBeNull();
  });

  it('still lets any member edit content columns wiki-style', async () => {
    const pose = await alice.client.from('poses').update({ title: 'Dáng đã sửa', tips: 'mẹo' }).eq('id', poseId).select().single();
    expect(pose.error).toBeNull();
    expect(pose.data?.title).toBe('Dáng đã sửa');
    expect(pose.data?.created_by).toBe(owner.id);
    expect(new Date(pose.data!.updated_at).getTime()).toBeGreaterThan(new Date(createdAt).getTime());

    const place = await alice.client.from('places').update({ name: 'Quán B', note: 'ồn' }).eq('id', placeId).select().single();
    expect(place.error).toBeNull();
    expect(place.data?.name).toBe('Quán B');

    const shoot = await alice.client.from('shoots').update({ name: 'Buổi 2', shoot_date: '2026-12-01' }).eq('id', shootId).select().single();
    expect(shoot.error).toBeNull();
    expect(shoot.data?.shoot_date).toBe('2026-12-01');

    const own = await alice.client.from('profiles').update({ avatar_emoji: '🐱' }).eq('id', alice.id).select().single();
    expect(own.error).toBeNull();
  });
});
