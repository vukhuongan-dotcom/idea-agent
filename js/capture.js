/* ========================================
   IDEA AGENT — Capture Module
   Quick capture + full form
   ======================================== */

var Capture = {
  selectedCategory: null,
  selectedPriority: 'medium',
  currentTags: [],
  isExpanded: false,
  quickCategory: null,
  quickPriority: 'medium',

  render() {
    const data = Store.getData();
    const defaultCat = this.quickCategory || Store.getSettings().defaultCategory || 'tech';
    const stats = [
      ['💡', Store.getTodayCount(), 'Hôm nay', 'purple', '0.05s', "{dateRange:'today'}"],
      ['📅', Store.getWeekCount(), '7 ngày qua', 'amber', '0.1s', "{dateRange:'week'}"],
      ['📊', Store.getMonthCount(), 'Tháng này', 'blue', '0.15s', "{dateRange:'month'}"],
      ['📝', data.stats.totalDrafts || 0, 'Bản thảo AI', 'green', '0.2s', "{status:'draft'}"]
    ];

    const pills = (lbl, items, cur, fn, attr) => `<div class="quick-pill-group"><span class="quick-pill-label">${lbl}</span>${Object.entries(items).map(([k, v]) => `<button type="button" class="quick-pill ${k === cur ? 'active' : ''}" ${attr}="${k}" onclick="${fn}('${k}')">${v.icon} ${v.label}</button>`).join('')}</div>`;

    return `<div class="capture-hero"><div class="capture-hero-content"><h1>💡 Ghi nhận ý tưởng</h1><div class="quick-capture"><textarea class="quick-capture-input" id="quick-capture-input" placeholder="Nhập ý tưởng... (Hỗ trợ #tag !cao @lamsang)" rows="1" oninput="Capture.handleQuickInput(this)"></textarea><div id="quick-token-preview" class="quick-token-preview" style="display:none"></div><div class="quick-capture-buttons"><button class="quick-capture-btn" onclick="Capture.quickSave()" id="quick-capture-btn" title="Lưu nhanh ý tưởng (Cmd+Enter)">⚡ Lưu nhanh</button><button type="button" class="quick-capture-more-btn" onclick="Capture.expandForm()" id="quick-capture-more-btn" title="Mở form chi tiết (Cmd+E)">⚙️ Chi tiết</button></div></div><div class="quick-capture-meta-bar" id="quick-meta-bar">${pills('Danh mục:', Utils.categories, defaultCat, 'Capture.selectQuickCategory', 'data-cat')}${pills('Ưu tiên:', Utils.priorities, this.quickPriority || 'medium', 'Capture.selectQuickPriority', 'data-priority')}</div><div class="quick-capture-hint"><span class="quick-capture-hint-text"><kbd>Cmd</kbd> + <kbd>Enter</kbd> lưu nhanh &nbsp;·&nbsp; <kbd>Cmd</kbd> + <kbd>E</kbd> form chi tiết &nbsp;·&nbsp; </span><button type="button" class="syntax-help-btn" onclick="Capture.showSyntaxHelp()" title="Xem cú pháp" aria-label="Xem cú pháp">? Cú pháp</button></div></div></div><div class="capture-stats">${stats.map(([ico, val, lbl, clr, dly, flt]) => `<button type="button" class="capture-stat-card animate-slide-up" style="animation-delay:${dly}" onclick="Capture.goToTimeline(${flt})"><div class="capture-stat-icon ${clr}">${ico}</div><div class="capture-stat-text-wrap"><div class="capture-stat-value">${val}</div><div class="capture-stat-label">${lbl}</div></div></button>`).join('')}</div><div id="capture-form-container" style="display:none">${this.renderForm()}</div><div class="recent-ideas-section"><div class="recent-ideas-header"><h2>⚡ Ý tưởng gần đây</h2><a href="#" class="btn btn-ghost btn-sm" onclick="App.navigate('timeline'); return false;">Xem tất cả →</a></div><div id="recent-ideas-list">${this.renderRecentIdeas()}</div></div>`;
  },

  renderForm() {
    const s = Store.getSettings();
    const F = (l, c, w = false, r = '') => `<div class="form-group ${w ? 'full-width' : ''}" ${r}><label class="form-label">${l}</label>${c}</div>`;
    const catPicker = `<div class="category-picker" id="category-picker">${Object.entries(Utils.categories).map(([k, c]) => `<div class="category-option ${k === (this.selectedCategory || s.defaultCategory) ? 'selected' : ''}" data-cat="${k}" onclick="Capture.selectCategory('${k}')">${c.icon} ${c.label}</div>`).join('')}</div>`;
    const prioPicker = `<div class="priority-picker" id="priority-picker">${Object.entries(Utils.priorities).map(([k, p]) => `<div class="priority-option ${k === this.selectedPriority ? 'selected' : ''}" data-priority="${k}" onclick="Capture.selectPriority('${k}')">${p.icon} ${p.label}</div>`).join('')}</div>`;
    const tagInput = `<div class="tag-input-wrapper" id="tag-input-wrapper" onclick="document.getElementById('tag-input-field').focus()">${this.currentTags.map(t => `<span class="chip chip-tag">#${t}<span class="tag-remove" onclick="Capture.removeTag('${t}');event.stopPropagation();">×</span></span>`).join('')}<input type="text" class="tag-input-field" id="tag-input-field" placeholder="${this.currentTags.length ? '' : 'Thêm tag...'}" onkeydown="Capture.handleTagInput(event)" oninput="Capture.showTagSuggestions()"></div><div class="tag-suggestions" id="tag-suggestions"></div>`;

    return `<div class="capture-form animate-scale-in"><div class="capture-form-grid">${F('Tiêu đề ý tưởng', '<input type="text" class="form-input" id="idea-title" placeholder="Đặt tên cho ý tưởng" autofocus>', true)}${F('Mô tả chi tiết', '<textarea class="form-textarea" id="idea-content" placeholder="Mô tả chi tiết ý tưởng. Viết tự do — AI sẽ giúp bạn cấu trúc hóa sau..." rows="4"></textarea>', true)}${F('Danh mục', catPicker)}${F('Mức ưu tiên', prioPicker)}${F('Tags', tagInput, true, 'style="position:relative"')}</div><div style="display:flex;justify-content:flex-end;gap:var(--space-sm);margin-top:var(--space-lg)"><button class="btn btn-secondary" onclick="Capture.collapseForm()">Hủy</button><button class="btn btn-primary btn-lg" onclick="Capture.saveIdea()">✨ Lưu ý tưởng</button></div></div>`;
  },

  renderRecentIdeas() {
    const ideas = Store.getAllIdeas().slice(0, 8);
    if (!ideas.length) {
      return `<div class="empty-state" style="padding:var(--space-xl)"><div class="empty-state-icon">💭</div><div class="empty-state-title">Chưa có ý tưởng nào</div><div class="empty-state-text">Hãy bắt đầu ghi nhận ý tưởng đầu tiên!</div></div>`;
    }
    return ideas.map((idea, idx) => `<div class="recent-idea-item animate-slide-up" style="animation-delay:${idx * 0.04}s" onclick="App.viewDraft('${idea.id}')"><div class="recent-idea-number">${idea.id.split('-').pop()}</div><div class="recent-idea-content"><div class="recent-idea-title">${Utils.escapeHtml(idea.title)}</div><div class="recent-idea-meta"><span class="chip chip-${idea.category} chip-category">${Utils.getCategoryIcon(idea.category)} ${Utils.getCategoryLabel(idea.category)}</span><span class="priority-badge priority-${idea.priority}"><span class="priority-dot"></span> ${Utils.getPriorityLabel(idea.priority)}</span><span class="recent-idea-time">${Utils.formatRelative(idea.createdAt)}</span></div></div><div class="recent-idea-actions"><button class="btn btn-icon btn-ghost" onclick="Capture.generateDraft('${idea.id}');event.stopPropagation();" title="Bản thảo AI">🤖</button><button class="btn btn-icon btn-ghost" onclick="Capture.confirmDelete('${idea.id}');event.stopPropagation();" title="Xóa">${Utils.icon('delete',16)}</button></div></div>`).join('');
  },

  // ========================
  // ACTIONS
  // ========================

  expandForm() {
    const qIn = document.getElementById('quick-capture-input');
    const qTxt = qIn ? qIn.value.trim() : '';
    const parsed = this.parseQuickText(qTxt);
    this.selectedCategory = parsed.category;
    this.selectedPriority = parsed.priority;
    this.currentTags = [...parsed.tags];
    this.isExpanded = true;
    const c = document.getElementById('capture-form-container');
    if (!c) return;
    c.style.display = 'block';
    c.innerHTML = this.renderForm();
    const ti = document.getElementById('idea-title');
    const ci = document.getElementById('idea-content');
    if (ti) ti.value = (parsed.title && parsed.title !== 'Ý tưởng không tiêu đề') ? parsed.title : '';
    if (ci && parsed.content) ci.value = parsed.content;
    setTimeout(() => {
      const el = document.getElementById(parsed.content ? 'idea-content' : 'idea-title');
      if (el) el.focus();
    }, 100);
  },

  collapseForm() {
    this.isExpanded = false;
    const c = document.getElementById('capture-form-container');
    if (c) c.style.display = 'none';
  },

  selectCategory(cat) {
    this.selectedCategory = cat;
    document.querySelectorAll('.category-option').forEach(el => el.classList.toggle('selected', el.dataset.cat === cat));
  },

  selectPriority(p) {
    this.selectedPriority = p;
    document.querySelectorAll('.priority-option').forEach(el => el.classList.toggle('selected', el.dataset.priority === p));
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
    wrapper.querySelectorAll('.chip').forEach(c => c.remove());
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
      const val = e.target.value.trim();
      if (val) {
        this.addTag(val);
        e.target.value = '';
        this.hideTagSuggestions();
      }
    } else if (e.key === 'Backspace' && !e.target.value && this.currentTags.length) {
      this.currentTags.pop();
      this.refreshTagDisplay();
    }
  },

  showTagSuggestions() {
    const input = document.getElementById('tag-input-field'), dd = document.getElementById('tag-suggestions');
    if (!input || !dd) return;
    const q = input.value.trim().toLowerCase();
    if (!q) return this.hideTagSuggestions();
    const s = Store.getTags().filter(t => t.toLowerCase().includes(q) && !this.currentTags.includes(t)).slice(0, 6);
    if (!s.length) return this.hideTagSuggestions();
    dd.innerHTML = s.map(t => `<div class="tag-suggestion-item" onclick="Capture.addTag('${t}');Capture.hideTagSuggestions()">#${t}</div>`).join('');
    dd.classList.add('active');
  },

  hideTagSuggestions() {
    document.getElementById('tag-suggestions')?.classList.remove('active');
  },

  saveIdea() {
    const title = document.getElementById('idea-title')?.value.trim() || '';
    const content = document.getElementById('idea-content')?.value.trim() || '';
    if (!title && !content) return Utils.showToast('Vui lòng nhập tiêu đề hoặc nội dung', 'error');

    const idea = Store.addIdea({
      title: title || Utils.truncate(content, 60),
      summary: Utils.truncate(content, 200),
      content,
      category: this.selectedCategory || Store.getSettings().defaultCategory,
      tags: [...this.currentTags],
      priority: this.selectedPriority,
    });

    if (!idea) {
      return Utils.showToast('❌ Bộ nhớ đầy. Vui lòng Export sao lưu trong Cài đặt!', 'error', 6000);
    }

    Utils.showToast(`✨ Ý tưởng #${idea.id.split('-').pop()} đã được lưu!`, 'success');
    this.collapseForm();
    const qIn = document.getElementById('quick-capture-input');
    if (qIn) qIn.value = '';

    const settings = Store.getSettings();
    if (settings.autoGenerateDraft && settings.geminiApiKey) this.generateDraft(idea.id);

    App.renderCurrentPage();
    App.updateSidebarStats();
  },

  // Quick meta bar selection
  selectQuickCategory(cat) {
    this.quickCategory = cat;
    document.querySelectorAll('.quick-pill[data-cat]').forEach(el => {
      el.classList.toggle('active', el.dataset.cat === cat);
    });
  },

  selectQuickPriority(p) {
    this.quickPriority = p;
    document.querySelectorAll('.quick-pill[data-priority]').forEach(el => {
      el.classList.toggle('active', el.dataset.priority === p);
    });
  },

  handleQuickInput(textarea) {
    textarea.style.height = 'auto';
    const newH = Math.min(Math.max(textarea.scrollHeight, 44), 160);
    textarea.style.height = newH + 'px';

    const prevEl = document.getElementById('quick-token-preview');
    if (!prevEl) return;
    const val = textarea.value;
    const parsed = this.parseQuickText(val);

    const explicitTags = parsed.tags;
    const explicitPriorityMatch = val.match(/(?:^|\s)!(critical|quantrong|khancap|red|high|cao|gap|low|thap|nhe|medium|tb)\b/i);
    const explicitCatMatch = val.match(/(?:^|\s)@(clinical|lamsang|benhnhan|mo|research|nghiencuu|nckh|tech|congnghe|it|personal|canhan|business|kinhdoanh)\b/i);

    const chips = [];
    explicitTags.forEach(t => {
      chips.push(`<span class="preview-chip tag" onclick="Capture.removeTokenFromQuickInput('#${t}')">#${t} <span class="chip-remove">×</span></span>`);
    });
    if (explicitPriorityMatch) {
      const pLabel = Utils.getPriorityLabel(parsed.priority);
      chips.push(`<span class="preview-chip priority" onclick="Capture.removeTokenFromQuickInput('${explicitPriorityMatch[0].trim()}')">${pLabel} <span class="chip-remove">×</span></span>`);
    }
    if (explicitCatMatch) {
      const cLabel = Utils.getCategoryLabel(parsed.category);
      chips.push(`<span class="preview-chip category" onclick="Capture.removeTokenFromQuickInput('${explicitCatMatch[0].trim()}')">${cLabel} <span class="chip-remove">×</span></span>`);
    }

    if (chips.length > 0) {
      prevEl.innerHTML = chips.join('');
      prevEl.style.display = 'flex';
    } else {
      prevEl.innerHTML = '';
      prevEl.style.display = 'none';
    }
  },

  removeTokenFromQuickInput(token) {
    const input = document.getElementById('quick-capture-input');
    if (!input) return;
    const escaped = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    input.value = input.value.replace(new RegExp('(?:^|\\s)' + escaped + '(?=\\s|$)', 'g'), ' ').replace(/\s+/g, ' ').trim();
    this.handleQuickInput(input);
    input.focus();
  },

  showSyntaxHelp() {
    App.openModal('Cú pháp ghi nhanh', `
      <div style="font-size:0.9rem;line-height:1.6">
        <p>Gõ nhanh nhãn trực tiếp trong ô ý tưởng:</p>
        <ul style="margin:8px 0 12px 20px">
          <li><strong>#tag</strong>: ví dụ <code>#phauthuat</code>, <code>#NCKH</code> (tự bóc thành tags)</li>
          <li><strong>!ưu-tiên</strong>: <code>!cao</code>, <code>!gap</code> (Cao), <code>!quantrong</code> (Quan trọng), <code>!thap</code> (Thấp)</li>
          <li><strong>@danh-mục</strong>: <code>@lamsang</code>, <code>@nckh</code>, <code>@tech</code>, <code>@canhan</code></li>
        </ul>
        <p style="color:var(--text-muted);font-size:0.8rem">Gợi ý: Dòng 1 làm Tiêu đề, các dòng tiếp theo tự động làm Mô tả chi tiết.</p>
      </div>
      <div class="modal-footer"><button class="btn btn-primary" onclick="App.closeModal()">Đã hiểu</button></div>
    `);
  },

  goToTimeline(filter = {}) {
    if (typeof Timeline !== 'undefined') {
      Timeline.filters = { ...Timeline.filters, ...filter };
    }
    App.navigate('timeline');
  },

  // Smart text parsing: extract #tag, !priority, @category, and split Title / Content
  parseQuickText(rawText) {
    if (!rawText) return { title: '', content: '', summary: '', category: 'tech', priority: 'medium', tags: [] };
    let text = rawText.trim();
    const tags = [];
    let priority = this.quickPriority || 'medium';
    let category = this.quickCategory || null;

    const pMap = { critical:'critical', quantrong:'critical', khancap:'critical', red:'critical', high:'high', cao:'high', gap:'high', low:'low', thap:'low', nhe:'low', medium:'medium', tb:'medium' };
    const cMap = { clinical:'clinical', lamsang:'clinical', benhnhan:'clinical', mo:'clinical', research:'research', nghiencuu:'research', nckh:'research', tech:'tech', congnghe:'tech', it:'tech', personal:'personal', canhan:'personal', business:'business', kinhdoanh:'business' };

    // 1. Tags: only preceded by start or whitespace; must start with a letter (avoids #2 or URL #fragments)
    text = text.replace(/(^|\s)#([a-zA-Z\u00C0-\u024F\u1E00-\u1EFF][\w\u00C0-\u024F\u1E00-\u1EFF-]*)/g, (match, prefix, tag) => {
      tags.push(tag);
      return prefix ? ' ' : '';
    });

    // 2. Priority: only recognized tokens removed, unrecognized kept
    text = text.replace(/(^|\s)!([\w\u00C0-\u024F\u1E00-\u1EFF-]+)/g, (match, prefix, p) => {
      const mapped = pMap[p.toLowerCase()];
      if (mapped) {
        priority = mapped;
        return prefix ? ' ' : '';
      }
      return match;
    });

    // 3. Category: only recognized tokens removed, unrecognized kept (avoids email like an@bvbd.vn)
    text = text.replace(/(^|\s)@([\w\u00C0-\u024F\u1E00-\u1EFF-]+)/g, (match, prefix, c) => {
      const mapped = cMap[c.toLowerCase()];
      if (mapped) {
        category = mapped;
        return prefix ? ' ' : '';
      }
      return match;
    });

    text = text.replace(/[ \t]+/g, ' ').trim();

    if (!category) {
      const lower = (rawText || '').toLowerCase();
      if (/\bAI\b/.test(rawText || '') || /trí tuệ nhân tạo|deepseek|code|lập trình|app|web|server|database|api|tool|workflow|automation/i.test(lower)) {
        category = 'tech';
      } else if (/người bệnh|bệnh nhân|phẫu thuật|tai biến|hậu môn nhân tạo|stoma|mổ|lâm sàng|chẩn đoán|điều trị|biến chứng|đại tràng|trực tràng|nội soi|ung thư/i.test(lower)) {
        category = 'clinical';
      } else if (/nghiên cứu|nckh|đề tài|báo cáo|thống kê|số liệu|cohort|p-value|pubmed|y văn|abstract/i.test(lower)) {
        category = 'research';
      } else {
        category = Store.getSettings().defaultCategory || 'tech';
      }
    }

    const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    let title = '';
    let content = '';
    if (lines.length > 1) {
      title = lines[0]
        .replace(/(^|\s)#([a-zA-Z\u00C0-\u024F\u1E00-\u1EFF][\w\u00C0-\u024F\u1E00-\u1EFF-]*)/g, '')
        .replace(/(^|\s)!(critical|quantrong|khancap|red|high|cao|gap|low|thap|nhe|medium|tb)\b/gi, '')
        .replace(/(^|\s)@(clinical|lamsang|benhnhan|mo|research|nghiencuu|nckh|tech|congnghe|it|personal|canhan|business|kinhdoanh)\b/gi, '')
        .replace(/[ \t]+/g, ' ')
        .trim() || lines[0];
      content = lines.slice(1).join('\n');
    } else {
      title = text || rawText.trim();
      content = '';
    }

    return { title: title || 'Ý tưởng không tiêu đề', content, summary: Utils.truncate(content || title, 200), category, priority, tags };
  },

  // Quick save (from hero input)
  quickSave() {
    const input = document.getElementById('quick-capture-input');
    if (!input) return;

    const rawText = input.value.trim();
    if (!rawText) {
      Utils.showToast('Vui lòng nhập nội dung ý tưởng', 'error');
      input.focus();
      return;
    }

    const parsed = this.parseQuickText(rawText);
    const idea = Store.addIdea(parsed);
    if (!idea) {
      return Utils.showToast('❌ Bộ nhớ đầy. Vui lòng Export sao lưu trong Cài đặt!', 'error', 6000);
    }

    Utils.showToast(`⚡ Ý tưởng #${idea.id.split('-').pop()} đã lưu nhanh!`, 'success');
    input.value = '';
    input.style.height = 'auto';

    // Auto-generate draft if setting enabled
    const settings = Store.getSettings();
    if (settings.autoGenerateDraft && settings.geminiApiKey) {
      this.generateDraft(idea.id);
    }

    App.renderCurrentPage();
    App.updateSidebarStats();
  },

  // Delete idea with unified modal
  confirmDelete(id) {
    const idea = Store.getIdea(id);
    if (!idea) return;
    App.openModal('Xác nhận xóa', `<p style="margin-bottom:var(--space-md)">Xóa ý tưởng <strong>"${Utils.escapeHtml(idea.title)}"</strong> (#${idea.id.split('-').pop()})?</p><div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Hủy</button><button class="btn btn-danger" onclick="Capture.doDelete('${id}')">Xóa vĩnh viễn</button></div>`);
  },

  doDelete(id) {
    Store.deleteIdea(id);
    App.closeModal();
    Utils.showToast('🗑️ Đã xóa ý tưởng', 'info');
    App.renderCurrentPage();
    App.updateSidebarStats();
  },

  async generateDraft(ideaId) {
    const idea = Store.getIdea(ideaId);
    if (!idea) return;
    const settings = Store.getSettings();
    if (!settings.geminiApiKey) {
      Utils.showToast('Vui lòng nhập API Key trong Cài đặt', 'error');
      return App.navigate('settings');
    }
    Store.updateIdea(ideaId, { status: 'developing' });
    Utils.showToast('🤖 Đang phát triển bản thảo...', 'info', 5000);
    try {
      const draft = await AI.generateDraft(idea, settings);
      if (draft) {
        const res = Store.addDraft(ideaId, draft);
        if (!res) {
          Utils.showToast('❌ Bộ nhớ đầy! Không thể lưu bản thảo. Vui lòng Export sao lưu!', 'error', 6000);
        } else {
          Utils.showToast('✅ Bản thảo AI đã sẵn sàng!', 'success');
          App.renderCurrentPage();
        }
      }
    } catch (err) {
      Store.updateIdea(ideaId, { status: 'raw' });
      Utils.showToast('❌ Lỗi tạo bản thảo: ' + err.message, 'error');
    }
  },

  initShortcuts() {
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        const a = document.activeElement;
        if (a?.id === 'quick-capture-input') { e.preventDefault(); this.quickSave(); }
        else if (this.isExpanded) { e.preventDefault(); this.saveIdea(); }
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'e' || e.key === 'E')) {
        if (App.currentPage === 'capture') { e.preventDefault(); this.expandForm(); }
      }
    });
  }
};
