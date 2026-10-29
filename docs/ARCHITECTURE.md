# KIẾN TRÚC KỸ THUẬT HỆ THỐNG IDEA AGENT

## 1. MÔ HÌNH KIẾN TRÚC (LOCAL-FIRST ARCHITECTURE)
Idea Agent vận hành theo triết lý **Local-First**:
1. Toàn bộ dữ liệu được lưu trữ trực tiếp trong `localStorage` của trình duyệt để đảm bảo tốc độ phản hồi tức thì (0ms latency).
2. Ứng dụng không phụ thuộc vào máy chủ backend riêng, loại bỏ hoàn toàn chi phí vận hành máy chủ và nguy cơ rò rỉ dữ liệu qua bên thứ ba.
3. Đồng bộ đám mây sử dụng Google Drive REST API thông qua phạm vi `drive.appdata` an toàn.

## 2. SƠ ĐỒ LUỒNG DỮ LIỆU (DATA FLOW)
```
[User Input] --> [Capture Engine (Smart Parser)]
                      |
                      v
             [Store (localStorage)] <---> [Google Drive Sync (appDataFolder)]
                      |
        +-------------+-------------+
        |                           |
        v                           v
[Timeline Engine]           [Draft Engine]
(Filters, Search, Sort)     (DeepSeek AI Prompts)
                                    |
                                    v
                            [DOCX / MD Exporter]
```

## 3. PIPELINE ĐÓNG GÓI & KIỂM THỬ (CI/CD)
- **Công cụ nén:** `esbuild` nén JavaScript, `clean-css` nén CSS, `zlib` nén Gzip.
- **Ngân sách Bundle:** JS $\le 32$ KB gzip, CSS $\le 12$ KB gzip.
- **Kiểm thử E2E:** `playwright` kiểm thử tự động 92+ kịch bản trên cả mã nguồn và bản nén sản xuất.
- **Triển khai:** GitHub Actions tự động build và deploy lên GitHub Pages khi có commit đẩy lên nhánh `main`.
