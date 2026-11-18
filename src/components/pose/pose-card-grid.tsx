'use client';

import type { ReactNode } from 'react';
import type { PoseCardData } from '@/lib/types/pose';

export type PoseCardGridProps = {
  poses: PoseCardData[];
  /** Shown when `poses` is empty. */
  empty?: ReactNode;
  /** Per-pose note rendered on its card (e.g. AI match reasons keyed by pose id). */
  notes?: Record<string, string>;
};

/**
 * Responsive masonry grid of PoseCard (2 cols mobile, 3 tablet, 4 desktop; JS column split so
 * appended pages never reshuffle existing cards).
 *
 * Owner: library phase (replaces this stub). Used by AI suggest results and place detail.
 */
export function PoseCardGrid(props: PoseCardGridProps): React.ReactElement {
  void props;
  throw new Error('not implemented');
}
