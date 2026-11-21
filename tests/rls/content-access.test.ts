import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { admin, anon, createMember, createTestUser, resetTeam, type TestUser } from './helpers';

describe('content RLS', () => {
  let owner: TestUser; // first joined user = admin
  let alice: TestUser;
  let bob: TestUser;
  let outsider: TestUser; // signed up but never joined
  let bobPoseId: string;

  beforeAll(async () => {
    await resetTeam();
    owner = await createMember('owner', 'Owner');
    alice = await createMember('alice', 'Alice');
    bob = await createMember('bob', 'Bob');
    outsider = await createTestUser('outsider');
    const { data, error } = await bob.client
      .from('poses')
      .insert({ title: 'Đứng dựa tường cà phê', scenes: ['cafe'], tags: ['nắng'] })
      .select()
      .single();
    if (error) throw new Error(error.message);
    bobPoseId = data.id;
  });

  it('shows 0 poses to a non-member and to anonymous visitors', async () => {
    const asOutsider = await outsider.client.from('poses').select('id');
    expect(asOutsider.error).toBeNull();
    expect(asOutsider.data).toEqual([]);
    const asAnon = await anon().from('poses').select('id');
    expect(asAnon.data ?? []).toEqual([]);
  });

  it('blocks a non-member from inserting poses or places', async () => {
    const pose = await outsider.client.from('poses').insert({ title: 'Sneaky' });
    expect(pose.error).not.toBeNull();
    const place = await outsider.client.from('places').insert({ name: 'Sneaky place' });
    expect(place.error).not.toBeNull();
  });

  it('lets members read poses', async () => {
    const { data } = await alice.client.from('poses').select('id').eq('id', bobPoseId);
    expect(data).toHaveLength(1);
  });

  it('prevents member A from deleting member B pose', async () => {
    const { data, error } = await alice.client.from('poses').delete().eq('id', bobPoseId).select();
    expect(error).toBeNull();
    expect(data).toEqual([]);
    const { data: still } = await admin.from('poses').select('id').eq('id', bobPoseId);
    expect(still).toHaveLength(1);
  });

  it('lets any member update a pose (wiki-style) without changing its creator', async () => {
    const { data, error } = await alice.client
      .from('poses')
      .update({ tips: 'Ngồi mép ghế' })
      .eq('id', bobPoseId)
      .select()
      .single();
    expect(error).toBeNull();
    expect(data?.tips).toBe('Ngồi mép ghế');
    expect(data?.created_by).toBe(bob.id);
  });

  it('lets any member remove images of another member pose (wiki-style), but not outsiders', async () => {
    const img = { pose_id: bobPoseId, position: 1, full_path: 'poses/x/a-full.webp', thumb_path: 'poses/x/a-thumb.webp' };
    const first = await bob.client.from('pose_images').insert(img).select().single();
    expect(first.error).toBeNull();

    const byOutsider = await outsider.client.from('pose_images').delete().eq('id', first.data!.id).select();
    expect(byOutsider.data ?? []).toEqual([]);

    const byAlice = await alice.client.from('pose_images').delete().eq('id', first.data!.id).select();
    expect(byAlice.data).toHaveLength(1);
  });

  it('allows up to 10 images per pose (positions 0-9) and rejects an 11th slot', async () => {
    const img = (position: number) => ({ pose_id: bobPoseId, position, full_path: `poses/x/${position}-full.webp`, thumb_path: `poses/x/${position}-thumb.webp` });
    const tenth = await bob.client.from('pose_images').insert(img(9)).select().single();
    expect(tenth.error).toBeNull();
    const eleventh = await bob.client.from('pose_images').insert(img(10));
    expect(eleventh.error).not.toBeNull();
    await bob.client.from('pose_images').delete().eq('id', tenth.data!.id);
  });

  it('refuses to create a pose in someone else name', async () => {
    const { error } = await alice.client.from('poses').insert({ title: 'Forged', created_by: bob.id });
    expect(error).not.toBeNull();
  });

  it('lets the creator and an admin delete a pose', async () => {
    const mine = await bob.client.from('poses').insert({ title: 'Bob own' }).select().single();
    const del = await bob.client.from('poses').delete().eq('id', mine.data!.id).select();
    expect(del.data).toHaveLength(1);

    const another = await bob.client.from('poses').insert({ title: 'Bob again' }).select().single();
    const byAdmin = await owner.client.from('poses').delete().eq('id', another.data!.id).select();
    expect(byAdmin.data).toHaveLength(1);
  });

  it('fills search_text with lowercase, accent-free text', async () => {
    const { data } = await admin.from('poses').select('search_text').eq('id', bobPoseId).single();
    expect(data?.search_text).toContain('dung dua tuong ca phe');
    expect(data?.search_text).toContain('cafe');
    expect(data?.search_text).toContain('nang');
  });

  it('keeps favorites private to each user but exposes counts to members', async () => {
    await alice.client.from('favorites').insert({ pose_id: bobPoseId });
    await bob.client.from('favorites').insert({ pose_id: bobPoseId });

    const mine = await alice.client.from('favorites').select('user_id');
    expect(mine.data).toEqual([{ user_id: alice.id }]);

    const forged = await alice.client.from('favorites').insert({ pose_id: bobPoseId, user_id: bob.id });
    expect(forged.error).not.toBeNull();

    const counts = await alice.client.from('pose_favorite_counts').select('*').eq('pose_id', bobPoseId);
    expect(counts.data?.[0]?.favorite_count).toBe(2);
    const outsiderCounts = await outsider.client.from('pose_favorite_counts').select('*');
    expect(outsiderCounts.data ?? []).toEqual([]);
  });

  it('applies creator-or-admin delete to places and shoots too', async () => {
    const place = await bob.client.from('places').insert({ name: 'Artemis' }).select().single();
    const denied = await alice.client.from('places').delete().eq('id', place.data!.id).select();
    expect(denied.data).toEqual([]);

    const shoot = await bob.client.from('shoots').insert({ name: 'Đà Lạt' }).select().single();
    const deniedShoot = await alice.client.from('shoots').delete().eq('id', shoot.data!.id).select();
    expect(deniedShoot.data).toEqual([]);
    const adminShoot = await owner.client.from('shoots').delete().eq('id', shoot.data!.id).select();
    expect(adminShoot.data).toHaveLength(1);
  });

  it('keeps ai_usage invisible to regular users', async () => {
    await admin.from('ai_usage').insert({ user_id: alice.id, day: '2026-11-18', count: 3 });
    const read = await alice.client.from('ai_usage').select('*');
    expect(read.data ?? []).toEqual([]);
    const write = await alice.client.from('ai_usage').insert({ user_id: alice.id, day: '2026-11-19', count: 0 });
    expect(write.error).not.toBeNull();
  });
});

