import type { PoseFilters } from '@/lib/types/pose';
import {
  CAMERA_HEIGHTS,
  CAMERA_TILTS,
  ORIENTATIONS,
  PEOPLE_COUNTS,
  POSE_STATUSES,
  POSTURES,
  ZOOMS,
} from '@/lib/types/pose';
import { poseFiltersSchema } from '@/lib/schemas/pose-filters-schema';

const SCENE_ID = /^[a-z0-9_-]{1,32}$/;

type ParamSource = URLSearchParams | Record<string, string | string[] | undefined>;

/** Array filters: field -> allowed values (null = any scene slug, validated by the schema). */
const LIST_FIELDS: Record<string, readonly string[] | null> = {
  people: PEOPLE_COUNTS,
  posture: POSTURES,
  scenes: null,
  height: CAMERA_HEIGHTS,
  tilt: CAMERA_TILTS,
  zoom: ZOOMS,
  orientation: ORIENTATIONS,
};

function readParam(source: ParamSource, key: string): string | undefined {
  if (source instanceof URLSearchParams) return source.get(key) ?? undefined;
  const value = source[key];
  return Array.isArray(value) ? value[0] : value;
}

/**
 * Parse URL search params into validated filters. Unknown keys and invalid values
 * are dropped one by one so a stale or hand-edited link never throws.
 * Query keys: q, people, posture, scenes, height, tilt, zoom, orientation (comma lists),
 * place, by, fav=1, need=1, status.
 */
export function parseFilters(source: ParamSource): PoseFilters {
  const raw: Record<string, unknown> = {};

  const q = readParam(source, 'q')?.trim();
  if (q) raw.q = q;
  const place = readParam(source, 'place');
  if (place) raw.placeId = place;
  const by = readParam(source, 'by');
  if (by) raw.createdBy = by;
  const status = readParam(source, 'status');
  if (status && (POSE_STATUSES as readonly string[]).includes(status)) raw.status = status;
  if (readParam(source, 'fav') === '1') raw.favoritesOnly = true;
  if (readParam(source, 'need') === '1') raw.needsDetails = true;
  if (readParam(source, 'need') === '1') raw.needsDetails = true;

  for (const [field, allowed] of Object.entries(LIST_FIELDS)) {
    const value = readParam(source, field);
    if (!value) continue;
    const items = [...new Set(value.split(',').filter(Boolean))];
    raw[field] = allowed ? items.filter((v) => allowed.includes(v)) : items.filter((v) => SCENE_ID.test(v));
  }

  // Validate field by field so one bad value cannot discard the rest.
  const result: Record<string, unknown> = {};
  for (const [field, value] of Object.entries(raw)) {
    if (Array.isArray(value) && value.length === 0) continue;
    const shape = poseFiltersSchema.shape[field as keyof typeof poseFiltersSchema.shape];
    const parsed = shape.safeParse(value);
    if (parsed.success) result[field] = parsed.data;
  }
  return result as PoseFilters;
}

/** Serialize filters into search params (empty filters give empty params). */
export function serializeFilters(filters: PoseFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set('q', filters.q);
  for (const field of Object.keys(LIST_FIELDS)) {
    const list = filters[field as keyof PoseFilters] as string[] | undefined;
    if (list && list.length) params.set(field, list.join(','));
  }
  if (filters.placeId) params.set('place', filters.placeId);
  if (filters.createdBy) params.set('by', filters.createdBy);
  if (filters.favoritesOnly) params.set('fav', '1');
  if (filters.needsDetails) params.set('need', '1');
  if (filters.needsDetails) params.set('need', '1');
  if (filters.status) params.set('status', filters.status);
  return params;
}

/** Number of active filters, for the badge on the filter button (search text excluded). */
export function countActiveFilters(filters: PoseFilters): number {
  return Object.entries(filters).filter(([key, v]) => {
    if (key === 'q') return false;
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;
}
