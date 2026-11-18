import { z } from 'zod';
import {
  CAMERA_HEIGHTS,
  CAMERA_TILTS,
  ORIENTATIONS,
  PEOPLE_COUNTS,
  POSE_STATUSES,
  POSTURES,
  ZOOMS,
} from '@/lib/types/pose';

/** Scene ids are lowercase slugs; anything else is dropped when parsing URLs. */
const sceneId = z.string().regex(/^[a-z0-9_-]{1,32}$/);

export const poseFiltersSchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  people: z.array(z.enum(PEOPLE_COUNTS)).optional(),
  posture: z.array(z.enum(POSTURES)).optional(),
  scenes: z.array(sceneId).optional(),
  height: z.array(z.enum(CAMERA_HEIGHTS)).optional(),
  tilt: z.array(z.enum(CAMERA_TILTS)).optional(),
  zoom: z.array(z.enum(ZOOMS)).optional(),
  orientation: z.array(z.enum(ORIENTATIONS)).optional(),
  placeId: z.string().uuid().optional(),
  createdBy: z.string().uuid().optional(),
  favoritesOnly: z.boolean().optional(),
  status: z.enum(POSE_STATUSES).optional(),
});
