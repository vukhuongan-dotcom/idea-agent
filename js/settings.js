/* ========================================
   IDEA AGENT — Settings Module
   Theme, API key, preferences
   ======================================== */

var Settings = {
  render() {
    const settings = Store.getSettings();

    return `
      <div class="page-header">
        <h1>⚙️ Cài đặt</h1>
      </div>

      <div class="settings-section animate-slide-up">
        <h2>🎨 Giao diện</h2>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Dark Mode</div>
            <div class="settings-row-desc">Chế độ tối cho mắt thoải mái hơn</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="settings-theme"
              ${settings.theme === 'dark' ? 'checked' : ''}
              onchange="Settings.toggleTheme(this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div class="settings-section animate-slide-up" style="animation-delay: 0.05s">
        <h2>🤖 Gemini AI</h2>

        <div class="settings-row" style="padding: var(--space-md); background: var(--bg-tertiary); border-radius: var(--radius-lg); margin-bottom: var(--space-md)">
          <div style="flex: 1">
            <div class="settings-row-label" style="font-size: 1rem">
              ${GoogleAuth.isSignedIn ? '🟢 Đã kết nối Google' : '🔴 Chưa kết nối'}
            </div>
            <div class="settings-row-desc">
              ${GoogleAuth.isSignedIn && GoogleAuth.userInfo
                ? `Đăng nhập: <strong>${Utils.escapeHtml(GoogleAuth.userInfo.email)}</strong><br>AI sử dụng tài khoản Google của bạn (không cần API Key)`
                : 'Đăng nhập Google để sử dụng AI — không cần API Key'}
            </div>
          </div>
          <div>
            ${GoogleAuth.isSignedIn
              ? '<button class="btn btn-secondary" onclick="GoogleAuth.signOut()">Đăng xuất</button>'
              : `<button class="btn btn-primary" onclick="GoogleAuth.signIn()" style="display: flex; align-items: center; gap: 8px">
                  <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                  Đăng nhập Google
                </button>`}
          </div>
        </div>

        <details style="margin-bottom: var(--space-md)">
          <summary style="cursor: pointer; font-size: 0.85rem; color: var(--text-muted); padding: var(--space-xs) 0">
            🔑 API Key (phương án dự phòng)
          </summary>
          <div style="margin-top: var(--space-sm)">
            <div class="settings-row-desc" style="margin-bottom: var(--space-xs)">Nếu không muốn đăng nhập Google, có thể dùng API Key từ <a href="https://aistudio.google.com/apikey" target="_blank" style="color: var(--primary)">Google AI Studio</a></div>
            <div style="display: flex; gap: var(--space-sm)">
              <input type="password" class="form-input" id="settings-api-key"
                value="${settings.geminiApiKey || ''}"
                placeholder="AIza...">
              <button class="btn btn-secondary" onclick="Settings.toggleApiKeyVisibility()">👁️</button>
              <button class="btn btn-primary" onclick="Settings.saveApiKey()">Lưu</button>
            </div>
          </div>
        </details>

        <div class="settings-row" style="margin-top: var(--space-sm)">
          <div>
            <div class="settings-row-label">Model</div>
            <div class="settings-row-desc">Model AI sử dụng để tạo bản thảo</div>
          </div>
          <select class="form-select" id="settings-model" style="width: 220px"
            onchange="Settings.saveModel(this.value)">
            <option value="gemini-2.5-flash" ${settings.geminiModel === 'gemini-2.5-flash' ? 'selected' : ''}>Gemini 2.5 Flash</option>
            <option value="gemini-2.5-pro" ${settings.geminiModel === 'gemini-2.5-pro' ? 'selected' : ''}>Gemini 2.5 Pro</option>
            <option value="gemini-2.0-flash" ${settings.geminiModel === 'gemini-2.0-flash' ? 'selected' : ''}>Gemini 2.0 Flash</option>
          </select>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Auto Draft</div>
            <div class="settings-row-desc">Tự động tạo bản thảo AI khi lưu ý tưởng mới</div>
          </div>
          <label class="toggle-switch">
            <input type="checkbox" id="settings-auto-draft"
              ${settings.autoGenerateDraft ? 'checked' : ''}
              onchange="Settings.toggleAutoDraft(this.checked)">
            <span class="toggle-slider"></span>
          </label>
        </div>
        <div style="margin-top: var(--space-md)">
          <button class="btn btn-secondary btn-sm" onclick="Settings.testConnection()">
            🧪 Test kết nối AI
          </button>
        </div>
      </div>

      <div class="settings-section animate-slide-up" style="animation-delay: 0.1s">
        <h2>📝 Mặc định</h2>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Danh mục mặc định</div>
            <div class="settings-row-desc">Danh mục tự động chọn khi tạo ý tưởng mới</div>
          </div>
          <select class="form-select" id="settings-default-cat" style="width: 180px"
            onchange="Settings.saveDefaultCategory(this.value)">
            ${Object.entries(Utils.categories).map(([k, v]) =>
              `<option value="${k}" ${settings.defaultCategory === k ? 'selected' : ''}>${v.icon} ${v.label}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <div class="settings-section animate-slide-up" style="animation-delay: 0.15s">
        <h2>💾 Dữ liệu</h2>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Export tất cả dữ liệu</div>
            <div class="settings-row-desc">Tải xuống file JSON chứa toàn bộ ý tưởng và bản thảo</div>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="Settings.exportAll()">
            ${Utils.icon('export', 16)} Export JSON
          </button>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label">Import dữ liệu</div>
            <div class="settings-row-desc">Nhập dữ liệu từ file JSON đã export trước đó</div>
          </div>
          <div>
            <input type="file" id="import-file" accept=".json" style="display: none"
              onchange="Settings.importFile(this.files[0])">
            <button class="btn btn-secondary btn-sm" onclick="document.getElementById('import-file').click()">
              📥 Import JSON
            </button>
          </div>
        </div>
        <div class="settings-row">
          <div>
            <div class="settings-row-label" style="color: var(--danger)">Xóa toàn bộ dữ liệu</div>
            <div class="settings-row-desc">Xóa tất cả ý tưởng và bản thảo. Hành động này không thể hoàn tác!</div>
          </div>
          <button class="btn btn-danger btn-sm" onclick="Settings.clearAll()">
            ${Utils.icon('delete', 16)} Xóa tất cả
          </button>
        </div>
      </div>

      <div class="settings-section animate-slide-up" style="animation-delay: 0.2s">
        <h2>ℹ️ Thông tin</h2>
        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.8">
          <strong>Idea Agent</strong> v1.0<br>
          Hệ thống ghi nhận & phát triển ý tưởng<br>
          Powered by Gemini AI · Built with ❤️ for BS. Vũ Khương An<br>
          <span style="color: var(--text-muted)">Dữ liệu lưu trữ tại localStorage trên trình duyệt này</span>
        </div>
      </div>
    `;
  },

  // ========================
  // THEME
  // ========================

  toggleTheme(isDark) {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    Store.updateSettings({ theme });
    App.updateThemeIcon();
  },

  // ========================
  // GEMINI API
  // ========================

  saveApiKey() {
    const input = document.getElementById('settings-api-key');
    if (!input) return;
    const key = input.value.trim();
    Store.updateSettings({ geminiApiKey: key });
    Utils.showToast(key ? '✅ API Key đã lưu' : '⚠️ API Key đã xóa', key ? 'success' : 'info');
  },

  toggleApiKeyVisibility() {
    const input = document.getElementById('settings-api-key');
    if (input) {
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  },

  saveModel(model) {
    Store.updateSettings({ geminiModel: model });
    Utils.showToast(`Model: ${model}`, 'info');
  },

  async testConnection() {
    const settings = Store.getSettings();
    const hasToken = GoogleAuth.isSignedIn && GoogleAuth.getToken();
    const hasApiKey = settings.geminiApiKey;

    if (!hasToken && !hasApiKey) {
      Utils.showToast('Vui lòng đăng nhập Google hoặc nhập API Key', 'error');
      return;
    }

    Utils.showToast('🧪 Đang kiểm tra kết nối AI...', 'info');

    try {
      const result = await GeminiAI.callGemini('Trả lời ngắn gọn: Xin chào, bạn là AI model nào?', settings);
      Utils.showToast('✅ Kết nối thành công! ' + result.substring(0, 80), 'success');
    } catch (err) {
      Utils.showToast('❌ Lỗi: ' + err.message, 'error');
    }
  },

  toggleAutoDraft(enabled) {
    Store.updateSettings({ autoGenerateDraft: enabled });
    Utils.showToast(enabled ? '✅ Auto Draft bật' : '⚠️ Auto Draft tắt', enabled ? 'success' : 'info');
  },

  // ========================
  // DEFAULT CATEGORY
  // ========================

  saveDefaultCategory(cat) {
    Store.updateSettings({ defaultCategory: cat });
    Utils.showToast(`Danh mục mặc định: ${Utils.getCategoryLabel(cat)}`, 'info');
  },

  // ========================
  // DATA MANAGEMENT
  // ========================

  exportAll() {
    const data = Store.exportData();
    const date = new Date().toISOString().split('T')[0];
    Utils.downloadFile(data, `idea-agent-backup-${date}.json`, 'application/json');
    Utils.showToast('📥 Đã export dữ liệu', 'success');
  },

  importFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const success = Store.importData(e.target.result);
      if (success) {
        Utils.showToast('✅ Import thành công! Tải lại trang...', 'success');
        setTimeout(() => location.reload(), 1500);
      } else {
        Utils.showToast('❌ File không hợp lệ', 'error');
      }
    };
    reader.readAsText(file);
  },

  clearAll() {
    if (confirm('⚠️ XÓA TOÀN BỘ dữ liệu?\n\nHành động này KHÔNG THỂ hoàn tác!\nHãy Export backup trước.')) {
      if (confirm('Xác nhận lần cuối: XÓA TẤT CẢ ý tưởng và bản thảo?')) {
        Store.clearAll();
        Utils.showToast('🗑️ Đã xóa toàn bộ dữ liệu', 'info');
        setTimeout(() => location.reload(), 1000);
      }
    }
  },
};
