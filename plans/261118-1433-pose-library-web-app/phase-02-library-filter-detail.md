# Phase 2: Thư viện, bộ lọc, chi tiết dáng (agent A)

**Priority:** P0 · **Status:** ⬜ · **Song song với:** 3, 4, 5 · **Cần:** Phase 1 xong

**File sở hữu:** `src/app/(app)/page.tsx`, `src/app/(app)/poses/[id]/**` (trừ `edit`), `src/components/pose/**`, `src/lib/poses/**` (gồm `favorites.ts`, `pose-query-builder.ts`, `filters-url.ts`, `signed-urls.ts`)

## Phạm vi
- **Thư viện:** lưới masonry 2 cột (3 cột ở tablet, 4 cột ở desktop, theo design.md). Trang đầu render ở server từ searchParams. Kéo xuống thì tải thêm phía client bằng cùng `pose-query-builder`, phân trang theo cursor `created_at,id`, 24 dáng/trang. Ảnh lấy signed URL theo lô (`createSignedUrls`). Có skeleton và placeholder màu `dominantColor`.
- **PoseCard** đúng spec: badge số ảnh, ❤️ (optimistic toggle), ô chọn để "thêm vào buổi chụp" (chọn nhiều rồi hiện thanh hành động, gọi `addPosesToShoot`), tiêu đề, CameraChip (độ cao, zoom), dòng vị trí người chụp, preview bước tạo dáng.
- **Tìm kiếm:** gõ có debounce 250ms, `ilike` trên `search_text` sau khi `unaccent` từ khoá, nên "ngoi sofa" tìm ra "Ngồi sofa".
- **Bộ lọc** (bottom sheet): đủ các nhóm trong design.md, hiện số filter đang bật, đồng bộ vào URL.
- **Chi tiết dáng:** carousel embla, nút bật overlay lưới 1/3 + chấm vị trí chủ thể (từ `grid`), SpecCard "Cách cầm máy", StepList, tips, chip địa điểm, tags, nguồn, các nút hành động (sửa thì link sang route của B, xoá thì confirm).
- **Trang yêu thích:** dùng lại thư viện với `favoritesOnly`.

## Tiêu chí đạt
Vitest cho query-builder (mỗi loại filter sinh đúng điều kiện) và filters-url. E2E: lọc theo "Ngang hông" + "Ngồi" ra đúng tập dữ liệu seed test. Tìm không dấu khớp. Bấm ❤️ rồi reload vẫn còn. Thư viện có 2.000 dáng (seed giả lập trong DB local) phản hồi < 300ms (đo bằng `explain analyze`).
