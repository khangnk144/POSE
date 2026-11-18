# Design spec — thư viện dáng chụp ảnh cho team

Tài liệu này mô tả nhận diện, design tokens, component và 10 màn hình của app, dành cho frontend dev dùng Next.js + Tailwind CSS. Thiết kế ở bề rộng 390px trước, sau đó mở rộng lên tablet và desktop.

**Quyết định đã chốt với người dùng (2026-11-18), ưu tiên hơn mọi chỗ khác trong tài liệu:**
- Tên app: **Pose Xinh**. Logo theo mô tả ở mục 1, chỉ thay chữ.
- Điều hướng: **thanh tab đáy 4 mục** (Thư viện · AI gợi ý · Buổi chụp · Địa điểm) thay cho drawer ☰. Các mục phụ (Yêu thích, Nháp, Team, Hồ sơ) nằm trong menu avatar ở header. FAB "+" nằm phía trên thanh tab.
- Thêm dáng: AI **chỉ chạy khi người dùng bấm "✨ AI điền giúp"** (mỗi lần bấm là một lần gọi API tính phí). Nút chỉ bật khi đã có ít nhất 1 ảnh. Field nào người dùng đã nhập thì không ghi đè.
- **Chưa cài API key:** mọi nút AI mờ đi, disabled, không bấm được. Ngay dưới nút luôn hiện dòng *"🔑 AI đang tạm khoá vì chưa cài API key. Nhờ admin thêm `ANTHROPIC_API_KEY` nha."* (chữ `--text-2`, icon khoá). Không dùng tooltip.
- Bối cảnh là chip chọn từ danh sách cố định. Tag gõ tự do, có gợi ý từ các tag đã dùng.
- Dáng nháp ẩn khỏi thư viện chính, xem trong mục "Nháp". Yêu thích là riêng từng người. Một team cho mỗi deploy. Dark mode để sau (token đã định nghĩa sẵn).

**Quy ước độ tin cậy:** mục nào ghi "(đã kiểm tra)" là đã được chạy/tính trong lúc viết tài liệu. Mục nào ghi "(chưa kiểm chứng)" là đề xuất dựa trên hiểu biết chung, dev cần xác nhận lại khi cài đặt.

---

## 1. Tên app và logo

| # | Tên | Ý nghĩa | Nhận xét |
|---|---|---|---|
| 1 | **Dáng Ơi** | Tiếng gọi thân mật kiểu "bạn ơi" — bí dáng thì gọi "dáng ơi!" | Ngắn, thuần Việt, dễ nhớ, đọc lên đã thấy dễ thương. **Khuyến nghị.** |
| 2 | **Pô Xinh** | "Pô" là cách nói vui của "một tấm ảnh" | Vui, nhưng "pô" hơi khẩu ngữ và dễ gõ nhầm dấu. |
| 3 | **Mochi Dáng** | Mochi gợi cảm giác mềm, tròn, ngọt | Dễ thương nhưng ít nói lên công dụng; hợp làm tên linh vật hơn. |

Chưa kiểm chứng: việc trùng tên với app/nhãn hiệu khác và tên miền còn trống hay không.

**Logo "Pose Xinh" (mô tả bằng lời):**
- **Biểu tượng:** một ô vuông bo tròn lớn (radius khoảng 28% cạnh) màu `--primary`. Bên trong là bốn góc khung ngắm máy ảnh (viewfinder corners) màu trắng, nét tròn đầu. Giữa khung là một hình người tối giản đang tạo dáng: một chấm tròn làm đầu và một nét cong chữ S làm thân, lệch về giao điểm một-phần-ba bên trái — ngầm nói "đặt người vào đúng điểm vàng". Ở góc trên phải có một ngôi sao bốn cánh nhỏ màu `--ai` (vàng bơ) ám chỉ AI.
- **Chữ:** "Pose Xinh" bằng Quicksand 700, chữ "Pose" màu `--text`, chữ "Xinh" màu `--primary`. Không dùng chữ nghiêng có chân (đó là phong cách của app tham khảo).
- **Bản thu nhỏ (favicon, 32px):** chỉ giữ ô vuông, bốn góc khung ngắm và chấm đầu.

**Khác biệt so với app tham khảo:** app tham khảo dùng nền hồng-tím lạnh, logo serif nghiêng, thẻ có khối chữ tím nhạt dày đặc. "Pose Xinh" dùng nền kem đào ấm, màu nhấn hồng dâu + xanh matcha + vàng bơ, chữ tròn không chân, và thẻ ảnh gọn hơn (ảnh chiếm phần lớn, chỉ một dòng chip máy ảnh).

---

## 2. Design tokens

### 2.1 Màu — CSS custom properties

Ý tưởng bảng màu: **kem đào** làm nền để ảnh thật nổi lên, **hồng dâu** cho hành động chính, **matcha** cho trạng thái xong/thành công, **vàng bơ** dành riêng cho mọi thứ liên quan AI, **xanh trời** cho thông tin/địa điểm.

```css
:root {
  /* Nền và bề mặt */
  --bg: #FFF7F2;            /* nền trang, kem đào */
  --surface: #FFFFFF;       /* thẻ, sheet, input */
  --surface-2: #FDEEE6;     /* SpecCard, vùng nhấn nhẹ */
  --surface-3: #F6E4DA;     /* chip trung tính, skeleton */
  --border: #F0D9CD;        /* viền trang trí, đường kẻ */
  --border-strong: #A37C6E; /* viền input, viền cần nhìn rõ */

  /* Chữ */
  --text: #3B2530;          /* chữ chính, nâu mận */
  --text-2: #6E5560;        /* chữ phụ */
  --text-3: #7D626C;        /* placeholder, chú thích */

  /* Hành động chính */
  --primary: #CF3559;       /* hồng dâu */
  --primary-hover: #B92A4C;
  --on-primary: #FFFFFF;
  --primary-soft: #FFE1E6;
  --on-primary-soft: #A81E44;

  /* Ngữ nghĩa */
  --success: #1F6B4A;       --success-soft: #DDF2E4;  /* matcha */
  --ai: #7A5200;            --ai-soft: #FFF0C2;       /* vàng bơ */
  --info: #1F5F8B;          --info-soft: #DCEEFB;     /* xanh trời */
  --danger: #C62F3B;        --on-danger: #FFFFFF;

  /* Khác */
  --focus: #7A3FD1;                         /* vòng focus, tím */
  --scrim: rgb(59 37 48 / 0.72);            /* nền badge đè lên ảnh */
  --overlay: rgb(59 37 48 / 0.45);          /* lớp phủ sau sheet/drawer */
  --toast-bg: #3B2530;      --toast-text: #FFF7F2;

  /* Nền avatar pastel (chỉ đặt emoji lên, không đặt chữ) */
  --avatar-1: #FFD6DE; --avatar-2: #FFE3C7; --avatar-3: #FFF0B8; --avatar-4: #D9F2DE;
  --avatar-5: #CFEDEF; --avatar-6: #D6E4FF; --avatar-7: #E6DBFF; --avatar-8: #F7D9F0;
}

[data-theme="dark"] {
  --bg: #1C1418;
  --surface: #271C22;
  --surface-2: #32242C;
  --surface-3: #3D2D36;
  --border: #45333C;
  --border-strong: #927A84;

  --text: #F8EAEE;
  --text-2: #CDB6BF;
  --text-3: #AC96A0;

  --primary: #FF8FA6;
  --primary-hover: #FFA6B8;
  --on-primary: #3A0F1C;
  --primary-soft: #4A1F2C;
  --on-primary-soft: #FFC2CE;

  --success: #8FD9AE;       --success-soft: #1E3A2D;
  --ai: #FFDF8A;            --ai-soft: #43330C;
  --info: #A9D6F5;          --info-soft: #16324A;
  --danger: #FF8A8F;        --on-danger: #3A0F1C;

  --focus: #C9A6FF;
  --scrim: rgb(28 20 24 / 0.72);
  --overlay: rgb(0 0 0 / 0.6);
  --toast-bg: #F8EAEE;      --toast-text: #1C1418;
  /* --avatar-1..8 giữ nguyên: avatar pastel vẫn đẹp trên nền tối */
}
```

