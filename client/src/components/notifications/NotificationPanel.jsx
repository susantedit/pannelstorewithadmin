import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { Button } from '../shared/Button';

// FA icon per type — no emojis
const NOTIFICATION_ICONS = {
  info:    'fa-circle-info',
  success: 'fa-circle-check',
  warning: 'fa-triangle-exclamation',
  error:   'fa-circle-xmark',
  key:     'fa-key',
  xp:      'fa-star',
};

const NOTIFICATION_COLORS = {
  info:    { bg: 'rgba(96,165,250,0.08)',  border: 'rgba(96,165,250,0.25)',  text: '#60a5fa' },
  success: { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.25)',  text: '#4ade80' },
  warning: { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.25)',  text: '#f59e0b' },
  error:   { bg: 'rgba(230,57,70,0.08)',   border: 'rgba(230,57,70,0.3)',    text: '#ff6b6b' },
  key:     { bg: 'rgba(251,191,36,0.08)',  border: 'rgba(251,191,36,0.3)',   text: '#fbbf24' },
  xp:      { bg: 'rgba(167,139,250,0.08)', border: 'rgba(167,139,250,0.25)', text: '#a78bfa' },
};

export default function NotificationPanel({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadNotifications(1);
    }
  }, [isOpen]);

  const loadNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const res = await api.getNotifications({ page: pageNum, limit: 20 });
      if (res?.ok) {
        if (pageNum === 1) {
          setNotifications(res.notifications || []);
        } else {
          setNotifications(prev => [...prev, ...(res.notifications || [])]);
        }
        setUnreadCount(res.unreadCount || 0);
        setHasMore(pageNum < (res.pages || 1));
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationIds) => {
    try {
      const res = await api.markNotificationsRead(notificationIds);
      if (res?.ok) {
        setNotifications(prev => 
          prev.map(n => 
            notificationIds.includes(n._id) 
              ? { ...n, read: true, readAt: new Date().toISOString() }
              : n
          )
        );
        setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const res = await api.markAllNotificationsRead();
      if (res?.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true, readAt: new Date().toISOString() })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleNotificationClick = async (notification) => {
    // Track click on server
    try {
      await api.request(`/api/notifications/${notification._id}/click`, { method: 'PATCH' });
    } catch {}

    // Mark read locally
    if (!notification.read) {
      setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, read: true, clicked: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Deep link redirect
    const link = notification.deepLink || '/dashboard';
    onClose();
    if (link.startsWith('http')) {
      window.open(link, '_blank');
    } else {
      navigate(link);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="notification-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="notification-panel"
        style={{
          background: 'rgba(22,22,22,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '80vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>
              🔔 Notifications
            </h2>
            {unreadCount > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Mark all read
              </Button>
            )}
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--muted)',
                fontSize: '1.2rem',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: notifications.length === 0 ? '40px 24px' : '0'
        }}>
          {loading && notifications.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
              Loading notifications...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '16px', color: '#333' }}>
                <i className="fas fa-bell-slash" />
              </div>
              <h3 style={{ margin: '0 0 8px', fontSize: '1.1rem', color: '#fff' }}>No notifications yet</h3>
              <p style={{ margin: 0, fontSize: '0.9rem' }}>
                You will receive notifications when your requests are processed or when you earn XP.
              </p>
            </div>
          ) : (
            <div>
              <AnimatePresence>
                {notifications.map((notification, index) => {
                  const colors = NOTIFICATION_COLORS[notification.type] || NOTIFICATION_COLORS.info;
                  const icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.info;
                  
                  return (
                    <motion.div
                      key={notification._id}
                      className="notification-item"
                      style={{
                        padding: '16px 24px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: notification.read ? 'transparent' : 'rgba(255,255,255,0.02)',
                        borderLeft: notification.read ? 'none' : `3px solid ${colors.text}`
                      }}
                      onClick={() => handleNotificationClick(notification)}
                      whileHover={{ background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: colors.bg,
                          border: `1px solid ${colors.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          flexShrink: 0
                        }}>
                          <i className={`fas ${icon}`} style={{ color: colors.text }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <h4 style={{
                              margin: 0,
                              fontSize: '0.9rem',
                              fontWeight: 600,
                              color: notification.read ? 'var(--muted)' : '#fff'
                            }}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: colors.text,
                                flexShrink: 0
                              }} />
                            )}
                          </div>
                          <p style={{
                            margin: '0 0 8px',
                            fontSize: '0.85rem',
                            color: 'var(--muted)',
                            lineHeight: 1.4
                          }}>
                            {notification.message}
                          </p>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            fontSize: '0.75rem',
                            color: 'var(--muted)'
                          }}>
                            <span>{formatDate(notification.createdAt)}</span>
                            {notification.fromAdmin && (
                              <span style={{
                                background: 'rgba(230,57,70,0.15)',
                                border: '1px solid rgba(230,57,70,0.3)',
                                color: 'var(--primary)',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                fontWeight: 600
                              }}>
                                ADMIN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Load More */}
              {hasMore && (
                <div style={{ padding: '16px 24px', textAlign: 'center' }}>
                  <Button
                    variant="ghost"
                    onClick={() => loadNotifications(page + 1)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}