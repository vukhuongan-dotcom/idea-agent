/* ========================================
   IDEA AGENT — App Controller
   Main routing, page management, init
   ======================================== */

var App = {
  currentPage: 'capture',
  currentDraftId: null,

  pages: {
    capture: { title: 'Ghi nhận', icon: 'capture', module: 'Capture' },
    timeline: { title: 'Timeline', icon: 'timeline', module: 'Timeline' },
    analytics: { title: 'Phân tích', icon: 'analytics', module: 'Analytics' },
    settings: { title: 'Cài đặt', icon: 'settings', module: 'Settings' },
  },

  init() {
    // Initialize store
    Store.init();

    // Apply theme
    const settings = Store.getSettings();
    document.documentElement.setAttribute('data-theme', settings.theme || 'dark');

    // Handle hash routing
    this.handleRoute();
    window.addEventListener('hashchange', () => this.handleRoute());

    // Init keyboard shortcuts
    Capture.initShortcuts();
    this.initGlobalShortcuts();

    // Initialize Google Auth
    GoogleAuth.init();

    // Render sidebar
    this.updateSidebarStats();
    this.updateThemeIcon();

    console.log('💡 Idea Agent initialized');
  },

  handleRoute() {
    const hash = location.hash.slice(1) || 'capture';

    // Check for draft view: #draft/ID
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

    // Update page title
    document.title = `${pageConfig.title} — Idea Agent`;
  },

  renderCurrentPage() {
    this.renderPage();
  },

  updateActiveNav(page) {
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
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

    // Update timeline badge
    const badge = document.getElementById('nav-timeline-badge');
    if (badge) {
      badge.textContent = data.ideas.length;
      badge.style.display = data.ideas.length > 0 ? 'inline' : 'none';
    }
  },

  updateThemeIcon() {
    const settings = Store.getSettings();
    const btn = document.getElementById('theme-toggle-btn');
    if (btn) {
      btn.innerHTML = settings.theme === 'dark' ? '☀️' : '🌙';
    }
  },

  toggleTheme() {
    const settings = Store.getSettings();
    const newTheme = settings.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    Store.updateSettings({ theme: newTheme });
    this.updateThemeIcon();
  },

  // Modal management
  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.classList.remove('active');
  },

  // Mobile sidebar toggle
  toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.toggle('open');
    overlay?.classList.toggle('active');
  },

  closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar?.classList.remove('open');
    overlay?.classList.remove('active');
  },

  // Global keyboard shortcuts
  initGlobalShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Escape: close modal
      if (e.key === 'Escape') {
        this.closeModal();
        this.closeSidebar();
      }

      // Cmd+N: new idea (navigate to capture)
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        this.navigate('capture');
        setTimeout(() => {
          document.getElementById('quick-capture-input')?.focus();
        }, 100);
      }
    });

    // Close modal on overlay click
    document.getElementById('modal-overlay')?.addEventListener('click', (e) => {
      if (e.target.id === 'modal-overlay') this.closeModal();
    });

    // Close sidebar on overlay click
    document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
      this.closeSidebar();
    });
  },
};

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
