/* ========================================
   IDEA AGENT — Google Auth Module
   OAuth2 with Google Identity Services
   ======================================== */

var GoogleAuth = {
  CLIENT_ID: '505465715428-qk2pv6elhjblf316j6gbumr5fd9pptcl.apps.googleusercontent.com',
  SCOPES: 'https://www.googleapis.com/auth/generative-language https://www.googleapis.com/auth/cloud-platform',

  tokenClient: null,
  accessToken: null,
  userInfo: null,
  isSignedIn: false,

  // Initialize GIS token client
  init() {
    // Wait for GIS library to load
    if (typeof google === 'undefined' || !google.accounts) {
      console.log('⏳ Waiting for Google Identity Services...');
      setTimeout(() => this.init(), 500);
      return;
    }

    this.tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: this.CLIENT_ID,
      scope: this.SCOPES,
      callback: (response) => this.handleTokenResponse(response),
      error_callback: (err) => this.handleTokenError(err),
    });

    // Check if we have a saved token
    const savedToken = sessionStorage.getItem('idea-agent-token');
    const savedExpiry = sessionStorage.getItem('idea-agent-token-expiry');
    if (savedToken && savedExpiry && Date.now() < parseInt(savedExpiry)) {
      this.accessToken = savedToken;
      this.isSignedIn = true;
      this.fetchUserInfo(savedToken);
    }

    console.log('🔐 Google Auth initialized');
  },

  // Sign in
  signIn() {
    if (!this.tokenClient) {
      Utils.showToast('Google Auth chưa sẵn sàng, thử lại...', 'error');
      this.init();
      return;
    }

    // Request access token
    if (this.accessToken) {
      // Already have token, request with prompt: ''  to skip consent
      this.tokenClient.requestAccessToken({ prompt: '' });
    } else {
      this.tokenClient.requestAccessToken({ prompt: 'consent' });
    }
  },

  // Sign out
  signOut() {
    if (this.accessToken) {
      google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log('Token revoked');
      });
    }

    this.accessToken = null;
    this.userInfo = null;
    this.isSignedIn = false;
    sessionStorage.removeItem('idea-agent-token');
    sessionStorage.removeItem('idea-agent-token-expiry');

    Utils.showToast('👋 Đã đăng xuất', 'info');
    this.updateUI();
    App.renderCurrentPage();
  },

  // Handle token response
  handleTokenResponse(response) {
    if (response.error) {
      console.error('Auth error:', response.error);
      Utils.showToast('❌ Lỗi xác thực: ' + response.error, 'error');
      return;
    }

    this.accessToken = response.access_token;
    this.isSignedIn = true;

    // Save token with expiry (usually 1 hour)
    const expiryMs = Date.now() + (response.expires_in * 1000);
    sessionStorage.setItem('idea-agent-token', response.access_token);
    sessionStorage.setItem('idea-agent-token-expiry', expiryMs.toString());

    // Fetch user info
    this.fetchUserInfo(response.access_token);

    Utils.showToast('✅ Đăng nhập Google thành công!', 'success');
    this.updateUI();
    App.renderCurrentPage();
  },

  // Handle token error
  handleTokenError(err) {
    console.error('Token error:', err);
    if (err.type === 'popup_closed') {
      Utils.showToast('Đã đóng popup đăng nhập', 'info');
    } else {
      Utils.showToast('❌ Lỗi: ' + (err.message || err.type), 'error');
    }
  },

  // Fetch user info from Google
  async fetchUserInfo(token) {
    try {
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        this.userInfo = await res.json();
        this.updateUI();
      }
    } catch (e) {
      console.warn('Could not fetch user info:', e);
    }
  },

  // Get current access token (auto-refresh if expired)
  getToken() {
    const expiry = sessionStorage.getItem('idea-agent-token-expiry');
    if (this.accessToken && expiry && Date.now() < parseInt(expiry)) {
      return this.accessToken;
    }

    // Token expired
    this.accessToken = null;
    this.isSignedIn = false;
    return null;
  },

  // Refresh token silently
  refreshToken() {
    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Auth not initialized'));
        return;
      }

      // Override callback temporarily
      const originalCallback = this.tokenClient.callback;
      this.tokenClient.requestAccessToken({
        prompt: '',
        callback: (response) => {
          this.handleTokenResponse(response);
          resolve(response.access_token);
        },
        error_callback: (err) => {
          reject(err);
        }
      });
    });
  },

  // Update UI elements
  updateUI() {
    // Update sidebar user display
    const userArea = document.getElementById('sidebar-user');
    if (userArea) {
      if (this.isSignedIn && this.userInfo) {
        userArea.innerHTML = `
          <div class="user-info">
            <img src="${this.userInfo.picture || ''}" alt="" class="user-avatar" onerror="this.style.display='none'">
            <div class="user-details">
              <div class="user-name">${Utils.escapeHtml(this.userInfo.name || 'Google User')}</div>
              <div class="user-email">${Utils.escapeHtml(this.userInfo.email || '')}</div>
            </div>
          </div>
        `;
      } else {
        userArea.innerHTML = `
          <button class="google-signin-btn" onclick="GoogleAuth.signIn()">
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Đăng nhập Google
          </button>
        `;
      }
    }

    // Update AI status badge
    const aiBadge = document.getElementById('ai-status-badge');
    if (aiBadge) {
      aiBadge.className = `ai-status ${this.isSignedIn ? 'connected' : 'disconnected'}`;
      aiBadge.textContent = this.isSignedIn ? '🟢 AI Ready' : '🔴 Chưa đăng nhập';
    }
  },
};
