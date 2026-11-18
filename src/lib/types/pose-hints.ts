import type {
  CameraHeight,
  CameraTilt,
  Orientation,
  PeopleCount,
  Posture,
  Zoom,
} from './pose';

/** One plain-language sentence per enum value, shown under the picture pickers in the pose form. */

export const CAMERA_HEIGHT_HINTS: Record<CameraHeight, string> = {
  overhead: 'Giơ máy cao hơn đầu người được chụp, chụp từ trên xuống.',
  eye: 'Máy ngang tầm mắt người được chụp, như lúc hai người đứng nói chuyện.',
  chest: 'Hạ máy xuống ngang ngực người được chụp.',
  waist: 'Hạ máy xuống ngang hông (chỗ cạp quần). Chân trông dài hơn.',
  knee: 'Người chụp ngồi xổm hoặc quỳ, máy ngang đầu gối người được chụp.',
  ground: 'Đặt máy gần chạm đất rồi chụp hắt lên. Người trông cao hẳn.',
};

export const CAMERA_TILT_HINTS: Record<CameraTilt, string> = {
  level: 'Giữ máy thẳng đứng, không ngửa, không cúi.',
  up: 'Ngửa đầu máy ra sau một chút để ống kính hướng lên.',
  down: 'Cúi đầu máy về trước để ống kính hướng xuống.',
};

export const ZOOM_HINTS: Record<Zoom, string> = {
  '0.5x': 'Góc siêu rộng: lấy được nhiều cảnh, người nhỏ lại.',
  '1x': 'Camera thường, mở lên là chụp, không zoom gì cả.',
  '2x': 'Gần gấp đôi, hợp chụp nửa người.',
  '3x': 'Cận hơn nữa, hợp chụp chân dung. Người chụp phải lùi ra xa.',
  '5x': 'Rất cận, chỉ một số máy có. Dùng khi đứng rất xa.',
};

export const ORIENTATION_HINTS: Record<Orientation, string> = {
  portrait: 'Cầm máy đứng. Hợp đăng story, TikTok.',
  landscape: 'Xoay ngang máy, lấy được nhiều cảnh hai bên.',
  square: 'Ảnh vuông 1:1.',
};

export const PEOPLE_COUNT_HINTS: Record<PeopleCount, string> = {
  solo: 'Chụp một mình.',
  duo: 'Chụp đôi: bạn thân, cặp đôi.',
  group: 'Từ 3 người trở lên.',
};

export const POSTURE_HINTS: Record<Posture, string> = {
  stand: 'Đứng thẳng hoặc đứng thả lỏng.',
  sit: 'Ngồi trên ghế, bậc thềm, sofa…',
  lean: 'Tựa lưng, vai hoặc tay vào tường, lan can, bàn.',
  lie: 'Nằm trên giường, bãi cỏ, bãi cát…',
  walk: 'Đang bước đi, chụp lúc chuyển động.',
  squat: 'Gập gối ngồi thấp, mông không chạm đất.',
};
