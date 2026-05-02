import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Button } from '../../components/shared/Button';
import { Input } from '../../components/shared/Input';
import { Modal } from '../../components/modals/Modal';
import { Badge } from '../../components/shared/Badge';
import { ChevronRightIcon, ShieldIcon } from '../../components/shared/Icons';
import { formatDate, generateRequestId, getStatusColor } from '../../utils/helpers';
import { requestNotificationPermission, notify, showToast, Notif, sendBrowserNotification } from '../../utils/notify';
import { SupportFab } from '../../components/shared/SupportFab';
import PlayerCard from '../../components/gamification/PlayerCard';
import QuickReorder from '../../components/gamification/QuickReorder';
import FirstBlood from '../../components/gamification/FirstBlood';
import SpinWheel from '../../components/gamification/SpinWheel';
import AdBanner from '../../components/ads/AdBanner';
import VipModal from '../../components/ads/VipModal';
import QrDisplay from '../../components/shared/QrDisplay';
import NotificationPanel from '../../components/notifications/NotificationPanel';
import { playCashRegister, playKeyDelivered, playNotif, isSoundEnabled, setSoundEnabled, startBgSound, stopBgSound, isBgSoundPlaying, playUiClick } from '../../utils/sounds';
import { setupPushNotifications } from '../../utils/pushNotifications';
import { motion } from 'framer-motion';

// ── LootBox sub-component ─────────────────────────────────────────────────
function LootBox({ requestId, keyText }) {
  const storageKey = `lootbox_${requestId}`;
  const [opened, setOpened] = useState(() => {
    try { return localStorage.getItem(storageKey) === 'opened'; } catch { return false; }
  });
  const [animating, setAnimating] = useState(false);

  const handleOpen = () => {
    setAnimating(true);
    setTimeout(() => {
      setOpened(true);
      try { localStorage.setItem(storageKey, 'opened'); } catch {}
      setAnimating(false);
    }, 1500);
  };

  if (opened) {
    return (
      <div style={{
        marginTop: '8px', padding: '10px 12px',
        background: 'rgba(95,226,167,0.1)', border: '1px solid rgba(95,226,167,0.3)',
        borderRadius: '10px', fontSize: '13px', color: '#5fe2a7',
        textAlign: 'left', wordBreak: 'break-all',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ flex: 1 }}>🔑 {keyText}</span>
          <button
            onClick={() => { navigator.clipboard.writeText(keyText); }}
            style={{ background: 'none', border: '1px solid rgba(95,226,167,0.4)', color: '#5fe2a7', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 700, flexShrink: 0 }}
          >
            <i className="fas fa-copy" /> COPY
          </button>
        </div>
        {/* WhatsApp send */}
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`🔑 My activation key: ${keyText}\n\nFrom SUSANTEDIT — https://susantedit.com`)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.3)', color: '#25D366', fontSize: '0.72rem', fontWeight: 700, textDecoration: 'none', marginRight: '6px' }}
        >
          <i className="fab fa-whatsapp" /> Send via WhatsApp
        </a>
        {/* TikTok share */}
        <button
          onClick={() => {
            const text = `Just got my key from @susantedit 🔑🔥 Best gaming service in Nepal! #SUSANTEDIT #FreeFire #Nepal`;
            window.open(`https://www.tiktok.com/upload?caption=${encodeURIComponent(text)}`, '_blank');
          }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '6px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}
        >
          <i className="fab fa-tiktok" /> Share on TikTok
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginTop: '8px', textAlign: 'center' }}>
      <style>{`
        @keyframes lootbox-shake {
          0%,100%{transform:rotate(0deg) scale(1)}
          20%{transform:rotate(-8deg) scale(1.1)}
          40%{transform:rotate(8deg) scale(1.15)}
          60%{transform:rotate(-5deg) scale(1.1)}
          80%{transform:rotate(5deg) scale(1.05)}
        }
        @keyframes key-glow {
          0%,100%{box-shadow:0 0 8px rgba(95,226,167,0.3)}
          50%{box-shadow:0 0 20px rgba(95,226,167,0.7),0 0 40px rgba(95,226,167,0.2)}
        }
        @keyframes flash-pulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
      `}</style>
      <button
        onClick={handleOpen}
        disabled={animating}
        style={{
          background: 'linear-gradient(135deg, rgba(230,57,70,0.2), rgba(230,57,70,0.1))',
          border: '1px solid rgba(230,57,70,0.4)',
          color: '#fff', padding: '8px 16px', borderRadius: '10px',
          cursor: animating ? 'default' : 'pointer', fontSize: '0.85rem', fontWeight: 700,
          display: 'flex', alignItems: 'center', gap: '8px',
          animation: animating ? 'lootbox-shake 0.3s ease-in-out 5' : 'none',
          transition: 'all 0.2s'
        }}
      >
        <span style={{ fontSize: '1.2rem' }}>🎁</span>
        {animating ? 'Opening...' : 'Open Loot Box'}
      </button>
    </div>
  );
}

