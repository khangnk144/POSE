import type { PoseStatus } from '@/lib/types/pose';

export type SpecGaps = { camera: boolean; steps: boolean };

/**
 * What a pose still lacks: the camera height ("camera") and/or the model steps ("steps").
 * Nothing else (zoom, tags, place...) counts as missing.
 */
export function specGaps(pose: { cameraHeight: unknown; stepCount: number }): SpecGaps {
  return { camera: pose.cameraHeight == null, steps: pose.stepCount === 0 };
}

/**
 * Single source of truth for the "Thiếu thông số" label and invitation: a published pose with
 * no camera height or no steps. Drafts never count. The "Cần bổ sung" library filter expresses
 * the same rule in the database query (`needsDetailsCondition` in pose-query-builder.ts).
 */
export function isMissingSpecs(pose: { status: PoseStatus; cameraHeight: unknown; stepCount: number }): boolean {
  if (pose.status !== 'published') return false;
  const gaps = specGaps(pose);
  return gaps.camera || gaps.steps;
}
