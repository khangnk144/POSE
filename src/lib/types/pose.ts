/**
 * Domain types shared by every feature. Enum values mirror the CHECK constraints in
 * supabase/migrations/0002_poses_places_images.sql. Vietnamese labels: pose-labels.ts.
 */

export const PEOPLE_COUNTS = ['solo', 'duo', 'group'] as const;
export type PeopleCount = (typeof PEOPLE_COUNTS)[number];

export const POSTURES = ['stand', 'sit', 'lean', 'lie', 'walk', 'squat'] as const;
export type Posture = (typeof POSTURES)[number];

export const CAMERA_HEIGHTS = ['overhead', 'eye', 'chest', 'waist', 'knee', 'ground'] as const;
export type CameraHeight = (typeof CAMERA_HEIGHTS)[number];

export const CAMERA_TILTS = ['level', 'up', 'down'] as const;
export type CameraTilt = (typeof CAMERA_TILTS)[number];

export const ZOOMS = ['0.5x', '1x', '2x', '3x', '5x'] as const;
export type Zoom = (typeof ZOOMS)[number];

export const ORIENTATIONS = ['portrait', 'landscape', 'square'] as const;
export type Orientation = (typeof ORIENTATIONS)[number];

export const POSE_STATUSES = ['draft', 'published'] as const;
export type PoseStatus = (typeof POSE_STATUSES)[number];

export const USER_ROLES = ['admin', 'member'] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Fixed scene vocabulary (chips). Free-form labels belong in `tags`. */
export const SCENES = [
  'cafe',
  'sofa',
  'stairs',
  'street',
  'beach',
  'window',
  'wall',
  'greenery',
  'studio',
  'park',
  'home',
  'rooftop',
] as const;
export type Scene = (typeof SCENES)[number];

/** Subject centre on the rule-of-thirds grid; x and y are fractions in [0, 1]. */
export type PoseGrid = { x: number; y: number; horizon: 'lower' | null };

/** Data a PoseCard needs. Built by the library query (phase 2). */
export type PoseCardData = {
  id: string;
  title: string;
  status: PoseStatus;
  /** Short-lived signed URL of the cover thumbnail; null when the pose has no image. */
  thumbUrl: string | null;
  imageCount: number;
  cameraHeight: CameraHeight | null;
  zoom: Zoom | null;
  photographerPosition: string | null;
  /** First steps of model_steps, at most 2. */
  modelStepsPreview: string[];
  modelStepCount: number;
  isFavorite: boolean;
  /** Placeholder colour (#rrggbb) while the image loads. */
  dominantColor: string | null;
};

export type PoseFilters = {
  q?: string;
  people?: PeopleCount[];
  posture?: Posture[];
  scenes?: string[];
  height?: CameraHeight[];
  tilt?: CameraTilt[];
  zoom?: Zoom[];
  orientation?: Orientation[];
  placeId?: string;
  createdBy?: string;
  favoritesOnly?: boolean;
  /** Published poses missing the camera height or the model steps ("Cần bổ sung"). */
  needsDetails?: boolean;
  status?: PoseStatus;
};

/** Image the client hands to AI autofill: an already-uploaded image id or a local file. */
export type AutofillImage = { imageId: string } | { file: Blob };
