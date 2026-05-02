import { useState, useEffect, useRef, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Layers, 
  Clock, 
  ChevronRight, 
  Star, 
  Gamepad2, 
  Zap, 
  Users, 
  Crown, 
  CheckCircle2, 
  Globe2,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/shared/Button';
import Scene3D from '../../components/3d/Scene3D';
import FloatingDiamond from '../../components/3d/FloatingDiamond';
import BentoGrid from '../../components/layout/BentoGrid';
import AdBanner from '../../components/ads/AdBanner';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

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
    <div className="app-shell" style={{ overflow: 'hidden' }}>
      {/* ── 3D BACKGROUND ── */}
      <Scene3D />

      <header className="topbar glass floating-nav" style={{ 
        position: 'fixed', 
        top: '12px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        width: 'calc(100% - 24px)', 
        maxWidth: '1200px', 
        zIndex: 1000,
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.1)',
        padding: '10px 16px'
      }}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="brand"
        >
          <img src="/logo.png" alt="Logo" style={{ height: '40px', width: '40px', objectFit: 'contain', filter: 'drop-shadow(0 0 10px var(--primary))' }} />
          <div>
            <div className="brand-title text-gradient" style={{ fontSize: '1.1rem', letterSpacing: '1px' }}>SUSANTEDIT</div>
          </div>
        </motion.div>
        
        <div className="topbar-actions">
          {user ? (
            <div style={{ position: 'relative' }} ref={profileRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setProfileOpen(o => !o)}
                className="glass"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  color: 'var(--text)',
                  cursor: 'pointer',
                  border: '1px solid var(--glass-border)'
                }}
              >
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isAdmin ? 'linear-gradient(135deg, #a855f7, #6366f1)' : 'linear-gradient(135deg, #34d399, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.85rem'
                }}>
                  {user.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div style={{ textAlign: 'left', fontSize: '0.85rem' }} className="hide-mobile">
                  <div style={{ fontWeight: 600 }}>{user.name || 'User'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{isAdmin ? 'Admin' : 'Player'}</div>
                </div>
              </motion.button>
              
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="glass"
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '12px',
                      borderRadius: '16px',
                      minWidth: '220px',
                      zIndex: 100,
                      padding: '8px',
                      border: '1px solid var(--glass-border)'
                    }}
                  >
                    <div style={{ padding: '12px', borderBottom: '1px solid var(--line)', fontSize: '0.75rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Account Menu
                    </div>
                    {[
                      { label: isAdmin ? 'Admin Panel' : 'Dashboard', icon: isAdmin ? <Shield size={16} /> : <Gamepad2 size={16} />, path: isAdmin ? '/admin' : '/dashboard' },
                      { label: 'My Profile', icon: <Users size={16} />, path: '/dashboard' }
                    ].map(item => (
                      <button
                        key={item.label}
                        onClick={() => { navigate(item.path); setProfileOpen(false); }}
                        style={{
                          width: '100%', padding: '12px', background: 'none', border: 'none', textAlign: 'left',
                          color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                          borderRadius: '8px', transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}
                      >
                        {item.icon} {item.label}
                      </button>
                    ))}
                    <button
                      onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                      style={{
                        width: '100%', padding: '12px', background: 'none', border: 'none', textAlign: 'left',
                        color: '#ff6b6b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                        borderRadius: '8px', marginTop: '4px'
                      }}
                    >
                      <Zap size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                <Users size={18} /> Player Login
              </Button>
              <Button variant="primary" onClick={() => navigate('/login')} className="glass" style={{ borderColor: 'var(--secondary)', color: 'var(--secondary)' }}>
                <Crown size={18} /> Admin Panel
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO SECTION ── */}
      <section className="hero-grid" style={{ minHeight: '100vh', alignItems: 'center', paddingTop: '80px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="hero-copy"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="eyebrow glass"
          >
            <Zap size={14} fill="currentColor" /> Trusted by 10,000+ Elite Players
          </motion.span>
          <h1 style={{ fontSize: 'clamp(2rem, 8vw, 4.5rem)', fontWeight: 900, marginBottom: '20px', lineHeight: 1.1, color: '#fff' }}>
            Next-Gen <span className="text-gradient" style={{ color: 'var(--primary)' }}>Gaming</span> <Zap className="inline-icon" size={32} style={{ verticalAlign: 'middle', color: 'var(--primary)', filter: 'drop-shadow(0 0 15px var(--primary))' }} /> <br /> Performance.
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 3vw, 1.2rem)', maxWidth: '600px', color: 'rgba(255,255,255,0.7)', marginBottom: '32px', lineHeight: 1.6 }}>
            Elevate your gameplay with premium panels, instant top-ups, and 24/7 manual verification. 
            The only platform built for competitive dominance.
          </p>
          <div className="hero-actions" style={{ gap: '20px' }}>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="primary" onClick={() => navigate('/dashboard')} style={{ padding: '16px 32px', fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))', boxShadow: '0 10px 20px rgba(230, 57, 70, 0.3)' }}>
                Get Started — Rs 40 <ChevronRight size={20} />
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" className="glass" onClick={() => window.open('https://wa.me/9779708838261', '_blank')} style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
                <MessageSquare size={20} /> WhatsApp Support
              </Button>
            </motion.div>
          </div>
          
          <div style={{ display: 'flex', gap: '32px', marginTop: '48px', opacity: 0.7 }}>
            {[
              { icon: <Zap size={20} />, label: 'Instant' },
              { icon: <Shield size={20} />, label: 'Secure' },
              { icon: <Globe2 size={20} />, label: 'Global' }
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
                {item.icon} {item.label}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="side-panel" style={{ position: 'relative', minHeight: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {/* 3D Canvas — hidden on mobile to prevent overlap */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }} className="hide-mobile">
            <Canvas>
              <PerspectiveCamera makeDefault position={[0, 0, 5]} />
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} intensity={1} />
              <FloatingDiamond />
              <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
            </Canvas>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            style={{ width: '80%', maxWidth: '400px', zIndex: 1 }}
          >
            <div className="glass" style={{ padding: '32px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(30px)', background: 'rgba(10,10,10,0.75)' }}>
               <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '16px', color: 'var(--primary)' }}>ELITE PERFORMANCE</h3>
               <div className="timeline" style={{ gap: '20px' }}>
                {[
                  { title: 'Global Reach', desc: 'Serving 100+ countries.' },
                  { title: 'Ultra Low Latency', desc: 'Optimized for speed.' },
                  { title: 'Secure Protocol', desc: 'Encryption at every step.' }
                ].map((s, i) => (
                  <motion.div 
                    key={s.title}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + (i * 0.2) }}
                    style={{ display: 'flex', gap: '16px' }}
                  >
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(230,57,70,0.1)', border: '1px solid var(--primary)', display: 'grid', placeItems: 'center', color: 'var(--primary)', fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff' }}>{s.title}</div>
                      <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>{s.desc}</div>
                    </div>
                  </motion.div>
                ))}
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── BENTO GRID FEATURES ── */}
      <section style={{ margin: '80px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-gradient"
            style={{ fontSize: '2.5rem', fontWeight: 800 }}
          >
            Built for Domination.
          </motion.h2>
          <p style={{ color: 'var(--muted)' }}>Premium features designed for the competitive edge.</p>
        </div>

        <BentoGrid />
      </section>

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
