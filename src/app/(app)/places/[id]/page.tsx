import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { PlaceDetailActions } from '@/components/place/place-detail-actions';
import { PlacePoseGrid } from '@/components/place/place-pose-grid';
import { getPlace } from '@/lib/places/place-queries';
import { listPoseCards, type PoseCardPage } from '@/lib/poses/pose-card-query';
import { createSupabaseServerClient } from '@/lib/supabase/server-client';
import { requireMember } from '@/lib/supabase/session';

export const metadata: Metadata = { title: 'Chi tiết địa điểm' };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const me = await requireMember();
  const supabase = await createSupabaseServerClient();
  const place = await getPlace(supabase, id);
  if (!place) notFound();

  // The card query belongs to the library module; if it fails the page still shows the place itself.
  let page: PoseCardPage = { items: [], nextCursor: null };
  let gridFailed = false;
  try {
    page = await listPoseCards(supabase, { placeId: id, status: 'published' });
  } catch {
    gridFailed = true;
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/places" className="inline-flex min-h-11 items-center gap-1 self-start text-text-2">
        <ChevronLeft className="size-5" aria-hidden /> Địa điểm
      </Link>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[22px] font-bold leading-[30px]">{place.name}</h1>
        {place.address ? <p className="text-text-2">{place.address}</p> : null}
        {place.note ? <p className="text-sm text-text-2">{place.note}</p> : null}
      </div>
      <PlaceDetailActions
        place={{ id: place.id, name: place.name, address: place.address, mapsUrl: place.maps_url, note: place.note }}
        canDelete={me.role === 'admin' || me.id === place.created_by}
      />
      {gridFailed ? (
        <p role="alert" className="py-8 text-center text-text-2">
          Chưa tải được các dáng ở đây. Bạn tải lại trang nha.
        </p>
      ) : (
        <PlacePoseGrid placeId={id} initialPoses={page.items} initialCursor={page.nextCursor} />
      )}
    </div>
  );
}
