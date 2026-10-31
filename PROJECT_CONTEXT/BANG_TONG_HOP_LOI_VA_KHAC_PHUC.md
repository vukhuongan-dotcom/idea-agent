# BẢNG TỔNG HỢP LỖI & TÍNH NĂNG MỚI (BUG & FEATURE REGISTRY SCHEMA V3.1)
## Hệ Thống / Dự Án: Idea Agent

> 📌 **Quy tắc Quản trị Vòng đời Sản phẩm (Rule v2:R45 [T3-QA] / GEMINI.md §1.8):**
> 1. Mỗi khi Agent hoàn tất bất kỳ việc **SỬA LỖI (BUG)** hoặc **TRIỂN KHAI TÍNH NĂNG MỚI (FEAT)**, Agent **BẮT BUỘC 100%** phải cập nhật thêm dòng mới vào bảng này ngay trong cùng đợt commit/deploy tương ứng.
> 2. Sử dụng chung một chuỗi STT tăng dần liên tục: mã `BUG-xxx` cho sửa lỗi và `FEAT-xxx` cho tính năng mới.
> 3. Cập nhật đồng bộ song hành 100% giữa 2 tệp: `docs/BUG_FIX_REGISTRY.md` (Git repo) và `PROJECT_CONTEXT/BANG_TONG_HOP_LOI_VA_KHAC_PHUC.md` (Brain SSoT). Tuyệt đối không dùng symlink.

---

## 📊 1. THỐNG KÊ TỔNG QUAN

* **Tổng số sự cố & tính năng ghi nhận:** 11
* **Đang xử lý (`OPEN`):** 0
* **Đã phong tỏa an toàn (`CONTAINED`):** 0
* **Đã sửa, chờ kiểm chứng (`FIXED_PENDING_VERIFY`):** 0
* **Đã xác minh hoàn tất (`VERIFIED_CLOSED`):** 11
* **Mở lại sau đóng (`REOPENED`):** 0

---

## 📋 2. MA TRẬN THEO DÕI SỰ CỐ & TÍNH NĂNG (SCHEMA V3.1 — 14 TRƯỜNG BẮT BUỘC)

