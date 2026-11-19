# Plan — Web app thư viện dáng chụp ảnh cho team

**Status:** ✅ Đã duyệt 2026-11-18 (tên **Pose Xinh**, các default còn lại giữ nguyên, AI điền giúp chỉ chạy khi bấm nút) · **Work context:** `d:\POSE`

Web app mobile-first, riêng tư cho team. Mỗi "dáng" gồm 1–5 ảnh mẫu, cách cầm máy (độ cao, góc nghiêng, zoom, khung, đứng đâu/cách bao xa, vị trí trên lưới 1/3), cách tạo dáng, địa điểm và tag. Team tự upload dáng, kể cả ảnh lưu từ Pinterest/IG/TikTok. AI (Claude vision) giúp ở 2 chỗ: tự điền form từ ảnh, và chụp bối cảnh để được gợi ý dáng.

## Tài liệu trong plan
| File | Nội dung |
|---|---|
| [architecture-and-adr.md](architecture-and-adr.md) | Các giả định, NFR, 3 phương án stack, ADR, cấu trúc thư mục |
| [data-model-and-contracts.md](data-model-and-contracts.md) | Schema Postgres + RLS, types, API contracts (là cái các agent code song song bám vào) |
| [image-data-sourcing.md](image-data-sourcing.md) | **Data ảnh lấy từ đâu**: upload/dán/URL, seed Pexels, bản quyền, dung lượng |
| [../../docs/design.md](../../docs/design.md) | Design system + spec màn hình (do agent Fable thiết kế) |

## Tính năng theo mức ưu tiên
- **P0 (MVP):** đăng nhập + tham gia team bằng mã mời · thư viện dạng lưới 2 cột · tìm kiếm không dấu · bộ lọc · chi tiết dáng có overlay lưới 1/3 · thêm/sửa dáng (chọn ảnh, dán ảnh, import URL) · ✨ AI điền giúp · ❤️ yêu thích · địa điểm
- **P1:** 🤖 AI gợi ý dáng từ ảnh bối cảnh · buổi chụp (shot list) + chế độ lướt khi chụp · avatar team đang online (realtime) · seed ~30 dáng mẫu
- **P2 (sau MVP, cần duyệt riêng):** "Chụp theo dáng" (camera có ghost overlay ảnh mẫu) · PWA cài lên màn hình chính + share target (chỉ Android) · dark mode

## Các phase
| # | Phase | Ai làm | Song song? | Trạng thái |
|---|---|---|---|---|
| 1 | [Foundation](phase-01-foundation.md): scaffold, tokens, DB/RLS, auth, app shell, contracts | 1 agent (hoặc mình) | ❌ chặn mọi phase sau | ✅ 2026-11-18 (build/lint/typecheck, 19 unit + 22 RLS + 2 e2e pass) |
| 2 | [Thư viện + bộ lọc + chi tiết](phase-02-library-filter-detail.md) | agent A | ✅ | ✅ 2026-11-18 |
| 3 | [Form dáng + pipeline ảnh + import URL](phase-03-pose-form-image-pipeline.md) | agent B | ✅ | ✅ 2026-11-18 |
| 4 | [AI: điền giúp + gợi ý dáng](phase-04-ai-features.md) | agent C | ✅ | ✅ 2026-11-18 |
| 5 | [Buổi chụp, địa điểm, team, presence](phase-05-shoots-places-team.md) | agent D | ✅ | ✅ 2026-11-18 |
| 6 | [Tích hợp + seed data](phase-06-integration-seed.md) | mình | ❌ sau 2–5 | 🟡 tích hợp ✅ (231 unit · 26 RLS · 20 e2e x2 pass); seed Pexels chờ API key |
| 8 | [Thêm dáng dễ dùng cho người không rành máy](phase-08-easy-upload-ux.md) | Fable thiết kế, 1 agent code | ❌ sau khi sửa xong review | ✅ 2026-11-19 |
| 7 | [Test + review + deploy](phase-07-test-review-deploy.md) | tester + code-reviewer song song, rồi fix | ❌ | 🟡 review ✅ + 9 finding đã sửa (272 unit · 34 RLS · 22 e2e x2 pass); deploy chờ tài khoản Supabase + Vercel |

**Trạng thái 2026-11-19:** Phase 1–6 và 8 xong, review bảo mật đã sửa, tất cả đã push lên `main`. Còn lại: deploy (Supabase + Vercel), smoke test AI (cần Anthropic key), seed Pexels (tuỳ chọn), thử trên iPhone thật.

**Ranh giới file:** mỗi agent chỉ sửa file trong vùng của mình (ghi rõ trong từng phase). Phần dùng chung như types, schema, UI primitives và hàm client đều được chốt ở Phase 1. Agent cần sửa file dùng chung thì báo lại cho mình, không tự sửa.

## Phụ thuộc chính
- Node 24 ✅, Docker 29 ✅ (đã kiểm tra trên máy; Docker dùng để chạy Supabase local cho dev và e2e)
- Trước Phase 7 (deploy) bạn cần tạo: **Supabase project**, **Anthropic API key**, **tài khoản Vercel**. Dev local không cần mấy thứ này, chỉ phần AI cần API key.
- (Tuỳ chọn, Phase 6) **Pexels API key** (miễn phí) để seed ảnh mẫu

## Câu hỏi cần bạn chốt (đã có default, không trả lời thì mình dùng default)
1. **Tên app:** Fable đề xuất **"Dáng Ơi"** (khuyến nghị), "Pô Xinh", "Mochi Dáng". Default là "Dáng Ơi". Chưa kiểm tra trùng nhãn hiệu hay tên miền.
2. **Đăng nhập:** default là email + mật khẩu + **mã mời team** (không cần gửi email). Muốn có Google login không?
3. **Quyền sửa:** default là ai trong team cũng sửa được mọi dáng (kiểu wiki), còn xoá thì chỉ người đăng hoặc admin.
4. **Seed data:** default là seed ~30 dáng từ Pexels, AI điền thông số rồi bạn duyệt. Hay muốn để trống, chỉ dùng ảnh team?
5. **Giới hạn AI:** default 40 lượt/người/ngày để giữ chi phí API thấp.
6. **Phạm vi:** làm P0 + P1 đợt này, P2 để sau. Đồng ý không?
7. **Điều hướng:** design.md đang dùng menu drawer giống app gốc. Mình đề xuất đổi sang **thanh tab đáy 4 mục** (Thư viện · AI gợi ý · Buổi chụp · Địa điểm) vì dễ bấm bằng một tay khi đang đi chụp ngoài trời. Default là tab đáy.
8. **Dáng nháp** (AI ý tưởng, seed chờ duyệt): default là ẩn khỏi thư viện chính, xem trong mục "Nháp".

Đã tự chốt (không cần hỏi): mỗi deploy chỉ 1 team · yêu thích là riêng từng người · masonry chia cột bằng JS (CSS `columns` làm thẻ nhảy cột khi tải thêm) · dark mode để P2.
