import type { Metadata } from 'next';
import { AddPlaceButton } from '@/components/place/add-place-button';
import { PlaceCard } from '@/components/place/place-card';
import { EmptyState } from '@/components/ui/empty-state';
import { listPlaces } from '@/lib/places/place-queries';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';

export const metadata: Metadata = { title: 'Địa điểm' };

export default async function PlacesPage() {
  const supabase = await createSupabaseServerClient();
  const places = await listPlaces(supabase);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[22px] font-bold leading-[30px]">Địa điểm</h1>
        <AddPlaceButton />
      </div>
      {places.length === 0 ? (
        <EmptyState
          illustration="📍"
          title="Chưa có địa điểm nào"
          description="Lưu những chỗ chụp đẹp để lần sau biết nên chụp dáng nào ở đâu."
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {places.map((p) => (
            <PlaceCard key={p.id} place={p} />
          ))}
        </ul>
      )}
    </div>
  );
}
