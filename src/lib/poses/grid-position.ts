import { poseGridSchema } from '@/lib/schemas/pose-draft-schema';
import type { PoseGrid } from '@/lib/types/pose';

/** Validate the `grid` jsonb column; null when missing or malformed. */
export function parsePoseGrid(raw: unknown): PoseGrid | null {
  const parsed = poseGridSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

/** Vietnamese hint for where the subject sits on the rule-of-thirds grid. */
export function describeGridPosition(grid: PoseGrid): string {
  const horizontal = grid.x < 0.42 ? 'bên trái' : grid.x > 0.58 ? 'bên phải' : 'giữa khung';
  const vertical = grid.y < 0.42 ? 'nửa trên' : grid.y > 0.58 ? 'nửa dưới' : 'giữa';
  const place =
    horizontal === 'giữa khung' && vertical === 'giữa'
      ? 'Đặt người ở chính giữa khung'
      : horizontal === 'giữa khung'
        ? `Đặt người ở giữa khung, ${vertical}`
        : `Đặt người ở 1/3 ${horizontal}, ${vertical}`;
  return grid.horizon === 'lower' ? `${place}. Đường chân trời nằm ở 1/3 dưới.` : `${place}.`;
}
