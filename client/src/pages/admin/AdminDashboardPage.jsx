import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/modals/Modal';
import { Badge } from '../../components/shared/Badge';
import { Table } from '../../components/shared/Table';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { showToast, Notif } from '../../utils/notify';
import { SupportFab } from '../../components/shared/SupportFab';

// ── VIP Manager sub-component ─────────────────────────────────────────────
function VipManager() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [grantMsg, setGrantMsg] = useState('');
  const [grantingId, setGrantingId] = useState(null);

  const loadUsers = async (q = '') => {
    setLoading(true);
    try {
      const res = await api.listUsers({ search: q, limit: 20 });
      if (res?.ok) setUsers(res.users || []);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    clearTimeout(window._vipSearchTimer);
    window._vipSearchTimer = setTimeout(() => loadUsers(e.target.value), 400);
  };

  const handleGrant = async (userId, months = 1) => {
    setGrantingId(userId);
    setGrantMsg('');
    try {
      const res = await api.grantVip(userId, months);
      if (res?.ok) {
        setGrantMsg(`✅ VIP granted until ${new Date(res.vipExpiresAt).toLocaleDateString()}`);
        loadUsers(search);
      } else {
        setGrantMsg(`❌ ${res?.message || 'Failed'}`);
      }
    } catch { setGrantMsg('❌ Network error'); }
    finally { setGrantingId(null); }
  };

  return (
    <div className="panel" style={{ marginTop: '16px' }}>
      <div className="panel-header">
        <h2>⭐ VIP Subscription Manager</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Grant ad-free access after payment</span>
      </div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
        When a user pays Rs 199 for VIP, find them here and click "Grant 1 Month". Their ads will disappear immediately.
      </p>
      {grantMsg && (
        <div style={{ marginBottom: '12px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.85rem',
          background: grantMsg.startsWith('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(230,57,70,0.1)',
          border: `1px solid ${grantMsg.startsWith('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(230,57,70,0.3)'}`,
          color: grantMsg.startsWith('✅') ? '#4ade80' : '#ff6b6b'
        }}>
          {grantMsg}
        </div>
      )}
      <input
        value={search}
        onChange={handleSearch}
        placeholder="Search by name or email..."
        style={{
          width: '100%', padding: '9px 12px', borderRadius: '8px', marginBottom: '12px',
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'var(--text)', fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box'
        }}
      />
      {loading ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading users...</p>
      ) : users.length === 0 ? (
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No users found.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {users.map(u => {
            const isVip = u.vipExpiresAt && new Date(u.vipExpiresAt) > new Date();
            return (
              <div key={u._id} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 12px', borderRadius: '8px',
                background: isVip ? 'rgba(251,191,36,0.06)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${isVip ? 'rgba(251,191,36,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isVip && <span style={{ color: '#fbbf24' }}>⭐</span>}
                    {u.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{u.email}</div>
                  {isVip && (
                    <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: '2px' }}>
                      VIP until {new Date(u.vipExpiresAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleGrant(u._id, 1)}
                    disabled={grantingId === u._id}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                      background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.3)',
                      color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700,
                      opacity: grantingId === u._id ? 0.5 : 1
                    }}
                  >
                    {grantingId === u._id ? '...' : '⭐ +1 Month'}
                  </button>
                  <button
                    onClick={() => handleGrant(u._id, 3)}
                    disabled={grantingId === u._id}
                    style={{
                      padding: '6px 12px', borderRadius: '6px', cursor: 'pointer',
                      background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)',
                      color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700,
                      opacity: grantingId === u._id ? 0.5 : 1
                    }}
                  >
                    +3 Months
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const TABS = [
  { id: 'dashboard',  icon: 'fa-chart-line',   label: 'Dashboard' },
  { id: 'requests',   icon: 'fa-inbox',         label: 'Requests'  },
  { id: 'products',   icon: 'fa-gamepad',        label: 'Products'  },
  { id: 'users',      icon: 'fa-users',          label: 'Users'     },
  { id: 'coupons',    icon: 'fa-ticket-alt',     label: 'Coupons'   },
  { id: 'analytics',  icon: 'fa-chart-bar',      label: 'Analytics' },
  { id: 'settings',   icon: 'fa-cog',            label: 'Settings'  },
];

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Data
  const [requests, setRequests]   = useState([]);
  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);

  // Request modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsOpen, setDetailsOpen]         = useState(false);
  const [messageInput, setMessageInput]       = useState('');
  const [filter, setFilter]                   = useState('all');
  const [searchTerm, setSearchTerm]           = useState('');

  // Product modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct]     = useState(null);
  const [productForm, setProductForm]           = useState({ name:'', category:'', price:'', status:'Available', description:'', img:'' });
  const [productPackagesText, setProductPackagesText] = useState('');
  const [productError, setProductError]         = useState('');

  // User promote
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteMsg, setPromoteMsg]     = useState('');
  const [promoteLoading, setPromoteLoading] = useState(false);

  // App settings
  const [settingsForm, setSettingsForm] = useState({
    appName: '', appTagline: '', announcement: '', paymentWindow: '',
    contactWhatsApp: '', contactTelegram: '', qrEsewa: '', qrBank: '',
    labels: { fullName: '', tiktok: '', whatsapp: '', transaction: '' }
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMsg, setSettingsMsg] = useState('');

  // Coupons
  const [coupons, setCoupons] = useState([]);
  const [couponEditing, setCouponEditing] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    ownerEmail: '',
    discountKind: 'flat',
    discountValue: 30,
    rewardAmount: 30,
    usageLimit: 0,
    active: true,
    startsAt: '',
    endsAt: '',
    note: '',
    type: 'promo'
  });
  const [couponSaving, setCouponSaving] = useState(false);
  const [couponMsg, setCouponMsg] = useState('');

  // Admin list
  const [admins, setAdmins] = useState([]);

  // Analytics
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) { navigate('/dashboard'); return; }
    loadRequests();
    loadProducts();
  }, [isAdmin, navigate]);

  // Load settings when settings tab opens
  useEffect(() => {
    if (activeTab === 'settings') {
      api.getSettings().then(res => {
        if (res?.settings) setSettingsForm({
          appName: res.settings.appName || '',
          appTagline: res.settings.appTagline || '',
          announcement: res.settings.announcement || '',
          paymentWindow: res.settings.paymentWindow || '',
          contactWhatsApp: res.settings.contactWhatsApp || '',
          contactTelegram: res.settings.contactTelegram || '',
          qrEsewa: res.settings.qrEsewa || '',
          qrBank:  res.settings.qrBank  || '',
          labels: {
            fullName:    res.settings.labels?.fullName    || '',
            tiktok:      res.settings.labels?.tiktok      || '',
            whatsapp:    res.settings.labels?.whatsapp    || '',
            transaction: res.settings.labels?.transaction || ''
          }
        });
      });
    }
    if (activeTab === 'users') {
      api.listAdmins().then(res => setAdmins(res?.admins || []));
    }
    if (activeTab === 'coupons') {
      api.listCoupons().then(res => setCoupons(res?.coupons || [])).catch(() => setCoupons([]));
    }
    if (activeTab === 'analytics') {
      setAnalyticsLoading(true);
      api.getAnalytics().then(res => { if (res?.ok) setAnalytics(res); }).catch(() => {}).finally(() => setAnalyticsLoading(false));
    }
  }, [activeTab]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.getRequests();
      if (res?.requests) setRequests(res.requests.map(r => ({ ...r, id: r.id || r._id })));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  };

  const loadProducts = async () => {
    try {
      const res = await api.getProducts();
      if (res?.products) setProducts(res.products);
    } catch(e) { console.error(e); }
  };

  // ── Request handlers ──
  const handleViewDetails = (r) => { setSelectedRequest(r); setDetailsOpen(true); setMessageInput(''); };

  const handleApprove = async () => {
    if (!selectedRequest) return;
    await api.updateRequestStatus(selectedRequest.id, { status: 'Accepted', notes: messageInput });
    await loadRequests();
    setDetailsOpen(false);
    Notif.adminApproved(selectedRequest.userName, selectedRequest.product);
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    await api.updateRequestStatus(selectedRequest.id, { status: 'Rejected', notes: messageInput });
    await loadRequests();
    setDetailsOpen(false);
    Notif.adminRejected(selectedRequest.userName);
  };

  const handleRevoke = async () => {
    if (!selectedRequest) return;
    if (!window.confirm('Revoke this approval? This will reset the status to "Awaiting review" and clear the delivery key.')) return;
    try {
      await api.revokeRequest(selectedRequest.id);
      await loadRequests();
      setDetailsOpen(false);
      Notif.adminRevoked();
    } catch (e) {
      Notif.error('Failed to revoke approval');
    }
  };

  const handleInlineStatus = async (id, status) => {
    await api.updateRequestStatus(id, { status });
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const packagesToText = (packages = []) =>
    (Array.isArray(packages) ? packages : [])
      .map(pkg => `${pkg.label || ''}|${pkg.price || ''}|${pkg.originalPrice || ''}`)
      .join('\n');

  const textToPackages = (text) => {
    const rows = String(text || '')
      .split('\n')
      .map(row => row.trim())
      .filter(Boolean);

    return rows.map((row, index) => {
      const [label = '', price = '', originalPrice = ''] = row.split('|').map(part => part.trim());
      if (!label || !price) {
        throw new Error(`Invalid package format on line ${index + 1}. Use: label|price|originalPrice`);
      }
      return {
        label,
        price,
        originalPrice
      };
    });
  };

  // ── Product handlers ──
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm({ name:'', category:'', price:'', status:'Available', description:'', img:'' });
    setProductPackagesText('');
    setProductError('');
    setProductModalOpen(true);
  };
  const openEditProduct = (p) => {
    setEditingProduct(p);
    setProductForm({ name:p.name||'', category:p.category||'', price:p.price||'', status:p.status||'Available', description:p.description||'', img:p.img||'' });
    setProductPackagesText(packagesToText(p.packages || []));
    setProductError('');
    setProductModalOpen(true);
  };
  const handleSaveProduct = async () => {
    if (!productForm.name.trim() || !productForm.price.trim()) return setProductError('Name and price required');
    try {
      const packages = textToPackages(productPackagesText);
      const payload = { ...productForm, packages };
      if (editingProduct) await api.updateProduct(editingProduct._id || editingProduct.id, payload);
      else await api.createProduct(payload);
      setProductModalOpen(false);
      await loadProducts();
    } catch(e) { setProductError(e?.message || 'Failed'); }
  };
  const handleDeleteProduct = async (p) => {
    if (!window.confirm(`Delete "${p.name}"?`)) return;
    await api.deleteProduct(p._id || p.id);
    await loadProducts();
  };

  // ── Promote handler ──
  const handlePromote = async (e) => {
    e.preventDefault();
    if (!promoteEmail.trim()) return;
    setPromoteLoading(true); setPromoteMsg('');
    try {
      const res = await api.request('/api/admin/promote', { method:'POST', body: JSON.stringify({ email: promoteEmail.trim().toLowerCase() }) });
      setPromoteMsg(res?.ok ? `✅ ${res.message}` : `❌ ${res?.message || 'Failed'}`);
      if (res?.ok) setPromoteEmail('');
    } catch { setPromoteMsg('❌ Request failed'); }
    finally { setPromoteLoading(false); }
  };

  const handleLogout = () => { logout(); navigate('/'); };

  const handleSaveSettings = async () => {
    setSettingsSaving(true); setSettingsMsg('');
    try {
      await api.updateSettings(settingsForm);
      Notif.settingsSaved();
      setSettingsMsg('✅ Settings saved!');
      setTimeout(() => setSettingsMsg(''), 3000);
    } catch { Notif.error('Failed to save settings'); setSettingsMsg('❌ Failed to save'); }
    finally { setSettingsSaving(false); }
  };

  const resetCouponForm = () => {
    setCouponEditing(null);
    setCouponForm({
      code: '',
      ownerEmail: '',
      discountKind: 'flat',
      discountValue: 30,
      rewardAmount: 30,
      usageLimit: 0,
      active: true,
      startsAt: '',
      endsAt: '',
      note: '',
      type: 'promo'
    });
    setCouponMsg('');
  };

  const handleEditCoupon = (coupon) => {
    setCouponEditing(coupon);
    setCouponForm({
      code: coupon.code || '',
      ownerEmail: coupon.ownerUserId?.email || '',
      discountKind: coupon.discountKind || 'flat',
      discountValue: coupon.discountValue ?? 30,
      rewardAmount: coupon.rewardAmount ?? 30,
      usageLimit: coupon.usageLimit ?? 0,
      active: coupon.active !== false,
      startsAt: coupon.startsAt ? String(coupon.startsAt).slice(0, 16) : '',
      endsAt: coupon.endsAt ? String(coupon.endsAt).slice(0, 16) : '',
      note: coupon.note || '',
      type: coupon.type || 'promo'
    });
    setCouponMsg('');
  };

  const handleSaveCoupon = async () => {
    setCouponSaving(true);
    setCouponMsg('');
    try {
      const payload = {
        ...couponForm,
        discountValue: Number(couponForm.discountValue || 30),
        rewardAmount: Number(couponForm.rewardAmount || 30),
        usageLimit: Number(couponForm.usageLimit || 0),
        active: Boolean(couponForm.active),
        startsAt: couponForm.startsAt || null,
        endsAt: couponForm.endsAt || null
      };
      const res = couponEditing
        ? await api.updateCoupon(couponEditing._id || couponEditing.id, payload)
        : await api.createCoupon(payload);
      if (!res?.ok) throw new Error(res?.message || 'Failed to save coupon');
      setCouponMsg('✅ Coupon saved');
      resetCouponForm();
      const list = await api.listCoupons();
      setCoupons(list?.coupons || []);
    } catch (error) {
      setCouponMsg(`❌ ${error?.message || 'Failed to save coupon'}`);
    } finally {
      setCouponSaving(false);
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Deactivate coupon ${coupon.code}?`)) return;
    await api.deleteCoupon(coupon._id || coupon.id);
    const list = await api.listCoupons();
    setCoupons(list?.coupons || []);
    resetCouponForm();
  };

  const handleDemote = async (email) => {
    if (!window.confirm(`Remove admin access from ${email}?`)) return;
    try {
      const res = await api.demoteAdmin(email);
      if (res?.ok) {
        Notif.adminRevoked();
        showToast(`${email} removed from admins`, 'warning');
        api.listAdmins().then(r => setAdmins(r?.admins || []));
      }
    } catch { Notif.error('Failed to demote admin'); }
  };

  // ── Computed ──
  const filteredRequests = requests.filter(r => {
    const matchFilter = filter === 'all' || r.status.toLowerCase().includes(filter);
    const matchSearch = !searchTerm || r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) || r.product?.toLowerCase().includes(searchTerm.toLowerCase()) || String(r.id||'').toLowerCase().includes(searchTerm.toLowerCase());
    return matchFilter && matchSearch;
  });

  const stats = {
    total:     requests.length,
    pending:   requests.filter(r => r.status.toLowerCase().includes('pending') || r.status.toLowerCase().includes('awaiting')).length,
    accepted:  requests.filter(r => r.status.toLowerCase().includes('accept')).length,
    rejected:  requests.filter(r => r.status.toLowerCase().includes('reject')).length,
    revenue:   requests.filter(r => r.status.toLowerCase().includes('accept')).reduce((s, r) => s + (parseFloat(r.packagePrice) || 0), 0)
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className={`admin-sidebar glass ${sidebarOpen ? 'open' : ''}`} style={{ 
        borderRight: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(3, 3, 3, 0.8)',
        backdropFilter: 'blur(40px)',
        zIndex: 200
      }}>
        <div className="sidebar-logo text-gradient" style={{ padding: '24px', fontWeight: 900, fontSize: '1.2rem', letterSpacing: '2px' }}>
          ⚔️ SUSANTEDIT
        </div>
        <ul className="sidebar-nav">
          {TABS.map(t => (
            <motion.li 
              key={t.id}
              whileHover={{ x: 5 }}
            >
              <button
                className={`sidebar-item ${activeTab === t.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
                style={{
                  margin: '4px 12px',
                  borderRadius: '12px',
                  width: 'calc(100% - 24px)',
                  transition: 'all 0.3s'
                }}
              >
                <i className={`fas ${t.icon}`} style={{ width: '20px', textAlign: 'center' }} />
                {t.label}
                {activeTab === t.id && (
                  <motion.div 
                    layoutId="active-pill"
                    style={{ position: 'absolute', right: 0, width: '4px', height: '20px', background: 'var(--primary)', borderRadius: '2px' }}
                  />
                )}
              </button>
            </motion.li>
          ))}
          <li style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button className="sidebar-item logout" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt" />
              Logout
            </button>
          </li>
        </ul>
      </aside>

      {/* Main */}
      <div className="admin-main">
        <div className="admin-topbar glass" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background:'none', border:'none', color:'var(--text)', fontSize:'1.2rem', cursor:'pointer', display:'none' }}
            className="mobile-menu-btn"
          >
            <i className="fas fa-bars" />
          </button>
          <span className="admin-topbar-title">⚔️ SUSANTEDIT ADMIN</span>
          <span style={{ fontSize:'0.82rem', color:'var(--muted)' }}>{user?.email}</span>
        </div>

        {/* Content */}
        <div className="admin-content">

          {/* ── DASHBOARD ── */}
          {activeTab === 'dashboard' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="section-header">
                <h1>Overview</h1>
              </div>
              <div className="stats-grid">
                <div className="stat-card glass-card">
                  <div className="stat-icon"><i className="fas fa-indian-rupee-sign" /></div>
                  <div className="stat-info"><h3>Rs {stats.revenue.toLocaleString()}</h3><p>Revenue</p></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-icon"><i className="fas fa-bag-shopping" /></div>
                  <div className="stat-info"><h3>{stats.total}</h3><p>Total Orders</p></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-icon" style={{ color:'var(--status-pending)', background:'rgba(245,158,11,0.15)', borderColor:'rgba(245,158,11,0.3)' }}><i className="fas fa-clock" /></div>
                  <div className="stat-info"><h3 style={{ color:'var(--status-pending)' }}>{stats.pending}</h3><p>Pending</p></div>
                </div>
                <div className="stat-card glass-card">
                  <div className="stat-icon" style={{ color:'var(--status-success)', background:'rgba(74,222,128,0.15)', borderColor:'rgba(74,222,128,0.3)' }}><i className="fas fa-check-circle" /></div>
                  <div className="stat-info"><h3 style={{ color:'var(--status-success)' }}>{stats.accepted}</h3><p>Completed</p></div>
                </div>
              </div>

              {/* Recent requests preview */}
              <div className="panel">
                <div className="panel-header">
                  <h2>Recent Requests</h2>
                  <button className="filter-btn" onClick={() => setActiveTab('requests')}>View all →</button>
                </div>
                {requests.slice(0, 5).map(r => (
                  <div key={r.id} className="request-row" style={{ marginBottom: '8px', cursor:'pointer' }} onClick={() => { setActiveTab('requests'); handleViewDetails(r); }}>
                    <div>
                      <strong>{r.product}</strong>
                      <p>{r.userName} · {r.packageName}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <Badge variant={getStatusColor(r.status)}>{r.status}</Badge>
                      <p style={{ fontSize:'11px', marginTop:'4px' }}>{formatDate(r.updatedAt)}</p>
                    </div>
                  </div>
                ))}
                {requests.length === 0 && <p style={{ color:'var(--muted)', textAlign:'center', padding:'20px' }}>No requests yet</p>}
              </div>
            </div>
          )}

          {/* ── REQUESTS ── */}
          {activeTab === 'requests' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="section-header">
                <h1>Requests Queue</h1>
                <span style={{ color:'var(--muted)', fontSize:'0.85rem' }}>{filteredRequests.length} requests</span>
              </div>

              <div style={{ display:'flex', gap:'10px', marginBottom:'16px', flexWrap:'wrap' }}>
                <Input
                  placeholder="Search by name, product, ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ flex:1, minWidth:'200px' }}
                />
                <div style={{ display:'flex', gap:'6px' }}>
                  {['all','pending','accepted','rejected'].map(f => (
                    <button key={f} className={`filter-btn ${filter===f?'active':''}`} onClick={() => setFilter(f)}>
                      {f.charAt(0).toUpperCase()+f.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="panel" style={{ padding:0, overflow:'hidden' }}>
                {loading ? (
                  <p style={{ padding:'40px', textAlign:'center', color:'var(--muted)' }}>Loading...</p>
                ) : filteredRequests.length === 0 ? (
                  <p className="table-empty">No requests found</p>
                ) : (
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Product</th>
                          <th>Package</th>
                          <th>Payment</th>
                          <th>Status</th>
                          <th>Date</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRequests.map(r => {
                          const isVip = r.product === '⭐ VIP Subscription';
                          return (
                          <tr key={r.id} style={isVip ? { background: 'rgba(251,191,36,0.04)', borderLeft: '3px solid rgba(251,191,36,0.5)' } : {}}>
                            <td><strong style={{ color:'#fff' }}>{r.userName}</strong></td>
                            <td>
                              {isVip
                                ? <span style={{ color:'#fbbf24', fontWeight:700 }}>⭐ VIP Subscription</span>
                                : r.product}
                            </td>
                            <td style={{ color:'var(--muted)', fontSize:'0.85rem' }}>{r.packageName || '—'}</td>
                            <td>
                              <Badge variant={r.paymentMethod === 'esewa' ? 'success' : 'info'}>
                                {r.paymentMethod === 'esewa' ? 'eSewa' : 'Bank'}
                              </Badge>
                            </td>
                            <td>
                              <select
                                className={`status-select status-${r.status.toLowerCase().replace(/\s+/g,'-').replace('awaiting-review','pending')}`}
                                value={r.status}
                                onChange={e => handleInlineStatus(r.id, e.target.value)}
                              >
                                <option value="Awaiting review">Awaiting review</option>
                                <option value="Pending payment">Pending payment</option>
                                <option value="Accepted">Accepted</option>
                                <option value="Rejected">Rejected</option>
                              </select>
                            </td>
                            <td style={{ fontSize:'0.82rem', color:'var(--muted)' }}>{formatDate(r.updatedAt)}</td>
                            <td>
                              <button className="filter-btn" onClick={() => handleViewDetails(r)}>
                                Review
                              </button>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── PRODUCTS ── */}
          {activeTab === 'products' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="section-header">
                <h1>Products</h1>
                <Button variant="primary" onClick={openAddProduct}>
                  <i className="fas fa-plus" /> Add Product
                </Button>
              </div>

              {products.length === 0 ? (
                <div className="panel" style={{ textAlign:'center', padding:'40px', color:'var(--muted)' }}>
                  No products in DB — built-in catalog is active. Add products to override it.
                </div>
              ) : (
                <div className="panel" style={{ padding:0, overflow:'hidden' }}>
                  <div className="table-wrapper">
                    <table className="table">
                      <thead>
                        <tr><th>Product</th><th>Category</th><th>Price</th><th>Status</th><th>Packages</th><th>Actions</th></tr>
                      </thead>
                      <tbody>
                        {products.map(p => (
                          <tr key={p._id || p.id}>
                            <td>
                              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                                {p.img && <img src={p.img} alt={p.name} style={{ width:'34px', height:'34px', objectFit:'cover', borderRadius:'6px' }} />}
                                <strong style={{ color:'#fff' }}>{p.name}</strong>
                              </div>
                            </td>
                            <td style={{ color:'var(--muted)' }}>{p.category}</td>
                            <td style={{ color:'var(--primary)', fontWeight:700 }}>{p.price}</td>
                            <td><Badge variant={p.status==='Available'?'success':'pending'}>{p.status}</Badge></td>
                            <td style={{ color:'var(--muted)' }}>{p.packages?.length||0} tiers</td>
                            <td>
                              <div style={{ display:'flex', gap:'6px' }}>
                                <button className="filter-btn" onClick={() => openEditProduct(p)}>Edit</button>
                                <button className="filter-btn" style={{ color:'var(--primary)', borderColor:'rgba(230,57,70,0.3)' }} onClick={() => handleDeleteProduct(p)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── USERS ── */}
          {activeTab === 'users' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="section-header"><h1>User Management</h1></div>

              <div className="panel" style={{ marginBottom:'16px' }}>
                <div className="panel-header"><h2>Promote to Admin</h2></div>
                <p style={{ color:'var(--muted)', fontSize:'0.85rem', marginBottom:'16px' }}>
                  User must have signed in with Google at least once first.
                </p>
                <form onSubmit={handlePromote} style={{ display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <Input
                    placeholder="user@gmail.com"
                    value={promoteEmail}
                    onChange={e => { setPromoteEmail(e.target.value); setPromoteMsg(''); }}
                    style={{ flex:1, minWidth:'220px' }}
                  />
                  <Button variant="primary" disabled={promoteLoading}>
                    {promoteLoading ? 'Promoting...' : 'Make Admin'}
                  </Button>
                </form>
                {promoteMsg && (
                  <p style={{ marginTop:'10px', fontSize:'0.88rem', color: promoteMsg.startsWith('✅') ? 'var(--status-success)' : 'var(--status-error)' }}>
                    {promoteMsg}
                  </p>
                )}
              </div>

              <div className="panel">
                <div className="panel-header"><h2>First-Time Setup</h2></div>
                <p style={{ color:'var(--muted)', fontSize:'0.85rem', lineHeight:1.8 }}>
                  1. Set <code style={{ background:'rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:'4px' }}>ADMIN_EMAIL=your@gmail.com</code> in <code style={{ background:'rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:'4px' }}>server/.env</code><br/>
                  2. Sign in with Google<br/>
                  3. Visit <code style={{ background:'rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:'4px' }}>http://localhost:3000/api/auth/bootstrap-admin</code><br/>
                  4. Sign out and back in → redirected to /admin
                </p>
              </div>

              {/* Reactivation tool */}
              <div className="panel" style={{ marginTop: '16px' }}>
                <div className="panel-header"><h2>💔 Reactivation Campaign</h2></div>
                <p style={{ color:'var(--muted)', fontSize:'0.85rem', marginBottom:'14px' }}>
                  Send Rs 30 wallet credit to users inactive for 3+ days. They get a notification: "We miss you 💔 — Rs 30 waiting in your wallet"
                </p>
                <Button variant="primary" onClick={async () => {
                  if (!window.confirm('Send Rs 30 to all users inactive 3+ days?')) return;
                  const res = await api.reactivateUsers(3);
                  Notif.showNotification('✅ Campaign Sent', res?.message || 'Done', 'success', 4000);
                }}>
                  <i className="fas fa-heart" /> Send Reactivation Credits
                </Button>
              </div>

              {/* Admin list */}
              <div className="panel" style={{ marginTop: '16px' }}>
                <div className="panel-header"><h2>Current Admins</h2></div>
                {admins.length === 0 ? (
                  <p style={{ color:'var(--muted)', fontSize:'0.85rem' }}>Loading...</p>
                ) : admins.map(a => (
                  <div key={a._id || a.email} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--line)' }}>
                    <div>
                      <strong style={{ color:'#fff' }}>{a.name}</strong>
                      <p style={{ margin:0, fontSize:'0.82rem', color:'var(--muted)' }}>{a.email}</p>
                    </div>
                    {a.email !== user?.email ? (
                      <button className="filter-btn" style={{ color:'var(--status-error)', borderColor:'rgba(230,57,70,0.3)' }} onClick={() => handleDemote(a.email)}>
                        Remove Admin
                      </button>
                    ) : (
                      <span style={{ fontSize:'0.75rem', color:'var(--muted)' }}>You</span>
                    )}
                  </div>
                ))}
              </div>

              {/* VIP Management */}
              <VipManager />
            </div>
          )}

          {/* ── COUPONS ── */}
          {activeTab === 'coupons' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="section-header">
                <h1>Coupon Manager</h1>
                <Button variant="ghost" onClick={resetCouponForm}>
                  <i className="fas fa-plus" /> New Coupon
                </Button>
              </div>

              {couponMsg && (
                <div style={{ marginBottom:'14px', padding:'10px 14px', borderRadius:'8px', background: couponMsg.startsWith('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(230,57,70,0.1)', border:`1px solid ${couponMsg.startsWith('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(230,57,70,0.3)'}`, color: couponMsg.startsWith('✅') ? '#4ade80' : '#ff6b6b' }}>
                  {couponMsg}
                </div>
              )}

              <div style={{ display:'grid', gap:'16px', gridTemplateColumns:'1fr 1fr' }}>
                <div className="panel">
                  <div className="panel-header"><h2>{couponEditing ? 'Edit Coupon' : 'Create Coupon'}</h2></div>
                  <Input label="Coupon Code" value={couponForm.code} onChange={e => setCouponForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="WELCOME30" />
                  <Input label="Owner Email (optional)" value={couponForm.ownerEmail} onChange={e => setCouponForm(p => ({ ...p, ownerEmail: e.target.value }))} placeholder="user@gmail.com" />
                  <div className="form-group">
                    <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--muted)', letterSpacing:'1px', textTransform:'uppercase' }}>Discount Type</label>
                    <select className="form-input" value={couponForm.discountKind} onChange={e => setCouponForm(p => ({ ...p, discountKind: e.target.value }))}>
                      <option value="flat">Flat Amount</option>
                      <option value="percent">Percentage</option>
                    </select>
                  </div>
                  <Input label={couponForm.discountKind === 'percent' ? 'Discount Percentage' : 'Discount Amount'} type="number" value={couponForm.discountValue} onChange={e => setCouponForm(p => ({ ...p, discountValue: e.target.value }))} />
                  <Input label="Referral Reward Amount" type="number" value={couponForm.rewardAmount} onChange={e => setCouponForm(p => ({ ...p, rewardAmount: e.target.value }))} />
                  <Input label="Usage Limit (0 = unlimited)" type="number" value={couponForm.usageLimit} onChange={e => setCouponForm(p => ({ ...p, usageLimit: e.target.value }))} />
                  <Input label="Starts At" type="datetime-local" value={couponForm.startsAt} onChange={e => setCouponForm(p => ({ ...p, startsAt: e.target.value }))} />
                  <Input label="Ends At" type="datetime-local" value={couponForm.endsAt} onChange={e => setCouponForm(p => ({ ...p, endsAt: e.target.value }))} />
                  <Input label="Note" value={couponForm.note} onChange={e => setCouponForm(p => ({ ...p, note: e.target.value }))} placeholder="Limited offer" />
                  <div className="form-group">
                    <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--muted)', letterSpacing:'1px', textTransform:'uppercase' }}>Type</label>
                    <select className="form-input" value={couponForm.type} onChange={e => setCouponForm(p => ({ ...p, type: e.target.value }))}>
                      <option value="promo">Promo</option>
                      <option value="referral">Referral</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--muted)', letterSpacing:'1px', textTransform:'uppercase' }}>Active</label>
                    <select className="form-input" value={couponForm.active ? 'true' : 'false'} onChange={e => setCouponForm(p => ({ ...p, active: e.target.value === 'true' }))}>
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                  <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
                    <Button variant="primary" onClick={handleSaveCoupon} disabled={couponSaving} style={{ flex:1 }}>
                      {couponSaving ? 'Saving...' : (couponEditing ? 'Save Coupon' : 'Create Coupon')}
                    </Button>
                    {couponEditing && <Button variant="ghost" onClick={resetCouponForm}>Cancel</Button>}
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header"><h2>Current Coupons</h2></div>
                  <div style={{ display:'grid', gap:'10px', maxHeight:'560px', overflow:'auto' }}>
                    {coupons.length === 0 ? (
                      <p style={{ color:'var(--muted)' }}>No coupons yet.</p>
                    ) : coupons.map((coupon) => (
                      <div key={coupon._id || coupon.id} style={{ padding:'12px', border:'1px solid var(--line)', borderRadius:'10px', background:'rgba(255,255,255,0.03)' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', gap:'12px', alignItems:'center' }}>
                          <div>
                            <strong style={{ color:'#fff' }}>{coupon.code}</strong>
                            <p style={{ margin:0, fontSize:'0.82rem', color:'var(--muted)' }}>
                              {coupon.type} · {coupon.discountKind === 'percent' ? `${coupon.discountValue}%` : `Rs ${coupon.discountValue}`} · {coupon.active ? 'Active' : 'Inactive'}
                            </p>
                          </div>
                          <Badge variant={coupon.active ? 'success' : 'default'}>{coupon.active ? 'ON' : 'OFF'}</Badge>
                        </div>
                        <p style={{ margin:'8px 0 0', fontSize:'0.82rem', color:'var(--muted)' }}>
                          Owner: {coupon.ownerUserId?.email || '—'} · Uses: {coupon.usedCount || 0}/{coupon.usageLimit || '∞'}
                        </p>
                        {coupon.note && <p style={{ margin:'4px 0 0', fontSize:'0.82rem', color:'var(--muted)' }}>{coupon.note}</p>}
                        <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
                          <button className="filter-btn" onClick={() => handleEditCoupon(coupon)}>Edit</button>
                          <button className="filter-btn" style={{ color:'var(--status-error)', borderColor:'rgba(230,57,70,0.3)' }} onClick={() => handleDeleteCoupon(coupon)}>
                            Deactivate
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {activeTab === 'analytics' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="section-header">
                <h1>Analytics</h1>
                <button className="filter-btn" onClick={() => { setAnalyticsLoading(true); api.getAnalytics().then(res => { if (res?.ok) setAnalytics(res); }).catch(() => {}).finally(() => setAnalyticsLoading(false)); }}>
                  <i className="fas fa-sync" /> Refresh
                </button>
              </div>

              {analyticsLoading ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>Loading analytics...</div>
              ) : !analytics ? (
                <div style={{ textAlign: 'center', padding: '60px', color: 'var(--muted)' }}>No data yet</div>
              ) : (<>
                {/* Stats cards */}
                <div className="stats-grid" style={{ marginBottom: '20px' }}>
                  <div className="stat-card">
                    <div className="stat-icon"><i className="fas fa-indian-rupee-sign" /></div>
                    <div className="stat-info"><h3>Rs {(analytics.totalRevenue || 0).toLocaleString()}</h3><p>Total Revenue</p></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ color: 'var(--status-pending)', background: 'rgba(245,158,11,0.15)', borderColor: 'rgba(245,158,11,0.3)' }}><i className="fas fa-bag-shopping" /></div>
                    <div className="stat-info"><h3 style={{ color: 'var(--status-pending)' }}>{analytics.ordersThisWeek || 0}</h3><p>Orders This Week</p></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ color: 'var(--status-success)', background: 'rgba(74,222,128,0.15)', borderColor: 'rgba(74,222,128,0.3)' }}><i className="fas fa-users" /></div>
                    <div className="stat-info"><h3 style={{ color: 'var(--status-success)' }}>{analytics.newUsersThisWeek || 0}</h3><p>New Users (7d)</p></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon"><i className="fas fa-chart-line" /></div>
                    <div className="stat-info"><h3>Rs {analytics.avgOrderValue || 0}</h3><p>Avg Order Value</p></div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  {/* Revenue bar chart */}
                  <div className="panel">
                    <div className="panel-header"><h2>Revenue — Last 7 Days</h2></div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '160px', padding: '8px 0' }}>
                      {(analytics.revenueByDay || []).map((day, i) => {
                        const maxRev = Math.max(...(analytics.revenueByDay || []).map(d => d.revenue), 1);
                        const pct = Math.round((day.revenue / maxRev) * 100);
                        const label = day.date ? day.date.slice(5) : '';
                        return (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                            <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>{day.revenue > 0 ? `${day.revenue}` : ''}</span>
                            <div
                              title={`Rs ${day.revenue}`}
                              style={{
                                width: '100%', borderRadius: '4px 4px 0 0',
                                height: `${Math.max(pct, 4)}%`,
                                background: pct > 60 ? 'linear-gradient(180deg, var(--primary), #c1121f)' : 'linear-gradient(180deg, rgba(230,57,70,0.5), rgba(230,57,70,0.2))',
                                transition: 'height 0.6s ease',
                                boxShadow: pct > 60 ? '0 0 8px rgba(230,57,70,0.4)' : 'none'
                              }}
                            />
                            <span style={{ fontSize: '0.65rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Orders by status */}
                  <div className="panel">
                    <div className="panel-header"><h2>Orders by Status</h2></div>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {(analytics.byStatus || []).map((s, i) => {
                        const total = (analytics.byStatus || []).reduce((a, b) => a + b.count, 0) || 1;
                        const pct = Math.round((s.count / total) * 100);
                        const color = s._id?.toLowerCase().includes('accept') ? '#4ade80' : s._id?.toLowerCase().includes('reject') ? 'var(--primary)' : '#f59e0b';
                        return (
                          <div key={i}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                              <span style={{ color: '#fff' }}>{s._id}</span>
                              <span style={{ color }}>{s.count} ({pct}%)</span>
                            </div>
                            <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '6px', transition: 'width 0.6s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Top products */}
                <div className="panel">
                  <div className="panel-header"><h2>Top Products by Orders</h2></div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {(analytics.topProducts || []).map((p, i) => {
                      const maxCount = Math.max(...(analytics.topProducts || []).map(x => x.count), 1);
                      const pct = Math.round((p.count / maxCount) * 100);
                      return (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.75rem', color: 'var(--primary)', width: '20px', textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                              <span style={{ color: '#fff', fontWeight: 600 }}>{p._id}</span>
                              <span style={{ color: 'var(--muted)' }}>{p.count} orders · Rs {Math.round(p.revenue || 0)}</span>
                            </div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${pct}%`,
                                background: 'linear-gradient(90deg, var(--primary), #ff6b6b)',
                                borderRadius: '8px', transition: 'width 0.6s ease',
                                boxShadow: '0 0 6px rgba(230,57,70,0.4)'
                              }} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(!analytics.topProducts || analytics.topProducts.length === 0) && (
                      <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '20px' }}>No order data yet</p>
                    )}
                  </div>
                </div>
              </>)}
            </div>
          )}

          {/* ── SETTINGS ── */}
          {activeTab === 'settings' && (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div className="section-header">
                <h1>App Settings</h1>
                <Button variant="primary" onClick={handleSaveSettings} disabled={settingsSaving}>
                  {settingsSaving ? 'Saving...' : <><i className="fas fa-save" /> Save All</>}
                </Button>
              </div>
              {settingsMsg && (
                <div style={{ padding:'10px 14px', background: settingsMsg.startsWith('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(230,57,70,0.1)', border:`1px solid ${settingsMsg.startsWith('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(230,57,70,0.3)'}`, borderRadius:'8px', marginBottom:'16px', color: settingsMsg.startsWith('✅') ? '#4ade80' : '#ff6b6b', fontSize:'0.9rem' }}>
                  {settingsMsg}
                </div>
              )}

              <div style={{ display:'grid', gap:'16px', gridTemplateColumns:'1fr 1fr' }}>
                {/* Branding */}
                <div className="panel">
                  <div className="panel-header"><h2>Branding</h2></div>
                  <Input label="App Name" value={settingsForm.appName} onChange={e => setSettingsForm(p=>({...p,appName:e.target.value}))} placeholder="SUSANTEDIT" />
                  <Input label="Tagline" value={settingsForm.appTagline} onChange={e => setSettingsForm(p=>({...p,appTagline:e.target.value}))} placeholder="Premium Gaming Services" />
                  <Input label="Payment Window Message" value={settingsForm.paymentWindow} onChange={e => setSettingsForm(p=>({...p,paymentWindow:e.target.value}))} placeholder="Payment Time: 8AM - 10PM" />
                </div>

                {/* Contact */}
                <div className="panel">
                  <div className="panel-header"><h2>Contact Info</h2></div>
                  <Input label="WhatsApp Number" value={settingsForm.contactWhatsApp} onChange={e => setSettingsForm(p=>({...p,contactWhatsApp:e.target.value}))} placeholder="+977-98XXXXXXXX" />
                  <Input label="Telegram Username" value={settingsForm.contactTelegram} onChange={e => setSettingsForm(p=>({...p,contactTelegram:e.target.value}))} placeholder="@yourtelegram" />
                </div>

                {/* Announcement banner */}
                <div className="panel" style={{ gridColumn:'1/-1' }}>
                  <div className="panel-header"><h2>Announcement Banner</h2></div>
                  <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginBottom:'10px' }}>Shown to all users at the top of their dashboard. Leave empty to hide.</p>
                  <textarea
                    className="form-input"
                    rows={3}
                    value={settingsForm.announcement}
                    onChange={e => setSettingsForm(p=>({...p,announcement:e.target.value}))}
                    placeholder="e.g. 🔥 New panel available! Check Products section."
                    style={{ resize:'vertical' }}
                  />
                </div>

                {/* Form labels */}
                <div className="panel" style={{ gridColumn:'1/-1' }}>
                  <div className="panel-header"><h2>Purchase Form Labels</h2></div>
                  <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginBottom:'14px' }}>Rename the fields in the purchase form. Leave empty to use defaults.</p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                    <Input label="Full Name field label" value={settingsForm.labels.fullName} onChange={e => setSettingsForm(p=>({...p,labels:{...p.labels,fullName:e.target.value}}))} placeholder="Full Name" />
                    <Input label="TikTok field label" value={settingsForm.labels.tiktok} onChange={e => setSettingsForm(p=>({...p,labels:{...p.labels,tiktok:e.target.value}}))} placeholder="TikTok Handle" />
                    <Input label="WhatsApp field label" value={settingsForm.labels.whatsapp} onChange={e => setSettingsForm(p=>({...p,labels:{...p.labels,whatsapp:e.target.value}}))} placeholder="WhatsApp Number" />
                    <Input label="Transaction field label" value={settingsForm.labels.transaction} onChange={e => setSettingsForm(p=>({...p,labels:{...p.labels,transaction:e.target.value}}))} placeholder="Transaction Number" />
                  </div>
                </div>

                {/* QR Code Upload */}
                <div className="panel" style={{ gridColumn:'1/-1' }}>
                  <div className="panel-header"><h2>📱 Payment QR Codes</h2></div>
                  <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginBottom:'16px' }}>
                    Upload your QR codes here. Drag & drop or click to select. These will be shown to users during checkout.
                  </p>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
                    {[
                      { key:'qrEsewa', label:'eSewa QR', color:'#60bb46', icon:'fa-mobile-screen', fallback:'/payment.jpeg' },
                      { key:'qrBank',  label:'NMB Bank QR', color:'#60a5fa', icon:'fa-building-columns', fallback:'/bank.jpg' },
                    ].map(({ key, label, color, icon, fallback }) => (
                      <div key={key}>
                        <div style={{ fontSize:'0.8rem', color:'var(--muted)', fontWeight:700, marginBottom:'8px', display:'flex', alignItems:'center', gap:'6px' }}>
                          <i className={`fas ${icon}`} style={{ color }} /> {label}
                        </div>
                        {/* Drop zone */}
                        <div
                          onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = color; }}
                          onDragLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                          onDrop={e => {
                            e.preventDefault();
                            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                            const file = e.dataTransfer.files[0];
                            if (!file || !file.type.startsWith('image/')) return;
                            const reader = new FileReader();
                            reader.onload = ev => setSettingsForm(p => ({ ...p, [key]: ev.target.result }));
                            reader.readAsDataURL(file);
                          }}
                          onClick={() => document.getElementById(`qr-input-${key}`).click()}
                          style={{
                            border: '2px dashed rgba(255,255,255,0.1)', borderRadius:'12px',
                            padding:'12px', cursor:'pointer', transition:'border-color 0.2s',
                            background:'rgba(255,255,255,0.02)', textAlign:'center',
                            minHeight:'160px', display:'flex', flexDirection:'column',
                            alignItems:'center', justifyContent:'center', gap:'8px'
                          }}
                        >
                          {settingsForm[key] ? (
                            <img src={settingsForm[key]} alt={label} style={{ maxHeight:'140px', maxWidth:'100%', objectFit:'contain', borderRadius:'8px' }} />
                          ) : (
                            <>
                              <img src={fallback} alt={label} style={{ maxHeight:'120px', maxWidth:'100%', objectFit:'contain', borderRadius:'8px', opacity:0.7 }} />
                              <span style={{ fontSize:'0.72rem', color:'var(--muted)' }}>Current QR — drag new image to replace</span>
                            </>
                          )}
                        </div>
                        <input
                          id={`qr-input-${key}`}
                          type="file" accept="image/*" style={{ display:'none' }}
                          onChange={e => {
                            const file = e.target.files[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = ev => setSettingsForm(p => ({ ...p, [key]: ev.target.result }));
                            reader.readAsDataURL(file);
                          }}
                        />
                        {settingsForm[key] && (
                          <button
                            onClick={() => setSettingsForm(p => ({ ...p, [key]: '' }))}
                            style={{ marginTop:'6px', background:'none', border:'1px solid rgba(230,57,70,0.3)', color:'#ff6b6b', borderRadius:'6px', padding:'4px 10px', cursor:'pointer', fontSize:'0.72rem' }}
                          >
                            <i className="fas fa-trash" /> Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <SupportFab />

      {/* Request Details Modal */}
      <Modal isOpen={detailsOpen} onClose={() => setDetailsOpen(false)} title="Request Details" size="lg">
        {selectedRequest && (() => {
          const isVip = selectedRequest.product === '⭐ VIP Subscription';
          const isPending = selectedRequest.status.toLowerCase().includes('pending') || selectedRequest.status.toLowerCase().includes('awaiting');
          return (
          <div>
            {/* VIP banner */}
            {isVip && (
              <div style={{
                marginBottom: '16px', padding: '12px 16px', borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
                border: '1px solid rgba(251,191,36,0.4)',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <span style={{ fontSize: '1.5rem' }}>⭐</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.9rem' }}>VIP Subscription Request — Rs 199/month</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                    Approving will <strong style={{ color: '#fbbf24' }}>automatically grant 1 month VIP</strong> to this user. No key needed.
                  </div>
                </div>
              </div>
            )}

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px', marginBottom:'20px' }}>
              {[
                ['Request ID', selectedRequest.id],
                ['User', selectedRequest.userName],
                ['Product', selectedRequest.product],
                ['Package', selectedRequest.packageName || '—'],
                ['Price', selectedRequest.packagePrice ? `Rs ${selectedRequest.packagePrice}` : '—'],
                ['Payment', selectedRequest.paymentMethod === 'esewa' ? 'eSewa' : 'Bank Transfer'],
                ['TikTok', selectedRequest.tikTok || '—'],
                ['WhatsApp', selectedRequest.whatsapp || '—'],
                ['Transaction', selectedRequest.transaction || '—'],
                ['Submitted', formatDate(selectedRequest.updatedAt)],
              ].map(([label, val]) => (
                <div key={label}>
                  <p style={{ fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', color:'var(--muted)', marginBottom:'3px' }}>{label}</p>
                  <p style={{ margin:0, color:'#fff', fontWeight:600 }}>{val}</p>
                </div>
              ))}
            </div>

            <div style={{ marginBottom:'14px' }}>
              <p style={{ fontSize:'11px', textTransform:'uppercase', letterSpacing:'1px', color:'var(--muted)', marginBottom:'3px' }}>Status</p>
              <Badge variant={getStatusColor(selectedRequest.status)}>{selectedRequest.status}</Badge>
            </div>

            {isPending && (
              <>
                {isVip ? (
                  /* VIP — no key needed, just verify payment and approve */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', fontSize: '0.85rem', color: '#fbbf24' }}>
                      <i className="fas fa-circle-info" style={{ marginRight: '8px' }} />
                      Verify the transaction number <strong>{selectedRequest.transaction}</strong> in your eSewa/Bank app, then approve.
                    </div>
                    <Input
                      label="Note (optional)"
                      placeholder="e.g. VIP activated — enjoy ad-free!"
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                    />
                    <div style={{ display:'flex', gap:'8px', marginTop:'4px' }}>
                      <Button variant="ghost" onClick={handleReject} style={{ flex:1, color:'var(--status-error)', borderColor:'rgba(230,57,70,0.3)' }}>
                        <i className="fas fa-times" /> Reject
                      </Button>
                      <Button variant="primary" onClick={handleApprove} style={{ flex:1, background: 'linear-gradient(135deg,#fbbf24,#f59e0b)', color:'#000' }}>
                        <i className="fas fa-star" /> Approve — Grant VIP
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* Normal request — key required */
                  <>
                    <Input
                      label="Delivery Key / Message"
                      placeholder="Enter the key or activation message..."
                      value={messageInput}
                      onChange={e => setMessageInput(e.target.value)}
                    />
                    <div style={{ display:'flex', gap:'8px', marginTop:'14px' }}>
                      <Button variant="ghost" onClick={handleReject} style={{ flex:1, color:'var(--status-error)', borderColor:'rgba(230,57,70,0.3)' }}>
                        <i className="fas fa-times" /> Reject
                      </Button>
                      <Button variant="primary" onClick={handleApprove} disabled={!messageInput.trim()} style={{ flex:1 }}>
                        <i className="fas fa-check" /> Approve & Send
                      </Button>
                    </div>
                  </>
                )}
              </>
            )}

            {selectedRequest.notes && (
              <div style={{ marginTop:'14px', padding:'12px', background: isVip ? 'rgba(251,191,36,0.08)' : 'rgba(74,222,128,0.08)', border: `1px solid ${isVip ? 'rgba(251,191,36,0.2)' : 'rgba(74,222,128,0.2)'}`, borderRadius:'8px' }}>
                <p style={{ margin:0, fontSize:'0.85rem', color: isVip ? '#fbbf24' : 'var(--status-success)' }}>
                  {isVip ? '⭐ VIP Activated' : '🔑 Delivered'}: {selectedRequest.notes || 'VIP granted automatically'}
                </p>
              </div>
            )}
            {/* VIP auto-granted notice when accepted with no notes */}
            {isVip && selectedRequest.status.toLowerCase().includes('accept') && !selectedRequest.notes && (
              <div style={{ marginTop:'14px', padding:'12px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:'8px' }}>
                <p style={{ margin:0, fontSize:'0.85rem', color:'#fbbf24' }}>⭐ VIP automatically granted for 1 month.</p>
              </div>
            )}

            {/* Revoke button */}
            {(selectedRequest.status.toLowerCase().includes('accept') || selectedRequest.status.toLowerCase().includes('reject')) && (
              <div style={{ marginTop:'16px', paddingTop:'16px', borderTop:'1px solid var(--line)' }}>
                <p style={{ color:'var(--muted)', fontSize:'0.82rem', marginBottom:'10px' }}>
                  Made a mistake? Revoke this decision to reset the request back to review.
                </p>
                <Button
                  variant="ghost"
                  onClick={handleRevoke}
                  style={{ width:'100%', color:'var(--status-pending)', borderColor:'rgba(245,158,11,0.3)' }}
                >
                  <i className="fas fa-undo" /> Revoke & Reset to Awaiting Review
                </Button>
              </div>
            )}
          </div>
          );
        })()}
      </Modal>

      {/* Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
        size="md"
        actions={
          <div style={{ display:'flex', gap:'8px' }}>
            <Button variant="ghost" onClick={() => setProductModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProduct}>{editingProduct ? 'Save Changes' : 'Add Product'}</Button>
          </div>
        }
      >
        <div style={{ display:'grid', gap:'2px' }}>
          <Input label="Name" name="name" value={productForm.name} onChange={e => setProductForm(p=>({...p,name:e.target.value}))} required />
          <Input label="Category" name="category" value={productForm.category} onChange={e => setProductForm(p=>({...p,category:e.target.value}))} />
          <Input label="Price (display)" name="price" placeholder="e.g. From Rs 299" value={productForm.price} onChange={e => setProductForm(p=>({...p,price:e.target.value}))} required />
          <div className="form-group">
            <label style={{ fontSize:'0.82rem', fontWeight:700, color:'var(--muted)', letterSpacing:'1px', textTransform:'uppercase' }}>Status</label>
            <select className="form-input" value={productForm.status} onChange={e => setProductForm(p=>({...p,status:e.target.value}))}>
              <option value="Available">Available</option>
              <option value="Limited">Limited</option>
              <option value="Unavailable">Unavailable</option>
            </select>
          </div>
          <Input label="Image URL" name="img" placeholder="https://... or /filename.webp" value={productForm.img} onChange={e => setProductForm(p=>({...p,img:e.target.value}))} />
          <Input label="Description" name="description" value={productForm.description} onChange={e => setProductForm(p=>({...p,description:e.target.value}))} />
          <div className="form-group">
            <label>Package Tiers (label|price|originalPrice)</label>
            <textarea
              className="form-input"
              rows={6}
              value={productPackagesText}
              onChange={e => setProductPackagesText(e.target.value)}
              placeholder={"1 Day Trial|399|649\\n7 Days|1199|1899\\n30 Days|1899|2999"}
              style={{ resize:'vertical' }}
            />
            <p style={{ margin:0, fontSize:'0.8rem', color:'var(--muted)' }}>
              One package per line. This controls the currently listed prices users see.
            </p>
          </div>
          {productError && <div className="form-error-alert">{productError}</div>}
        </div>
      </Modal>
    </div>
  );
}
