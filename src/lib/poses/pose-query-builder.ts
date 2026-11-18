import type { PoseFilters } from '@/lib/types/pose';
import { escapeLikePattern, searchTokens } from './search-normalize';

/** One PostgREST condition. Kept as plain data so the filter logic is unit-testable. */
export type PoseCondition =
  | { op: 'eq'; column: string; value: string }
  | { op: 'in'; column: string; values: string[] }
  | { op: 'overlaps'; column: string; values: string[] }
  | { op: 'ilike'; column: string; pattern: string }
  | { op: 'or'; expression: string };

export type PoseCursor = { createdAt: string; id: string };

/** Opaque cursor: url-safe base64 of "createdAt|id". */
export function encodeCursor(cursor: PoseCursor): string {
  // Timestamps and uuids are ASCII, so btoa works in both Node and browsers.
  return btoa(`${cursor.createdAt}|${cursor.id}`).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?([+-]\d{2}(:?\d{2})?|Z)?$/;

/** Returns null for anything that is not a cursor we produced (stale or hand-edited input). */
export function decodeCursor(raw: string | null | undefined): PoseCursor | null {
  if (!raw) return null;
  let text: string;
  try {
    text = atob(raw.replace(/-/g, '+').replace(/_/g, '/'));
  } catch {
    return null;
  }
  const [createdAt, id, ...rest] = text.split('|');
  if (rest.length || !createdAt || !id || !TIMESTAMP.test(createdAt) || !UUID.test(id)) return null;
  return { createdAt, id };
}

/**
 * Translate filters (+ optional cursor) into conditions. Published poses only unless
 * `status` says otherwise. Favorites are not a condition: they need an inner join, see
 * `poseCardSelect`.
 */
export function buildPoseConditions(filters: PoseFilters, cursor?: PoseCursor | null): PoseCondition[] {
  const conditions: PoseCondition[] = [{ op: 'eq', column: 'status', value: filters.status ?? 'published' }];

  for (const token of searchTokens(filters.q)) {
    conditions.push({ op: 'ilike', column: 'search_text', pattern: `%${escapeLikePattern(token)}%` });
  }

  const inFilters: Array<[string, readonly string[] | undefined]> = [
    ['people_count', filters.people],
    ['posture', filters.posture],
    ['camera_height', filters.height],
    ['camera_tilt', filters.tilt],
    ['zoom', filters.zoom],
    ['orientation', filters.orientation],
  ];
  for (const [column, values] of inFilters) {
    if (values?.length) conditions.push({ op: 'in', column, values: [...values] });
  }
  if (filters.scenes?.length) conditions.push({ op: 'overlaps', column: 'scenes', values: [...filters.scenes] });
  if (filters.placeId) conditions.push({ op: 'eq', column: 'place_id', value: filters.placeId });
  if (filters.createdBy) conditions.push({ op: 'eq', column: 'created_by', value: filters.createdBy });

  if (cursor) {
    // Strictly older than the cursor row, ties on created_at broken by id (same order as the sort).
    const t = `"${cursor.createdAt}"`;
    conditions.push({ op: 'or', expression: `created_at.lt.${t},and(created_at.eq.${t},id.lt.${cursor.id})` });
  }
  return conditions;
}

/** Minimal chainable shape shared by every PostgREST filter builder. */
type Filterable = {
  eq(column: string, value: string): Filterable;
  in(column: string, values: string[]): Filterable;
  overlaps(column: string, values: string[]): Filterable;
  ilike(column: string, pattern: string): Filterable;
  or(expression: string): Filterable;
};

/** Apply conditions to a supabase-js query. */
export function applyPoseConditions<Q>(query: Q, conditions: PoseCondition[]): Q {
  // The supabase-js builder generics are column-typed; our column names are plain strings,
  // so the builder is viewed through the minimal `Filterable` shape (runtime API is identical).
  let q = query as unknown as Filterable;
  for (const c of conditions) {
    if (c.op === 'eq') q = q.eq(c.column, c.value);
    else if (c.op === 'in') q = q.in(c.column, c.values);
    else if (c.op === 'overlaps') q = q.overlaps(c.column, c.values);
    else if (c.op === 'ilike') q = q.ilike(c.column, c.pattern);
    else q = q.or(c.expression);
  }
  return q as unknown as Q;
}

/**
 * Select list for card queries. `fav` embeds the viewer's favorite row (RLS only exposes own rows);
 * `!inner` turns it into a filter for favoritesOnly.
 */
export function poseCardSelect(filters: PoseFilters): string {
  const fav = filters.favoritesOnly ? 'fav:favorites!inner(user_id)' : 'fav:favorites(user_id)';
  return (
    'id,title,camera_height,zoom,photographer_position,model_steps,created_at,' +
    `pose_images(thumb_path,position,dominant_color),${fav}`
  );
}
