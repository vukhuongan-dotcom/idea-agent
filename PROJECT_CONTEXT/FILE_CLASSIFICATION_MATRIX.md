# BẢNG MA TRẬN PHÂN LOẠI TỆP TIN DỰ ÁN (FILE CLASSIFICATION MATRIX)
**Dự án:** Idea Agent  
**Phiên bản:** 1.0 (Khởi tạo Day-0 theo Rule v2:R47)  
**Tiêu chuẩn tham khảo:** ISO 15489-1:2016 Records Management (§8.3 Business Classification System & §9.4 Classification and Indexing)  
**Căn cứ pháp lý bảo vệ dữ liệu:** Luật Khám bệnh, chữa bệnh số 15/2023/QH15, Luật Bảo vệ Dữ liệu Cá nhân số 91/2025/QH15, Nghị định số 356/2025/NĐ-CP

---

## 📊 1. MA TRẬN PHÂN LOẠI TỆP TIN (FILE TAXONOMY MATRIX)

| Mã Nhóm | Phân Loại Nghiệp Vụ | Định Dạng Cho Phép | Thư Mục Bắt Buộc | Điểm Đến Lưu Trữ & Chính Sách Git | Mức Độ Bảo Mật & Quyền Hạn |
|:---:|---|---|---|---|:---:|
| **CLS-01** | **Mã nguồn & Scripts** | `.js`, `.css`, `.html`, `.sh` | `js/`, `css/`, `scripts/`, `build.js` | `CODE_REPOSITORY` — Git Versioned | Nội bộ (Internal) |
| **CLS-02** | **Đặc tả & Kiến trúc dự án** | `.md`, `.json`, `.yaml`, `.mmd` | `PROJECT_CONTEXT/`, `docs/` | `CODE_REPOSITORY` — Git Versioned (SSoT Brain) | Nội bộ (Internal) |
| **CLS-03** | **Quy tắc nội bộ dự án** | `AGENTS.md` | Thư mục gốc (`project_root/`) | `CODE_REPOSITORY` — Git Versioned (Tự nạp tự động) | Nội bộ (Internal) |
| **CLS-04** | **Dữ liệu lâm sàng thô (Raw PHI)** | `.xlsx`, `.csv`, `.sqlite`, `.json` | `data/raw/` (nếu có) | `LOCAL_SANDBOX` — **BẮT BUỘC nằm trong `.gitignore`**. Tuyệt đối cấm commit Git/Git LFS hay đẩy lên Cloud công cộng. | **Tuyệt mật (Strict Zero-PHI)** |
| **CLS-05** | **Dữ liệu nghiên cứu / Ý tưởng khử định danh** | `.json`, `.md` | `ideas/`, `drafts/` | **Mặc định `LOCAL_SANDBOX`** hoặc lưu trong localStorage người dùng. Không commit thông tin nhạy cảm. | Hạn chế (Restricted) |
| **CLS-06** | **Tài liệu hành chính & Bản thảo xuất bản** | `.docx`, `.pdf`, `.md` | `artifacts/`, `exports/` | `CODE_REPOSITORY` hoặc lưu trữ cá nhân. Tuân thủ thể thức Nghị định 30/2020/NĐ-CP (100% trắng đen theo Rule `v2:R43`). | Hạn chế (Restricted) |
| **CLS-07** | **Sổ theo dõi sự cố, Tính năng & Lịch sử phiên bản** | `.md` | `docs/BUG_FIX_REGISTRY.md`, `PROJECT_CONTEXT/BANG_TONG_HOP_LOI_VA_KHAC_PHUC.md` & `version.md` (tại thư mục gốc) | `CODE_REPOSITORY` — Git Versioned theo Rule `v2:R45 [T3-QA]` & Rule `v2:R47 [T3-DEV]`. Cập nhật đồng bộ trong cùng 1 commit. | Nội bộ (Internal) |

---

## 🔒 2. CHÍNH SÁCH ĐIỂM ĐẾN DỮ LIỆU & BẢO VỆ PHI
1. **`LOCAL_SANDBOX`:** Thư mục lưu trữ cục bộ trên máy trạm của Bác sĩ An, phân quyền `0700`/`0600`, nằm trong danh sách loại trừ của `.gitignore`.
2. **`CODE_REPOSITORY`:** Kho mã nguồn Git nội bộ của dự án tại GitHub `vukhuongan-dotcom/idea-agent`. Mọi tệp tin trước khi commit bắt buộc phải được quét sạch thông tin định danh bệnh nhân (Zero-PHI) và bí mật hệ thống (API keys, passwords, credentials).
3. **`GOOGLE_DRIVE_APPDATA`:** Thư mục ẩn riêng tư trên Google Drive của người dùng, truy cập thông qua phạm vi `drive.appdata`, cách ly hoàn toàn với dữ liệu Drive cá nhân khác.

---

## 🚫 3. QUY ĐỊNH VỀ TỆP TIN Ở THƯ MỤC GỐC (ROOT HYGIENE)
* Thư mục gốc (`project_root/`) chỉ được phép chứa các tệp tin quản trị hệ thống chuẩn: `AGENTS.md`, `README.md`, `version.md`, `package.json`, `package-lock.json`, `index.html`, `build.js`, `playwright.config.js`, `manifest.json`, `robots.txt`, `favicon.svg`, `sw.js`, và `.gitignore`.
* **Nghiêm cấm tuyệt đối:** Cấm tạo các tệp nghiệp vụ, file dữ liệu tạm thời, tệp không phân loại nằm rải rác ở thư mục gốc. Mọi tệp mới sinh ra phải được ánh xạ vào đúng danh mục CLS-01 đến CLS-07 trên đây.
