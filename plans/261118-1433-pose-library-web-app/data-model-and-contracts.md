# Data model & contracts

Phase 1 sẽ biến phần này thành migration SQL, TS types và zod schema. Các agent ở Phase 2–5 chỉ dùng những gì đã chốt ở đây.

## Bảng (Postgres)
```sql
-- giá trị enum lưu dạng text + CHECK để dễ thêm giá trị mới
profiles(id uuid pk = auth.users.id, display_name text, avatar_emoji text, avatar_color text,
         role text check in ('admin','member'), created_at)
team_settings(id int pk = 1, invite_code text not null)          -- 1 dòng duy nhất, chỉ admin đọc/sửa
places(id uuid pk, name text, address text, maps_url text, note text,
       created_by uuid → profiles, created_at)
poses(id uuid pk, title text not null, description text,
      status text check in ('draft','published') default 'published',
      people_count text  check in ('solo','duo','group'),
      posture text       check in ('stand','sit','lean','lie','walk','squat'),
      scenes text[]      -- từ vựng cố định: cafe, sofa, stairs, street, beach, window, wall, greenery, studio, ...
      tags text[]        -- tự do
      camera_height text check in ('overhead','eye','chest','waist','knee','ground'),
      camera_tilt text   check in ('level','up','down'),
      zoom text          check in ('0.5x','1x','2x','3x','5x'),
      orientation text   check in ('portrait','landscape','square'),
      photographer_position text,   -- "Đứng trước sofa, cách khoảng 2m"
      distance_m numeric(4,1),
      grid jsonb,                   -- {"x":0.33,"y":0.5,"horizon":"lower"|null}  x,y ∈ [0,1]: tâm chủ thể
      model_steps text[],           -- từng bước tạo dáng
      tips text,
      place_id uuid → places null,
      source_url text, source_credit text,
      search_text text,             -- trigger: lower(unaccent(title||description||tags||scenes||photographer_position))
      created_by uuid → profiles, created_at, updated_at)
pose_images(id uuid pk, pose_id → poses on delete cascade, position int,
            full_path text, thumb_path text, width int, height int, dominant_color text)
favorites(user_id → profiles, pose_id → poses, created_at, pk(user_id,pose_id))
shoots(id uuid pk, name text, shoot_date date, place_id → places null, created_by, created_at)
shoot_items(shoot_id → shoots cascade, pose_id → poses cascade, position int, done bool default false,
            pk(shoot_id,pose_id))
ai_usage(user_id, day date, count int, pk(user_id,day))    -- trần chi phí AI
```
Index: GIN trigram trên `search_text` · GIN trên `scenes`, `tags` · btree trên `created_at desc`, `place_id`.
Extension: `unaccent`, `pg_trgm`. Hàm `immutable_unaccent()` bọc lại để dùng được trong trigger/index.

