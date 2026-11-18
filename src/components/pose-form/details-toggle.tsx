'use client';

import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export const DETAILS_PANEL_ID = 'pose-details';
export const DETAILS_TOGGLE_ID = 'pose-details-toggle';

/** Subtitle under "Thêm chi tiết", depending on what is going on. */
function subtitleFor(open: boolean, count: number, aiRunning: boolean, aiFilled: number): { text: string; ai: boolean } {
  if (aiRunning) return { text: 'AI đang điền giúp…', ai: true };
  if (aiFilled > 0) return { text: `✨ AI đã điền ${aiFilled} mục, bạn xem lại nhé`, ai: true };
  if (open) return { text: 'Không bắt buộc', ai: false };
  if (count > 0) return { text: `Đã điền ${count} mục · chạm để xem`, ai: false };
  return { text: 'Không bắt buộc · cách cầm máy, các bước, địa điểm…', ai: false };
}

/** Full-width button that opens/closes the optional details (min 64px tall). */
export function DetailsToggle({
  open,
  onToggle,
  filledCount,
  aiRunning,
  aiFilled,
}: {
  open: boolean;
  onToggle: () => void;
  /** Detail fields that currently hold a value. */
  filledCount: number;
  aiRunning: boolean;
  /** Detail fields the AI filled in its last answer (0 once the user starts editing). */
  aiFilled: number;
}) {
  const sub = subtitleFor(open, filledCount, aiRunning, aiFilled);
  return (
    <button
      type="button"
      id={DETAILS_TOGGLE_ID}
      aria-expanded={open}
      aria-controls={DETAILS_PANEL_ID}
      onClick={onToggle}
      className="flex min-h-16 w-full scroll-mt-[68px] items-center justify-between gap-3 rounded-md border border-border-strong bg-surface px-4 py-3 text-left"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-[15px] font-semibold text-text">Thêm chi tiết</span>
        <span className={cn('text-[13px] leading-[18px]', sub.ai ? 'text-ai' : 'text-text-2')}>{sub.text}</span>
      </span>
      {aiRunning ? (
        <Loader2 className="size-5 shrink-0 animate-spin text-ai" aria-hidden />
      ) : (
        <ChevronDown
          className={cn('size-5 shrink-0 text-text-2 transition-transform duration-[var(--dur-base)]', open && 'rotate-180')}
          aria-hidden
        />
      )}
    </button>
  );
}
