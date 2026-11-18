# Design spec — Thêm dáng dễ dùng (Phase 8)

Bổ sung cho [design.md](design.md) (mục 6.5 "Thêm / Sửa dáng", 6.3 "Bộ lọc", 6.4 "Chi tiết dáng"). Chỗ nào tài liệu này nói khác design.md 6.5 thì theo tài liệu này. Khối "Quyết định đã chốt" ở đầu design.md vẫn đứng trên hết. Nguồn yêu cầu: [phase-08-easy-upload-ux.md](../plans/261118-1433-pose-library-web-app/phase-08-easy-upload-ux.md).

**Mục tiêu:** một bạn không rành máy ảnh lưu được dáng trong vài giây và không thấy ô kỹ thuật nào chắn đường. Ai biết thì bổ sung sau, lúc nào cũng được.

**Quy ước độ tin cậy:** "(đã kiểm tra)" là đã đọc code hoặc đã render thử trong lúc viết. "(đề xuất)" là tên/giá trị mình đặt, dev được đổi nếu giữ nguyên hành vi. "(chưa kiểm chứng)" là cần xác nhận khi cài đặt.

---

## 1. Luồng "Thêm nhanh"

### 1.1 Thứ tự mới của form

Form hiện tại (đã kiểm tra, `pose-form.tsx`): Ảnh → ✨ → "Thông tin dáng" (8 ô) → "Góc chụp" (7 ô) → "Hướng dẫn & nguồn" (5 ô), tất cả bày ra cùng lúc. Thứ tự mới:

| # | Khối | Ghi chú |
|---|---|---|
| 1 | `ImagePicker` | Giữ nguyên. |
| 2 | **Tên dáng** (bắt buộc) | Ô duy nhất có dấu `*`. |
| 3 | **Ghi chú / caption từ video** | Ô `description`, xem mục 4. |
| 4 | **✨ AI điền giúp** + dòng giải thích | Chuyển xuống dưới caption, vì AI đọc cả ảnh lẫn caption. |
| 5 | **Thêm chi tiết (không bắt buộc)** | Một nút mở/đóng, mặc định đóng. Chứa mọi ô còn lại. |
| 6 | Thanh đáy dính: `Huỷ` + `Lưu dáng` | Giữ nguyên. |

Bỏ tiêu đề section "Thông tin dáng" ở trạng thái nhanh (chỉ còn 2 ô, không cần tiêu đề).

**Số lần chạm sau khi chọn ảnh:** chạm ô Tên dáng (1) → gõ tên → chạm "Lưu dáng" (2). Đạt tiêu chí ≤ 3.

Bên trong "Thêm chi tiết", 4 nhóm theo thứ tự, mỗi nhóm có `id` để cuộn tới:

| `id` | Tiêu đề (`title`) | Ô bên trong |
|---|---|---|
| `section-camera` | Cách cầm máy | 4 bộ chọn bằng hình (độ cao, ngửa/cúi, zoom, khung) → Người chụp đứng ở đâu → Khoảng cách (mét) → Vị trí người trong khung (`GridPicker`) |
| `section-steps` | Cách tạo dáng | `StepsEditor` → Mẹo cho người chụp |
| `section-tags` | Phân loại | Số người, Tư thế (bộ chọn bằng hình) → Bối cảnh → Tag |
| `section-more` | Địa điểm & nguồn | Địa điểm → Link nguồn → Ghi công tác giả → Hiển thị (Đã đăng / Nháp) |

Tiêu đề "Góc chụp" đổi thành **"Cách cầm máy"** cho khớp với trang chi tiết (`pose-spec-card.tsx`).

### 1.2 Khi nào "Thêm chi tiết" tự mở

| Tình huống | Trạng thái |
|---|---|
| Tạo dáng mới | Đóng. |
| Sửa dáng, có ít nhất một ô chi tiết đã có giá trị (mọi key trừ `title`, `description`, `status`; dùng `hasValue`) | Mở sẵn. |
| Sửa dáng chưa có ô chi tiết nào | Đóng. |
| AI vừa điền ít nhất 1 ô nằm trong phần chi tiết | Mở, cuộn mượt để nút "Thêm chi tiết" lên sát dưới header. Nếu AI chỉ điền `title` thì không mở. |
| URL có `?focus=camera` hoặc `?focus=steps` | Mở và cuộn tới nhóm đó (mục 3.4). |
| Bấm Lưu mà ô báo lỗi nằm trong phần chi tiết (hiện chỉ có `sourceUrl`) | Mở, cuộn tới ô lỗi. |
| Người dùng tự bấm mở/đóng | Theo người dùng. Sau khi họ đã tự bấm, AI điền xong không tự đóng lại. |

Không lưu trạng thái mở/đóng qua lần sau. Nội dung bên trong vẫn được mount khi đóng (ẩn bằng `hidden`), để giá trị và lỗi không mất.

### 1.3 Wireframe (390px)

**A. Trạng thái nhanh (mới chọn 1 ảnh)**
```
┌──────────────────────────────────────┐
│ Thêm dáng                            │
│ Ảnh                1/5 · ảnh đầu là bìa│
│ ┌─────┐ ┌ ─ ─ ┐                      │
│ │ Bìa │    +                         │
│ └─────┘ └ ─ ─ ┘                      │
│ Tên dáng *                           │
│ [ vd: Ngồi sofa nhìn ra cửa sổ    ]  │
│ Ghi chú / caption từ video           │
│ ┌──────────────────────────────────┐ │
│ │ Dán caption hoặc mẹo trong video │ │
│ │ vào đây. vd: "Đặt máy ngang hông,│ │
│ │ zoom 2x, nghiêng vai…"           │ │
│ └──────────────────────────────────┘ │
│ ( ✨ AI điền giúp )                  │
│ AI xem ảnh và đọc ghi chú ở trên rồi │
│ điền các ô còn trống. Mỗi lần bấm    │
│ tính 1 lượt.                         │
│ ┌──────────────────────────────────┐ │
│ │ Thêm chi tiết              ⌄     │ │
│ │ Không bắt buộc · cách cầm máy,   │ │
│ │ các bước, địa điểm…              │ │
│ └──────────────────────────────────┘ │
├──────────────────────────────────────┤
│ ( Huỷ )  [        Lưu dáng        ]  │
└──────────────────────────────────────┘
```

