'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { Check, ImageOff } from 'lucide-react';
import { CameraChip } from '@/components/ui/chip';
import { CAMERA_HEIGHT_LABELS } from '@/lib/types/pose-labels';
import type { PoseCardData } from '@/lib/types/pose';
import { cn } from '@/lib/utils/cn';
import { PoseHeartButton } from './pose-heart-button';

export type PoseCardProps = {
  pose: PoseCardData;
  /** Multi-select mode (long-press to enter): shows the select circle instead of navigating. */
  selectable?: boolean;
  selected?: boolean;
  /** Called on tap in select mode, and with `true` when a long-press starts selection. */
  onSelectedChange?: (poseId: string, selected: boolean) => void;
  /** Optional one-line note under the title, e.g. the AI match reason. */
  note?: string;
};

const LONG_PRESS_MS = 400;
/** Cover ratio (w/h) is kept between 9:16 and 3:4 so the masonry never gets too uneven. */
const MIN_RATIO = 9 / 16;
const MAX_RATIO = 3 / 4;

/**
 * Pose card per docs/design.md (photo, image-count badge, favorite heart, title, camera chips,
 * photographer position). Tapping opens /poses/[id] unless `selectable`.
 */
export function PoseCard({ pose, selectable = false, selected = false, onSelectedChange, note }: PoseCardProps) {
  const [ratio, setRatio] = useState(MAX_RATIO);
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  function onPointerDown() {
    longPressed.current = false;
    if (selectable || !onSelectedChange) return;
    timer.current = setTimeout(() => {
      longPressed.current = true;
      onSelectedChange(pose.id, true);
    }, LONG_PRESS_MS);
  }

  function onClick(event: React.MouseEvent) {
    if (longPressed.current) {
      // The press that started selection must not also navigate.
      longPressed.current = false;
      event.preventDefault();
    } else if (selectable) {
      event.preventDefault();
      onSelectedChange?.(pose.id, !selected);
    }
  }

  const showImage = pose.thumbUrl && !broken;
  const chips = [
    pose.cameraHeight ? <CameraChip key="h">{CAMERA_HEIGHT_LABELS[pose.cameraHeight]}</CameraChip> : null,
    pose.zoom ? (
      <CameraChip key="z" tone="zoom">
        {pose.zoom}
      </CameraChip>
    ) : null,
  ].filter(Boolean);

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-lg bg-surface shadow-sm transition-transform duration-[var(--dur-fast)] active:scale-[0.98]',
        selected && 'ring-2 ring-primary',
      )}
    >
      <Link
        href={`/poses/${pose.id}`}
        aria-label={selectable ? `${selected ? 'Bỏ chọn' : 'Chọn'} dáng ${pose.title}` : undefined}
        onClick={onClick}
        onPointerDown={onPointerDown}
        onPointerUp={clearTimer}
        onPointerLeave={clearTimer}
        onPointerCancel={clearTimer}
        onContextMenu={(event) => onSelectedChange && event.preventDefault()}
        draggable={false}
        className="block select-none [-webkit-touch-callout:none]"
      >
        <div
          className="relative w-full overflow-hidden bg-surface-3"
          style={{ aspectRatio: ratio, backgroundColor: !loaded ? (pose.dominantColor ?? undefined) : undefined }}
        >
          {showImage ? (
            // Signed, pre-resized thumbnail from private storage: next/image's optimizer cannot add value here.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={pose.thumbUrl ?? undefined}
              alt=""
              loading="lazy"
              decoding="async"
              draggable={false}
              onLoad={(event) => {
                const { naturalWidth, naturalHeight } = event.currentTarget;
                if (naturalWidth && naturalHeight) {
                  setRatio(Math.min(MAX_RATIO, Math.max(MIN_RATIO, naturalWidth / naturalHeight)));
                }
                setLoaded(true);
              }}
              onError={() => setBroken(true)}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-1 text-text-2">
              <ImageOff className="size-6" aria-hidden />
              <span className="text-xs">{pose.thumbUrl ? 'Ảnh lỗi rồi' : 'Chưa có ảnh'}</span>
            </div>
          )}
          {pose.imageCount >= 2 ? (
            <span className="absolute top-2 left-2 rounded-xs bg-scrim px-1.5 py-0.5 text-xs font-medium text-white">
              {pose.imageCount} ảnh
            </span>
          ) : null}
          {selectable ? (
            <span
              aria-hidden
              className={cn(
                'absolute bottom-2 left-2 flex size-7 items-center justify-center rounded-full border-2',
                selected ? 'border-primary bg-primary text-on-primary' : 'border-white bg-scrim/40',
              )}
            >
              {selected ? <Check className="size-4" /> : null}
            </span>
          ) : null}
        </div>
        <div className="flex flex-col gap-1.5 p-3">
          <h3 className="line-clamp-2 text-[15px] leading-5 font-semibold text-text">{pose.title}</h3>
          {chips.length ? <div className="flex flex-wrap gap-1">{chips}</div> : null}
          {pose.photographerPosition ? (
            <p className="truncate text-[13px] text-text-2">{pose.photographerPosition}</p>
          ) : null}
          {pose.modelStepsPreview.length ? (
            <p className="line-clamp-2 text-[13px] text-text-2">{pose.modelStepsPreview.join(' · ')}</p>
          ) : null}
          {note ? <p className="line-clamp-2 text-[13px] text-ai">{note}</p> : null}
        </div>
      </Link>
      {selectable ? null : (
        <PoseHeartButton poseId={pose.id} initialFavorite={pose.isFavorite} className="absolute top-0 right-0" />
      )}
    </article>
  );
}
