import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { showToast } from '../../utils/notify';

export default function NotificationSender() {
  const [form, setForm] = useState({
    targetType: 'all', // 'all' or 'specific'
    targetUserId: '',
    targetUserEmail: '',
    title: '',
    message: '',
    type: 'info'
  });
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    if (form.targetType === 'specific' && userSearch.length >= 2) {
      const timer = setTimeout(() => searchUsers(userSearch), 300);
      return () => clearTimeout(timer);
    }
  }, [userSearch, form.targetType]);

  const loadStats = async () => {
    try {
      const res = await api.getNotificationStats();
      if (res?.ok) {
        setStats(res.stats);
      }
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  const searchUsers = async (query) => {
    setLoading(true);
    try {
      const res = await api.listUsers({ search: query, limit: 10 });
      if (res?.ok) {
        setUsers(res.users || []);
      }
    } catch (error) {
      console.error('Failed to search users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Clear user selection when switching target types
    if (field === 'targetType') {
      setForm(prev => ({ ...prev, targetUserId: '', targetUserEmail: '' }));
      setUsers([]);
      setUserSearch('');
    }
  };

  const selectUser = (user) => {
    setForm(prev => ({
      ...prev,
      targetUserId: user._id,
      targetUserEmail: user.email
    }));
    setUserSearch(user.name + ' (' + user.email + ')');
    setUsers([]);
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      showToast('Title and message are required', 'error');
      return;
    }

    if (form.targetType === 'specific' && !form.targetUserId) {
      showToast('Please select a user', 'error');
      return;
    }

    setSending(true);
    try {
      const payload = {
        targetType: form.targetType,
        targetUserId: form.targetType === 'specific' ? form.targetUserId : undefined,
        title: form.title.trim(),
        message: form.message.trim(),
        type: form.type
      };

      const res = await api.sendCustomNotification(payload);
      if (res?.ok) {
        showToast(res.message || 'Notification sent successfully!', 'success');
        // Reset form
        setForm({
          targetType: 'all',
          targetUserId: '',
          targetUserEmail: '',
          title: '',
          message: '',
          type: 'info'
        });
        setUserSearch('');
        loadStats(); // Refresh stats
      } else {
        showToast(res?.message || 'Failed to send notification', 'error');
      }
    } catch (error) {
      showToast('Failed to send notification', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>📢 Send Custom Notification</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
          Send notifications to specific users or broadcast to everyone
        </span>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '12px',
            background: 'rgba(96,165,250,0.08)',
            border: '1px solid rgba(96,165,250,0.25)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#60a5fa' }}>
              {stats.total}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Total Sent</div>
          </div>
          <div style={{
            padding: '12px',
            background: 'rgba(245,158,11,0.08)',
            border: '1px solid rgba(245,158,11,0.25)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f59e0b' }}>
              {stats.unread}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Unread</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Target Type */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
            Send To
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="targetType"
                value="all"
                checked={form.targetType === 'all'}
                onChange={(e) => handleFormChange('targetType', e.target.value)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#fff' }}>All Users (Broadcast)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                name="targetType"
                value="specific"
                checked={form.targetType === 'specific'}
                onChange={(e) => handleFormChange('targetType', e.target.value)}
                style={{ accentColor: 'var(--primary)' }}
              />
              <span style={{ fontSize: '0.9rem', color: '#fff' }}>Specific User</span>
            </label>
          </div>
        </div>

        {/* User Search (if specific) */}
        {form.targetType === 'specific' && (
          <div style={{ position: 'relative' }}>
            <Input
              placeholder="Search user by name or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
            {users.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: 'rgba(22,22,22,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                marginTop: '4px',
                maxHeight: '200px',
                overflow: 'auto',
                zIndex: 10
              }}>
                {users.map(user => (
                  <div
                    key={user._id}
                    onClick={() => selectUser(user)}
                    style={{
                      padding: '12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.05)'}
                    onMouseLeave={(e) => e.target.style.background = 'transparent'}
                  >
                    <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>
                      {user.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      {user.email}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {loading && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                padding: '12px',
                textAlign: 'center',
                fontSize: '0.85rem',
                color: 'var(--muted)'
              }}>
                Searching...
              </div>
            )}
          </div>
        )}

        {/* Notification Type */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
            Type
          </label>
          <select
            value={form.type}
            onChange={(e) => handleFormChange('type', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
          >
            <option value="info">💬 Info</option>
            <option value="success">✅ Success</option>
            <option value="warning">⚠️ Warning</option>
            <option value="error">❌ Error</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
            Title
          </label>
          <Input
            placeholder="Notification title..."
            value={form.title}
            onChange={(e) => handleFormChange('title', e.target.value)}
            maxLength={100}
          />
        </div>

        {/* Message */}
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
            Message
          </label>
          <textarea
            placeholder="Notification message..."
            value={form.message}
            onChange={(e) => handleFormChange('message', e.target.value)}
            maxLength={500}
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '0.9rem',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
          />
          <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '4px' }}>
            {form.message.length}/500 characters
          </div>
        </div>

        {/* Preview */}
        {(form.title || form.message) && (
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
              Preview
            </label>
            <div style={{
              padding: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px'
            }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.2rem' }}>
                  {form.type === 'info' && '💬'}
                  {form.type === 'success' && '✅'}
                  {form.type === 'warning' && '⚠️'}
                  {form.type === 'error' && '❌'}
                </span>
                <div>
                  {form.title && (
                    <div style={{ fontWeight: 600, color: '#fff', marginBottom: '4px' }}>
                      {form.title}
                    </div>
                  )}
                  {form.message && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                      {form.message}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Send Button */}
        <Button
          variant="primary"
          onClick={handleSend}
          disabled={sending || !form.title.trim() || !form.message.trim()}
          style={{ alignSelf: 'flex-start' }}
        >
          {sending ? 'Sending...' : `📢 Send ${form.targetType === 'all' ? 'Broadcast' : 'to User'}`}
        </Button>
      </div>
    </div>
  );
}