import Link from 'next/link';
import { ExternalLink, ImageOff } from 'lucide-react';
import { buildMapsUrl } from '@/lib/places/maps-link';
import type { PlaceListItem } from '@/lib/places/place-queries';

/** Places list row: cover from the newest pose, name, address, pose count and an "open in Maps" link. */
export function PlaceCard({ place }: { place: PlaceListItem }) {
  const mapsHref = buildMapsUrl({ name: place.name, address: place.address, mapsUrl: place.mapsUrl });
  return (
    <li className="flex items-stretch overflow-hidden rounded-lg border border-border bg-surface">
      <Link href={`/places/${place.id}`} className="flex min-w-0 flex-1 items-center gap-3 p-3">
        <span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-3 text-text-3">
          {place.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed storage URL, not a static asset
            <img src={place.coverUrl} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <ImageOff className="size-6" aria-hidden />
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-[16px] font-bold">{place.name}</span>
          {place.address ? <span className="block truncate text-sm text-text-2">{place.address}</span> : null}
          <span className="block text-xs text-text-3">{place.poseCount} dáng</span>
        </span>
      </Link>
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Mở ${place.name} trong Google Maps`}
        className="flex w-14 shrink-0 items-center justify-center border-l border-border text-primary hover:bg-surface-2"
      >
        <ExternalLink className="size-5" aria-hidden />
      </a>
    </li>
  );
}
