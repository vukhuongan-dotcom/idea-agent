# AGENTS.md — QUY CHUẨN KỸ THUẬT & QUY TẮC NỘI BỘ DỰ ÁN
> 📌 **Nguyên tắc nạp quy tắc tự động:** Tệp này được Antigravity tự động phát hiện và nạp khi hoạt động bên trong thư mục dự án (theo tài liệu hệ thống `agy-customizations/docs/rules.md`). Tệp áp dụng cho thư mục gốc và toàn bộ các thư mục con của dự án.  
> ⚖️ **Thứ tự ưu tiên bất biến:** Mọi quy tắc trong tệp này thuộc cấp độ Cục bộ Dự án (Local Project Rules). Nếu có bất kỳ xung đột nào với Bộ Quy tắc Toàn cục của Antigravity (`rules.md` Tầng 1–5: Approval Gate `v2:R01`, Rule Auto-Audit Gate `v2:R02`, Local-First `v2:R03`, Performance Policy Tầng 4, Runtime Primitives Tầng 5), **quy tắc toàn cục luôn có giá trị tối thượng**.

---

## 1. MỤC TIÊU & PHẠM VI DỰ ÁN
* **Tên dự án:** Idea Agent (Ghi nhận & Phát triển Ý tưởng với AI)
* **Mục tiêu cốt lõi:** 
  1. Ghi nhận tức thời ý tưởng nghiên cứu khoa học, cải tiến quy trình bệnh viện, quản lý lâm sàng và kỹ thuật ngoại khoa trên cả Laptop và Mobile.
  2. Phát triển và tổng hợp ý tưởng bằng DeepSeek AI thành các bản thảo học thuật hoàn chỉnh (Đề cương NCKH PICO, Sáng kiến Cải tiến MS1 Bệnh viện Bình Dân, Kế hoạch hành động, Phản biện).
  3. Hoạt động theo kiến trúc Local-First, đồng bộ dữ liệu an toàn qua Google Drive cá nhân (Zero-Backend) và hỗ trợ chế độ ngoại tuyến PWA 100%.
* **Công nghệ chủ đạo:** Vanilla JavaScript SPA, CSS Variables, esbuild + clean-css bundling, Playwright E2E Testing, DeepSeek Chat/Reasoner API, Google Identity Services (GIS) OAuth2, Service Worker Cache Storage.
* **Cơ quan chủ quản & Thẩm quyền duyệt:** BSCKII. Vũ Khương An — Phó Trưởng khoa Ngoại Đại trực tràng, Bệnh viện Bình Dân.

---

## 2. QUY CHUẨN LƯU TRỮ & PHÂN LOẠI FILE
1. **Tuân thủ Bảng Ma Trận Phân Loại Tệp Tin (`PROJECT_CONTEXT/FILE_CLASSIFICATION_MATRIX.md`):**
   - Mọi tệp tin tạo mới trong dự án bắt buộc phải nằm trong đúng thư mục được quy định (CLS-01 đến CLS-07).
   - Tuyệt đối cấm tạo file dữ liệu tạm hoặc file nghiệp vụ vô chủ ở thư mục gốc (Root Hygiene).
2. **Quy chuẩn đặt tên file & thư mục:**
   - Tuân thủ nghiêm ngặt skill `naming-convention`: Viết thường, nối từ bằng gạch dưới `snake_case` (cho scripts/data) hoặc `kebab-case` (cho web components/css).
   - Thư mục tài liệu, báo cáo, bản thảo tuân thủ phân tầng chuẩn.

---

## 3. CHÍNH SÁCH BẢO MẬT & BẢO VỆ DỮ LIỆU CÁ NHÂN (STRICT ZERO-PHI)
1. **Tuân thủ pháp luật:** Tuân thủ Luật Khám bệnh, chữa bệnh 15/2023/QH15, Luật Bảo vệ Dữ liệu Cá nhân 91/2025/QH15 và Nghị định 356/2025/NĐ-CP.
2. **Tuyệt đối cấm đưa thông tin định danh bệnh nhân (PHI) lên Git hoặc Cloud công cộng:**
   - Dữ liệu ý tưởng lâm sàng tuyệt đối không chứa họ tên thật, số CMND/CCCD, số hồ sơ bệnh án thật của bệnh nhân. Mọi tình huống lâm sàng phải được khử định danh hoặc ẩn danh hóa.
   - Thư mục `data/raw/` hoặc dữ liệu tạm bắt buộc nằm trong `.gitignore`.