**B. AI đang điền**
```
│ Tên dáng *                           │
│ [▒▒▒▒▒▒▒▒▒▒▒ shimmer --ai-soft ▒▒▒]  │  ← chỉ khi ô đang trống
│ Ghi chú / caption từ video           │
│ [ Đặt máy ngang hông, zoom 2x…    ]  │  ← không shimmer, AI không ghi đè
│ ( ◌ Đang xem ảnh và đọc ghi chú… )   │  ← nút khoá, spinner
│ ┌──────────────────────────────────┐ │
│ │ Thêm chi tiết              ◌     │ │
│ │ AI đang điền giúp…               │ │
│ └──────────────────────────────────┘ │
│ ( Huỷ )  [        Lưu dáng        ]  │  ← vẫn bấm được
```

**C. AI điền xong → chi tiết tự mở**
```
│ ┌──────────────────────────────────┐ │
│ │ Thêm chi tiết              ⌃     │ │
│ │ ✨ AI đã điền 6 mục, bạn xem lại │ │
│ └──────────────────────────────────┘ │
│ Không biết mục nào thì cứ để         │
│ "Không rõ", sau này bổ sung cũng được.│
│ Cách cầm máy                         │
│ Máy cao ngang đâu? ✨                │
│ ┌──────┐┌──────┐┌──────┐┌──────┐     │
│ │  ◫   ││  ◫   ││  ◫   ││ ✓◫   │     │
│ │Trên  ││Ngang ││Ngang ││Ngang │     │
│ │đầu   ││mắt   ││ngực  ││hông  │     │
│ └──────┘└──────┘└──────┘└──────┘     │
│ ┌──────┐┌──────┐┌╌╌╌╌╌╌┐             │
│ │Ngang ││Sát   │╎  ?   ╎             │
│ │gối   ││đất   │╎Không rõ╎           │
│ └──────┘└──────┘└╌╌╌╌╌╌┘             │
│ Hạ máy xuống ngang hông người được   │
│ chụp. Chân trông dài hơn.            │
│ Máy ngửa hay cúi?                    │
│ [Thẳng][Hất lên][Chúc xuống][✓Không rõ]│
│ Zoom mấy? … Ảnh dọc hay ngang? …     │
│ Người chụp đứng ở đâu [            ] │
│ Cách tạo dáng                        │
│ ⠿ 1 [ Bắt chéo chân…            ] 🗑 │
│ + Thêm bước                          │
│ Phân loại … Địa điểm & nguồn …       │
```

**D. AI bị khoá (chưa cài API key)**
```
│ Ghi chú / caption từ video           │
│ [                                  ] │
│ ( ✨ AI điền giúp )   ← mờ, disabled │
│ 🔒 🔑 AI đang tạm khoá vì chưa cài   │
│ API key. Nhờ admin thêm              │
│ ANTHROPIC_API_KEY nha.               │
│ ┌──────────────────────────────────┐ │
│ │ Thêm chi tiết              ⌄     │ │
│ │ Không bắt buộc · cách cầm máy,…  │ │
│ └──────────────────────────────────┘ │
```
Khi khoá: `FeatureLockedHint` luôn hiện ngay dưới nút và **thay** dòng giải thích "AI xem ảnh và đọc ghi chú…" (không hiện cả hai). Phần còn lại của form dùng bình thường, lưu nhanh vẫn 2 lần chạm.

### 1.4 Microcopy

| Chỗ | Chuỗi |
|---|---|
| Nhãn tên | Tên dáng * |
| Placeholder tên | vd: Ngồi sofa nhìn ra cửa sổ *(giữ nguyên)* |
| Lỗi thiếu tên | Nhập tên dáng nhé *(giữ nguyên)* |
| Nhãn caption | Ghi chú / caption từ video |
| Placeholder caption | Dán caption hoặc mẹo trong video vào đây. vd: "Đặt máy ngang hông, zoom 2x, nghiêng vai về phía máy cho mặt nhỏ nha các bà 📸" |
| Hint caption (thường) | Không có thì bỏ trống cũng được. |
| Hint caption (≥ 1600 ký tự) | {n}/2000 |
| Dán quá dài | Caption dài quá nên mình cắt còn 2000 ký tự nhé. *(toast)* |
| Nút AI | ✨ AI điền giúp |
| Dưới nút AI, đã có ảnh | AI xem ảnh và đọc ghi chú ở trên rồi điền các ô còn trống. Mỗi lần bấm tính 1 lượt. |
| Dưới nút AI, chưa có ảnh | Thêm ít nhất 1 ảnh để AI điền giúp nhé. *(giữ nguyên)* |
| Dưới nút AI, bị khoá | 🔑 AI đang tạm khoá vì chưa cài API key. Nhờ admin thêm ANTHROPIC_API_KEY nha. *(giữ nguyên)* |
| Nút AI đang chạy, có caption | Đang xem ảnh và đọc ghi chú… |
| Nút AI đang chạy, không caption | Đang ngắm ảnh… |
| Nút mở chi tiết | Thêm chi tiết |
| Dòng phụ, đang đóng, chưa có gì | Không bắt buộc · cách cầm máy, các bước, địa điểm… |
| Dòng phụ, đang đóng, đã có `n` mục | Đã điền {n} mục · chạm để xem |
| Dòng phụ, AI đang chạy | AI đang điền giúp… |
| Dòng phụ, AI vừa xong (đến khi người dùng sửa ô đầu tiên) | ✨ AI đã điền {n} mục, bạn xem lại nhé |
| Dòng phụ, đang mở | Không bắt buộc |
| Câu đầu phần chi tiết | Không biết mục nào thì cứ để "Không rõ", sau này bổ sung cũng được. |
| Toast AI xong | AI đã điền {n} mục, bạn xem lại nhé ✨ *(giữ nguyên)* |
| Toast AI không điền gì | AI chưa nhìn ra thêm gì. Bạn điền tay hoặc để sau nhé. |
| Toast AI lỗi / hết lượt | *(giữ nguyên trong `use-ai-autofill.ts`)* |
| Toast lưu xong | Đã lưu dáng 💗 |
| Toast thiếu ảnh khi đăng | Thêm ít nhất 1 ảnh nhé. Chưa có ảnh thì mở "Thêm chi tiết" rồi chọn Nháp. |
| Nhãn bước trống | Chưa có bước nào. Viết vài bước ngắn kiểu "Nghiêng vai", "Nhìn xuống". |
| Nhãn tips | Mẹo cho người chụp *(giữ nguyên)* |
| Nhãn lưới | Người đứng chỗ nào trong khung? *(thay "Vị trí chủ thể trên lưới")* |
| Lưới khi chưa có ảnh | Thêm ảnh trước rồi chạm vào ảnh để đánh dấu chỗ người đứng. |

