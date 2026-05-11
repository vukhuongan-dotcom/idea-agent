# Bàn giao: Kết quả Audit Website Idea Agent

**Ngày:** 2026-05-11  
**Người audit:** Claude Code (claude-sonnet-4-6)  
**URL:** https://vukhuongan-dotcom.github.io/idea-agent/  
**Tiêu chuẩn áp dụng:** WCAG 2.1 AA · OWASP Top 10 · Core Web Vitals · Google SEO · PWA Checklist · GDPR  

---

## Tóm tắt điểm số

| Hạng mục | Điểm |
|---|---|
| Performance | 6/10 |
| Security | 3/10 |
| Accessibility (WCAG 2.1) | 4/10 |
| SEO | 2/10 |
| PWA / Mobile | 5/10 |
| Code Quality | 4/10 |
| Privacy / GDPR | 5/10 |
| **Tổng** | **4.1/10** |

---

## Danh sách việc cần làm (ưu tiên)

### P0 — Bảo mật (fix ngay trước khi share link)

- [ ] **Thêm Security Headers** — tạo file `_headers` ở root (Cloudflare Pages) hoặc cấu hình qua Cloudflare Workers. GitHub Pages thuần không hỗ trợ custom headers, cần migrate sang Cloudflare Pages.

  ```
  Content-Security-Policy: default-src 'self'; script-src 'self' https://accounts.google.com https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data: https://*.googleusercontent.com; connect-src 'self' https://www.googleapis.com https://api.deepseek.com https://generativelanguage.googleapis.com
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  ```

- [ ] **Audit `innerHTML` rendering** — file `js/app.js:88` và tất cả `module.render()`. Đảm bảo mọi data từ user hoặc từ Store đi qua `Utils.escapeHtml()` trước khi chèn vào DOM. Ưu tiên dùng `textContent` thay `innerHTML` cho plain text.

  ```javascript
  // Nguy hiểm:
  main.innerHTML = module.render();
  
  // Tốt hơn: kiểm tra render() không dùng raw user data
  // Hoặc dùng DOMPurify trước khi assign
  ```

- [ ] **API Key trong localStorage** — `js/settings.js` lưu `geminiApiKey` vào localStorage dạng cleartext. Thêm warning UI: "Key này được lưu trên thiết bị của bạn — không dùng trên máy tính chung."

### P1 — Accessibility (WCAG 2.1 AA)

- [ ] **Thêm `aria-label` cho icon buttons** — `index.html`

  ```html
  <!-- Trước -->
  <button class="mobile-menu-btn" onclick="App.toggleSidebar()">☰</button>
  <button class="btn btn-icon btn-ghost" onclick="App.toggleTheme()">🌙</button>

  <!-- Sau -->
  <button class="mobile-menu-btn" aria-label="Mở menu" aria-expanded="false" aria-controls="sidebar" onclick="App.toggleSidebar()">☰</button>
  <button class="btn btn-icon btn-ghost" aria-label="Đổi giao diện" onclick="App.toggleTheme()">🌙</button>
  ```

- [ ] **Thêm `aria-expanded` trên sidebar toggle** — cập nhật `App.toggleSidebar()` trong `js/app.js` để set `aria-expanded="true/false"` đồng bộ.

- [ ] **Thêm `aria-current="page"` trên nav item đang active** — `App.updateActiveNav()` trong `js/app.js`

  ```javascript
  // Thêm vào updateActiveNav():
  el.setAttribute('aria-current', el.dataset.page === page ? 'page' : 'false');
  ```

- [ ] **Thêm `aria-hidden="true"` cho SVG icons decorative** trong `index.html` (tất cả `<svg>` trong nav items đã có `<span>` text bên cạnh)

- [ ] **Focus trap trong modal** — `js/app.js` hoặc file modal handler: khi modal mở, trap focus vào bên trong; khi đóng, trả focus về trigger.

- [ ] **Skip navigation link** — thêm dòng đầu tiên trong `<body>`:

  ```html
  <a href="#main-content" class="skip-link">Bỏ qua điều hướng</a>
  ```

### P2 — PWA & SEO

