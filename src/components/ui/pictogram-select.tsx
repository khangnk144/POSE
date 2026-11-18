'use client';

import { Fragment, useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { Pictogram, type PictogramName } from './pictograms';

export type PictogramOption<T extends string> = {
  value: T;
  label: string;
  /** One plain-language sentence, shown under the grid when selected. */
  hint: string;
  icon: PictogramName;
};

const CELL =
  'relative flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-sm px-1 py-2 text-center ' +
  'transition-transform duration-[var(--dur-fast)] active:scale-[0.97]';

/**
 * Single choice shown as small pictures. The last cell is always "Không rõ" (value undefined,
 * not an error). Pressing the chosen cell again does nothing; pick "Không rõ" to clear.
 */
export function PictogramSelect<T extends string>({
  question,
  options,
  value,
  onChange,
  aiFilled = false,
}: {
  question: string;
  options: readonly PictogramOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  /** Shows a ✨ next to the question after AI filled this field. */
  aiFilled?: boolean;
}) {
  const labelId = useId();
  const chosen = options.find((o) => o.value === value);
  return (
    <div role="radiogroup" aria-labelledby={labelId} className="flex flex-col gap-1.5">
      <span id={labelId} className="text-[13px] font-semibold text-text">
        {question}
        {aiFilled ? <span aria-label="AI vừa điền"> ✨</span> : null}
      </span>
      <div className="grid gap-2 [grid-template-columns:repeat(auto-fill,minmax(76px,1fr))]">
        {options.map((o) => {
          const on = o.value === value;
          const descId = `${labelId}-${o.value}`;
          return (
            <Fragment key={o.value}>
              <button
                type="button"
                role="radio"
                aria-checked={on}
                aria-describedby={descId}
                onClick={() => onChange(o.value)}
                className={cn(
                  CELL,
                  on
                    ? 'border-[1.5px] border-primary bg-primary-soft text-on-primary-soft'
                    : 'border border-border-strong bg-surface text-text',
                )}
              >
                {on ? <Check className="absolute top-1 right-1 size-3.5" aria-hidden /> : null}
                <Pictogram name={o.icon} className={on ? undefined : 'text-text-2'} />
                <span className="text-[13px] leading-[18px] font-medium">{o.label}</span>
              </button>
              {/* Outside the button so the accessible name stays the short label. */}
              <span id={descId} className="sr-only">{o.hint}</span>
            </Fragment>
          );
        })}
        <button
          type="button"
          role="radio"
          aria-checked={!chosen}
          onClick={() => onChange(undefined)}
          className={cn(
            CELL,
            'text-text-2',
            chosen ? 'border border-dashed border-border-strong bg-surface' : 'border border-border-strong bg-surface-3',
          )}
        >
          {!chosen ? <Check className="absolute top-1 right-1 size-3.5" aria-hidden /> : null}
          <Pictogram name="unknown" />
          <span className="text-[13px] leading-[18px] font-medium">Không rõ</span>
        </button>
      </div>
      {chosen ? (
        <p aria-hidden className="text-[13px] leading-[18px] text-text-2">
          {chosen.hint}
        </p>
      ) : null}
    </div>
  );
}