Dark mode bật theo `prefers-color-scheme` và có công tắc trong Hồ sơ (ghi đè bằng `data-theme` trên `<html>`).

Ở dark mode, cặp `--success` / `--success-soft`, `--ai` / `--ai-soft`, `--info` / `--info-soft` đảo vai sáng-tối nhưng cách dùng không đổi: màu "soft" luôn là nền, màu còn lại luôn là chữ/icon đặt trên nền đó.

### 2.2 Bảng tương phản (đã kiểm tra)

Tỉ lệ tính bằng công thức WCAG 2.x relative luminance, chạy bằng script Node trong lúc viết tài liệu. Ngưỡng: chữ thường ≥ 4.5:1, icon và viền điều khiển ≥ 3:1.

| Cặp (chữ trên nền) | Light | Dark |
|---|---|---|
| `--text` trên `--bg` | 13.29 | 15.48 |
| `--text` trên `--surface` | 14.06 | 14.11 |
| `--text` trên `--surface-2` | 12.42 | 12.63 |
| `--text` trên `--surface-3` | 11.40 | 11.06 |
| `--text-2` trên `--bg` | 6.34 | 9.50 |
| `--text-2` trên `--surface` | 6.71 | 8.66 |
| `--text-2` trên `--surface-2` | 5.92 | 7.75 |
| `--text-2` trên `--surface-3` | 5.44 | chưa tính |
| `--text-3` trên `--bg` | 5.17 | chưa tính |
| `--text-3` trên `--surface` | 5.48 | chưa tính |
| `--text-3` trên `--surface-2` | 4.84 | 5.35 |
| `--text-3` trên `--surface-3` | **4.44 (không đạt)** | chưa tính |
| `--on-primary` trên `--primary` | 4.88 | 7.69 |
| `--on-primary` trên `--primary-hover` | 6.00 | chưa tính |
| `--primary` (chữ/link) trên `--bg` | 4.61 | 8.37 |
| `--primary` (chữ/link) trên `--surface` | 4.88 | 7.63 |
| `--on-primary-soft` trên `--primary-soft` | 5.85 | 9.10 |
| `--success` trên `--success-soft` | 5.49 | 8.44 |
| `--ai` trên `--ai-soft` | 6.10 | 9.42 |
| `--info` trên `--info-soft` | 5.76 | 8.57 |
| `--danger` trên `--surface` | 5.43 | 7.28 |
| `--danger` trên `--bg` | 5.13 | chưa tính |
| `--toast-text` trên `--toast-bg` | 13.29 | 15.48 |
| `--border-strong` trên `--surface` (viền, cần ≥ 3) | 3.71 | 4.19 |
| `--border-strong` trên `--bg` (viền, cần ≥ 3) | 3.50 | 4.59 |
| `--focus` trên `--bg` (cần ≥ 3) | 5.73 | 8.93 |
| `--focus` trên `--surface` (cần ≥ 3) | 6.07 | 8.14 |
| Chữ trắng trên `--scrim` khi ảnh phía dưới trắng tinh (trường hợp xấu nhất) | 5.72 | chưa tính |

Quy tắc rút ra từ bảng:
- **Không** dùng `--text-3` trên `--surface-3` (4.44). Chữ trong chip trung tính dùng `--text` hoặc `--text-2`.
- **Không** dùng `--primary` làm chữ trên `--primary-soft` (3.99, đã tính). Dùng `--on-primary-soft`.
- `--border` (1.28 trên `--bg`) chỉ để trang trí, không dùng làm ranh giới duy nhất của input. Input dùng `--border-strong`.
- `--focus` trên nền `--primary` chỉ đạt 1.24, nên vòng focus luôn có khe hở 2px màu nền (xem mục 10).
- Các ô "chưa tính" ở dark mode cần chạy lại script trước khi phát hành dark mode; theo hướng sáng-tối của màu thì nhiều khả năng đạt, nhưng đó là suy đoán.

### 2.3 Radius, spacing, shadow, motion

```css
:root {
  /* Radius */
  --radius-xs: 8px;    /* badge, chip nhỏ trên ảnh */
  --radius-sm: 12px;   /* input, nút nhỏ */
  --radius-md: 16px;   /* thẻ con, SpecCard */
  --radius-lg: 20px;   /* PoseCard, ảnh */
  --radius-xl: 28px;   /* bottom sheet (2 góc trên), dialog */
  --radius-full: 999px;/* chip, FAB, avatar, nút chính */

  /* Spacing — bước 4px */
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px; --space-8: 32px; --space-10: 40px; --space-12: 48px;

  /* Shadow — ám nâu mận, không dùng đen thuần */
  --shadow-sm: 0 1px 2px rgb(59 37 48 / 0.06);
  --shadow-md: 0 4px 12px rgb(59 37 48 / 0.08);
  --shadow-lg: 0 12px 32px rgb(59 37 48 / 0.14);
  --shadow-fab: 0 8px 20px rgb(207 53 89 / 0.35);

  /* Motion */
  --dur-fast: 120ms;   /* nhấn nút, đổi màu chip */
  --dur-base: 200ms;   /* hiện toast, đổi tab */
  --dur-slow: 320ms;   /* sheet, drawer trượt */
  --dur-fill: 450ms;   /* hiệu ứng AI điền field */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1); /* nảy nhẹ: tim, FAB, dấu ✓ */
}
```

Lề trang: 16px ở mobile, 24px từ tablet trở lên. Khoảng cách giữa các thẻ trong lưới: 12px ở mobile, 16px từ tablet trở lên. Ở dark mode, shadow gần như vô hình nên thẻ phân tầng bằng màu bề mặt (`--surface` trên `--bg`) và viền `--border`.

### 2.4 Ánh xạ sang Tailwind

Đề xuất cho Tailwind v4 (chưa kiểm chứng phiên bản dự án sẽ dùng; cú pháp `@theme inline` cần đối chiếu tài liệu Tailwind hiện hành trước khi cài):

```css
@theme inline {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-2: var(--surface-2);
  --color-surface-3: var(--surface-3);
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  --color-text: var(--text);
  --color-text-2: var(--text-2);
  --color-text-3: var(--text-3);
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-on-primary: var(--on-primary);
  --color-primary-soft: var(--primary-soft);
  --color-on-primary-soft: var(--on-primary-soft);
  --color-success: var(--success);
  --color-success-soft: var(--success-soft);
  --color-ai: var(--ai);
  --color-ai-soft: var(--ai-soft);
  --color-info: var(--info);
  --color-info-soft: var(--info-soft);
  --color-danger: var(--danger);
  --color-focus: var(--focus);
  --radius-card: var(--radius-lg);
  --radius-sheet: var(--radius-xl);
  --shadow-card: var(--shadow-sm);
  --shadow-float: var(--shadow-lg);
  --font-display: "Quicksand", sans-serif;
  --font-body: "Be Vietnam Pro", sans-serif;
}
```

Kết quả mong muốn là các class như `bg-surface`, `text-text-2`, `border-border-strong`, `bg-primary text-on-primary`, `rounded-card`, `font-display`. Nếu dự án dùng Tailwind v3, khai báo các cặp tương tự trong `theme.extend` của `tailwind.config`. Spacing dùng thang mặc định của Tailwind (bước 4px) nên không cần khai báo riêng.

---

## 3. Typography

| Vai trò | Font | Lý do |
|---|---|---|
| Display (logo, tiêu đề màn hình, tên dáng, số lớn) | **Quicksand** 600–700 | Chữ tròn, mềm, nữ tính nhưng vẫn hiện đại. |
| Body (mọi chữ còn lại, form, chip) | **Be Vietnam Pro** 400–600 | Thiết kế cho tiếng Việt, dấu chồng rõ ở cỡ nhỏ. |

