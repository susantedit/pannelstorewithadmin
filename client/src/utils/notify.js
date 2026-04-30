/**
 * Professional notification system
 * — In-app popups (title + body + icon + progress bar)
 * — Browser push notifications
 * — Stacked, animated, dismissible
 */

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const TYPES = {
  success: {
    color:  '#4ade80',
    bg:     'rgba(74,222,128,0.08)',
    border: 'rgba(74,222,128,0.25)',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4ade80" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
  },
  error: {
    color:  '#ff6b6b',
    bg:     'rgba(230,57,70,0.08)',
    border: 'rgba(230,57,70,0.3)',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`
  },
  warning: {
    color:  '#f59e0b',
    bg:     'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  },
  info: {
    color:  '#60a5fa',
    bg:     'rgba(96,165,250,0.08)',
    border: 'rgba(96,165,250,0.25)',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
  },
  key: {
    color:  '#fbbf24',
    bg:     'rgba(251,191,36,0.08)',
    border: 'rgba(251,191,36,0.3)',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" stroke-width="2.5" stroke-linecap="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`
  },
  submitted: {
    color:  '#a78bfa',
    bg:     'rgba(167,139,250,0.08)',
    border: 'rgba(167,139,250,0.25)',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`
  },
  rejected: {
    color:  '#f87171',
    bg:     'rgba(248,113,113,0.08)',
    border: 'rgba(248,113,113,0.25)',
    icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`
  }
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
    'top:20px',
    'right:20px',
    'z-index:99999',
    'display:flex',
    'flex-direction:column',
    'gap:10px',
    'pointer-events:none',
    'width:360px',
    'max-width:calc(100vw - 32px)'
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
    @keyframes notifIn {
      from { opacity:0; transform:translateX(110%) scale(0.92); }
      to   { opacity:1; transform:translateX(0)   scale(1);    }
    }
    @keyframes notifOut {
      from { opacity:1; transform:translateX(0)    scale(1);    max-height:200px; margin-bottom:0; }
      to   { opacity:0; transform:translateX(110%) scale(0.92); max-height:0;     margin-bottom:-10px; }
    }
    @keyframes notifProgress {
      from { width:100%; }
      to   { width:0%;   }
    }
    .notif-card {
      pointer-events:auto;
      background:#161616;
      border-radius:14px;
      overflow:hidden;
      box-shadow:0 8px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4);
      animation:notifIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
      font-family:'Rajdhani',Inter,system-ui,sans-serif;
      position:relative;
      cursor:default;
    }
    .notif-card.removing {
      animation:notifOut 0.35s ease forwards;
    }
    .notif-inner {
      display:flex;
      align-items:flex-start;
      gap:12px;
      padding:14px 16px 16px;
    }
    .notif-icon-wrap {
      width:36px;
      height:36px;
      border-radius:10px;
      display:flex;
      align-items:center;
      justify-content:center;
      flex-shrink:0;
      margin-top:1px;
    }
    .notif-body { flex:1; min-width:0; }
    .notif-title {
      font-size:0.92rem;
      font-weight:700;
      color:#fff;
      margin:0 0 3px;
      letter-spacing:0.2px;
      line-height:1.3;
    }
    .notif-message {
      font-size:0.85rem;
      color:#aaa;
      margin:0;
      line-height:1.5;
      word-break:break-word;
    }
    .notif-close {
      background:none;
      border:none;
      color:#555;
      cursor:pointer;
      font-size:1.1rem;
      line-height:1;
      padding:2px 4px;
      border-radius:4px;
      flex-shrink:0;
      transition:color 0.15s;
      margin-top:-2px;
    }
    .notif-close:hover { color:#fff; }
    .notif-progress {
      height:3px;
      border-radius:0 0 14px 14px;
      animation:notifProgress linear forwards;
    }
    .notif-border-top {
      height:3px;
      border-radius:14px 14px 0 0;
    }
  `;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────────────────
// Core showToast
// ─────────────────────────────────────────────────────────────────────────────

export function showToast(message, type = 'info', duration = 4500) {
  injectStyles();
  const container = getContainer();
  const cfg = TYPES[type] || TYPES.info;

  const card = document.createElement('div');
  card.className = 'notif-card';
  card.style.border = `1px solid ${cfg.border}`;

  card.innerHTML = `
    <div class="notif-border-top" style="background:${cfg.color};opacity:0.6"></div>
    <div class="notif-inner">
      <div class="notif-icon-wrap" style="background:${cfg.bg};border:1px solid ${cfg.border}">
        ${cfg.icon}
      </div>
      <div class="notif-body">
        <p class="notif-message">${message}</p>
      </div>
      <button class="notif-close" aria-label="Dismiss">✕</button>
    </div>
    ${duration > 0 ? `<div class="notif-progress" style="background:${cfg.color};animation-duration:${duration}ms"></div>` : ''}
  `;

  const remove = () => {
    if (card.classList.contains('removing')) return;
    card.classList.add('removing');
    setTimeout(() => card.remove(), 360);
  };

  card.querySelector('.notif-close').addEventListener('click', remove);
  container.appendChild(card);
  if (duration > 0) setTimeout(remove, duration);
  return remove;
}

// ─────────────────────────────────────────────────────────────────────────────
// showNotification — title + body (richer)
// ─────────────────────────────────────────────────────────────────────────────

export function showNotification(title, message, type = 'info', duration = 5500) {
  injectStyles();
  const container = getContainer();
  const cfg = TYPES[type] || TYPES.info;

  const card = document.createElement('div');
  card.className = 'notif-card';
  card.style.border = `1px solid ${cfg.border}`;

  card.innerHTML = `
    <div class="notif-border-top" style="background:${cfg.color};opacity:0.7"></div>
    <div class="notif-inner">
      <div class="notif-icon-wrap" style="background:${cfg.bg};border:1px solid ${cfg.border}">
        ${cfg.icon}
      </div>
      <div class="notif-body">
        <p class="notif-title">${title}</p>
        ${message ? `<p class="notif-message">${message}</p>` : ''}
      </div>
      <button class="notif-close" aria-label="Dismiss">✕</button>
    </div>
    ${duration > 0 ? `<div class="notif-progress" style="background:${cfg.color};animation-duration:${duration}ms"></div>` : ''}
  `;

  const remove = () => {
    if (card.classList.contains('removing')) return;
    card.classList.add('removing');
    setTimeout(() => card.remove(), 360);
  };

  card.querySelector('.notif-close').addEventListener('click', remove);
  container.appendChild(card);
  if (duration > 0) setTimeout(remove, duration);
  return remove;
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

// ─────────────────────────────────────────────────────────────────────────────
// Combined helper — in-app + browser push
// ─────────────────────────────────────────────────────────────────────────────

export function notify(title, body, type = 'info', options = {}) {
  showNotification(title, body, type, options.duration || 5500);
  sendBrowserNotification(title, body, options);
}

// ─────────────────────────────────────────────────────────────────────────────
// Pre-built notification presets
// ─────────────────────────────────────────────────────────────────────────────

export const Notif = {
  requestSubmitted: (productName) =>
    showNotification(
      'Request Submitted',
      `Your order for <strong style="color:#fff">${productName}</strong> is under review. You'll be notified when it's approved.`,
      'submitted',
      6000
    ),

  keyDelivered: (productName, key) =>
    showNotification(
      '🔑 Key Delivered!',
      `Your <strong style="color:#fff">${productName}</strong> key is ready. Check your requests panel to copy it.`,
      'key',
      0 // stays until dismissed
    ),

  requestRejected: (productName) =>
    showNotification(
      'Request Rejected',
      `Your order for <strong style="color:#fff">${productName}</strong> was rejected. Contact support if you believe this is an error.`,
      'rejected',
      8000
    ),

  profileSaved: () =>
    showNotification('Profile Saved', 'Your details will auto-fill the purchase form next time.', 'success', 3500),

  copied: () =>
    showToast('Copied to clipboard', 'success', 2000),

  adminApproved: (userName, product) =>
    showNotification(
      'Request Approved',
      `<strong style="color:#fff">${userName}</strong>'s order for ${product} has been approved and key delivered.`,
      'success',
      4000
    ),

  adminRejected: (userName) =>
    showNotification('Request Rejected', `${userName}'s request has been rejected.`, 'warning', 4000),

  adminRevoked: () =>
    showNotification('Approval Revoked', 'Request reset to Awaiting Review. Key has been cleared.', 'warning', 4000),

  settingsSaved: () =>
    showNotification('Settings Saved', 'All changes have been applied to the app.', 'success', 3000),

  error: (msg) =>
    showNotification('Something went wrong', msg || 'An unexpected error occurred. Please try again.', 'error', 6000),

  statusChanged: (status) => {
    const map = {
      'Accepted':       { title: 'Request Accepted',   type: 'success'  },
      'Rejected':       { title: 'Request Rejected',   type: 'rejected' },
      'Awaiting review':{ title: 'Under Review',        type: 'info'     },
      'Pending payment':{ title: 'Pending Payment',     type: 'warning'  },
    };
    const cfg = map[status] || { title: `Status: ${status}`, type: 'info' };
    return showNotification(cfg.title, `Order status updated to "${status}"`, cfg.type, 4500);
  }
};
