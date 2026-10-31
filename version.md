# Lịch Sử Phiên Bản (Changelog) — Idea Agent

Mọi thay đổi đáng chú ý của dự án được ghi nhận tại tệp này.

Định dạng tuân thủ chuẩn [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/) và quy tắc đánh số phiên bản theo [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) (`MAJOR.MINOR.PATCH`).
Các nhóm phân loại hợp lệ: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

## [Unreleased]

### Added
- [FEAT-005] Khởi tạo bộ khung dự án chuẩn hóa theo Project Inception Gate (Rule v2:R47).
- [FEAT-006] Kế hoạch đồng bộ đa thiết bị qua Google Drive AppData Folder (Local-First Cloud Sync).
- [FEAT-007] Kế hoạch bộ xuất file Word .docx chuẩn thể thức hành chính Nghị định 30 & Bệnh viện Bình Dân.
- [FEAT-008] Kế hoạch hoàn thiện hạ tầng Service Worker & Offline PWA.

### Fixed
- [BUG-007] Khắc phục lỗi ký tự escape trong `version.md` và cách ly 2 symlink ngoại vi trong `node_modules/` theo hậu kiểm `Rule v2:R47 v2.2`.

## [2.1.0] - 2026-10-27

### Fixed
- [BUG-001] Khắc phục triệt để lỗi selector gộp tại `sidebar.css` gây đè nội dung trên iPad (820px, 1024px); khôi phục nút mở lại `»` kích thước ≥ 44px.
- [BUG-002] Khắc phục nuốt lỗi hạn ngạch `QuotaExceededError` trong `Store.save()`; thêm thanh đo dung lượng bộ nhớ tại Cài đặt.
- [BUG-003] Sửa lỗi đè trạng thái `reviewed`/`archived` thành `draft_vN`; chuẩn hóa trạng thái phát triển thành `developing`.
- [BUG-004] Ngăn chặn xóa mất liên kết cũ ngoài top 15 trong Modal Chỉnh sửa; dọn dẹp liên kết 2 chiều khi xóa ý tưởng.
- [BUG-005] Khắc phục tái dùng ID đã xóa bằng bộ đếm tăng đơn điệu theo ngày (`stats.seq[<ngay_iso>]` (ví dụ `stats.seq["2026-10-27"]`)).
- [BUG-006] Khắc phục AI cắt cụt văn bản ở 1.000 ký tự; bám sát phiên bản bản thảo đang xem.

### Changed
- [FEAT-003] Tái cấu trúc giao diện di động ≤ 768px: Hero Capture ≤ 220px, thẻ Timeline 1 cột gọn gàng ≤ 140px, gom tác vụ vào menu `⋯`, thanh AI dính đáy kết hợp Bottom Nav.
- [FEAT-004] Tìm kiếm không dấu tiếng Việt (NFD + `đ/Đ` → `d/D`); danh sách phẳng khi sắp xếp theo ưu tiên; bộ lọc ngày tháng linh hoạt; bộ bóc tách cú pháp thông minh bảo toàn email và phân biệt `\bAI\b`.
- [SEC-001] Nâng cấp tương phản màu chữ `--text-muted` đạt chuẩn WCAG AA ≥ 4.5:1; 100% phần tử tương tác ≥ 24px và đạt chuẩn cảm ứng ≥ 40px trên mobile.

## [2.0.0] - 2026-10-27

### Added
- Tích hợp mô hình DeepSeek AI (`deepseek-chat` & `deepseek-reasoner`) thay thế Gemini API.
- Bổ sung giỏ chọn đa ý tưởng và tổng hợp đa nguồn (Multi-idea Synthesis).
- Bổ sung giao diện tab phân đoạn cho trang Bản thảo trên di động.
- Thiết lập quy trình đóng gói và tối ưu hóa bundle bằng esbuild và clean-css.

## [1.1.0] - 2026-05-11

### Added
- Bổ sung PWA manifest, icon 192/512 và hỗ trợ cài đặt ứng dụng.
- Bổ sung cấu hình triển khai tự động GitHub Pages qua GitHub Actions.

## [1.0.0] - 2026-03-30

### Added
- Khởi tạo ứng dụng Idea Agent phiên bản đầu tiên với khả năng ghi nhận ý tưởng, lưu trữ localStorage và quản lý dòng thời gian.
