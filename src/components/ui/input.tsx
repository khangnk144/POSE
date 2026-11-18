import { useId } from 'react';
import { cn } from '@/lib/utils/cn';

type FieldProps = {
  label: string;
  /** Error text, linked to the control with aria-describedby. */
  error?: string;
  hint?: string;
};

const CONTROL =
  'w-full rounded-sm border border-border-strong bg-surface px-3.5 text-text ' +
  'placeholder:text-text-3 disabled:opacity-60 aria-[invalid=true]:border-danger';

export function FieldWrapper({
  id,
  label,
  error,
  hint,
  children,
}: FieldProps & { id: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium text-text">
        {label}
      </label>
      {children}
      {hint && !error ? <p id={`${id}-desc`} className="text-xs text-text-2">{hint}</p> : null}
      {error ? (
        <p id={`${id}-desc`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & FieldProps;

/** Labelled single-line input, 48px tall, 16px text (stops iOS zoom). */
export function Input({ label, error, hint, className, id, ...rest }: InputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldWrapper id={fieldId} label={label} error={error} hint={hint}>
      <input
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fieldId}-desc` : undefined}
        className={cn(CONTROL, 'h-12', className)}
        {...rest}
      />
    </FieldWrapper>
  );
}
