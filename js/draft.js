/* ========================================
   IDEA AGENT — Draft Viewer Module
   View and manage AI-generated drafts
   ======================================== */

var Draft = {
  currentIdeaId: null,
  currentVersion: 0,
  isEditing: false,

  render(ideaId) {
    this.currentIdeaId = ideaId;
    const idea = Store.getIdea(ideaId);

    if (!idea) {
      return `
        <div class="empty-state" style="min-height: 60vh">
          <div class="empty-state-icon">❓</div>
          <div class="empty-state-title">Không tìm thấy ý tưởng</div>
          <button class="btn btn-primary mt-lg" onclick="App.navigate('timeline')">← Quay lại Timeline</button>
        </div>
      `;
    }

    this.currentVersion = idea.drafts.length > 0 ? idea.drafts.length - 1 : -1;

    return `
      <div class="draft-nav">
        <button class="back-btn" onclick="App.navigate('timeline')">
          ${Utils.icon('back', 16)} Quay lại
        </button>
        <div>
          <span class="chip chip-${idea.category} chip-category">${Utils.getCategoryIcon(idea.category)} ${Utils.getCategoryLabel(idea.category)}</span>
          <span class="priority-badge priority-${idea.priority}">
            <span class="priority-dot"></span> ${Utils.getPriorityLabel(idea.priority)}
          </span>
          <span class="status-badge ${Utils.getStatusClass(idea.status)}">${Utils.getStatusLabel(idea.status)}</span>
        </div>
      </div>

      <div class="draft-container">
        ${this.renderOriginal(idea)}
        ${this.renderDraftPanel(idea)}
      </div>
    `;
  },

  renderOriginal(idea) {
    return `
      <div class="draft-original">
        <div class="draft-original-header">
          <h3>💡 Ý tưởng gốc</h3>
          <span style="font-size: 0.75rem; color: var(--text-muted)">
            #${idea.id.split('-').pop()} · ${Utils.formatDate(idea.createdAt)}
          </span>
        </div>
        <div class="draft-original-title">${Utils.escapeHtml(idea.title)}</div>
        <div class="draft-original-body">
          ${idea.content ? Utils.renderMarkdown(idea.content) : '<em style="color: var(--text-muted)">Không có mô tả chi tiết</em>'}
        </div>

        ${idea.tags.length ? `
          <div style="margin-top: var(--space-md); display: flex; flex-wrap: wrap; gap: 4px;">
            ${idea.tags.map(t => `<span class="chip chip-tag">#${t}</span>`).join('')}
          </div>
        ` : ''}

        <div style="margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-light);">
          <div style="font-size: 0.75rem; color: var(--text-muted)">
            📅 Tạo: ${Utils.formatDateFull(idea.createdAt)} lúc ${Utils.formatTime(idea.createdAt)}<br>
            🔄 Cập nhật: ${Utils.formatRelative(idea.updatedAt)}
          </div>
        </div>
      </div>
    `;
  },

  renderDraftPanel(idea) {
    const hasDrafts = idea.drafts && idea.drafts.length > 0;

    return `
      <div class="draft-panel">
        <div class="draft-panel-header">
          <div class="draft-panel-title">
            📝 Bản thảo
            <span class="ai-badge">🤖 Gemini AI</span>
          </div>
          <div class="draft-actions-top">
            ${hasDrafts ? `
              <button class="btn btn-ghost btn-sm" onclick="Draft.toggleEdit()" id="draft-edit-btn">
                ${Utils.icon('edit', 16)} ${this.isEditing ? 'Xem' : 'Sửa'}
              </button>
              <button class="btn btn-ghost btn-sm" onclick="Draft.exportDraft()">
                ${Utils.icon('export', 16)} Export
              </button>
            ` : ''}
          </div>
        </div>

        ${hasDrafts ? this.renderVersionTabs(idea) : ''}

        <div class="draft-content" id="draft-content-area">
          ${hasDrafts ? this.renderDraftContent(idea) : this.renderNoDraft(idea)}
        </div>

        <div class="ai-actions">
          <button class="ai-action-btn" onclick="Capture.generateDraft('${idea.id}')">
            <span class="ai-icon">✨</span>
            ${hasDrafts ? 'Phát triển thêm' : 'Tạo bản thảo AI'}
          </button>
          ${hasDrafts ? `
            <button class="ai-action-btn" onclick="Draft.requestAI('summarize', '${idea.id}')">
              <span class="ai-icon">📋</span> Tóm tắt
            </button>
            <button class="ai-action-btn" onclick="Draft.requestAI('expand', '${idea.id}')">
              <span class="ai-icon">🔍</span> Chi tiết hóa
            </button>
            <button class="ai-action-btn" onclick="Draft.requestAI('critique', '${idea.id}')">
              <span class="ai-icon">🎯</span> Phản biện
            </button>
            <button class="ai-action-btn" onclick="Draft.requestAI('actionplan', '${idea.id}')">
              <span class="ai-icon">📊</span> Action Plan
            </button>
          ` : ''}
        </div>
      </div>
    `;
  },

  renderVersionTabs(idea) {
    if (!idea.drafts || idea.drafts.length <= 1) return '';

    return `
      <div class="draft-versions">
        ${idea.drafts.map((d, i) => `
          <button class="draft-version-tab ${i === this.currentVersion ? 'active' : ''}"
            onclick="Draft.switchVersion(${i})">
            v${d.version} · ${Utils.formatRelative(d.createdAt)}
          </button>
        `).join('')}
      </div>
    `;
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
    return `
      <div class="no-draft">
        <div class="no-draft-icon">🤖</div>
        <h3>Chưa có bản thảo</h3>
        <p>Để AI phát triển ý tưởng này thành bản thảo chi tiết với phân tích SWOT, action plan và nhiều hơn nữa.</p>
        <button class="btn btn-primary" onclick="Capture.generateDraft('${idea.id}')">
          ✨ Tạo bản thảo AI
        </button>
      </div>
    `;
  },

  // ========================
  // ACTIONS
  // ========================

  switchVersion(idx) {
    this.currentVersion = idx;
    const idea = Store.getIdea(this.currentIdeaId);
    if (!idea) return;

    // Update tabs
    document.querySelectorAll('.draft-version-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === idx);
    });

    // Update content
    const contentArea = document.getElementById('draft-content-area');
    if (contentArea) {
      contentArea.innerHTML = this.renderDraftContent(idea);
    }
  },

  toggleEdit() {
    this.isEditing = !this.isEditing;
    const idea = Store.getIdea(this.currentIdeaId);
    if (!idea) return;

    // Update button text
    const btn = document.getElementById('draft-edit-btn');
    if (btn) {
      btn.innerHTML = `${Utils.icon('edit', 16)} ${this.isEditing ? 'Lưu' : 'Sửa'}`;
    }

    if (!this.isEditing) {
      // Save edited content
      const editor = document.getElementById('draft-editor-area');
      if (editor && idea.drafts[this.currentVersion]) {
        idea.drafts[this.currentVersion].content = editor.value;
        Store.updateIdea(this.currentIdeaId, { drafts: idea.drafts });
        Utils.showToast('✅ Đã lưu bản thảo', 'success');
      }
    }

    // Re-render content area
    const contentArea = document.getElementById('draft-content-area');
    if (contentArea) {
      contentArea.innerHTML = this.renderDraftContent(idea);
    }
  },

  exportDraft() {
    const idea = Store.getIdea(this.currentIdeaId);
    if (!idea || !idea.drafts.length) return;

    const draft = idea.drafts[this.currentVersion];
    const content = `# ${idea.title}\n\n` +
      `> ID: ${idea.id} | Category: ${Utils.getCategoryLabel(idea.category)} | Priority: ${Utils.getPriorityLabel(idea.priority)}\n` +
      `> Created: ${Utils.formatDateFull(idea.createdAt)}\n\n` +
      `---\n\n## Ý tưởng gốc\n\n${idea.content || idea.title}\n\n---\n\n## Bản thảo (v${draft.version})\n\n${draft.content}`;

    Utils.downloadFile(content, `${idea.id}-draft-v${draft.version}.md`, 'text/markdown');
    Utils.showToast('📥 Đã export bản thảo', 'success');
  },

  async requestAI(action, ideaId) {
    const idea = Store.getIdea(ideaId);
    if (!idea) return;

    const settings = Store.getSettings();
    if (!settings.geminiApiKey) {
      Utils.showToast('Vui lòng nhập API Key trong Cài đặt', 'error');
      App.navigate('settings');
      return;
    }

    Utils.showToast('🤖 Đang xử lý...', 'info', 5000);

    try {
      const result = await GeminiAI.processAction(action, idea, settings);
      if (result) {
        Store.addDraft(ideaId, result);
        Utils.showToast('✅ Hoàn thành!', 'success');
        // Re-render draft view
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
          mainContent.innerHTML = this.render(ideaId);
        }
      }
    } catch (err) {
      console.error('AI action error:', err);
      Utils.showToast('❌ Lỗi: ' + err.message, 'error');
    }
  },
};
