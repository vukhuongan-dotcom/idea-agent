# CONTEXT.md — Ngữ Cảnh Hệ Thống Idea Agent

## 1. TỔNG QUAN HỆ THỐNG
Idea Agent là ứng dụng web dạng Single-Page Application (SPA) tiến bộ (PWA) phục vụ công tác ghi nhận tức thời, phân loại, kết nối và phát triển ý tưởng nghiên cứu khoa học, cải tiến chất lượng và kỹ thuật ngoại khoa cho BSCKII. Vũ Khương An tại Bệnh viện Bình Dân.

## 2. KIẾN TRÚC MÃ NGUỒN & MODULES
- `index.html`: Khung HTML tĩnh duy nhất, nạp bundle hoặc các file module.
- `js/store.js`: Quản trị dữ liệu cục bộ `localStorage`, tự động di trú, bảo vệ hạn ngạch bộ nhớ, bộ đếm tăng đơn điệu không tái dùng ID.
- `js/utils.js`: Tiện ích dùng chung, chuẩn hóa tiếng Việt không dấu, định dạng ngày giờ, render markdown nâng cao.
- `js/auth.js`: Quản trị xác thực Google OAuth2 qua Google Identity Services (GIS).
- `js/ai.js`: Tích hợp DeepSeek API (`deepseek-chat` & `deepseek-reasoner`), cấu hình prompt chuyên biệt cho ngoại khoa và NCKH.
- `js/capture.js`: Phân hệ ghi nhận nhanh, bóc tách token cú pháp (`#tag`, `!cao`, `@lamsang`), mở rộng form chi tiết.
- `js/timeline.js`: Phân hệ dòng thời gian, bộ lọc đa năng, sắp xếp danh sách phẳng, chế độ chọn đa ý tưởng để tổng hợp.
- `js/draft.js`: Phân hệ soạn thảo và phát triển ý tưởng với AI, quản lý đa phiên bản bản thảo, xuất dữ liệu.
- `js/analytics.js`: Phân hệ thống kê, biểu đồ tiến độ và phân bố danh mục.
- `js/settings.js`: Cài đặt hệ thống, API keys, giao diện sáng/tối, đồng bộ và quản lý dung lượng.
- `js/app.js`: Điều phối ứng dụng, định tuyến hash-based, quản trị modal và focus trap.

## 3. CÁC QUY ƯỚC & THUẬT NGỮ CHUYÊN MÔN
- **Ý tưởng thô (`raw`):** Ý tưởng vừa được ghi nhận nhanh, chưa qua phát triển bản thảo.
- **Đang phát triển (`developing`):** Ý tưởng đã có ít nhất một bản thảo được AI hoặc người dùng tạo ra.
- **Đã duyệt (`reviewed`):** Ý tưởng và bản thảo đã được Bác sĩ kiểm tra, nghiệm thu đạt chất lượng.
- **Lưu trữ (`archived`):** Ý tưởng đã hoàn thành đề tài/báo cáo hoặc tạm gác lại.
- **PICO:** Khung nghiên cứu y khoa lâm sàng gồm Patient/Population, Intervention, Comparison, Outcome.
- **Sáng kiến MS1:** Mẫu biểu sáng kiến cải tiến kỹ thuật theo quy chuẩn quản lý chất lượng Bệnh viện Bình Dân.
