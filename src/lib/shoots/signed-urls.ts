import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

const BUCKET = 'pose-images';
const TTL_SECONDS = 60 * 60;

/**
 * Signed URLs for storage paths in the private pose-images bucket, as a path -> url map.
 * Paths that cannot be signed are left out (callers render a placeholder).
 */
export async function signPaths(
  supabase: SupabaseClient<Database>,
  paths: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths)];
  const urls = new Map<string, string>();
  if (unique.length === 0) return urls;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(unique, TTL_SECONDS);
  if (error || !data) return urls;
  for (const row of data) {
    if (row.path && row.signedUrl) urls.set(row.path, row.signedUrl);
  }
  return urls;
}
