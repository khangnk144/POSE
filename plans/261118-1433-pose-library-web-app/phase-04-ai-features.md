# Phase 4: AI điền giúp + AI gợi ý dáng (agent C)

**Priority:** autofill P0, suggest P1 · **Status:** ⬜ · **Song song với:** 2, 3, 5 · **Cần:** Phase 1 xong

**File sở hữu:** `src/lib/ai/**` (gồm `autofill-client.ts`, `claude-client.ts`, `prompts/*`, `ai-quota.ts`, `parse-ai-output.ts`), `src/app/api/ai/**`, `src/app/(app)/suggest/**`, `src/components/ai/**`

## Bắt buộc trước khi code
Load skill `claude-api` để chốt **model ID, giá, cách gửi ảnh, cách ép output JSON (structured output/tool use)** theo docs hiện hành. Không dùng signature theo trí nhớ. Đề xuất ban đầu: model Sonnet mới nhất cho vision, cân nhắc Haiku cho autofill nếu chất lượng đủ (so thử trên 10 ảnh).

## Phạm vi
- **Chưa có key:** `ai-availability.ts` cung cấp `isAiConfigured()`. Route trả 503 `ai_not_configured`. Màn gợi ý ở trạng thái khoá: nút mờ, disabled, kèm dòng thông báo (xem contracts).
- **Quota:** `ai-quota.ts` tăng `ai_usage` một cách atomic (upsert + kiểm tra trong 1 câu SQL / RPC). Vượt `AI_DAILY_LIMIT_PER_USER` thì trả 429 `ai_quota`. API key chỉ tồn tại phía server.
- **Autofill:** prompt tiếng Việt, đưa danh sách enum hợp lệ (giá trị + label) để model chọn. Output được zod validate theo từng field, field nào sai thì bỏ field đó. Hỗ trợ 1–3 ảnh.
- **Suggest:**
  1. Client thu ảnh về ≤1024px JPEG.
  2. Server tải catalog gọn của dáng đã publish (id, title, posture, people_count, scenes, camera_height, mỗi dáng ≤ ~30 token; khoảng 2.000 dáng thì ~60k token, nên nếu catalog > 600 dáng thì lọc trước bằng scenes/people_count).
  3. Một lần gọi Claude trả về `scene`, `matches`, `ideas`.
  4. Server bỏ các `poseId` không có thật.
- **Màn hình gợi ý:** chụp ảnh (`<input capture="environment">`) hoặc chọn ảnh, trạng thái chờ dễ thương có thể huỷ (AbortController), kết quả là tóm tắt bối cảnh + danh sách dáng khớp (dùng `PoseCard` của A, chỉ import) + thẻ ý tưởng có nút "Lưu thành dáng nháp".
- **Lỗi:** hết quota, timeout, API lỗi, ảnh không có bối cảnh rõ: mỗi trường hợp có microcopy riêng theo design.md.

## Tiêu chí đạt
Vitest cho `parse-ai-output` dùng fixture là **response thật** ghi lại từ 3–5 lần gọi thật (không tự viết response giả), kèm các case lỗi: JSON hỏng, enum lạ, poseId không tồn tại. Test quota: request thứ 41 bị 429. Smoke test thật với API key: 5 ảnh dáng, 3 ảnh bối cảnh, ghi lại độ trễ và token/chi phí thực tế vào report.