**Kiểm tra subset tiếng Việt (đã kiểm tra):** gọi `https://fonts.googleapis.com/css2?family=...` cho từng font và xác nhận phản hồi có khối `/* vietnamese */`. Kết quả: Quicksand có, Be Vietnam Pro có. Các font dự phòng cũng có subset `vietnamese`: Nunito, Lexend, Baloo 2. Fredoka **không** có subset `vietnamese` (chỉ hebrew, latin, latin-ext) nên không dùng.

Chưa kiểm chứng: chất lượng hiển thị thực tế của dấu chồng (ví dụ "ễ", "ặ", "Ở") ở Quicksand 700 cỡ nhỏ. Cần xem bằng mắt trên máy thật với chuỗi thử "Ngồi xổm chống cằm, đường phố Đà Lạt, ưỡn ngực, Ở Ễ Ặ".

Cài đặt: dùng `next/font/google` với `subsets: ["vietnamese", "latin"]` và `display: "swap"` (chưa kiểm chứng tên tuỳ chọn chính xác theo phiên bản Next.js sẽ dùng).

| Token | Font | Size / line-height | Weight | Dùng cho |
|---|---|---|---|---|
| `display-lg` | Quicksand | 28 / 36 | 700 | Logo, tiêu đề màn đăng nhập |
| `display-md` | Quicksand | 22 / 30 | 700 | Tiêu đề màn hình, tên dáng ở trang chi tiết |
| `title` | Quicksand | 17 / 24 | 700 | Tiêu đề section, tiêu đề sheet |
| `card-title` | Quicksand | 15 / 20 | 700 | Tên dáng trên PoseCard |
| `body` | Be Vietnam Pro | 15 / 24 | 400 | Nội dung, các bước tạo dáng |
| `body-strong` | Be Vietnam Pro | 15 / 24 | 600 | Nhãn nút, giá trị trong SpecCard |
| `label` | Be Vietnam Pro | 13 / 18 | 500 | Chip, nhãn field, badge |
| `caption` | Be Vietnam Pro | 12 / 16 | 400 | Chú thích, thời gian, credit nguồn |

Line-height của body là 1.6 vì dấu tiếng Việt cao; không giảm dưới 1.45. Cỡ chữ nhỏ nhất là 12px. Input dùng cỡ 16px để iOS Safari không tự phóng to khi focus. Không viết HOA toàn bộ chữ tiếng Việt có dấu (khó đọc), không dùng `letter-spacing` âm.

---

## 4. Iconography, emoji, minh hoạ

**Thư viện icon: Lucide** (`lucide-react`), nét 2px, đầu tròn, cỡ 20px trong nút và 24px ở thanh điều hướng. Lý do chọn: nét tròn hợp với Quicksand, nhẹ, import từng icon. Chưa kiểm chứng: tên từng icon trong phiên bản Lucide hiện hành — dev tra lại trên trang Lucide khi dùng. Gợi ý ý nghĩa cần tìm: menu, tìm kiếm, bộ lọc (thanh trượt), tim, dấu cộng, máy ảnh, lưới 3×3, ghim bản đồ, tay nắm kéo-thả, dấu tích, thùng rác, bút, sao lấp lánh, liên kết ngoài, sao chép.

Icon tự vẽ (không có sẵn): bộ 6 hình người que thể hiện **độ cao máy** (trên đầu → sát đất) và 3 hình máy ảnh thể hiện **góc nghiêng** (thẳng, hất lên, chúc xuống). Dùng trong SpecCard và bộ lọc để người xem hiểu ngay mà không cần đọc.

**Quy tắc emoji:**
1. Emoji là **avatar** của thành viên (con vật trên nền pastel). Đây là nơi duy nhất emoji mang chức năng.
2. Emoji được phép trong **microcopy** (toast, empty state, lời chờ AI), tối đa một emoji mỗi câu, đặt cuối câu.
3. "✨" là dấu hiệu riêng của AI: chỉ xuất hiện ở nút và nhãn liên quan AI.
4. **Không** dùng emoji thay icon chức năng (tìm kiếm, máy ảnh, xoá…) vì emoji hiển thị khác nhau giữa iOS và Android. App tham khảo dùng emoji kính lúp và máy ảnh; ta dùng icon Lucide.
5. Emoji trang trí có `aria-hidden="true"`; emoji avatar có nhãn đọc được ("Avatar gấu trúc của Linh").

**Minh hoạ và empty state:** phong cách nét đơn màu `--primary` trên nền blob `--primary-soft`, kích thước khoảng 160×160, vẽ bằng SVG. Linh vật là **"Bé Dáng"** — hình người tối giản từ logo (chấm đầu + nét cong chữ S).
- Thư viện trống: Bé Dáng đứng cạnh khung ảnh trống.
- Tìm không ra: Bé Dáng cầm kính lúp nhìn quanh.
- Chưa có buổi chụp: Bé Dáng đeo túi, cầm bản đồ.
- Chưa có địa điểm: ghim bản đồ có trái tim.
- Lỗi mạng: Bé Dáng cầm dây điện bị tuột.
- AI đang nghĩ: Bé Dáng chống cằm, sao lấp lánh xoay quanh.

---

## 5. Component specs

### PoseCard
- **Cấu trúc:** ảnh bìa (giữ tỉ lệ gốc, giới hạn trong khoảng 3:4 đến 9:16 để masonry không quá lệch) → tên dáng (`card-title`, tối đa 2 dòng) → một hàng CameraChip (tối đa 3 chip: độ cao, zoom, khung; thừa thì ẩn) → một dòng vị trí người chụp (`caption`, `--text-2`, cắt 1 dòng).
- **Khác app tham khảo:** bỏ khối hướng dẫn nhiều dòng trong thẻ; thẻ chỉ để nhận diện nhanh, chi tiết nằm ở trang chi tiết.
- **Kiểu:** nền `--surface`, `--radius-lg`, `--shadow-sm`, ảnh bo hai góc trên, phần chữ padding 12px.
- **Đè lên ảnh:** góc trên trái là badge "2 ảnh" (chỉ hiện khi có từ 2 ảnh; nền `--scrim`, chữ trắng, `--radius-xs`). Góc trên phải là nút tim (vùng chạm 44px, icon 22px trắng có bóng đổ; khi đã thích thì tô `--primary` và nảy theo `--ease-spring`). Góc dưới phải là avatar emoji 24px của người đăng.
- **Chế độ chọn:** nhấn giữ thẻ 400ms để vào chế độ chọn nhiều (thêm vào buổi chụp). Khi đó mỗi thẻ hiện vòng chọn ở góc dưới trái ảnh; thẻ được chọn có viền 2px `--primary` và dấu tích. App tham khảo luôn hiện vòng chọn; ta chỉ hiện khi cần để ảnh sạch hơn.
- **Trạng thái:** nhấn → `scale(0.98)` trong `--dur-fast`; ảnh đang tải → Skeleton; ảnh lỗi → nền `--surface-3` với icon ảnh và chữ "Ảnh lỗi rồi".

### CameraChip
- Chip chỉ đọc, hiển thị một thông số máy: icon nhỏ 14px + chữ `label` ("Ngang hông", "1x", "Dọc").
- Cao 26px, padding ngang 8px, `--radius-full`, nền `--surface-3`, chữ `--text`.
- Chip zoom dùng nền `--info-soft` và chữ `--info` để mắt bắt được con số zoom nhanh nhất.
- Không bấm được, nên không cần đạt 44px.

### FilterChip
- Chip bấm được trong bộ lọc và hàng lọc nhanh. Cao 36px, vùng chạm mở rộng thành 44px bằng padding dọc vô hình, padding ngang 14px, `--radius-full`.
- Chưa chọn: nền `--surface`, viền 1px `--border-strong`, chữ `--text`.
- Đã chọn: nền `--primary-soft`, viền 1.5px `--primary`, chữ `--on-primary-soft`, thêm dấu tích nhỏ bên trái (không chỉ dựa vào màu).
- Dùng `role="checkbox"` (chọn nhiều) hoặc `role="radio"` (chọn một) kèm `aria-checked`.

