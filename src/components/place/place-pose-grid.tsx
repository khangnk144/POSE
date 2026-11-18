'use client';

import Link from 'next/link';
import { Component, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PoseCardGrid } from '@/components/pose/pose-card-grid';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { listPoseCards } from '@/lib/poses/pose-card-query';
import type { PoseCardData } from '@/lib/types/pose';

/** Keeps the place page usable if the shared pose grid fails to render. */
class GridBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) {
      return <p role="alert" className="py-8 text-center text-text-2">Chưa hiển thị được các dáng ở đây. Bạn tải lại trang nha.</p>;
    }
    return this.props.children;
  }
}

/** Poses at one place: first page from the server, "Xem thêm" loads the next pages in the browser. */
export function PlacePoseGrid({
  placeId,
  initialPoses,
  initialCursor,
}: {
  placeId: string;
  initialPoses: PoseCardData[];
  initialCursor: string | null;
}) {
  const [poses, setPoses] = useState(initialPoses);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadMore() {
    setLoading(true);
    setError(false);
    try {
      const page = await listPoseCards(createSupabaseBrowserClient(), { placeId, status: 'published' }, cursor);
      setPoses((prev) => [...prev, ...page.items]);
      setCursor(page.nextCursor);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <GridBoundary>
        <PoseCardGrid
          poses={poses}
          empty={
            <p className="py-8 text-center text-text-2">
              Chưa có dáng nào ở đây.{' '}
              <Link href="/poses/new" className="font-semibold text-primary">
                Thêm dáng
              </Link>
            </p>
          }
        />
      </GridBoundary>
      {error ? (
        <p role="alert" className="text-center text-sm text-danger">
          Chưa tải thêm được, bạn thử lại nha.
        </p>
      ) : null}
      {cursor ? (
        <Button variant="secondary" onClick={loadMore} loading={loading} loadingLabel="Đang tải…" className="self-center">
          Xem thêm
        </Button>
      ) : null}
    </div>
  );
}