`n` trong "Đã điền {n} mục" = số key chi tiết có giá trị theo `hasValue`.

---

## 2. Bộ chọn bằng hình (`PictogramSelect`)

### 2.1 Component

Component mới `src/components/ui/pictogram-select.tsx` (đề xuất tên), thay `SegmentedSelect` cho 6 trường enum trong form. `SegmentedSelect` vẫn dùng cho "Hiển thị".

- **Bố cục:** `grid grid-cols-4 gap-2`. Ở 390px mỗi ô rộng (358 − 3×8) / 4 = 83.5px, cao tối thiểu 76px (vượt 44px). Số ô kể cả "Không rõ": độ cao 7 (4+3), ngửa/cúi 4, zoom 6 (4+2), khung 4, số người 4, tư thế 7 (4+3).
- **Ô:** hình 32px ở trên, nhãn `label` (13/18, 500) ở dưới, căn giữa, padding 8px 4px, `--radius-sm`.
  - Chưa chọn: nền `--surface`, viền 1px `--border-strong`, hình `--text-2`, chữ `--text`.
  - Đã chọn: nền `--primary-soft`, viền 1.5px `--primary`, hình và chữ `--on-primary-soft`, dấu tích 14px ở góc trên phải (không chỉ dựa vào màu). Cùng kiểu với `FilterChip` đã chọn.
  - Nhấn: `scale(0.97)` trong `--dur-fast`.
- **Ô "Không rõ"** luôn đứng cuối, dùng hình `unknown`. Giá trị = `undefined` (để trống, không phải lỗi).
  - Đang là lựa chọn hiện tại (mặc định khi chưa có giá trị): nền `--surface-3`, viền 1px liền `--border-strong`, hình và chữ `--text-2`, có dấu tích. Cố ý trung tính để form mới mở không đỏ hồng cả 6 nhóm.
  - Không phải lựa chọn hiện tại: nền `--surface`, viền 1px **nét đứt** `--border-strong`, hình và chữ `--text-2`.
  - Bấm lại ô đang chọn không bỏ chọn nữa; muốn bỏ thì bấm "Không rõ".
  - **Lưu ý cho dev (đã kiểm tra `use-pose-form-state.ts`):** `set(key, undefined)` hiện thêm key vào `locked`, nên sau khi chọn "Không rõ" AI sẽ không điền ô đó. Hành vi đúng: chọn "Không rõ" phải **gỡ** key khỏi `locked`, vì ô trống là ô AI được phép điền.
- **Dòng giải thích:** ngay dưới lưới, một dòng `label` màu `--text-2`, hiện lời giải thích của lựa chọn đang chọn. Khi đang "Không rõ" thì không hiện gì (không chừa chỗ trống). Tối đa 2 dòng.
- **Câu hỏi làm nhãn nhóm:** `label` 13/18, 600, `--text`; chấm "✨" cạnh nhãn khi AI vừa điền (theo design.md, `FlashField` giữ nguyên).

**Nhãn ngắn giữ nguyên** theo `pose-labels.ts` (đã kiểm tra). Lý do: cùng một từ xuất hiện trên thẻ dáng, bộ lọc, trang chi tiết và form, người dùng chỉ phải học một lần. Phần "dễ hiểu" đến từ câu hỏi đầu nhóm, hình và dòng giải thích. Lời giải thích đặt trong map mới cạnh `*_LABELS` (đề xuất tên `CAMERA_HEIGHT_HINTS`, `CAMERA_TILT_HINTS`, `ZOOM_HINTS`, `ORIENTATION_HINTS`, `PEOPLE_COUNT_HINTS`, `POSTURE_HINTS`).

### 2.2 Bảng lựa chọn

**Máy cao ngang đâu?** (`cameraHeight`) — so với người được chụp đang đứng.

