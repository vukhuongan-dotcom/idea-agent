/* ========================================
   IDEA AGENT — Timeline Module
   Ideas grouped by date with filters,
   multi-select synthesis, and smart search
   ======================================== */

var Timeline = {
  filters: { category: 'all', priority: 'all', status: 'all', tag: '', dateRange: 'all', search: '', sort: 'newest' },
  selectedIdeaIds: new Set(),

  render() {
    return `<div class="page-header"><div><h1>📅 Timeline</h1><div class="page-subtitle">Tất cả ý tưởng theo dòng thời gian</div></div><button class="btn btn-primary" onclick="App.navigate('capture')">${Utils.icon('capture', 18)} Ý tưởng mới</button></div>${this.renderFilters()}${this.renderSort()}<div class="timeline" id="timeline-container">${this.renderTimeline()}</div><div id="synthesis-bar-container">${this.renderSynthesisBar()}</div>`;
  },

  hasActiveFilters() {
    return Boolean(this.filters.category !== 'all' || this.filters.priority !== 'all' || this.filters.status !== 'all' || this.filters.tag || (this.filters.dateRange && this.filters.dateRange !== 'all') || this.filters.search);
  },

  renderFilters() {
    const toList = obj => [{ key: 'all', label: 'Tất cả' }, ...Object.entries(obj).map(([k, v]) => ({ key: k, label: `${v.icon} ${v.label}` }))];
    const cats = toList(Utils.categories);
    const prios = toList(Utils.priorities);
    const stats = [{ key: 'all', label: 'Tất cả' }, { key: 'raw', label: '💭 Thô' }, { key: 'draft', label: '📝 Bản thảo' }, { key: 'reviewed', label: '✅ Đã duyệt' }, { key: 'archived', label: '📦 Lưu trữ' }];
    const hasF = this.hasActiveFilters();

    const mkChips = (grp, list) => list.map(c => `<span class="filter-chip ${this.filters[grp] === c.key ? 'active' : ''}" onclick="Timeline.setFilter('${grp}', '${c.key}')">${c.label}</span>`).join('');

    return `<div class="timeline-filters"><div class="timeline-filters-top"><div class="filter-search-wrapper">${Utils.icon('search', 14)}<input type="text" class="filter-search" id="timeline-search" placeholder="Tìm ý tưởng... (nhấn / để tìm nhanh)" value="${Utils.escapeHtml(this.filters.search)}" oninput="Timeline.onSearch(this.value)"></div>${this.filters.tag ? `<div class="active-tag-chip" onclick="Timeline.setFilter('tag', '')" title="Bỏ lọc tag">🏷️ #${Utils.escapeHtml(this.filters.tag)} <span>×</span></div>` : ''}<button class="filter-clear-btn ${hasF ? 'active' : ''}" id="timeline-clear-btn" onclick="Timeline.clearFilters()" title="Xóa tất cả bộ lọc">✕ Xóa bộ lọc</button></div><div class="timeline-filters-scroll"><div class="filter-group"><span class="filter-label">Danh mục:</span>${mkChips('category', cats)}</div><div class="filter-divider"></div><div class="filter-group"><span class="filter-label">Ưu tiên:</span>${mkChips('priority', prios)}</div><div class="filter-divider"></div><div class="filter-group"><span class="filter-label">Trạng thái:</span>${mkChips('status', stats)}</div></div></div>`;
  },

  renderSort() {
    const sorts = [{ k: 'newest', l: '🔽 Mới nhất' }, { k: 'oldest', l: '🔼 Cũ nhất' }, { k: 'priority', l: '🎯 Ưu tiên' }, { k: 'drafts', l: '📝 Bản thảo' }];
    const total = Store.getAllIdeas(this.filters).length;
    const r = this.filters.dateRange && this.filters.dateRange !== 'all' ? ` (${this.filters.dateRange === 'today' ? 'hôm nay' : this.filters.dateRange === 'week' ? 'tuần này' : 'tháng này'})` : '';
    return `<div class="timeline-sort"><span style="font-size:0.82rem;color:var(--text-tertiary);margin-right:auto"><strong style="color:var(--text-primary)" id="timeline-count-display">${total}</strong> ý tưởng${r}</span>${sorts.map(s => `<button class="sort-btn ${this.filters.sort === s.k ? 'active' : ''}" onclick="Timeline.setFilter('sort', '${s.k}')">${s.l}</button>`).join('')}</div>`;
  },

  renderTimeline() {
    const grouped = Store.getIdeasByDate(this.filters);
    const dateKeys = Object.keys(grouped).sort();
    if (this.filters.sort !== 'oldest') dateKeys.reverse();

    if (!dateKeys.length) {
      return `<div class="timeline-empty"><div class="timeline-empty-icon">🔍</div><div class="empty-state-title">Không tìm thấy ý tưởng</div><div class="empty-state-text">${this.filters.search || this.filters.tag || this.filters.category !== 'all' ? 'Thử thay đổi hoặc xóa bộ lọc tìm kiếm' : 'Hãy ghi nhận ý tưởng đầu tiên!'}</div>${this.filters.search ? '<button class="btn btn-secondary mt-lg" onclick="Timeline.clearFilters()">✕ Xóa bộ lọc</button>' : '<button class="btn btn-primary mt-lg" onclick="App.navigate(\'capture\')">✨ Ghi nhận ý tưởng</button>'}</div>`;
    }

    return dateKeys.map(dKey => `<div class="timeline-day"><div class="timeline-day-header"><div class="timeline-date-badge"><span class="date-icon">📆</span>${Utils.getDateLabel(dKey)}</div><div class="timeline-day-count">${grouped[dKey].length} ý tưởng</div><div class="timeline-day-line"></div></div><div class="timeline-ideas">${grouped[dKey].map(idea => this.renderIdeaCard(idea)).join('')}</div></div>`).join('');
  },

  renderIdeaCard(idea) {
    const seq = idea.id.split('-').pop();
    const hasD = idea.drafts && idea.drafts.length > 0;
    const isSel = this.selectedIdeaIds.has(idea.id);
    const lkCnt = Array.isArray(idea.linkedIdeas) ? idea.linkedIdeas.length : 0;

    return `<div class="idea-card ${isSel ? 'selected' : ''}" onclick="App.viewDraft('${idea.id}')"><div class="idea-card-select" onclick="event.stopPropagation()"><input type="checkbox" class="idea-select-check" id="check-${idea.id}" ${isSel ? 'checked' : ''} onchange="Timeline.toggleSelectIdea('${idea.id}', this.checked)" aria-label="Chọn #${seq}"></div><div class="idea-card-number">#${seq}</div><div class="idea-card-body"><div class="idea-card-header"><div><div class="idea-card-title">${Utils.escapeHtml(idea.title)}</div></div><div class="idea-card-actions" onclick="event.stopPropagation()"><button class="btn btn-icon btn-ghost btn-sm" onclick="Capture.generateDraft('${idea.id}')" title="Tạo bản thảo AI">🤖</button><button class="btn btn-icon btn-ghost btn-sm" onclick="Timeline.editIdea('${idea.id}')" title="Chỉnh sửa">${Utils.icon('edit', 15)}</button><button class="btn btn-icon btn-ghost btn-sm" onclick="Capture.confirmDelete('${idea.id}')" title="Xóa">${Utils.icon('delete', 15)}</button></div></div>${idea.summary ? `<div class="idea-card-summary">${Utils.escapeHtml(idea.summary || idea.content)}</div>` : ''}<div class="idea-card-meta" onclick="event.stopPropagation()"><span class="chip chip-${idea.category} chip-category" onclick="Timeline.setFilter('category', '${idea.category}')" title="Lọc danh mục">${Utils.getCategoryIcon(idea.category)} ${Utils.getCategoryLabel(idea.category)}</span><span class="priority-badge priority-${idea.priority}"><span class="priority-dot"></span> ${Utils.getPriorityLabel(idea.priority)}</span><span class="status-badge ${Utils.getStatusClass(idea.status)}" onclick="Timeline.quickToggleStatus('${idea.id}', event)" title="Nhấn để đổi trạng thái">${Utils.getStatusLabel(idea.status)}</span>${hasD ? `<span class="idea-draft-badge has-draft">📝 v${idea.drafts.length}</span>` : ''}${lkCnt ? `<span class="idea-linked-badge" title="${lkCnt} ý tưởng liên kết">🔗 ${lkCnt}</span>` : ''}<span class="idea-card-time">🕐 ${Utils.formatTime(idea.createdAt)}</span>${idea.tags && idea.tags.length ? `<div class="idea-card-tags">${idea.tags.slice(0, 3).map(t => `<span class="chip chip-tag" onclick="Timeline.filterByTag('${t}')">#${t}</span>`).join('')}${idea.tags.length > 3 ? `<span class="chip chip-tag">+${idea.tags.length - 3}</span>` : ''}</div>` : ''}</div></div></div>`;
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

  quickToggleStatus(id, e) {
    if (e) e.stopPropagation();
    const idea = Store.getIdea(id);
    if (!idea) return;
    const nxt = Utils.nextStatus(idea.status);
    Store.updateIdea(id, { status: nxt });
    Utils.showToast(`Trạng thái #${idea.id.split('-').pop()}: ${Utils.getStatusLabel(nxt)}`, 'info');
    this.updateTimelineOnly();
    App.updateSidebarStats();
  },

  toggleSelectIdea(id, isSel) {
    if (isSel) this.selectedIdeaIds.add(id); else this.selectedIdeaIds.delete(id);
    const c = document.getElementById('synthesis-bar-container');
    if (c) c.innerHTML = this.renderSynthesisBar();
  },
  clearSelection() {
    this.selectedIdeaIds.clear();
    document.querySelectorAll('.idea-select-check').forEach(i => i.checked = false);
    document.querySelectorAll('.idea-card.selected').forEach(i => i.classList.remove('selected'));
    const c = document.getElementById('synthesis-bar-container');
    if (c) c.innerHTML = '';
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
    const allIdeas = Store.getAllIdeas().filter(i => i.id !== id);
    const lkSet = new Set(idea.linkedIdeas || []);

    const body = `<div class="form-group"><label class="form-label">Tiêu đề</label><input type="text" class="form-input" id="edit-title" value="${Utils.escapeHtml(idea.title)}"></div><div class="form-group"><label class="form-label">Nội dung</label><textarea class="form-textarea" id="edit-content" rows="4">${Utils.escapeHtml(idea.content || '')}</textarea></div><div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md)"><div class="form-group"><label class="form-label">Danh mục</label><select class="form-select" id="edit-category">${Utils.renderOptions(Utils.categories, idea.category)}</select></div><div class="form-group"><label class="form-label">Ưu tiên</label><select class="form-select" id="edit-priority">${Utils.renderOptions(Utils.priorities, idea.priority)}</select></div></div><div style="display:grid; grid-template-columns:1fr 1fr; gap:var(--space-md)"><div class="form-group"><label class="form-label">Trạng thái</label><select class="form-select" id="edit-status">${Utils.renderOptions(Utils.statusOptions, idea.status)}</select></div><div class="form-group"><label class="form-label">Tags (phẩy cách)</label><input type="text" class="form-input" id="edit-tags" value="${Utils.escapeHtml((idea.tags || []).join(', '))}" placeholder="AI, surgery..."></div></div>${allIdeas.length ? `<div class="form-group"><label class="form-label">Ý tưởng liên kết</label><select class="form-select" id="edit-linked" multiple style="min-height:70px">${allIdeas.slice(0, 15).map(i => `<option value="${i.id}" ${lkSet.has(i.id) ? 'selected' : ''}>#${i.id.split('-').pop()} - ${Utils.truncate(i.title, 40)}</option>`).join('')}</select></div>` : ''}<div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Hủy</button><button class="btn btn-primary" onclick="Timeline.saveEditIdea('${id}')">Lưu thay đổi</button></div>`;
    App.openModal('Chỉnh sửa ý tưởng', body);
  },

  saveEditIdea(id) {
    const title = document.getElementById('edit-title')?.value.trim();
    const content = document.getElementById('edit-content')?.value.trim();
    const category = document.getElementById('edit-category')?.value;
    const priority = document.getElementById('edit-priority')?.value;
    const status = document.getElementById('edit-status')?.value;
    const tags = (document.getElementById('edit-tags')?.value || '').split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean);
    const sel = document.getElementById('edit-linked');
    const linkedIdeas = sel ? Array.from(sel.selectedOptions).map(o => o.value) : [];

    if (!title) { Utils.showToast('Vui lòng nhập tiêu đề', 'error'); return; }

    Store.updateIdea(id, { title, content, summary: Utils.truncate(content || title, 200), category, priority, status: status || 'raw', tags, linkedIdeas });
    linkedIdeas.forEach(lid => Store.linkIdeas(id, lid));
    App.closeModal();
    Utils.showToast('✅ Đã cập nhật ý tưởng', 'success');
    this.refresh();
    App.updateSidebarStats();
  },
};
