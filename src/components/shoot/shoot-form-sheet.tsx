'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PlacePicker } from '@/components/place/place-picker';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { createShoot, updateShoot } from '@/lib/shoots/shoot-actions';

export type EditableShoot = { id: string; name: string; shootDate: string | null; placeId: string | null };

/** Bottom sheet to create a shoot (no `shoot`) or edit one: name, date, place. */
export function ShootFormSheet({
  open,
  onOpenChange,
  shoot,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shoot?: EditableShoot;
}) {
  const [name, setName] = useState(shoot?.name ?? '');
  const [date, setDate] = useState(shoot?.shootDate ?? '');
  const [placeId, setPlaceId] = useState<string | null>(shoot?.placeId ?? null);
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const showToast = useToast();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(undefined);
    setSaving(true);
    try {
      const input = { name, shootDate: date || null, placeId };
      if (shoot) {
        await updateShoot(shoot.id, input);
        showToast('Đã lưu buổi chụp.');
        onOpenChange(false);
        router.refresh();
      } else {
        const id = await createShoot(input);
        onOpenChange(false);
        router.push(`/shoots/${id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chưa lưu được, bạn thử lại nha.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={shoot ? 'Sửa buổi chụp' : 'Buổi chụp mới'}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Input label="Tên buổi chụp" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} error={error} autoComplete="off" />
        <Input label="Ngày chụp" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <PlacePicker value={placeId} onChange={setPlaceId} />
        <Button type="submit" loading={saving} loadingLabel="Đang lưu…">
          {shoot ? 'Lưu thay đổi' : 'Tạo buổi chụp'}
        </Button>
      </form>
    </BottomSheet>
  );
}
