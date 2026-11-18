'use client';

import { FilterChip } from './chip';

export type SegmentedOption<T extends string> = { value: T; label: string };

/**
 * Single-choice row of chips (camera height, tilt, zoom, ...). Pressing the selected
 * chip again clears it when `allowClear` is true.
 */
export function SegmentedSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  allowClear = true,
}: {
  label: string;
  options: readonly SegmentedOption<T>[];
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  allowClear?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-col gap-0.5">
      <span className="text-[13px] font-medium text-text">{label}</span>
      <div className="-mx-0.5 flex flex-wrap gap-x-2">
        {options.map((o) => (
          <FilterChip
            key={o.value}
            mode="radio"
            selected={value === o.value}
            onToggle={() => onChange(value === o.value && allowClear ? undefined : o.value)}
          >
            {o.label}
          </FilterChip>
        ))}
      </div>
    </div>
  );
}