### BottomSheet
- Trượt từ dưới lên trong `--dur-slow` với `--ease-out`; nền `--surface`; hai góc trên `--radius-xl`; `--shadow-lg`; phía sau là `--overlay`.
- Có tay nắm 36×4px ở trên cùng, tiêu đề (`title`) và nút đóng. Chiều cao tối đa 90vh, nội dung cuộn bên trong, chân sheet (nút hành động) dính đáy và chừa `env(safe-area-inset-bottom)`.
- Đóng bằng: kéo xuống, chạm lớp phủ, nút đóng, phím Esc. Focus bị giữ trong sheet và trả về nút đã mở sheet khi đóng.
- Từ tablet trở lên: hiển thị thành dialog giữa màn hình, rộng 560px.

### FAB
- Tròn 56px, nền `--primary`, icon dấu cộng trắng 24px, `--shadow-fab`. Vị trí: cách mép phải 16px, cách đáy 16px + safe area.
- Khi cuộn xuống thì thu nhỏ còn 48px; cuộn lên thì về 56px. Nhấn → `scale(0.94)`.
- Nhấn mở sheet nhỏ hai lựa chọn: "Thêm dáng mới" và "✨ AI gợi ý dáng". `aria-label="Thêm"`.

### AvatarStack (presence)
- Mỗi avatar: tròn 32px, nền một trong `--avatar-1..8`, emoji con vật 18px ở giữa, viền 2px màu `--bg` để tách các avatar chồng nhau (chồng 8px).
- Hiện tối đa 4 avatar, phần còn lại gộp thành "+3". Avatar của mình đứng đầu, có vòng 2px `--primary`.
- Đang online: chấm 10px màu matcha (`#2FA36B`, chỉ là chỉ báo, không phải chữ) ở góc dưới phải. Offline: không hiện trong stack ở header (chỉ hiện ở trang Team, mờ 50%).
- Người mới vào: avatar trượt vào từ phải và nảy nhẹ. Chạm vào stack mở popover danh sách "Đang online".

### SpecCard ("Cách cầm máy")
- Nền `--surface-2`, `--radius-md`, padding 16px. Bên trong là lưới 2 cột các ô thông số; mỗi ô gồm icon 20px, nhãn (`caption`, `--text-2`) và giá trị (`body-strong`, `--text`).
- Sáu ô theo thứ tự: Độ cao máy, Góc nghiêng, Zoom, Khung, Người chụp đứng, Khoảng cách.
- Dưới lưới là một dòng ghi chú bố cục, ví dụ "Đặt người ở 1/3 bên trái, mắt ngang đường kẻ trên", kèm hình lưới 3×3 thu nhỏ có chấm đánh dấu vị trí chủ thể.
- Bản rút gọn (dùng ở chế độ "Bắt đầu chụp"): một hàng ngang 4 giá trị lớn, không nhãn.

### StepList ("Cách tạo dáng")
- Danh sách đánh số. Mỗi bước: vòng tròn số 28px (nền `--primary-soft`, chữ `--on-primary-soft`, Quicksand 700) + nhãn bộ phận tuỳ chọn (Tay / Chân / Mặt / Mắt, dạng chip nhỏ) + nội dung `body`.
- Các vòng số nối nhau bằng đường kẻ dọc 2px `--border`. Khoảng cách giữa các bước 12px.
- Ở form sửa: mỗi bước có tay nắm kéo-thả, ô nhập, nút xoá; cuối danh sách có nút "Thêm bước".

### ImagePicker
- Khi trống: khung nét đứt 2px `--border-strong`, `--radius-lg`, cao 200px, có ba nút: "Chọn ảnh", "Dán ảnh", "Dán link ảnh". Cũng nhận kéo-thả file và phím tắt dán ở desktop.
- Khi có ảnh: hàng thumbnail 72×96 cuộn ngang, ảnh đầu có nhãn "Bìa". Nhấn giữ để kéo đổi thứ tự; mỗi thumbnail có nút xoá 24px (vùng chạm 44px). Ô cuối là nút thêm, ẩn khi đủ 5 ảnh.
- Mỗi ảnh đang tải lên có vòng tiến độ đè lên; lỗi thì viền `--danger` và nút "Thử lại".
- "Dán link ảnh" mở ô nhập URL; nếu không tải được thì báo "Link này không lấy được ảnh. Bạn lưu ảnh về máy rồi chọn lại nhé." Chưa kiểm chứng: nhiều mạng xã hội chặn tải ảnh trực tiếp từ URL, nên tính năng này có thể chỉ chạy được với một phần link.

### AI loading states
- **Nút "✨ AI điền giúp":** nền `--ai-soft`, chữ `--ai`, viền 1px `--ai`. Khi chạy: chữ đổi thành "Đang ngắm ảnh…", icon sao xoay, nút bị khoá.
- **Field đang chờ:** các field AI sẽ điền hiện shimmer vàng bơ nhẹ chạy ngang.
- **Field vừa được điền:** giá trị hiện dần trong `--dur-fill`, nền field loé `--ai-soft` rồi tắt sau 1.2s; cạnh nhãn field có chấm "✨" nhỏ cho đến khi người dùng sửa field đó. Các field điền lần lượt, cách nhau 80ms, từ trên xuống.
- **Màn chờ "AI gợi ý dáng":** ảnh cảnh vừa chụp ở giữa, một dải sáng quét dọc qua ảnh, Bé Dáng chống cằm bên dưới, dòng chữ chờ đổi mỗi 2.5s (xem mục 9). Có nút "Huỷ".
- **Lỗi AI:** không chặn người dùng — form vẫn điền tay được; hiện thông báo trong dòng kèm nút "Thử lại".

### Toast
- Viên thuốc nổi ở đáy màn hình, phía trên FAB; nền `--toast-bg`, chữ `--toast-text`, `--radius-full`, padding 12×16, `--shadow-lg`. Tối đa 2 dòng.
- Tự tắt sau 3s; toast có nút hành động ("Hoàn tác") thì 5s. Chỉ hiện một toast, toast mới thay toast cũ.
- Dùng `role="status"`; toast lỗi dùng `role="alert"` và có icon cảnh báo.

### EmptyState
- Minh hoạ 160px → tiêu đề (`title`) → một câu mô tả (`body`, `--text-2`, tối đa 2 dòng) → một nút chính. Căn giữa, chiếm vùng nội dung.

### Skeleton
- Khối `--surface-3` bo cùng radius với thành phần thật, shimmer chạy ngang 1.4s. Lưới thư viện hiện 6 thẻ skeleton với chiều cao ảnh khác nhau (để giống masonry). Khi `prefers-reduced-motion`, bỏ shimmer, chỉ giữ khối tĩnh.

### Nút (dùng chung)
- **Chính:** cao 48px, `--radius-full`, nền `--primary`, chữ `--on-primary` (`body-strong`).
- **Phụ:** cao 48px, nền `--surface`, viền 1.5px `--border-strong`, chữ `--text`.
- **Chữ:** không nền, chữ `--primary`, vùng chạm 44px.
- **Nguy hiểm:** nền `--danger`, chữ `--on-danger`. Chỉ dùng trong hộp xác nhận xoá.
- Đang xử lý: giữ nguyên bề rộng, thay chữ bằng spinner + chữ dạng "Đang lưu…".

---

## 6. Đặc tả màn hình

### 6.1 Đăng nhập / Tham gia team
- **Mục đích:** vào app và gắn tài khoản với một team.
- **Bố cục:** logo + tên app → câu chào "Hết bí dáng từ hôm nay" → hai tab "Đăng nhập" / "Tạo tài khoản" → Email, Mật khẩu (có nút hiện/ẩn) → nút chính. Sau khi tạo tài khoản: bước "Vào team" gồm ô nhập mã mời (6 ký tự, tự viết hoa, dán được) và lựa chọn phụ "Tạo team mới". Cuối cùng là bước chọn avatar emoji + màu nền (bỏ qua được).
- **Trạng thái:** đang gửi → nút hiện spinner; sai mật khẩu → báo lỗi dưới field; mã mời sai → field rung nhẹ + "Mã này chưa đúng, bạn hỏi lại trưởng nhóm nhé"; mất mạng → toast.
- **Tương tác:** phím Enter gửi form; `autocomplete` đúng cho email/mật khẩu; mở link mời thì mã được điền sẵn.