describe('storage bucket pose-images', () => {
  let member: TestUser;
  let outsider: TestUser;
  const path = `poses/${crypto.randomUUID()}/test-thumb.webp`;
  const bytes = new Blob([new Uint8Array([82, 73, 70, 70])], { type: 'image/webp' });

  beforeAll(async () => {
    await resetTeam();
    await createMember('seed-admin', 'Admin');
    member = await createMember('uploader', 'Uploader');
    outsider = await createTestUser('storage-outsider');
  });

  afterAll(async () => {
    await admin.storage.from('pose-images').remove([path]);
  });

  it('is private and lets members upload and sign URLs', async () => {
    const { data: bucket } = await admin.storage.getBucket('pose-images');
    expect(bucket?.public).toBe(false);

    const up = await member.client.storage.from('pose-images').upload(path, bytes, { contentType: 'image/webp' });
    expect(up.error).toBeNull();
    const signed = await member.client.storage.from('pose-images').createSignedUrl(path, 60);
    expect(signed.error).toBeNull();
    expect(signed.data?.signedUrl).toContain('token=');
  });

  it('blocks non-members from uploading, signing and listing', async () => {
    const up = await outsider.client.storage.from('pose-images').upload(`poses/x/hack.webp`, bytes, { contentType: 'image/webp' });
    expect(up.error).not.toBeNull();
    const signed = await outsider.client.storage.from('pose-images').createSignedUrl(path, 60);
    expect(signed.error).not.toBeNull();
    const list = await anon().storage.from('pose-images').list('poses');
    expect(list.data ?? []).toEqual([]);
  });
});
