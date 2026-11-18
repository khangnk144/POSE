import type {
  CameraHeight,
  CameraTilt,
  Orientation,
  PeopleCount,
  Posture,
  Scene,
  UserRole,
  Zoom,
} from './pose';

/** Vietnamese UI labels for every enum value. */

export const PEOPLE_COUNT_LABELS: Record<PeopleCount, string> = {
  solo: '1 người',
  duo: '2 người',
  group: 'Nhóm',
};

export const POSTURE_LABELS: Record<Posture, string> = {
  stand: 'Đứng',
  sit: 'Ngồi',
  lean: 'Dựa',
  lie: 'Nằm',
  walk: 'Đi',
  squat: 'Ngồi xổm',
};

export const CAMERA_HEIGHT_LABELS: Record<CameraHeight, string> = {
  overhead: 'Trên đầu',
  eye: 'Ngang mắt',
  chest: 'Ngang ngực',
  waist: 'Ngang hông',
  knee: 'Ngang gối',
  ground: 'Sát đất',
};

export const CAMERA_TILT_LABELS: Record<CameraTilt, string> = {
  level: 'Thẳng',
  up: 'Hất lên',
  down: 'Chúc xuống',
};

export const ZOOM_LABELS: Record<Zoom, string> = {
  '0.5x': '0.5x',
  '1x': '1x',
  '2x': '2x',
  '3x': '3x',
  '5x': '5x',
};

export const ORIENTATION_LABELS: Record<Orientation, string> = {
  portrait: 'Dọc',
  landscape: 'Ngang',
  square: 'Vuông',
};

export const SCENE_LABELS: Record<Scene, string> = {
  cafe: 'Cafe',
  sofa: 'Sofa',
  stairs: 'Cầu thang',
  street: 'Đường phố',
  beach: 'Biển',
  window: 'Cửa sổ',
  wall: 'Tường',
  greenery: 'Cây xanh',
  studio: 'Studio',
  park: 'Công viên',
  home: 'Trong nhà',
  rooftop: 'Sân thượng',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Trưởng nhóm',
  member: 'Thành viên',
};

/** Label for a scene id; unknown ids fall back to the raw value. */
export function sceneLabel(scene: string): string {
  return (SCENE_LABELS as Record<string, string>)[scene] ?? scene;
}
