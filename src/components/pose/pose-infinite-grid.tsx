'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { countActiveFilters } from '@/lib/poses/filters-url';
import { listPoseCards } from '@/lib/poses/pose-card-query';
import { useLibraryFilters } from '@/lib/poses/use-library-filters';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import type { PoseCardData, PoseFilters } from '@/lib/types/pose';
import { AddToShootSheet } from '@/components/shoot/add-to-shoot-sheet';
import { PoseCardGrid } from './pose-card-grid';

/** Skeleton cards with different heights so the loading state looks like the masonry. */
export function GridSkeleton() {
  const heights = ['h-56', 'h-72', 'h-64', 'h-48', 'h-60', 'h-72'];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4" aria-hidden>
      {heights.map((height, i) => (
        <Skeleton key={i} className={`${height} rounded-lg`} />
      ))}
    </div>
  );
}

function LibraryEmpty({ filters }: { filters: PoseFilters }) {
  const { apply } = useLibraryFilters();
  const refined = Boolean(filters.q) || countActiveFilters({ ...filters, status: undefined }) > 0;
  if (refined) {
    return (
      <EmptyState
        title="Không tìm thấy dáng nào hợp"
        description="Thử bớt bộ lọc hoặc đổi từ khoá nha."
        action={<Button onClick={() => apply({ status: filters.status })}>Xoá bộ lọc</Button>}
      />
    );
  }
  if (filters.status === 'draft') {
    return <EmptyState illustration="📝" title="Chưa có dáng nháp nào" description="Dáng lưu dạng nháp sẽ nằm ở đây." />;
  }
  return (
    <EmptyState
      title="Chưa có dáng nào"
      description="Thêm dáng đầu tiên để cả team cùng xem nhé."
      action={
        <Link href="/poses/new" className="inline-flex h-12 items-center rounded-full bg-primary px-6 font-semibold text-on-primary">
          Thêm dáng đầu tiên
        </Link>
      }
    />
  );
}

/**
 * Library grid: renders the server-loaded first page, then fetches further pages (same query
 * builder, browser client) when the sentinel scrolls near the viewport. Long-press a card to
 * select several and add them to a shoot.
 */
export function PoseInfiniteGrid({
  filters,
  initialItems,
  initialCursor,
}: {
  filters: PoseFilters;
  initialItems: PoseCardData[];
  initialCursor: string | null;
}) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [selecting, setSelecting] = useState(false);
  const [shootSheet, setShootSheet] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);

  const loadMore = useCallback(async () => {
    if (inFlight.current || !cursor) return;
    inFlight.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const page = await listPoseCards(createSupabaseBrowserClient(), filters, cursor);
      setItems((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...page.items.filter((p) => !seen.has(p.id))];
      });
      setCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, [cursor, filters]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || !cursor || failed) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && void loadMore(), {
      rootMargin: '600px',
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [cursor, failed, loadMore, items.length]);

  function onSelectedChange(poseId: string, value: boolean) {
    setSelecting(true);
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(poseId);
      else next.delete(poseId);
      return next;
    });
  }

  function exitSelection() {
    setSelecting(false);
    setSelected(new Set());
  }

  return (
    <>
      <PoseCardGrid
        poses={items}
        empty={<LibraryEmpty filters={filters} />}
        selection={{ selectable: selecting, selectedIds: selected, onSelectedChange }}
      />
      {cursor ? <div ref={sentinel} aria-hidden className="h-px" /> : null}
      {loading ? <div className="pt-3"><GridSkeleton /></div> : null}
      {failed ? (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
          <p className="text-text-2">Chưa tải thêm được dáng. Bạn thử lại nhé.</p>
          <Button variant="secondary" onClick={() => void loadMore()}>Thử lại</Button>
        </div>
      ) : null}

      {selecting ? (
        <div
          className="fixed inset-x-0 z-[45] flex justify-center px-4"
          style={{ bottom: 'calc(var(--tab-bar-h) + 12px + env(safe-area-inset-bottom))' }}
        >
          <div className="flex w-full max-w-md items-center gap-2 rounded-full bg-surface p-2 shadow-lg ring-1 ring-border">
            <Button variant="text" onClick={exitSelection}>Huỷ</Button>
            <Button className="flex-1" disabled={selected.size === 0} onClick={() => setShootSheet(true)}>
              {selected.size ? `Thêm ${selected.size} dáng vào buổi chụp` : 'Chọn dáng để thêm'}
            </Button>
          </div>
        </div>
      ) : null}
      <AddToShootSheet
        open={shootSheet}
        onOpenChange={setShootSheet}
        poseIds={[...selected]}
        onAdded={exitSelection}
      />
    </>
  );
}
