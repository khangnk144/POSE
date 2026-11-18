'use client';

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { Grid3x3, ImageOff } from 'lucide-react';
import type { PoseGrid } from '@/lib/types/pose';
import { cn } from '@/lib/utils/cn';

export type CarouselImage = { id: string; url: string | null; width: number | null; height: number | null; color: string | null };

const STORAGE_KEY = 'pose-xinh:grid-overlay';
const listeners = new Set<() => void>();

/** The grid on/off choice is remembered across visits (localStorage, shared by all tabs). */
function useGridPreference(): [boolean, (value: boolean) => void] {
  const subscribe = useCallback((onChange: () => void) => {
    listeners.add(onChange);
    window.addEventListener('storage', onChange);
    return () => {
      listeners.delete(onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);
  const value = useSyncExternalStore(
    subscribe,
    () => localStorage.getItem(STORAGE_KEY) === '1',
    () => false,
  );
  const set = useCallback((next: boolean) => {
    try {
      localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
    } catch {
      // Private mode: the toggle still works for this page view via the listeners below.
    }
    listeners.forEach((fn) => fn());
  }, []);
  return [value, set];
}

/** Rule-of-thirds lines plus a ring on the saved subject position. */
function GridOverlay({ grid }: { grid: PoseGrid | null }) {
  const line = 'absolute bg-white/90 shadow-[0_0_2px_rgb(0_0_0/0.6)]';
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span className={cn(line, 'inset-y-0 left-1/3 w-px')} />
      <span className={cn(line, 'inset-y-0 left-2/3 w-px')} />
      <span className={cn(line, 'inset-x-0 top-1/3 h-px')} />
      <span className={cn(line, 'inset-x-0 top-2/3 h-px')} />
      {grid ? (
        <span
          data-testid="grid-subject-marker"
          className="absolute size-7 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-full border-2 border-primary bg-primary/15"
          style={{ left: `${grid.x * 100}%`, top: `${grid.y * 100}%` }}
        />
      ) : null}
    </div>
  );
}

/** Swipeable photo carousel (embla) with an optional 3x3 grid overlay and page dots. */
export function PoseImageCarousel({ images, title, grid }: { images: CarouselImage[]; title: string; grid: PoseGrid | null }) {
  const [viewportRef, embla] = useEmblaCarousel({ loop: false });
  const [index, setIndex] = useState(0);
  const [showGrid, setShowGrid] = useGridPreference();

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setIndex(embla.selectedScrollSnap());
    embla.on('select', onSelect);
    return () => {
      embla.off('select', onSelect);
    };
  }, [embla]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[3/4] max-h-[70vh] w-full flex-col items-center justify-center gap-2 bg-surface-3 text-text-2">
        <ImageOff className="size-8" aria-hidden />
        Dáng này chưa có ảnh
      </div>
    );
  }

  return (
    <div className="relative bg-surface-3">
      <div ref={viewportRef} className="overflow-hidden">
        <div className="flex">
          {images.map((image, i) => {
            const ratio = image.width && image.height ? image.width / image.height : 3 / 4;
            return (
              <div key={image.id} className="flex min-w-0 shrink-0 grow-0 basis-full justify-center">
                <div
                  className="relative"
                  style={{ aspectRatio: ratio, width: `min(100%, calc(70vh * ${ratio}))`, backgroundColor: image.color ?? undefined }}
                >
                  {image.url ? (
                    // Signed URL from private storage; the original ratio is kept so the overlay lines up.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={image.url}
                      alt={`${title} (ảnh ${i + 1}/${images.length})`}
                      draggable={false}
                      loading={i === 0 ? 'eager' : 'lazy'}
                      className="size-full select-none object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center text-text-2">Ảnh lỗi rồi</div>
                  )}
                  {showGrid ? <GridOverlay grid={grid} /> : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        aria-pressed={showGrid}
        aria-label={showGrid ? 'Tắt lưới 3x3' : 'Bật lưới 3x3'}
        onClick={() => setShowGrid(!showGrid)}
        className={cn(
          'absolute right-2 bottom-2 flex size-11 items-center justify-center rounded-full text-white',
          showGrid ? 'bg-primary' : 'bg-scrim',
        )}
      >
        <Grid3x3 className="size-5" aria-hidden />
      </button>

      {images.length > 1 ? (
        <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1.5" aria-hidden>
          {images.map((image, i) => (
            <span key={image.id} className={cn('h-1.5 rounded-full bg-white shadow transition-all', i === index ? 'w-4' : 'w-1.5 opacity-60')} />
          ))}
        </div>
      ) : null}
    </div>
  );
}
