export function formatDate(date) {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getStatusColor(status) {
  const s = String(status).toLowerCase();
  if (s.includes('pending') || s.includes('awaiting')) return 'pending';
  if (s.includes('accepted') || s.includes('approved')) return 'success';
  if (s.includes('rejected') || s.includes('denied')) return 'error';
  if (s.includes('delivered')) return 'delivered';
  return 'default';
}

export function generateRequestId() {
  return `req-${Date.now()}`;
}

/**
 * Get dynamic payment window (current time + 2 hours)
 * @returns {string} Formatted payment window string
 */
export function getPaymentWindow() {
  const now = new Date();
  
  // Start time = current time
  const start = new Date(now);
  
  // End time = +2 hours
  const end = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  
  // Format function (12-hour with AM/PM)
  function formatTime(date) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }
  
  return `Payment Window: ${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Check if a payment is still valid (within 2 hours of creation)
 * @param {Date|string} createdAt - Order creation time
 * @returns {boolean} True if payment is still valid
 */
export function isPaymentValid(createdAt) {
  const created = new Date(createdAt);
  const now = new Date();
  const diffHours = (now - created) / (1000 * 60 * 60);
  return diffHours <= 2;
}

/**
 * Get remaining time for payment (in minutes)
 * @param {Date|string} createdAt - Order creation time
 * @returns {number} Remaining minutes (0 if expired)
 */
export function getPaymentTimeRemaining(createdAt) {
  const created = new Date(createdAt);
  const expiryTime = new Date(created.getTime() + 2 * 60 * 60 * 1000);
  const now = new Date();
  const diffMs = expiryTime - now;
  
  if (diffMs <= 0) return 0;
  return Math.ceil(diffMs / (1000 * 60)); // Convert to minutes
}

