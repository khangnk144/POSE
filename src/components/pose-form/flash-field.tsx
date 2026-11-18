import { cn } from '@/lib/utils/cn';
import type { FieldKey } from './form-values';

/** Wraps a field and pulses a soft AI-coloured ring when the AI has just filled it. */
export function FlashField({
  field,
  flash,
  children,
}: {
  field: FieldKey;
  flash: ReadonlySet<FieldKey>;
  children: React.ReactNode;
}) {
  const active = flash.has(field);
  return (
    <div
      data-ai-filled={active || undefined}
      className={cn('rounded-md transition-shadow', active && 'animate-pulse bg-ai-soft/60 ring-2 ring-ai/60')}
    >
      {children}
    </div>
  );
}
