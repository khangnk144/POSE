import 'server-only';
import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from './server-client';
import type { Database } from '@/lib/types/database';

export type Profile = Database['public']['Tables']['profiles']['Row'];

/** Verified user id from the session JWT, or null when signed out. Cached per request. */
export const getCurrentUserId = cache(async (): Promise<string | null> => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
});

/** Profile of the signed-in user, or null when signed out or not yet a team member. */
export const getCurrentProfile = cache(async (): Promise<Profile | null> => {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
  return data;
});

/**
 * Guard for pages and route handlers that need a team member.
 * Signed out -> /login; signed in without profile -> /join.
 */
export async function requireMember(): Promise<Profile> {
  const userId = await getCurrentUserId();
  if (!userId) redirect('/login');
  const profile = await getCurrentProfile();
  if (!profile) redirect('/join');
  return profile;
}