// ── FlashCountdown sub-component ──────────────────────────────────────────
function FlashCountdown({ endsAt }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calc = () => {
      const diff = new Date(endsAt) - Date.now();
      if (diff <= 0) { setTimeLeft('EXPIRED'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${h > 0 ? h + 'h ' : ''}${m}m ${s}s`);
    };
    calc();
    const t = setInterval(calc, 1000);
    return () => clearInterval(t);
  }, [endsAt]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '6px 10px', background: 'rgba(230,57,70,0.1)',
      border: '1px solid rgba(230,57,70,0.3)', borderRadius: '8px',
      fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700,
      marginBottom: '8px', fontFamily: "'Orbitron',sans-serif", letterSpacing: '1px'
    }}>
      <i className="fas fa-bolt" />
      FLASH SALE ENDS IN: {timeLeft}
    </div>
  );
}

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { user, logout, isVip } = useAuth();
  const [products, setProducts] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [buyModalOpen, setBuyModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [paymentMethodModalOpen, setPaymentMethodModalOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [processingModalOpen, setProcessingModalOpen] = useState(false);

  // Form states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    tiktok: '',
    whatsapp: '',
    couponCode: '',
    transaction: '',
    paymentMethod: 'bank' // 'bank' or 'esewa'
  });
  const [formErrors, setFormErrors] = useState({});
  const [qrTimer, setQrTimer] = useState(null);
  const [processingTimer, setProcessingTimer] = useState(null);
  const [newRequestId, setNewRequestId] = useState(null);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const pollRef = useRef(null);
  const prevStatusRef = useRef({});

  // Profile modal
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    uid: '',
    gameId: '',
    tiktok: '',
    whatsapp: '',
    birthday: '',
    avatarUrl: ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [appSettings, setAppSettings] = useState({});

  // Squad / Referral tab
  const [activeTab, setActiveTab] = useState('store');
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({ walletBalance: 0, referralCount: 0, partnerBadge: false });
  const [leaderboard, setLeaderboard] = useState([]);
  const [applyCodeInput, setApplyCodeInput] = useState('');
  const [applyCodeMsg, setApplyCodeMsg] = useState('');
  const [applyCodeLoading, setApplyCodeLoading] = useState(false);

  // Hype & Flash Sales
  const [hypeData, setHypeData] = useState({});
  const [socialProof, setSocialProof] = useState({});
  const [flashSales, setFlashSales] = useState([]);

  // Gamification
  const [soundOn, setSoundOn] = useState(isSoundEnabled());
  const [bgOn, setBgOn] = useState(() => {
    try { return localStorage.getItem('bg_sound') === '1'; } catch { return false; }
  });
  const [gamProfile, setGamProfile] = useState(null);
  const [showFirstBlood, setShowFirstBlood] = useState(false);
  const [showSpinWheel, setShowSpinWheel] = useState(false);
  const isFirstOrderRef = useRef(false);

  // Price drop watchlist
  const [watchlist, setWatchlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem('price_watchlist') || '[]'); } catch { return []; }
  });

  // VIP modal
  const [vipModalOpen, setVipModalOpen] = useState(false);

  // Notifications
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // Gift to friends
  const [giftForm, setGiftForm] = useState({ recipientEmail: '', product: '', packageName: '', packagePrice: '', transaction: '', paymentMethod: 'esewa', message: '' });
  const [giftStep, setGiftStep] = useState('form'); // 'form' | 'qr' | 'done'
  const [giftLoading, setGiftLoading] = useState(false);
  const [giftMsg, setGiftMsg] = useState('');
  const toggleWatch = (productName) => {
    setWatchlist(prev => {
      const next = prev.includes(productName) ? prev.filter(n => n !== productName) : [...prev, productName];
      try { localStorage.setItem('price_watchlist', JSON.stringify(next)); } catch {}
      if (!prev.includes(productName)) Notif.showNotification('🔔 Price Alert Set', `We'll notify you when ${productName} price drops!`, 'info', 3000);
      return next;
    });
  };

  // Ask for notification permission on mount
  useEffect(() => {
    requestNotificationPermission();
    // Setup FCM real push notifications (OS-level, shows in phone notification shade)
    setupPushNotifications((payload) => {
      // Foreground message received — refresh notification count
      loadNotificationCount();
    });
    // Auto-resume bg sound if user had it on
    if (bgOn) {
      const t = setTimeout(() => startBgSound(), 500);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    api.getSettings().then(res => { if (res?.settings) setAppSettings(res.settings); }).catch(() => {});
    // Load hype and flash sales
    api.getHype().then(res => {
      if (res?.hype) setHypeData(res.hype);
      if (res?.socialProof) setSocialProof(res.socialProof);
    }).catch(() => {});
    api.getFlashSales().then(res => { if (res?.sales) setFlashSales(res.sales); }).catch(() => {});
    // Load gamification profile
    api.getGamificationProfile().then(res => { if (res?.ok) setGamProfile(res); }).catch(() => {});
    // Birthday check
    api.birthdayCheck().then(res => {
      if (res?.gift) Notif.showNotification('🎂 Happy Birthday!', res.message, 'key', 0);
    }).catch(() => {});
    // Load notification count
    loadNotificationCount();
  }, []);

  const prevUnreadCountRef = useRef(0);

  const loadNotificationCount = async () => {
    try {
      const res = await api.getNotifications({ unread: true, limit: 1 });
      if (res?.ok) {
        const count = res.unreadCount || 0;
        prevUnreadCountRef.current = count; // seed so first poll doesn't false-fire
        setUnreadNotificationCount(count);
      }
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 30s for status updates AND new notifications
    pollRef.current = setInterval(async () => {
      try {
        // ── Check for new notifications ──────────────────────────────
        const notifRes = await api.getNotifications({ unread: true, limit: 5 });
        if (notifRes?.ok) {
          const newCount = notifRes.unreadCount || 0;
          const prevCount = prevUnreadCountRef.current;
          if (newCount > prevCount) {
            // New notification(s) arrived
            const diff = newCount - prevCount;
            // Show the latest notification as a toast
            const latest = notifRes.notifications?.[0];
            if (latest) {
              Notif.showNotification(latest.title, latest.message, latest.type || 'info', 6000);
              playNotif();
              sendBrowserNotification(latest.title, latest.message, { tag: `notif-${latest._id}` });
            } else {
              Notif.showNotification('🔔 New Notification', `You have ${diff} new notification${diff > 1 ? 's' : ''}`, 'info', 5000);
              playNotif();
            }
          }
          prevUnreadCountRef.current = newCount;
          setUnreadNotificationCount(newCount);
        }
      } catch {}

      try {
        // ── Check for request status changes ─────────────────────────
        const res = await api.getRequests();
        if (!res?.requests) return;
        const updated = res.requests;
        updated.forEach(r => {
          const id = r.id || r._id;
          const prev = prevStatusRef.current[id];
          const curr = r.status;
          if (prev && prev !== curr) {
            if (curr.toLowerCase().includes('accept')) {
              Notif.keyDelivered(r.product);
              playKeyDelivered();
              sendBrowserNotification('🔑 Key Delivered!', `Your ${r.product} key is ready. Open the app to copy it.`, { requireInteraction: true, tag: `key-${id}` });
            } else if (curr.toLowerCase().includes('reject')) {
              Notif.requestRejected(r.product);
              sendBrowserNotification('Request Rejected', `Your ${r.product} request was rejected.`, { tag: `reject-${id}` });
            }
          }
          prevStatusRef.current[id] = curr;
        });
        setRequests(updated);
      } catch {}
    }, 30000);
    return () => clearInterval(pollRef.current);
  }, []);

  // Load squad data when squad tab opens
  useEffect(() => {
    if (activeTab !== 'squad') return;
    const loadSquad = () => {
      api.getReferralCode().then(res => { if (res?.code) setReferralCode(res.code); }).catch(() => {});
      api.getReferralStats().then(res => { if (res?.ok) setReferralStats({ walletBalance: res.walletBalance, referralCount: res.referralCount, partnerBadge: res.partnerBadge }); }).catch(() => {});
      api.getReferralLeaderboard().then(res => { if (res?.leaders) setLeaderboard(res.leaders); }).catch(() => {});
    };
    loadSquad();
    // Retry after 3s in case server was cold-starting
    const retry = setTimeout(loadSquad, 3000);
    return () => clearTimeout(retry);
  }, [activeTab]);

  const handleApplyCode = async () => {
    if (!applyCodeInput.trim()) return;
    setApplyCodeLoading(true); setApplyCodeMsg('');
    try {
      const res = await api.applyReferralCode(applyCodeInput.trim());
      setApplyCodeMsg(res?.ok ? `✅ ${res.message}` : `❌ ${res?.message || 'Failed'}`);
      if (res?.ok) {
        setApplyCodeInput('');
        api.getReferralStats().then(r => { if (r?.ok) setReferralStats({ walletBalance: r.walletBalance, referralCount: r.referralCount, partnerBadge: r.partnerBadge }); }).catch(() => {});
      }
    } catch { setApplyCodeMsg('❌ Request failed'); }
    finally { setApplyCodeLoading(false); }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, requestsRes] = await Promise.all([
        api.getProducts(),
        api.getRequests()
      ]);
      if (productsRes?.products) setProducts(productsRes.products);
      if (requestsRes?.requests) {
        setRequests(requestsRes.requests);
        // Seed initial statuses so we don't false-notify on first load
        requestsRes.requests.forEach(r => {
          prevStatusRef.current[r.id || r._id] = r.status;
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = (product) => {
    playUiClick();
    setSelectedProduct(product);
    setSelectedPackage(product.packages?.[0] || null);
    setBuyModalOpen(true);
  };

  const handleConfirmBuy = () => {
    setBuyModalOpen(false);
    setConfirmModalOpen(true);
  };

  const handleProceedToForm = () => {
    // Auto-fill from saved profile
    setFormData(prev => ({
      ...prev,
      name: user?.profile?.displayName || user?.name || prev.name,
      tiktok: user?.profile?.tiktok || prev.tiktok,
      whatsapp: user?.profile?.whatsapp || prev.whatsapp
    }));
    setConfirmModalOpen(false);
    setFormModalOpen(true);
  };

  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.tiktok.trim()) errors.tiktok = 'TikTok name is required';
    if (!formData.whatsapp.trim()) errors.whatsapp = 'WhatsApp number is required';
    // transaction is collected AFTER payment — not validated here
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setFormModalOpen(false);
    setPaymentMethodModalOpen(true);
  };

  const handlePaymentMethodSelect = (method) => {
    setFormData(prev => ({ ...prev, paymentMethod: method }));
    setPaymentMethodModalOpen(false);
    // Show QR — user pays, then manually clicks "I've paid" to enter transaction number
    setQrModalOpen(true);
  };

  // Called when user clicks "I've Paid" on the QR modal
  const handleQrPaid = () => {
    setQrModalOpen(false);
    setTransactionModalOpen(true); // ask for transaction number now
  };

  const handleTransactionSubmit = async () => {
    if (!formData.transaction.trim()) {
      setFormErrors(prev => ({ ...prev, transaction: 'Transaction number is required' }));
      return;
    }
    setTransactionModalOpen(false);
    setProcessingModalOpen(true);

    const requestId = generateRequestId();
    setNewRequestId(requestId);

    try {
      const response = await api.request('/api/requests', {
        method: 'POST',
        body: JSON.stringify({
          userName: formData.name,
          tikTok: formData.tiktok,
          whatsApp: formData.whatsapp,
            couponCode: formData.couponCode,
          transaction: formData.transaction,
          product: selectedProduct.name,
          packageName: selectedPackage?.label || selectedProduct.packages?.[0]?.label || '',
          packagePrice: selectedPackage?.price || selectedProduct.packages?.[0]?.price || selectedProduct.price,
          paymentMethod: formData.paymentMethod,
          status: 'Pending payment'
        })
      });

      if (response?.ok) {
        playCashRegister();
        Notif.requestSubmitted(selectedProduct.name);
        // Reload requests
        const requestsRes = await api.getRequests();
        if (requestsRes?.requests) {
          const wasEmpty = requests.length === 0;
          setRequests(requestsRes.requests);
          requestsRes.requests.forEach(r => {
            prevStatusRef.current[r.id || r._id] = r.status;
          });
          // First Blood — first ever order
          if (wasEmpty && requestsRes.requests.length === 1) {
            setTimeout(() => setShowFirstBlood(true), 1000);
          }
        }
        // Refresh gamification profile
        api.getGamificationProfile().then(res => { if (res?.ok) setGamProfile(res); }).catch(() => {});
      }
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  const handleProcessingComplete = () => {
    setProcessingModalOpen(false);
    // Reset form
    setFormData({ name: user?.name || '', tiktok: '', whatsapp: '', couponCode: '', transaction: '', paymentMethod: 'bank' });
    setSelectedProduct(null);
    setSelectedPackage(null);
    // Show success message
    alert('Your request has been submitted! The admin will review it shortly.');
  };

  const handleLogout = () => {
    stopBgSound();
    logout();
    navigate('/');
  };

  const handleOpenProfile = () => {
    setProfileForm({
      displayName: user?.profile?.displayName || user?.name || '',
      uid:         user?.profile?.uid || '',
      gameId:      user?.profile?.gameId || '',
      tiktok:      user?.profile?.tiktok || '',
      whatsapp:    user?.profile?.whatsapp || '',
      birthday:    user?.profile?.birthday || '',
      avatarUrl:   user?.profile?.avatarUrl || ''
    });
    setProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    try {
      await api.updateProfile(profileForm);
      Notif.profileSaved();
      setProfileOpen(false);
      // Refresh user data
      const res = await api.me();
      if (res?.user) {
        // Update local state — AuthContext doesn't expose setUser, so reload
        window.location.reload();
      }
    } catch (e) {
      Notif.error('Failed to save profile');
    } finally {
      setProfileSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="app-shell">
        <div className="center-content">
          <div className="panel">
            <h2>Please log in to continue</h2>
            <Button variant="primary" onClick={() => navigate('/login')}>
              Go to login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const userRequests = requests;

  // Flash sale helper
  const getFlashSale = (product) => {
    const name = product?.name || '';
    const id = String(product?._id || product?.id || '');
    return flashSales.find(s => s.productId === id || s.productName === name || s.productId === name);
  };

  return (
    <div className="app-shell">
      {/* Subtle animated background */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 20% 20%, rgba(230,57,70,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)'
      }} />
      {/* Announcement banner */}
      {appSettings?.announcement && (
        <div style={{
          padding: '12px 18px',
          background: 'linear-gradient(135deg, rgba(230,57,70,0.15), rgba(230,57,70,0.08))',
          border: '1px solid rgba(230,57,70,0.3)',
          borderRadius: '10px',
          fontSize: '0.9rem',
          color: '#ffaaaa',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <i className="fas fa-bullhorn" style={{ color: 'var(--primary)' }} />
          {appSettings.announcement}
        </div>
      )}

      {/* Loss aversion hooks */}
      {gamProfile && (() => {
        const warnings = [];
        // Streak about to break
        if (gamProfile.streakCount >= 3 && gamProfile.canCheckIn) {
          warnings.push({ icon: '🔥', msg: `Your ${gamProfile.streakCount}-day streak will reset if you don't check in today!`, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)' });
        }
        // Wallet balance unused
        if ((gamProfile.walletBalance || 0) >= 30) {
          warnings.push({ icon: '💰', msg: `You have Rs ${gamProfile.walletBalance} in your wallet — use it on your next order!`, color: '#4ade80', bg: 'rgba(74,222,128,0.08)', border: 'rgba(74,222,128,0.25)' });
        }
        if (warnings.length === 0) return null;
        return warnings.map((w, i) => (
          <div key={i} style={{
            padding: '10px 16px', borderRadius: '10px',
            background: w.bg, border: `1px solid ${w.border}`,
            fontSize: '0.85rem', color: w.color, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '1.1rem' }}>{w.icon}</span>
            {w.msg}
          </div>
        ));
      })()}

      <header className="topbar panel">
        <div className="brand">
          <img src="/logo.png" alt="Logo" style={{ height: '48px', width: '48px', objectFit: 'contain' }} />
          <div>
            <div className="brand-title">My Dashboard</div>
            <div className="brand-subtitle">Welcome, {user.name}</div>
          </div>
        </div>

        <div className="topbar-actions">
          {/* Notification button */}
          <button
            onClick={() => {
              setNotificationPanelOpen(true);
              loadNotificationCount(); // Refresh count when opened
            }}
            title="Notifications"
            style={{
              background: unreadNotificationCount > 0 ? 'rgba(230,57,70,0.15)' : 'none',
              border: `1px solid ${unreadNotificationCount > 0 ? 'rgba(230,57,70,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius:'8px', 
              color: unreadNotificationCount > 0 ? 'var(--primary)' : 'var(--muted)',
              padding:'8px 12px', cursor:'pointer', fontSize:'1rem', transition:'all 0.2s',
              position: 'relative', display: 'flex', alignItems: 'center', gap: '6px'
            }}
          >
            <i className="fas fa-bell" />
            {unreadNotificationCount > 0 && (
              <span style={{
                position: 'absolute', top: '-2px', right: '-2px',
                background: 'var(--primary)', color: '#fff',
                fontSize: '0.7rem', fontWeight: 700,
                padding: '2px 6px', borderRadius: '10px',
                minWidth: '18px', textAlign: 'center',
                lineHeight: 1
              }}>
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowSpinWheel(true)}
            title="Daily Spin Wheel"
            style={{ background:'linear-gradient(135deg,rgba(230,57,70,0.2),rgba(230,57,70,0.1))', border:'1px solid rgba(230,57,70,0.4)', borderRadius:'8px', color:'#fff', padding:'8px 14px', cursor:'pointer', fontSize:'0.82rem', fontWeight:700, fontFamily:"'Orbitron',sans-serif", letterSpacing:'1px', transition:'all 0.2s' }}
          >
            🎰 SPIN
          </button>
          {/* VIP button */}
          <button
            onClick={() => setVipModalOpen(true)}
            title={isVip ? 'VIP Active — Ad-Free' : 'Go VIP — Remove Ads'}
            style={{
              background: isVip
                ? 'linear-gradient(135deg,rgba(251,191,36,0.25),rgba(251,191,36,0.1))'
                : 'rgba(255,255,255,0.04)',
              border: isVip ? '1px solid rgba(251,191,36,0.5)' : '1px solid rgba(255,255,255,0.1)',
              borderRadius:'8px', color: isVip ? '#fbbf24' : 'var(--muted)',
              padding:'8px 14px', cursor:'pointer', fontSize:'0.82rem', fontWeight:700,
              fontFamily:"'Orbitron',sans-serif", letterSpacing:'1px', transition:'all 0.2s',
              display:'flex', alignItems:'center', gap:'6px'
            }}
          >
            ⭐ {isVip ? 'VIP' : 'Go VIP'}
          </button>
          <button
            onClick={() => { const v = !soundOn; setSoundOn(v); setSoundEnabled(v); }}
            title={soundOn ? 'Mute sounds' : 'Enable sounds'}
            style={{ background:'none', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color: soundOn ? '#fbbf24' : 'var(--muted)', padding:'8px 12px', cursor:'pointer', fontSize:'1rem', transition:'all 0.2s' }}
          >
            <i className={`fas ${soundOn ? 'fa-volume-high' : 'fa-volume-xmark'}`} />
          </button>
          <button
            onClick={() => {
              if (bgOn) {
                stopBgSound(); setBgOn(false);
                try { localStorage.setItem('bg_sound', '0'); } catch {}
              } else {
                startBgSound(); setBgOn(true);
                try { localStorage.setItem('bg_sound', '1'); } catch {}
              }
            }}
            title={bgOn ? 'Stop ambient music' : 'Play ambient background music'}
            style={{
              background: bgOn ? 'rgba(167,139,250,0.15)' : 'none',
              border: `1px solid ${bgOn ? 'rgba(167,139,250,0.4)' : 'rgba(255,255,255,0.1)'}`,
              borderRadius:'8px', color: bgOn ? '#a78bfa' : 'var(--muted)',
              padding:'8px 12px', cursor:'pointer', fontSize:'1rem', transition:'all 0.2s',
              display: 'flex', alignItems: 'center', gap: '5px'
            }}
          >
            <i className="fas fa-music" />
            {bgOn && <span style={{ fontSize: '0.65rem', fontWeight: 700, fontFamily: "'Orbitron',sans-serif", letterSpacing: '1px' }}>ON</span>}
          </button>
          <Button variant="ghost" onClick={handleOpenProfile}>
            <i className="fas fa-user" /> Profile
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '6px', borderBottom: '1px solid var(--line)', paddingBottom: '0' }}>
        {[
          { id: 'store', icon: 'fa-gamepad', label: 'Store' },
          { id: 'squad', icon: 'fa-users', label: 'Squad' },
          { id: 'gift', icon: 'fa-gift', label: 'Gift' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === tab.id ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted)',
              padding: '10px 20px',
              fontFamily: "'Orbitron', sans-serif",
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <i className={`fas ${tab.icon}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── STORE TAB ── */}
      {activeTab === 'store' && (<>

      {/* First Blood overlay */}
      {showFirstBlood && <FirstBlood onDismiss={() => setShowFirstBlood(false)} />}

      {/* Spin Wheel overlay */}
      {showSpinWheel && (
        <SpinWheel
          onClose={() => setShowSpinWheel(false)}
          onReward={(prize) => {
            // Refresh wallet after reward
            setTimeout(() => api.getGamificationProfile().then(res => { if (res?.ok) setGamProfile(res); }).catch(() => {}), 1000);
          }}
        />
      )}

      {/* Event banner — Saturday Night Drop */}
      {(() => {
        const now = new Date();
        const day = now.getDay(); // 6 = Saturday
        const hour = now.getHours();
        const isEventTime = (day === 6 && hour >= 21) || (day === 0 && hour < 0); // Sat 9PM+
        const isDashain = false; // set true during Dashain
        if (!isEventTime && !isDashain) return null;
        return (
          <div style={{
            padding: '12px 18px',
            background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(230,57,70,0.1))',
            border: '1px solid rgba(251,191,36,0.4)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', gap: '12px',
            animation: 'border-glow 2s ease-in-out infinite'
          }}>
            <span style={{ fontSize: '1.4rem' }}>🌙</span>
            <div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.8rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '2px' }}>
                SATURDAY NIGHT DROP
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '2px' }}>
                Special prices active until midnight — grab your package now!
              </div>
            </div>
          </div>
        );
      })()}

      {/* Trust bar */}
      <div style={{
        display: 'flex', gap: '20px', flexWrap: 'wrap',
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '10px',
        fontSize: '0.78rem', color: 'var(--muted)'
      }}>
        {[
          { icon: 'fa-circle-check', color: '#4ade80', label: '98.7% Success Rate' },
          { icon: 'fa-bolt',         color: '#fbbf24', label: 'Avg 8 min delivery' },
          { icon: 'fa-shield-halved',color: '#60a5fa', label: '100% Secure Payment' },
          { icon: 'fa-users',        color: '#a78bfa', label: '10,000+ Players Served' },
        ].map(t => (
          <span key={t.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <i className={`fas ${t.icon}`} style={{ color: t.color }} />
            {t.label}
          </span>
        ))}
      </div>

      {/* Quick Reorder */}
      {gamProfile?.lastOrder && (
        <QuickReorder
          lastOrder={gamProfile.lastOrder}
          onReorder={() => {
            const p = products.find(x => x.name === gamProfile.lastOrder.product);
            if (p) handleBuyClick(p);
          }}
        />
      )}

      <section className="hero-grid">
        <div className="panel hero-copy">
          <span className="eyebrow">Your Account</span>
          <h1>Browse products and track your requests.</h1>
          <p>
            Select a product to begin the payment process. You'll complete a QR payment, wait for admin review, and receive your key.
          </p>
        </div>

        <aside className="panel side-panel">
          {/* Player Card */}
          <PlayerCard user={user} />

          {/* Status badges */}
          {gamProfile && (() => {
            const badges = [];
            if ((gamProfile.totalSpend || 0) >= 5000) badges.push({ icon: '🐐', label: 'Top Buyer', color: '#fbbf24' });
            if ((gamProfile.totalSpend || 0) >= 2000) badges.push({ icon: '💰', label: 'Big Spender', color: '#4ade80' });
            if ((gamProfile.streakCount || 0) >= 7)   badges.push({ icon: '🔥', label: 'Streak Master', color: '#f59e0b' });
            if ((gamProfile.referralCount || 0) >= 5) badges.push({ icon: '⚡', label: 'Squad Leader', color: '#60a5fa' });
            if (gamProfile.partnerBadge)               badges.push({ icon: '⭐', label: 'Partner', color: '#a78bfa' });
            if (badges.length === 0) return null;
            return (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                {badges.map(b => (
                  <span key={b.label} style={{
                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                    padding: '4px 10px', borderRadius: '999px',
                    background: `${b.color}18`, border: `1px solid ${b.color}44`,
                    fontSize: '0.72rem', fontWeight: 700, color: b.color,
                    fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.5px'
                  }}>
                    {b.icon} {b.label}
                  </span>
                ))}
              </div>
            );
          })()}
        </aside>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Your Requests</h2>
            <span>{userRequests.length} total</span>
          </div>
          <Input
            label="Coupon / Referral Code"
            name="couponCode"
            placeholder="Optional - enter code if you have one"
            value={formData.couponCode}
            onChange={handleFormChange}
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '6px', marginBottom: '12px' }}>
            Referral codes give the owner Rs 30 credit after the request is approved.
          </p>
          {userRequests.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No requests yet</p>
          ) : (
            <div className="request-list">
              {userRequests.map(request => {
                const reqId = request.id || request._id;
                const isAccepted = request.status?.toLowerCase().includes('accept');
                const isPending = request.status?.toLowerCase().includes('pending') || request.status?.toLowerCase().includes('awaiting');
                const hasKey = isAccepted && request.notes;
                
                // Calculate remaining time for pending payments
                const createdAt = new Date(request.createdAt);
                // Prefer server-stored expiryTime; fall back to createdAt + 2h
                const expiryTime = request.expiryTime
                  ? new Date(request.expiryTime)
                  : new Date(createdAt.getTime() + 2 * 60 * 60 * 1000);
                const now = new Date();
                const remainingMs = expiryTime - now;
                const remainingMinutes = Math.max(0, Math.ceil(remainingMs / (1000 * 60)));
                const isExpired = remainingMs <= 0;
                
                return (
                  <div key={reqId} className="request-row">
                    <div>
                      <strong>{request.product}</strong>
                      {request.packageName && <p>{request.packageName}</p>}
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{reqId}</p>
                      
                      {/* Payment countdown for pending orders */}
                      {isPending && !isExpired && (
                        <div style={{
                          marginTop: '6px',
                          padding: '4px 8px',
                          background: remainingMinutes <= 30 ? 'rgba(230,57,70,0.1)' : 'rgba(251,191,36,0.1)',
                          border: `1px solid ${remainingMinutes <= 30 ? 'rgba(230,57,70,0.3)' : 'rgba(251,191,36,0.3)'}`,
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: remainingMinutes <= 30 ? '#ff6b6b' : '#fbbf24',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <i className="fas fa-clock" />
                          {remainingMinutes > 60 
                            ? `${Math.floor(remainingMinutes / 60)}h ${remainingMinutes % 60}m left`
                            : `${remainingMinutes}m left to pay`
                          }
                        </div>
                      )}
                      
                      {isPending && isExpired && (
                        <div style={{
                          marginTop: '6px',
                          padding: '4px 8px',
                          background: 'rgba(230,57,70,0.15)',
                          border: '1px solid rgba(230,57,70,0.4)',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          color: '#ff6b6b',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <i className="fas fa-exclamation-triangle" />
                          Payment window expired
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <Badge variant={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <p style={{ fontSize: '12px', marginTop: '4px', color: 'var(--text-secondary)' }}>
                        {formatDate(request.updatedAt)}
                      </p>
                      {hasKey && <LootBox requestId={reqId} keyText={request.notes} />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-header">
            <h2>Available Products</h2>
            <span>{products.length} products</span>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>No products available</p>
            </div>
          ) : (
            <div className="card-grid">
              {products.map((product) => {
                // Top-up products (memberships/diamonds) get NO discounts, flash sales, or hype
                const isTopup = product.category === 'Top-up' ||
                  /weekly|monthly|diamond|membership/i.test(product.name);

                const hype = isTopup ? 0 : (hypeData[product.name] || 0);
                const flashSale = isTopup ? null : getFlashSale(product);
                const boughtToday = socialProof[product.name] || 0;
                // Fake-floor the count to make it feel alive even with few real orders
                const displayCount = boughtToday > 0 ? boughtToday + Math.floor(Math.random() * 15 + 5) : 0;
                const isLimited = product.status === 'Limited';
                return (
                  <article key={product.id || product._id} className="product-card">
                    {product.img && (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={product.img}
                          alt={product.name}
                          style={{ width: '100%', height: '190px', objectFit: 'cover', borderRadius: '18px' }}
                        />
                        {hype > 70 && (
                          <span style={{
                            position: 'absolute', top: '10px', right: '10px',
                            background: 'rgba(230,57,70,0.9)', color: '#fff',
                            padding: '3px 10px', borderRadius: '20px',
                            fontSize: '0.72rem', fontFamily: "'Orbitron',sans-serif",
                            fontWeight: 700, letterSpacing: '1px',
                            boxShadow: '0 0 10px rgba(230,57,70,0.6)'
                          }}>🔥 HOT</span>
                        )}
                        {flashSale && (
                          <span style={{
                            position: 'absolute', top: '10px', left: '10px',
                            background: 'var(--primary)', color: '#fff',
                            padding: '3px 10px', borderRadius: '20px',
                            fontSize: '0.72rem', fontFamily: "'Orbitron',sans-serif",
                            fontWeight: 700, letterSpacing: '1px',
                            animation: 'flash-pulse 1.5s ease-in-out infinite'
                          }}>⚡ -{flashSale.discountPercent}%</span>
                        )}
                        {isLimited && (
                          <span style={{
                            position: 'absolute', bottom: '10px', left: '10px',
                            background: 'rgba(245,158,11,0.9)', color: '#000',
                            padding: '3px 10px', borderRadius: '20px',
                            fontSize: '0.7rem', fontFamily: "'Orbitron',sans-serif",
                            fontWeight: 700, letterSpacing: '1px',
                            animation: 'flash-pulse 2s ease-in-out infinite'
                          }}>⚠️ LIMITED STOCK</span>
                        )}
                      </div>
                    )}
                    <div className="product-head">
                      <div>
                        <h3>{product.name}</h3>
                        <Badge variant="success">{product.status}</Badge>
                      </div>
                      <div>
                        {flashSale ? (
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ textDecoration: 'line-through', color: 'var(--muted)', fontSize: '0.8rem' }}>{product.price}</span>
                            <div className="price-chip" style={{ color: 'var(--primary)' }}>
                              SALE -{flashSale.discountPercent}%
                            </div>
                          </div>
                        ) : (
                          <div className="price-chip">{product.price}</div>
                        )}
                      </div>
                    </div>

                    {/* Social proof */}
                    {displayCount > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>
                        <i className="fas fa-fire" style={{ fontSize: '0.7rem' }} />
                        {displayCount} people bought this today
                      </div>
                    )}

                    {hype > 0 && (
                      <div style={{ marginBottom: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '4px', fontFamily: "'Orbitron',sans-serif", letterSpacing: '1px' }}>
                          <span>HYPE</span>
                          <span style={{ color: hype > 70 ? 'var(--primary)' : 'var(--muted)' }}>{hype}%</span>
                        </div>
                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${hype}%`,
                            background: hype > 70 ? 'linear-gradient(90deg, var(--primary), #ff6b6b)' : 'linear-gradient(90deg, #4ade80, #22c55e)',
                            borderRadius: '4px', transition: 'width 0.8s ease',
                            boxShadow: hype > 70 ? '0 0 8px rgba(230,57,70,0.6)' : 'none'
                          }} />
                        </div>
                      </div>
                    )}
                    {flashSale && <FlashCountdown endsAt={flashSale.endsAt} />}
                    <p>{product.description}</p>

                    {/* Trust signals */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--muted)' }}>
                      <span><i className="fas fa-shield-halved" style={{ color: '#4ade80', marginRight: '4px' }} />Verified Safe</span>
                      <span><i className="fas fa-bolt" style={{ color: '#fbbf24', marginRight: '4px' }} />Fast Delivery</span>
                      <span><i className="fas fa-headset" style={{ color: '#60a5fa', marginRight: '4px' }} />24/7 Support</span>
                    </div>

                    {Array.isArray(product.packages) && product.packages.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {product.packages.slice(0, 3).map((pkg) => (
                          <span key={`${product.id || product._id}-${pkg.label}`} className="badge badge-default">
                            {pkg.label} · Rs {pkg.price}
                          </span>
                        ))}
                      </div>
                    )}
                    <Button
                      variant="primary"
                      icon={<ChevronRightIcon />}
                      onClick={() => handleBuyClick(product)}
                    >
                      Buy now
                    </Button>
                    {/* Price drop notify */}
                    <button
                      onClick={() => toggleWatch(product.name)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: '0.72rem', color: watchlist.includes(product.name) ? '#fbbf24' : 'var(--muted)',
                        display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0',
                        transition: 'color 0.2s'
                      }}
                    >
                      <i className={`fas ${watchlist.includes(product.name) ? 'fa-bell' : 'fa-bell-slash'}`} />
                      {watchlist.includes(product.name) ? 'Watching for price drop' : 'Notify me if price drops'}
                    </button>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── YOU MIGHT LIKE ── */}
      {requests.length > 0 && products.length > 0 && (() => {
        const lastProduct = requests[0]?.product || '';
        const isTopup = lastProduct.toLowerCase().includes('diamond') || lastProduct.toLowerCase().includes('weekly') || lastProduct.toLowerCase().includes('monthly');
        const isPanel = !isTopup;
        const suggestions = products.filter(p => {
          if (isTopup) return p.category === 'Top-up' && p.name !== lastProduct;
          if (isPanel) return p.category === 'Top-up';
          return false;
        }).slice(0, 3);
        if (suggestions.length === 0) return null;
        return (
          <div className="panel">
            <div className="panel-header">
              <h2>⚡ You Might Like</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Based on your orders</span>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {suggestions.map(p => (
                <button
                  key={p.id || p._id}
                  onClick={() => handleBuyClick(p)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 14px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)',
                    color: 'var(--text)', cursor: 'pointer', transition: 'all 0.2s',
                    flex: '1', minWidth: '160px'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'rgba(230,57,70,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                >
                  {p.img && <img src={p.img} alt={p.name} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />}
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{p.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>{p.price}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ── AD SLOT — between products and squad ── */}
      <AdBanner slot="dashboard-mid" onVipClick={() => setVipModalOpen(true)} />

      

      </>)}

      {/* ── SQUAD TAB ── */}
      {activeTab === 'squad' && (
        <section style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="panel">
              <div className="panel-header"><h2>Your Referral Code</h2></div>
              {referralCode ? (
                <div>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.3)',
                    borderRadius: '10px', padding: '14px 16px', marginBottom: '12px'
                  }}>
                    <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '4px', flex: 1 }}>
                      {referralCode}
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(referralCode); Notif.copied(); }}
                      style={{ background: 'none', border: '1px solid rgba(230,57,70,0.4)', color: 'var(--primary)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 700 }}
                    >
                      <i className="fas fa-copy" /> COPY
                    </button>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>Share this code. You earn Rs 30 each time someone uses it.</p>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Loading your code...</p>
              )}
            </div>

            <div className="panel">
              <div className="panel-header"><h2>Wallet</h2></div>
              <div style={{ fontSize: '2rem', fontFamily: "'Orbitron',sans-serif", fontWeight: 900, color: '#4ade80', marginBottom: '8px' }}>
                Rs {referralStats.walletBalance}
              </div>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '16px' }}>Earned from referrals</p>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--muted)', marginBottom: '6px' }}>
                  <span>Referrals: {referralStats.referralCount}/10 to Partner</span>
                  {referralStats.partnerBadge && <span style={{ color: 'var(--primary)', fontWeight: 700 }}>⭐ PARTNER</span>}
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${Math.min((referralStats.referralCount / 10) * 100, 100)}%`,
                    background: 'linear-gradient(90deg, var(--primary), #ff6b6b)',
                    borderRadius: '6px', transition: 'width 0.8s ease'
                  }} />
                </div>
                {referralStats.partnerBadge && (
                  <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700, textAlign: 'center' }}>
                    ⭐ PARTNER BADGE EARNED
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="panel">
              <div className="panel-header"><h2>Apply a Code</h2></div>
              <p style={{ color: 'var(--muted)', fontSize: '0.82rem', marginBottom: '14px' }}>Enter a friend's referral code to support them.</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  placeholder="e.g. ABC123"
                  value={applyCodeInput}
                  onChange={e => { setApplyCodeInput(e.target.value.toUpperCase()); setApplyCodeMsg(''); }}
                  style={{ flex: 1 }}
                />
                <Button variant="primary" onClick={handleApplyCode} disabled={applyCodeLoading}>
                  {applyCodeLoading ? '...' : 'Apply'}
                </Button>
              </div>
              {applyCodeMsg && (
                <p style={{ marginTop: '10px', fontSize: '0.85rem', color: applyCodeMsg.startsWith('✅') ? '#4ade80' : '#ff6b6b' }}>
                  {applyCodeMsg}
                </p>
              )}
            </div>

            <div className="panel">
              <div className="panel-header"><h2>🏆 Squad Leaderboard</h2></div>
              {leaderboard.length === 0 ? (
                <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No referrals yet. Be the first!</p>
              ) : leaderboard.map((leader, i) => (
                <div key={leader._id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 0', borderBottom: i < leaderboard.length - 1 ? '1px solid var(--line)' : 'none' }}>
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '1rem', fontWeight: 900, color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : 'var(--muted)', width: '24px', textAlign: 'center' }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ color: '#fff', fontSize: '0.9rem' }}>{leader.name}</strong>
                    {leader.partnerBadge && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: 'var(--primary)' }}>⭐ PARTNER</span>}
                  </div>
                  <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.85rem' }}>{leader.referralCount} refs</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── GIFT TAB ── */}
      {activeTab === 'gift' && (
        <section style={{ display: 'grid', gap: '16px' }}>
          <div className="panel">
            <div className="panel-header">
              <h2>🎁 Gift a Product to a Friend</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Pay for them — they get the key</span>
            </div>
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.6 }}>
              Choose a product, enter your friend's email, pay the QR, and admin will deliver the activation key directly to their account. 🎮
            </p>

            {giftMsg && (
              <div style={{ marginBottom: '14px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.85rem',
                background: giftMsg.startsWith('✅') ? 'rgba(74,222,128,0.1)' : 'rgba(230,57,70,0.1)',
                border: `1px solid ${giftMsg.startsWith('✅') ? 'rgba(74,222,128,0.3)' : 'rgba(230,57,70,0.3)'}`,
                color: giftMsg.startsWith('✅') ? '#4ade80' : '#ff6b6b'
              }}>{giftMsg}</div>
            )}

            {giftStep === 'form' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Recipient */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Friend's Email (must be registered on SUSANTEDIT) *
                  </label>
                  <input
                    value={giftForm.recipientEmail}
                    onChange={e => setGiftForm(p => ({ ...p, recipientEmail: e.target.value }))}
                    placeholder="friend@gmail.com"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Product picker */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Product *
                  </label>
                  <select
                    value={giftForm.product}
                    onChange={e => {
                      const p = products.find(x => x.name === e.target.value);
                      setGiftForm(prev => ({ ...prev, product: e.target.value, packageName: p?.packages?.[0]?.label || '', packagePrice: p?.packages?.[0]?.price || p?.price || '' }));
                    }}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  >
                    <option value="">— Select product —</option>
                    {products.map(p => <option key={p._id || p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>

                {/* Package picker */}
                {giftForm.product && (() => {
                  const p = products.find(x => x.name === giftForm.product);
                  if (!p?.packages?.length) return null;
                  return (
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Package *</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {p.packages.map(pkg => (
                          <button key={pkg.label} onClick={() => setGiftForm(prev => ({ ...prev, packageName: pkg.label, packagePrice: pkg.price }))}
                            style={{ padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s',
                              background: giftForm.packageName === pkg.label ? 'rgba(230,57,70,0.2)' : 'rgba(255,255,255,0.04)',
                              border: `1px solid ${giftForm.packageName === pkg.label ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                              color: giftForm.packageName === pkg.label ? 'var(--primary)' : 'var(--muted)'
                            }}>
                            {pkg.label} · Rs {pkg.price}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Gift message */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    Gift Message (optional)
                  </label>
                  <input
                    value={giftForm.message}
                    onChange={e => setGiftForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Happy Birthday bro! 🎮🔥"
                    maxLength={200}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Summary */}
                {giftForm.product && giftForm.packageName && (
                  <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>🎁 Gift Summary</div>
                    <div style={{ color: 'var(--muted)' }}>Product: <strong style={{ color: '#fff' }}>{giftForm.product} — {giftForm.packageName}</strong></div>
                    <div style={{ color: 'var(--muted)' }}>You pay: <strong style={{ color: 'var(--primary)' }}>Rs {giftForm.packagePrice}</strong></div>
                    <div style={{ color: 'var(--muted)' }}>Recipient: <strong style={{ color: '#fff' }}>{giftForm.recipientEmail || '—'}</strong></div>
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!giftForm.recipientEmail || !giftForm.product || !giftForm.packageName) {
                      setGiftMsg('❌ Fill in recipient email, product, and package.');
                      return;
                    }
                    setGiftMsg('');
                    setGiftStep('qr');
                  }}
                  style={{ padding: '13px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--primary), #c1121f)', color: '#fff', fontFamily: "'Orbitron',sans-serif", fontSize: '0.85rem', fontWeight: 700, letterSpacing: '1px' }}
                >
                  🎁 Continue to Payment
                </button>
              </div>
            )}

            {giftStep === 'qr' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', textAlign: 'center' }}>
                  Pay <strong style={{ color: 'var(--primary)' }}>Rs {giftForm.packagePrice}</strong> for <strong style={{ color: '#fff' }}>{giftForm.product} — {giftForm.packageName}</strong>
                </div>

                {/* Payment method */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[{ id:'esewa', label:'eSewa', color:'#60bb46' }, { id:'bank', label:'Bank', color:'#60a5fa' }].map(m => (
                    <button key={m.id} onClick={() => setGiftForm(p => ({ ...p, paymentMethod: m.id }))}
                      style={{ flex:1, padding:'10px', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'0.82rem', transition:'all 0.2s',
                        background: giftForm.paymentMethod === m.id ? `${m.color}22` : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${giftForm.paymentMethod === m.id ? m.color : 'rgba(255,255,255,0.1)'}`,
                        color: giftForm.paymentMethod === m.id ? m.color : 'var(--muted)'
                      }}>
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* QR */}
                <QrDisplay
                  src={giftForm.paymentMethod === 'esewa' ? (appSettings?.qrEsewa || '/payment.jpeg') : (appSettings?.qrBank || '/bank.jpg')}
                  label={giftForm.paymentMethod === 'esewa' ? 'eSewa' : 'NMB Bank'}
                  amount={`Rs ${giftForm.packagePrice}`}
                  color={giftForm.paymentMethod === 'esewa' ? '#60bb46' : '#60a5fa'}
                  filename={`susantedit-gift-${giftForm.paymentMethod}-qr.jpeg`}
                  remark={user?.name || ''}
                />

                {/* Transaction input */}
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>Transaction Number *</label>
                  <input
                    value={giftForm.transaction}
                    onChange={e => setGiftForm(p => ({ ...p, transaction: e.target.value }))}
                    placeholder="e.g. ESW123456789"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setGiftStep('form')}
                    style={{ flex:1, padding:'12px', borderRadius:'8px', border:'1px solid rgba(255,255,255,0.1)', background:'none', color:'var(--muted)', cursor:'pointer', fontSize:'0.85rem' }}>
                    ← Back
                  </button>
                  <button
                    disabled={giftLoading || !giftForm.transaction.trim()}
                    onClick={async () => {
                      setGiftLoading(true); setGiftMsg('');
                      try {
                        const res = await api.sendGift(giftForm);
                        if (res?.ok) { setGiftStep('done'); setGiftMsg('✅ ' + res.message); }
                        else setGiftMsg('❌ ' + (res?.message || 'Failed'));
                      } catch { setGiftMsg('❌ Network error'); }
                      finally { setGiftLoading(false); }
                    }}
                    style={{ flex:2, padding:'12px', borderRadius:'8px', border:'none', cursor: giftLoading ? 'default' : 'pointer',
                      background: giftLoading ? 'rgba(230,57,70,0.3)' : 'linear-gradient(135deg, var(--primary), #c1121f)',
                      color:'#fff', fontWeight:700, fontSize:'0.85rem', fontFamily:"'Orbitron',sans-serif", letterSpacing:'1px'
                    }}>
                    {giftLoading ? 'Sending...' : '🎁 Send Gift'}
                  </button>
                </div>
              </div>
            )}

            {giftStep === 'done' && (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎁</div>
                <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.9rem', fontWeight: 700, color: '#4ade80', letterSpacing: '2px', marginBottom: '8px' }}>GIFT SENT!</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6, marginBottom: '16px' }}>
                  Admin will verify payment and deliver the key to <strong style={{ color: '#fff' }}>{giftForm.recipientEmail}</strong> within 40 minutes.
                </div>
                <button onClick={() => { setGiftStep('form'); setGiftForm({ recipientEmail:'', product:'', packageName:'', packagePrice:'', transaction:'', paymentMethod:'esewa', message:'' }); setGiftMsg(''); }}
                  style={{ padding:'12px 24px', borderRadius:'8px', border:'1px solid rgba(74,222,128,0.3)', background:'rgba(74,222,128,0.1)', color:'#4ade80', cursor:'pointer', fontWeight:700, fontSize:'0.85rem' }}>
                  Send Another Gift
                </button>
              </div>
            )}
          </div>

          {/* How gifting works */}
          <div className="panel">
            <div className="panel-header"><h2>How Gifting Works</h2></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                ['1', '🎯', 'Pick a product & package for your friend'],
                ['2', '📧', 'Enter their SUSANTEDIT account email'],
                ['3', '💳', 'Scan QR and pay the amount'],
                ['4', '🔢', 'Enter your transaction number'],
                ['5', '⏳', 'Admin verifies payment (up to 40 min)'],
                ['6', '🔑', 'Key delivered to your friend\'s account automatically'],
              ].map(([num, icon, text]) => (
                <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary), #c1121f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 900, color: '#fff', flexShrink: 0, fontFamily: "'Orbitron',sans-serif" }}>{num}</div>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text)' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Buy Confirmation Modal */}
      <Modal
        isOpen={buyModalOpen}
        onClose={() => setBuyModalOpen(false)}
        title="Confirm Purchase"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setBuyModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmBuy}>
              Continue
            </Button>
          </div>
        }
      >
        {selectedProduct && (
          <div>
            <p>You're about to purchase:</p>
            <div style={{ margin: '16px 0', padding: '12px', backgroundColor: 'var(--panel)', borderRadius: '8px' }}>
              <h3>{selectedProduct.name}</h3>
              <p>{selectedProduct.price}</p>
            </div>
            {Array.isArray(selectedProduct.packages) && selectedProduct.packages.length > 0 && (
              <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                <strong>Select a package</strong>
                {selectedProduct.packages.map((pkg) => (
                  <button
                    key={pkg.label}
                    type="button"
                    onClick={() => handlePackageSelect(pkg)}
                    style={{
                      textAlign: 'left',
                      padding: '12px 14px',
                      borderRadius: '14px',
                      border: selectedPackage?.label === pkg.label ? '1px solid var(--primary)' : '1px solid rgba(255,255,255,0.08)',
                      background: selectedPackage?.label === pkg.label ? 'rgba(47,47,228,0.18)' : 'rgba(255,255,255,0.04)',
                      color: 'var(--text)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <span>{pkg.label}</span>
                      <strong>Rs {pkg.price}</strong>
                    </div>
                    {pkg.originalPrice && (
                      <p style={{ marginTop: '4px', color: 'var(--text-secondary)', fontSize: '12px' }}>
                        Original Rs {pkg.originalPrice}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              This will start a payment request that requires manual admin approval.
            </p>
          </div>
        )}
      </Modal>

      {/* Payment Window Warning Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Payment Window"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setConfirmModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleProceedToForm}>
              Proceed
            </Button>
          </div>
        }
      >
        {(() => {
          const now = new Date();
          
          // Dynamic payment window: current time + 2 hours
          const startTime = new Date(now);
          const endTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // +2 hours

          const fmt = (d) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          const startStr = fmt(startTime);
          const endStr = fmt(endTime);

          const userTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
          const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;

          return (
            <div>
              <div style={{
                padding: '14px', borderRadius: '10px', marginBottom: '14px',
                background: 'rgba(74,222,128,0.08)',
                border: '1px solid rgba(74,222,128,0.3)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1.3rem' }}>🟢</span>
                  <div>
                    <strong style={{ color: '#4ade80', fontSize: '0.95rem' }}>
                      Payment Window is OPEN
                    </strong>
                    <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '2px' }}>
                      Your time: <strong style={{ color: 'var(--text)' }}>{userTime}</strong>
                      {' '}· {userTZ}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                  ⏰ Payment Window: <strong style={{ color: '#4ade80' }}>{startStr}</strong>
                  {' → '}
                  <strong style={{ color: '#ff6b6b' }}>{endStr}</strong>
                  <div style={{ marginTop: '6px', fontSize: '0.78rem', color: '#fbbf24', fontWeight: 600 }}>
                    ⚡ You have 2 hours from now to complete your payment
                  </div>
                </div>
                <div style={{ marginTop: '8px', fontSize: '0.82rem', color: '#ff6b6b', fontWeight: 600 }}>
                  ⚠️ Payments made after {endStr} will be rejected automatically.
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '10px' }}>Next steps:</p>
              <ul style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '4px', listStyle: 'none' }}>
                {[
                  ['📝', 'Enter your details'],
                  ['📱', 'Scan the QR code and pay'],
                  ['🔢', 'Enter your transaction number'],
                  ['⏳', 'Wait for admin review (up to 40 min)'],
                  ['🔑', 'Receive your key/message'],
                ].map(([icon, text]) => (
                  <li key={text} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text)' }}>
                    <span>{icon}</span>{text}
                  </li>
                ))}
              </ul>
            </div>
          );
        })()}
      </Modal>

      {/* Request Form Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title="Complete Your Details"
        size="sm"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setFormModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitForm}>
              Next: QR Payment
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitForm}>
          <Input
            label={appSettings?.labels?.fullName || 'Full Name'}
            name="name"
            value={formData.name}
            onChange={handleFormChange}
            required
            error={formErrors.name}
          />
          <Input
            label={appSettings?.labels?.tiktok || 'TikTok Handle'}
            name="tiktok"
            placeholder="@yourtiktok"
            value={formData.tiktok}
            onChange={handleFormChange}
            required
            error={formErrors.tiktok}
          />
          <Input
            label={appSettings?.labels?.whatsapp || 'WhatsApp Number'}
            name="whatsapp"
            placeholder="+1234567890"
            value={formData.whatsapp}
            onChange={handleFormChange}
            required
            error={formErrors.whatsapp}
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '4px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--line)' }}>
            💡 Transaction number will be asked <strong style={{ color: 'var(--text)' }}>after</strong> you scan and pay the QR.
          </p>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '8px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--line)' }}>
            🧾 In payment remarks, write: <strong style={{ color: 'var(--text)' }}>{formData.name || user?.name || 'Your Name'}</strong>.
          </p>
        </form>
      </Modal>

      {/* Payment Method Selection Modal */}
      <Modal
        isOpen={paymentMethodModalOpen}
        onClose={() => setPaymentMethodModalOpen(false)}
        title="Select Payment Method"
        size="md"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* NMB Bank */}
          <div
            onClick={() => handlePaymentMethodSelect('bank')}
            style={{
              cursor: 'pointer', padding: '16px',
              border: formData.paymentMethod === 'bank' ? '2px solid #60a5fa' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px', backgroundColor: 'var(--panel)',
              transition: 'all 0.2s ease', textAlign: 'center',
              background: formData.paymentMethod === 'bank' ? 'rgba(96,165,250,0.08)' : 'var(--panel)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#60a5fa'; e.currentTarget.style.background = 'rgba(96,165,250,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = formData.paymentMethod === 'bank' ? '#60a5fa' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = formData.paymentMethod === 'bank' ? 'rgba(96,165,250,0.08)' : 'var(--panel)'; }}
          >
            {/* NMB Logo */}
            <div style={{ width: '100%', height: '90px', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
              <img src="/nmblogo.webp" alt="NMB Bank" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <i className="fas fa-building-columns" style={{ fontSize: '2rem', color: '#60a5fa' }} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: '#fff' }}>Bank Transfer</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>NMB Bank · Direct transfer</p>
            {formData.paymentMethod === 'bank' && (
              <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#60a5fa', fontWeight: 700 }}>✓ SELECTED</div>
            )}
          </div>

          {/* eSewa */}
          <div
            onClick={() => handlePaymentMethodSelect('esewa')}
            style={{
              cursor: 'pointer', padding: '16px',
              border: formData.paymentMethod === 'esewa' ? '2px solid #60bb46' : '1px solid rgba(255,255,255,0.1)',
              borderRadius: '14px', backgroundColor: 'var(--panel)',
              transition: 'all 0.2s ease', textAlign: 'center',
              background: formData.paymentMethod === 'esewa' ? 'rgba(96,187,70,0.08)' : 'var(--panel)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#60bb46'; e.currentTarget.style.background = 'rgba(96,187,70,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = formData.paymentMethod === 'esewa' ? '#60bb46' : 'rgba(255,255,255,0.1)'; e.currentTarget.style.background = formData.paymentMethod === 'esewa' ? 'rgba(96,187,70,0.08)' : 'var(--panel)'; }}
          >
            {/* eSewa Logo */}
            <div style={{ width: '100%', height: '90px', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
              <img src="/eswalogo.png" alt="eSewa" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
              />
              <div style={{ display: 'none', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                <i className="fas fa-mobile-screen" style={{ fontSize: '2rem', color: '#60bb46' }} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: '0.95rem', color: '#fff' }}>eSewa</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>eSewa digital wallet</p>
            {formData.paymentMethod === 'esewa' && (
              <div style={{ marginTop: '8px', fontSize: '0.7rem', color: '#60bb46', fontWeight: 700 }}>✓ SELECTED</div>
            )}
          </div>
        </div>
        <div style={{ marginTop: '14px', padding: '10px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', fontSize: '0.82rem', color: 'var(--muted)' }}>
          💡 Add this exact payment remark before paying: <strong style={{ color: 'var(--text)' }}>{formData.name || user?.name || 'Your Name'}</strong>
        </div>
      </Modal>

      {/* QR Payment Modal */}
      <Modal
        isOpen={qrModalOpen}
        onClose={() => {}}
        title={formData.paymentMethod === 'esewa' ? '📱 eSewa Payment QR' : '🏦 Bank Transfer QR'}
        size="md"
      >
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>

          {/* Payment method badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 14px', borderRadius: '999px',
            background: formData.paymentMethod === 'esewa' ? 'rgba(96,187,70,0.15)' : 'rgba(96,165,250,0.15)',
            border: `1px solid ${formData.paymentMethod === 'esewa' ? 'rgba(96,187,70,0.4)' : 'rgba(96,165,250,0.4)'}`,
            fontSize: '0.82rem', fontWeight: 700,
            color: formData.paymentMethod === 'esewa' ? '#60bb46' : '#60a5fa'
          }}>
            <img
              src={formData.paymentMethod === 'esewa' ? '/eswalogo.png' : '/nmblogo.webp'}
              alt={formData.paymentMethod === 'esewa' ? 'eSewa' : 'NMB Bank'}
              style={{ height: '18px', width: 'auto', objectFit: 'contain' }}
            />
            {formData.paymentMethod === 'esewa' ? 'eSewa' : 'NMB Bank Transfer'}
          </div>

          {/* Animated QR with download */}
          <QrDisplay
            src={formData.paymentMethod === 'esewa'
              ? (appSettings?.qrEsewa || '/payment.jpeg')
              : (appSettings?.qrBank  || '/bank.jpg')}
            label={formData.paymentMethod === 'esewa' ? 'eSewa' : 'NMB Bank'}
            amount={`Rs ${selectedPackage?.price || selectedProduct?.price || '—'}`}
            color={formData.paymentMethod === 'esewa' ? '#60bb46' : '#60a5fa'}
            filename={`susantedit-${formData.paymentMethod}-qr.jpeg`}
            remark={formData.name || user?.name || ''}
          />

          {/* Amount + instruction */}
          <div style={{
            padding: '12px 16px', width: '100%',
            background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)',
            borderRadius: '10px', fontSize: '0.88rem', color: 'var(--text)',
          }}>
            {formData.paymentMethod === 'esewa'
              ? '📱 Open eSewa → Scan QR → Pay'
              : '🏦 Open your bank app → Scan QR → Pay'}
            <div style={{ marginTop: '6px', fontSize: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
              Amount: Rs {selectedPackage?.price || selectedProduct?.price || '—'}
            </div>
          </div>

          <Button variant="primary" style={{ width: '100%' }} onClick={handleQrPaid}>
            <i className="fas fa-check" /> I've Paid — Enter Transaction Number
          </Button>
        </div>
      </Modal>

      {/* Transaction Number Modal — shown AFTER payment */}
      <Modal
        isOpen={transactionModalOpen}
        onClose={() => {}}
        title="Enter Transaction Number"
        size="sm"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => { setTransactionModalOpen(false); setQrModalOpen(true); }}>
              ← Back to QR
            </Button>
            <Button variant="primary" onClick={handleTransactionSubmit}>
              Submit Request
            </Button>
          </div>
        }
      >
        <div>
          <div style={{
            padding: '12px 14px',
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '8px',
            fontSize: '0.85rem',
            color: '#4ade80',
            marginBottom: '16px'
          }}>
            ✅ Payment done! Now enter the reference/transaction number you received from your payment app.
          </div>
          <Input
            label={appSettings?.labels?.transaction || 'Transaction / Reference Number'}
            name="transaction"
            placeholder="e.g. TXN123456789 or receipt number"
            value={formData.transaction}
            onChange={handleFormChange}
            required
            error={formErrors.transaction}
          />
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '8px' }}>
            This is the number shown in your eSewa / bank app after a successful payment.
          </p>
          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: '8px' }}>
            If asked for payment note/remark, always use your profile name: <strong style={{ color: 'var(--text)' }}>{formData.name || user?.name || 'Your Name'}</strong>
          </p>
        </div>
      </Modal>

      {/* Processing Modal */}
      <Modal
        isOpen={processingModalOpen}
        onClose={() => {}}
        title="Request Submitted"
        size="md"
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            border: '4px solid rgba(230,57,70,0.15)',
            borderTop: '4px solid var(--primary)',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <h3 style={{ marginBottom: '12px', fontSize: '1.1rem' }}>Awaiting admin review</h3>
          <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.7 }}>
            Your payment request has been submitted.<br />
            Admin review takes up to <strong style={{ color: 'var(--text)' }}>40 minutes</strong>.<br />
            You'll see your key here once approved.
          </p>
          <div style={{ marginTop: '20px', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--line)', borderRadius: '10px', fontSize: '12px', color: 'var(--muted)' }}>
            Request ID: <code style={{ color: 'var(--text)' }}>{newRequestId}</code>
          </div>
          <Button variant="primary" style={{ width: '100%', marginTop: '20px' }} onClick={handleProcessingComplete}>
            Got it — close
          </Button>
        </div>
      </Modal>

      {/* Profile Modal */}
      <Modal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
        title="My Profile"
        size="md"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="ghost" onClick={() => setProfileOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveProfile} disabled={profileSaving}>
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        }
      >
        <div>
          <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '16px', lineHeight: 1.6 }}>
            Save your details here and they'll auto-fill the purchase form every time.
          </p>
          <Input
            label="Display Name"
            placeholder="Your name"
            value={profileForm.displayName}
            onChange={e => setProfileForm(p => ({ ...p, displayName: e.target.value }))}
          />
          <Input
            label="UID / Player ID"
            placeholder="Your in-game UID"
            value={profileForm.uid}
            onChange={e => setProfileForm(p => ({ ...p, uid: e.target.value }))}
          />
          <Input
            label="Game ID"
            placeholder="Your game ID"
            value={profileForm.gameId}
            onChange={e => setProfileForm(p => ({ ...p, gameId: e.target.value }))}
          />
          <Input
            label="TikTok Handle"
            placeholder="@yourtiktok"
            value={profileForm.tiktok}
            onChange={e => setProfileForm(p => ({ ...p, tiktok: e.target.value }))}
          />
          <Input
            label="WhatsApp Number"
            placeholder="+977-98XXXXXXXX"
            value={profileForm.whatsapp}
            onChange={e => setProfileForm(p => ({ ...p, whatsapp: e.target.value }))}
          />
          <Input
            label="Birthday (MM-DD)"
            placeholder="08-24"
            value={profileForm.birthday}
            onChange={e => setProfileForm(p => ({ ...p, birthday: e.target.value }))}
          />
          <Input
            label="Profile Photo URL"
            placeholder="https://..."
            value={profileForm.avatarUrl}
            onChange={e => setProfileForm(p => ({ ...p, avatarUrl: e.target.value }))}
          />
          <div style={{ padding: '10px 12px', background: 'rgba(230,57,70,0.08)', border: '1px solid rgba(230,57,70,0.2)', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--muted)' }}>
            ℹ️ Transaction number is unique per payment — enter it manually each time.
          </div>
        </div>
      </Modal>

      <SupportFab />

      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => {
          setNotificationPanelOpen(false);
          loadNotificationCount(); // Refresh count when closed
        }} 
      />

      {/* VIP Subscription Modal */}
      <VipModal open={vipModalOpen} onClose={() => setVipModalOpen(false)} />
    </div>
  );
}
