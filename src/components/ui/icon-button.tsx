import { cn } from '@/lib/utils/cn';

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required Vietnamese accessible name, e.g. "Mở menu". */
  label: string;
  /** `overlay` is for buttons placed on top of photos. */
  tone?: 'plain' | 'overlay';
};

/** Icon-only button with a 44x44px touch target. */
export function IconButton({ label, tone = 'plain', className, children, type = 'button', ...rest }: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-full',
        'transition-transform duration-[var(--dur-fast)] active:scale-95 disabled:opacity-50',
        tone === 'overlay' ? 'text-white drop-shadow' : 'text-text hover:bg-surface-3',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