3. **Bảo vệ mã khóa & Bí mật hệ thống:**
   - Tuyệt đối cấm commit API keys (DeepSeek API Key, Google OAuth Client Secrets), mật khẩu, file cấu hình `.env` vào repository.
   - API Key của người dùng lưu trên thiết bị thông qua `localStorage` và chỉ gửi trực tiếp từ trình duyệt đến endpoint chính thức của DeepSeek/Google qua kết nối HTTPS bảo mật.

---

## 4. QUY CHUẨN GHI NHẬN SỰ CỐ, TÍNH NĂNG MỚI & PHIÊN BẢN SẢN PHẨM (RULE v2:R45 [T3-QA] & v2:R47 [T3-DEV])
1. **Ghi nhận đồng bộ 100% trong cùng lượt commit/deploy:**
   - Mỗi khi Agent hoàn tất bất kỳ việc **SỬA LỖI (BUG)** hoặc **TRIỂN KHAI TÍNH NĂNG MỚI (FEAT)**, Agent **BẮT BUỘC** cập nhật vào Sổ theo dõi ngay trong cùng đợt commit/deploy tương ứng.
   - Tuyệt đối cấm commit code mà bỏ quên cập nhật Sổ theo dõi.
2. **Đồng bộ song hành 2 tệp SSoT (Không dùng symlink):**
   - Cập nhật đồng thời cả 2 tệp:
     * `docs/BUG_FIX_REGISTRY.md` (theo dõi trong Git repo).
     * `PROJECT_CONTEXT/BANG_TONG_HOP_LOI_VA_KHAC_PHUC.md` (lưu trữ trong bộ não tri thức dự án).
3. **Tuân thủ Schema v3.1:** Đầy đủ 14 trường thông tin chuẩn hóa; bắt buộc có biên bản kiểm thử độc lập (`evidence_refs`) trước khi đánh dấu `VERIFIED_CLOSED`.
4. **Duy trì Sổ Lịch sử Phiên bản Sản phẩm (`version.md`):**
   - Tệp `version.md` tại thư mục gốc là Sổ Lịch sử Phát hành Sản phẩm (Keep a Changelog 1.1.0 & SemVer 2.0.0 `MAJOR.MINOR.PATCH`).
   - Trong quá trình phát triển/commit lẻ, ghi nhận tóm tắt thay đổi kèm mã truy vết (`[BUG-xxx]` / `[FEAT-xxx]`) vào mục `## [Unreleased]`. Khi chốt mốc phát hành (Release Cut), gom toàn bộ mục từ `## [Unreleased]` xuống tiêu đề phiên bản cụ thể.

---

## 5. QUY CHUẨN HIỆU NĂNG & NGÂN SÁCH BUNDLE GZIP
1. **Ngân sách nén Gzip bắt buộc:**
   - JavaScript bundle (`dist/bundle.min.js`): Trần **$le 32$ KB gzip** (tương đương 32,768 Bytes).
   - CSS bundle (`dist/bundle.min.css`): Trần **$le 12$ KB gzip** (tương đương 12,288 Bytes).
2. **Tính nhất quán Build:**
   - Danh sách tệp trong `index.html` và `build.js` bắt buộc phải khớp 100%. Không thêm tệp JS/CSS mới mà không khai báo đồng thời ở cả hai nơi.
3. **Kiểm thử tự động trước hoàn tất:**
   - 100% test Playwright trong `tests/ux.spec.js` phải XANH trên cả môi trường mã nguồn gốc (`source`) và bản nén sản xuất (`dist/`) trước khi thông báo hoàn tất.