## RLS (mọi bảng đều bật)
- Hàm `is_member()` trả true khi `auth.uid()` có dòng trong `profiles`. Đọc mọi bảng nội dung đều yêu cầu `is_member()`.
- `poses`, `places`, `pose_images`: thành viên nào cũng **insert/update** được. **Delete** chỉ `created_by = auth.uid()` hoặc admin. *(Câu hỏi #3 trong plan.)*
- `favorites`: mỗi người chỉ đọc/ghi dòng của chính mình. Riêng số lượt thích được tổng hợp qua view `pose_favorite_counts`.
- `shoots`/`shoot_items`: thành viên đọc/ghi được, delete chỉ người tạo hoặc admin.
- `team_settings`: chỉ admin. `ai_usage`: chỉ server (service role) ghi.
- Tham gia team: RPC `join_team(invite_code, display_name)` là `security definer`. Hàm so mã mời, tạo `profiles` cho user vừa đăng ký. Người đăng ký đầu tiên thành admin.
- Storage bucket `pose-images` để **private**. Policy đọc/ghi yêu cầu `is_member()`. Đường dẫn: `poses/{pose_id}/{image_id}-{full|thumb}.webp`.

## TS contracts (Phase 1 tạo ở `src/lib/types/` + `src/lib/schemas/`)
```ts
type PoseFilters = { q?: string; people?: PeopleCount[]; posture?: Posture[]; scenes?: string[];
  height?: CameraHeight[]; tilt?: CameraTilt[]; zoom?: Zoom[]; orientation?: Orientation[];
  placeId?: string; createdBy?: string; favoritesOnly?: boolean; status?: 'draft'|'published' }
// Filter được đồng bộ vào URL searchParams (link chia sẻ được): lib/poses/filters-url.ts

type PoseDraft = z.infer<typeof poseDraftSchema>   // dùng chung cho form, AI autofill output, seed
type PoseCardData = { id; title; thumbUrl; imageCount; cameraHeight; zoom; photographerPosition;
                      modelStepsPreview; isFavorite; dominantColor }
```

## API contracts (route handlers, đều yêu cầu session member)
| Route | Input | Output | Ghi chú |
|---|---|---|---|
| `POST /api/ai/autofill` | `{ imageIds: string[] }` (1–3 ảnh đã upload) hoặc `multipart` 1 ảnh JPEG ≤1024px | `{ draft: Partial<PoseDraft> }` | Output Claude được zod validate. Field nào sai thì bỏ field đó, không fail cả request |
| `POST /api/ai/suggest` | `multipart` ảnh bối cảnh JPEG ≤1024px, `peopleCount?` | `{ scene: {summary, light, setting[], tips[]}, matches: {poseId, reason, cameraTip}[], ideas: PoseDraft[] }` | Chỉ giữ `poseId` có thật trong DB. Tối đa 8 matches, 3 ideas |
| `POST /api/import-url` | `{ url }` | bytes ảnh (`image/*`) | Qua SSRF guard. Nếu URL là trang HTML thì thử lấy `og:image` |
| `GET /api/health` | — | `{ ok }` | Vercel cron gọi mỗi ngày (query DB) để Supabase không pause |
Trả `429` + `{ error: 'ai_quota' }` khi vượt trần trong `ai_usage`. Trả `503` + `{ error: 'ai_not_configured' }` khi server không có `ANTHROPIC_API_KEY` (kiểm tra trước mọi thứ khác).

**Khi chưa có API key, AI bị khoá từ frontend:** `isAiConfigured(): boolean` nằm trong `src/lib/ai/ai-availability.ts` (C sở hữu, chỉ dùng phía server, trả `!!process.env.ANTHROPIC_API_KEY`, không bao giờ lộ giá trị key). Server component của trang thêm/sửa dáng (B) và trang gợi ý (C) gọi hàm này rồi truyền prop `aiEnabled` xuống client. Khi `aiEnabled=false`:
- Nút "✨ AI điền giúp" và nút chụp/chọn ảnh ở màn AI gợi ý bị `disabled` + `aria-disabled`, mờ đi (opacity theo token disabled), không bấm được.
- Ngay dưới nút luôn hiện dòng gợi ý: *"🔑 AI đang tạm khoá vì chưa cài API key. Nhờ admin thêm `ANTHROPIC_API_KEY` nha."* Dòng này hiện sẵn, không dùng tooltip vì mobile không có hover.
- Tab "AI gợi ý" vẫn hiện, bấm vào thì thấy trạng thái khoá kèm thông báo trên, không hiện màn lỗi.

Hàm client chốt ở Phase 1, các agent khác import:
- `requestAutofill(images): Promise<Partial<PoseDraft>>` trong `src/lib/ai/autofill-client.ts` (C implement, B gọi)
- `<PlacePicker value onChange />` trong `src/components/place/place-picker.tsx` (D implement, B dùng)
- `toggleFavorite(poseId)` trong `src/lib/poses/favorites.ts` (A implement)
- `addPosesToShoot(shootId, poseIds)` trong `src/lib/shoots/shoot-items.ts` (D implement, A gọi từ card/detail)
Phase 1 tạo các file này với **signature + JSDoc + `throw new Error('not implemented')`**. Agent sở hữu file sẽ thay bằng code thật, và Phase 6 kiểm tra không còn chỗ `not implemented` nào.
