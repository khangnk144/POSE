import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

/**
 * Service-role client: BYPASSES RLS. Server-only (importing it from a Client Component
 * fails the build). Use it only for work no user may do directly, e.g. ai_usage writes,
 * signing URLs in cron jobs, seed scripts. Always check the caller's membership first.
 */
export function createSupabaseAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
