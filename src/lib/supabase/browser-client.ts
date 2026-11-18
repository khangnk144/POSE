import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database';

/** Supabase client for Client Components. Uses the anon key; RLS protects the data. */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