| STT | Mã định danh | Ngày ghi nhận | Commit Link | Phân hệ ảnh hưởng | Tiêu đề tóm tắt | Hiện tượng / Bối cảnh | Mức độ | Trạng thái RCA | Giải pháp & Build | Trạng thái kỹ thuật | Biên lai xác minh | Rủi ro tồn dư | Ngày đóng & Người duyệt |
|:---:|:---:|:---:|:---:|:---:|---|---|:---:|:---:|---|:---:|---|---|:---:|
| 1 | `FEAT-001` | 2026-03-30 | [`4b8d517`](https://github.com/vukhuongan-dotcom/idea-agent/commit/4b8d517) | Core Framework | Khởi tạo Idea Agent v1.0 | Xây dựng khung ứng dụng ghi nhận ý tưởng ban đầu | N/A | N/A | Vanilla JS SPA, LocalStorage Store, Giao diện thẻ cơ bản | `VERIFIED_CLOSED` | E2E Manual Test Passed | Không | 2026-03-30 — BSCKII. Vũ Khương An |
| 2 | `FEAT-002` | 2026-05-11 | [`2b10289`](https://github.com/vukhuongan-dotcom/idea-agent/commit/2b10289) | AI & PWA | Nâng cấp v1.1 DeepSeek & PWA | Tích hợp DeepSeek AI, PWA Manifest và pipeline build | N/A | N/A | Bổ sung build.js, manifest.json, DeepSeek API integration | `VERIFIED_CLOSED` | Build Passed (JS 75KB, CSS 41KB) | Không | 2026-05-11 — BSCKII. Vũ Khương An |
| 3 | `BUG-001` | 2026-10-27 | [`b514454`](https://github.com/vukhuongan-dotcom/idea-agent/commit/b514454) | UI Sidebar | Sửa lỗi Sidebar đè nội dung tablet | Selector gộp tại css/sidebar.css:382 làm bundle bỏ khối; che 188px trên iPad | P1 - High | VERIFIED_ROOT_CAUSE | Tách 2 khối CSS riêng; nút » luôn hiện 44x44px; nav item có aria-label | `VERIFIED_CLOSED` | Playwright Test L1.1 Passed (820px, 1024px) | Không | 2026-10-27 — BSCKII. Vũ Khương An |
| 4 | `BUG-002` | 2026-10-27 | [`b514454`](https://github.com/vukhuongan-dotcom/idea-agent/commit/b514454) | Data Storage | Xử lý lỗi đầy bộ nhớ QuotaExceeded | Store.save() nuốt lỗi; addDraft vẫn báo thành công khi không lưu được | P0 - Critical | VERIFIED_ROOT_CAUSE | Store.save() trả boolean; hiển thị toast đỏ cảnh báo; thêm thanh đo dung lượng Cài đặt | `VERIFIED_CLOSED` | Playwright Test L1.2 Passed | Không | 2026-10-27 — BSCKII. Vũ Khương An |
| 5 | `BUG-003` | 2026-10-27 | [`b514454`](https://github.com/vukhuongan-dotcom/idea-agent/commit/b514454) | Data Integrity | Bảo vệ trạng thái ý tưởng không bị đè | addDraft đè status reviewed/archived thành draft_vN | P1 - High | VERIFIED_ROOT_CAUSE | Tách số bản thảo khỏi trạng thái; di trú draft_vN sang developing | `VERIFIED_CLOSED` | Playwright Test L1.3a Passed | Không | 2026-10-27 — BSCKII. Vũ Khương An |
| 6 | `BUG-004` | 2026-10-27 | [`b514454`](https://github.com/vukhuongan-dotcom/idea-agent/commit/b514454) | Data Integrity | Bảo toàn liên kết ngoài top 15 | Modal sửa chỉ liệt kê 15 ý tưởng làm mất liên kết cũ khi lưu | P1 - High | VERIFIED_ROOT_CAUSE | Giữ nguyên liên kết ngoài danh sách; dọn dẹp liên kết 2 chiều khi xóa | `VERIFIED_CLOSED` | Playwright Test L1.3b/L1.3c Passed | Không | 2026-10-27 — BSCKII. Vũ Khương An |
| 7 | `BUG-005` | 2026-10-27 | [`b514454`](https://github.com/vukhuongan-dotcom/idea-agent/commit/b514454) | Data Integrity | Chống tái dùng ID ý tưởng | Xóa ID -003 rồi tạo mới lại ra -003 làm sai lệch liên kết | P1 - High | VERIFIED_ROOT_CAUSE | Bộ đếm tăng đơn điệu theo ngày stats.seq[YYYY-MM-DD]; chỉ tăng | `VERIFIED_CLOSED` | Playwright Test L1.3c Passed | Không | 2026-10-27 — BSCKII. Vũ Khương An |
| 8 | `BUG-006` | 2026-10-27 | [`b514454`](https://github.com/vukhuongan-dotcom/idea-agent/commit/b514454) | AI Engine | Xử lý trọn vẹn văn bản AI | processAction cắt cụt ở 1.000 ký tự và đọc sai phiên bản | P1 - High | VERIFIED_ROOT_CAUSE | Gỡ bỏ substring(0, 1000); bám sát đúng version đang chọn | `VERIFIED_CLOSED` | Playwright Test L1.4 Passed | Không | 2026-10-27 — BSCKII. Vũ Khương An |
| 9 | `FEAT-003` | 2026-10-27 | [`b514454`](https://github.com/vukhuongan-dotcom/idea-agent/commit/b514454) | UI/UX & A11y | Nâng cấp toàn diện UI/UX Mobile v2.1 | Cải tiến giao diện di động 390x844, Timeline 1 cột và thẻ A11y | N/A | N/A | Stretched link card, nút lọc aria-pressed, WCAG AA contrast, Hero <= 220px | `VERIFIED_CLOSED` | Playwright Suite L2 + L3 (34 tests passed) | Không | 2026-10-27 — BSCKII. Vũ Khương An |
| 10 | `FEAT-004` | 2026-10-27 | [`b514454`](https://github.com/vukhuongan-dotcom/idea-agent/commit/b514454) | Search & Parser | Tìm kiếm không dấu & Bóc tách token | Tìm kiếm tiếng Việt không dấu, danh sách phẳng ưu tiên và smart parser | N/A | N/A | Utils.removeVietnameseTones, parseQuickText edge cases, gzip budget | `VERIFIED_CLOSED` | Playwright Suite L4 (10 tests passed) | Không | 2026-10-27 — BSCKII. Vũ Khương An |
| 11 | `BUG-007` | 2026-10-30 | `939a1c3` | Project Scaffold (`version.md` & `node_modules/`) | Khắc phục 3 lỗi hậu kiểm Rule v2:R47 v2.2 | `ag_lint` báo 2 lỗi `SCAFFOLD_PATH_TRAVERSAL` do symlink Playwright trỏ ra ngoài gốc dự án và 1 lỗi `VERSION_UNRENDERED_PLACEHOLDER` kèm vỡ ký tự escape trong `version.md` | P2 - Medium | VERIFIED_ROOT_CAUSE | Cách ly 2 symlink ngoại vi sang `~/_to_delete/idea_agent_symlinks_20261030/`; chuẩn hóa Unicode và biểu thức ngày trong `version.md` | `VERIFIED_CLOSED` | `ag_lint.py --check-scaffold --require-version-md` đạt 0 errors, 0 warnings + `npm run build` exit 0 | Không | 2026-10-30 — BSCKII. Vũ Khương An |

---

### 📖 Hướng Dẫn Điền Chuẩn Schema v3.1:
* **Mức độ (Severity):** `P0 - Critical` (Rò rỉ PHI, mất dữ liệu, sai phác đồ, sập hệ thống) | `P1 - High` (Hỏng chức năng chính, sai thể thức lớn) | `P2 - Medium` (Lỗi giao diện, lỗi định dạng nhỏ) | `P3 - Low` (Lỗi chính tả, formatting phụ) | `N/A` (Dành cho `FEAT`).
* **Trạng thái RCA:** `VERIFIED_ROOT_CAUSE` | `HYPOTHESIS_PENDING_VERIFY` | `UNVERIFIED_ROOT_CAUSE` | `N/A`.
* **Trạng thái kỹ thuật:** `OPEN` | `CONTAINED` | `FIXED_PENDING_VERIFY` | `VERIFIED_CLOSED` | `REOPENED` | `UNVERIFIED_HISTORICAL`.
* **Biên lai xác minh:** BẮT BUỘC khi chuyển sang `VERIFIED_CLOSED` (ghi rõ Target file, Hash, lệnh test, exit code, log URI).
* **Ngày đóng & Người duyệt:** BẮT BUỘC khi `VERIFIED_CLOSED` (`YYYY-MM-DD — BSCKII. Vũ Khương An`).
