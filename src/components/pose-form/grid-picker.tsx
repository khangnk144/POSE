'use client';

import { useRef } from 'react';
import { FilterChip } from '@/components/ui/chip';
import type { PoseGrid } from '@/lib/types/pose';

const STEP = 0.05;
const clamp = (n: number) => Math.min(1, Math.max(0, Math.round(n * 100) / 100));

/**
 * Tap the cover photo to drop a dot where the subject should sit on the rule-of-thirds
 * grid. Arrow keys nudge the dot; Enter/Space puts it in the centre.
 */
export function GridPicker({
  coverUrl,
  value,
  onChange,
}: {
  coverUrl: string | null;
  value: PoseGrid | undefined;
  onChange: (grid: PoseGrid | undefined) => void;
}) {
  const box = useRef<HTMLDivElement>(null);

  if (!coverUrl) {
    return <p className="text-sm text-text-2">Thêm ảnh bìa trước để chấm vị trí chủ thể trên lưới 3×3.</p>;
  }

  const horizon = value?.horizon ?? null;
  const place = (x: number, y: number) => onChange({ x: clamp(x), y: clamp(y), horizon });

  const onPointer = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = box.current?.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;
    place((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
  };

  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const cur = value ?? { x: 0.5, y: 0.5 };
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-STEP, 0],
      ArrowRight: [STEP, 0],
      ArrowUp: [0, -STEP],
      ArrowDown: [0, STEP],
    };
    if (moves[e.key]) {
      e.preventDefault();
      place(cur.x + moves[e.key][0], cur.y + moves[e.key][1]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      place(value?.x ?? 0.5, value?.y ?? 0.5);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-medium text-text">Vị trí chủ thể trên lưới</span>
      <div
        ref={box}
        role="application"
        tabIndex={0}
        aria-label={
          value
            ? `Chủ thể ở ${Math.round(value.x * 100)}% ngang, ${Math.round(value.y * 100)}% dọc. Dùng phím mũi tên để dời`
            : 'Chạm vào ảnh để đặt vị trí chủ thể. Dùng phím mũi tên để đặt'
        }
        onClick={onPointer}
        onKeyDown={onKey}
        className="relative mx-auto aspect-[3/4] w-full max-w-[280px] cursor-crosshair overflow-hidden rounded-md border border-border bg-surface-3"
        data-testid="grid-picker"
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- blob/signed URL, already resized */}
        <img src={coverUrl} alt="" className="pointer-events-none size-full object-cover" draggable={false} />
        <div aria-hidden className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }, (_, i) => (
            <span key={i} className="border border-white/60" />
          ))}
        </div>
        {value ? (
          <span
            aria-hidden
            className="pointer-events-none absolute size-6 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white bg-primary shadow"
            style={{ left: `${value.x * 100}%`, top: `${value.y * 100}%` }}
          />
        ) : null}
      </div>
      {value ? (
        <div className="flex flex-wrap items-center gap-x-2">
          <FilterChip
            selected={horizon === 'lower'}
            onToggle={() => onChange({ ...value, horizon: horizon === 'lower' ? null : 'lower' })}
          >
            Đường chân trời thấp
          </FilterChip>
          <button type="button" onClick={() => onChange(undefined)} className="min-h-11 px-3 font-semibold text-primary">
            Xoá chấm
          </button>
        </div>
      ) : null}
    </div>
  );
}
