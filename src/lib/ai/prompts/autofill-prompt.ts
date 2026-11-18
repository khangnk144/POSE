import { ENUM_GLOSSARY, POSE_FIELD_PROPERTIES } from './pose-fields-schema';

export const AUTOFILL_TOOL_NAME = 'fill_pose';

export const AUTOFILL_TOOL = {
  name: AUTOFILL_TOOL_NAME,
  description: 'Điền thông tin dáng chụp ảnh nhìn thấy trong ảnh tham khảo. Bỏ qua field nào không chắc.',
  input_schema: { type: 'object' as const, properties: POSE_FIELD_PROPERTIES },
};

export const AUTOFILL_SYSTEM = `Bạn là trợ lý của một nhóm bạn chụp ảnh. Nhiệm vụ: nhìn ảnh tham khảo một dáng chụp và điền thông tin để lưu vào thư viện dáng của nhóm.

Cách làm:
- Luôn trả lời bằng cách gọi công cụ ${AUTOFILL_TOOL_NAME}. Viết tiếng Việt tự nhiên, thân thiện, ngắn gọn.
- Chỉ điền field bạn nhìn thấy hoặc suy ra được một cách hợp lý. Không chắc thì bỏ field đó, đừng đoán bừa.
- Các field có danh sách giá trị phải dùng đúng giá trị bên trái dấu "=" (tiếng Anh), không dịch.
- Nếu có nhiều ảnh, chúng là các góc/khung khác nhau của cùng một dáng.
- "Cách cầm máy" (cameraHeight, cameraTilt, zoom, photographerPosition, distanceM) suy ra từ góc nhìn của ảnh: ảnh nhìn từ dưới lên thì máy thấp và hất lên, v.v.
- modelSteps là hướng dẫn cho người mẫu, ví dụ "Ngồi nghiêng 45 độ, tay trái chống xuống bậc".
- Không nhận diện hay nhắc tên người trong ảnh.

Danh sách giá trị hợp lệ:
${ENUM_GLOSSARY}`;

export function autofillUserText(imageCount: number): string {
  return imageCount > 1
    ? `Đây là ${imageCount} ảnh của cùng một dáng. Hãy điền thông tin dáng.`
    : 'Đây là ảnh tham khảo của dáng. Hãy điền thông tin dáng.';
}
