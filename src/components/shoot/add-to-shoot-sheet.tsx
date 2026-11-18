'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { formatShootDate } from '@/lib/shoots/format-date';
import { createShoot, listShootOptions, type ShootOption } from '@/lib/shoots/shoot-actions';
import { addPosesToShoot } from '@/lib/shoots/shoot-items';

/**
 * Bottom sheet for the library: pick a shoot (or create one by name) and add `poseIds` to it.
 * Mount it where "Thêm vào buổi chụp" is triggered and pass the selected pose ids.
 */
export function AddToShootSheet({
  open,
  onOpenChange,
  poseIds,
  onAdded,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poseIds: string[];
  onAdded?: (shootId: string, added: number) => void;
}) {
  const [shoots, setShoots] = useState<ShootOption[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const showToast = useToast();

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listShootOptions()
      .then((s) => !cancelled && (setShoots(s), setLoadError(false)))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function addTo(shootId: string, shootName: string) {
    setBusy(true);
    try {
      const added = await addPosesToShoot(shootId, poseIds);
      showToast(added === 0 ? `Các dáng này đã có trong "${shootName}".` : `Đã thêm ${added} dáng vào "${shootName}".`);
      onAdded?.(shootId, added);
      onOpenChange(false);
    } catch {
      showToast('Chưa thêm được, bạn thử lại nha.', { kind: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd(e: React.FormEvent) {
    e.preventDefault();
    e.stopPropagation();
    setBusy(true);
    try {
      const id = await createShoot({ name: newName });
      await addTo(id, newName.trim());
      setNewName('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Chưa tạo được buổi chụp.', { kind: 'error' });
      setBusy(false);
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Thêm vào buổi chụp">
      <div className="flex flex-col gap-4">
        {loadError ? (
          <p role="alert" className="text-sm text-danger">
            Chưa tải được danh sách buổi chụp.
          </p>
        ) : null}
        <ul className="flex flex-col">
          {(shoots ?? []).map((s) => (
            <li key={s.id}>
              <button
                type="button"
                disabled={busy}
                onClick={() => void addTo(s.id, s.name)}
                className="flex min-h-14 w-full flex-col justify-center rounded-sm px-2 text-left hover:bg-surface-2 disabled:opacity-50"
              >
                <span className="truncate font-medium">{s.name}</span>
                {formatShootDate(s.shootDate) ? <span className="text-sm text-text-2">{formatShootDate(s.shootDate)}</span> : null}
              </button>
            </li>
          ))}
        </ul>
        {shoots && shoots.length === 0 ? <p className="text-center text-sm text-text-2">Chưa có buổi chụp nào.</p> : null}
        <form onSubmit={createAndAdd} className="flex flex-col gap-3 border-t border-border pt-4" noValidate>
          <Input label="Hoặc tạo buổi chụp mới" value={newName} maxLength={120} onChange={(e) => setNewName(e.target.value)} autoComplete="off" />
          <Button type="submit" variant="secondary" disabled={busy || newName.trim() === ''}>
            <Plus className="size-5" aria-hidden /> Tạo và thêm
          </Button>
        </form>
      </div>
    </BottomSheet>
  );
}
