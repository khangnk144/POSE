'use client';

import { Input } from '@/components/ui/input';
import { PictogramSelect } from '@/components/ui/pictogram-select';
import { CAMERA_HEIGHTS, CAMERA_TILTS, ORIENTATIONS, ZOOMS } from '@/lib/types/pose';
import { CAMERA_HEIGHT_HINTS, CAMERA_TILT_HINTS, ORIENTATION_HINTS, ZOOM_HINTS } from '@/lib/types/pose-hints';
import {
  CAMERA_HEIGHT_LABELS,
  CAMERA_TILT_LABELS,
  ORIENTATION_LABELS,
  ZOOM_LABELS,
} from '@/lib/types/pose-labels';
import type { SectionProps } from './basics-section';
import { FlashField } from './flash-field';
import { GridPicker } from './grid-picker';
import { pictogramOptions } from './pictogram-options';

const HEIGHT_OPTIONS = pictogramOptions('height', CAMERA_HEIGHTS, CAMERA_HEIGHT_LABELS, CAMERA_HEIGHT_HINTS);
const TILT_OPTIONS = pictogramOptions('tilt', CAMERA_TILTS, CAMERA_TILT_LABELS, CAMERA_TILT_HINTS);
const ZOOM_OPTIONS = pictogramOptions('zoom', ZOOMS, ZOOM_LABELS, ZOOM_HINTS);
const ORIENTATION_OPTIONS = pictogramOptions('orient', ORIENTATIONS, ORIENTATION_LABELS, ORIENTATION_HINTS);

/** "Cách cầm máy": pictures for height/tilt/zoom/frame, where the photographer stands, subject position. */
export function CameraSection({ values, set, flash, coverUrl }: SectionProps & { coverUrl: string | null }) {
  return (
    <section id="section-camera" aria-labelledby="camera-heading" className="flex scroll-mt-[68px] flex-col gap-4">
      <h2 id="camera-heading" className="font-display text-[17px] font-bold">Cách cầm máy</h2>
      <FlashField field="cameraHeight" flash={flash}>
        <PictogramSelect
          question="Máy cao ngang đâu?"
          options={HEIGHT_OPTIONS}
          value={values.cameraHeight}
          aiFilled={flash.has('cameraHeight')}
          onChange={(v) => set('cameraHeight', v)}
        />
      </FlashField>
      <FlashField field="cameraTilt" flash={flash}>
        <PictogramSelect
          question="Máy ngửa hay cúi?"
          options={TILT_OPTIONS}
          value={values.cameraTilt}
          aiFilled={flash.has('cameraTilt')}
          onChange={(v) => set('cameraTilt', v)}
        />
      </FlashField>
      <FlashField field="zoom" flash={flash}>
        <PictogramSelect
          question="Zoom mấy?"
          options={ZOOM_OPTIONS}
          value={values.zoom}
          aiFilled={flash.has('zoom')}
          onChange={(v) => set('zoom', v)}
        />
      </FlashField>
      <FlashField field="orientation" flash={flash}>
        <PictogramSelect
          question="Ảnh dọc hay ngang?"
          options={ORIENTATION_OPTIONS}
          value={values.orientation}
          aiFilled={flash.has('orientation')}
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
