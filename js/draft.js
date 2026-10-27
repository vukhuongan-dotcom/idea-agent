/* ========================================
   IDEA AGENT — Draft Viewer Module
   View, edit, AI develop, and manage drafts
   ======================================== */

var Draft = {
  currentIdeaId: null,
  currentVersion: 0,
  isEditing: false,
  mobileActiveTab: 'draft', // 'original' | 'draft'

  render(ideaId) {
    this.currentIdeaId = ideaId;
    this.isEditing = false;
    const idea = Store.getIdea(ideaId);

    if (!idea) {
      return `<div class="empty-state" style="min-height:60vh"><div class="empty-state-icon">❓</div><div class="empty-state-title">Không tìm thấy ý tưởng</div><button class="btn btn-primary mt-lg" onclick="App.navigate('timeline')">← Quay lại Timeline</button></div>`;
    }

    this.currentVersion = idea.drafts && idea.drafts.length > 0 ? idea.drafts.length - 1 : -1;

    return `<div class="draft-nav"><button class="back-btn" onclick="App.navigate('timeline')">${Utils.icon('back', 16)} Quay lại</button><span class="draft-nav-title" title="${Utils.escapeHtml(idea.title)}">${Utils.escapeHtml(Utils.truncate(idea.title, 25))}</span><div class="draft-nav-meta"><span class="chip chip-${idea.category} chip-category">${Utils.getCategoryIcon(idea.category)} ${Utils.getCategoryLabel(idea.category)}</span><span class="priority-badge priority-${idea.priority}"><span class="priority-dot"></span> ${Utils.getPriorityLabel(idea.priority)}</span><button type="button" class="status-badge ${Utils.getStatusClass(idea.status)}" onclick="Draft.openStatusMenu(event)" title="Bấm để đổi trạng thái">${Utils.getStatusLabel(idea.status)} ▾</button></div><button type="button" class="btn btn-icon btn-ghost draft-mobile-menu-btn" onclick="Draft.openMobileMenu()" title="Tùy chọn bản thảo" aria-label="Tùy chọn bản thảo">⋯</button></div><div class="draft-mobile-segmented" id="draft-mobile-tabs"><button type="button" class="draft-mobile-tab ${this.mobileActiveTab === 'original' ? 'active' : ''}" onclick="Draft.switchMobileTab('original')">💡 Ý tưởng gốc</button><button type="button" class="draft-mobile-tab ${this.mobileActiveTab === 'draft' ? 'active' : ''}" onclick="Draft.switchMobileTab('draft')">📝 Bản thảo AI ${idea.drafts?.length ? `(v${idea.drafts.length})` : ''}</button></div><div class="draft-container ${this.mobileActiveTab === 'original' ? 'show-original' : 'show-draft'}">${this.renderOriginal(idea)}${this.renderDraftPanel(idea)}</div>`;
  },

  switchMobileTab(tab) {
    this.mobileActiveTab = tab;
    const container = document.querySelector('.draft-container');
    if (container) {
      container.classList.remove('show-original', 'show-draft');
      container.classList.add(tab === 'original' ? 'show-original' : 'show-draft');
    }
    document.querySelectorAll('.draft-mobile-tab').forEach((el, i) => {
      el.classList.toggle('active', (i === 0 && tab === 'original') || (i === 1 && tab === 'draft'));
    });
  },

  renderOriginal(idea) {
    const linkedIdeas = Array.isArray(idea.linkedIdeas) ? idea.linkedIdeas : [];
    return `<div class="draft-original" id="draft-original-panel"><div class="draft-original-header"><h3>💡 Ý tưởng gốc</h3><div style="display:flex; align-items:center; gap:var(--space-xs)"><button class="btn btn-ghost btn-sm" onclick="Draft.editOriginalIdea()" title="Sửa tiêu đề & nội dung gốc">${Utils.icon('edit', 14)} Sửa</button><span style="font-size:0.75rem; color:var(--text-muted)">#${idea.id.split('-').pop()}</span></div></div><div class="draft-original-title">${Utils.escapeHtml(idea.title)}</div><div class="draft-original-body">${idea.content ? Utils.renderMarkdown(idea.content) : '<em style="color:var(--text-muted)">Chưa có mô tả chi tiết</em>'}</div>${idea.tags && idea.tags.length ? `<div style="margin-top:var(--space-md); display:flex; flex-wrap:wrap; gap:4px">${idea.tags.map(t => `<span class="chip chip-tag" onclick="Timeline.filterByTag('${t}'); App.navigate('timeline')" title="Xem các ý tưởng #${t}">#${t}</span>`).join('')}</div>` : ''}${linkedIdeas.length ? `<div class="draft-linked-section"><div class="draft-linked-title">🔗 Ý tưởng liên quan (${linkedIdeas.length}):</div><div class="draft-linked-list">${linkedIdeas.map(lid => { const linked = Store.getIdea(lid); return linked ? `<a href="#draft/${lid}" class="draft-linked-item" title="${Utils.escapeHtml(linked.title)}">#${lid.split('-').pop()} — <strong>${Utils.truncate(linked.title, 40)}</strong></a>` : ''; }).filter(Boolean).join('')}</div></div>` : ''}<div style="margin-top:var(--space-lg); padding-top:var(--space-md); border-top:1px solid var(--border-light)"><div style="font-size:0.75rem; color:var(--text-muted); line-height:1.6">📅 Tạo: ${Utils.formatDateFull(idea.createdAt)} lúc ${Utils.formatTime(idea.createdAt)}<br>🔄 Cập nhật: ${Utils.formatRelative(idea.updatedAt)}</div></div></div>`;
  },

  renderDraftPanel(idea) {
    const isWorking = typeof AI !== 'undefined' && AI.isProcessing(idea.id);
    const hasDrafts = idea.drafts && idea.drafts.length > 0;
    const dis = isWorking ? 'disabled' : '';
    const acts = [
      { k: 'research_pico', i: '🔬', l: 'Đề cương PICO' },
      { k: 'hospital_initiative', i: '🏥', l: 'Sáng kiến BV' },
      ...(hasDrafts ? [
        { k: 'summarize', i: '📋', l: 'Tóm tắt' },
        { k: 'expand', i: '🔍', l: 'Chi tiết hóa' },
        { k: 'critique', i: '🎯', l: 'Phản biện' },
        { k: 'actionplan', i: '📊', l: 'Action Plan' }
      ] : [])
    ];

    return `<div class="draft-panel" id="draft-panel-area"><div class="draft-panel-header"><div class="draft-panel-title">📝 Bản thảo <span class="ai-badge">🤖 DeepSeek AI</span></div><div class="draft-actions-top">${hasDrafts ? `<button class="btn btn-ghost btn-sm" onclick="Draft.copyMarkdown()" title="Sao chép Markdown">📋 Copy</button><button class="btn btn-ghost btn-sm" onclick="Draft.toggleEdit()" id="draft-edit-btn" title="Chỉnh sửa">${Utils.icon('edit', 16)} ${this.isEditing ? 'Lưu' : 'Sửa'}</button><button class="btn btn-ghost btn-sm" onclick="Draft.exportDraft()" title="Tải file .md">${Utils.icon('export', 16)} Export</button>` : ''}</div></div>${hasDrafts ? this.renderVersionTabs(idea) : ''}<div class="draft-content" id="draft-content-area">${isWorking ? `<div class="draft-processing"><div class="draft-processing-spinner"></div><div class="draft-processing-text">🤖 DeepSeek AI đang phân tích và soạn thảo...</div><div style="font-size:0.78rem;color:var(--text-muted);margin-top:6px">Vui lòng chờ trong giây lát...</div></div>` : (hasDrafts ? this.renderDraftContent(idea) : this.renderNoDraft(idea))}</div><div class="ai-actions" id="ai-actions-bar"><button class="ai-action-btn primary" ${dis} onclick="Draft.triggerGenerate('${idea.id}')"><span class="ai-icon">✨</span> ${hasDrafts ? 'Tạo bản mới' : 'Tạo bản thảo AI'}</button>${acts.map(a => `<button class="ai-action-btn" ${dis} onclick="Draft.requestAI('${a.k}', '${idea.id}')"><span class="ai-icon">${a.i}</span> ${a.l}</button>`).join('')}<button class="ai-action-btn" ${dis} onclick="Draft.openCustomPromptModal('${idea.id}')" title="Yêu cầu riêng"><span class="ai-icon">💬</span> Yêu cầu riêng...</button></div><div class="draft-mobile-bottom-actions" id="draft-mobile-bottom-actions"><button type="button" class="btn btn-primary draft-mobile-act-btn" ${dis} onclick="Draft.triggerGenerate('${idea.id}')">✨ Phát triển</button><button type="button" class="btn btn-secondary draft-mobile-act-btn" ${dis} onclick="Draft.openCustomPromptModal('${idea.id}')">💬 Yêu cầu</button><button type="button" class="btn btn-secondary draft-mobile-act-btn" ${dis} onclick="Draft.openMoreActionsSheet('${idea.id}')">⋯ Thêm</button></div></div>`;
  },

  renderVersionTabs(idea) {
    if (!idea.drafts || idea.drafts.length <= 1) return '';
    return `<div class="draft-versions">${idea.drafts.map((d, i) => `<button class="draft-version-tab ${i === this.currentVersion ? 'active' : ''}" onclick="Draft.switchVersion(${i})">v${d.version} · ${Utils.formatRelative(d.createdAt)}</button>`).join('')}</div>`;
  },

  renderDraftContent(idea) {
    const draft = idea.drafts[this.currentVersion];
    if (!draft) return this.renderNoDraft(idea);
    if (this.isEditing) {
      return `<textarea class="draft-editor" id="draft-editor-area">${Utils.escapeHtml(draft.content)}</textarea>`;
    }
    return Utils.renderMarkdown(draft.content);
  },

  renderNoDraft(idea) {
    return `<div class="no-draft"><div class="no-draft-icon">🤖</div><h3>Chưa có bản thảo</h3><p>Chọn chế độ AI bên dưới để DeepSeek phát triển ý tưởng thành Đề cương PICO, Sáng kiến BV hoặc Kế hoạch hành động.</p><button class="btn btn-primary" onclick="Draft.triggerGenerate('${idea.id}')">✨ Tạo bản thảo AI</button></div>`;
  },

  // ========================
  // ACTIONS
  // ========================

  switchVersion(idx) {
    this.currentVersion = idx;
    const idea = Store.getIdea(this.currentIdeaId);
    if (!idea) return;

    document.querySelectorAll('.draft-version-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === idx);
    });

    const contentArea = document.getElementById('draft-content-area');
    if (contentArea) {
      contentArea.innerHTML = this.renderDraftContent(idea);
    }
  },

  toggleEdit() {
    this.isEditing = !this.isEditing;
    const idea = Store.getIdea(this.currentIdeaId);
    if (!idea) return;

    const btn = document.getElementById('draft-edit-btn');
    if (btn) {
      btn.innerHTML = `${Utils.icon('edit', 16)} ${this.isEditing ? 'Lưu' : 'Sửa'}`;
    }

    if (!this.isEditing) {
      const editor = document.getElementById('draft-editor-area');
      if (editor && idea.drafts[this.currentVersion]) {
        idea.drafts[this.currentVersion].content = editor.value;
        Store.updateIdea(this.currentIdeaId, { drafts: idea.drafts });
        Utils.showToast('✅ Đã lưu bản thảo', 'success');
      }
    }

    const contentArea = document.getElementById('draft-content-area');
    if (contentArea) {
      contentArea.innerHTML = this.renderDraftContent(idea);
    }
  },

  copyMarkdown() {
    const idea = Store.getIdea(this.currentIdeaId);
    if (!idea || !idea.drafts?.length) return;
    const draft = idea.drafts[this.currentVersion];
    if (draft && draft.content) {
      Utils.copyToClipboard(draft.content, '📋 Đã sao chép bản thảo vào Clipboard!');
    }
  },

  exportDraft() {
    const idea = Store.getIdea(this.currentIdeaId);
    if (!idea || !idea.drafts?.length) return;
    const draft = idea.drafts[this.currentVersion];
    const content = `# ${idea.title}\n> ${idea.id} | ${Utils.getCategoryLabel(idea.category)} | ${Utils.getPriorityLabel(idea.priority)}\n\n---\n\n## Ý tưởng gốc\n${idea.content || idea.title}\n\n---\n\n## Bản thảo (v${draft.version})\n${draft.content}`;
    Utils.downloadFile(content, `${idea.id}-draft-v${draft.version}.md`, 'text/markdown');
    Utils.showToast('📥 Đã export bản thảo', 'success');
  },

  editOriginalIdea() {
    if (typeof Timeline !== 'undefined') Timeline.editIdea(this.currentIdeaId);
  },

  openStatusMenu(e) {
    if (typeof Timeline !== 'undefined') Timeline.openStatusMenu(this.currentIdeaId, e);
  },

  quickChangeStatus() {
    this.openStatusMenu();
  },

  openMobileMenu() {
    const idea = Store.getIdea(this.currentIdeaId);
    if (!idea) return;
    const body = `
      <div style="display:flex;flex-direction:column;gap:8px;padding:var(--space-xs) 0">
        <p style="margin-bottom:8px;color:var(--text-secondary);font-size:0.875rem">#${idea.id.split('-').pop()} — <strong>${Utils.escapeHtml(idea.title)}</strong></p>
        <button type="button" class="btn btn-secondary" onclick="App.closeModal(); Draft.copyMarkdown()" style="justify-content:flex-start;min-height:44px;font-size:0.9rem">📋 Sao chép Markdown</button>
        <button type="button" class="btn btn-secondary" onclick="App.closeModal(); Draft.editOriginalIdea()" style="justify-content:flex-start;min-height:44px;font-size:0.9rem">✏️ Sửa ý tưởng gốc</button>
        <button type="button" class="btn btn-secondary" onclick="App.closeModal(); Draft.exportDraft()" style="justify-content:flex-start;min-height:44px;font-size:0.9rem">📥 Tải file Markdown (.md)</button>
        <button type="button" class="btn btn-secondary" onclick="App.closeModal(); Draft.openStatusMenu()" style="justify-content:flex-start;min-height:44px;font-size:0.9rem">🏷️ Đổi trạng thái...</button>
      </div>
    `;
    App.openModal('Tùy chọn bản thảo', body);
  },

  openMoreActionsSheet(ideaId) {
    const idea = Store.getIdea(ideaId);
    if (!idea) return;
    const acts = [
      { k: 'research_pico', i: '🔬', l: 'Đề cương NCKH (PICO)' },
      { k: 'hospital_initiative', i: '🏥', l: 'Sáng kiến Cải tiến BV' },
      { k: 'summarize', i: '📋', l: 'Tóm tắt nội dung' },
      { k: 'expand', i: '🔍', l: 'Chi tiết hóa ý tưởng' },
      { k: 'critique', i: '🎯', l: 'Phản biện chuyên môn' },
      { k: 'actionplan', i: '📊', l: 'Lập Kế hoạch Hành động' }
    ];
    const body = `
      <div style="display:flex;flex-direction:column;gap:8px;padding:var(--space-xs) 0">
        <p style="margin-bottom:8px;color:var(--text-secondary);font-size:0.875rem">Chọn tác vụ phát triển với DeepSeek AI:</p>
        ${acts.map(a => `
          <button type="button" class="btn btn-secondary" onclick="App.closeModal(); Draft.requestAI('${a.k}', '${ideaId}')" style="justify-content:flex-start;min-height:44px;font-size:0.9rem">
            ${a.i} ${a.l}
          </button>
        `).join('')}
      </div>
    `;
    App.openModal('Tác vụ AI nâng cao', body);
  },

  setProcessingState(isProcessing, message = '🤖 DeepSeek AI đang phân tích và soạn thảo...') {
    const contentArea = document.getElementById('draft-content-area');
    const buttons = document.querySelectorAll('#ai-actions-bar .ai-action-btn');
    buttons.forEach(btn => btn.disabled = isProcessing);
    if (isProcessing && contentArea) {
      contentArea.innerHTML = `<div class="draft-processing"><div class="draft-processing-spinner"></div><div class="draft-processing-text">${message}</div><div style="font-size:0.78rem;color:var(--text-muted);margin-top:6px">Vui lòng chờ trong giây lát (DeepSeek có thể mất 10-20 giây)...</div></div>`;
    }
  },

  async runAI(ideaId, taskName, taskFn) {
    const idea = Store.getIdea(ideaId);
    if (!idea) return;
    if (typeof AI !== 'undefined' && AI.isProcessing(ideaId)) {
      return Utils.showToast('⚠️ AI đang xử lý cho ý tưởng này. Vui lòng chờ!', 'info');
    }
    const settings = Store.getSettings();
    if (!settings.geminiApiKey) {
      Utils.showToast('Vui lòng nhập API Key trong Cài đặt', 'error');
      App.navigate('settings');
      return;
    }

    AI.lock(ideaId);
    this.setProcessingState(true, `🤖 DeepSeek AI ${taskName}...`);

    try {
      const result = await taskFn(idea, settings);
      if (result) {
        const res = Store.addDraft(ideaId, result);
        if (!res) {
          Utils.showToast('❌ Không thể lưu bản thảo (bộ nhớ đầy). Vui lòng Export sao lưu!', 'error', 6000);
        } else {
          Utils.showToast('✅ Bản thảo AI đã sẵn sàng!', 'success');
          this.mobileActiveTab = 'draft';
        }
      }
    } catch (err) {
      console.error('AI error:', err);
      Utils.showToast('❌ Lỗi: ' + err.message, 'error');
    } finally {
      AI.unlock(ideaId);
      if (App.currentPage === 'draft' && this.currentIdeaId === ideaId) {
        this.setProcessingState(false);
        App.renderCurrentPage();
      }
    }
  },

  triggerGenerate(ideaId) {
    return this.runAI(ideaId, 'đang phát triển bản thảo chi tiết', (idea, settings) => AI.generateDraft(idea, settings));
  },

  requestAI(action, ideaId, customPrompt) {
    const actionLabels = {
      research_pico: 'đang lập Đề cương NCKH PICO',
      hospital_initiative: 'đang soạn Sáng kiến Cải tiến BV',
      summarize: 'đang tóm tắt ý tưởng',
      expand: 'đang chi tiết hóa nội dung',
      critique: 'đang phản biện chuyên môn',
      actionplan: 'đang lập Action Plan',
      custom: 'đang xử lý yêu cầu riêng'
    };
    return this.runAI(ideaId, actionLabels[action] || 'đang xử lý', (idea, settings) => {
      if (customPrompt) settings.customPrompt = customPrompt;
      return AI.processAction(action, idea, settings, this.currentVersion);
    });
  },

  openCustomPromptModal(ideaId) {
    const bodyHtml = `<p style="margin-bottom:var(--space-md)">Nhập yêu cầu để DeepSeek AI soạn thảo hoặc hiệu chỉnh bản thảo theo ý muốn:</p><div class="form-group"><label class="form-label">Yêu cầu chỉ đạo AI</label><textarea class="form-textarea" id="custom-prompt-input" rows="4" placeholder="Ví dụ: Soạn dàn ý 10 slide báo cáo hội nghị; hoặc Thêm phần tiêu chuẩn chọn mẫu và loại trừ bệnh nhân..."></textarea></div><div class="modal-footer"><button class="btn btn-secondary" onclick="App.closeModal()">Hủy</button><button class="btn btn-primary" onclick="Draft.doCustomPrompt('${ideaId}')">✨ Gửi yêu cầu</button></div>`;
    App.openModal('💬 Yêu cầu riêng cho AI', bodyHtml);
  },

  doCustomPrompt(ideaId) {
    const prompt = document.getElementById('custom-prompt-input')?.value.trim();
    if (!prompt) {
      Utils.showToast('Vui lòng nhập yêu cầu cho AI', 'error');
      return;
    }
    App.closeModal();
    this.requestAI('custom', ideaId, prompt);
  },
};
