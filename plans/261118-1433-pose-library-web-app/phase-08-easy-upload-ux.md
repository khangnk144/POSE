# Phase 8: Thêm dáng dễ dùng cho người không rành máy ảnh

**Priority:** P1 · **Status:** ⬜ · **Duyệt:** người dùng chốt 2026-11-18 "làm hết, sao cho người dùng dễ sài nhất" · **Cần:** sửa xong các finding của review Phase 7 (cùng đụng code)

## Vấn đề
Người dùng hay lưu dáng từ TikTok/Insta, thường không biết cách cầm máy hay góc chụp. Form hiện chỉ bắt buộc **ảnh + tên** ([pose-draft-schema.ts:38](../../src/lib/schemas/pose-draft-schema.ts)), nhưng lại bày tất cả ô thông số ra cùng lúc, kèm thuật ngữ (độ cao máy, góc nghiêng, zoom, lưới 1/3). Người mới nhìn vào dễ nghĩ phải là chuyên gia mới điền được.

## Phạm vi (cả 5 mục đều đã được duyệt)
1. **Thêm nhanh:** mặc định form chỉ hiện ảnh, tên, nút ✨ AI điền giúp và ô ghi chú/caption. Mọi thông số khác nằm trong mục "Thêm chi tiết (không bắt buộc)", thu gọn sẵn. Mục này tự mở khi AI vừa điền xong hoặc khi đang sửa một dáng đã có thông số.
2. **Chọn bằng hình thay cho thuật ngữ:** mỗi lựa chọn độ cao máy (6), góc nghiêng (3), zoom (5), khung (3), số người (3), tư thế (6) có hình minh hoạ nhỏ, câu giải thích ngắn bằng lời thường, và lựa chọn **"Không rõ"** (để trống, không bị coi là lỗi).
3. **Nhãn "Thiếu thông số" + bộ lọc "Cần bổ sung":** một dáng bị coi là thiếu thông số khi không có độ cao máy *hoặc* không có bước tạo dáng nào. Thẻ dáng hiện nhãn nhẹ, bộ lọc có mục "Cần bổ sung" (đồng bộ vào URL).
4. **Trang chi tiết khi thiếu thông số:** thay khung trống bằng lời mời "Chưa có cách cầm máy, bạn biết thì bổ sung nha ✍️", kèm nút mở thẳng mục cần sửa.
5. **Dán caption/mẹo của video:** ô "Ghi chú / caption từ video" (lưu vào `description`). Khi bấm ✨, AI đọc cả chữ lẫn ảnh và **vẫn tính 1 lượt**. Chữ người dùng dán vào là dữ liệu, không phải lệnh cho AI, nên prompt phải chống prompt injection.

## Ràng buộc đã chốt (không đổi)
AI chỉ chạy khi bấm nút. Khi chưa có key: nút mờ kèm `FeatureLockedHint`. AI không ghi đè ô người dùng đã nhập. Chỉ bắt buộc ảnh + tên khi đăng; nháp có thể không có ảnh. Giao diện tiếng Việt, vùng chạm ≥44px, token theo design.md.

## Thiết kế
Fable viết spec tại `docs/design-easy-upload.md` (luồng, wireframe, microcopy, spec hình minh hoạ SVG). Agent code làm theo spec đó.

## Tiêu chí đạt
- Người mới thêm được dáng chỉ với ảnh + tên, **≤ 3 lần chạm** sau khi chọn ảnh (e2e đo được).
- E2E: thêm nhanh → dáng hiện nhãn "Thiếu thông số" → lọc "Cần bổ sung" ra đúng dáng đó → sửa, bổ sung → nhãn mất.
- Unit: quy tắc "thiếu thông số", query bộ lọc mới, AI autofill nhận caption và caption không ghi đè lệnh hệ thống.
- typecheck, lint, unit, build, RLS và e2e đều xanh.
