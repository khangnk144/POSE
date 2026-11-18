'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Camera, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { useToast } from '@/components/ui/toast';
import { moveItem } from '@/lib/shoots/reorder';
import { deleteShoot } from '@/lib/shoots/shoot-actions';
import { removeShootItem, saveShootOrder, setItemDone } from '@/lib/shoots/shoot-items';
import type { ShootDetail } from '@/lib/shoots/shoot-queries';
import { formatShootDate } from '@/lib/shoots/format-date';
import { ShootFormSheet } from './shoot-form-sheet';
import { ShootItemRow } from './shoot-item-row';
import { ShootingMode } from './shooting-mode';

/** Shot list of one shoot: drag to reorder, tick done, remove, delete the shoot, open shooting mode. */
export function ShootDetailView({ shoot, canDelete }: { shoot: ShootDetail; canDelete: boolean }) {
  const [items, setItems] = useState(shoot.items);
  const [editing, setEditing] = useState(false);
  const [shootingFrom, setShootingFrom] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const showToast = useToast();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const doneCount = items.filter((i) => i.done).length;

  async function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const before = items.map((i) => i.poseId);
    const from = before.indexOf(String(active.id));
    const to = before.indexOf(String(over.id));
    if (from < 0 || to < 0) return;
    const nextItems = moveItem(items, from, to);
    setItems(nextItems);
    try {
      await saveShootOrder(shoot.id, before, nextItems.map((i) => i.poseId));
    } catch {
      setItems(items);
      showToast('Chưa lưu được thứ tự, bạn thử lại nha.', { kind: 'error' });
    }
  }

  async function toggleDone(poseId: string) {
    const current = items.find((i) => i.poseId === poseId);
    if (!current) return;
    const done = !current.done;
    setItems((prev) => prev.map((i) => (i.poseId === poseId ? { ...i, done } : i)));
    try {
      await setItemDone(shoot.id, poseId, done);
    } catch {
      setItems((prev) => prev.map((i) => (i.poseId === poseId ? { ...i, done: !done } : i)));
      showToast('Chưa lưu được, bạn thử lại nha.', { kind: 'error' });
    }
  }

  async function removeItem(poseId: string, title: string) {
    if (!window.confirm(`Bỏ "${title}" khỏi buổi chụp?`)) return;
    try {
      await removeShootItem(shoot.id, poseId);
      setItems((prev) => prev.filter((i) => i.poseId !== poseId));
    } catch {
      showToast('Chưa bỏ được dáng này.', { kind: 'error' });
    }
  }

  async function removeShoot() {
    if (!window.confirm(`Xoá buổi chụp "${shoot.name}"?`)) return;
    setDeleting(true);
    try {
      await deleteShoot(shoot.id);
      showToast('Đã xoá buổi chụp.');
      router.replace('/shoots');
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Chưa xoá được.', { kind: 'error' });
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-[22px] font-bold leading-[30px]">{shoot.name}</h1>
        <p className="text-sm text-text-2">
          {[formatShootDate(shoot.shootDate), `${doneCount}/${items.length} dáng đã chụp`].filter(Boolean).join(' · ')}
        </p>
        {shoot.placeId && shoot.placeName ? (
          <Link href={`/places/${shoot.placeId}`} className="inline-flex min-h-11 items-center gap-1.5 self-start text-primary">
            <MapPin className="size-4" aria-hidden /> {shoot.placeName}
          </Link>
        ) : null}
      </header>

      <div className="flex flex-wrap gap-2">
        <Button className="min-h-11 px-5" disabled={items.length === 0} onClick={() => setShootingFrom(Math.max(0, items.findIndex((i) => !i.done)))}>
          <Camera className="size-5" aria-hidden /> Bắt đầu chụp
        </Button>
        <Button variant="secondary" className="min-h-11 px-4" onClick={() => setEditing(true)}>
          <Pencil className="size-4" aria-hidden /> Sửa
        </Button>
        {canDelete ? (
          <Button variant="secondary" className="min-h-11 px-4 text-danger" onClick={removeShoot} loading={deleting} loadingLabel="Đang xoá…">
            <Trash2 className="size-4" aria-hidden /> Xoá
          </Button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <EmptyState
          illustration="🎞️"
          title="Chưa có dáng nào"
          description="Mở một dáng trong thư viện rồi chọn “Thêm vào buổi chụp”."
          action={
            <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-primary">
              Đến thư viện
            </Link>
          }
        />
      ) : (
        <DndContext id="shoot-items-sortable" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.poseId)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-2" aria-label="Danh sách dáng cần chụp">
              {items.map((item) => (
                <ShootItemRow
                  key={item.poseId}
                  item={item}
                  onToggleDone={() => void toggleDone(item.poseId)}
                  onRemove={() => void removeItem(item.poseId, item.title)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {editing ? <ShootFormSheet open={editing} onOpenChange={setEditing} shoot={shoot} /> : null}
      {shootingFrom !== null ? (
        <ShootingMode
          items={items}
          startIndex={shootingFrom}
          onClose={() => setShootingFrom(null)}
          onToggleDone={(id) => void toggleDone(id)}
        />
      ) : null}
    </div>
  );
}
