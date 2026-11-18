'use client';

import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';
import { CAMERA_HEIGHT_LABELS } from '@/lib/types/pose-labels';
import type { ShootItemView } from '@/lib/shoots/shoot-queries';
import { cn } from '@/lib/utils/cn';
import { useWakeLock } from './use-wake-lock';

/** Full-screen swipe view for use during the shoot: reference photo, short camera notes, tick when done. */
export function ShootingMode({
  items,
  startIndex,
  onClose,
  onToggleDone,
}: {
  items: ShootItemView[];
  startIndex: number;
  onClose: () => void;
  onToggleDone: (poseId: string) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ startIndex, align: 'start' });
  const [index, setIndex] = useState(startIndex);
  useWakeLock(true);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') emblaApi?.scrollNext();
      if (e.key === 'ArrowLeft') emblaApi?.scrollPrev();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [emblaApi, onClose]);

  const goPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const goNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);
  const current = items[index];

  return (
    <div role="dialog" aria-modal="true" aria-label="Chế độ chụp" className="fixed inset-0 z-[70] flex flex-col bg-bg">
      <div className="flex items-center justify-between px-2 pt-[env(safe-area-inset-top)]">
        <button type="button" aria-label="Thoát chế độ chụp" onClick={onClose} className="flex size-11 items-center justify-center rounded-full">
          <X className="size-6" aria-hidden />
        </button>
        <p aria-live="polite" className="text-sm font-semibold text-text-2">
          {index + 1} / {items.length} · đã chụp {items.filter((i) => i.done).length}
        </p>
        <span className="size-11" aria-hidden />
      </div>

      <div ref={emblaRef} className="min-h-0 flex-1 overflow-hidden">
        <div className="flex h-full">
          {items.map((item) => (
            <section key={item.poseId} aria-label={item.title} className="flex h-full min-w-0 flex-[0_0_100%] flex-col gap-3 overflow-y-auto px-4 pb-4">
              <div
                className="flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-lg"
                style={{ backgroundColor: item.dominantColor ?? 'var(--surface-3)' }}
              >
                {item.fullUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed storage URL
                  <img src={item.fullUrl} alt={item.title} className="max-h-full max-w-full object-contain" draggable={false} />
                ) : (
                  <ImageOff className="size-10 text-text-3" aria-hidden />
                )}
              </div>
              <div className="shrink-0">
                <h2 className="font-display text-[20px] font-bold">{item.title}</h2>
                <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                  {item.cameraHeight ? <li className="rounded-full bg-surface-2 px-3 py-1">Máy {CAMERA_HEIGHT_LABELS[item.cameraHeight]}</li> : null}
                  {item.zoom ? <li className="rounded-full bg-surface-2 px-3 py-1">Zoom {item.zoom}</li> : null}
                  {item.photographerPosition ? <li className="rounded-full bg-surface-2 px-3 py-1">{item.photographerPosition}</li> : null}
                </ul>
                {item.steps.length > 0 ? (
                  <ol className="mt-2 list-decimal pl-5 text-[15px] text-text-2">
                    {item.steps.slice(0, 3).map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-border px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <button type="button" aria-label="Dáng trước" onClick={goPrev} disabled={index === 0} className="flex size-12 items-center justify-center rounded-full border border-border-strong disabled:opacity-40">
          <ChevronLeft className="size-6" aria-hidden />
        </button>
        <button
          type="button"
          aria-pressed={current?.done}
          onClick={() => current && onToggleDone(current.poseId)}
          className={cn(
            'flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full font-semibold',
            current?.done ? 'bg-success text-on-primary' : 'bg-primary text-on-primary',
          )}
        >
          <Check className="size-5" aria-hidden />
          {current?.done ? 'Đã chụp xong' : 'Đánh dấu đã chụp'}
        </button>
        <button type="button" aria-label="Dáng sau" onClick={goNext} disabled={index === items.length - 1} className="flex size-12 items-center justify-center rounded-full border border-border-strong disabled:opacity-40">
          <ChevronRight className="size-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}