| Giá trị | Nhãn | Giải thích | Hình |
|---|---|---|---|
| `overhead` | Trên đầu | Giơ máy cao hơn đầu người được chụp, chụp từ trên xuống. | `height-overhead`: máy chếch ở góc trên, chấm ngắm đi xuống đầu |
| `eye` | Ngang mắt | Máy ngang tầm mắt người được chụp, như lúc hai người đứng nói chuyện. | `height-eye`: máy ngang đầu |
| `chest` | Ngang ngực | Hạ máy xuống ngang ngực người được chụp. | `height-chest`: máy ngang vai/ngực |
| `waist` | Ngang hông | Hạ máy xuống ngang hông (chỗ cạp quần). Chân trông dài hơn. | `height-waist`: máy ngang chỗ chân nối thân |
| `knee` | Ngang gối | Người chụp ngồi xổm hoặc quỳ, máy ngang đầu gối người được chụp. | `height-knee`: máy ngang giữa chân |
| `ground` | Sát đất | Đặt máy gần chạm đất rồi chụp hắt lên. Người trông cao hẳn. | `height-ground`: máy nằm trên vạch đất, chấm ngắm đi lên |

**Máy ngửa hay cúi?** (`cameraTilt`)

| Giá trị | Nhãn | Giải thích | Hình |
|---|---|---|---|
| `level` | Thẳng | Giữ máy thẳng đứng, không ngửa, không cúi. | `tilt-level`: máy nhìn ngang, mũi tên thẳng |
| `up` | Hất lên | Ngửa đầu máy ra sau một chút để ống kính hướng lên. | `tilt-up`: máy ngửa, mũi tên chếch lên |
| `down` | Chúc xuống | Cúi đầu máy về trước để ống kính hướng xuống. | `tilt-down`: máy cúi, mũi tên chếch xuống |

**Zoom mấy?** (`zoom`) — con số trên nút zoom của camera điện thoại.

| Giá trị | Nhãn | Giải thích | Hình |
|---|---|---|---|
| `0.5x` | 0.5x | Góc siêu rộng: lấy được nhiều cảnh, người nhỏ lại. | `zoom-0.5x`: người tí hon giữa khung |
| `1x` | 1x | Camera thường, mở lên là chụp, không zoom gì cả. | `zoom-1x`: cả người vừa khung |
| `2x` | 2x | Gần gấp đôi, hợp chụp nửa người. | `zoom-2x`: nửa người trên |
| `3x` | 3x | Cận hơn nữa, hợp chụp chân dung. Người chụp phải lùi ra xa. | `zoom-3x`: đầu và vai |
| `5x` | 5x | Rất cận, chỉ một số máy có. Dùng khi đứng rất xa. | `zoom-5x`: khuôn mặt kín khung |

**Ảnh dọc hay ngang?** (`orientation`)

| Giá trị | Nhãn | Giải thích | Hình |
|---|---|---|---|
| `portrait` | Dọc | Cầm máy đứng. Hợp đăng story, TikTok. | `orient-portrait` |
| `landscape` | Ngang | Xoay ngang máy, lấy được nhiều cảnh hai bên. | `orient-landscape` |
| `square` | Vuông | Ảnh vuông 1:1. | `orient-square` |

**Mấy người trong ảnh?** (`peopleCount`)

| Giá trị | Nhãn | Giải thích | Hình |
|---|---|---|---|
| `solo` | 1 người | Chụp một mình. | `people-solo` |
| `duo` | 2 người | Chụp đôi: bạn thân, cặp đôi. | `people-duo` |
| `group` | Nhóm | Từ 3 người trở lên. | `people-group` |

**Tư thế chính** (`posture`)

| Giá trị | Nhãn | Giải thích | Hình |
|---|---|---|---|
| `stand` | Đứng | Đứng thẳng hoặc đứng thả lỏng. | `posture-stand` |
| `sit` | Ngồi | Ngồi trên ghế, bậc thềm, sofa… | `posture-sit`: nhìn ngang, có mặt ghế |
| `lean` | Dựa | Tựa lưng, vai hoặc tay vào tường, lan can, bàn. | `posture-lean`: có vạch tường bên trái |
| `lie` | Nằm | Nằm trên giường, bãi cỏ, bãi cát… | `posture-lie`: có vạch đất, một gối co |
| `walk` | Đi | Đang bước đi, chụp lúc chuyển động. | `posture-walk`: chân sải, tay vung |
| `squat` | Ngồi xổm | Gập gối ngồi thấp, mông không chạm đất. | `posture-squat`: nhìn thẳng, hai gối mở |

**Không rõ** (mọi nhóm): hình `unknown` (vòng tròn nét đứt + dấu hỏi), không có dòng giải thích.

### 2.3 SVG

Một họ hình: viewBox 32×32, chỉ nét, `currentColor`, nét 2px, đầu và góc bo tròn (khớp Lucide). Người = chấm đầu + thân que; máy = chữ nhật bo góc; đường chấm = hướng máy nhìn. 27 hình, đã render thử ở 32px và 96px trên nền `--surface`, màu `--text` (đã kiểm tra bằng mắt qua ảnh chụp Chromium; chưa thử trên máy thật và chưa thử dark mode).

Dùng: đặt sprite dưới đây một lần trong layout (hoặc tách mỗi `<symbol>` thành một component React, giữ nguyên nội dung bên trong), rồi vẽ bằng:

```html
<svg width="32" height="32" fill="none" stroke="currentColor" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
  <use href="#height-waist"/>
</svg>
```

