import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import type { Page } from '@playwright/test';
import type { Database } from '../../src/lib/types/database';

config({ path: '.env.local', quiet: true });

const INVITE_CODE = process.env.E2E_INVITE_CODE ?? 'XINH2026'; // local seed.sql value

/** Service-role client for seeding and inspecting data (bypasses RLS). */
export function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  return createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Signs up through the real /join form and lands on the library. Returns the unique display name. */
export async function joinTeam(page: Page, label: string): Promise<string> {
  const suffix = randomUUID().slice(0, 6);
  const name = `${label}-${suffix}`;
  await page.goto('/join');
  await page.getByLabel('Email').fill(`${label}-${suffix}@example.test`);
  await page.getByLabel('Mật khẩu').fill('e2e-password-123');
  await page.getByLabel('Tên hiển thị').fill(name);
  await page.getByLabel('Mã mời').fill(INVITE_CODE);
  await page.getByRole('button', { name: 'Vào team' }).click();
  await page.waitForURL(/\/$/);
  return name;
}

/** Profile id of a member by display name. */
export async function profileIdByName(name: string): Promise<string> {
  const { data, error } = await adminClient().from('profiles').select('id').eq('display_name', name).single();
  if (error) throw new Error(error.message);
  return data.id;
}

/** Inserts `titles.length` published poses owned by `creatorId`; returns their ids in order. */
export async function seedPoses(creatorId: string, titles: string[]): Promise<string[]> {
  const { data, error } = await adminClient()
    .from('poses')
    .insert(titles.map((title) => ({ title, status: 'published', created_by: creatorId })))
    .select('id, title');
  if (error) throw new Error(error.message);
  return titles.map((t) => data.find((p) => p.title === t)!.id);
}