### 6.2 Thư viện dáng (home)
- **Mục đích:** lướt, tìm và mở dáng nhanh nhất có thể khi đang đứng ở chỗ chụp.
- **Bố cục:** header dính đỉnh (nút menu, logo, AvatarStack) → dòng phụ "Team Mơ · 35 dáng" → hàng tìm kiếm + nút "Bộ lọc" (có badge số bộ lọc đang bật) → hàng chip lọc nhanh cuộn ngang (Yêu thích, 1 người, 2 người, Nhóm, các bối cảnh hay dùng) → lưới masonry 2 cột → FAB.
- **Trạng thái:** tải → 6 skeleton; trống hoàn toàn → EmptyState "Chưa có dáng nào" + nút "Thêm dáng đầu tiên"; lọc không ra → EmptyState "Không tìm thấy dáng nào hợp" + nút "Xoá bộ lọc"; lỗi → EmptyState lỗi mạng + "Thử lại"; mất mạng nhưng có cache → vẫn hiện lưới, kèm dải báo "Đang offline".
- **Tương tác:** kéo xuống để làm mới; cuộn vô hạn theo trang 20 dáng; tìm kiếm debounce 300ms; khi cuộn xuống, hàng tìm kiếm thu lại, cuộn lên hiện ra; chạm thẻ → chi tiết; chạm tim → thích ngay (optimistic); nhấn giữ → chế độ chọn nhiều với thanh hành động đáy "Thêm 3 dáng vào buổi chụp"; dáng mới của đồng đội xuất hiện realtime dưới dạng viên thuốc "Có 2 dáng mới" ở đỉnh lưới (không tự đẩy nội dung).

### 6.3 Bộ lọc (bottom sheet)
- **Mục đích:** thu hẹp thư viện theo tình huống chụp.
- **Bố cục:** tiêu đề "Bộ lọc" + nút "Đặt lại" → công tắc "Chỉ dáng yêu thích" → các nhóm FilterChip, mỗi nhóm có nhãn và xuống dòng tự do:
  - Số người (chọn một): 1 người, 2 người, Nhóm
  - Tư thế (chọn nhiều): Đứng, Ngồi, Dựa, Nằm, Đi, Ngồi xổm
  - Bối cảnh (chọn nhiều): Cafe, Sofa, Cầu thang, Đường phố, Biển, Cửa sổ, Tường, Cây xanh… (lấy từ tag bối cảnh của team; quá 10 thì có "Xem thêm")
  - Độ cao máy (chọn nhiều, có icon hình người): Trên đầu, Ngang mắt, Ngang ngực, Ngang hông, Ngang gối, Sát đất
  - Góc nghiêng (chọn nhiều): Thẳng, Hất lên, Chúc xuống
  - Zoom (chọn nhiều): 0.5x, 1x, 2x, 3x
  - Khung (chọn nhiều): Dọc, Ngang, Vuông
  - Địa điểm (chọn một, mở danh sách con có ô tìm)
  - Người đăng (chọn nhiều, avatar emoji + tên)
- **Chân sheet (dính đáy):** nút phụ "Đặt lại" + nút chính "Xem 12 dáng" (số đếm cập nhật trực tiếp khi đổi lựa chọn).
- **Trạng thái:** đang đếm → số trong nút thay bằng spinner nhỏ; kết quả bằng 0 → nút ghi "Không có dáng nào" và bị mờ; lỗi tải danh sách địa điểm/người đăng → dòng "Không tải được, chạm để thử lại" trong nhóm đó.
- **Tương tác:** lựa chọn chỉ áp dụng khi nhấn nút chính; đóng sheet mà chưa áp dụng thì bỏ thay đổi. Bộ lọc được ghi vào query string của URL để chia sẻ và giữ khi quay lại.

### 6.4 Chi tiết dáng
- **Mục đích:** đọc trong vài giây cách cầm máy và cách đứng, ngay tại chỗ chụp.
- **Bố cục:** carousel ảnh tràn hết bề rộng (cao tối đa 70vh), đè lên trên là nút quay lại, nút tim, nút "⋯" (Sửa, Xoá, Chia sẻ link); góc dưới phải ảnh là nút bật/tắt lưới 3×3; dưới ảnh là chấm phân trang → tên dáng (`display-md`) + dòng "Linh đăng · 3 ngày trước" kèm avatar → SpecCard "Cách cầm máy" → StepList "Cách tạo dáng" → khối "Mẹo" (nền `--ai-soft` nếu do AI viết, ngược lại `--surface-2`) → chip địa điểm (nền `--info-soft`, chạm mở trang địa điểm) → các tag → dòng credit "Nguồn: pinterest.com" (link ngoài, mở tab mới) → thanh hành động dính đáy: nút tim (phụ) + nút chính "Thêm vào buổi chụp". Nút "Chụp theo dáng này" sẽ thêm vào thanh này ở giai đoạn sau.
- **Lưới và điểm đặt chủ thể:** bật lưới thì vẽ 4 đường trắng 1px có bóng mờ chia ảnh làm 9 ô, cùng một vòng tròn 28px viền `--primary` nhấp nháy chậm tại vị trí chủ thể đã lưu. Trạng thái bật/tắt được nhớ cho lần sau.
- **Trạng thái:** tải → skeleton cho ảnh và 3 khối chữ; dáng đã bị xoá → EmptyState "Dáng này không còn nữa" + nút về thư viện; lỗi → "Thử lại"; thiếu phần nào (chưa có mẹo, chưa có nguồn) thì ẩn hẳn phần đó.
- **Tương tác:** vuốt ngang đổi ảnh; chạm hai lần để thích; chụm để phóng to; xoá cần hộp xác nhận, sau khi xoá có toast "Đã xoá dáng" kèm "Hoàn tác" 5s; "Thêm vào buổi chụp" mở sheet chọn buổi (hoặc tạo buổi mới).

### 6.5 Thêm / Sửa dáng
- **Mục đích:** đăng một dáng trong dưới một phút, AI lo phần gõ chữ.
- **Bố cục:** thanh trên (nút đóng, tiêu đề "Thêm dáng", nút "Lưu") → ImagePicker → nút "✨ AI điền giúp" (chỉ bật khi có ít nhất 1 ảnh) → Tên dáng → nhóm **Cách cầm máy**: Độ cao máy, Góc nghiêng, Zoom, Khung (đều là hàng FilterChip chọn một), Người chụp đứng ở đâu (ô chữ), Khoảng cách (ô chữ, ví dụ "2–3 bước chân"), Vị trí chủ thể (lưới 3×3 trên ảnh bìa, chạm để đặt chấm) → nhóm **Cách tạo dáng**: StepList sửa được → Mẹo (ô nhiều dòng) → nhóm **Phân loại**: Số người, Tư thế, Bối cảnh, Tag tự do → Địa điểm (mở sheet: tìm trong địa điểm đã lưu hoặc "Tạo địa điểm mới" với tên, địa chỉ, link Google Maps) → Link nguồn (dán link Pinterest/Instagram/TikTok/Xiaohongshu) → nút chính "Lưu dáng" dính đáy.
- **Bắt buộc:** ít nhất 1 ảnh và Tên dáng. Mọi thứ khác bỏ trống được, để việc đăng không thành gánh nặng.
- **Trạng thái:** đang tải ảnh lên → tiến độ trên từng thumbnail, nút Lưu chờ; AI đang chạy → xem "AI loading states"; AI lỗi → thông báo trong dòng + "Thử lại", form vẫn dùng được; lưu lỗi → toast lỗi, giữ nguyên dữ liệu; thoát khi chưa lưu → hộp xác nhận "Bỏ dáng đang viết dở?".
- **Tương tác:** AI chỉ điền vào field **đang trống**; nếu người dùng đã nhập, AI không ghi đè (chạy lại AI thì hỏi "Ghi đè các ô đã điền?"). Field AI điền vẫn sửa bình thường. Bản nháp tự lưu cục bộ mỗi khi đổi field. Ở chế độ sửa, tiêu đề là "Sửa dáng" và có nút "Xoá dáng" ở cuối form.

