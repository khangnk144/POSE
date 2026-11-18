'use client';

import { PlacePicker } from '@/components/place/place-picker';
import { Input } from '@/components/ui/input';
import { SegmentedSelect } from '@/components/ui/segmented-select';
import { POSE_STATUSES, type PoseStatus } from '@/lib/types/pose';
import type { SectionProps } from './basics-section';
import { PlacePickerBoundary } from './place-picker-boundary';

export const SOURCE_URL_FIELD_ID = 'field-source-url';

const STATUS_LABELS: Record<PoseStatus, string> = { published: 'Đã đăng', draft: 'Nháp' };
const STATUS_OPTIONS = POSE_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] }));

/** "Địa điểm & nguồn": place, source link and credit, visibility (published / draft). */
export function ExtrasSection({ values, set, errors }: SectionProps) {
  return (
    <section id="section-more" aria-labelledby="extras-heading" className="flex scroll-mt-[68px] flex-col gap-4">
      <h2 id="extras-heading" className="font-display text-[17px] font-bold">Địa điểm &amp; nguồn</h2>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text">Địa điểm</span>
        <PlacePickerBoundary>
          <PlacePicker value={values.placeId ?? null} onChange={(id) => set('placeId', id ?? undefined)} />
        </PlacePickerBoundary>
      </div>
      <Input
        id={SOURCE_URL_FIELD_ID}
        label="Link nguồn"
        type="url"
        inputMode="url"
        value={values.sourceUrl}
        maxLength={2048}
        placeholder="https://"
        error={errors.sourceUrl}
        onChange={(e) => set('sourceUrl', e.target.value)}
      />
      <Input
        label="Ghi công tác giả"
        value={values.sourceCredit}
        maxLength={200}
        placeholder="vd: Ảnh: Linh / Pinterest"
        onChange={(e) => set('sourceCredit', e.target.value)}
      />
      <SegmentedSelect
        label="Hiển thị"
        allowClear={false}
        options={STATUS_OPTIONS}
        value={values.status}
        onChange={(v) => v && set('status', v)}
      />
    </section>
  );
}
