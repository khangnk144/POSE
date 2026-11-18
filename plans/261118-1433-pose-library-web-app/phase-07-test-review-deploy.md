# Phase 7: Test + review + deploy

**Status:** ⬜ · **Cần:** Phase 6 xong

## Test & review (song song, rồi vòng fix)
- **tester agent:** chạy toàn bộ vitest + Playwright (viewport iPhone 390×844 và desktop), báo coverage cho `src/lib/**` (mục tiêu ≥ 80% cho lib, UI dựa vào e2e), kiểm tra a11y cơ bản (axe trên 5 màn hình chính).
- **code-reviewer agent:** tập trung vào bảo mật (RLS, SSRF, service-role key không lọt ra client, API key, kiểm tra quyền ở route handler), xử lý lỗi, file > 200 dòng, đúng design.md.
- Mình đối chiếu từng finding với tình huống thật, fix những cái có thật, rồi chạy lại test. Lặp tới khi xanh, tối đa 3 vòng, sau đó báo bạn.
- **Test tay trên iPhone thật** (cần bạn): chọn ảnh HEIC, dán ảnh, chụp bối cảnh, Add to Home Screen.

## Deploy (cần tài khoản của bạn)
1. Bạn tạo Supabase project (chọn region Singapore cho gần VN) + Anthropic API key + Vercel project.
2. `supabase link` + `supabase db push`, set env trên Vercel.
3. Vercel Cron gọi `/api/health` (có `CRON_SECRET`) mỗi ngày để Supabase free không pause sau 7 ngày. *Giới hạn cron của gói Hobby cần xác minh lúc deploy.*
4. Bạn đăng ký đầu tiên (thành admin), lấy mã mời gửi team.

## Rollback
Vercel có "Instant Rollback" về bản deploy trước. Migration DB chỉ thêm, không xoá cột trong MVP. Nếu cần lùi schema thì viết migration ngược và backup trước bằng `supabase db dump`.

## Tiêu chí đạt
Tất cả test xanh, review không còn finding mức Critical/High, app chạy trên URL Vercel, 2 thành viên thật đăng nhập và thấy nhau online.