### 6.6 AI gợi ý dáng
- **Mục đích:** đứng trước một cảnh, không biết chụp gì → nhận gợi ý cụ thể trong một lần chạm.
- **Bước 1 — Chụp cảnh:** tiêu đề "Chụp cảnh bạn đang đứng" → hai nút lớn "Chụp ảnh" và "Chọn từ máy" → tuỳ chọn số người (1 / 2 / Nhóm) → mẹo nhỏ "Chụp rộng một chút để AI thấy cả ánh sáng".
- **Bước 2 — Chờ:** màn chờ như mô tả ở "AI loading states".
- **Bước 3 — Kết quả:**
  1. Thẻ **Cảnh của bạn**: thumbnail ảnh cảnh + ba dòng có icon: Bối cảnh, Ánh sáng, Gợi ý góc.
  2. **Dáng hợp nhất trong thư viện**: danh sách xếp hạng; mỗi mục là PoseCard dạng ngang (ảnh 88×116 bên trái, tên + CameraChip bên phải) kèm một dòng lý do trên nền `--ai-soft`, ví dụ "Hợp vì có bậc thang và nắng xiên". Mục đầu có nhãn "Hợp nhất".
  3. **Ý tưởng mới ✨** (1–3 thẻ chỉ có chữ): nền `--ai-soft`, viền nét đứt `--ai`, gồm tên ý tưởng, hàng CameraChip, 2–3 bước tạo dáng, nút "Lưu thành dáng nháp".
  4. Cuối trang: "Gợi ý lại" và "Chụp cảnh khác".
- **Trạng thái:** thư viện không có dáng hợp → ẩn mục 2, hiện câu "Thư viện chưa có dáng hợp cảnh này, thử ý tưởng mới bên dưới nhé"; AI lỗi hoặc quá 30s → Bé Dáng cầm dây điện + "AI đang bận xíu, bạn thử lại nhé" + "Thử lại"; ảnh quá tối/mờ → thông báo và mời chụp lại; không cấp quyền camera → hướng dẫn chọn ảnh từ máy.
- **Tương tác:** chạm thẻ dáng → trang chi tiết (quay lại vẫn giữ kết quả); "Lưu thành dáng nháp" → toast "Đã lưu nháp" + "Mở"; dáng nháp hiện trong thư viện với nhãn "Nháp · chưa có ảnh" và nền minh hoạ thay ảnh; nhấn giữ thẻ để thêm vào buổi chụp.

### 6.7 Buổi chụp (shot list)
- **Mục đích:** chuẩn bị danh sách dáng trước khi đi và làm theo từng dáng khi chụp.
- **Danh sách buổi:** mỗi thẻ gồm ảnh ghép 3 dáng đầu, tên buổi, ngày, địa điểm, thanh tiến độ "4/10 dáng". Nút "Tạo buổi chụp". Trống → EmptyState "Chưa có buổi chụp nào".
- **Bên trong một buổi:** header (tên, ngày, địa điểm, avatar người tham gia) → nút chính "Bắt đầu chụp" → danh sách dáng theo thứ tự: tay nắm kéo-thả, thumbnail 56×72, tên, CameraChip, ô tròn đánh dấu xong. Dáng xong: thumbnail mờ 60%, tên gạch ngang, dấu ✓ màu `--success` nảy theo `--ease-spring`, và tự chuyển xuống nhóm "Đã chụp". Vuốt trái một dòng để gỡ khỏi buổi.
- **Chế độ "Bắt đầu chụp" (toàn màn hình, nền tối cố định bất kể theme):** ảnh tham khảo lấp đầy màn hình → trên cùng là "3 / 10" và nút đóng → dưới cùng là SpecCard rút gọn (4 giá trị lớn) trên nền `--scrim` → nút "Xong ✓" lớn 56px. Vuốt ngang đổi dáng, chạm ảnh để ẩn/hiện chữ, vuốt lên xem các bước tạo dáng. Giữ màn hình luôn sáng (chưa kiểm chứng: Wake Lock API không có trên mọi trình duyệt). Chữ và nút trong chế độ này lớn hơn bình thường vì người chụp cầm máy một tay, đứng xa.
- **Trạng thái:** tải → skeleton dòng; lỗi đồng bộ thứ tự → trả về thứ tự cũ + toast; đánh dấu xong đồng bộ realtime cho cả team; xong hết → màn chúc mừng "Chụp đủ 10 dáng rồi, giỏi quá 🎉".

### 6.8 Địa điểm
- **Danh sách:** thẻ ngang gồm ảnh bìa 96×96 (bo `--radius-md`), tên, địa chỉ (1 dòng), "12 dáng", nút mở Google Maps (link ngoài). Có ô tìm và nút "Thêm địa điểm". Trống → EmptyState "Chưa lưu địa điểm nào".
- **Chi tiết:** ảnh bìa tràn bề rộng (16:9) → tên, địa chỉ, nút "Mở Google Maps", nút "Sửa" → ghi chú (giờ đẹp, chỗ gửi xe…) → lưới PoseCard các dáng tại đây → nút "Tạo buổi chụp ở đây".
- **Trạng thái:** tải → skeleton; địa điểm chưa có dáng → "Chưa có dáng nào ở đây" + "Thêm dáng"; ảnh bìa mặc định là ảnh bìa của dáng mới nhất tại đó; không có thì dùng minh hoạ ghim bản đồ.
- **Tương tác:** xoá địa điểm không xoá dáng — dáng chỉ mất nhãn địa điểm, và hộp xác nhận nói rõ điều đó.

### 6.9 Menu drawer, Team, Hồ sơ
- **Drawer (trượt từ trái, rộng 300px):** trên cùng là avatar + tên mình + tên team → các mục: Thư viện dáng, AI gợi ý dáng ✨, Buổi chụp, Địa điểm, Team, Hồ sơ → cuối: công tắc giao diện tối, Đăng xuất. Mục hiện tại có nền `--primary-soft`. Từ desktop, drawer thành thanh bên cố định.
- **Team:** tên team (trưởng nhóm sửa được) → thẻ mã mời: mã chữ lớn, dãn cách rộng, nút "Sao chép mã" và "Chia sẻ link" (sao chép xong có toast) → danh sách thành viên: avatar emoji 44px, tên, vai trò, số dáng đã đăng, chấm online. Trưởng nhóm có thêm "Đổi mã mời" và "Mời ra khỏi team" (đều cần xác nhận).
- **Hồ sơ:** avatar lớn 96px → bộ chọn avatar: lưới emoji con vật (khoảng 24 con) và hàng 8 ô màu `--avatar-1..8`, xem trước trực tiếp → tên hiển thị → email (chỉ đọc) → đổi mật khẩu → giao diện (Sáng / Tối / Theo máy) → "Dáng của mình" và "Dáng nháp" → Đăng xuất.
- **Trạng thái:** tải → skeleton; lưu avatar là optimistic, lỗi thì trả về cũ + toast; team chỉ có mình → gợi ý "Rủ bạn vào team cho vui" kèm nút sao chép mã.

### 6.10 Chụp theo dáng (giai đoạn sau — đặc tả ngắn)
- Camera trực tiếp toàn màn hình. Đè lên là ảnh tham khảo bán trong suốt ("bóng mờ"), mặc định 35% opacity, kèm thanh trượt opacity 0–80% ở cạnh phải. Có nút bật/tắt lưới 3×3, nút đổi camera trước/sau, nút lật ngang bóng mờ, nút chụp 72px ở giữa đáy, và SpecCard rút gọn ở đỉnh.
- Ảnh chụp lưu về máy; có lựa chọn "Thêm vào dáng này" để đăng làm ảnh của team.
- Cần HTTPS và quyền camera; nếu bị từ chối thì hiện hướng dẫn bật quyền. Chưa kiểm chứng: khả năng điều khiển zoom quang học (0.5x/2x/3x) qua trình duyệt di động — có thể chỉ hiển thị con số zoom để người dùng tự chỉnh trong app camera.