- [ ] **Tạo `manifest.json`** ở root — enable Add to Home Screen trên mobile

  ```json
  {
    "name": "Idea Agent",
    "short_name": "IdeaAgent",
    "description": "Hệ thống ghi nhận và phát triển ý tưởng với AI",
    "start_url": "/idea-agent/",
    "display": "standalone",
    "background_color": "#0f0f1a",
    "theme_color": "#8b5cf6",
    "icons": [
      { "src": "img/icon-192.png", "sizes": "192x192", "type": "image/png" },
      { "src": "img/icon-512.png", "sizes": "512x512", "type": "image/png" }
    ]
  }
  ```

  Thêm link trong `index.html`:
  ```html
  <link rel="manifest" href="manifest.json">
  ```

- [ ] **Tạo favicon** — đặt `favicon.ico` hoặc `favicon.svg` ở root, thêm `<link rel="icon">` vào `<head>`

- [ ] **Thêm Open Graph meta tags** vào `index.html`:

  ```html
  <meta property="og:title" content="Idea Agent — Ghi nhận & Phát triển Ý tưởng">
  <meta property="og:description" content="Hệ thống ghi nhận, phân loại và phát triển ý tưởng với AI">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://vukhuongan-dotcom.github.io/idea-agent/">
  ```

- [ ] **Tạo `robots.txt`** ở root:

  ```
  User-agent: *
  Disallow: /
  ```
  (app private → disallow toàn bộ là phù hợp)

### P3 — Code Quality

- [ ] **Đổi tên `js/gemini.js` → `js/ai.js`** và `var GeminiAI` → `var AI` — tên hiện tại misleading (code thực tế gọi DeepSeek API, không phải Gemini)

- [ ] **Xóa `console.log` trong production** — `js/app.js`: `console.log('💡 Idea Agent initialized')` và `js/auth.js`: `console.log('🔐 Google Auth initialized')`

- [ ] **Bundle + minify JS/CSS** — gộp 10 file JS và 6 file CSS thành 1 file mỗi loại. Dùng `esbuild` hoặc `vite` build step đơn giản. Giảm từ 16 HTTP requests xuống 2.

- [ ] **Thêm error boundary** cho page rendering — wrap `main.innerHTML = module.render()` trong try/catch, hiển thị fallback UI nếu render thất bại.

---

## Bằng chứng kỹ thuật

### HTTP Response Headers (thực tế)
```
HTTP/2 200
server: GitHub.com
strict-transport-security: max-age=31556952
cache-control: max-age=600
content-length: 7114
# Thiếu: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
```

### Performance
```
TTFB:          ~35ms (connect) + ~79ms (transfer)
Total time:    0.114s
HTML size:     7,114 bytes
JS/CSS:        16 unminified files, không bundle
Fonts:         2 Google Font families (Inter + JetBrains Mono)
```

### Cấu trúc file
```
index.html          (7.1 KB — HTML shell, content rendered by JS)
js/
  app.js            routing, page management
  auth.js           Google OAuth 2.0 (token flow)
  gemini.js         AI integration (DeepSeek API)
  store.js          localStorage wrapper + CRUD
  utils.js          helpers, escapeHtml, date formatting
  capture.js / timeline.js / draft.js / analytics.js / settings.js
css/
  variables.css     design tokens (purple/amber theme)
  base.css / sidebar.css / capture.css / timeline.css / draft.css / mobile.css
```

---

## Không cần làm

- Migration framework (React/Vue) — overkill cho scope hiện tại
- Backend/database — localStorage phù hợp với use case cá nhân
- Unit tests — trừ khi app mở rộng thêm logic phức tạp
- Đa ngôn ngữ — app rõ ràng dành cho người dùng tiếng Việt

---

## Ghi chú cho AG

App hiện tại là **single-page app thuần JS**, không có build step, deploy thẳng lên GitHub Pages. Trước khi implement, cần quyết định:

1. **Giữ GitHub Pages hay migrate sang Cloudflare Pages?** — Cloudflare Pages cho phép custom headers (cần cho P0 security), GitHub Pages thì không.
2. **Có thêm build step không?** — Nếu bundle JS/CSS (P3), cần setup workflow GitHub Actions để build rồi deploy.
3. **Scope người dùng** — nếu chỉ dùng cá nhân (1 người), P0 là quan trọng nhất. Nếu share link cho nhiều người dùng, cần fix toàn bộ P0+P1 trước.
