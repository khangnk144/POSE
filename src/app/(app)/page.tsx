import type { Metadata } from 'next';
import { EmptyState } from '@/components/ui/empty-state';
import { LibraryToolbar } from '@/components/pose/library-toolbar';
import { PoseInfiniteGrid } from '@/components/pose/pose-infinite-grid';
import { parseFilters, serializeFilters } from '@/lib/poses/filters-url';
import { listPoseCards, type PoseCardPage } from '@/lib/poses/pose-card-query';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export const metadata: Metadata = { title: 'Thư viện dáng' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Library home. `?fav=1` and `?status=draft` (avatar menu links) reuse the same page. */
export default async function LibraryPage({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const title = filters.favoritesOnly ? 'Dáng yêu thích' : filters.status === 'draft' ? 'Dáng nháp' : 'Thư viện dáng';

  let page: PoseCardPage | null = null;
  try {
    page = await listPoseCards(await createSupabaseServerClient(), filters);
  } catch (error) {
    console.error('library: load failed', error);
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="font-display text-[22px] font-bold leading-[30px]">{title}</h1>
      <LibraryToolbar filters={filters} />
      {page ? (
        <PoseInfiniteGrid
          key={serializeFilters(filters).toString()}
          filters={filters}
          initialItems={page.items}
          initialCursor={page.nextCursor}
        />
      ) : (
        <EmptyState
          illustration="📡"
          title="Chưa tải được thư viện"
          description="Có vẻ mạng đang chập chờn. Bạn kéo tải lại trang nhé."
        />
      )}
    </div>
  );
}
