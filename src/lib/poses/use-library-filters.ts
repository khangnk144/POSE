'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { PoseFilters } from '@/lib/types/pose';
import { serializeFilters } from './filters-url';

/**
 * Writes filters into the URL (shareable link). The server page re-reads the search params and
 * renders the first page again; `pending` is true while that navigation is in flight.
 */
export function useLibraryFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const apply = useCallback(
    (next: PoseFilters) => {
      const query = serializeFilters(next).toString();
      startTransition(() => router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false }));
    },
    [pathname, router],
  );

  return { apply, pending };
}
