import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

/** Read-only camera spec chip (e.g. "Ngang hông", "1x"). `tone="zoom"` highlights zoom values; `"todo"` is the dashed "Thiếu thông số" reminder. */
export function CameraChip({
  children,
  icon,
  tone = 'neutral',
}: {
  children: React.ReactNode;
  icon?: React.ReactNode;
  tone?: 'neutral' | 'zoom' | 'todo';
}) {
  return (
    <span
      className={cn(
        'inline-flex h-[26px] items-center gap-1 rounded-full px-2 text-[13px] font-medium',
        tone === 'zoom' && 'bg-info-soft text-info',
        tone === 'neutral' && 'bg-surface-3 text-text',
        // Gentle reminder, not an error: dashed outline, no danger colour.
        tone === 'todo' && 'border border-dashed border-border-strong text-text-2',
      )}
    >
      {icon}
      {children}
    </span>
  );
}

/**
 * Selectable chip for filters and forms. The visible chip is 36px; padding makes the
 * touch target 44px. Use `mode="radio"` for single choice, `"checkbox"` for multiple.
 */
export function FilterChip({
  selected,
  onToggle,
  mode = 'checkbox',
  children,
}: {
  selected: boolean;
  onToggle: () => void;
  mode?: 'checkbox' | 'radio';
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role={mode}
      aria-checked={selected}
      onClick={onToggle}
      className="inline-flex min-h-11 items-center py-1"
    >
      <span
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-full px-3.5 text-[13px] font-medium',
          selected
            ? 'border-[1.5px] border-primary bg-primary-soft text-on-primary-soft'
            : 'border border-border-strong bg-surface text-text',
        )}
      >
        {selected ? <Check className="size-3.5" aria-hidden /> : null}
        {children}
      </span>
    </button>
  );
}
