/* ========================================
   IDEA AGENT — Timeline Module
   Ideas grouped by date with filters
   ======================================== */

var Timeline = {
  filters: {
    category: 'all',
    priority: 'all',
    status: 'all',
    search: '',
    sort: 'newest',
  },

  render() {
    return `
      <div class="page-header">
        <div>
          <h1>📅 Timeline</h1>
          <div class="page-subtitle">Tất cả ý tưởng theo dòng thời gian</div>
        </div>
        <button class="btn btn-primary" onclick="App.navigate('capture')">
          ${Utils.icon('capture', 18)} Ý tưởng mới
        </button>
      </div>

      ${this.renderFilters()}
      ${this.renderSort()}

      <div class="timeline" id="timeline-container">
        ${this.renderTimeline()}
      </div>
    `;
  },

  renderFilters() {
    const categories = [
      { key: 'all', label: 'Tất cả' },
      ...Object.entries(Utils.categories).map(([k, v]) => ({ key: k, label: `${v.icon} ${v.label}` }))
    ];

    const priorities = [
      { key: 'all', label: 'Tất cả' },
      ...Object.entries(Utils.priorities).map(([k, v]) => ({ key: k, label: `${v.icon} ${v.label}` }))
    ];

    return `
      <div class="timeline-filters">
        <div class="filter-search-wrapper">
          ${Utils.icon('search', 14)}
          <input type="text" class="filter-search" id="timeline-search"
            placeholder="Tìm ý tưởng..."
            value="${Utils.escapeHtml(this.filters.search)}"
            oninput="Timeline.onSearch(this.value)">
        </div>

        <div class="filter-divider"></div>

        <div class="filter-group">
          <span class="filter-label">Danh mục:</span>
          ${categories.map(c => `
            <span class="filter-chip ${this.filters.category === c.key ? 'active' : ''}"
              onclick="Timeline.setFilter('category', '${c.key}')">${c.label}</span>
          `).join('')}
        </div>

        <div class="filter-divider"></div>

        <div class="filter-group">
          <span class="filter-label">Ưu tiên:</span>
          ${priorities.map(p => `
            <span class="filter-chip ${this.filters.priority === p.key ? 'active' : ''}"
              onclick="Timeline.setFilter('priority', '${p.key}')">${p.label}</span>
          `).join('')}
        </div>
      </div>
    `;
  },

  renderSort() {
    const sorts = [
      { key: 'newest', label: '🔽 Mới nhất' },
      { key: 'oldest', label: '🔼 Cũ nhất' },
      { key: 'priority', label: '🎯 Ưu tiên' },
    ];

    const total = Store.getAllIdeas(this.filters).length;

    return `
      <div class="timeline-sort">
        <span style="font-size: 0.82rem; color: var(--text-tertiary); margin-right: auto">
          <strong style="color: var(--text-primary)">${total}</strong> ý tưởng
        </span>
        ${sorts.map(s => `
          <button class="sort-btn ${this.filters.sort === s.key ? 'active' : ''}"
            onclick="Timeline.setFilter('sort', '${s.key}')">${s.label}</button>
        `).join('')}
      </div>
    `;
  },

  renderTimeline() {
    const grouped = Store.getIdeasByDate(this.filters);
    const dateKeys = Object.keys(grouped);

    if (this.filters.sort === 'oldest') {
      dateKeys.sort();
    } else {
      dateKeys.sort().reverse();
    }

    if (!dateKeys.length) {
      return `
        <div class="timeline-empty">
          <div class="timeline-empty-icon">🔍</div>
          <div class="empty-state-title">Không tìm thấy ý tưởng</div>
          <div class="empty-state-text">
            ${this.filters.search ? 'Thử thay đổi từ khóa tìm kiếm' : 'Hãy ghi nhận ý tưởng đầu tiên!'}
          </div>
          ${!this.filters.search ? `
            <button class="btn btn-primary mt-lg" onclick="App.navigate('capture')">
              ✨ Ghi nhận ý tưởng
            </button>
          ` : ''}
        </div>
      `;
    }

    return dateKeys.map(dateKey => `
      <div class="timeline-day">
        <div class="timeline-day-header">
          <div class="timeline-date-badge">
            <span class="date-icon">📆</span>
            ${Utils.getDateLabel(dateKey)}
          </div>
          <div class="timeline-day-count">${grouped[dateKey].length} ý tưởng</div>
          <div class="timeline-day-line"></div>
        </div>
        <div class="timeline-ideas">
          ${grouped[dateKey].map(idea => this.renderIdeaCard(idea)).join('')}
        </div>
      </div>
    `).join('');
  },

  renderIdeaCard(idea) {
    const seqNum = idea.id.split('-').pop();
    const hasDraft = idea.drafts && idea.drafts.length > 0;

    return `
      <div class="idea-card" onclick="App.viewDraft('${idea.id}')">
        <div class="idea-card-number">#${seqNum}</div>
        <div class="idea-card-body">
          <div class="idea-card-header">
            <div>
              <div class="idea-card-title">${Utils.escapeHtml(idea.title)}</div>
            </div>
            <div class="idea-card-actions">
              <button class="btn btn-icon btn-ghost btn-sm" onclick="Capture.generateDraft('${idea.id}'); event.stopPropagation();" title="Tạo bản thảo AI">
                🤖
              </button>
              <button class="btn btn-icon btn-ghost btn-sm" onclick="Timeline.editIdea('${idea.id}'); event.stopPropagation();" title="Sửa">
                ${Utils.icon('edit', 15)}
              </button>
              <button class="btn btn-icon btn-ghost btn-sm" onclick="Capture.confirmDelete('${idea.id}'); event.stopPropagation();" title="Xóa">
                ${Utils.icon('delete', 15)}
              </button>
            </div>
          </div>
          ${idea.summary ? `<div class="idea-card-summary">${Utils.escapeHtml(idea.summary || idea.content)}</div>` : ''}
          <div class="idea-card-meta">
            <span class="chip chip-${idea.category} chip-category">${Utils.getCategoryIcon(idea.category)} ${Utils.getCategoryLabel(idea.category)}</span>
            <span class="priority-badge priority-${idea.priority}">
              <span class="priority-dot"></span> ${Utils.getPriorityLabel(idea.priority)}
            </span>
            <span class="status-badge ${Utils.getStatusClass(idea.status)}">${Utils.getStatusLabel(idea.status)}</span>
            ${hasDraft ? `<span class="idea-draft-badge has-draft">📝 v${idea.drafts.length}</span>` : ''}
            <span class="idea-card-time">🕐 ${Utils.formatTime(idea.createdAt)}</span>
            ${idea.tags.length ? `
              <div class="idea-card-tags">
                ${idea.tags.slice(0, 3).map(t => `<span class="chip chip-tag">#${t}</span>`).join('')}
                ${idea.tags.length > 3 ? `<span class="chip chip-tag">+${idea.tags.length - 3}</span>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  },

  // ========================
  // FILTER ACTIONS
  // ========================

  setFilter(key, value) {
    this.filters[key] = value;
    this.refresh();
  },

  onSearch: Utils.debounce(function(value) {
    Timeline.filters.search = value;
    Timeline.refresh();
  }, 250),

  refresh() {
    App.renderCurrentPage();
  },

  // ========================
  // EDIT IDEA (modal)
  // ========================

  editIdea(id) {
    const idea = Store.getIdea(id);
    if (!idea) return;

    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const body = document.getElementById('modal-body');

    title.textContent = 'Chỉnh sửa ý tưởng';
    body.innerHTML = `
      <div class="form-group">
        <label class="form-label">Tiêu đề</label>
        <input type="text" class="form-input" id="edit-title" value="${Utils.escapeHtml(idea.title)}">
      </div>
      <div class="form-group">
        <label class="form-label">Nội dung</label>
        <textarea class="form-textarea" id="edit-content" rows="5">${Utils.escapeHtml(idea.content)}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Danh mục</label>
        <select class="form-select" id="edit-category">
          ${Object.entries(Utils.categories).map(([k, v]) =>
            `<option value="${k}" ${idea.category === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Ưu tiên</label>
        <select class="form-select" id="edit-priority">
          ${Object.entries(Utils.priorities).map(([k, v]) =>
            `<option value="${k}" ${idea.priority === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`
          ).join('')}
        </select>
      </div>
      <div class="modal-footer" style="padding: var(--space-md) 0 0; border-top: 1px solid var(--border-light); margin-top: var(--space-md);">
        <button class="btn btn-secondary" onclick="App.closeModal()">Hủy</button>
        <button class="btn btn-primary" onclick="Timeline.saveEditIdea('${id}')">Lưu thay đổi</button>
      </div>
    `;

    overlay.classList.add('active');
  },

  saveEditIdea(id) {
    const title = document.getElementById('edit-title')?.value.trim();
    const content = document.getElementById('edit-content')?.value.trim();
    const category = document.getElementById('edit-category')?.value;
    const priority = document.getElementById('edit-priority')?.value;

    if (!title) {
      Utils.showToast('Vui lòng nhập tiêu đề', 'error');
      return;
    }

    Store.updateIdea(id, {
      title,
      content,
      summary: Utils.truncate(content, 200),
      category,
      priority,
    });

    App.closeModal();
    Utils.showToast('✅ Đã cập nhật ý tưởng', 'success');
    this.refresh();
  },
};
