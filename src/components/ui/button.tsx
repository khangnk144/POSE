import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'danger' | 'ai';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary-hover',
  secondary: 'bg-surface text-text border-[1.5px] border-border-strong',
  text: 'bg-transparent text-primary min-h-11 px-3',
  danger: 'bg-danger text-on-danger',
  ai: 'bg-ai-soft text-ai border border-ai',
};

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  /** Shows a spinner and blocks clicks; keeps the width. */
  loading?: boolean;
  /** Text shown instead of the children while loading, e.g. "Đang lưu…". */
  loadingLabel?: string;
};

/** Pill button, 48px tall (44px for `text`). */
export function Button({
  variant = 'primary',
  loading = false,
  loadingLabel,
  className,
  children,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold',
        'min-h-12 px-6 text-[15px] transition-[transform,background-color] duration-[var(--dur-fast)]',
        'active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <Loader2 className="size-5 animate-spin" aria-hidden /> : null}
      {loading && loadingLabel ? loadingLabel : children}
    </button>
  );
}