---

## 7. ASCII wireframe (390px)

**Màn 2 — Thư viện dáng**
```
┌──────────────────────────────────────┐
│ [≡]  ▣ Pose Xinh          (🐼)(🐳)(🦁)+2│
│ Team Mơ · 35 dáng                    │
│ ┌───────────────────────┐ ┌────────┐ │
│ │ ⌕ Tìm dáng...         │ │Bộ lọc②│ │
│ └───────────────────────┘ └────────┘ │
│ (♡ Yêu thích)(1 người)(Cafe)(Biển) → │
│ ┌───────────────┐ ┌───────────────┐  │
│ │[2 ảnh]      ♡ │ │             ♡ │  │
│ │               │ │     ẢNH       │  │
│ │     ẢNH       │ │           (🐳)│  │
│ │               │ ├───────────────┤  │
│ │           (🐼)│ │ Dựa tường     │  │
│ ├───────────────┤ │ (Ngang mắt)(2x)│ │
│ │ Ngồi sofa bắt │ │ Đứng chéo 45° │  │
│ │ chéo chân     │ └───────────────┘  │
│ │(Ngang hông)(1x)│ ┌───────────────┐ │
│ │ Đứng trước sofa│ │     ẢNH       │ │
│ └───────────────┘ │           ( + ) │ │
└──────────────────────────────────────┘
```

**Màn 4 — Chi tiết dáng**
```
┌──────────────────────────────────────┐
│ (←)                        (♡) (⋯)  │
│          ┆          ┆                │
│ ┄┄┄┄┄┄┄┄┄◎┄┄┄┄┄┄┄┄┄┄┆┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│          ┆   ẢNH    ┆                │
│ ┄┄┄┄┄┄┄┄┄┆┄┄┄┄┄┄┄┄┄┄┆┄┄┄┄┄┄┄┄┄┄┄┄┄┄ │
│          ┆          ┆        [# lưới]│
│                ● ○ ○                 │
│ Ngồi sofa bắt chéo chân              │
│ (🐼) Linh đăng · 3 ngày trước        │
│ ┌─ Cách cầm máy ───────────────────┐ │
│ │ Độ cao: Ngang hông │ Góc: Thẳng  │ │
│ │ Zoom: 1x           │ Khung: Dọc  │ │
│ │ Đứng: trước sofa   │ Cách: 2 bước│ │
│ │ ▦ Người ở 1/3 trái, mắt ngang kẻ trên│
│ └──────────────────────────────────┘ │
│ Cách tạo dáng                        │
│ ① [Chân] Bắt chéo, mũi chân duỗi     │
│ ② [Tay] Đặt nhẹ lên đầu gối          │
│ ③ [Mắt] Nhìn lệch khỏi ống kính      │
│ ┌ Mẹo: ngồi mép ghế cho chân dài ──┐ │
│ (⌖ Artemis Pastry) (#cafe)(#sofa)    │
│ Nguồn: pinterest.com ↗               │
├──────────────────────────────────────┤
│ ( ♡ )  [   Thêm vào buổi chụp     ]  │
└──────────────────────────────────────┘
```

**Màn 5 — Thêm / Sửa dáng**
```
┌──────────────────────────────────────┐
│ (✕)        Thêm dáng           Lưu   │
│ ┌─────┐ ┌─────┐ ┌ ─ ─ ┐              │
│ │ Bìa │ │ ảnh │   +                  │
│ │  ✕  │ │  ✕  │ └ ─ ─ ┘   (tối đa 5) │
│ └─────┘ └─────┘                      │
│ [Chọn ảnh] [Dán ảnh] [Dán link ảnh]  │
│ ┌──────────────────────────────────┐ │
│ │        ✨ AI điền giúp           │ │
│ └──────────────────────────────────┘ │
│ Tên dáng ✨                          │
│ [ Ngồi sofa bắt chéo chân         ]  │
│ ── Cách cầm máy ──                   │
│ Độ cao máy                           │
│ (Trên đầu)(Ngang mắt)(Ngang ngực)    │
│ (✓Ngang hông)(Ngang gối)(Sát đất)    │
│ Góc nghiêng  (✓Thẳng)(Hất lên)(Chúc) │
│ Zoom   (0.5x)(✓1x)(2x)(3x)           │
│ Khung  (✓Dọc)(Ngang)(Vuông)          │
│ Người chụp đứng [ trước sofa      ]  │
│ Vị trí chủ thể  [▦ chạm để đặt]      │
│ ── Cách tạo dáng ──                  │
│ ⠿ ① [ Bắt chéo chân...          ] ✕  │
│ ⠿ ② [ Tay đặt lên gối...        ] ✕  │
│ (+ Thêm bước)                        │
│ Mẹo / Phân loại / Địa điểm / Nguồn…  │
├──────────────────────────────────────┤
│ [           Lưu dáng              ]  │
└──────────────────────────────────────┘
```

**Màn 6 — AI gợi ý dáng (kết quả)**
```
┌──────────────────────────────────────┐
│ (←)      AI gợi ý dáng ✨            │
│ ┌─ Cảnh của bạn ───────────────────┐ │
│ │ ┌────┐ Bối cảnh: cầu thang gỗ,   │ │
│ │ │ẢNH │           tường trắng     │ │
│ │ │cảnh│ Ánh sáng: nắng xiên trái  │ │
│ │ └────┘ Gợi ý góc: thấp, hất lên  │ │
│ └──────────────────────────────────┘ │
│ Dáng hợp nhất trong thư viện         │
│ ┌──────────────────────────────────┐ │
│ │ ┌────┐ [Hợp nhất]                │ │
│ │ │ẢNH │ Ngồi bậc thang chống cằm  │ │
│ │ └────┘ (Ngang gối)(1x)(Dọc)      │ │
│ │ ✨ Hợp vì có bậc thang, nắng xiên│ │
│ └──────────────────────────────────┘ │
│ ┌──────────────────────────────────┐ │
│ │ ┌────┐ Dựa tường nhìn xa         │ │
│ │ └────┘ ✨ Tường trắng làm nền gọn│ │
│ └──────────────────────────────────┘ │
│ Ý tưởng mới ✨                       │
│ ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│   Bước xuống thang ngoái lại         │
│   (Sát đất)(0.5x)(Dọc)               │
│   ① Tay vịn lan can ② Ngoái vai trái │
│   [ Lưu thành dáng nháp ]            │
│ └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│ (Gợi ý lại)      (Chụp cảnh khác)    │
└──────────────────────────────────────┘
```

---

## 8. Responsive

| Breakpoint | Bề rộng | Lưới PoseCard | Lề | Thay đổi |
|---|---|---|---|---|
| Mobile | < 640px | 2 cột, gap 12px | 16px | Thiết kế gốc. Sheet từ đáy, drawer trượt. |
| Tablet | 640–1023px | 3 cột, gap 16px | 24px | Sheet thành dialog 560px. Chi tiết dáng vẫn một cột, rộng tối đa 640px. |
| Desktop | ≥ 1024px | 4 cột, gap 16px | 24px | Nội dung căn giữa, `max-width: 1200px`. Drawer thành thanh bên cố định 240px. Chi tiết dáng chia hai cột: ảnh dính bên trái, thông tin cuộn bên phải. Form thêm dáng rộng tối đa 720px. FAB thành nút "Thêm dáng" có chữ ở header. |

- Masonry: dùng CSS `columns` hoặc chia cột bằng JS theo chiều cao ảnh. Lưu ý `columns` xếp theo chiều dọc từng cột, nên thứ tự đọc ngang sẽ lệch; nếu cần đúng thứ tự "mới nhất trước" theo hàng thì chia cột bằng JS (đây là câu hỏi mở, xem mục 11).
- Ảnh dùng `next/image` với `sizes` khớp số cột: `(min-width:1024px) 25vw, (min-width:640px) 33vw, 50vw`. Lưu sẵn bề rộng/chiều cao ảnh để giữ chỗ, tránh xô lệch bố cục.
- Chế độ "Bắt đầu chụp" và "Chụp theo dáng" luôn toàn màn hình ở mọi kích thước; hỗ trợ xoay ngang.
- Tôn trọng `env(safe-area-inset-*)` cho header, FAB, thanh hành động đáy.

