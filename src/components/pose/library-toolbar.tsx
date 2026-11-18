'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { FilterChip } from '@/components/ui/chip';
import { countActiveFilters } from '@/lib/poses/filters-url';
import { useLibraryFilters } from '@/lib/poses/use-library-filters';
import { PEOPLE_COUNTS, type PoseFilters } from '@/lib/types/pose';
import { PEOPLE_COUNT_LABELS, SCENE_LABELS } from '@/lib/types/pose-labels';
import { PoseFilterSheet } from './pose-filter-sheet';

const SEARCH_DEBOUNCE_MS = 250;
const QUICK_SCENES = ['cafe', 'sofa', 'stairs', 'street'] as const;

/** Search box, filter button (with active-filter badge) and the quick filter chip row. */
export function LibraryToolbar({ filters }: { filters: PoseFilters }) {
  const { apply, pending } = useLibraryFilters();
  const [text, setText] = useState(filters.q ?? '');
  const [sheetOpen, setSheetOpen] = useState(false);
  const lastApplied = useRef(filters.q ?? '');
  const inputRef = useRef<HTMLInputElement>(null);
  // Bumped on every open so the sheet starts from the applied filters.
  const [sheetSession, setSheetSession] = useState(0);

  // Debounced search -> URL.
  useEffect(() => {
    const trimmed = text.trim();
    if (trimmed === (filters.q ?? '')) return;
    const timer = setTimeout(() => {
      lastApplied.current = trimmed;
      apply({ ...filters, q: trimmed || undefined });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [text, filters, apply]);

  // Back/forward navigation changes q from outside; our own writes must not clobber typing.
  useEffect(() => {
    const incoming = filters.q ?? '';
    // While the box has focus the user is typing: a slower, older response must not overwrite it.
    if (incoming !== lastApplied.current && document.activeElement !== inputRef.current) {
      lastApplied.current = incoming;
      setText(incoming);
    }
  }, [filters.q]);

  // The draft view (status=draft) is a page, not a filter, so it does not count toward the badge.
  const activeCount = countActiveFilters({ ...filters, status: undefined });
  const toggleIn = <K extends 'people' | 'scenes'>(key: K, value: string) => {
    const list = (filters[key] as string[] | undefined) ?? [];
    const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
    apply({ ...filters, [key]: next.length ? next : undefined });
  };

  return (
    <div className="flex flex-col gap-1" aria-busy={pending}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-text-2" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            enterKeyHint="search"
            aria-label="Tìm dáng"
            placeholder="Tìm dáng…"
            value={text}
            onChange={(event) => setText(event.target.value)}
            className="h-12 w-full rounded-full border border-border-strong bg-surface pr-11 pl-11 text-base text-text placeholder:text-text-3 [&::-webkit-search-cancel-button]:hidden"
          />
          {text ? (
            <button
              type="button"
              aria-label="Xoá từ khoá"
              onClick={() => setText('')}
              className="absolute top-1/2 right-0.5 flex size-11 -translate-y-1/2 items-center justify-center text-text-2"
            >
              <X className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => {
            setSheetSession((n) => n + 1);
            setSheetOpen(true);
          }}
          className="relative inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-border-strong bg-surface px-4 text-[15px] font-semibold"
        >
          <SlidersHorizontal className="size-[18px]" aria-hidden />
          Bộ lọc
          {activeCount ? (
            <span className="inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs text-on-primary">
              {activeCount}
              <span className="sr-only"> bộ lọc đang bật</span>
            </span>
          ) : null}
        </button>
      </div>

      <div role="group" aria-label="Lọc nhanh" className="-mx-4 flex overflow-x-auto px-4 md:mx-0 md:px-0 [scrollbar-width:none]">
        <div className="flex gap-x-2 whitespace-nowrap">
          <FilterChip selected={filters.favoritesOnly ?? false} onToggle={() => apply({ ...filters, favoritesOnly: filters.favoritesOnly ? undefined : true })}>
            Yêu thích
          </FilterChip>
          {PEOPLE_COUNTS.map((value) => (
            <FilterChip key={value} selected={filters.people?.includes(value) ?? false} onToggle={() => toggleIn('people', value)}>
              {PEOPLE_COUNT_LABELS[value]}
            </FilterChip>
          ))}
          {QUICK_SCENES.map((value) => (
            <FilterChip key={value} selected={filters.scenes?.includes(value) ?? false} onToggle={() => toggleIn('scenes', value)}>
              {SCENE_LABELS[value]}
            </FilterChip>
          ))}
        </div>
      </div>

      <PoseFilterSheet key={sheetSession} open={sheetOpen} onOpenChange={setSheetOpen} filters={filters} onApply={apply} />
    </div>
  );
}
