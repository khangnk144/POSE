'use client';

import { Input } from '@/components/ui/input';
import { SegmentedSelect } from '@/components/ui/segmented-select';
import { CAMERA_HEIGHTS, CAMERA_TILTS, ORIENTATIONS, ZOOMS } from '@/lib/types/pose';
import {
  CAMERA_HEIGHT_LABELS,
  CAMERA_TILT_LABELS,
  ORIENTATION_LABELS,
  ZOOM_LABELS,
} from '@/lib/types/pose-labels';
import { FlashField } from './flash-field';
import { GridPicker } from './grid-picker';
import type { SectionProps } from './basics-section';

const options = <T extends string>(list: readonly T[], labels: Record<T, string>) =>
  list.map((value) => ({ value, label: labels[value] }));

/** Camera settings, where the photographer stands, and the subject position on the grid. */
export function CameraSection({ values, set, flash, coverUrl }: SectionProps & { coverUrl: string | null }) {
  return (
    <section aria-labelledby="camera-heading" className="flex flex-col gap-4">
      <h2 id="camera-heading" className="font-display text-[17px] font-bold">Góc chụp</h2>
      <FlashField field="cameraHeight" flash={flash}>
        <SegmentedSelect
          label="Độ cao máy"
          options={options(CAMERA_HEIGHTS, CAMERA_HEIGHT_LABELS)}
          value={values.cameraHeight}
          onChange={(v) => set('cameraHeight', v)}
        />
      </FlashField>
      <FlashField field="cameraTilt" flash={flash}>
        <SegmentedSelect
          label="Góc nghiêng"
          options={options(CAMERA_TILTS, CAMERA_TILT_LABELS)}
          value={values.cameraTilt}
          onChange={(v) => set('cameraTilt', v)}
        />
      </FlashField>
      <FlashField field="zoom" flash={flash}>
        <SegmentedSelect
          label="Zoom"
          options={options(ZOOMS, ZOOM_LABELS)}
          value={values.zoom}
          onChange={(v) => set('zoom', v)}
        />
      </FlashField>
      <FlashField field="orientation" flash={flash}>
        <SegmentedSelect
          label="Khung hình"
          options={options(ORIENTATIONS, ORIENTATION_LABELS)}
          value={values.orientation}
          onChange={(v) => set('orientation', v)}
        />
      </FlashField>
      <FlashField field="photographerPosition" flash={flash}>
        <Input
          label="Người chụp đứng ở đâu"
          value={values.photographerPosition}
          maxLength={300}
          placeholder="vd: Đứng trước sofa, cách khoảng 2m"
          onChange={(e) => set('photographerPosition', e.target.value)}
        />
      </FlashField>
      <FlashField field="distanceM" flash={flash}>
        <Input
          label="Khoảng cách (mét)"
          type="number"
          inputMode="decimal"
          min={0}
          max={99.9}
          step={0.5}
          value={values.distanceM ?? ''}
          onChange={(e) => {
            const n = e.target.valueAsNumber;
            set('distanceM', Number.isFinite(n) ? Math.round(n * 10) / 10 : undefined);
          }}
        />
      </FlashField>
      <FlashField field="grid" flash={flash}>
        <GridPicker coverUrl={coverUrl} value={values.grid} onChange={(g) => set('grid', g)} />
      </FlashField>
    </section>
  );
}
