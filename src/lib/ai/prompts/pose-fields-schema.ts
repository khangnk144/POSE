import {
  CAMERA_HEIGHTS,
  CAMERA_TILTS,
  ORIENTATIONS,
  PEOPLE_COUNTS,
  POSTURES,
  SCENES,
  ZOOMS,
} from '@/lib/types/pose';
import {
  CAMERA_HEIGHT_LABELS,
  CAMERA_TILT_LABELS,
  ORIENTATION_LABELS,
  PEOPLE_COUNT_LABELS,
  POSTURE_LABELS,
  SCENE_LABELS,
} from '@/lib/types/pose-labels';

/** JSON Schema (properties only) for the pose fields the model may fill. Nothing is required. */
export const POSE_FIELD_PROPERTIES = {
  title: { type: 'string', description: 'Tên dáng ngắn gọn, tiếng Việt, tối đa 8 từ. Ví dụ: "Ngồi bậc thang ngoái vai".' },
  description: { type: 'string', description: 'Mô tả 1-2 câu về dáng và cảm giác bức ảnh.' },
  peopleCount: { type: 'string', enum: [...PEOPLE_COUNTS], description: 'Số người trong ảnh.' },
  posture: { type: 'string', enum: [...POSTURES], description: 'Tư thế chính của chủ thể.' },
  scenes: { type: 'array', items: { type: 'string', enum: [...SCENES] }, description: 'Bối cảnh, chỉ chọn trong danh sách.' },
  tags: { type: 'array', items: { type: 'string' }, description: 'Tối đa 5 tag ngắn tiếng Việt, viết thường, ví dụ "ngoái vai".' },
  cameraHeight: { type: 'string', enum: [...CAMERA_HEIGHTS], description: 'Độ cao máy ảnh so với chủ thể.' },
  cameraTilt: { type: 'string', enum: [...CAMERA_TILTS], description: 'Góc nghiêng máy.' },
  zoom: { type: 'string', enum: [...ZOOMS], description: 'Mức zoom hợp lý trên điện thoại.' },
  orientation: { type: 'string', enum: [...ORIENTATIONS], description: 'Khung ảnh.' },
  photographerPosition: { type: 'string', description: 'Người chụp đứng ở đâu, ví dụ "Đứng trước sofa, cách khoảng 2m".' },
  distanceM: { type: 'number', description: 'Khoảng cách từ máy tới chủ thể, đơn vị mét, ví dụ 2.5.' },
  grid: {
    type: 'object',
    description: 'Tâm chủ thể trong khung, x và y từ 0 đến 1 (x=0 là mép trái, y=0 là mép trên).',
    properties: {
      x: { type: 'number' },
      y: { type: 'number' },
      horizon: { type: ['string', 'null'], enum: ['lower', null], description: '"lower" nếu đường chân trời nằm ở 1/3 dưới, ngược lại null.' },
    },
    required: ['x', 'y'],
  },
  modelSteps: { type: 'array', items: { type: 'string' }, description: '2-5 bước tạo dáng cho người mẫu, mỗi bước một câu ngắn, ra lệnh trực tiếp.' },
  tips: { type: 'string', description: 'Một mẹo chụp ngắn.' },
} as const;

const list = (labels: Record<string, string>) =>
  Object.entries(labels)
    .map(([value, label]) => `${value} = ${label}`)
    .join('; ');

/** Human-readable enum glossary appended to prompts so the model sees value + Vietnamese label. */
export const ENUM_GLOSSARY = [
  `peopleCount: ${list(PEOPLE_COUNT_LABELS)}`,
  `posture: ${list(POSTURE_LABELS)}`,
  `scenes: ${list(SCENE_LABELS)}`,
  `cameraHeight: ${list(CAMERA_HEIGHT_LABELS)}`,
  `cameraTilt: ${list(CAMERA_TILT_LABELS)}`,
  `orientation: ${list(ORIENTATION_LABELS)}`,
  `zoom: ${ZOOMS.join(', ')}`,
].join('\n');
