'use client';

import { PlacePicker } from '@/components/place/place-picker';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FlashField } from './flash-field';
import type { SectionProps } from './basics-section';
import { PlacePickerBoundary } from './place-picker-boundary';
import { StepsEditor } from './steps-editor';

/** Model steps, tips, place and where the reference came from. */
export function ExtrasSection({ values, set, flash, errors }: SectionProps) {
  return (
    <section aria-labelledby="extras-heading" className="flex flex-col gap-4">
      <h2 id="extras-heading" className="font-display text-[17px] font-bold">Hướng dẫn &amp; nguồn</h2>
      <FlashField field="modelSteps" flash={flash}>
        <StepsEditor steps={values.modelSteps} onChange={(s) => set('modelSteps', s)} />
      </FlashField>
      <FlashField field="tips" flash={flash}>
        <Textarea
          label="Mẹo cho người chụp"
          value={values.tips}
          maxLength={1000}
          onChange={(e) => set('tips', e.target.value)}
        />
      </FlashField>
      <div className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-text">Địa điểm</span>
        <PlacePickerBoundary>
          <PlacePicker value={values.placeId ?? null} onChange={(id) => set('placeId', id ?? undefined)} />
        </PlacePickerBoundary>
      </div>
      <Input
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
    </section>
  );
}
