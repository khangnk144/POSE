# Phase 3: Form thêm/sửa dáng + pipeline ảnh + import URL (agent B)

**Priority:** P0 · **Status:** ⬜ · **Song song với:** 2, 4, 5 · **Cần:** Phase 1 xong

**File sở hữu:** `src/app/(app)/poses/new/**`, `src/app/(app)/poses/[id]/edit/**`, `src/components/pose-form/**`, `src/lib/images/**`, `src/lib/security/ssrf-guard.ts`, `src/app/api/import-url/**`
**Dùng (không sửa):** `requestAutofill` (của C), `<PlacePicker>` (của D)

## Phạm vi
- **ImagePicker:** chọn nhiều ảnh, nút "Dán ảnh", ô "Dán link", sắp xếp bằng dnd-kit, xoá, tối đa 5 ảnh. Ảnh đầu tiên là ảnh bìa.
- **Pipeline ảnh** (`lib/images/`): decode, resize ra full 1600 và thumb 640 dạng WebP, lấy dominant color, upload lên `poses/{poseId}/{imageId}-*.webp`, có tiến độ cho từng ảnh. Nếu ảnh hỏng hoặc là HEIC không decode được thì báo lỗi thân thiện.
- **Form** dùng `poseDraftSchema`: các field chọn (segmented/chip) theo label tiếng Việt, bước tạo dáng thêm/xoá/sắp xếp được, chọn vị trí trên lưới bằng cách chạm lên ảnh bìa để đặt chấm. Nếu `aiEnabled=false` (xem data-model-and-contracts.md, mục "AI bị khoá từ frontend"), nút bị disabled và mờ, kèm dòng thông báo cài key ngay bên dưới. Nút **✨ AI điền giúp** chỉ gọi `requestAutofill` **khi người dùng bấm** (không bao giờ tự gọi, vì mỗi lần gọi đều tính phí API). Nút chỉ bật khi đã có ≥1 ảnh và bị khoá trong lúc đang chạy để tránh bấm đúp. Kết quả merge vào **những field người dùng chưa chạm** (theo dõi bằng dirty-state của form), các field vừa được điền nhấp nháy nhẹ. Hết quota hoặc lỗi thì chỉ hiện toast, form vẫn nhập tay bình thường. Bối cảnh là chip chọn từ danh sách cố định. Tag gõ tự do, có autocomplete từ các tag đã dùng (`select distinct unnest(tags)`).
- **Lưu:** tạo pose, upload ảnh, insert `pose_images`. Nếu upload lỗi giữa chừng thì dọn ảnh đã lên và xoá pose để không để lại dữ liệu mồ côi. Sửa dáng: thêm/xoá/sắp xếp ảnh, ảnh bị xoá thì xoá cả trong storage.
- **`/api/import-url` + SSRF guard:** chỉ nhận https. Resolve DNS và chặn IP private, loopback, link-local, metadata (kiểm cả IPv4 và IPv6). Tối đa 3 redirect, mỗi lần đều kiểm tra lại. Timeout 10s, tối đa 10 MB, content-type `image/*`. Nếu là HTML thì đọc `og:image` (giới hạn 1 MB HTML) rồi fetch tiếp qua cùng guard.

## Tiêu chí đạt
Vitest cho ssrf-guard (bảng case: `http://`, `127.0.0.1`, `10.x`, `169.254.169.254`, `[::1]`, domain resolve ra IP private, redirect sang IP private đều bị chặn; URL ảnh public hợp lệ thì qua) và cho hàm tính kích thước resize. E2E: thêm dáng 2 ảnh rồi thấy trong thư viện với badge "2 ảnh". Sửa thứ tự ảnh thì ảnh bìa đổi. Huỷ hoặc lỗi giữa chừng thì không còn file mồ côi.
