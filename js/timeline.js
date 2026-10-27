/* ========================================
   IDEA AGENT — Timeline Module
   Ideas grouped by date with filters,
   multi-select synthesis, and smart search
   ======================================== */

var Timeline = {
  filters: { category: 'all', priority: 'all', status: 'all', tag: '', dateRange: 'all', search: '', sort: 'newest' },
  selectedIdeaIds: new Set(),
  isSelectionMode: false,

  render() {
    return `<div class="page-header"><div><h1>📅 Timeline</h1><div class="page-subtitle">Tất cả ý tưởng theo dòng thời gian</div></div><button class="btn btn-primary timeline-new-btn" onclick="App.navigate('capture')">${Utils.icon('capture', 18)} Ý tưởng mới</button></div>${this.renderFilters()}${this.renderSort()}<div class="timeline" id="timeline-container">${this.renderTimeline()}</div><div id="synthesis-bar-container">${this.renderSynthesisBar()}</div>`;
  },

  hasActiveFilters() {
    return Boolean(this.filters.category !== 'all' || this.filters.priority !== 'all' || this.filters.status !== 'all' || this.filters.tag || (this.filters.dateRange && this.filters.dateRange !== 'all') || this.filters.search);
  },

  toggleSelectionMode() {
    this.isSelectionMode = !this.isSelectionMode;
    if (!this.isSelectionMode) {
      this.selectedIdeaIds.clear();
      const c = document.getElementById('synthesis-bar-container');
      if (c) c.innerHTML = '';
      document.body.classList.remove('has-synthesis-bar');
    }
    this.refresh();
  },

  renderFilters() {
    const toList = obj => [{ key: 'all', label: 'Tất cả' }, ...Object.entries(obj).map(([k, v]) => ({ key: k, label: `${v.icon} ${v.label}` }))];
    const cats = toList(Utils.categories);
    const prios = toList(Utils.priorities);
    const stats = [{ key: 'all', label: 'Tất cả' }, { key: 'raw', label: '💭 Thô' }, { key: 'draft', label: '📝 Bản thảo' }, { key: 'reviewed', label: '✅ Đã duyệt' }, { key: 'archived', label: '📦 Lưu trữ' }];
    const times = [{ key: 'all', label: 'Tất cả' }, { key: 'today', label: 'Hôm nay' }, { key: 'week', label: '7 ngày qua' }, { key: 'month', label: 'Tháng này' }];
    const hasF = this.hasActiveFilters();

    const mkChips = (grp, list) => list.map(c => {
      const isAct = this.filters[grp] === c.key;
      return `<button type="button" class="filter-chip ${isAct ? 'active' : ''}" onclick="Timeline.setFilter('${grp}', '${c.key}')" aria-pressed="${isAct ? 'true' : 'false'}">${c.label}</button>`;
    }).join('');

    const groups = [
      ['Thời gian:', 'dateRange', times],
      ['Danh mục:', 'category', cats],
      ['Ưu tiên:', 'priority', prios],
      ['Trạng thái:', 'status', stats]
    ].map(([lbl, grp, list]) => `<div class="filter-group"><span class="filter-label">${lbl}</span>${mkChips(grp, list)}</div>`).join('<div class="filter-divider"></div>');

    return `<div class="timeline-filters"><div class="timeline-filters-top"><div class="filter-search-wrapper">${Utils.icon('search', 14)}<input type="text" class="filter-search" id="timeline-search" placeholder="Tìm ý tưởng... (nhấn / để tìm nhanh)" value="${Utils.escapeHtml(this.filters.search)}" oninput="Timeline.onSearch(this.value)"></div>${this.filters.tag ? `<button type="button" class="active-tag-chip" onclick="Timeline.setFilter('tag', '')" title="Bỏ lọc tag" aria-label="Bỏ lọc tag">🏷️ #${Utils.escapeHtml(this.filters.tag)} <span>×</span></button>` : ''}<button type="button" class="filter-clear-btn ${hasF ? 'active' : ''}" id="timeline-clear-btn" onclick="Timeline.clearFilters()" title="Xóa tất cả bộ lọc">✕ Xóa bộ lọc</button></div><div class="timeline-filters-scroll">${groups}</div></div>`;
  },

  renderSort() {
    const sorts = [{ k: 'newest', l: '🔽 Mới nhất' }, { k: 'oldest', l: '🔼 Cũ nhất' }, { k: 'priority', l: '🎯 Ưu tiên' }, { k: 'drafts', l: '📝 Bản thảo' }];
    const total = Store.getAllIdeas(this.filters).length;
    const r = this.filters.dateRange && this.filters.dateRange !== 'all' ? ` (${this.filters.dateRange === 'today' ? 'hôm nay' : this.filters.dateRange === 'week' ? '7 ngày qua' : 'tháng này'})` : '';
    return `<div class="timeline-sort"><span style="font-size:0.82rem;color:var(--text-tertiary);margin-right:auto"><strong style="color:var(--text-primary)" id="timeline-count-display">${total}</strong> ý tưởng${r}</span><div class="timeline-sort-actions"><button type="button" class="sort-btn select-mode-btn ${this.isSelectionMode ? 'active' : ''}" onclick="Timeline.toggleSelectionMode()" title="Chế độ chọn">${this.isSelectionMode ? '✕ Hủy chọn' : '☑️ Chọn'}</button>${sorts.map(s => `<button type="button" class="sort-btn ${this.filters.sort === s.k ? 'active' : ''}" onclick="Timeline.setFilter('sort', '${s.k}')">${s.l}</button>`).join('')}</div></div>`;
  },

  renderTimeline() {
    const ideas = Store.getAllIdeas(this.filters);
    const hasF = this.hasActiveFilters();

    if (!ideas.length) {
      return `<div class="timeline-empty"><div class="timeline-empty-icon">🔍</div><div class="empty-state-title">Không tìm thấy ý tưởng</div><div class="empty-state-text">${hasF ? 'Thử thay đổi hoặc xóa bộ lọc tìm kiếm' : 'Hãy ghi nhận ý tưởng đầu tiên!'}</div>${hasF ? '<button type="button" class="btn btn-secondary mt-lg" onclick="Timeline.clearFilters()">✕ Xóa bộ lọc</button>' : '<button type="button" class="btn btn-primary mt-lg" onclick="App.navigate(\'capture\')">✨ Ghi nhận ý tưởng</button>'}</div>`;
    }

    // Flat list when sorting by priority or drafts
    if (this.filters.sort === 'priority' || this.filters.sort === 'drafts') {
      return `<div class="timeline-flat-list timeline-ideas">${ideas.map(idea => this.renderIdeaCard(idea)).join('')}</div>`;
    }

    const grouped = Store.getIdeasByDate(this.filters);
    const dateKeys = Object.keys(grouped).sort();
    if (this.filters.sort !== 'oldest') dateKeys.reverse();

    return dateKeys.map(dKey => `<div class="timeline-day"><div class="timeline-day-header"><div class="timeline-date-badge"><span class="date-icon">📆</span>${Utils.getDateLabel(dKey)}</div><div class="timeline-day-count">${grouped[dKey].length} ý tưởng</div><div class="timeline-day-line"></div></div><div class="timeline-ideas">${grouped[dKey].map(idea => this.renderIdeaCard(idea)).join('')}</div></div>`).join('');
  },

  renderIdeaCard(idea) {
    const seq = idea.id.split('-').pop();
    const hasD = idea.drafts && idea.drafts.length > 0;
    const isSel = this.selectedIdeaIds.has(idea.id);
    const lkCnt = Array.isArray(idea.linkedIdeas) ? idea.linkedIdeas.length : 0;
    const tags = idea.tags && idea.tags.length ? `<div class="idea-card-tags">${idea.tags.slice(0, 2).map(t => `<button type="button" class="chip chip-tag" onclick="Timeline.filterByTag('${t}')">#${t}</button>`).join('')}${idea.tags.length > 2 ? `<span class="chip chip-tag">+${idea.tags.length - 2}</span>` : ''}</div>` : '';
    const showSelect = this.isSelectionMode || isSel;

    return `<div class="idea-card ${isSel ? 'selected' : ''} ${this.isSelectionMode ? 'in-selection-mode' : ''}" data-id="${idea.id}">${showSelect ? `<div class="idea-card-select"><input type="checkbox" class="idea-select-check" id="check-${idea.id}" ${isSel ? 'checked' : ''} onchange="Timeline.toggleSelectIdea('${idea.id}', this.checked)" aria-label="Chọn #${seq}"></div>` : ''}<div class="idea-card-body"><div class="idea-card-top-row"><span class="idea-card-seq-cat">#${seq} · ${Utils.getCategoryIcon(idea.category)} ${Utils.getCategoryLabel(idea.category)} · 🕐 ${Utils.formatTime(idea.createdAt)}</span><div class="idea-card-actions"><button type="button" class="btn btn-icon btn-ghost btn-sm desktop-only-action" onclick="Capture.generateDraft('${idea.id}')" title="AI" aria-label="Soạn AI">🤖</button><button type="button" class="btn btn-icon btn-ghost btn-sm desktop-only-action" onclick="Timeline.editIdea('${idea.id}')" title="Sửa" aria-label="Sửa">${Utils.icon('edit', 15)}</button><button type="button" class="btn btn-icon btn-ghost btn-sm desktop-only-action" onclick="Capture.confirmDelete('${idea.id}')" title="Xóa" aria-label="Xóa">${Utils.icon('delete', 15)}</button><button type="button" class="btn btn-icon btn-ghost btn-sm mobile-more-action" onclick="Timeline.openIdeaMenu('${idea.id}', event)" title="Tùy chọn" aria-label="Tùy chọn #${seq}">⋯</button></div></div><div class="idea-card-title-row"><a href="#draft/${idea.id}" class="idea-card-title-link" aria-label="Bản thảo #${seq}: ${Utils.escapeHtml(idea.title)}"><h3 class="idea-card-title">${Utils.escapeHtml(idea.title)}</h3></a></div><div class="idea-card-meta"><span class="priority-badge priority-${idea.priority}"><span class="priority-dot"></span> ${Utils.getPriorityLabel(idea.priority)}</span><button type="button" class="status-badge ${Utils.getStatusClass(idea.status)}" onclick="Timeline.openStatusMenu('${idea.id}', event)" title="Bấm để đổi trạng thái">${Utils.getStatusLabel(idea.status)} ▾</button>${hasD ? `<span class="idea-draft-badge has-draft">📝 v${idea.drafts.length}</span>` : ''}${lkCnt ? `<span class="idea-linked-badge">🔗 ${lkCnt}</span>` : ''}${tags}</div></div></div>`;
  },

  setFilter(k, v) { this.filters[k] = v; this.refresh(); },
  filterByTag(t) { this.filters.tag = t; this.refresh(); },
  clearFilters() { this.filters = { category: 'all', priority: 'all', status: 'all', tag: '', dateRange: 'all', search: '', sort: 'newest' }; this.refresh(); },

  onSearch(v) { this.filters.search = v; this.updateTimelineOnly(); },
  updateTimelineOnly() {
    const c = document.getElementById('timeline-container');
    if (c) c.innerHTML = this.renderTimeline();
    const cnt = document.getElementById('timeline-count-display');
    if (cnt) cnt.textContent = Store.getAllIdeas(this.filters).length;
    const btn = document.getElementById('timeline-clear-btn');
    if (btn) btn.classList.toggle('active', this.hasActiveFilters());
  },
  refresh() { App.renderCurrentPage(); },

  openStatusMenu(id, e) {
    if (e) e.stopPropagation();
    const idea = Store.getIdea(id);
    if (!idea) return;

    const stats = [
      { k: 'raw', l: '💭 Thô' },
      { k: 'developing', l: '🔄 Đang phát triển' },
      { k: 'reviewed', l: '✅ Đã review' },
      { k: 'archived', l: '📦 Lưu trữ' }
    ];

    const body = `
      <div id="status-change-menu" style="display:flex;flex-direction:column;gap:8px;padding:var(--space-xs) 0">
        <p style="margin-bottom:8px;color:var(--text-secondary);font-size:0.875rem">Chọn trạng thái cho <strong>#${id.split('-').pop()} — ${Utils.escapeHtml(idea.title)}</strong>:</p>
        ${stats.map(s => `
          <button type="button" class="btn btn-secondary ${idea.status === s.k ? 'btn-primary' : ''}" data-status="${s.k}" onclick="Timeline.changeIdeaStatus('${id}', '${s.k}')" style="justify-content:flex-start;padding:10px 14px;font-size:0.9rem;min-height:44px">
            ${s.l} ${idea.status === s.k ? '✓' : ''}
          </button>
        `).join('')}
      </div>
    `;
    App.openModal('Đổi trạng thái', body);
  },

  changeIdeaStatus(id, newStatus) {
    const idea = Store.getIdea(id);
    if (!idea) return;
    const oldStatus = idea.status;
    if (newStatus === oldStatus) {
      App.closeModal();
      return;
    }
    Store.updateIdea(id, { status: newStatus });
    App.closeModal();
    this.refresh();
    App.updateSidebarStats();
    if (App.currentPage === 'draft') App.renderPage();

    Utils.showToastWithUndo(`Đã đổi #${id.split('-').pop()} sang ${Utils.getStatusLabel(newStatus)}`, () => {
      Store.updateIdea(id, { status: oldStatus });
      Timeline.refresh();
      App.updateSidebarStats();
      if (App.currentPage === 'draft') App.renderPage();
      Utils.showToast(`Đã hoàn tác trạng thái #${id.split('-').pop()}`, 'info');
    }, 5000);
  },

  openIdeaMenu(id, e) {
    if (e) e.stopPropagation();
    const idea = Store.getIdea(id);
    if (!idea) return;
    const seq = id.split('-').pop();
    const body = `
      <div style="display:flex;flex-direction:column;gap:8px;padding:var(--space-xs) 0">
        <p style="margin-bottom:8px;color:var(--text-secondary);font-size:0.875rem">#${seq} — <strong>${Utils.escapeHtml(idea.title)}</strong></p>
        <button type="button" class="btn btn-secondary" onclick="App.closeModal(); Capture.generateDraft('${id}')" style="justify-content:flex-start;min-height:44px;font-size:0.9rem">🤖 Soạn thảo với AI</button>
        <button type="button" class="btn btn-secondary" onclick="App.closeModal(); Timeline.editIdea('${id}')" style="justify-content:flex-start;min-height:44px;font-size:0.9rem">✏️ Chỉnh sửa chi tiết</button>
        <button type="button" class="btn btn-secondary" onclick="App.closeModal(); Timeline.openStatusMenu('${id}')" style="justify-content:flex-start;min-height:44px;font-size:0.9rem">🏷️ Đổi trạng thái...</button>
        <button type="button" class="btn btn-danger" onclick="App.closeModal(); Capture.confirmDelete('${id}')" style="justify-content:flex-start;min-height:44px;font-size:0.9rem">🗑️ Xóa ý tưởng</button>
      </div>
    `;
    App.openModal(`Tùy chọn #${seq}`, body);
  },

  toggleSelectIdea(id, isSel) {
    if (isSel) this.selectedIdeaIds.add(id); else this.selectedIdeaIds.delete(id);
    const c = document.getElementById('synthesis-bar-container');
    if (c) c.innerHTML = this.renderSynthesisBar();
    document.body.classList.toggle('has-synthesis-bar', this.selectedIdeaIds.size > 0);
  },

  clearSelection() {
    this.selectedIdeaIds.clear();
    this.isSelectionMode = false;
    document.querySelectorAll('.idea-select-check').forEach(i => i.checked = false);
    document.querySelectorAll('.idea-card.selected').forEach(i => i.classList.remove('selected'));
    const c = document.getElementById('synthesis-bar-container');
    if (c) c.innerHTML = '';
    document.body.classList.remove('has-synthesis-bar');
    this.refresh();
  },

  renderSynthesisBar() {
    if (!this.selectedIdeaIds.size) return '';
    return `<div class="synthesis-bar" id="synthesis-bar" role="region" aria-label="Thanh tổng hợp"><div class="synthesis-bar-info"><span class="synthesis-badge">☑️ ${this.selectedIdeaIds.size}</span><span class="synthesis-text">ý tưởng đã chọn</span></div><div class="synthesis-actions"><button class="btn btn-primary btn-sm" onclick="Timeline.openSynthesisModal()">🧬 AI Tổng hợp</button><button class="btn btn-secondary btn-sm" onclick="Timeline.exportSelectedMarkdown()">📥 Xuất Markdown</button><button class="btn btn-secondary btn-sm" onclick="Timeline.batchUpdateStatusPrompt()">🏷️ Trạng thái</button><button class="btn btn-ghost btn-sm" onclick="Timeline.clearSelection()">✕ Bỏ chọn</button></div></div>`;
  },

  openSynthesisModal() {
    if (!this.selectedIdeaIds.size) return;
    const ideas = Array.from(this.selectedIdeaIds).map(id => Store.getIdea(id)).filter(Boolean);
    const body = `<p style="margin-bottom:var(--space-md)">AI sẽ tổng hợp <strong>${ideas.length} ý tưởng</strong>:</p><div style="max-height:120px;overflow-y:auto;background:var(--bg-input);padding:8px;border-radius:8px;margin-bottom:var(--space-md);font-size:0.8rem">${ideas.map(i => `<div>#${i.id.split('-').pop()} - ${Utils.escapeHtml(i.title)}</div>`).join('')}</div><div class="form-group"><label class="form-label">Chế độ tổng hợp</label><select class="form-select" id="synthesis-mode"><option value="research">🔬 Đề cương NCKH / Sáng kiến BV</option><option value="actionplan">📊 Kế hoạch Chiến lược & Hành động</option><option value="digest">📋 Báo cáo Tóm tắt & Kết nối (Digest)</option></select></div><div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Hủy</button><button class="btn btn-primary" onclick="Timeline.doSynthesize()">✨ Bắt đầu</button></div>`;
    App.openModal('🧬 AI Tổng hợp Ý tưởng', body);
  },

  async doSynthesize() {
    const mode = document.getElementById('synthesis-mode')?.value || 'research';
    const settings = Store.getSettings();
    if (!settings.geminiApiKey) { Utils.showToast('Vui lòng nhập API Key', 'error'); App.closeModal(); App.navigate('settings'); return; }
    const ideas = Array.from(this.selectedIdeaIds).map(id => Store.getIdea(id)).filter(Boolean);
    if (!ideas.length) return;
    App.closeModal();
    Utils.showToast('🤖 AI đang tổng hợp...', 'info', 8000);
    try {
      const modeTitles = { research: 'Đề cương NCKH', actionplan: 'Kế hoạch Hành động', digest: 'Báo cáo Tổng hợp' };
      const res = await AI.synthesizeIdeas(ideas, mode, settings);
      if (res) {
        const newIdea = Store.addIdea({
          title: `[Tổng hợp] ${modeTitles[mode] || 'Ý tưởng tổng hợp'} (${ideas.length} ý tưởng)`,
          summary: `Tổng hợp từ ${ideas.length} ý tưởng: ${ideas.map(i => '#' + i.id.split('-').pop()).join(', ')}`,
          content: ideas.map(i => `- #${i.id.split('-').pop()}: ${i.title}`).join('\n'),
          category: ideas[0]?.category || 'research',
          priority: 'high',
          tags: ['synthesis', mode],
        });
        ideas.forEach(i => Store.linkIdeas(newIdea.id, i.id));
        Store.addDraft(newIdea.id, res);
        Utils.showToast('✅ Đã tạo ý tưởng tổng hợp mới!', 'success');
        this.clearSelection();
        App.viewDraft(newIdea.id);
      }
    } catch (e) {
      Utils.showToast('❌ Lỗi: ' + e.message, 'error');
    }
  },

  exportSelectedMarkdown() {
    const ideas = Array.from(this.selectedIdeaIds).map(id => Store.getIdea(id)).filter(Boolean);
    if (!ideas.length) return;
    let md = `# Sổ tay Ý tưởng (${ideas.length})\n*${Utils.formatDate(new Date().toISOString())}*\n\n---\n\n`;
    ideas.forEach((i, idx) => {
      md += `## ${idx + 1}. #${i.id.split('-').pop()} — ${i.title}\n- ${Utils.getCategoryLabel(i.category)} | ${Utils.getPriorityLabel(i.priority)} | ${Utils.getStatusLabel(i.status)}\n\n${i.content || ''}\n\n`;
      if (i.drafts?.length) md += `### Bản thảo v${i.drafts.length}\n${i.drafts[i.drafts.length - 1].content}\n\n`;
      md += `---\n\n`;
    });
    Utils.downloadFile(md, `idea-synthesis-${Store.formatDateId(new Date())}.md`, 'text/markdown');
    Utils.showToast(`📥 Đã xuất ${ideas.length} ý tưởng sang Markdown`, 'success');
  },

  batchUpdateStatusPrompt() {
    const cnt = this.selectedIdeaIds.size;
    if (!cnt) return;
    const body = `<p style="margin-bottom:var(--space-md)">Cập nhật <strong>${cnt} ý tưởng</strong>:</p><div class="form-group"><label class="form-label">Trạng thái mới</label><select class="form-select" id="batch-status-select">${Utils.renderOptions(Utils.statusOptions, 'reviewed')}</select></div><div class="form-group"><label class="form-label">Thêm tag chung</label><input type="text" class="form-input" id="batch-tag-input" placeholder="hoi-nghi, sang-kien..."></div><div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Hủy</button><button class="btn btn-primary" onclick="Timeline.doBatchUpdate()">Lưu cập nhật</button></div>`;
    App.openModal('Cập nhật hàng loạt', body);
  },

  doBatchUpdate() {
    const status = document.getElementById('batch-status-select')?.value;
    const tag = document.getElementById('batch-tag-input')?.value.trim().replace(/^#/, '');
    const ids = Array.from(this.selectedIdeaIds);
    ids.forEach(id => {
      const idea = Store.getIdea(id);
      if (!idea) return;
      const upd = {};
      if (status) upd.status = status;
      if (tag) {
        const cur = Array.isArray(idea.tags) ? [...idea.tags] : [];
        if (!cur.includes(tag)) cur.push(tag);
        upd.tags = cur;
      }
      Store.updateIdea(id, upd);
    });
    App.closeModal();
    Utils.showToast(`✅ Đã cập nhật ${ids.length} ý tưởng`, 'success');
    this.clearSelection();
    this.refresh();
  },

  editIdea(id) {
    const idea = Store.getIdea(id);
    if (!idea) return;
    this.editingLinkedIds = new Set(Array.isArray(idea.linkedIdeas) ? idea.linkedIdeas : []);
    this.editingIdeaId = id;

    const F = (l, c, extra='') => `<div class="form-group" ${extra}><label class="form-label">${l}</label>${c}</div>`;
    const G2 = (a, b) => `<div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">${a}${b}</div>`;
    const body = `${F('Tiêu đề', `<input type="text" class="form-input" id="edit-title" value="${Utils.escapeHtml(idea.title)}">`)}${F('Nội dung', `<textarea class="form-textarea" id="edit-content" rows="4">${Utils.escapeHtml(idea.content || '')}</textarea>`)}${G2(F('Danh mục', `<select class="form-select" id="edit-category">${Utils.renderOptions(Utils.categories, idea.category)}</select>`), F('Ưu tiên', `<select class="form-select" id="edit-priority">${Utils.renderOptions(Utils.priorities, idea.priority)}</select>`))}${G2(F('Trạng thái', `<select class="form-select" id="edit-status">${Utils.renderOptions(Utils.statusOptions, idea.status)}</select>`), F('Tags (phẩy cách)', `<input type="text" class="form-input" id="edit-tags" value="${Utils.escapeHtml((idea.tags || []).join(', '))}" placeholder="AI, surgery...">`))}${F('Ý tưởng liên kết', `<div id="edit-linked-chips" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px">${this.renderLinkedChips()}</div><input type="text" class="form-input" id="edit-link-search" placeholder="🔍 Tìm ý tưởng để liên kết..." oninput="Timeline.searchLinksToAdd(this.value)"><div id="edit-link-dropdown" class="tag-suggestions"></div>`, 'style="position:relative"')}<div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Hủy</button><button class="btn btn-primary" onclick="Timeline.saveEditIdea('${id}')">Lưu thay đổi</button></div>`;
    App.openModal('Chỉnh sửa ý tưởng', body);
  },

  renderLinkedChips() {
    if (!this.editingLinkedIds || !this.editingLinkedIds.size) return '<span style="font-size:0.78rem;color:var(--text-muted)">Chưa có liên kết</span>';
    return Array.from(this.editingLinkedIds).map(lid => {
      const it = Store.getIdea(lid);
      const title = it ? Utils.truncate(it.title, 25) : lid;
      return `<span class="chip chip-tag" style="padding:2px 8px">#${lid.split('-').pop()} ${Utils.escapeHtml(title)}<span class="tag-remove" onclick="Timeline.removeLinkedIdea('${lid}')">×</span></span>`;
    }).join('');
  },

  removeLinkedIdea(lid) {
    this.editingLinkedIds.delete(lid);
    const c = document.getElementById('edit-linked-chips');
    if (c) c.innerHTML = this.renderLinkedChips();
  },

  addLinkedIdea(lid) {
    this.editingLinkedIds.add(lid);
    const c = document.getElementById('edit-linked-chips');
    if (c) c.innerHTML = this.renderLinkedChips();
    const dd = document.getElementById('edit-link-dropdown');
    if (dd) dd.classList.remove('active');
    const inp = document.getElementById('edit-link-search');
    if (inp) { inp.value = ''; inp.focus(); }
  },

  searchLinksToAdd(q) {
    const dd = document.getElementById('edit-link-dropdown');
    if (!dd) return;
    const query = (q || '').trim().toLowerCase();
    if (!query) { dd.classList.remove('active'); return; }
    const ideas = Store.getAllIdeas().filter(i => i.id !== this.editingIdeaId && !this.editingLinkedIds.has(i.id) && (i.title.toLowerCase().includes(query) || i.id.includes(query))).slice(0, 6);
    if (!ideas.length) { dd.classList.remove('active'); return; }
    dd.innerHTML = ideas.map(i => `<div class="tag-suggestion-item" onclick="Timeline.addLinkedIdea('${i.id}')">#${i.id.split('-').pop()} - ${Utils.escapeHtml(Utils.truncate(i.title, 35))}</div>`).join('');
    dd.classList.add('active');
  },

  saveEditIdea(id) {
    const title = document.getElementById('edit-title')?.value.trim();
    const content = document.getElementById('edit-content')?.value.trim();
    const category = document.getElementById('edit-category')?.value;
    const priority = document.getElementById('edit-priority')?.value;
    const status = document.getElementById('edit-status')?.value;
    const tags = (document.getElementById('edit-tags')?.value || '').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    const linkedIdeas = Array.from(this.editingLinkedIds || []);

    if (!title) { Utils.showToast('Vui lòng nhập tiêu đề', 'error'); return; }

    Store.updateIdea(id, { title, content, summary: Utils.truncate(content || title, 200), category, priority, status: status || 'raw', tags, linkedIdeas });
    linkedIdeas.forEach(lid => Store.linkIdeas(id, lid));
    App.closeModal();
    Utils.showToast('✅ Đã cập nhật ý tưởng', 'success');
    this.refresh();
    App.updateSidebarStats();
  },
};
