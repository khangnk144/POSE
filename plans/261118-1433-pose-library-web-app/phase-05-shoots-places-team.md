# Phase 5: Buổi chụp, địa điểm, team, presence (agent D)

**Priority:** địa điểm P0, còn lại P1 · **Status:** ⬜ · **Song song với:** 2, 3, 4 · **Cần:** Phase 1 xong

**File sở hữu:** `src/app/(app)/shoots/**`, `src/app/(app)/places/**`, `src/app/(app)/team/**`, `src/components/shoot/**`, `src/components/place/**` (gồm `place-picker.tsx`), `src/components/team/**` (gồm `online-avatar-stack.tsx`), `src/lib/shoots/**`, `src/lib/places/**`, `src/lib/team/**`

## Phạm vi
- **Địa điểm:** danh sách (ảnh bìa lấy từ dáng gần nhất, số dáng, địa chỉ, nút mở Google Maps), trang chi tiết là lưới dáng của địa điểm đó (dùng component của A), thêm/sửa/xoá. `PlacePicker` gồm ô tìm địa điểm đã lưu và nút tạo mới nhanh.
- **Buổi chụp:** tạo (tên, ngày, địa điểm), thêm dáng (`addPosesToShoot`, gọi từ thư viện), kéo để sắp xếp, đánh dấu ✓ đã chụp, xoá. **Chế độ chụp:** lướt toàn màn hình từng dáng, hiện ảnh mẫu + thông số máy ngắn gọn, giữ màn hình sáng bằng Wake Lock API nếu có.
- **Team:** danh sách thành viên, admin xem/copy/đổi mã mời, chọn avatar emoji + màu.
- **Presence:** kênh Supabase Realtime presence, `OnlineAvatarStack` ở header (tối đa 5 avatar, phần còn lại hiện "+N"), tự gỡ khi tab bị ẩn hoặc đóng.

## Tiêu chí đạt
Vitest cho logic sắp xếp `position`. E2E: tạo buổi chụp, thêm 3 dáng từ thư viện, sắp xếp lại, đánh dấu xong, reload vẫn giữ. Mở 2 browser context thì avatar của nhau hiện trong vòng 3s. Member thường không xem được mã mời (kiểm bằng test RLS).
