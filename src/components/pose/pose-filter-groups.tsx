'use client';

import { FilterChip } from '@/components/ui/chip';
import {
  CAMERA_HEIGHTS,
  CAMERA_TILTS,
  ORIENTATIONS,
  PEOPLE_COUNTS,
  POSTURES,
  SCENES,
  ZOOMS,
  type PoseFilters,
} from '@/lib/types/pose';
import {
  CAMERA_HEIGHT_LABELS,
  CAMERA_TILT_LABELS,
  ORIENTATION_LABELS,
  PEOPLE_COUNT_LABELS,
  POSTURE_LABELS,
  SCENE_LABELS,
  ZOOM_LABELS,
} from '@/lib/types/pose-labels';

export function ChipGroup({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="border-0 p-0">
      <legend className="mb-0.5 text-[13px] font-semibold text-text">
        {label}
        {hint ? <span className="ml-1 font-normal text-text-2">({hint})</span> : null}
      </legend>
      <div className="flex flex-wrap gap-x-2">{children}</div>
    </fieldset>
  );
}

/** Add `value` to `list`, or remove it when present; an empty list becomes undefined. */
function toggled<T extends string>(list: T[] | undefined, value: T, single = false): T[] | undefined {
  const has = list?.includes(value) ?? false;
  const next = single ? (has ? [] : [value]) : has ? list!.filter((v) => v !== value) : [...(list ?? []), value];
  return next.length ? next : undefined;
}

type ListKey = 'people' | 'posture' | 'scenes' | 'height' | 'tilt' | 'zoom' | 'orientation';

const GROUPS: Array<{
  key: ListKey;
  label: string;
  hint: string;
  single?: boolean;
  options: ReadonlyArray<[string, string]>;
}> = [
  { key: 'people', label: 'Số người', hint: 'chọn một', single: true, options: PEOPLE_COUNTS.map((v) => [v, PEOPLE_COUNT_LABELS[v]]) },
  { key: 'posture', label: 'Tư thế', hint: 'chọn nhiều', options: POSTURES.map((v) => [v, POSTURE_LABELS[v]]) },
  { key: 'scenes', label: 'Bối cảnh', hint: 'chọn nhiều', options: SCENES.map((v) => [v, SCENE_LABELS[v]]) },
  { key: 'height', label: 'Độ cao máy', hint: 'chọn nhiều', options: CAMERA_HEIGHTS.map((v) => [v, CAMERA_HEIGHT_LABELS[v]]) },
  { key: 'tilt', label: 'Góc nghiêng', hint: 'chọn nhiều', options: CAMERA_TILTS.map((v) => [v, CAMERA_TILT_LABELS[v]]) },
  { key: 'zoom', label: 'Zoom', hint: 'chọn nhiều', options: ZOOMS.map((v) => [v, ZOOM_LABELS[v]]) },
  { key: 'orientation', label: 'Khung', hint: 'chọn nhiều', options: ORIENTATIONS.map((v) => [v, ORIENTATION_LABELS[v]]) },
];

/** The fixed enum chip groups of the filter sheet (people, posture, scenes, camera, frame). */
export function EnumFilterGroups({
  value,
  onChange,
}: {
  value: PoseFilters;
  onChange: (next: PoseFilters) => void;
}) {
  return (
    <>
      {GROUPS.map((group) => (
        <ChipGroup key={group.key} label={group.label} hint={group.hint}>
          {group.options.map(([optionValue, optionLabel]) => (
            <FilterChip
              key={optionValue}
              mode={group.single ? 'radio' : 'checkbox'}
              selected={(value[group.key] as string[] | undefined)?.includes(optionValue) ?? false}
              onToggle={() =>
                onChange({
                  ...value,
                  [group.key]: toggled(value[group.key] as string[] | undefined, optionValue, group.single),
                })
              }
            >
              {optionLabel}
            </FilterChip>
          ))}
        </ChipGroup>
      ))}
    </>
  );
}
