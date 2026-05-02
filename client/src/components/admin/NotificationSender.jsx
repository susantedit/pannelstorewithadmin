import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { showToast } from '../../utils/notify';

const TYPE_OPTIONS = [
  { value: 'info',    label: 'Info',    color: '#60a5fa' },
  { value: 'success', label: 'Success', color: '#4ade80' },
  { value: 'warning', label: 'Warning', color: '#f59e0b' },
  { value: 'error',   label: 'Error',   color: '#ff6b6b' },
];

const TONE_OPTIONS = [
  { value: 'info',    label: 'Neutral',  color: '#60a5fa' },
  { value: 'reward',  label: 'Reward',   color: '#4ade80' },
  { value: 'elite',   label: 'Elite',    color: '#a78bfa' },
  { value: 'fomo',    label: 'FOMO',     color: '#f59e0b' },
  { value: 'urgency', label: 'Urgency',  color: '#fb923c' },
  { value: 'roast',   label: 'Roast',    color: '#ff6b6b' },
  { value: 'funny',   label: 'Funny',    color: '#fbbf24' },
];

const SEGMENT_OPTIONS = [
  { value: 'all',          label: 'All Users' },
  { value: 'inactive',     label: 'Inactive (48h+)' },
  { value: 'new',          label: 'New Users' },
  { value: 'elite',        label: 'Elite (500+ XP)' },
  { value: 'vip',          label: 'VIP Members' },
  { value: 'high_spender', label: 'High Spenders (Rs 1000+)' },
  { value: 'regular',      label: 'Regular Users' },
];

const DEEP_LINK_OPTIONS = [
  { value: '/dashboard',         label: 'Dashboard' },
  { value: '/dashboard#store',   label: 'Store / Products' },
  { value: '/dashboard#squad',   label: 'Squad / Referral' },
];

