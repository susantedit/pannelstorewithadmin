import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/shared/Button';
import { ChevronRightIcon, ShieldIcon, LayersIcon, ClockIcon } from '../../components/shared/Icons';
import AdBanner from '../../components/ads/AdBanner';

// ── Social links ──────────────────────────────────────────────────────────────
const SOCIALS = [
  { label: 'WhatsApp',  href: 'https://wa.me/9779708838261',                    color: '#25D366', icon: 'fa-brands fa-whatsapp' },
  { label: 'TikTok',   href: 'https://tiktok.com/@vortexeditz34',               color: '#fff',    icon: 'fa-brands fa-tiktok' },
  { label: 'YouTube',  href: 'https://youtube.com/@yubrajedit1',                color: '#FF0000', icon: 'fa-brands fa-youtube' },
  { label: 'Instagram',href: 'https://instagram.com/susantgamerz',              color: '#E4405F', icon: 'fa-brands fa-instagram' },
  { label: 'Facebook', href: 'https://facebook.com/Kantaraj.Luitel',            color: '#1877F2', icon: 'fa-brands fa-facebook' },
  { label: 'X',        href: 'https://x.com/Susantedit',                        color: '#fff',    icon: 'fa-brands fa-x-twitter' },
  { label: 'GitHub',   href: 'https://github.com/susantedit',                   color: '#fff',    icon: 'fa-brands fa-github' },
  { label: 'Email',    href: 'mailto:susantedit@gmail.com',                     color: '#EA4335', icon: 'fa-solid fa-envelope' },
];

// ── Testimonials ──────────────────────────────────────────────────────────────
const TESTIMONIALS = [
  {
    name: 'Rohan K.',
    role: 'Heroic Rank Player',
    avatar: 'R',
    color: '#e63946',
    text: '"Been using DRIP CLIENT for 3 months. Instant delivery, works flawlessly. Customer support is super responsive. Highly recommended!"'
  },
  {
    name: 'Aditya M.',
    role: 'Esports Player',
    avatar: 'A',
    color: '#a78bfa',
    text: '"Best service I\'ve found. Payment is secure, activation is instant. The performance boost is exactly what I needed for competitive play."'
  },
  {
    name: 'Sanjay P.',
    role: 'Pro Gamer',
    avatar: 'S',
    color: '#4ade80',
    text: '"Professional service, no issues at all. Been a customer for 6+ months. Worth every rupee. Support team is available 24/7."'
  },
];

// ── FAQ ───────────────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'How long does delivery take?',
    a: 'For top-up services (Free Fire, PUBG), delivery is instant (1–5 minutes). For panel services, activation takes 5–15 minutes after payment confirmation.'
  },
  {
    q: 'What if I enter the wrong Player ID/UID?',
    a: 'Please double-check your ID before payment. If you enter the wrong ID, contact us immediately via WhatsApp. We can correct it before processing if caught early.'
  },
  {
    q: 'What is your refund policy?',
    a: '⚠️ No refunds after service activation or delivery. Please double-check your Player ID/UID and package selection before payment. For undelivered services only, contact support within 24 hours.'
  },
  {
    q: 'Is payment secure?',
    a: 'Yes, 100%. We use official payment gateways (eSewa, Khalti, Bank Transfer). We never store your payment information.'
  },
  {
    q: 'Do you offer customer support?',
    a: '24/7 priority support via WhatsApp. Average response time: 10 minutes. Contact: +977 9708838261'
  },
];

