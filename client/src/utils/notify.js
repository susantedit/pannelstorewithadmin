/**
 * Zomato/Swiggy-style notification system
 * — Rich cards: logo + colored bar + title + message + time + action
 * — Stacked top-right, slide in from right, auto-dismiss with progress bar
 * — Browser push notifications
 */

// ─────────────────────────────────────────────────────────────────────────────
// Type configs
// ─────────────────────────────────────────────────────────────────────────────

const TYPES = {
  success: { color: '#4ade80', bg: 'rgba(74,222,128,0.12)', border: 'rgba(74,222,128,0.3)', emoji: '✅' },
  error:   { color: '#ff6b6b', bg: 'rgba(230,57,70,0.12)',  border: 'rgba(230,57,70,0.35)',  emoji: '❌' },
  warning: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)',  emoji: '⚠️' },
  info:    { color: '#60a5fa', bg: 'rgba(96,165,250,0.12)', border: 'rgba(96,165,250,0.3)',  emoji: '💬' },
  key:     { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', border: 'rgba(251,191,36,0.35)', emoji: '🔑' },
  submitted:{ color: '#a78bfa',bg: 'rgba(167,139,250,0.12)',border: 'rgba(167,139,250,0.3)', emoji: '📤' },
  rejected: { color: '#f87171',bg: 'rgba(248,113,113,0.12)',border: 'rgba(248,113,113,0.3)', emoji: '🚫' },
  xp:      { color: '#c084fc', bg: 'rgba(192,132,252,0.12)',border: 'rgba(192,132,252,0.3)', emoji: '🎯' },
};

// ─────────────────────────────────────────────────────────────────────────────
// DOM setup
// ─────────────────────────────────────────────────────────────────────────────

let _container = null;
let _styleInjected = false;

function getContainer() {
  if (_container && document.body.contains(_container)) return _container;
  _container = document.createElement('div');
  _container.id = 'notif-root';
  _container.style.cssText = [
    'position:fixed',
    'top:16px',
    'right:16px',
    'z-index:99999',
    'display:flex',
    'flex-direction:column',
    'gap:10px',
    'pointer-events:none',
    'width:360px',
    'max-width:calc(100vw - 24px)',
  ].join(';');
  document.body.appendChild(_container);
  return _container;
}

