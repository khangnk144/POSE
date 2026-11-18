'use client';

import { useEffect, useState } from 'react';
import { CalendarDays, Plus } from 'lucide-react';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser-client';
import { addPosesToShoot } from '@/lib/shoots/shoot-items';

type Shoot = { id: string; name: string; shoot_date: string | null };

/**
 * "Thêm vào buổi chụp" sheet: pick an existing shoot or create a new one, then append the poses.
 * `onDone` fires after a successful add (the library uses it to leave selection mode).
 */
export function AddToShootSheet({
  open,
  onOpenChange,
  poseIds,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  poseIds: string[];
  onDone?: () => void;
}) {
  const showToast = useToast();
  const [shoots, setShoots] = useState<Shoot[] | 'loading' | 'error'>('loading');
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    createSupabaseBrowserClient()
      .from('shoots')
      .select('id,name,shoot_date')
      .order('created_at', { ascending: false })
      .limit(30)
      .then(({ data, error }) => {
        if (!cancelled) setShoots(error ? 'error' : data);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  async function addTo(shootId: string, shootName: string) {
    setBusy(true);
    try {
      const added = await addPosesToShoot(shootId, poseIds);
      showToast(added > 0 ? `Đã thêm ${added} dáng vào "${shootName}"` : 'Các dáng này đã có trong buổi chụp rồi');
      onOpenChange(false);
      onDone?.();
    } catch {
      showToast('Chưa thêm được vào buổi chụp, bạn thử lại nhé', { kind: 'error' });
    } finally {
      setBusy(false);
    }
  }

  async function createAndAdd() {
    const name = newName.trim();
    if (!name) return;
    setBusy(true);
    const { data, error } = await createSupabaseBrowserClient().from('shoots').insert({ name }).select('id,name').single();
    setBusy(false);
    if (error || !data) {
      showToast('Chưa tạo được buổi chụp, bạn thử lại nhé', { kind: 'error' });
      return;
    }
    setNewName('');
    await addTo(data.id, data.name);
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="Thêm vào buổi chụp">
      <div className="flex flex-col gap-4">
        {shoots === 'loading' ? <p className="text-text-2">Đang tải buổi chụp…</p> : null}
        {shoots === 'error' ? <p className="text-danger">Chưa tải được danh sách buổi chụp. Bạn thử lại sau nhé.</p> : null}
        {Array.isArray(shoots) && shoots.length ? (
          <ul className="flex flex-col">
            {shoots.map((shoot) => (
              <li key={shoot.id}>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => addTo(shoot.id, shoot.name)}
                  className="flex min-h-14 w-full items-center gap-3 rounded-md px-3 text-left hover:bg-surface-2 disabled:opacity-50"
                >
                  <CalendarDays className="size-5 shrink-0 text-primary" aria-hidden />
                  <span className="flex-1 font-semibold">{shoot.name}</span>
                  {shoot.shoot_date ? <span className="text-sm text-text-2">{shoot.shoot_date}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {Array.isArray(shoots) && !shoots.length ? <p className="text-text-2">Chưa có buổi chụp nào, tạo một buổi nhé.</p> : null}

        <form
          className="flex flex-col gap-3 border-t border-border pt-4"
          onSubmit={(event) => {
            event.preventDefault();
            void createAndAdd();
          }}
        >
          <Input label="Hoặc tạo buổi mới" placeholder="Ví dụ: Chụp cafe cuối tuần" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={80} />
          <Button type="submit" variant="secondary" disabled={!newName.trim() || busy}>
            <Plus className="size-4" aria-hidden /> Tạo và thêm
          </Button>
        </form>
      </div>
    </BottomSheet>
  );
}
