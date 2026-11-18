import Link from 'next/link';
import { CalendarDays, MapPin } from 'lucide-react';
import { formatShootDate } from '@/lib/shoots/format-date';
import type { ShootListItem } from '@/lib/shoots/shoot-queries';

/** Shoots list row with date, place and progress bar. */
export function ShootCard({ shoot }: { shoot: ShootListItem }) {
  const date = formatShootDate(shoot.shootDate);
  const percent = shoot.itemCount === 0 ? 0 : Math.round((shoot.doneCount / shoot.itemCount) * 100);
  return (
    <li>
      <Link href={`/shoots/${shoot.id}`} className="block rounded-lg border border-border bg-surface p-4">
        <span className="block truncate font-display text-[17px] font-bold">{shoot.name}</span>
        <span className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-text-2">
          {date ? (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-4" aria-hidden /> {date}
            </span>
          ) : null}
          {shoot.placeName ? (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-4 shrink-0" aria-hidden /> <span className="truncate">{shoot.placeName}</span>
            </span>
          ) : null}
        </span>
        <span className="mt-3 flex items-center gap-3">
          <span
            role="progressbar"
            aria-label="Tiến độ chụp"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3"
          >
            <span className="block h-full rounded-full bg-success" style={{ width: `${percent}%` }} />
          </span>
          <span className="text-xs text-text-2">
            {shoot.doneCount}/{shoot.itemCount} dáng
          </span>
        </span>
      </Link>
    </li>
  );
}
