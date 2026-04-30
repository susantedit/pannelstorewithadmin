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
