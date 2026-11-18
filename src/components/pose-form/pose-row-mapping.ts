import type { PoseDraft } from '@/lib/schemas/pose-draft-schema';
import { poseGridSchema } from '@/lib/schemas/pose-draft-schema';
import type { Database, Json } from '@/lib/types/database';
import {
  CAMERA_HEIGHTS,
  CAMERA_TILTS,
  ORIENTATIONS,
  PEOPLE_COUNTS,
  POSE_STATUSES,
  POSTURES,
  ZOOMS,
} from '@/lib/types/pose';
import { EMPTY_VALUES, type FormValues } from './form-values';

export type PoseRow = Database['public']['Tables']['poses']['Row'];
export type PoseWrite = Database['public']['Tables']['poses']['Update'];

function oneOf<T extends string>(list: readonly T[], v: string | null): T | undefined {
  return list.find((x) => x === v);
}

/** DB row (snake_case, nulls) -> form state. Unknown enum values become empty. */
export function rowToFormValues(row: PoseRow): FormValues {
  const grid = poseGridSchema.safeParse(row.grid);
  return {
    ...EMPTY_VALUES,
    title: row.title,
    description: row.description ?? '',
    status: oneOf(POSE_STATUSES, row.status) ?? 'published',
    peopleCount: oneOf(PEOPLE_COUNTS, row.people_count),
    posture: oneOf(POSTURES, row.posture),
    scenes: row.scenes,
    tags: row.tags,
    cameraHeight: oneOf(CAMERA_HEIGHTS, row.camera_height),
    cameraTilt: oneOf(CAMERA_TILTS, row.camera_tilt),
    zoom: oneOf(ZOOMS, row.zoom),
    orientation: oneOf(ORIENTATIONS, row.orientation),
    photographerPosition: row.photographer_position ?? '',
    distanceM: row.distance_m ?? undefined,
    grid: grid.success ? grid.data : undefined,
    modelSteps: row.model_steps,
    tips: row.tips ?? '',
    placeId: row.place_id ?? undefined,
    sourceUrl: row.source_url ?? '',
    sourceCredit: row.source_credit ?? '',
  };
}

/**
 * Validated draft -> DB columns. Absent optional fields are written as null so that
 * clearing a field in the edit form really clears it.
 */
export function draftToRow(d: PoseDraft): PoseWrite {
  return {
    title: d.title,
    description: d.description ?? null,
    status: d.status,
    people_count: d.peopleCount ?? null,
    posture: d.posture ?? null,
    scenes: d.scenes,
    tags: d.tags,
    camera_height: d.cameraHeight ?? null,
    camera_tilt: d.cameraTilt ?? null,
    zoom: d.zoom ?? null,
    orientation: d.orientation ?? null,
    photographer_position: d.photographerPosition ?? null,
    distance_m: d.distanceM ?? null,
    grid: (d.grid as Json | undefined) ?? null,
    model_steps: d.modelSteps,
    tips: d.tips ?? null,
    place_id: d.placeId ?? null,
    source_url: d.sourceUrl ?? null,
    source_credit: d.sourceCredit ?? null,
  };
}
