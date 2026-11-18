'use client';

import type { PoseCardData } from '@/lib/types/pose';

export type PoseCardProps = {
  pose: PoseCardData;
  /** Multi-select mode (long-press to enter): shows the select circle instead of navigating. */
  selectable?: boolean;
  selected?: boolean;
  onSelectedChange?: (poseId: string, selected: boolean) => void;
  /** Optional one-line note under the title, e.g. the AI match reason. */
  note?: string;
};

/**
 * Pose card per docs/design.md (photo, image-count badge, favorite heart, title, camera chips,
 * photographer position). Tapping opens /poses/[id] unless `selectable`.
 *
 * Owner: library phase (replaces this stub). Used by AI suggest results and place detail.
 */
export function PoseCard(props: PoseCardProps): React.ReactElement {
  void props;
  throw new Error('not implemented');
}
