/* ========================================
   IDEA AGENT — Google Auth Module
   OAuth2 with Google Identity Services
   ======================================== */

var GoogleAuth = {
  CLIENT_ID: '505465715428-qk2pv6elhjblf316j6gbumr5fd9pptcl.apps.googleusercontent.com',
  SCOPES: 'openid profile email',

  tokenClient: null,
  accessToken: null,
  userInfo: null,
  isSignedIn: false,

  // Initialize GIS token client
  init() {
    // Wait for GIS library to load
    if (typeof google === 'undefined' || !google.accounts) {
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
      google.accounts.oauth2.revoke(this.accessToken, () => {});
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

  // Update UI elements
  updateUI() {
    const userArea = document.getElementById('sidebar-user');
    if (userArea) {
      if (this.isSignedIn && this.userInfo) {
        userArea.innerHTML = `<div class="user-info"><img src="${this.userInfo.picture || ''}" alt="" class="user-avatar" onerror="this.style.display='none'"><div class="user-details"><div class="user-name">${Utils.escapeHtml(this.userInfo.name || 'Google User')}</div><div class="user-email">${Utils.escapeHtml(this.userInfo.email || '')}</div></div></div>`;
      } else {
        userArea.innerHTML = `<button class="google-signin-btn" onclick="GoogleAuth.signIn()"><svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" fill="currentColor"/></svg> Đăng nhập Google</button>`;
      }
    }

    if (typeof App !== 'undefined' && App.updateAIStatusBadge) {
      App.updateAIStatusBadge();
    }
  },
};
