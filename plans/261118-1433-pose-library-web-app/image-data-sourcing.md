# Data ảnh lấy từ đâu?

Tóm tắt: nguồn chính là **team tự đưa vào** (ảnh tự chụp, ảnh lưu từ mạng). Nguồn phụ là **bộ seed ~30 dáng từ Pexels** để app không trống ngày đầu. AI chỉ **điền thông số**, không tự sinh ảnh.

## 1. Các cách đưa ảnh vào app
| Cách | Dùng khi | Cách hoạt động | Phase |
|---|---|---|---|
| 📷 Chọn từ máy | Ảnh tự chụp, ảnh đã lưu/screenshot từ Pinterest, IG, TikTok, Xiaohongshu | `<input type=file accept="image/*" multiple>`, tối đa 5 ảnh/dáng | P0 |
| 📋 Dán ảnh | Vừa "Copy ảnh" trên web/app khác | Nút "Dán ảnh" gọi `navigator.clipboard.read()`, dự phòng thêm sự kiện `paste`. *Trên iOS Safari sẽ hiện popup "Dán" cần bấm; phải test trên máy thật* | P0 |
| 🔗 Dán link | Có link ảnh trực tiếp, hoặc link Pinterest | Server tải về qua `/api/import-url`. Nếu là trang HTML thì lấy `og:image`. **IG/TikTok thường chặn hoặc yêu cầu login, nên với 2 nguồn này cứ screenshot rồi chọn từ máy** | P0 (best-effort) |
| 📤 Share từ app khác | Bấm Share trong Pinterest rồi chọn app mình | PWA Share Target, **chỉ Android hỗ trợ, iOS không có** | P2 |
| ✨ AI ý tưởng mới | AI gợi ý dáng chưa có trong thư viện | Lưu thành dáng **nháp chỉ có chữ**. Sau này có người chụp thử thì thêm ảnh | P1 |

Mọi ảnh đi qua **cùng một pipeline phía client** (`src/lib/images/`):
1. Giải mã bằng `createImageBitmap`, xoay đúng chiều theo EXIF.
2. Xuất 2 bản WebP: **full 1600px (q≈0.85)** và **thumb 640px (q≈0.8)**.
3. Lấy `dominantColor` để làm placeholder trong lúc ảnh tải.
4. Upload lên bucket private.

Ảnh HEIC của iPhone: Safari thường tự chuyển sang JPEG khi chọn qua input. *Cần test trên máy thật.* Nếu vẫn ra HEIC thì báo lỗi thân thiện, chưa thêm thư viện decode HEIC (YAGNI).

Lưu kèm `source_url` + `source_credit` để biết ảnh từ đâu và ghi công tác giả.

## 2. Bộ seed ban đầu (~30 dáng), Phase 6
1. Script `scripts/seed-search-pexels.ts` dùng Pexels API (miễn phí, mặc định 200 request/giờ, 20.000/tháng theo tài liệu Pexels) để tìm theo danh sách query, ví dụ: "woman sitting cafe", "girl posing stairs", "woman leaning wall street", "beach pose woman", "friends photo pose". Ảnh ứng viên lưu vào `seed/candidates/` (không commit) kèm `photographer` + `url`.
2. Lọc ứng viên: mình dùng vision xem và chọn ra ~30 ảnh đa dạng (tư thế, bối cảnh, số người), rồi **bạn duyệt danh sách cuối**.
3. Script `scripts/seed-import.ts` chạy pipeline ảnh, upload, gọi AI autofill, rồi lưu với `status='draft'`, `source_credit = "Ảnh: <tên> / Pexels"`. Bạn duyệt trong app rồi bấm publish.
4. **Bản quyền:** cần đọc lại trang pexels.com/license lúc seed. Mình chưa mở được trang này từ máy (mạng chặn), nên điều khoản về attribution và ảnh có người nhận diện được hiện **chưa xác minh**. Dù license yêu cầu gì, mình vẫn ghi credit.
- Phương án khác là Unsplash API, cũng *chưa xác minh license*. Nếu bạn không muốn ảnh stock thì bỏ hẳn bước này.

## 3. Ảnh lưu từ mạng (Pinterest/IG…): lưu ý bản quyền
Ảnh trên mạng thuộc về tác giả. App này **riêng tư, chỉ team xem, dùng làm tư liệu tham khảo cá nhân**, nên rủi ro thấp hơn nhiều so với đăng công khai. Mình vẫn áp dụng các nguyên tắc sau (đây không phải tư vấn pháp lý):
- Luôn lưu `source_url`/credit, và hiện "Nguồn" trong trang chi tiết.
- **Không** làm tính năng public hay chia sẻ ra ngoài cho ảnh tải từ mạng.
- Khi team đã tự chụp lại dáng đó, khuyến khích thêm ảnh của mình làm ảnh bìa.

## 4. Dung lượng & chi phí
- Mỗi ảnh khoảng 0,3 MB (full + thumb). Free 1 GB chứa được khoảng 3.300 ảnh, đây là ước tính, sẽ đo lại thực tế ở Phase 7.
- Gửi ảnh cho AI: client thu ảnh về **≤1024px JPEG** trước khi gửi để tiết kiệm token. Model và giá cụ thể sẽ chốt lúc code bằng skill `claude-api` (chưa đưa số vào plan để tránh bịa).
