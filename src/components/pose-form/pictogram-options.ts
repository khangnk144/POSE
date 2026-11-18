import type { PictogramOption } from '@/components/ui/pictogram-select';
import type { PictogramName } from '@/components/ui/pictograms';

/** Options for a PictogramSelect from an enum list; the icon is `<prefix>-<value>` in pictograms.tsx. */
export function pictogramOptions<T extends string>(
  prefix: 'height' | 'tilt' | 'zoom' | 'orient' | 'people' | 'posture',
  list: readonly T[],
  labels: Record<T, string>,
  hints: Record<T, string>,
): PictogramOption<T>[] {
  return list.map((value) => ({
    value,
    label: labels[value],
    hint: hints[value],
    icon: `${prefix}-${value}` as PictogramName,
  }));
}
