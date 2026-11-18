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

const text = (max: number) => z.string().trim().max(max);

export const poseGridSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  horizon: z.enum(['lower']).nullable().default(null),
});

const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => {
    try {
      const { protocol } = new URL(v);
      return protocol === 'http:' || protocol === 'https:';
    } catch {
      return false;
    }
  }, 'URL không hợp lệ');

/**
 * One pose as edited in the form, produced by AI autofill and used by seed scripts.
 * Optional fields are simply absent when unknown (never null).
 */
export const poseDraftSchema = z.object({
  title: text(160).min(1, 'Nhập tên dáng nhé'),
  description: text(2000).optional(),
  status: z.enum(POSE_STATUSES).default('published'),
  peopleCount: z.enum(PEOPLE_COUNTS).optional(),
  posture: z.enum(POSTURES).optional(),
  scenes: z.array(z.string().trim().min(1).max(32)).max(12).default([]),
  tags: z.array(z.string().trim().min(1).max(40)).max(20).default([]),
  cameraHeight: z.enum(CAMERA_HEIGHTS).optional(),
  cameraTilt: z.enum(CAMERA_TILTS).optional(),
  zoom: z.enum(ZOOMS).optional(),
  orientation: z.enum(ORIENTATIONS).optional(),
  photographerPosition: text(300).optional(),
  distanceM: z.number().min(0).max(99.9).optional(),
  grid: poseGridSchema.optional(),
  modelSteps: z.array(z.string().trim().min(1).max(300)).max(12).default([]),
  tips: text(1000).optional(),
  placeId: z.string().uuid().optional(),
  sourceUrl: httpUrl.optional(),
  sourceCredit: text(200).optional(),
});

export type PoseDraft = z.infer<typeof poseDraftSchema>;
