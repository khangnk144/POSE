'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { buildMapsUrl } from '@/lib/places/maps-link';
import { deletePlace } from '@/lib/places/place-actions';
import { PlaceFormSheet, type EditablePlace } from './place-form-sheet';

/** Open in Maps, edit, and delete (delete shown to the creator or an admin; RLS enforces it too). */
export function PlaceDetailActions({ place, canDelete }: { place: EditablePlace; canDelete: boolean }) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const showToast = useToast();

  async function remove() {
    if (!window.confirm(`Xoá "${place.name}"? Các dáng ở đây sẽ không còn gắn địa điểm.`)) return;
    setDeleting(true);
    try {
      await deletePlace(place.id);
      showToast('Đã xoá địa điểm.');
      router.replace('/places');
      router.refresh();
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Chưa xoá được.', { kind: 'error' });
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href={buildMapsUrl({ name: place.name, address: place.address, mapsUrl: place.mapsUrl })}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-on-primary"
      >
        <ExternalLink className="size-4" aria-hidden /> Mở Google Maps
      </a>
      <Button variant="secondary" className="min-h-11 px-4" onClick={() => setEditing(true)}>
        <Pencil className="size-4" aria-hidden /> Sửa
      </Button>
      {canDelete ? (
        <Button variant="secondary" className="min-h-11 px-4 text-danger" onClick={remove} loading={deleting} loadingLabel="Đang xoá…">
          <Trash2 className="size-4" aria-hidden /> Xoá
        </Button>
      ) : null}
      {editing ? <PlaceFormSheet open={editing} onOpenChange={setEditing} place={place} /> : null}
    </div>
  );
}
