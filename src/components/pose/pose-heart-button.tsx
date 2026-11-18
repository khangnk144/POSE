'use client';

import { useEffect, useRef, useState } from 'react';
import { Heart } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import { toggleFavorite } from '@/lib/poses/favorites';
import { cn } from '@/lib/utils/cn';

const SYNC_EVENT = 'pose-favorite-changed';

/**
 * Favorite heart with optimistic update: the UI flips immediately and reverts with a toast
 * if the request fails. `overlay` sits on photos (white icon), `plain` on surfaces.
 */
export function PoseHeartButton({
  poseId,
  initialFavorite,
  tone = 'overlay',
  className,
}: {
  poseId: string;
  initialFavorite: boolean;
  tone?: 'overlay' | 'plain';
  className?: string;
}) {
  const showToast = useToast();
  const [favorite, setFavorite] = useState(initialFavorite);
  const pending = useRef(false);

  // Keep several hearts for the same pose (detail top bar + bottom bar) in step.
  useEffect(() => {
    const onSync = (event: Event) => {
      const { poseId: id, value } = (event as CustomEvent<{ poseId: string; value: boolean }>).detail;
      if (id === poseId) setFavorite(value);
    };
    window.addEventListener(SYNC_EVENT, onSync);
    return () => window.removeEventListener(SYNC_EVENT, onSync);
  }, [poseId]);

  const broadcast = (value: boolean) =>
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { poseId, value } }));

  async function onClick(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (pending.current) return;
    pending.current = true;
    const previous = favorite;
    broadcast(!previous);
    try {
      broadcast(await toggleFavorite(poseId));
    } catch {
      broadcast(previous);
      showToast('Chưa lưu được tim, bạn thử lại nhé', { kind: 'error' });
    } finally {
      pending.current = false;
    }
  }

  return (
    <button
      type="button"
      aria-label={favorite ? 'Bỏ yêu thích' : 'Yêu thích'}
      aria-pressed={favorite}
      onClick={onClick}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full active:scale-95',
        tone === 'overlay' ? 'text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.5)]' : 'text-text hover:bg-surface-3',
        className,
      )}
    >
      <Heart
        aria-hidden
        className={cn(
          'size-[22px] transition-transform duration-[var(--dur-base)] ease-[var(--ease-spring)]',
          favorite && 'scale-110 fill-primary text-primary',
        )}
      />
    </button>
  );
}