export default function NotificationSender() {
  const [form, setForm] = useState({
    targetType:     'all',
    targetSegment:  'all',
    targetUserId:   '',
    targetUserEmail:'',
    title:          '',
    message:        '',
    type:           'info',
    tone:           'info',
    deepLink:       '/dashboard',
    scheduleMode:   'now',
    sendAt:         '',
  });
  const [users, setUsers]       = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [loading, setLoading]   = useState(false);
  const [sending, setSending]   = useState(false);
  const [stats, setStats]       = useState(null);
  const [tab, setTab]           = useState('send'); // 'send' | 'analytics'

  useEffect(() => { loadStats(); }, []);

  useEffect(() => {
    if (form.targetType === 'specific' && userSearch.length >= 2) {
      const t = setTimeout(() => searchUsers(userSearch), 300);
      return () => clearTimeout(t);
    }
  }, [userSearch, form.targetType]);

  const loadStats = async () => {
    try {
      const res = await api.getNotificationStats();
      if (res?.ok) setStats(res.stats);
    } catch {}
  };

  const searchUsers = async (query) => {
    setLoading(true);
    try {
      const res = await api.listUsers({ search: query, limit: 10 });
      if (res?.ok) setUsers(res.users || []);
    } catch {} finally { setLoading(false); }
  };

  const set = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'targetType') {
      setForm(prev => ({ ...prev, targetUserId: '', targetUserEmail: '', [field]: value }));
      setUsers([]); setUserSearch('');
    }
  };

  const selectUser = (user) => {
    setForm(prev => ({ ...prev, targetUserId: user._id, targetUserEmail: user.email }));
    setUserSearch(`${user.name} (${user.email})`);
    setUsers([]);
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      showToast('Title and message are required', 'error'); return;
    }
    if (form.targetType === 'specific' && !form.targetUserId) {
      showToast('Please select a user', 'error'); return;
    }
    if (form.scheduleMode === 'later' && !form.sendAt) {
      showToast('Please pick a send time', 'error'); return;
    }

    setSending(true);
    try {
      let res;
      const payload = {
        title:          form.title.trim(),
        message:        form.message.trim(),
        type:           form.type,
        tone:           form.tone,
        deepLink:       form.deepLink,
        targetType:     form.targetType === 'segment' ? 'segment' : form.targetType,
        targetSegment:  form.targetType === 'segment' ? form.targetSegment : undefined,
        targetUserId:   form.targetType === 'specific' ? form.targetUserId : undefined,
      };

      if (form.scheduleMode === 'later') {
        res = await api.request('/api/admin/notifications/schedule', {
          method: 'POST',
          body: JSON.stringify({ ...payload, sendAt: new Date(form.sendAt).toISOString() }),
        });
      } else {
        res = await api.sendCustomNotification(payload);
      }

      if (res?.ok) {
        showToast(res.message || 'Done', 'success');
        setForm({ targetType: 'all', targetSegment: 'all', targetUserId: '', targetUserEmail: '', title: '', message: '', type: 'info', tone: 'info', deepLink: '/dashboard', scheduleMode: 'now', sendAt: '' });
        setUserSearch('');
        loadStats();
      } else {
        showToast(res?.message || 'Failed', 'error');
      }
    } catch { showToast('Request failed', 'error'); }
    finally { setSending(false); }
  };

  const selectedType = TYPE_OPTIONS.find(t => t.value === form.type) || TYPE_OPTIONS[0];

  return (
    <div className="panel">
      <div className="panel-header">
        <h2><i className="fas fa-bullhorn" style={{ color: 'var(--primary)', marginRight: '8px' }} />Notifications</h2>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
        {[['send', 'Send'], ['analytics', 'Analytics']].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: 'none', background: tab === v ? 'rgba(230,57,70,0.2)' : 'transparent', color: tab === v ? 'var(--primary)' : 'var(--muted)', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', transition: 'all 0.15s' }}>
            {l}
          </button>
        ))}
      </div>

      {/* ── SEND TAB ── */}
      {tab === 'send' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Target */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Send To</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[['all', 'All Users'], ['segment', 'By Segment'], ['specific', 'Specific User']].map(([v, l]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', color: form.targetType === v ? '#fff' : 'var(--muted)', padding: '6px 12px', borderRadius: '8px', border: `1px solid ${form.targetType === v ? 'rgba(230,57,70,0.5)' : 'rgba(255,255,255,0.08)'}`, background: form.targetType === v ? 'rgba(230,57,70,0.1)' : 'transparent', transition: 'all 0.15s' }}>
                  <input type="radio" name="targetType" value={v} checked={form.targetType === v} onChange={() => set('targetType', v)} style={{ display: 'none' }} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          {/* Segment picker */}
          {form.targetType === 'segment' && (
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Segment</label>
              <select value={form.targetSegment} onChange={e => set('targetSegment', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', colorScheme: 'dark' }}>
                {SEGMENT_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          )}

          {/* User search */}
          {form.targetType === 'specific' && (
            <div style={{ position: 'relative' }}>
              <Input placeholder="Search by name or email..." value={userSearch} onChange={e => setUserSearch(e.target.value)} />
              {(users.length > 0 || loading) && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#161616', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', marginTop: '4px', maxHeight: '180px', overflow: 'auto', zIndex: 20 }}>
                  {loading && <div style={{ padding: '12px', fontSize: '0.82rem', color: 'var(--muted)', textAlign: 'center' }}>Searching...</div>}
                  {users.map(u => (
                    <div key={u._id} onClick={() => selectUser(u)} style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontWeight: 600, color: '#fff', fontSize: '0.85rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{u.email}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Type */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Type</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {TYPE_OPTIONS.map(t => (
                <button key={t.value} onClick={() => set('type', t.value)}
                  style={{ padding: '5px 12px', borderRadius: '7px', border: `1px solid ${form.type === t.value ? t.color : 'rgba(255,255,255,0.08)'}`, background: form.type === t.value ? `${t.color}18` : 'transparent', color: form.type === t.value ? t.color : 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tone */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
              Tone <span style={{ fontSize: '0.7rem', color: 'var(--muted)', fontWeight: 400 }}>— affects targeting rules (roast blocked for new users)</span>
            </label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {TONE_OPTIONS.map(t => (
                <button key={t.value} onClick={() => set('tone', t.value)}
                  style={{ padding: '5px 12px', borderRadius: '7px', border: `1px solid ${form.tone === t.value ? t.color : 'rgba(255,255,255,0.08)'}`, background: form.tone === t.value ? `${t.color}18` : 'transparent', color: form.tone === t.value ? t.color : 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deep link */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Opens</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {DEEP_LINK_OPTIONS.map(d => (
                <button key={d.value} onClick={() => set('deepLink', d.value)}
                  style={{ padding: '5px 12px', borderRadius: '7px', border: `1px solid ${form.deepLink === d.value ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.08)'}`, background: form.deepLink === d.value ? 'rgba(96,165,250,0.1)' : 'transparent', color: form.deepLink === d.value ? '#60a5fa' : 'var(--muted)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <Input label="Title" placeholder="Notification title..." value={form.title} onChange={e => set('title', e.target.value)} maxLength={100} />

          {/* Message */}
          <div>
            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>Message</label>
            <textarea placeholder="Notification message..." value={form.message} onChange={e => set('message', e.target.value)} maxLength={500} rows={3}
              style={{ width: '100%', padding: '10px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', resize: 'vertical', fontFamily: 'inherit' }} />
            <div style={{ fontSize: '0.7rem', color: 'var(--muted)', marginTop: '3px' }}>{form.message.length}/500</div>
          </div>

          {/* Schedule */}
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>When</label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              {[['now', 'Send Now'], ['later', 'Schedule']].map(([v, l]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem', color: form.scheduleMode === v ? '#fff' : 'var(--muted)', padding: '6px 14px', borderRadius: '8px', border: `1px solid ${form.scheduleMode === v ? 'rgba(230,57,70,0.5)' : 'rgba(255,255,255,0.08)'}`, background: form.scheduleMode === v ? 'rgba(230,57,70,0.1)' : 'transparent', transition: 'all 0.15s' }}>
                  <input type="radio" name="scheduleMode" value={v} checked={form.scheduleMode === v} onChange={() => set('scheduleMode', v)} style={{ display: 'none' }} />
                  {l}
                </label>
              ))}
            </div>
            {form.scheduleMode === 'later' && (
              <input type="datetime-local" value={form.sendAt} onChange={e => set('sendAt', e.target.value)}
                min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                style={{ padding: '9px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', width: '100%', colorScheme: 'dark' }} />
            )}
          </div>

          {/* Preview */}
          {(form.title || form.message) && (
            <div style={{ padding: '12px 14px', background: `${selectedType.color}08`, border: `1px solid ${selectedType.color}25`, borderRadius: '10px', borderLeft: `3px solid ${selectedType.color}` }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginBottom: '5px', letterSpacing: '1px', textTransform: 'uppercase' }}>Preview</div>
              {form.title && <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.88rem', marginBottom: '3px' }}>{form.title}</div>}
              {form.message && <div style={{ fontSize: '0.8rem', color: '#888' }}>{form.message}</div>}
              <div style={{ marginTop: '6px', fontSize: '0.68rem', color: 'var(--muted)' }}>
                Tone: <span style={{ color: TONE_OPTIONS.find(t => t.value === form.tone)?.color || '#fff' }}>{form.tone}</span>
                &nbsp;·&nbsp; Opens: {form.deepLink}
              </div>
            </div>
          )}

          <Button variant="primary" onClick={handleSend} disabled={sending || !form.title.trim() || !form.message.trim()} style={{ alignSelf: 'flex-start' }}>
            <i className={`fas ${form.scheduleMode === 'later' ? 'fa-clock' : 'fa-paper-plane'}`} />
            {sending ? 'Sending...' : form.scheduleMode === 'later' ? 'Schedule' : `Send ${form.targetType === 'all' ? 'Broadcast' : form.targetType === 'segment' ? `to ${form.targetSegment}` : 'to User'}`}
          </Button>
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {tab === 'analytics' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stats ? (
            <>
              {/* Top stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                {[
                  { label: 'Total Sent',  value: stats.total,     color: '#60a5fa' },
                  { label: 'Unread',      value: stats.unread,    color: '#f59e0b' },
                  { label: 'Open Rate',   value: `${stats.openRate}%`,  color: '#4ade80' },
                  { label: 'Click Rate',  value: `${stats.clickRate}%`, color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '12px', background: `${s.color}10`, border: `1px solid ${s.color}25`, borderRadius: '10px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* By tone */}
              {stats.byTone?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Performance by Tone</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stats.byTone.map(t => {
                      const toneColor = TONE_OPTIONS.find(o => o.value === t.tone)?.color || '#60a5fa';
                      return (
                        <div key={t.tone} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: toneColor, flexShrink: 0 }} />
                          <div style={{ flex: 1, fontSize: '0.82rem', color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{t.tone}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{t.count} sent</div>
                          <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>{t.openRate}% open</div>
                          <div style={{ fontSize: '0.75rem', color: '#a78bfa' }}>{t.clickRate}% click</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Recent */}
              {stats.recent?.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Recent</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stats.recent.map(n => (
                      <div key={n._id} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{n.title}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--muted)' }}>{n.userId?.name || 'User'}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{n.message?.slice(0, 80)}{n.message?.length > 80 ? '...' : ''}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px', fontSize: '0.68rem' }}>
                          <span style={{ color: n.opened ? '#4ade80' : '#555' }}>{n.opened ? 'Opened' : 'Not opened'}</span>
                          <span style={{ color: n.clicked ? '#a78bfa' : '#555' }}>{n.clicked ? 'Clicked' : 'Not clicked'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="ghost" onClick={loadStats} style={{ alignSelf: 'flex-start', fontSize: '0.8rem' }}>
                <i className="fas fa-rotate" /> Refresh
              </Button>
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '40px' }}>Loading analytics...</div>
          )}
        </div>
      )}
    </div>
  );
}
