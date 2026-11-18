import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/types/database';
import type { CameraHeight, PoseCardData, PoseFilters, Zoom } from '@/lib/types/pose';
import {
  applyPoseConditions,
  buildPoseConditions,
  decodeCursor,
  encodeCursor,
  poseCardSelect,
} from './pose-query-builder';
import { signPaths } from './signed-urls';

export type PoseCardPage = { items: PoseCardData[]; nextCursor: string | null };

/** Row shape of the `poseCardSelect` embed (the select string is dynamic, so it is typed by hand). */
type CardRow = {
  id: string;
  title: string;
  camera_height: string | null;
  zoom: string | null;
  photographer_position: string | null;
  model_steps: string[] | null;
  created_at: string;
  pose_images: Array<{ thumb_path: string; position: number; dominant_color: string | null }> | null;
  fav: Array<{ user_id: string }> | null;
};

async function toCards(supabase: SupabaseClient<Database>, rows: CardRow[]): Promise<PoseCardData[]> {
  const covers = rows.map((row) => [...(row.pose_images ?? [])].sort((a, b) => a.position - b.position)[0]);
  const urls = await signPaths(
    supabase,
    covers.flatMap((cover) => (cover ? [cover.thumb_path] : [])),
  );
  return rows.map((row, i) => {
    const cover = covers[i];
    return {
      id: row.id,
      title: row.title,
      thumbUrl: cover ? (urls.get(cover.thumb_path) ?? null) : null,
      imageCount: row.pose_images?.length ?? 0,
      cameraHeight: row.camera_height as CameraHeight | null,
      zoom: row.zoom as Zoom | null,
      photographerPosition: row.photographer_position,
      modelStepsPreview: (row.model_steps ?? []).slice(0, 2),
      isFavorite: (row.fav?.length ?? 0) > 0,
      dominantColor: cover?.dominant_color ?? null,
    };
  });
}

/**
 * Load card data (incl. signed thumbnail URLs and the viewer's favorite flag) for the given pose ids,
 * returned in the same order as `ids`. Unknown or unreadable ids are skipped.
 * Works with both the browser and the server Supabase client (RLS applies).
 */
export async function getPoseCardsByIds(
  supabase: SupabaseClient<Database>,
  ids: string[],
): Promise<PoseCardData[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from('poses').select(poseCardSelect({})).in('id', ids);
  if (error) throw new Error(`load poses failed: ${error.message}`);
  const cards = await toCards(supabase, (data ?? []) as unknown as CardRow[]);
  const byId = new Map(cards.map((card) => [card.id, card]));
  return ids.flatMap((id) => {
    const card = byId.get(id);
    return card ? [card] : [];
  });
}

/**
 * One page of the library for the given filters, newest first, cursor-paginated on (created_at, id).
 * `cursor` is the opaque `nextCursor` of the previous page; null/undefined for the first page.
 */
export async function listPoseCards(
  supabase: SupabaseClient<Database>,
  filters: PoseFilters,
  cursor?: string | null,
  pageSize = 24,
): Promise<PoseCardPage> {
  const conditions = buildPoseConditions(filters, decodeCursor(cursor));
  const query = applyPoseConditions(supabase.from('poses').select(poseCardSelect(filters)), conditions)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(pageSize + 1); // one extra row tells us whether another page exists
  const { data, error } = await query;
  if (error) throw new Error(`load poses failed: ${error.message}`);

  const rows = (data ?? []) as unknown as CardRow[];
  const hasMore = rows.length > pageSize;
  const pageRows = hasMore ? rows.slice(0, pageSize) : rows;
  const last = pageRows[pageRows.length - 1];
  return {
    items: await toCards(supabase, pageRows),
    nextCursor: hasMore && last ? encodeCursor({ createdAt: last.created_at, id: last.id }) : null,
  };
}

/** How many poses match the filters (for the live count in the filter sheet). */
export async function countPoses(supabase: SupabaseClient<Database>, filters: PoseFilters): Promise<number> {
  const select = filters.favoritesOnly ? 'id,fav:favorites!inner(user_id)' : 'id';
  const query = applyPoseConditions(
    supabase.from('poses').select(select, { count: 'exact', head: true }),
    buildPoseConditions(filters),
  );
  const { count, error } = await query;
  if (error) throw new Error(`count poses failed: ${error.message}`);
  return count ?? 0;
}
