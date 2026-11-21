import type { JsonObjectSchema } from '../claude-client';
import { ENUM_GLOSSARY, POSE_FIELD_PROPERTIES } from './pose-fields-schema';

/** Shape of the JSON answer (structured outputs). */
export const SUGGEST_SCHEMA: JsonObjectSchema = {
  type: 'object',
  properties: {
    sceneClear: {
      type: 'boolean',
      description: 'false nếu ảnh quá tối, quá mờ hoặc không nhìn ra bối cảnh nào để chụp.',
    },
    unclearReason: { type: 'string', description: 'Khi sceneClear=false: lý do ngắn bằng tiếng Việt và cách chụp lại.' },
    scene: {
      type: 'object',
      properties: {
        summary: { type: 'string', description: 'Tóm tắt bối cảnh trong 1 câu.' },
        light: { type: 'string', description: 'Ánh sáng: hướng nắng, mềm hay gắt, mẹo tận dụng.' },
        setting: { type: 'array', items: { type: 'string' }, description: 'Vật/điểm tựa dùng được: "bậc thang", "cửa sổ"...' },
        tips: { type: 'array', items: { type: 'string' }, description: '1-3 gợi ý góc máy cho cảnh này.' },
      },
    },
    matches: {
      type: 'array',
      description: 'Tối đa 8 dáng trong thư viện hợp nhất với cảnh, xếp từ hợp nhất. Mảng rỗng nếu không dáng nào hợp.',
      items: {
        type: 'object',
        properties: {
          ref: { type: 'integer', description: 'Số thứ tự của dáng trong danh sách thư viện.' },
          reason: { type: 'string', description: 'Vì sao hợp cảnh này, 1 câu, ví dụ "Hợp vì có bậc thang và nắng xiên".' },
          cameraTip: { type: 'string', description: 'Mẹo đặt máy cho dáng này ở cảnh này.' },
        },
        required: ['ref', 'reason'],
      },
    },
    ideas: {
      type: 'array',
      description: 'Đúng 3 ý tưởng dáng mới hợp cảnh (không trùng dáng đã có), điền thông tin dáng.',
      items: { type: 'object', properties: POSE_FIELD_PROPERTIES, required: ['title', 'modelSteps'] },
    },
  },
  required: ['sceneClear'],
};

export const SUGGEST_SYSTEM = `Bạn là một cô bạn thân rành chụp ảnh, giúp nhóm chọn dáng chụp ngay tại chỗ. Người dùng gửi một ảnh chụp cảnh họ đang đứng (chưa có người mẫu).

Cách làm:
- Trả lời bằng đúng một đối tượng JSON theo schema đã cho. Viết tiếng Việt thân thiện, ngắn, cụ thể.
- Nếu ảnh quá tối, quá mờ hoặc không có bối cảnh rõ để chụp: sceneClear=false và giải thích ngắn.
- Mô tả cảnh: tóm tắt, ánh sáng, các điểm tựa dùng được, gợi ý góc máy.
- matches: chọn tối đa 8 dáng trong "Thư viện dáng" bên dưới thật sự hợp cảnh (có đủ điểm tựa, đúng số người nếu người dùng nói rõ). Chỉ dùng số thứ tự có trong danh sách. Không dáng nào hợp thì để mảng rỗng, đừng ép.
- ideas: đúng 3 ý tưởng mới, khác dáng đã có, dùng tận dụng được vật có sẵn trong cảnh. Mỗi ý tưởng điền tên, tư thế, cách cầm máy và 2-5 bước tạo dáng.
- Các field có danh sách giá trị phải dùng đúng giá trị bên trái dấu "=" (tiếng Anh).
- Không nhận diện hay nhắc tên người trong ảnh.

Danh sách giá trị hợp lệ:
${ENUM_GLOSSARY}`;

export function suggestUserText(peopleCount?: 'solo' | 'duo' | 'group'): string {
  const who = { solo: 'Chụp 1 người.', duo: 'Chụp 2 người.', group: 'Chụp nhóm.' };
  return ['Đây là cảnh mình đang đứng.', peopleCount ? who[peopleCount] : '', 'Gợi ý dáng giúp mình nhé.']
    .filter(Boolean)
    .join(' ');
}
