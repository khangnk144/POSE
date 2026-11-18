# Phase 1: Foundation (chặn mọi phase sau)

**Priority:** P0 · **Status:** 🟡 code xong, chờ Docker để chạy DB/RLS/e2e (xem reports/phase-01-report.md) · **Owner:** 1 agent (`fullstack-developer`) hoặc mình · **Đọc trước:** [architecture-and-adr.md](architecture-and-adr.md), [data-model-and-contracts.md](data-model-and-contracts.md), [docs/design.md](../../docs/design.md)

## Mục tiêu
Một app Next.js chạy được: đăng ký có mã mời, đăng nhập, app shell (header, menu drawer, FAB) đúng design tokens. DB, RLS và storage đã sẵn sàng. Toàn bộ contracts cho Phase 2–5 đã có file.

## Các bước
1. `git init`, `.gitignore` (gồm `.env*`, `seed/candidates/`, `supabase/.temp`).
2. Scaffold bằng `create-next-app` (TypeScript, App Router, Tailwind v4, `src/`, ESLint). Version chốt bằng `npm view` lúc làm.
3. Cài: `@supabase/supabase-js @supabase/ssr zod vaul embla-carousel-react @dnd-kit/core @dnd-kit/sortable` + icon lib theo design.md. Dev deps: `vitest @playwright/test supabase` (CLI).
4. `supabase init` và `supabase start` (Docker). Viết migrations:
   - `0001_extensions_and_profiles.sql`: unaccent, pg_trgm, `immutable_unaccent`, `profiles`, `team_settings`, `is_member()`, RPC `join_team`
   - `0002_poses_places_images.sql`: các bảng + trigger `search_text` + `updated_at` + index
   - `0003_favorites_shoots_ai_usage.sql`
   - `0004_rls_policies.sql`: toàn bộ policy theo contracts
   - `0005_storage_bucket.sql`: bucket `pose-images` private + policy
5. `supabase gen types typescript --local > src/lib/types/database.ts`. Viết thêm domain types (`src/lib/types/pose.ts`) và zod schemas (`src/lib/schemas/pose-draft-schema.ts`, `pose-filters-schema.ts`), kèm label tiếng Việt cho từng enum (`src/lib/types/pose-labels.ts`: `waist → "Ngang hông"`, …).
6. Supabase clients: `src/lib/supabase/browser-client.ts`, `server-client.ts`, `admin-client.ts` (service role, chỉ dùng phía server), `src/proxy.ts`/middleware refresh session. *(Next 16 đổi tên `middleware` thành `proxy`? Kiểm tra docs lúc làm, không đoán.)*
7. Design tokens từ design.md vào `src/app/globals.css` (`@theme`). Font Google qua `next/font` với subset `vietnamese`.
8. UI primitives `src/components/ui/`: button, icon-button, chip, bottom-sheet (vaul), input, textarea, segmented-select, toast, skeleton, empty-state, avatar. Mỗi file < 200 dòng.
9. App shell: `src/app/(app)/layout.tsx` (header + drawer + FAB slot, chặn user chưa đăng nhập), `(auth)/login`, `(auth)/join` (đăng ký + mã mời rồi gọi `join_team`).
10. File contract (signature + JSDoc + throw not implemented): `lib/ai/autofill-client.ts`, `components/place/place-picker.tsx`, `lib/poses/favorites.ts`, `lib/shoots/shoot-items.ts`. Thêm route trống cho mọi page trong cấu trúc thư mục, mỗi page chỉ hiện tiêu đề.
11. `.env.example`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `AI_DAILY_LIMIT_PER_USER=40`, `CRON_SECRET`.
12. Scripts trong package.json: `dev`, `build`, `lint`, `typecheck`, `test` (vitest), `test:e2e` (playwright), `db:reset`, `db:types`.

## Todo
- [x] scaffold + deps · [~] migrations + RLS + bucket (viết xong, chưa apply: Docker tắt) · [x] types/schemas/labels · [x] supabase clients + session refresh (proxy.ts)
- [x] tokens + fonts · [x] UI primitives · [x] app shell + auth + join · [x] contract stubs + route trống · [x] env example + scripts

## Success criteria (tiêu chí đạt)
- `npm run build`, `lint` và `typecheck` đều xanh. `supabase db reset` chạy sạch.
- **Test RLS (vitest, gọi vào Supabase local):** user không phải member đọc `poses` ra 0 dòng. Member A không xoá được dáng của member B. Mã mời sai thì `join_team` báo lỗi. Người đầu tiên được role admin.
- Test unit cho zod schemas và hàm `filters-url` (parse ↔ serialize khứ hồi).
- Trên viewport 390px, đăng ký, đăng nhập, vào shell, mở drawer đều được (kiểm bằng ảnh chụp Playwright).

## Rủi ro
API của Next 16 hoặc Supabase SSR có thể khác trí nhớ, nên mỗi API đều đọc docs hiện hành trước khi dùng. Nếu RLS sai thì lộ dữ liệu, vì vậy test RLS là bắt buộc trước khi sang Phase 2.
**Rollback:** greenfield nên rollback là `git reset` về commit trước. Migration local thì `supabase db reset`.
