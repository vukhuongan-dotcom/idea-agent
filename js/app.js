/* ========================================
   IDEA AGENT — App Controller
   Main routing, page management, init
   ======================================== */

var App = {
  currentPage: 'capture',
  currentDraftId: null,
  _lastFocusedEl: null,

  pages: {
    capture: { title: 'Ghi nhận', icon: 'capture', module: 'Capture' },
    timeline: { title: 'Timeline', icon: 'timeline', module: 'Timeline' },
    analytics: { title: 'Phân tích', icon: 'analytics', module: 'Analytics' },
    settings: { title: 'Cài đặt', icon: 'settings', module: 'Settings' },
  },

  init() {
    Store.init();

    const settings = Store.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());

    Capture.initShortcuts();
    this.initGlobalShortcuts();

    GoogleAuth.init();

    this.updateSidebarStats();
    this.updateThemeIcon();
    this.updateAIStatusBadge();
  },

  handleRoute() {
    const hash = location.hash.slice(1) || 'capture';

    if (hash.startsWith('draft/')) {
      const ideaId = hash.replace('draft/', '');
      this.currentPage = 'draft';
      this.currentDraftId = ideaId;
      this.renderPage();
      this.updateActiveNav('timeline');
      return;
    }

    if (this.pages[hash]) {
      this.currentPage = hash;
      this.currentDraftId = null;
      this.renderPage();
      this.updateActiveNav(hash);
    } else {
      this.navigate('capture');
    }
  },

  navigate(page) {
    location.hash = page;
  },

  viewDraft(ideaId) {
    location.hash = `draft/${ideaId}`;
  },

  renderPage() {
    const main = document.getElementById('main-content');
    if (!main) return;

    try {
      if (this.currentPage === 'draft' && this.currentDraftId) {
        main.innerHTML = Draft.render(this.currentDraftId);
        return;
      }

      const pageConfig = this.pages[this.currentPage];
      if (!pageConfig) return;

      const module = window[pageConfig.module];
      if (module && module.render) {
        main.innerHTML = module.render();
      }

      document.title = `${pageConfig.title} — Idea Agent`;
    } catch (err) {
      main.innerHTML = `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted)">
          <div style="font-size: 2rem; margin-bottom: 1rem">⚠️</div>
          <p>Có lỗi khi tải trang. Vui lòng thử lại.</p>
          <button class="btn btn-secondary" style="margin-top: 1rem" onclick="App.navigate('capture')">Về trang chính</button>
        </div>`;
    }
  },

  renderCurrentPage() {
    this.renderPage();
  },

  updateActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(el => {
      const isActive = el.dataset.page === page;
      el.classList.toggle('active', isActive);
      // Accessibility: aria-current
      if (isActive) {
        el.setAttribute('aria-current', 'page');
      } else {
        el.removeAttribute('aria-current');
      }
    });
  },

  updateSidebarStats() {
    const data = Store.getData();
    const statsEl = document.getElementById('sidebar-stats');
    if (statsEl) {
      statsEl.innerHTML = `
        <div class="sidebar-stat">💡 <strong>${data.ideas.length}</strong> ý tưởng</div>
        <div class="sidebar-stat">📝 <strong>${data.stats.totalDrafts || 0}</strong> bản thảo</div>
      `;
    }

    const badge = document.getElementById('nav-timeline-badge');
    if (badge) {
      badge.textContent = data.ideas.length;
      badge.style.display = data.ideas.length > 0 ? 'inline' : 'none';
    }
  },

  updateThemeIcon() {
    const settings = Store.getSettings();
    const isDark = settings.theme === 'dark';
    const btns = [
      document.getElementById('theme-toggle-btn'),
      document.getElementById('mobile-theme-btn'),
    ];
    btns.forEach(btn => {
      if (btn) {
        btn.textContent = isDark ? '☀️' : '🌙';
        btn.setAttribute('aria-label', isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối');
      }
    });
  },

  updateAIStatusBadge() {
    const badge = document.getElementById('ai-status-badge');
    if (!badge) return;
    const settings = Store.getSettings();
    if (settings.geminiApiKey) {
      badge.textContent = '🟢 AI sẵn sàng';
      badge.className = 'ai-status connected';
    } else {
      badge.textContent = '🔴 Chưa có API Key';
      badge.className = 'ai-status disconnected';
    }
  },

  toggleTheme() {
    const settings = Store.getSettings();
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    Store.updateSettings({ theme: newTheme });
    this.updateThemeIcon();
  },

  // Modal management with focus trap
  openModal(title, bodyHTML, triggerEl) {
    const overlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    if (!overlay) return;

    this._lastFocusedEl = triggerEl || document.activeElement;
    if (modalTitle) modalTitle.textContent = title;
    if (modalBody) modalBody.innerHTML = bodyHTML;

    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');

    // Focus first focusable element
    setTimeout(() => {
      const focusable = overlay.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      focusable[0]?.focus();
    }, 50);

    // Focus trap
    overlay.addEventListener('keydown', this._trapFocus.bind(this));
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) {
      overlay.classList.remove('active');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.removeEventListener('keydown', this._trapFocus.bind(this));
    }
    // Return focus to trigger
    this._lastFocusedEl?.focus();
    this._lastFocusedEl = null;
  },

  _trapFocus(e) {
    if (e.key !== 'Tab') return;
    const overlay = document.getElementById('modal-overlay');
    const focusable = Array.from(overlay.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.disabled);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  },

  // Mobile sidebar toggle
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btn = document.getElementById('mobile-menu-btn');
    const isOpen = sidebar?.classList.toggle('open');
    overlay?.classList.toggle('active');
    overlay?.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
    btn?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const btn = document.getElementById('mobile-menu-btn');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
    overlay?.setAttribute('aria-hidden', 'true');
    btn?.setAttribute('aria-expanded', 'false');
  },

  // Global keyboard shortcuts
  initGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeSidebar();
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        this.navigate('capture');
        setTimeout(() => {
          document.getElementById('quick-capture-input')?.focus();
        }, 100);
      }
    });

    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') this.closeModal();
    });

    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      this.closeSidebar();
    });
  },
};

document.addEventListener('DOMContentLoaded', () => App.init());
