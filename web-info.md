# The Kaily - Family Vault Technical Overview

Bản tổng hợp chi tiết về công nghệ, trải nghiệm người dùng và các tối ưu hóa kỹ thuật hiện có trong ứng dụng **The Kaily**.

## 🚀 Công nghệ cốt lõi (Tech Stack)
- **Framework:** Next.js 16 (App Router) & React 19.
- **Styling:** Tailwind CSS v4 (sử dụng hệ thống token và CSS variables hiện đại).
- **Animations:** `motion/react` (Framer Motion) - Xử lý toàn bộ các hiệu ứng mượt mà và tương tác cử chỉ.
- **Database & Auth:** Supabase (Quản lý dữ liệu Milestones, Gia đình, Xác thực người dùng).
- **Media Management:** Cloudinary (Tối ưu hóa hình ảnh động, tự động điều chỉnh kích thước và chất lượng dựa trên thiết bị).
- **Icons:** Lucide React (Bộ icon vector sắc nét, đồng bộ).
- **Typography:** Google Fonts (Lora cho tiêu đề sang trọng, Nunito cho nội dung hiện đại) được tích hợp qua `next/font`.

## ✨ Trải nghiệm UI/UX (User Experience)
- **Mobile-First Design:** Giao diện được tối ưu hóa đặc biệt cho smartphone nhưng vẫn hiển thị tuyệt đẹp trên Tablet và Desktop.
- **Smart Sticky Header:** 
  - Tự động ẩn đi khi cuộn xuống để mở rộng không gian xem nội dung.
  - Hiện lại ngay lập tức khi cuộn lên để truy cập nhanh menu.
- **Masonry Photo Gallery:** Bố cục ảnh dạng "tổ ong" nghệ thuật, tự động thích ứng số cột (2 cột trên mobile, lên đến 5 cột trên màn hình lớn).
- **Advanced Lightbox (Xem ảnh tập trung):**
  - Hỗ trợ **vuốt (swipe)** trái/phải trên mobile để chuyển ảnh.
  - Chế độ xem "Focus": Tự động ẩn thông tin nếu ảnh không có mô tả để tối đa hóa tầm nhìn.
  - Menu tùy chọn ẩn (More Options) giúp tránh bấm nhầm nút xóa.
- **Story Mode:** Tính năng "Phát kỷ niệm" tự động chuyển ảnh với thanh tiến trình như Instagram/Facebook Stories.
- **Skeleton Loading:** Hiệu ứng khung xương nhấp nháy khi đang tải dữ liệu, giảm cảm giác chờ đợi cho người dùng.
- **Glassmorphism:** Sử dụng hiệu ứng nền mờ (Backdrop blur) tạo cảm giác chiều sâu và hiện đại cho các thanh menu, modal.

## 📈 Tối ưu hóa SEO & Hiệu suất
- **SEO Metadata:** 
  - Cấu hình OpenGraph & Twitter Cards hoàn chỉnh (hiển thị ảnh và mô tả đẹp mắt khi chia sẻ qua Zalo, Facebook).
  - Sử dụng Semantic HTML (h1, header, main, aside, footer) giúp Google hiểu cấu trúc trang tốt hơn.
- **PWA (Progressive Web App):** 
  - Đã tích hợp `manifest.ts` cho phép người dùng "Cài đặt" ứng dụng trực tiếp lên màn hình chính điện thoại.
- **Performance Optimization:**
  - **Dynamic Imports:** Chỉ tải các module nặng (Gallery, GrowthPath, Vault) khi người dùng cuộn tới, giúp trang chủ tải cực nhanh.
  - **Image Priority:** Ưu tiên tải các ảnh quan trọng đầu trang, trì hoãn tải các ảnh dưới sâu.
  - **Cloudinary Helpers:** Tự động nén ảnh và chuyển đổi định dạng (WebP/AVIF) tùy trình duyệt.

## 🛠️ Tính năng đang hoạt động
1. **Thư viện ảnh:** Tải lên, gắn thẻ thành viên, xem lightbox.
2. **Hành trình phát triển (Growth Path):** Timeline các mốc thời gian quan trọng của gia đình.
3. **Kho lưu trữ (Family Vault):** Lưu giữ các ghi chú, tài liệu gia đình bảo mật qua Supabase.
4. **Cây gia phả (Family Tree):** Hình ảnh hóa mối quan hệ giữa các thành viên.
5. **Kỷ niệm ngày này năm xưa (On This Day):** Tự động nhắc lại các khoảnh khắc trong quá khứ.

---

## 📅 Lộ trình phát triển (1 tháng tới)

### Tuần 1: Hoàn thiện & Ổn định (Stability)
- [x] **Empty States**: Thiết kế các trạng thái "Trống" nghệ thuật cho các mục chưa có dữ liệu.
- [x] **Security Review**: Rà soát quyền truy cập Supabase (Row Level Security).
- [x] **Interactive Tree**: Nâng cấp Cây gia phả, cho phép xem nhanh thông tin thành viên.

### Tuần 2: Tương tác & Gắn kết (Social Features)
- [ ] **Interactions**: Kích hoạt tính năng Thả tim và Bình luận cho ảnh & Milestones.
- [ ] **Smart Sharing**: Tạo link chia sẻ nhanh cho từng Album (có bảo mật).
- [ ] **Family News**: Thêm banner thông báo sự kiện quan trọng ở đầu trang.

### Tuần 3: Đa phương tiện & Tìm kiếm (Advanced)
- [ ] **Video Support**: Hỗ trợ tải lên và xem video kỷ niệm ngắn.
- [ ] **Global Search**: Tìm kiếm ảnh theo chú thích, tên người hoặc mốc thời gian.
- [ ] **Monthly Highlights**: Tự động tổng hợp các khoảnh khắc đẹp nhất trong tháng.

### Tuần 4: Triển khai & Tinh chỉnh (Final Polish)
- [ ] **Production Deploy**: Triển khai chính thức lên Vercel với tên miền riêng.
- [ ] **Analytics**: Tích hợp Vercel Analytics để theo dõi mức độ tương tác.
- [ ] **Backup System**: Thiết lập quy trình sao lưu dữ liệu tự động hàng tuần.

---
*Cập nhật lần cuối: 17/04/2026*
