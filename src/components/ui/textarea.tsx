import { useId } from 'react';
import { cn } from '@/lib/utils/cn';
import { FieldWrapper } from './input';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

/** Labelled multi-line input. */
export function Textarea({ label, error, hint, className, id, rows = 3, ...rest }: TextareaProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint}>
      <textarea
        id={fieldId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fieldId}-desc` : undefined}
        className={cn(
          'w-full rounded-sm border border-border-strong bg-surface px-3.5 py-3 text-text',
          'placeholder:text-text-3 aria-[invalid=true]:border-danger',
          className,
        )}
        {...rest}
      />
    </FieldWrapper>
  );
}