```html
<svg xmlns="http://www.w3.org/2000/svg" style="display:none">
<symbol id="height-overhead" viewBox="0 0 32 32"><circle cx="22" cy="10" r="2.5"/><path d="M22 12.5V21l-3 8m3-8 3 8M18.5 18.5 22 15l3.5 3.5"/><rect x="4" y="2" width="7" height="5" rx="1.2" transform="rotate(30 7.5 4.5)"/><path d="m12.5 7.5 4.5 2.5" stroke-dasharray="1 3"/></symbol>
<symbol id="height-eye" viewBox="0 0 32 32"><circle cx="22" cy="8" r="2.5"/><path d="M22 10.5V20l-3 9m3-9 3 9M18.5 17l3.5-4 3.5 4"/><rect x="5" y="4.5" width="5" height="7" rx="1.2"/><path d="M12.5 8h4.5" stroke-dasharray="1 3"/></symbol>
<symbol id="height-chest" viewBox="0 0 32 32"><circle cx="22" cy="8" r="2.5"/><path d="M22 10.5V20l-3 9m3-9 3 9M18.5 17l3.5-4 3.5 4"/><rect x="5" y="10" width="5" height="7" rx="1.2"/><path d="M12.5 13.5h4.5" stroke-dasharray="1 3"/></symbol>
<symbol id="height-waist" viewBox="0 0 32 32"><circle cx="22" cy="8" r="2.5"/><path d="M22 10.5V20l-3 9m3-9 3 9M18.5 17l3.5-4 3.5 4"/><rect x="5" y="16.5" width="5" height="7" rx="1.2"/><path d="M12.5 20h5" stroke-dasharray="1 3"/></symbol>
<symbol id="height-knee" viewBox="0 0 32 32"><circle cx="22" cy="8" r="2.5"/><path d="M22 10.5V20l-3 9m3-9 3 9M18.5 17l3.5-4 3.5 4"/><rect x="5" y="21" width="5" height="7" rx="1.2"/><path d="M12.5 24.5h4.5" stroke-dasharray="1 3"/></symbol>
<symbol id="height-ground" viewBox="0 0 32 32"><circle cx="22" cy="7" r="2.5"/><path d="M22 9.5V19l-3 9m3-9 3 9M18.5 16l3.5-4 3.5 4"/><rect x="4" y="23" width="7" height="5" rx="1.2"/><path d="m13 22.5 4-3.5" stroke-dasharray="1 3"/><path d="M2 30.5h28"/></symbol>
<symbol id="tilt-level" viewBox="0 0 32 32"><rect x="7" y="9" width="5" height="14" rx="1.5"/><path d="M16 16h10m-3.5-3.5L26 16l-3.5 3.5"/></symbol>
<symbol id="tilt-up" viewBox="0 0 32 32"><g transform="rotate(-28 13 16)"><rect x="7" y="9" width="5" height="14" rx="1.5"/><path d="M16 16h10m-3.5-3.5L26 16l-3.5 3.5"/></g></symbol>
<symbol id="tilt-down" viewBox="0 0 32 32"><g transform="rotate(28 13 16)"><rect x="7" y="9" width="5" height="14" rx="1.5"/><path d="M16 16h10m-3.5-3.5L26 16l-3.5 3.5"/></g></symbol>
<symbol id="zoom-0.5x" viewBox="0 0 32 32"><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="12.5" r="1.5"/><path d="M16 14.5v4l-2 4.5m2-4.5 2 4.5M9 25.5h14" stroke-width="1.75"/></symbol>
<symbol id="zoom-1x" viewBox="0 0 32 32"><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="8.5" r="2.2"/><path d="M16 11v7.5l-2.5 7m2.5-7 2.5 7M12.5 16l3.5-3.5 3.5 3.5"/></symbol>
<symbol id="zoom-2x" viewBox="0 0 32 32"><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="11" r="3"/><path d="M9.5 28v-4.5a6.5 6.5 0 0 1 13 0V28"/></symbol>
<symbol id="zoom-3x" viewBox="0 0 32 32"><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="13" r="4.5"/><path d="M6 28a10 10 0 0 1 20 0"/></symbol>
<symbol id="zoom-5x" viewBox="0 0 32 32"><rect x="4" y="3" width="24" height="26" rx="3"/><circle cx="16" cy="16" r="8"/><path d="M13 14v1m6-1v1m-6.5 4q3.5 2.5 7 0"/></symbol>
<symbol id="orient-portrait" viewBox="0 0 32 32"><rect x="9" y="3" width="14" height="26" rx="3"/><circle cx="16" cy="13" r="2.2"/><path d="M12 22.5a4 4 0 0 1 8 0"/></symbol>
<symbol id="orient-landscape" viewBox="0 0 32 32"><rect x="3" y="9" width="26" height="14" rx="3"/><circle cx="16" cy="14" r="1.8"/><path d="M12.5 20a3.5 3.5 0 0 1 7 0"/></symbol>
<symbol id="orient-square" viewBox="0 0 32 32"><rect x="6" y="6" width="20" height="20" rx="3"/><circle cx="16" cy="13.5" r="2.2"/><path d="M12 22a4 4 0 0 1 8 0"/></symbol>
<symbol id="people-solo" viewBox="0 0 32 32"><circle cx="16" cy="10" r="4"/><path d="M8 27a8 8 0 0 1 16 0"/></symbol>
<symbol id="people-duo" viewBox="0 0 32 32"><circle cx="10.5" cy="11" r="3.2"/><circle cx="21.5" cy="11" r="3.2"/><path d="M4 26a6.5 6.5 0 0 1 12-3.4M16 26a6.5 6.5 0 0 1 12 0"/></symbol>
<symbol id="people-group" viewBox="0 0 32 32"><circle cx="16" cy="9" r="3.2"/><path d="M9.5 25a6.5 6.5 0 0 1 13 0"/><circle cx="6" cy="14" r="2.2"/><circle cx="26" cy="14" r="2.2"/><path d="M2 26a4.5 4.5 0 0 1 4-4.4M30 26a4.5 4.5 0 0 0-4-4.4"/></symbol>
<symbol id="posture-stand" viewBox="0 0 32 32"><circle cx="16" cy="5.5" r="2.5"/><path d="M16 8v11l-3 10m3-10 3 10M12 16l4-4.5 4 4.5"/></symbol>
<symbol id="posture-sit" viewBox="0 0 32 32"><circle cx="12" cy="6.5" r="2.5"/><path d="M12 9v10h7.5v9.5M12 12.5l5.5 3.5"/><path d="M6.5 23h9m-4.5 0v6"/></symbol>
<symbol id="posture-lean" viewBox="0 0 32 32"><path d="M6 3v26"/><circle cx="11.5" cy="7" r="2.5"/><path d="M12 9.5l4 9.5 5.5 10M16 19l-1.5 10M12.5 12.5l5.5 2.5"/></symbol>
<symbol id="posture-lie" viewBox="0 0 32 32"><circle cx="6" cy="19" r="2.5"/><path d="M8.5 21.5h11l4-5.5 4 5.5M19.5 21.5h9M3 26h26"/></symbol>
<symbol id="posture-walk" viewBox="0 0 32 32"><circle cx="16" cy="5.5" r="2.5"/><path d="M16 8v10l-5 10.5M16 18l4 5 1 5.5M11 16l5-4.5 4 3 2 3.5"/></symbol>
<symbol id="posture-squat" viewBox="0 0 32 32"><circle cx="16" cy="8" r="2.5"/><path d="M16 10.5v8.5l-6 1.5 1.5 8M16 19l6 1.5-1.5 8M16 13l-5 4.5m5-4.5 5 4.5"/></symbol>
<symbol id="unknown" viewBox="0 0 32 32"><circle cx="16" cy="16" r="12" stroke-dasharray="2 4.28"/><path d="M12.5 13a3.5 3.5 0 1 1 5 3.2c-1 .6-1.5 1.3-1.5 2.3M16 22.5v.01"/></symbol>
</svg>
```

