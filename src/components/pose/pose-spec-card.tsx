import { Compass, Frame, Ruler, ScanSearch, User, MoveHorizontal } from 'lucide-react';
import { describeGridPosition } from '@/lib/poses/grid-position';
import { CAMERA_HEIGHT_LABELS, CAMERA_TILT_LABELS, ORIENTATION_LABELS } from '@/lib/types/pose-labels';
import type { CameraHeight, CameraTilt, Orientation, PoseGrid, Zoom } from '@/lib/types/pose';

export type SpecCardProps = {
  cameraHeight: CameraHeight | null;
  cameraTilt: CameraTilt | null;
  zoom: Zoom | null;
  orientation: Orientation | null;
  photographerPosition: string | null;
  distanceM: number | null;
  grid: PoseGrid | null;
};

/** "Cách cầm máy": camera spec tiles, layout hint and a mini rule-of-thirds map. */
export function PoseSpecCard(props: SpecCardProps) {
  const tiles = [
    { icon: Ruler, label: 'Độ cao máy', value: props.cameraHeight && CAMERA_HEIGHT_LABELS[props.cameraHeight] },
    { icon: Compass, label: 'Góc nghiêng', value: props.cameraTilt && CAMERA_TILT_LABELS[props.cameraTilt] },
    { icon: ScanSearch, label: 'Zoom', value: props.zoom },
    { icon: Frame, label: 'Khung', value: props.orientation && ORIENTATION_LABELS[props.orientation] },
    { icon: User, label: 'Người chụp đứng', value: props.photographerPosition },
    { icon: MoveHorizontal, label: 'Khoảng cách', value: props.distanceM != null ? `${props.distanceM} m` : null },
  ].filter((tile) => tile.value);

  if (tiles.length === 0 && !props.grid) return null;

  return (
    <section aria-labelledby="spec-title" className="rounded-md bg-surface-2 p-4">
      <h2 id="spec-title" className="mb-3 font-display text-[17px] font-bold">
        Cách cầm máy
      </h2>
      {tiles.length ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
          {tiles.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex min-w-0 gap-2">
              <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
              <div className="min-w-0">
                <dt className="text-[13px] text-text-2">{label}</dt>
                <dd className="font-semibold break-words text-text">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      ) : null}
      {props.grid ? (
        <div className="mt-3 flex items-center gap-3 border-t border-border pt-3">
          <div aria-hidden className="relative size-14 shrink-0 rounded-xs border border-border-strong bg-surface">
            <span className="absolute inset-y-0 left-1/3 w-px bg-border-strong/60" />
            <span className="absolute inset-y-0 left-2/3 w-px bg-border-strong/60" />
            <span className="absolute inset-x-0 top-1/3 h-px bg-border-strong/60" />
            <span className="absolute inset-x-0 top-2/3 h-px bg-border-strong/60" />
            <span
              className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary"
              style={{ left: `${props.grid.x * 100}%`, top: `${props.grid.y * 100}%` }}
            />
          </div>
          <p className="text-[15px] text-text">{describeGridPosition(props.grid)}</p>
        </div>
      ) : null}
    </section>
  );
}
