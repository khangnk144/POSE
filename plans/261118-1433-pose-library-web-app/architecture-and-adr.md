# Kiến trúc & quyết định stack

## Recon (dự án mới tinh)
`d:\POSE` đang trống và chưa có git. Trên máy đã có Node 24.14, npm 11.9, git 2.49, Docker 29.3 (đã kiểm tra trực tiếp). Vì là greenfield nên các giả định dưới đây được ghi rõ để bạn sửa nếu sai.

## Giả định (sửa giúp nếu sai)
| Giả định | Giá trị dùng để thiết kế |
|---|---|
| Quy mô team | 5–20 người, ≤ 10 người online cùng lúc |
| Số dáng | ~2.000 dáng (~4.000 ảnh) trong vòng 1–2 năm |
| Thiết bị | Phần lớn iPhone Safari, mở bằng link, có thể "Add to Home Screen" |
| Ngân sách | Gần 0đ: dùng free tier. Chỉ trả tiền API Claude theo lượt dùng |
| Riêng tư | Chỉ thành viên team xem được, không public |

## NFR có số
- Màn hình thư viện hiện ảnh đầu tiên trong **< 2s trên 4G**. Thumbnail khoảng **≤ 80 KB** mỗi ảnh, lazy-load.
- Tìm kiếm và lọc trả kết quả **< 300ms** khi có 2.000 dáng.
- Một lần AI điền giúp mất **< 15s**, AI gợi ý dáng **< 25s**. Có trạng thái chờ dễ thương, huỷ được.
- Chi phí AI có trần cứng: **40 lượt/người/ngày** (cấu hình được).
- Dung lượng ảnh ước tính **~0,3 MB/ảnh** (gồm bản full ~1600px và thumb ~640px, đều WebP). Free tier 1 GB chứa được khoảng **3.300 ảnh** (1024 / 0,31 ≈ 3.300, đây là ước tính).

## Non-goals (cố ý không làm)
App public hoặc mạng xã hội · nhiều team trên một deploy · app native iOS/Android · chỉnh sửa ảnh · AI tự sinh ảnh dáng.

## 3 phương án
**A. Next.js + Supabase (Postgres + Auth + Storage + Realtime) + Claude API, deploy Vercel**
```
iPhone ──► Next.js (Vercel) ──server-only──► Claude API
   │            │ route handlers: /api/ai/*, /api/import-url
   └──supabase-js (RLS)──► Supabase: Postgres · Storage · Auth · Realtime presence
```
**B. Vite React SPA + Firebase (Firestore + Storage + Auth) + Cloud Functions gọi Claude.** Firestore lọc nhiều điều kiện cùng lúc rất kém: mỗi tổ hợp filter cần composite index riêng và không có full-text search. Cloud Functions bắt buộc gói Blaze (trả theo dùng).

**C. Cloudflare Pages + D1 (SQLite) + R2 + Workers.** Storage free lớn hơn (R2 khoảng 10 GB, *chưa xác minh*). Nhưng phải tự làm auth, realtime presence và RLS, tức là nhiều code hơn hẳn.

| Tiêu chí | A (Next+Supabase) | B (Firebase) | C (Cloudflare) |
|---|---|---|---|
| Lọc nhiều chiều + tìm không dấu | ✅ SQL + `unaccent` + trigram | ❌ yếu | ✅ SQL (tự làm unaccent) |
| Auth / realtime / phân quyền | ✅ có sẵn (RLS, Presence) | ✅ có sẵn | ❌ tự viết |
| Storage free | ⚠️ ~1 GB | ⚠️ cần Blaze | ✅ ~10 GB |
| Dev local | ✅ `supabase start` (Docker) | ✅ emulator | ✅ wrangler |
| Rủi ro free tier | ⚠️ pause sau 7 ngày không dùng | ⚠️ cần thẻ | ✅ |
| Chi phí nếu chọn sai | Thấp: Postgres chuẩn, dễ chuyển | Cao: data model NoSQL | Trung bình |

## ADR-001: Chọn Next.js + Supabase + Claude API
- **Status:** proposed · 2026-11-18
- **Context:** Team nhỏ cần thư viện riêng tư, lọc theo nhiều tiêu chí, có realtime nhẹ, ảnh là nội dung chính, và cần AI vision mà không lộ API key. Gần như không có ngân sách và không có người vận hành server.
- **Decision:** Dùng Next.js 16 App Router (npm hiện tại là 16.4.6) với TypeScript và Tailwind v4. Supabase lo Postgres + RLS, Auth (email/password), Storage (bucket private, signed URL) và Realtime Presence. `@anthropic-ai/sdk` chỉ được gọi trong route handler phía server. Deploy lên Vercel Hobby, có cron ping mỗi ngày để Supabase không bị pause.
- **Consequences:** Dễ hơn: lọc và tìm kiếm bằng SQL, phân quyền bằng RLS, presence có sẵn. Khó hơn: storage 1 GB phải nén ảnh phía client. Đặt cược: team dưới khoảng 3.000 ảnh, hoặc sẵn sàng nâng Supabase Pro hay chuyển ảnh sang R2.
- **Runner-up:** C (Cloudflare). **Điều kiện đổi phương án:** số ảnh dự kiến vượt 3.000 trong năm đầu, hoặc không chấp nhận bị pause hay phải trả $25/tháng cho Supabase Pro (giá Pro lấy từ blog, *chưa xác minh trên trang chính thức*).
- **Alternatives:** B bị loại vì lọc nhiều chiều kém và Functions cần Blaze. Artifact Claude bị loại theo yêu cầu của bạn (muốn web thật).

## Thư viện (chốt version lúc code bằng `npm view`)
`next` · `react` · `tailwindcss` v4 · `@supabase/supabase-js` + `@supabase/ssr` · `@anthropic-ai/sdk` (server) · `zod` (validate form và output AI) · `vaul` (bottom sheet) · `embla-carousel-react` (carousel ảnh) · `@dnd-kit/sortable` (sắp xếp ảnh/buổi chụp) · icon lib theo design.md · test: `vitest`, `@playwright/test`.

## Cấu trúc thư mục (kebab-case, mỗi file < 200 dòng)
```
src/app/(auth)/login · join
src/app/(app)/page.tsx (thư viện) · poses/[id] · poses/new · poses/[id]/edit
             suggest · shoots · shoots/[id] · places · places/[id] · team
src/app/api/ai/autofill · api/ai/suggest · api/import-url · api/health
src/components/ui/*          primitives (Phase 1)
src/components/pose/*        card, grid, filter sheet, detail (A)
src/components/pose-form/*   form, image picker (B)
src/components/ai/*          autofill button, suggest flow (C)
src/components/shoot|place|team/*  (D)
src/lib/supabase/*  lib/types/*  lib/schemas/*  (Phase 1)
src/lib/poses/*  (A) · lib/images/*, lib/security/ssrf-guard.ts (B) · lib/ai/* (C)
supabase/migrations/*.sql · scripts/seed-*.ts · tests/e2e/*
```
