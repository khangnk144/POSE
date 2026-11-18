import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import type { PoseCardData, PoseFilters } from '@/lib/types/pose';

export type PoseCardPage = { items: PoseCardData[]; nextCursor: string | null };

/**
 * Load card data (incl. signed thumbnail URLs and the viewer's favorite flag) for the given pose ids,
 * returned in the same order as `ids`. Unknown or unreadable ids are skipped.
 * Works with both the browser and the server Supabase client (RLS applies).
 *
 * Owner: library phase (replaces this stub). Used by AI suggest results and place detail.
 */
export async function getPoseCardsByIds(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<PoseCardData[]> {
  void supabase;
  void ids;
  throw new Error('not implemented');
}

/**
 * One page of the library for the given filters, newest first, cursor-paginated on (created_at, id).
 * `cursor` is the opaque `nextCursor` of the previous page; null/undefined for the first page.
 *
 * Owner: library phase (replaces this stub). Used by the library, favorites, drafts and place detail.
 */
export async function listPoseCards(
  supabase: SupabaseClient<Database>,
  filters: PoseFilters,
  cursor?: string | null,
  pageSize = 24,
): Promise<PoseCardPage> {
  void supabase;
  void filters;
  void cursor;
  void pageSize;
  throw new Error('not implemented');
}
