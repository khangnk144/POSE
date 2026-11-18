import { cn } from '@/lib/utils/cn';

/** Shimmering placeholder block. Pass sizing and radius via className. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn('skeleton rounded-md', className)} />;
}
