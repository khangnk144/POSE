'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Link2, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { IconButton } from '@/components/ui/icon-button';
import { useToast } from '@/components/ui/toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { AddToShootSheet } from '@/components/shoot/add-to-shoot-sheet';
import { PoseHeartButton } from './pose-heart-button';

type Props = {
  poseId: string;
  title: string;
  isFavorite: boolean;
  /** Creator or admin: the only people RLS lets delete a pose. */
  canDelete: boolean;
  /** Storage objects removed together with the pose. */
  storagePaths: string[];
};

/** Back / heart / "⋯" buttons floating on the photo. */
export function PoseDetailTopBar({ poseId, title, isFavorite, canDelete, storagePaths }: Props) {
  const router = useRouter();
  const showToast = useToast();
  const [menu, setMenu] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  const item = 'flex min-h-14 w-full items-center gap-3 rounded-md px-3 text-left text-[15px] font-semibold hover:bg-surface-2';

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title, url });
      else {
        await navigator.clipboard.writeText(url);
        showToast('Đã chép link dáng');
      }
      setMenu(false);
    } catch (error) {
      // Dismissing the native share sheet is not an error.
      if (error instanceof DOMException && error.name === 'AbortError') return;
      showToast('Chưa chia sẻ được, bạn thử lại nhé', { kind: 'error' });
    }
  }

  async function remove() {
    setBusy(true);
    const supabase = createSupabaseBrowserClient();
    const { data, error } = await supabase.from('poses').delete().eq('id', poseId).select('id');
    if (error || !data?.length) {
      setBusy(false);
      showToast('Chưa xoá được dáng này. Chỉ người đăng hoặc trưởng nhóm mới xoá được nha.', { kind: 'error' });
      return;
    }
    // Image rows are gone with the pose; the files are cleaned up best-effort.
    if (storagePaths.length) await supabase.storage.from('pose-images').remove(storagePaths);
    showToast('Đã xoá dáng');
    router.replace('/');
    router.refresh();
  }

  return (
    <>
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between p-1">
        <IconButton label="Quay lại" tone="overlay" className="bg-scrim/50" onClick={() => (window.history.length > 1 ? router.back() : router.push('/'))}>
          <ArrowLeft className="size-5" aria-hidden />
        </IconButton>
        <div className="flex gap-1">
          <PoseHeartButton poseId={poseId} initialFavorite={isFavorite} className="bg-scrim/50" />
          <IconButton label="Thêm tuỳ chọn" tone="overlay" className="bg-scrim/50" onClick={() => setMenu(true)}>
            <MoreHorizontal className="size-5" aria-hidden />
          </IconButton>
        </div>
      </div>

      <BottomSheet open={menu} onOpenChange={(open) => { setMenu(open); if (!open) setConfirming(false); }} title={confirming ? 'Xoá dáng này?' : 'Tuỳ chọn'}>
        {confirming ? (
          <div className="flex flex-col gap-4">
            <p className="text-text-2">Dáng &quot;{title}&quot; sẽ biến mất khỏi thư viện của cả team và không khôi phục được.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={busy} onClick={() => setConfirming(false)}>Giữ lại</Button>
              <Button variant="danger" className="flex-1" loading={busy} loadingLabel="Đang xoá…" onClick={remove}>Xoá dáng</Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            <Link href={`/poses/${poseId}/edit`} className={item}>
              <Pencil className="size-5 text-text-2" aria-hidden /> Sửa dáng
            </Link>
            <button type="button" className={item} onClick={share}>
              <Link2 className="size-5 text-text-2" aria-hidden /> Chia sẻ link
            </button>
            {canDelete ? (
              <button type="button" className={`${item} text-danger`} onClick={() => setConfirming(true)}>
                <Trash2 className="size-5" aria-hidden /> Xoá dáng
              </button>
            ) : null}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

/** Sticky bottom bar: favorite + "Thêm vào buổi chụp". Sits above the tab bar and the FAB. */
export function PoseDetailBottomBar({ poseId, isFavorite }: { poseId: string; isFavorite: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="fixed inset-x-0 z-[45] border-t border-border bg-bg/95 px-4 py-2 backdrop-blur"
        style={{ bottom: 'calc(var(--tab-bar-h) + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <PoseHeartButton poseId={poseId} initialFavorite={isFavorite} tone="plain" className="size-12 border-[1.5px] border-border-strong" />
          <Button className="flex-1" onClick={() => setOpen(true)}>Thêm vào buổi chụp</Button>
        </div>
      </div>
      <AddToShootSheet open={open} onOpenChange={setOpen} poseIds={[poseId]} />
    </>
  );
}