function injectStyles() {
  if (_styleInjected || document.getElementById('notif-styles')) return;
  _styleInjected = true;
  const s = document.createElement('style');
  s.id = 'notif-styles';
  s.textContent = `
    @keyframes notifSlideIn {
      from { opacity:0; transform:translateX(calc(100% + 20px)); }
      to   { opacity:1; transform:translateX(0); }
    }
    @keyframes notifSlideOut {
      from { opacity:1; transform:translateX(0); max-height:120px; margin-bottom:0; }
      to   { opacity:0; transform:translateX(calc(100% + 20px)); max-height:0; margin-bottom:-10px; }
    }
    @keyframes notifProgress {
      from { width:100%; }
      to   { width:0%; }
    }
    .notif-card {
      pointer-events:auto;
      background:#1a1a1a;
      border-radius:14px;
      overflow:hidden;
      box-shadow:0 4px 24px rgba(0,0,0,0.6), 0 1px 4px rgba(0,0,0,0.4);
      animation:notifSlideIn 0.38s cubic-bezier(0.22,1,0.36,1) forwards;
      font-family:'Rajdhani',Inter,system-ui,sans-serif;
      position:relative;
      border:1px solid rgba(255,255,255,0.08);
    }
    .notif-card.removing {
      animation:notifSlideOut 0.3s ease forwards;
    }
    .notif-left-bar {
      position:absolute;
      left:0; top:0; bottom:0;
      width:4px;
      border-radius:14px 0 0 14px;
    }
    .notif-header {
      display:flex;
      align-items:center;
      gap:8px;
      padding:10px 12px 6px 16px;
    }
    .notif-app-logo {
      width:20px;
      height:20px;
      border-radius:5px;
      object-fit:contain;
      flex-shrink:0;
    }
    .notif-app-name {
      font-size:0.7rem;
      font-weight:700;
      letter-spacing:1.5px;
      text-transform:uppercase;
      color:#666;
      flex:1;
    }
    .notif-time {
      font-size:0.68rem;
      color:#555;
    }
    .notif-close-btn {
      background:none;
      border:none;
      color:#555;
      cursor:pointer;
      font-size:0.9rem;
      line-height:1;
      padding:2px 4px;
      border-radius:4px;
      transition:color 0.15s;
      flex-shrink:0;
    }
    .notif-close-btn:hover { color:#ccc; }
    .notif-body {
      display:flex;
      align-items:flex-start;
      gap:10px;
      padding:0 12px 10px 16px;
    }
    .notif-emoji {
      font-size:1.5rem;
      line-height:1;
      flex-shrink:0;
      margin-top:1px;
    }
    .notif-text { flex:1; min-width:0; }
    .notif-title {
      font-size:0.9rem;
      font-weight:700;
      color:#fff;
      margin:0 0 3px;
      line-height:1.3;
    }
    .notif-message {
      font-size:0.82rem;
      color:#999;
      margin:0;
      line-height:1.5;
      word-break:break-word;
    }
    .notif-action {
      display:inline-block;
      margin-top:8px;
      padding:4px 12px;
      border-radius:6px;
      font-size:0.75rem;
      font-weight:700;
      letter-spacing:0.5px;
      cursor:pointer;
      border:none;
      transition:opacity 0.15s;
    }
    .notif-action:hover { opacity:0.85; }
    .notif-progress {
      height:3px;
      animation:notifProgress linear forwards;
    }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core: showNotification
// ─────────────────────────────────────────────────────────────────────────────

let _notifCount = 0;

export function showNotification(title, message, type = 'info', duration = 5500, options = {}) {
  injectStyles();
  const container = getContainer();
  const cfg = TYPES[type] || TYPES.info;

  // Cap at 5 stacked notifications
  const existing = container.querySelectorAll('.notif-card:not(.removing)');
  if (existing.length >= 5) existing[0].querySelector('.notif-close-btn')?.click();

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

  const card = document.createElement('div');
  card.className = 'notif-card';

  const actionHtml = options.actionLabel
    ? `<button class="notif-action" style="background:${cfg.color};color:#000;">${options.actionLabel}</button>`
    : '';

  card.innerHTML = `
    <div class="notif-left-bar" style="background:${cfg.color};"></div>
    <div class="notif-header">
      <img class="notif-app-logo" src="/logo.png" alt="logo" onerror="this.style.display='none'" />
      <span class="notif-app-name">SUSANTEDIT</span>
      <span class="notif-time">${timeStr}</span>
      <button class="notif-close-btn" aria-label="Dismiss">✕</button>
    </div>
    <div class="notif-body">
      <span class="notif-emoji">${cfg.emoji}</span>
      <div class="notif-text">
        <p class="notif-title">${title}</p>
        ${message ? `<p class="notif-message">${message}</p>` : ''}
        ${actionHtml}
      </div>
    </div>
    ${duration > 0 ? `<div class="notif-progress" style="background:${cfg.color};animation-duration:${duration}ms"></div>` : ''}
  `;

  const remove = () => {
    if (card.classList.contains('removing')) return;
    card.classList.add('removing');
    setTimeout(() => card.remove(), 320);
  };

  card.querySelector('.notif-close-btn').addEventListener('click', remove);

  if (options.actionLabel && options.onAction) {
    card.querySelector('.notif-action')?.addEventListener('click', () => {
      options.onAction();
      remove();
    });
  }

  container.appendChild(card);
  if (duration > 0) setTimeout(remove, duration);
  return remove;
}

// ─────────────────────────────────────────────────────────────────────────────
// Simple toast (no title, just message)
// ─────────────────────────────────────────────────────────────────────────────

export function showToast(message, type = 'info', duration = 3500) {
  return showNotification(message, '', type, duration);
}

// ─────────────────────────────────────────────────────────────────────────────
// Browser push notifications
// ─────────────────────────────────────────────────────────────────────────────

export async function requestNotificationPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export function sendBrowserNotification(title, body, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: options.tag || 'susantedit',
    requireInteraction: options.requireInteraction || false,
  });
  if (!options.requireInteraction) setTimeout(() => n.close(), 7000);
  return n;
}

export function notify(title, body, type = 'info', options = {}) {
  showNotification(title, body, type, options.duration || 5500, options);
  sendBrowserNotification(title, body, options);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built presets
// ─────────────────────────────────────────────────────────────────────────────

export const Notif = {
  requestSubmitted: (productName) =>
    showNotification(
      '📤 Order Placed!',
      `Your order for <strong style="color:#fff">${productName}</strong> is under review. We'll notify you once it's approved.`,
      'submitted', 6000
    ),

  keyDelivered: (productName) =>
    showNotification(
      '🔑 Key Delivered!',
      `Your <strong style="color:#fff">${productName}</strong> key is ready. Tap to open your requests and copy it.`,
      'key', 0
    ),

  requestRejected: (productName) =>
    showNotification(
      '🚫 Order Rejected',
      `Your order for <strong style="color:#fff">${productName}</strong> was rejected. Contact support if this is a mistake.`,
      'rejected', 8000
    ),

  profileSaved: () =>
    showNotification('✅ Profile Saved', 'Your details will auto-fill next time you order.', 'success', 3500),

  copied: () =>
    showToast('📋 Copied to clipboard', 'success', 2000),

  adminApproved: (userName, product) =>
    showNotification(
      '✅ Request Approved',
      `<strong style="color:#fff">${userName}</strong>'s order for ${product} approved and key delivered.`,
      'success', 4000
    ),

  adminRejected: (userName) =>
    showNotification('🚫 Request Rejected', `${userName}'s request has been rejected.`, 'warning', 4000),

  adminRevoked: () =>
    showNotification('↩️ Approval Revoked', 'Request reset to Awaiting Review. Key cleared.', 'warning', 4000),

  settingsSaved: () =>
    showNotification('✅ Settings Saved', 'All changes have been applied.', 'success', 3000),

  error: (msg) =>
    showNotification('❌ Something went wrong', msg || 'An unexpected error occurred. Please try again.', 'error', 6000),

  statusChanged: (status) => {
    const map = {
      'Accepted':        { title: '✅ Request Accepted',  type: 'success'   },
      'Rejected':        { title: '🚫 Request Rejected',  type: 'rejected'  },
      'Awaiting review': { title: '🔍 Under Review',       type: 'info'      },
      'Pending payment': { title: '⏳ Pending Payment',    type: 'warning'   },
    };
    const cfg = map[status] || { title: `Status: ${status}`, type: 'info' };
    return showNotification(cfg.title, `Order status updated to "${status}"`, cfg.type, 4500);
  },

  // Common contextual toasts (Zomato/Swiggy style)
  orderOnWay: (product) =>
    showNotification('🚀 Order Processing', `Your ${product} order is being processed by our team!`, 'info', 5000),

  xpGained: (amount) =>
    showNotification('🎯 XP Gained!', `You earned <strong style="color:#c084fc">+${amount} XP</strong>. Keep going!`, 'xp', 4000),

  walletCredit: (amount) =>
    showNotification('💰 Wallet Credited', `Rs ${amount} has been added to your wallet balance.`, 'success', 5000),

  streakBonus: (days) =>
    showNotification('🔥 Streak Bonus!', `${days}-day streak! Keep checking in daily for bigger rewards.`, 'warning', 5000),

  showNotification, // expose raw for custom use
};
