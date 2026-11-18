import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

config({ path: '.env.local', quiet: true });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  throw new Error(
    'Missing Supabase env. Run `npm run db:start`, then copy ANON_KEY and SERVICE_ROLE_KEY from `npm run db:status` into .env.local.',
  );
}

export type Client = SupabaseClient<Database>;
export const PASSWORD = 'test-password-123';

const opts = { auth: { persistSession: false, autoRefreshToken: false } };

/** Service-role client: bypasses RLS. Tests use it to seed data and to inspect the truth. */
export const admin: Client = createClient<Database>(url, serviceKey, opts);

/** Client with no session at all (role anon). */
export const anon = (): Client => createClient<Database>(url, anonKey, opts);

export type TestUser = { id: string; email: string; client: Client };

/** Creates a confirmed auth user and returns a client signed in as that user. Not yet a team member. */
export async function createTestUser(label = 'user'): Promise<TestUser> {
  const email = `${label}-${randomUUID().slice(0, 8)}@example.test`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error || !data.user) throw new Error(`createUser failed: ${error?.message}`);
  const client = createClient<Database>(url!, anonKey!, opts);
  const signIn = await client.auth.signInWithPassword({ email, password: PASSWORD });
  if (signIn.error) throw new Error(`signIn failed: ${signIn.error.message}`);
  return { id: data.user.id, email, client };
}

/** Reads the current invite code with the service role. */
export async function getInviteCode(): Promise<string> {
  const { data, error } = await admin.from('team_settings').select('invite_code').eq('id', 1).single();
  if (error) throw new Error(`team_settings read failed: ${error.message}`);
  return data.invite_code;
}

/** Creates a user and joins them to the team via the real `join_team` RPC. */
export async function createMember(label: string, name = label): Promise<TestUser> {
  const user = await createTestUser(label);
  const { error } = await user.client.rpc('join_team', { invite_code: await getInviteCode(), display_name: name });
  if (error) throw new Error(`join_team failed: ${error.message}`);
  return user;
}

/** Deletes all content and every auth user (profiles cascade) so each test file starts empty. */
export async function resetTeam(): Promise<void> {
  for (const table of ['shoot_items', 'shoots', 'favorites', 'pose_images', 'poses', 'places', 'ai_usage'] as const) {
    const col = table === 'ai_usage' || table === 'favorites' ? 'user_id' : table === 'shoot_items' ? 'shoot_id' : 'id';
    const { error } = await admin.from(table).delete().not(col, 'is', null);
    if (error) throw new Error(`cleanup ${table}: ${error.message}`);
  }
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) await admin.auth.admin.deleteUser(u.id);
}