---

## 9. Giọng văn microcopy

**Nguyên tắc:** như một cô bạn thân rành chụp ảnh — ấm áp, ngắn, cụ thể. Xưng hô "bạn" / "mình" (app tự xưng "mình" khi cần). Câu ngắn dưới 12 từ cho nút và toast. Dùng "nhé", "nha", "xíu" vừa phải, mỗi câu tối đa một từ đệm. Không đổ lỗi cho người dùng, không dùng thuật ngữ kỹ thuật ("lỗi 500", "request thất bại"). Tối đa một emoji mỗi câu. Thuật ngữ thống nhất: **dáng** (không lẫn "pose"), **buổi chụp**, **địa điểm**, **team**, **yêu thích**.

| Ngữ cảnh | Chuỗi |
|---|---|
| Nút chính thêm dáng | Lưu dáng |
| Nút AI trên form | ✨ AI điền giúp |
| Nút vào chế độ chụp | Bắt đầu chụp |
| Nút áp dụng bộ lọc | Xem 12 dáng |
| Nút lưu ý tưởng AI | Lưu thành dáng nháp |
| Empty — thư viện trống | Chưa có dáng nào. Thêm dáng đầu tiên cho cả team nhé! |
| Empty — lọc không ra | Không tìm thấy dáng nào hợp. Thử bớt bộ lọc xem sao? |
| Empty — chưa có buổi chụp | Chưa có buổi chụp nào. Lên kèo đi chụp thôi 📸 |
| Empty — chưa có địa điểm | Chưa lưu địa điểm nào. Thấy chỗ đẹp thì lưu lại nha. |
| Chờ AI (xoay vòng) 1 | Đang ngắm cảnh của bạn… |
| Chờ AI (xoay vòng) 2 | Đang xem nắng chiếu hướng nào… |
| Chờ AI (xoay vòng) 3 | Đang lục thư viện tìm dáng hợp… |
| Chờ AI (xoay vòng) 4 | Sắp xong rồi, đợi mình xíu nha ✨ |
| Chờ AI điền form | Đang ngắm ảnh… |
| AI điền xong | Điền xong rồi! Bạn xem lại và sửa thoải mái nhé. |
| Lỗi AI | AI đang bận xíu. Bạn thử lại hoặc tự điền nhé. |
| Lỗi mạng | Mạng đang chập chờn. Kiểm tra kết nối rồi thử lại nha. |
| Lỗi tải ảnh lên | Ảnh này chưa tải lên được. Chạm để thử lại. |
| Lỗi mã mời | Mã này chưa đúng, bạn hỏi lại trưởng nhóm nhé. |
| Lỗi mật khẩu | Email hoặc mật khẩu chưa đúng. |
| Toast đã lưu | Đã lưu dáng 💗 |
| Toast đã thêm vào buổi | Đã thêm vào "Đà Lạt cuối tuần" |
| Toast sao chép mã | Đã sao chép mã mời |
| Toast xoá | Đã xoá dáng · Hoàn tác |
| Xác nhận xoá | Xoá dáng này? Cả team sẽ không thấy nữa. |
| Xác nhận thoát form | Bỏ dáng đang viết dở? |
| Chụp xong hết | Chụp đủ 10 dáng rồi, giỏi quá 🎉 |
| Dải offline | Đang offline — bạn vẫn xem được các dáng đã tải. |

---

## 10. Accessibility

- **Vùng chạm:** mọi thứ bấm được có vùng chạm tối thiểu 44×44px, kể cả khi hình nhìn thấy nhỏ hơn (nút tim, nút xoá thumbnail, FilterChip cao 36px). Hai vùng chạm cách nhau ít nhất 8px.
- **Focus:** chỉ hiện với `:focus-visible`. Kiểu: `outline: 2px solid var(--focus); outline-offset: 2px;`. Khe hở 2px lộ màu nền phía sau, nhờ đó vòng focus vẫn thấy rõ trên nút `--primary` (nếu vẽ sát thì chỉ đạt 1.24:1). Nút đè lên ảnh dùng thêm vòng trắng bên trong.
- **Thứ tự focus:** theo thứ tự đọc. Sheet, dialog, drawer giữ focus bên trong, đóng bằng Esc và trả focus về nơi mở.
- **Reduced motion:** với `@media (prefers-reduced-motion: reduce)`, tắt shimmer, nảy, quét sáng, trượt sheet (thay bằng mờ dần 120ms), tắt tự chuyển chữ chờ AI (giữ một câu), tắt nhấp nháy điểm đặt chủ thể.
- **Alt ảnh:** ảnh dáng có alt theo mẫu "Ảnh tham khảo dáng: {tên dáng}" cộng số thứ tự khi có nhiều ảnh ("ảnh 2 trên 3"). Khi AI điền giúp, sinh thêm mô tả ngắn cho ảnh và lưu làm alt (đề xuất, cần thống nhất với phía backend). Ảnh trang trí và minh hoạ dùng `alt=""`.
- **Không chỉ dựa vào màu:** chip đã chọn có dấu tích, dáng xong có dấu ✓ và gạch ngang, lỗi field có icon + chữ.
- **Kéo-thả:** mọi danh sách sắp xếp được (ảnh, các bước, dáng trong buổi chụp) có cách thay thế không cần kéo: menu "Chuyển lên / Chuyển xuống".
- **Carousel:** có nút trước/sau cho bàn phím, chấm phân trang có nhãn "Ảnh 1 trên 3". Lưới 3×3 là trang trí (`aria-hidden`), còn vị trí chủ thể đã được viết bằng chữ trong SpecCard.
- **Trình đọc màn hình:** nút chỉ có icon phải có `aria-label` tiếng Việt ("Yêu thích", "Mở menu", "Bật lưới"). Nút tim dùng `aria-pressed`. Toast và kết quả AI dùng vùng `aria-live="polite"`. Đặt `<html lang="vi">`.
- **Form:** mỗi input có `<label>` thật, lỗi gắn bằng `aria-describedby`, cỡ chữ input 16px.
- **Phóng chữ:** bố cục không vỡ khi phóng 200%; tên dáng trên thẻ được phép xuống 2 dòng thay vì cắt cụt.

---

## 11. Câu hỏi mở cần chốt

1. **Tên app:** chọn "Dáng Ơi" hay tên khác? Chưa kiểm tra trùng nhãn hiệu/tên miền.
2. **Thứ tự masonry:** chấp nhận thứ tự theo cột (CSS `columns`, đơn giản) hay cần đúng thứ tự theo hàng (chia cột bằng JS)?
3. **Điều hướng:** giữ drawer như app tham khảo, hay chuyển sang thanh tab đáy 4 mục (Thư viện, AI gợi ý, Buổi chụp, Địa điểm)? Thanh tab đáy dễ với tay hơn khi dùng một tay ngoài trời; tài liệu này đang theo drawer vì đề bài yêu cầu.
4. **Một người thuộc nhiều team?** Nếu có thì cần bộ chuyển team ở drawer.
5. **Quyền sửa/xoá dáng:** chỉ người đăng và trưởng nhóm, hay mọi thành viên?
6. **Yêu thích:** riêng từng người (giả định hiện tại) hay chung cả team? Có hiện số lượt thích không?
7. **Dáng nháp từ AI không có ảnh:** hiện lẫn trong thư viện (giả định hiện tại) hay tách thành mục riêng?
8. **Import ảnh từ URL và bản quyền:** ảnh lấy từ Pinterest/Instagram/TikTok/Xiaohongshu có thể bị chặn tải và có vấn đề bản quyền nếu app công khai. Hiện giả định app chỉ dùng nội bộ team và luôn hiện credit nguồn.
9. **Dark mode:** phát hành cùng bản đầu hay sau? Một số cặp màu dark chưa tính tương phản (xem bảng 2.2).
10. **Bộ avatar emoji:** danh sách con vật cụ thể và có cho trùng avatar trong một team không?
