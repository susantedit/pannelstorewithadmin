const baseUrl = import.meta.env.VITE_API_URL || '';

// Lazily import Firebase token to avoid circular deps
function getAuthHeader() {
  try {
    // Dynamic import to avoid circular dependency
    const token = window.__firebaseToken;
    if (token) return { 'Authorization': `Bearer ${token}` };
  } catch {}
  return {};
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {})
    },
    ...options
  });

  const raw = await response.text();
  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { ok: response.ok, message: raw };
    }
  }

  if (!data) {
    data = {
      ok: response.ok,
      message: response.ok ? 'No content' : `HTTP ${response.status}`
    };
  }

  if (!response.ok && data.ok === undefined) {
    data.ok = false;
  }

  return data;
}

export const api = {
  request,
  ping: () => request('/api/ping', { method: 'POST', body: JSON.stringify({ source: 'client' }) }),
  getProducts: () => request('/api/products'),
  createProduct: (payload) => request('/api/products', { method: 'POST', body: JSON.stringify(payload) }),
  updateProduct: (id, payload) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteProduct: (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
  getRequests: (scope = 'mine') => request(`/api/requests?scope=${encodeURIComponent(scope)}`),
  // Legacy JWT auth (kept for fallback / admin seeding)
  login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
  me: () => request('/api/auth/me'),
  register: (payload) => request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  forgotPassword: (email) => request('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (payload) => request('/api/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  // Firebase auth — exchange Firebase ID token for a session cookie
  firebaseSession: (idToken, name) => request('/api/auth/firebase', { method: 'POST', body: JSON.stringify({ idToken, name }) }),
  updateRequestStatus: (id, payload) => request(`/api/requests/${id}/status`, { method: 'PATCH', body: JSON.stringify(payload) }),
  revokeRequest: (id) => request(`/api/requests/${id}/revoke`, { method: 'PATCH' }),
  // Profile
  updateProfile: (payload) => request('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(payload) }),
  // Coupons
  listCoupons: () => request('/api/coupons'),
  createCoupon: (payload) => request('/api/coupons', { method: 'POST', body: JSON.stringify(payload) }),
  updateCoupon: (id, payload) => request(`/api/coupons/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  deleteCoupon: (id) => request(`/api/coupons/${id}`, { method: 'DELETE' }),
  // App settings
  getSettings: () => request('/api/settings'),
  updateSettings: (payload) => request('/api/settings', { method: 'PATCH', body: JSON.stringify(payload) }),
  // Admin management
  listAdmins: () => request('/api/admin/list'),
  demoteAdmin: (email) => request('/api/admin/demote', { method: 'PATCH', body: JSON.stringify({ email }) }),
  // Referral
  getReferralCode: () => request('/api/referral/my-code'),
  getReferralStats: () => request('/api/referral/stats'),
  getReferralLeaderboard: () => request('/api/referral/leaderboard'),
  applyReferralCode: (code) => request('/api/referral/apply', { method: 'POST', body: JSON.stringify({ code }) }),
  // Hype & Flash Sales
  getHype: () => request('/api/hype'),
  getFlashSales: () => request('/api/flash-sales'),
  createFlashSale: (payload) => request('/api/flash-sale', { method: 'POST', body: JSON.stringify(payload) }),
  // Analytics
  getAnalytics: () => request('/api/admin/analytics'),
  // Gamification
  getGamificationProfile: () => request('/api/gamification/profile'),
  dailyCheckIn: () => request('/api/gamification/checkin', { method: 'POST' }),
  dailySpin: () => request('/api/gamification/spin', { method: 'POST' }),
  birthdayCheck: () => request('/api/gamification/birthday-check', { method: 'POST' }),
  // Admin reactivation
  reactivateUsers: (days) => request('/api/admin/reactivate', { method: 'POST', body: JSON.stringify({ days }) }),
  // Ban system
  banUser: (userId, reason) => request('/api/admin/ban', { method: 'POST', body: JSON.stringify({ userId, reason }) }),
  unbanUser: (userId) => request('/api/admin/unban', { method: 'POST', body: JSON.stringify({ userId }) }),
  // Delete order
  deleteRequest: (id) => request(`/api/requests/${id}`, { method: 'DELETE' }),
  // Order chat
  getOrderMessages: (id) => request(`/api/requests/${id}/messages`),
  sendOrderMessage: (id, text) => request(`/api/requests/${id}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),
  // VIP Subscription
  getVipStatus: () => request('/api/vip/status'),
  requestVip: (payload) => request('/api/vip/request', { method: 'POST', body: JSON.stringify(payload) }),
  grantVip: (userId, months) => request('/api/vip/grant', { method: 'POST', body: JSON.stringify({ userId, months }) }),
  // Admin user management
  listUsers: (params = {}) => request(`/api/admin/users?${new URLSearchParams(params)}`),
  // AI Chat proxy
  aiChat: (messages, system) => request('/api/ai/chat', { method: 'POST', body: JSON.stringify({ messages, system }) }),
  // Gifts
  sendGift: (payload) => request('/api/gifts/send', { method: 'POST', body: JSON.stringify(payload) }),
  getSentGifts: () => request('/api/gifts/sent'),
  
  // Notifications
  getNotifications: (params = {}) => request(`/api/notifications?${new URLSearchParams(params)}`),
  markNotificationsRead: (notificationIds) => request('/api/notifications/read', { method: 'PATCH', body: JSON.stringify({ notificationIds }) }),
  markAllNotificationsRead: () => request('/api/notifications/read-all', { method: 'PATCH' }),
  trackNotificationClick: (id) => request(`/api/notifications/${id}/click`, { method: 'PATCH' }),
  
  // Admin notifications
  sendCustomNotification: (payload) => request('/api/admin/notifications/send', { method: 'POST', body: JSON.stringify(payload) }),
  getNotificationStats: () => request('/api/admin/notifications/stats'),
};
