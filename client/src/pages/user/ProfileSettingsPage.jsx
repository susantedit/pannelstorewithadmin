import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/modals/Modal';
import { Badge } from '../../components/shared/Badge';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { Notif } from '../../utils/notify';
import { SupportFab } from '../../components/shared/SupportFab';

const COMPARISON_PLANS = [
  { duration: '1 Day', price: 'Starter', bestFor: 'Testing the product', reward: 'Fast access', value: 'Low commitment' },
  { duration: '7 Days', price: 'Balanced', bestFor: 'Short-term use', reward: 'Better value', value: 'Popular choice' },
  { duration: '30 Days', price: 'Best Value', bestFor: 'Long-term use', reward: 'Max duration', value: 'Lowest per-day cost' }
];

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    uid: '',
    gameId: '',
    tiktok: '',
    whatsapp: '',
    birthday: '',
    avatarUrl: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.profile?.displayName || user.name || '',
        uid: user.profile?.uid || '',
        gameId: user.profile?.gameId || '',
        tiktok: user.profile?.tiktok || '',
        whatsapp: user.profile?.whatsapp || '',
        birthday: user.profile?.birthday || '',
        avatarUrl: user.profile?.avatarUrl || ''
      });
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await api.getRequests();
        if (mounted && res?.requests) {
          setRequests(res.requests);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateProfile(profileForm);
      Notif.profileSaved();
      window.location.reload();
    } catch (error) {
      Notif.error('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const openInvoice = (request) => {
    setSelectedInvoice(request);
    setInvoiceOpen(true);
  };

  const referralCode = user?.referralCode || '';
  const couponBalance = Number(user?.couponBalance || 0);
  const history = [...requests].sort((a, b) => new Date(b.createdAt || b.updatedAt) - new Date(a.createdAt || a.updatedAt));

  return (
    <div className="app-shell">
      <header className="topbar panel">
        <div className="brand">
          <img src="/logo.png" alt="Logo" style={{ height: '48px', width: '48px', objectFit: 'contain' }} />
          <div>
            <div className="brand-title">Profile Settings</div>
            <div className="brand-subtitle">Save account info, invoices and referral code</div>
          </div>
        </div>
        <div className="topbar-actions">
          <Button variant="ghost" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Profile'}
          </Button>
        </div>
      </header>

      <section className="hero-grid">
        <div className="panel hero-copy">
          <span className="eyebrow"><i className="fas fa-user-gear" /> Account Profile</span>
          <h1>Keep your purchase details ready.</h1>
          <p>
            Save your name, UID, WhatsApp, and game IDs once. Your referral code and coupon balance are shown here too.
          </p>
        </div>

        <aside className="panel side-panel">
          <div className="panel-header">
            <h2>Your Referral</h2>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--line)', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Your unique code</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' }}>
                <strong style={{ color: '#fff', letterSpacing: '1px' }}>{referralCode || 'Loading...'}</strong>
                <button
                  onClick={() => referralCode && navigator.clipboard.writeText(referralCode) && Notif.copied()}
                  style={{ background: 'none', border: '1px solid var(--line)', color: 'var(--text)', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
                >
                  Copy
                </button>
              </div>
            </div>
            <div style={{ padding: '14px', borderRadius: '12px', border: '1px solid rgba(74,222,128,0.2)', background: 'rgba(74,222,128,0.08)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Coupon balance</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#4ade80', marginTop: '6px' }}>Rs {couponBalance.toFixed(0)}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '4px' }}>Applied automatically on your next purchase.</div>
            </div>
          </div>
        </aside>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Profile Details</h2>
            <span>Auto-fills your order form</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <Input label="Display Name" value={profileForm.displayName} onChange={e => setProfileForm(prev => ({ ...prev, displayName: e.target.value }))} />
            <Input label="UID / Player ID" value={profileForm.uid} onChange={e => setProfileForm(prev => ({ ...prev, uid: e.target.value }))} />
            <Input label="Game ID" value={profileForm.gameId} onChange={e => setProfileForm(prev => ({ ...prev, gameId: e.target.value }))} />
            <Input label="WhatsApp" value={profileForm.whatsapp} onChange={e => setProfileForm(prev => ({ ...prev, whatsapp: e.target.value }))} />
            <Input label="TikTok" value={profileForm.tiktok} onChange={e => setProfileForm(prev => ({ ...prev, tiktok: e.target.value }))} />
            <Input label="Birthday (MM-DD)" placeholder="08-24" value={profileForm.birthday} onChange={e => setProfileForm(prev => ({ ...prev, birthday: e.target.value }))} />
            <Input label="Profile Photo URL" placeholder="https://..." value={profileForm.avatarUrl} onChange={e => setProfileForm(prev => ({ ...prev, avatarUrl: e.target.value }))} />
          </div>
          <div style={{ marginTop: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>Back to products</Button>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Package Comparison</h2>
            <span>Before you buy</span>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {COMPARISON_PLANS.map((plan) => (
              <div key={plan.duration} style={{ padding: '14px', border: '1px solid var(--line)', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
                  <strong style={{ color: '#fff' }}>{plan.duration}</strong>
                  <Badge variant="info">{plan.price}</Badge>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
                  <div><strong style={{ color: '#fff' }}>Best for:</strong> {plan.bestFor}</div>
                  <div><strong style={{ color: '#fff' }}>Value:</strong> {plan.value}</div>
                  <div><strong style={{ color: '#fff' }}>Reward:</strong> {plan.reward}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h2>Order History & Invoices</h2>
          <span>{history.length} purchases</span>
        </div>
        {loading ? (
          <p style={{ color: 'var(--muted)' }}>Loading order history...</p>
        ) : history.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No old purchases yet.</p>
        ) : (
          <div className="request-list">
            {history.map((request) => (
              <div key={request.id || request._id} className="request-row">
                <div>
                  <strong>{request.product}</strong>
                  <p>{request.packageName || 'Package not selected'}</p>
                  <p style={{ fontSize: '12px', color: 'var(--muted)' }}>Invoice #{request.id || request._id}</p>
                  {request.couponCode && (
                    <p style={{ fontSize: '12px', color: '#4ade80' }}>
                      Coupon: {request.couponCode} {request.discountAmount ? `(-Rs ${request.discountAmount})` : ''}
                    </p>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Badge variant={getStatusColor(request.status)}>{request.status}</Badge>
                  <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--muted)' }}>{formatDate(request.updatedAt || request.createdAt)}</p>
                  <Button variant="ghost" onClick={() => openInvoice(request)} style={{ marginTop: '8px' }}>
                    View Invoice
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal isOpen={invoiceOpen} onClose={() => setInvoiceOpen(false)} title="Invoice" size="md">
        {selectedInvoice && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {[
              ['Order ID', selectedInvoice.id || selectedInvoice._id],
              ['Product', selectedInvoice.product],
              ['Package', selectedInvoice.packageName || '—'],
              ['Base Price', selectedInvoice.packagePrice ? `Rs ${selectedInvoice.packagePrice}` : '—'],
              ['Coupon Code', selectedInvoice.couponCode || '—'],
              ['Discount', selectedInvoice.discountAmount ? `Rs ${selectedInvoice.discountAmount}` : 'Rs 0'],
              ['Final Price', selectedInvoice.finalPrice ? `Rs ${selectedInvoice.finalPrice}` : `Rs ${selectedInvoice.packagePrice || '0'}`],
              ['Status', selectedInvoice.status],
              ['Transaction', selectedInvoice.transaction || '—'],
              ['Created', formatDate(selectedInvoice.createdAt || selectedInvoice.updatedAt)]
            ].map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>{label}</span>
                <strong style={{ color: '#fff', textAlign: 'right' }}>{value}</strong>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <SupportFab />
    </div>
  );
}
