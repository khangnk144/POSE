'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/**
 * Big pill that opens the camera (`capture`) or the photo picker. When `disabled` it renders a
 * real disabled button (faded, aria-disabled) instead of the file input, so nothing can be tapped.
 */
export function PhotoPickButton({
  label,
  icon: Icon,
  capture,
  variant,
  disabled,
  onPick,
}: {
  label: string;
  icon: LucideIcon;
  capture?: boolean;
  variant: 'primary' | 'secondary';
  disabled: boolean;
  onPick: (file: File) => void;
}) {
  const classes = cn(
    'inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-6 text-[16px] font-semibold',
    variant === 'primary'
      ? 'bg-primary text-on-primary'
      : 'border-[1.5px] border-border-strong bg-surface text-text',
  );

  if (disabled) {
    return (
      <button type="button" disabled aria-disabled="true" className={cn(classes, 'pointer-events-none opacity-50')}>
        <Icon className="size-5" aria-hidden />
        {label}
      </button>
    );
  }

  return (
    <label className={cn(classes, 'cursor-pointer focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-primary')}>
      <Icon className="size-5" aria-hidden />
      {label}
      <input
        type="file"
        accept="image/*"
        capture={capture ? 'environment' : undefined}
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ''; // allow picking the same photo again
          if (file) onPick(file);
        }}
      />
    </label>
  );
}
