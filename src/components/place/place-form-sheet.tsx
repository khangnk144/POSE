'use client';

import { useRouter } from 'next/navigation';
import { BottomSheet } from '@/components/ui/bottom-sheet';
import { useToast } from '@/components/ui/toast';
import { createPlace, updatePlace } from '@/lib/places/place-actions';
import { PlaceForm } from './place-form';

export type EditablePlace = { id: string; name: string; address: string | null; mapsUrl: string | null; note: string | null };

/** Bottom sheet to create a place (no `place`) or edit one. Refreshes the page data on success. */
export function PlaceFormSheet({
  open,
  onOpenChange,
  place,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  place?: EditablePlace;
}) {
  const router = useRouter();
  const showToast = useToast();

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={place ? 'Sửa địa điểm' : 'Thêm địa điểm'}>
      <PlaceForm
        submitLabel={place ? 'Lưu thay đổi' : 'Thêm địa điểm'}
        initial={
          place
            ? { name: place.name, address: place.address ?? '', mapsUrl: place.mapsUrl ?? '', note: place.note ?? '' }
            : undefined
        }
        onSubmit={async (input) => {
          if (place) await updatePlace(place.id, input);
          else await createPlace(input);
          showToast(place ? 'Đã lưu địa điểm.' : 'Đã thêm địa điểm.');
          onOpenChange(false);
          router.refresh();
        }}
      />
    </BottomSheet>
  );
}
