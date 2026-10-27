/* ========================================
   IDEA AGENT — Utilities
   Helper functions, formatting, icons
   ======================================== */

var Utils = {
  // ========================
  // DATE FORMATTING
  // ========================

  formatDate(dateStr) {
    const d = new Date(dateStr);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const day = days[d.getDay()];
    return `${day}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  },

  formatDateFull(dateStr) {
    const d = new Date(dateStr);
    const days = ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
    return `${days[d.getDay()]}, ${d.getDate()} tháng ${d.getMonth() + 1}, ${d.getFullYear()}`;
  },

  formatTime(dateStr) {
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  },

  formatRelative(dateStr) {
    const diff = (Date.now() - new Date(dateStr)) / 1000;
    const m = Math.floor(diff / 60), h = Math.floor(diff / 3600), d = Math.floor(diff / 86400);
    if (m < 1) return 'Vừa xong';
    if (m < 60) return `${m} phút trước`;
    if (h < 24) return `${h} giờ trước`;
    if (d < 7) return `${d} ngày trước`;
    return this.formatDate(dateStr);
  },

  isToday(dateStr) {
    return new Date(dateStr).toDateString() === new Date().toDateString();
  },

  isYesterday(dateStr) {
    const y = new Date(); y.setDate(y.getDate() - 1);
    return new Date(dateStr).toDateString() === y.toDateString();
  },

  nextStatus(status) {
    const order = ['raw', 'reviewed', 'archived'];
    const curIdx = order.indexOf(status?.startsWith('draft') ? 'raw' : status);
    return order[(curIdx + 1) % order.length] || 'reviewed';
  },

  getDateLabel(dateKey) {
    // dateKey: YYYY-MM-DD
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    if (this.isToday(date)) return 'Hôm nay';
    if (this.isYesterday(date)) return 'Hôm qua';
    return this.formatDateFull(date);
  },

  // ========================
  // CATEGORY
  // ========================

  categories: {
    research: { label: 'Nghiên cứu', icon: '🔬', color: 'var(--cat-research)' },
    clinical: { label: 'Lâm sàng', icon: '🏥', color: 'var(--cat-clinical)' },
    tech: { label: 'Công nghệ', icon: '💻', color: 'var(--cat-tech)' },
    personal: { label: 'Cá nhân', icon: '👤', color: 'var(--cat-personal)' },
    business: { label: 'Kinh doanh', icon: '📈', color: 'var(--cat-business)' },
  },

  getCategoryLabel(cat) {
    return this.categories[cat]?.label || cat;
  },

  getCategoryIcon(cat) {
    return this.categories[cat]?.icon || '💡';
  },

  // ========================
  // PRIORITY
  // ========================

  priorities: {
    low: { label: 'Thấp', icon: '○' },
    medium: { label: 'Trung bình', icon: '◐' },
    high: { label: 'Cao', icon: '●' },
    critical: { label: 'Quan trọng', icon: '🔴' },
  },

  getPriorityLabel(p) {
    return this.priorities[p]?.label || p;
  },

  // ========================
  // STATUS
  // ========================

  statusOptions: {
    raw: { label: '💭 Ý tưởng thô' },
    developing: { label: '⚙️ Đang phát triển' },
    reviewed: { label: '✅ Đã review' },
    archived: { label: '📦 Lưu trữ' }
  },

  getStatusLabel(status) {
    if (this.statusOptions[status]) return this.statusOptions[status].label;
    if (status?.startsWith('draft_v')) return `Bản thảo v${status.split('v')[1]}`;
    return status;
  },

  getStatusClass(status) {
    if (status === 'raw') return 'status-raw';
    if (status === 'developing') return 'status-developing';
    if (status.startsWith('draft')) return 'status-draft';
    if (status === 'reviewed') return 'status-reviewed';
    if (status === 'archived') return 'status-archived';
    return 'status-raw';
  },

  // ========================
  // MARKDOWN RENDERING (simple)
  // ========================

  renderMarkdown(text) {
    if (!text) return '';

    // 1. Escape HTML — BẮT BUỘC giữ nguyên thứ tự & < > ở ngay đầu hàm
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // 2. Fenced code blocks trước khi xử lý inline code
    const codeBlocks = [];
    html = html.replace(/```([a-zA-Z0-9_-]*)\r?\n?([\s\S]*?)```/g, (_, lang, code) => {
      const idx = codeBlocks.length;
      codeBlocks.push(`<pre><code${lang ? ` class="language-${lang}"` : ''}>${code.trim()}</code></pre>`);
      return `<!--CODEBLOCK_${idx}-->`;
    });

    // 3. Tables
    html = html.replace(/((?:^|\n)\|[^\n]+\|\r?\n\|[-:\s|]+\|\r?\n(?:\|[^\n]+\|\r?\n?)+)/g, (match) => {
      const lines = match.trim().split('\n').map(l => l.trim());
      if (lines.length < 2) return match;
      const parseRow = row => row.split('|').slice(1, -1).map(c => c.trim());
      const headers = parseRow(lines[0]);
      const bodyRows = lines.slice(2).map(parseRow);
      const ths = headers.map(h => `<th>${h}</th>`).join('');
      const trs = bodyRows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
      return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
    });

    // 4. Blockquotes: gộp các dòng liên tiếp bắt đầu bằng &gt;
    html = html.replace(/((?:^|\n)&gt;[^\n]+(?:\r?\n&gt;[^\n]+)*)/g, (match) => {
      const content = match.trim().split('\n').map(l => l.replace(/^&gt;\s?/, '')).join('<br>');
      return `<blockquote>${content}</blockquote>`;
    });

    // 5. Headers (h4 đến h1)
    html = html.replace(/^(#{1,4})\s+(.+)$/gm, (_, h, t) => `<h${h.length}>${t}</h${h.length}>`);

    // 6. Bold & Italic
    html = html
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 7. Inline code
    html = html.replace(/\x60([^\x60]+)\x60/g, '<code>$1</code>');

    // 8. Lists: phân biệt rõ ràng ul và ol
    html = html.replace(/((?:^|\n)\s*[-*]\s+[^\n]+(?:\r?\n\s*[-*]\s+[^\n]+)*)/g, (match) => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\s*[-*]\s+/, '')}</li>`).join('');
      return `<ul>${items}</ul>`;
    });

    html = html.replace(/((?:^|\n)\s*\d+\.\s+[^\n]+(?:\r?\n\s*\d+\.\s+[^\n]+)*)/g, (match) => {
      const items = match.trim().split('\n').map(l => `<li>${l.replace(/^\s*\d+\.\s+/, '')}</li>`).join('');
      return `<ol>${items}</ol>`;
    });

    // Restore code blocks
    html = html.replace(/<!--CODEBLOCK_(\d+)-->/g, (_, i) => codeBlocks[Number(i)]);

    // Paragraph formatting
    return html
      .split(/\n{2,}/)
      .map(p => {
        p = p.trim();
        if (!p) return '';
        if (/^(<(?:h[1-6]|ul|ol|table|blockquote|pre)[ >])/.test(p)) return p;
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      })
      .filter(Boolean)
      .join('\n');
  },

  renderOptions(obj, sel) {
    return Object.entries(obj).map(([k, v]) => `<option value="${k}" ${sel === k ? 'selected' : ''}>${v.icon ? v.icon + ' ' : ''}${v.label}</option>`).join('');
  },

  // ========================
  // SVG ICONS
  // ========================

  icons: {
    capture: '<path d="M12 5v14M5 12h14"/>',
    timeline: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    draft: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    analytics: '<path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
    delete: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
    ai: '<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>',
    back: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    export: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>',
    moon: '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',
    menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    archive: '<polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>',
  },

  icon(name, size = 20) {
    const inner = this.icons[name] || '';
    return inner ? `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${inner}</svg>` : '';
  },

  // ========================
  // TOAST NOTIFICATION
  // ========================

  showToast(message, type = 'info', duration = 3000) {
    let c = document.querySelector('.toast-container');
    if (!c) {
      c = document.createElement('div');
      c.className = 'toast-container';
      document.body.appendChild(c);
    }
    const t = document.createElement('div');
    t.className = `toast toast-${type}`;
    t.innerHTML = `<span>${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span><span>${message}</span>`;
    c.appendChild(t);
    setTimeout(() => {
      t.style.animation = 'toast-slide-out 0.3s ease forwards';
      setTimeout(() => t.remove(), 300);
    }, duration);
  },

  // ========================
  // DEBOUNCE
  // ========================

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), delay);
    };
  },

  // ========================
  // ESCAPE HTML
  // ========================

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // ========================
  // TRUNCATE TEXT
  // ========================

  truncate(str, maxLen = 100) {
    if (!str || str.length <= maxLen) return str || '';
    return str.substring(0, maxLen) + '...';
  },

  // ========================
  // DOWNLOAD FILE
  // ========================

  downloadFile(content, filename, mimeType = 'text/plain') {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const a = Object.assign(document.createElement('a'), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // ========================
  // CLIPBOARD COPY
  // ========================

  async copyToClipboard(text, successMsg = '📋 Đã sao chép vào clipboard!') {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = Object.assign(document.createElement('textarea'), { value: text });
        textarea.style.cssText = 'position:fixed;opacity:0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        textarea.remove();
      }
      this.showToast(successMsg, 'success');
    } catch (e) {
      this.showToast('Không thể sao chép: ' + e.message, 'error');
    }
  },
};
