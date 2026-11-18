import type {
  CameraHeight,
  CameraTilt,
  Orientation,
  PeopleCount,
  PoseGrid,
  PoseStatus,
  Posture,
  Zoom,
} from '@/lib/types/pose';

/** Editable state of the pose form. Text fields are plain strings ('' = empty). */
export type FormValues = {
  title: string;
  description: string;
  status: PoseStatus;
  peopleCount?: PeopleCount;
  posture?: Posture;
  scenes: string[];
  tags: string[];
  cameraHeight?: CameraHeight;
  cameraTilt?: CameraTilt;
  zoom?: Zoom;
  orientation?: Orientation;
  photographerPosition: string;
  distanceM?: number;
  grid?: PoseGrid;
  modelSteps: string[];
  tips: string;
  placeId?: string;
  sourceUrl: string;
  sourceCredit: string;
};

export type FieldKey = keyof FormValues;

export const EMPTY_VALUES: FormValues = {
  title: '',
  description: '',
  status: 'published',
  scenes: [],
  tags: [],
  photographerPosition: '',
  modelSteps: [],
  tips: '',
  sourceUrl: '',
  sourceCredit: '',
};

/** Whether a field currently holds something the user (or the saved pose) put there. */
export function hasValue(values: FormValues, key: FieldKey): boolean {
  const v = values[key];
  if (key === 'status') return false; // always has a value, never AI-filled
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim() !== '';
  return v !== undefined;
}

/** Converts form state to the shape `poseDraftSchema` expects: empty strings become absent. */
export function toDraftInput(values: FormValues): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [key, v] of Object.entries(values)) {
    if (typeof v === 'string' && v.trim() === '' && key !== 'title') delete out[key];
    if (v === undefined) delete out[key];
  }
  return out;
}
