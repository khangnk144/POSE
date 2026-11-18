# Phase 6: Tích hợp + seed data (mình làm)

**Priority:** P0/P1 · **Status:** ⬜ · **Cần:** Phase 2–5 đều DONE

## Tích hợp
- Rà lại toàn bộ: không còn `not implemented`, không có file vượt ranh giới (dùng `git log --stat` theo từng agent), không có import vòng.
- Nối các luồng xuyên agent: card chọn nhiều rồi thêm vào buổi chụp (A+D), form gọi autofill (B+C), form chọn địa điểm (B+D), ý tưởng AI lưu thành nháp rồi mở form sửa (C+B).
- `npm run build`, `lint`, `typecheck`, `test` đều xanh.

## Seed (theo [image-data-sourcing.md](image-data-sourcing.md) §2)
- `scripts/seed-search-pexels.ts`, rồi mình chọn ứng viên, **bạn duyệt danh sách**, rồi `scripts/seed-import.ts` (status draft + credit).
- Riêng cho test: `supabase/seed.sql` chứa ~20 dáng giả lập cố định (ảnh placeholder tạo bằng code), chỉ dùng cho local và e2e, **không bao giờ** chạy lên production.

## Tiêu chí đạt
Chạy lại toàn bộ e2e của các phase 2–5 sau khi tích hợp đều pass. Có ~30 dáng seed ở trạng thái draft, kèm credit, chờ bạn duyệt.