Ở cỡ 20px trở xuống (SpecCard, bộ lọc) nên đặt `stroke-width="2.5"` trên thẻ `<svg>` dùng lại để nét không bị mảnh (chưa kiểm chứng bằng mắt).

---

## 3. "Thiếu thông số"

### 3.1 Quy tắc

Một dáng **thiếu thông số** khi `camera_height` là null **hoặc** `model_steps` rỗng. Chỉ hai điều kiện này; thiếu zoom, tag, địa điểm… không tính. Viết thành một hàm thuần dùng chung (đề xuất `isMissingSpecs({ cameraHeight, stepCount })`) để thẻ, trang chi tiết và unit test cùng một nguồn. `PoseCardData` đã có đủ dữ liệu: `cameraHeight` và `modelStepsPreview.length` (đã kiểm tra `pose.ts`).

### 3.2 Nhãn trên thẻ dáng

- **Chữ:** "Thiếu thông số" (đúng chuỗi trong phase file, e2e bám vào chuỗi này).
- **Vị trí:** trong hàng chip dưới tên dáng, đứng **sau** các `CameraChip` (nếu có zoom thì vẫn hiện chip zoom trước). Không đè lên ảnh, để ảnh sạch và nhãn không lấn nút tim.
- **Kiểu:** cùng kích thước `CameraChip` (cao 26px, padding ngang 8px, `--radius-full`, chữ `label` 13px). Nền trong suốt (thẻ là `--surface`), viền 1px **nét đứt** `--border-strong`, chữ `--text-2`, icon bút Lucide 12px bên trái (`aria-hidden`). Không dùng `--danger`, không dùng `--ai`, không dấu chấm than: nó là lời nhắc, không phải lỗi.
- Không bấm được riêng (cả thẻ là một link), nên không cần 44px.
- Tương phản: `--text-2` trên `--surface` 6.71 (light) / 8.66 (dark); viền `--border-strong` trên `--surface` 3.71 / 4.19 (số lấy từ bảng 2.2 của design.md).

```
│ Ngồi sofa đọc sách      │
│ (2x) ┆✎ Thiếu thông số┆ │
```

### 3.3 Bộ lọc "Cần bổ sung"

- **Vị trí:** trong `PoseFilterSheet`, một hàng công tắc ngay dưới "Chỉ dáng yêu thích", cùng kiểu (`role="switch"`, cao ≥ 44px, nền `--surface-2`, `--radius-md`).
- **Chữ:** dòng chính "Cần bổ sung"; dòng phụ `caption` `--text-2`: "Dáng chưa có cách cầm máy hoặc các bước tạo dáng".
- **URL (đề xuất):** `need=1`, cùng kiểu với `fav=1` trong `filters-url.ts`; trường `PoseFilters.needsDetails?: boolean`. Có tính vào số trên nút "Bộ lọc".
- **Áp dụng:** như các bộ lọc khác, chỉ có hiệu lực khi bấm "Xem {n} dáng"; số đếm cập nhật trực tiếp.
- **Empty state khi chỉ bật mỗi bộ lọc này mà không có dáng nào:** tiêu đề "Dáng nào cũng đủ thông số rồi 🎉", mô tả "Không còn dáng nào cần bổ sung.", nút "Xoá bộ lọc". Nếu còn bộ lọc khác đang bật thì dùng empty state "Không tìm thấy dáng nào hợp" sẵn có.
- Không thêm chip "Cần bổ sung" vào hàng lọc nhanh (hàng đó dành cho lúc đi chụp).

### 3.4 Lời mời trên trang chi tiết

Hiện ở đúng chỗ mà phần bị thiếu lẽ ra xuất hiện. Hiện tại `PoseSpecCard` và `PoseStepList` trả về `null` khi trống (đã kiểm tra), nên trang có ảnh và tên rồi hết.

