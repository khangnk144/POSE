import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';

const BUCKET = 'pose-images';
/** One hour: long enough for a browsing session, short enough that leaked links expire. */
export const SIGNED_URL_TTL_SECONDS = 3600;

/**
 * Sign many storage paths with a single request. Returns path -> url; paths that could not be
 * signed are simply absent (callers show the "Ảnh lỗi rồi" placeholder).
 */
export async function signPaths(
  supabase: SupabaseClient<Database>,
  paths: string[],
): Promise<Map<string, string>> {
  const unique = [...new Set(paths.filter(Boolean))];
  const urls = new Map<string, string>();
  if (unique.length === 0) return urls;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(unique, SIGNED_URL_TTL_SECONDS);
  if (error) throw new Error(`signed urls failed: ${error.message}`);
  for (const item of data ?? []) {
    if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
  }
  return urls;
}
