/* ========================================
   IDEA AGENT — Capture Module
   Quick capture + full form
   ======================================== */

var Capture = {
  selectedCategory: null,
  selectedPriority: 'medium',
  currentTags: [],
  isExpanded: false,

  render() {
    const data = Store.getData();
    const todayCount = Store.getTodayCount();
    const weekCount = Store.getWeekCount();
    const monthCount = Store.getMonthCount();
    const totalDrafts = data.stats.totalDrafts || 0;

    return `
      <div class="capture-hero">
        <div class="capture-hero-content">
          <h1>💡 Ghi nhận ý tưởng</h1>
          <p>Capture ý tưởng ngay khi xuất hiện — AI sẽ giúp bạn phát triển bản thảo</p>
          <div class="quick-capture">
            <textarea class="quick-capture-input" id="quick-capture-input"
              placeholder="Nhập ý tưởng của bạn... (Cmd+Enter để lưu nhanh)"
              rows="1"></textarea>
            <button class="quick-capture-btn" onclick="Capture.expandForm()" id="quick-capture-btn">
              ✨ Lưu ý tưởng
            </button>
          </div>
          <div class="quick-capture-hint">
            <kbd>Cmd</kbd> + <kbd>Enter</kbd> lưu nhanh &nbsp;·&nbsp;
            <kbd>Tab</kbd> mở form chi tiết
          </div>
        </div>
      </div>

      <div class="capture-stats">
        <div class="capture-stat-card animate-slide-up" style="animation-delay: 0.05s">
          <div class="capture-stat-icon purple">💡</div>
          <div>
            <div class="capture-stat-value">${todayCount}</div>
            <div class="capture-stat-label">Hôm nay</div>
          </div>
        </div>
        <div class="capture-stat-card animate-slide-up" style="animation-delay: 0.1s">
          <div class="capture-stat-icon amber">📅</div>
          <div>
            <div class="capture-stat-value">${weekCount}</div>
            <div class="capture-stat-label">Tuần này</div>
          </div>
        </div>
        <div class="capture-stat-card animate-slide-up" style="animation-delay: 0.15s">
          <div class="capture-stat-icon blue">📊</div>
          <div>
            <div class="capture-stat-value">${monthCount}</div>
            <div class="capture-stat-label">Tháng này</div>
          </div>
        </div>
        <div class="capture-stat-card animate-slide-up" style="animation-delay: 0.2s">
          <div class="capture-stat-icon green">📝</div>
          <div>
            <div class="capture-stat-value">${totalDrafts}</div>
            <div class="capture-stat-label">Bản thảo AI</div>
          </div>
        </div>
      </div>

      <div id="capture-form-container" style="display:none">
        ${this.renderForm()}
      </div>

      <div class="recent-ideas-section">
        <div class="recent-ideas-header">
          <h2>⚡ Ý tưởng gần đây</h2>
          <a href="#" class="btn btn-ghost btn-sm" onclick="App.navigate('timeline'); return false;">
            Xem tất cả →
          </a>
        </div>
        <div id="recent-ideas-list">
          ${this.renderRecentIdeas()}
        </div>
      </div>
    `;
  },

  renderForm() {
    const settings = Store.getSettings();
    const tags = Store.getTags();

    return `
      <div class="capture-form animate-scale-in">
        <div class="capture-form-grid">
          <div class="form-group full-width">
            <label class="form-label">Tiêu đề ý tưởng</label>
            <input type="text" class="form-input" id="idea-title"
              placeholder="Đặt tên cho ý tưởng" autofocus>
          </div>

          <div class="form-group full-width">
            <label class="form-label">Mô tả chi tiết</label>
            <textarea class="form-textarea" id="idea-content"
              placeholder="Mô tả chi tiết ý tưởng. Viết tự do — AI sẽ giúp bạn cấu trúc hóa sau..."
              rows="4"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Danh mục</label>
            <div class="category-picker" id="category-picker">
              ${Object.entries(Utils.categories).map(([key, cat]) => `
                <div class="category-option ${key === (this.selectedCategory || settings.defaultCategory) ? 'selected' : ''}"
                  data-cat="${key}" onclick="Capture.selectCategory('${key}')">
                  ${cat.icon} ${cat.label}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mức ưu tiên</label>
            <div class="priority-picker" id="priority-picker">
              ${Object.entries(Utils.priorities).map(([key, p]) => `
                <div class="priority-option ${key === this.selectedPriority ? 'selected' : ''}"
                  data-priority="${key}" onclick="Capture.selectPriority('${key}')">
                  ${p.icon} ${p.label}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="form-group full-width" style="position:relative">
            <label class="form-label">Tags</label>
            <div class="tag-input-wrapper" id="tag-input-wrapper" onclick="document.getElementById('tag-input-field').focus()">
              ${this.currentTags.map(t => `
                <span class="chip chip-tag">
                  #${t}
                  <span class="tag-remove" onclick="Capture.removeTag('${t}'); event.stopPropagation();">×</span>
                </span>
              `).join('')}
              <input type="text" class="tag-input-field" id="tag-input-field"
                placeholder="${this.currentTags.length ? '' : 'Thêm tag...'}"
                onkeydown="Capture.handleTagInput(event)"
                oninput="Capture.showTagSuggestions()">
            </div>
            <div class="tag-suggestions" id="tag-suggestions"></div>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: var(--space-sm); margin-top: var(--space-lg)">
          <button class="btn btn-secondary" onclick="Capture.collapseForm()">Hủy</button>
          <button class="btn btn-primary btn-lg" onclick="Capture.saveIdea()">
            ✨ Lưu ý tưởng
          </button>
        </div>
      </div>
    `;
  },

  renderRecentIdeas() {
    const ideas = Store.getAllIdeas().slice(0, 8);

    if (!ideas.length) {
      return `
        <div class="empty-state" style="padding: var(--space-xl)">
          <div class="empty-state-icon">💭</div>
          <div class="empty-state-title">Chưa có ý tưởng nào</div>
          <div class="empty-state-text">Hãy bắt đầu ghi nhận ý tưởng đầu tiên!</div>
        </div>
      `;
    }

    return ideas.map((idea, idx) => `
      <div class="recent-idea-item animate-slide-up" style="animation-delay: ${idx * 0.04}s"
        onclick="App.viewDraft('${idea.id}')">
        <div class="recent-idea-number">${idea.id.split('-').pop()}</div>
        <div class="recent-idea-content">
          <div class="recent-idea-title">${Utils.escapeHtml(idea.title)}</div>
          <div class="recent-idea-meta">
            <span class="chip chip-${idea.category} chip-category">${Utils.getCategoryIcon(idea.category)} ${Utils.getCategoryLabel(idea.category)}</span>
            <span class="priority-badge priority-${idea.priority}">
              <span class="priority-dot"></span> ${Utils.getPriorityLabel(idea.priority)}
            </span>
            <span class="recent-idea-time">${Utils.formatRelative(idea.createdAt)}</span>
          </div>
        </div>
        <div class="recent-idea-actions">
          <button class="btn btn-icon btn-ghost" onclick="Capture.generateDraft('${idea.id}'); event.stopPropagation();" title="Tạo bản thảo AI">
            🤖
          </button>
          <button class="btn btn-icon btn-ghost" onclick="Capture.confirmDelete('${idea.id}'); event.stopPropagation();" title="Xóa">
            ${Utils.icon('delete', 16)}
          </button>
        </div>
      </div>
    `).join('');
  },

  // ========================
  // ACTIONS
  // ========================

  expandForm() {
    const quickInput = document.getElementById('quick-capture-input');
    const quickText = quickInput ? quickInput.value.trim() : '';

    this.selectedCategory = Store.getSettings().defaultCategory;
    this.selectedPriority = 'medium';
    this.currentTags = [];
    this.isExpanded = true;

    const container = document.getElementById('capture-form-container');
    if (container) {
      container.style.display = 'block';
      container.innerHTML = this.renderForm();

      // Pre-fill title from quick input
      if (quickText) {
        const titleInput = document.getElementById('idea-title');
        if (titleInput) titleInput.value = quickText;
      }

      // Focus title
      setTimeout(() => {
        const titleInput = document.getElementById('idea-title');
        if (titleInput && !quickText) titleInput.focus();
        else {
          const contentInput = document.getElementById('idea-content');
          if (contentInput) contentInput.focus();
        }
      }, 100);
    }
  },

  collapseForm() {
    this.isExpanded = false;
    const container = document.getElementById('capture-form-container');
    if (container) container.style.display = 'none';
  },

  selectCategory(cat) {
    this.selectedCategory = cat;
    document.querySelectorAll('.category-option').forEach(el => {
      el.classList.toggle('selected', el.dataset.cat === cat);
    });
  },

  selectPriority(p) {
    this.selectedPriority = p;
    document.querySelectorAll('.priority-option').forEach(el => {
      el.classList.toggle('selected', el.dataset.priority === p);
    });
  },

  // Tag management
  addTag(tag) {
    tag = tag.trim().replace(/^#/, '');
    if (tag && !this.currentTags.includes(tag)) {
      this.currentTags.push(tag);
      this.refreshTagDisplay();
    }
  },

  removeTag(tag) {
    this.currentTags = this.currentTags.filter(t => t !== tag);
    this.refreshTagDisplay();
  },

  refreshTagDisplay() {
    const wrapper = document.getElementById('tag-input-wrapper');
    if (!wrapper) return;

    const input = document.getElementById('tag-input-field');
    const inputValue = input ? input.value : '';

    // Remove old chips
    wrapper.querySelectorAll('.chip').forEach(c => c.remove());

    // Add new chips before input
    this.currentTags.forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'chip chip-tag';
      chip.innerHTML = `#${t} <span class="tag-remove" onclick="Capture.removeTag('${t}'); event.stopPropagation();">×</span>`;
      wrapper.insertBefore(chip, input);
    });

    if (input) {
      input.placeholder = this.currentTags.length ? '' : 'Thêm tag...';
      input.value = '';
      input.focus();
    }
  },

  handleTagInput(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value) {
        this.addTag(value);
        e.target.value = '';
        this.hideTagSuggestions();
      }
    } else if (e.key === 'Backspace' && !e.target.value && this.currentTags.length) {
      this.currentTags.pop();
      this.refreshTagDisplay();
    }
  },

  showTagSuggestions() {
    const input = document.getElementById('tag-input-field');
    const dropdown = document.getElementById('tag-suggestions');
    if (!input || !dropdown) return;

    const query = input.value.trim().toLowerCase();
    if (!query) {
      this.hideTagSuggestions();
      return;
    }

    const allTags = Store.getTags();
    const suggestions = allTags.filter(t =>
      t.toLowerCase().includes(query) && !this.currentTags.includes(t)
    ).slice(0, 6);

    if (!suggestions.length) {
      this.hideTagSuggestions();
      return;
    }

    dropdown.innerHTML = suggestions.map(t =>
      `<div class="tag-suggestion-item" onclick="Capture.addTag('${t}'); Capture.hideTagSuggestions();">#${t}</div>`
    ).join('');
    dropdown.classList.add('active');
  },

  hideTagSuggestions() {
    const dropdown = document.getElementById('tag-suggestions');
    if (dropdown) dropdown.classList.remove('active');
  },

  // Save idea
  saveIdea() {
    const titleEl = document.getElementById('idea-title');
    const contentEl = document.getElementById('idea-content');

    const title = titleEl ? titleEl.value.trim() : '';
    const content = contentEl ? contentEl.value.trim() : '';

    if (!title && !content) {
      Utils.showToast('Vui lòng nhập tiêu đề hoặc nội dung', 'error');
      return;
    }

    const idea = Store.addIdea({
      title: title || Utils.truncate(content, 60),
      summary: Utils.truncate(content, 200),
      content: content,
      category: this.selectedCategory || Store.getSettings().defaultCategory,
      tags: [...this.currentTags],
      priority: this.selectedPriority,
    });

    Utils.showToast(`✨ Ý tưởng #${idea.id.split('-').pop()} đã được lưu!`, 'success');

    // Reset form
    this.collapseForm();
    const quickInput = document.getElementById('quick-capture-input');
    if (quickInput) quickInput.value = '';

    // Auto-generate draft if setting enabled
    const settings = Store.getSettings();
    if (settings.autoGenerateDraft && settings.geminiApiKey) {
      this.generateDraft(idea.id);
    }

    // Re-render
    App.renderCurrentPage();

    // Update sidebar badge
    App.updateSidebarStats();
  },

  // Quick save (from hero input)
  quickSave() {
    const input = document.getElementById('quick-capture-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    const idea = Store.addIdea({
      title: text,
      summary: '',
      content: '',
      category: Store.getSettings().defaultCategory,
      tags: [],
      priority: 'medium',
    });

    Utils.showToast(`⚡ Ý tưởng #${idea.id.split('-').pop()} đã lưu nhanh!`, 'success');
    input.value = '';

    App.renderCurrentPage();
    App.updateSidebarStats();
  },

  // Delete idea
  confirmDelete(id) {
    const idea = Store.getIdea(id);
    if (!idea) return;

    if (confirm(`Xóa ý tưởng "${idea.title}"?`)) {
      Store.deleteIdea(id);
      Utils.showToast('Đã xóa ý tưởng', 'info');
      App.renderCurrentPage();
      App.updateSidebarStats();
    }
  },

  // AI Draft generation
  async generateDraft(ideaId) {
    const idea = Store.getIdea(ideaId);
    if (!idea) return;

    const settings = Store.getSettings();
    if (!settings.geminiApiKey && !GoogleAuth.isSignedIn) {
      Utils.showToast('Vui lòng đăng nhập Google hoặc nhập API Key trong Settings', 'error');
      App.navigate('settings');
      return;
    }

    // Update status
    Store.updateIdea(ideaId, { status: 'developing' });
    Utils.showToast('🤖 Đang phát triển bản thảo...', 'info', 5000);

    try {
      const draft = await GeminiAI.generateDraft(idea, settings);
      if (draft) {
        Store.addDraft(ideaId, draft);
        Utils.showToast('✅ Bản thảo AI đã sẵn sàng!', 'success');
        App.renderCurrentPage();
      }
    } catch (err) {
      console.error('Draft generation error:', err);
      Store.updateIdea(ideaId, { status: 'raw' });
      Utils.showToast('❌ Lỗi tạo bản thảo: ' + err.message, 'error');
    }
  },

  // Init keyboard shortcuts
  initShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Cmd+Enter: Quick save
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const activeEl = document.activeElement;
        if (activeEl && activeEl.id === 'quick-capture-input') {
          e.preventDefault();
          this.quickSave();
        } else if (this.isExpanded) {
          e.preventDefault();
          this.saveIdea();
        }
      }

      // Tab from quick input: expand form
      if (e.key === 'Tab' && document.activeElement?.id === 'quick-capture-input') {
        e.preventDefault();
        this.expandForm();
      }
    });
  }
};
