'use client';

import { useSyncExternalStore, type ReactNode } from 'react';
import type { PoseCardData } from '@/lib/types/pose';
import { PoseCard, type PoseCardProps } from './pose-card';

export type PoseCardGridProps = {
  poses: PoseCardData[];
  /** Shown when `poses` is empty. */
  empty?: ReactNode;
  /** Per-pose note rendered on its card (e.g. AI match reasons keyed by pose id). */
  notes?: Record<string, string>;
  /** Selection support, forwarded to every card (used by the library). */
  selection?: Pick<PoseCardProps, 'selectable' | 'onSelectedChange'> & { selectedIds?: ReadonlySet<string> };
};

const QUERIES = ['(min-width: 1024px)', '(min-width: 640px)'] as const;

function subscribe(onChange: () => void) {
  const lists = QUERIES.map((query) => window.matchMedia(query));
  lists.forEach((list) => list.addEventListener('change', onChange));
  return () => lists.forEach((list) => list.removeEventListener('change', onChange));
}

/** 4 columns from 1024px, 3 from 640px, otherwise 2. */
function getColumnCount() {
  if (window.matchMedia(QUERIES[0]).matches) return 4;
  return window.matchMedia(QUERIES[1]).matches ? 3 : 2;
}

/**
 * Responsive masonry grid of PoseCard (2 cols mobile, 3 tablet, 4 desktop). Columns are split in
 * JS, round-robin, so reading order stays newest-first and appended pages never reshuffle cards.
 */
export function PoseCardGrid({ poses, empty, notes, selection }: PoseCardGridProps) {
  const columnCount = useSyncExternalStore(subscribe, getColumnCount, () => 2);

  if (poses.length === 0) return <>{empty ?? null}</>;

  const columns: PoseCardData[][] = Array.from({ length: columnCount }, () => []);
  poses.forEach((pose, index) => columns[index % columnCount].push(pose));

  return (
    <div className="flex items-start gap-3 md:gap-4">
      {columns.map((column, index) => (
        <div key={index} className="flex min-w-0 flex-1 flex-col gap-3 md:gap-4">
          {column.map((pose) => (
            <PoseCard
              key={pose.id}
              pose={pose}
              note={notes?.[pose.id]}
              selectable={selection?.selectable}
              selected={selection?.selectedIds?.has(pose.id)}
              onSelectedChange={selection?.onSelectedChange}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