| Thiếu gì | Vị trí | Câu | Nút | Link |
|---|---|---|---|---|
| Chỉ độ cao máy | Chỗ SpecCard. Nếu SpecCard vẫn có ô khác (zoom, khung…) thì SpecCard hiện bình thường, lời mời nằm ngay dưới. | Chưa có cách cầm máy, bạn biết thì bổ sung nha ✍️ | Bổ sung cách cầm máy | `/poses/{id}/edit?focus=camera` |
| Chỉ các bước | Chỗ StepList | Chưa có các bước tạo dáng, bạn biết thì bổ sung nha ✍️ | Thêm bước tạo dáng | `/poses/{id}/edit?focus=steps` |
| Cả hai | Một khối duy nhất ở chỗ SpecCard (không hiện hai khối) | Dáng này mới có ảnh thôi. Bạn biết cách chụp thì bổ sung nha ✍️ | Bổ sung chi tiết | `/poses/{id}/edit?focus=camera` |

- **Kiểu khối:** nền `--surface-2`, viền 1px nét đứt `--border-strong`, `--radius-md`, padding 16px. Câu mời dùng `body` `--text`; nút kiểu **Phụ** (cao 48px, nền `--surface`, viền 1.5px `--border-strong`, chữ `--text`), icon bút 20px, rộng theo nội dung, cách câu mời 12px. Không dùng nút Chính, vì hành động chính của trang vẫn là "Thêm vào buổi chụp".
- Khối là `<section aria-label="Cần bổ sung">`; emoji ✍️ `aria-hidden`.
- Ai thấy được mục "Sửa dáng" trong menu "⋯" thì thấy nút (hiện menu này hiện cho mọi thành viên; quyền sửa thực tế theo RLS thì chưa kiểm chứng). Nếu sau này giới hạn quyền sửa, người không có quyền chỉ thấy câu "Chưa có cách cầm máy." và không có nút.

**Hành vi `?focus=`** ở trang `/poses/{id}/edit`:
1. Chỉ nhận `camera` hoặc `steps`; giá trị khác thì bỏ qua, form mở như bình thường.
2. "Thêm chi tiết" mở ngay từ lần render đầu (không có hiệu ứng mở).
3. Sau khi mount, cuộn `#section-camera` hoặc `#section-steps` lên đỉnh. Hai section có `scroll-margin-top` bằng chiều cao header dính + 12px. Cuộn `smooth`, hoặc nhảy thẳng khi `prefers-reduced-motion`.
4. Đưa focus bàn phím vào điều khiển đầu tiên của nhóm: với `camera` là ô đầu của "Máy cao ngang đâu?"; với `steps` là ô nhập bước 1 nếu đã có bước, không thì nút "Thêm bước". Dùng `focus({ preventScroll: true })`. Không tự mở bàn phím ảo (không focus vào input trống do mình tự tạo).
5. Lưu xong quay về trang chi tiết như hiện tại. Dáng đã đủ hai điều kiện thì nhãn và lời mời tự mất; không cần toast riêng ngoài "Đã lưu dáng 💗".

---

## 4. Ô "Ghi chú / caption từ video"

- **Dữ liệu:** trường `description` sẵn có, tối đa **2000** ký tự (`poseDraftSchema`, đã kiểm tra). Không thêm cột mới. Nhãn cũ "Mô tả" bị thay.
- **Vị trí:** ngay dưới Tên dáng, ngay trên nút ✨. Thứ tự này tự nó nói lên "viết/dán ở đây rồi bấm ✨".
- **Kích thước:** `Textarea` 3 dòng, tự cao dần theo nội dung tới tối đa 8 dòng rồi cuộn bên trong. Cỡ chữ 16px.
- **Placeholder, hint, bộ đếm:** xem bảng 1.4. Bộ đếm chỉ hiện từ 1600 ký tự (80%), để ô trông nhẹ khi trống. `maxLength={2000}`; khi dán vượt giới hạn, trình duyệt tự cắt, form hiện thêm toast "Caption dài quá nên mình cắt còn 2000 ký tự nhé."
- **Giải thích với người dùng rằng ✨ đọc cả ảnh và chữ:** dòng dưới nút AI ("AI xem ảnh và đọc ghi chú ở trên rồi điền các ô còn trống. Mỗi lần bấm tính 1 lượt.") và chữ trên nút khi đang chạy ("Đang xem ảnh và đọc ghi chú…", chỉ khi ô caption có chữ). Không thêm nút AI thứ hai, không thêm hộp thoại xác nhận: vẫn một nút, một lượt.
- **Ràng buộc giữ nguyên:** AI không sửa ô caption người dùng đã nhập (`description` nằm trong `locked` ngay khi gõ, đã kiểm tra). Caption là dữ liệu, không phải lệnh cho AI; việc chống prompt injection nằm ở prompt phía server, giao diện không cần cảnh báo gì.
- **Trang chi tiết:** `description` đang hiện thành một đoạn dưới tên dáng. Caption dán từ TikTok thường dài và nhiều hashtag, nên thêm `whitespace-pre-line`, cắt 4 dòng và nút chữ "Xem thêm" / "Thu gọn" (đề xuất; nằm ngoài 5 mục đã duyệt, làm nếu dev thấy rẻ).

---

## 5. Accessibility và ánh xạ sang component/token

### 5.1 Accessibility