function Stars() {
  return (
    <span style={{ color: '#fbbf24', letterSpacing: '2px', fontSize: '0.9rem' }}>★★★★★</span>
  );
}

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        borderBottom: '1px solid var(--line)',
        overflow: 'hidden'
      }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', background: 'none', border: 'none',
          color: 'var(--text)', textAlign: 'left',
          padding: '16px 0', cursor: 'pointer',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: '12px', fontWeight: 700, fontSize: '0.95rem'
        }}
      >
        <span>{q}</span>
        <i
          className={`fas fa-chevron-${open ? 'up' : 'down'}`}
          style={{ color: 'var(--primary)', flexShrink: 0, fontSize: '0.8rem', transition: 'transform 0.2s' }}
        />
      </button>
      {open && (
        <p style={{
          margin: '0 0 16px',
          color: 'var(--muted)',
          fontSize: '0.88rem',
          lineHeight: 1.7,
          paddingRight: '24px'
        }}>
          {a}
        </p>
      )}
    </div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [profileOpen]);

  return (
    <div className="app-shell">

      {/* ── TOPBAR ── */}
      <header className="topbar panel">
        <div className="brand">
          <img src="/logo.png" alt="Logo" style={{ height: '48px', width: '48px', objectFit: 'contain' }} />
          <div>
            <div className="brand-title">SUSANTEDIT</div>
            <div className="brand-subtitle">Elite Gaming Performance Platform</div>
          </div>
        </div>
        <div className="topbar-actions">
          {user ? (
            <>
              <div style={{ position: 'relative' }} ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(o => !o)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '0.9rem'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isAdmin ? '#a855f7' : '#34d399',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}>
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div style={{ textAlign: 'left', fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>
                      {isAdmin && <i className="fas fa-crown" style={{ color: '#a855f7', marginRight: '4px' }} />}
                      {user.name || 'User'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                      {isAdmin ? 'Admin' : 'Player'}
                    </div>
                  </div>
                  <i className={`fas fa-chevron-${profileOpen ? 'up' : 'down'}`} style={{ fontSize: '0.8rem', color: 'var(--muted)' }} />
                </button>

                {/* Dropdown Menu */}
                {profileOpen && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    background: '#111',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    minWidth: '220px',
                    zIndex: 100,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
                    animation: 'slideInDown 0.2s ease-out'
                  }}>
                    <div style={{ padding: '12px 0' }}>
                      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--line)', fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}>
                        Account
                      </div>
                      
                      <button
                        onClick={() => {
                          navigate(isAdmin ? '/admin' : '/dashboard');
                          setProfileOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '11px 16px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,57,70,0.1)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text)'; }}
                      >
                        <i className={`fas ${isAdmin ? 'fa-sliders-h' : 'fa-shopping-cart'}`} />
                        {isAdmin ? 'Admin Panel' : 'Dashboard'}
                      </button>

                      <button
                        onClick={() => {
                          navigate('/dashboard');
                          setProfileOpen(false);
                        }}
                        style={{
                          width: '100%',
                          padding: '11px 16px',
                          background: 'none',
                          border: 'none',
                          textAlign: 'left',
                          color: 'var(--text)',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(230,57,70,0.1)'; e.currentTarget.style.color = 'var(--primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text)'; }}
                      >
                        <i className="fas fa-user" />
                        My Profile
                      </button>

                      <div style={{ borderTop: '1px solid var(--line)', marginTop: '8px', paddingTop: '8px' }}>
                        <button
                          onClick={() => {
                            logout();
                            setProfileOpen(false);
                            navigate('/');
                          }}
                          style={{
                            width: '100%',
                            padding: '11px 16px',
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            color: '#ff6b6b',
                            cursor: 'pointer',
                            fontSize: '0.9rem',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                        >
                          <i className="fas fa-sign-out-alt" />
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button variant="primary" onClick={() => navigate(isAdmin ? '/admin' : '/dashboard')}>
                <i className={`fas ${isAdmin ? 'fa-sliders-h' : 'fa-shopping-cart'}`} /> {isAdmin ? 'Admin Panel' : 'Dashboard'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                <i className="fas fa-user" /> Player Login
              </Button>
              <Button variant="primary" onClick={() => navigate('/login')} style={{ background: 'transparent', color: '#a855f7', borderColor: '#a855f7' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#a855f7'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#a855f7'; }}
              >
                <i className="fas fa-crown" /> Admin Login
              </Button>
            </>
          )}
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="hero-grid">
        <div className="panel hero-copy">
          <span className="eyebrow">
            <i className="fas fa-gamepad" /> Trusted by 10,000+ Competitive Players
          </span>
          <h1>Elite Gaming Services. Instant Delivery.</h1>
          <p>
            Premium panels, diamond top-ups, and rank services — delivered fast, verified manually, and backed by 24/7 support.
          </p>
          <div className="hero-actions">
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              <i className="fas fa-shopping-cart" /> Select Package — Starting Rs 40
            </Button>
            <Button variant="ghost" onClick={() => window.open('https://wa.me/9779708838261', '_blank')}>
              <i className="fab fa-whatsapp" style={{ color: '#25D366' }} /> WhatsApp Us
            </Button>
          </div>

          {/* Login options */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)',
                color: '#34d399', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.5px'
              }}
            >
              <i className="fas fa-user" /> Player Login
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '8px 16px', borderRadius: '8px', cursor: 'pointer',
                background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)',
                color: '#a855f7', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.5px'
              }}
            >
              <i className="fas fa-crown" /> Admin Login
            </button>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', gap: '20px', marginTop: '24px', flexWrap: 'wrap' }}>
            {[
              { icon: 'fa-bolt',         label: 'Instant Delivery'  },
              { icon: 'fa-shield-halved',label: '100% Secure'       },
              { icon: 'fa-headset',      label: '24/7 Support'      },
              { icon: 'fa-users',        label: '10,000+ Players'   },
            ].map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: 'var(--muted)' }}>
                <i className={`fas ${b.icon}`} style={{ color: 'var(--primary)', fontSize: '0.9rem' }} />
                {b.label}
              </div>
            ))}
          </div>
        </div>

        <aside className="panel side-panel">
          <div className="panel-header"><h2>How it works</h2></div>
          <div className="timeline">
            {[
              { icon: 'fa-box-open',    title: 'Select Package',   desc: 'Choose from panels, top-ups, or rank services.' },
              { icon: 'fa-qrcode',      title: 'Scan & Pay',       desc: 'Pay via eSewa or Bank using QR, and add remark with your name.' },
              { icon: 'fa-receipt',     title: 'Enter TXN Number', desc: 'Enter the transaction ID from your payment app.' },
              { icon: 'fa-clock',       title: 'Admin Reviews',    desc: 'Manual verification — up to 40 minutes.' },
              { icon: 'fa-key',         title: 'Get Your Key',     desc: 'Receive activation key directly in the app.' },
            ].map(s => (
              <div key={s.title} className="timeline-item">
                <i className={`fas ${s.icon}`} style={{ color: 'var(--primary)', width: '20px', textAlign: 'center' }} />
                <div>
                  <strong>{s.title}</strong>
                  <p>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      {/* ── USER TYPE SELECTION ── */}
      {!user && (
        <section>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="eyebrow"><i className="fas fa-arrow-right-arrow-left" style={{ color: 'var(--primary)' }} /> Choose Your Role</span>
            <h2 style={{ marginTop: '8px' }}>Admin or Player?</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Admin Option */}
            <div className="panel" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
              border: '2px solid rgba(168, 85, 247, 0.3)',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(168, 85, 247, 0.02))',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.6)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(168, 85, 247, 0.08))';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(168, 85, 247, 0.02))';
              e.currentTarget.style.transform = 'none';
            }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                <i className="fas fa-crown" style={{ color: '#a855f7' }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>Admin Panel</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Manage products, orders, and payments. View analytics and control your store.
                </p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <Button variant="primary" onClick={() => navigate('/login')} style={{ width: '100%', fontSize: '0.9rem' }}>
                  <i className="fas fa-sign-in-alt" /> Admin Login
                </Button>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center' }}>
                  Manage orders & analytics
                </div>
              </div>
            </div>

            {/* Normal User Option */}
            <div className="panel" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
              border: '2px solid rgba(52, 211, 153, 0.3)',
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(52, 211, 153, 0.02))',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.6)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.08))';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(52, 211, 153, 0.08), rgba(52, 211, 153, 0.02))';
              e.currentTarget.style.transform = 'none';
            }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(52, 211, 153, 0.2)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                <i className="fas fa-gamepad" style={{ color: '#34d399' }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>Player Dashboard</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Browse and purchase packages. Track your orders and manage your account.
                </p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <Button variant="primary" onClick={() => navigate('/dashboard')} style={{ width: '100%', fontSize: '0.9rem', background: '#34d399', color: '#000' }}>
                  <i className="fas fa-shopping-cart" /> Player Dashboard
                </Button>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)', textAlign: 'center' }}>
                  Browse packages & buy
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── ADMIN SWITCH SECTION ── */}
      {isAdmin && (
        <section>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <span className="eyebrow"><i className="fas fa-arrow-right-arrow-left" style={{ color: 'var(--primary)' }} /> Admin Access</span>
            <h2 style={{ marginTop: '8px' }}>Switch Between Views</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {/* Admin Panel Option */}
            <div className="panel" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
              border: '2px solid rgba(168, 85, 247, 0.5)',
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.05))',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.8)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1))';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168, 85, 247, 0.12), rgba(168, 85, 247, 0.05))';
              e.currentTarget.style.transform = 'none';
            }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(168, 85, 247, 0.2)',
                border: '1px solid rgba(168, 85, 247, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                <i className="fas fa-sliders-h" style={{ color: '#a855f7' }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>Admin Control Panel</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Manage all products, orders, payments, and view detailed analytics.
                </p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <Button variant="primary" onClick={() => navigate('/admin')} style={{ width: '100%', fontSize: '0.9rem' }}>
                  <i className="fas fa-sliders-h" /> Go to Admin Panel
                </Button>
              </div>
            </div>

            {/* Player View Option */}
            <div className="panel" style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '24px',
              border: '2px solid rgba(52, 211, 153, 0.5)',
              background: 'linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(52, 211, 153, 0.05))',
              position: 'relative',
              cursor: 'pointer',
              transition: 'all 0.3s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.8)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(52, 211, 153, 0.2), rgba(52, 211, 153, 0.1))';
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.5)';
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(52, 211, 153, 0.12), rgba(52, 211, 153, 0.05))';
              e.currentTarget.style.transform = 'none';
            }}
            >
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '12px',
                background: 'rgba(52, 211, 153, 0.2)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.6rem'
              }}>
                <i className="fas fa-eye" style={{ color: '#34d399' }} />
              </div>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: '1.2rem', color: '#fff', fontWeight: 700 }}>Player View</h3>
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                  Browse and test products as a player would see them.
                </p>
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px', flexDirection: 'column' }}>
                <Button variant="primary" onClick={() => navigate('/dashboard')} style={{ width: '100%', fontSize: '0.9rem', background: '#34d399', color: '#000' }}>
                  <i className="fas fa-eye" /> Browse as Player
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ── */}
      <section>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span className="eyebrow"><i className="fas fa-star" style={{ color: '#fbbf24' }} /> Trusted by Competitive Players</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} className="panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <Stars />
              <p style={{ color: 'var(--text)', fontSize: '0.9rem', lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
                {t.text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 'auto' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1rem', color: '#fff', flexShrink: 0
                }}>
                  {t.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {[
          { icon: 'fa-bolt',          color: '#fbbf24', title: 'Instant Delivery',    desc: 'Top-ups delivered in 1–5 minutes. Panel activations in under 15 minutes.' },
          { icon: 'fa-shield-halved', color: '#4ade80', title: '100% Secure Payment', desc: 'Official gateways only — eSewa, Khalti, Bank Transfer. No data stored.' },
          { icon: 'fa-headset',       color: '#60a5fa', title: '24/7 Priority Support',desc: 'Average WhatsApp response time: 10 minutes. Always available.' },
          { icon: 'fa-rotate',        color: '#a78bfa', title: 'Manual Verification',  desc: 'Every order reviewed by a human. No bots, no errors, no surprises.' },
        ].map(f => (
          <div key={f.title} className="panel" style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
              background: `${f.color}18`, border: `1px solid ${f.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <i className={`fas ${f.icon}`} style={{ color: f.color, fontSize: '1.1rem' }} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: '0.95rem', color: '#fff' }}>{f.title}</h3>
              <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* ── CTA BANNER ── */}
      <div className="panel" style={{
        background: 'linear-gradient(135deg, rgba(230,57,70,0.15), rgba(230,57,70,0.05))',
        border: '1px solid rgba(230,57,70,0.3)',
        textAlign: 'center',
        padding: '36px 24px'
      }}>
        <h2 style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 'clamp(1.2rem, 3vw, 1.8rem)', margin: '0 0 10px', color: '#fff', letterSpacing: '2px' }}>
          🛒 Select Package — Starting Rs 40
        </h2>
        <p style={{ color: 'var(--muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Free Fire diamonds, weekly passes, monthly memberships, and premium panels.
        </p>
        <Button variant="primary" onClick={() => navigate('/dashboard')} style={{ fontSize: '1rem', padding: '14px 32px' }}>
          <i className="fas fa-gamepad" /> Browse All Products
        </Button>
      </div>

      {/* ── FAQ ── */}
      <AdBanner slot="landing-top" />

      <div className="panel">
        <div className="panel-header">
          <h2><i className="fas fa-circle-question" style={{ color: 'var(--primary)', marginRight: '8px' }} />Frequently Asked Questions</h2>
        </div>
        {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
      </div>

      {/* ── SOCIALS ── */}
      <div className="panel" style={{ textAlign: 'center' }}>
        <div className="panel-header" style={{ justifyContent: 'center' }}>
          <h2>Connect With Us</h2>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center', marginBottom: '8px' }}>
          {SOCIALS.map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              title={s.label}
              style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: s.color, fontSize: '1.1rem', textDecoration: 'none',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = `${s.color}22`; e.currentTarget.style.borderColor = `${s.color}66`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'none'; }}
            >
              <i className={s.icon} />
            </a>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: '0.82rem', margin: '8px 0 0' }}>
          WhatsApp: <a href="https://wa.me/9779708838261" style={{ color: '#25D366', textDecoration: 'none' }}>+977 9708838261</a>
          &nbsp;·&nbsp;
          Email: <a href="mailto:susantedit@gmail.com" style={{ color: 'var(--primary)', textDecoration: 'none' }}>susantedit@gmail.com</a>
        </p>
      </div>

      {/* ── FOOTER ── */}
      <footer style={{
        textAlign: 'center',
        padding: '28px 20px',
        borderTop: '1px solid var(--line)',
        color: 'var(--muted)',
        fontSize: '0.82rem',
        lineHeight: 2
      }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 700, color: 'var(--primary)', fontSize: '1rem', marginBottom: '6px', letterSpacing: '2px' }}>
          ⚔️ SUSANTEDIT
        </div>
        <div>Elite Gaming Performance Platform</div>
        <div style={{ margin: '6px 0', color: '#555' }}>
          Trusted &amp; Secure &nbsp;·&nbsp; Instant Delivery &nbsp;·&nbsp; 24/7 Priority Support
        </div>
        <div style={{ color: '#444', fontSize: '0.78rem' }}>
          Serving 10,000+ competitive players since 2023
        </div>
        <div style={{ marginTop: '10px', display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {['Terms & Conditions', 'Privacy Policy', 'Refund Policy'].map(l => (
            <span key={l} style={{ color: '#555', cursor: 'default', fontSize: '0.78rem' }}>{l}</span>
          ))}
        </div>
        <div style={{ marginTop: '10px', color: '#333', fontSize: '0.75rem' }}>
          © 2024 SUSANTEDIT | All rights reserved.
        </div>
      </footer>

    </div>
  );
}