- **Bộ chọn bằng hình:** nhóm là `role="radiogroup"` với `aria-labelledby` trỏ tới câu hỏi. Mỗi ô là `<button role="radio" aria-checked>`; tên đọc được là nhãn chữ nhìn thấy ("Ngang hông", "Không rõ"), hình SVG `aria-hidden="true"`. Mỗi ô có `aria-describedby` trỏ tới lời giải thích của chính nó (một `<span class="sr-only">` cho mỗi ô), để trình đọc màn hình nghe được giải thích trước khi chọn. Dòng giải thích nhìn thấy dưới lưới là `aria-hidden` để không đọc hai lần.
- **Bàn phím:** giữ cách làm của `FilterChip` hiện tại: mỗi ô là một điểm dừng Tab, Space/Enter để chọn. Không bắt buộc roving tabindex.
- **Vùng chạm:** ô chọn 83.5×76px; nút "Thêm chi tiết" cao tối thiểu 64px, bấm được trên cả bề rộng; nút trong lời mời 48px; công tắc "Cần bổ sung" ≥ 44px. Các ô cách nhau 8px.
- **Nút "Thêm chi tiết":** `<button type="button" aria-expanded aria-controls="pose-details">`; vùng nội dung `<div id="pose-details" role="group" aria-label="Chi tiết không bắt buộc" hidden>`. Dòng phụ nằm trong nút nên được đọc cùng tên nút. Mũi tên là Lucide chevron, xoay 180° trong `--dur-base`.
- **Thứ tự focus:** ảnh → Tên dáng → caption → ✨ → "Thêm chi tiết" → (nếu mở) Cách cầm máy → Cách tạo dáng → Phân loại → Địa điểm & nguồn → Huỷ → Lưu dáng. Trùng thứ tự DOM, không dùng `tabindex` dương.
- **AI xong:** toast `role="status"` đã có. Khi phần chi tiết tự mở, **không** chuyển focus (người dùng có thể đang gõ tên); chỉ cuộn.
- **Reduced motion:** quy tắc chung trong `globals.css` đã rút mọi transition/animation về ~0ms (đã kiểm tra). Thêm: cuộn tự động dùng `behavior: 'auto'`; shimmer chờ AI thay bằng nền `--ai-soft` tĩnh; mở/đóng chi tiết hiện ngay, không trượt.
- **Không chỉ dựa vào màu:** ô đã chọn có dấu tích; "Không rõ" khác bằng viền nét đứt và dấu hỏi; nhãn "Thiếu thông số" có icon bút và chữ.
- **Phóng chữ 200%:** lưới ô chọn chuyển `grid-cols-3` rồi `grid-cols-2` khi nhãn không vừa một dòng (dùng `minmax(76px, 1fr)` với `auto-fill`, chưa kiểm chứng trên máy thật). Nhãn được xuống 2 dòng, không cắt cụt.

### 5.2 Dùng lại gì, thêm gì

| Phần | Dùng lại | Thay đổi |
|---|---|---|
| Ô tên, caption | `Input`, `Textarea` (đã có prop `hint`), `FlashField` | Đổi nhãn/placeholder; caption tự cao |
| Nút AI | `AiFillButton`, `Button variant="ai"`, `FeatureLockedHint` | Đổi vị trí, thêm dòng giải thích, chữ khi chạy tuỳ theo có caption |
| Thêm chi tiết | Kiểu thẻ: nền `--surface`, viền 1px `--border-strong`, `--radius-md`, padding 12×16; tiêu đề `body-strong`, dòng phụ `label` `--text-2` (dòng AI dùng `--ai`) | Component mới, nhỏ |
| Bộ chọn bằng hình | Màu và dấu tích của `FilterChip`; `--radius-sm` | Component mới `PictogramSelect` + 27 hình |
| Nhãn thẻ | Kích thước `CameraChip` | Biến thể viền nét đứt |
| Bộ lọc | Hàng công tắc "Chỉ dáng yêu thích" | Thêm một hàng + dòng phụ |
| Lời mời | `--surface-2`, nút Phụ | Component mới, nhỏ |
| Toast, empty state | `useToast`, `EmptyState` | Chỉ thêm chuỗi |

**Không thêm token mới.** Mọi cặp màu dùng ở trên đã có trong bảng 2.2 của design.md: `--text-2` trên `--surface` 6.71, `--text` trên `--surface-2` 12.42, `--text-2` trên `--surface-3` 5.44, `--on-primary-soft` trên `--primary-soft` 5.85, `--ai` trên `--ai-soft` 6.10, viền `--border-strong` trên `--surface` 3.71 (light). Một cặp chưa có trong bảng: dòng phụ màu `--ai` trên nền `--surface`, tính bằng công thức WCAG 2.x trong lúc viết: **6.92** ở light (#7A5200 trên #FFFFFF), **12.68** ở dark (#FFDF8A trên #271C22), đều đạt 4.5 (đã kiểm tra). Ô "Không rõ" đang chọn ở dark (`--text-2` trên `--surface-3`, design.md ghi "chưa tính"): **6.78** (đã kiểm tra).

Hình vẽ trong SpecCard và bộ lọc (design.md mục 4 đã dự định "icon tự vẽ" cho độ cao và góc nghiêng): có thể dùng lại chính 27 hình này thay các icon Lucide chung chung trong `pose-spec-card.tsx`. Ngoài phạm vi 5 mục đã duyệt, ghi lại để làm sau.

---

## 6. Chưa kiểm chứng / câu hỏi mở

1. Tên tham số `need=1`, tên `needsDetails`, `isMissingSpecs`, `PictogramSelect`, `*_HINTS` đều là đề xuất.
2. Hình SVG mới xem qua ảnh chụp Chromium ở 32px/96px, nền sáng. Chưa xem trên điện thoại thật, chưa xem dark mode, chưa thử với người dùng thật xem có đoán đúng nghĩa không (đáng thử nhất: `height-overhead` so với `height-eye`, `posture-lean`, `posture-lie`).
3. Dáng nháp do "AI gợi ý dáng" lưu (không có ảnh) cũng sẽ mang nhãn "Thiếu thông số" nếu thiếu độ cao máy hoặc các bước. Mình cho là đúng ý, vì nhãn nói về thông số chứ không nói về ảnh; nếu không muốn thì ẩn nhãn ở trang "Nháp".
4. Các câu giải thích zoom ("hợp chụp nửa người", "chỉ một số máy có") là kinh nghiệm chung về camera điện thoại, không đo trên máy cụ thể nào.
5. Quyền sửa dáng của thành viên không phải người đăng (ảnh hưởng tới việc ai thấy nút trong lời mời) chưa đối chiếu với RLS.
