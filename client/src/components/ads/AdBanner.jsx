import { useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';

/**
 * AdBanner — Multi-network ad integration
 *
 * Supports:
 *  - Google AdSense  (VITE_ADSENSE_CLIENT in .env)
 *  - Adsterra        (VITE_ADSTERRA_KEY in .env)
 *
 * VIP users (vipExpiresAt in future) see NO ads.
 *
 * Setup:
 * 1. AdSense: add VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXXX to client/.env
 *    and uncomment the AdSense <script> in index.html
 * 2. Adsterra: add VITE_ADSTERRA_KEY=your_key to client/.env
 *    Get your key from https://publishers.adsterra.com
 *
 * Slot names:
 *  "dashboard-mid"  — horizontal banner between products and squad tab
 *  "landing-top"    — banner on landing page below hero
 *  "sidebar"        — 300×250 rectangle
 *  "after-purchase" — shown after order submitted
 */

const ADSENSE_SLOTS = {
  'dashboard-mid':  { slot: import.meta.env.VITE_ADSENSE_SLOT_DASHBOARD  || '1234567890', format: 'auto' },
  'landing-top':    { slot: import.meta.env.VITE_ADSENSE_SLOT_LANDING    || '0987654321', format: 'auto' },
  'sidebar':        { slot: import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR    || '1122334455', format: 'rectangle' },
  'after-purchase': { slot: import.meta.env.VITE_ADSENSE_SLOT_PURCHASE   || '5566778899', format: 'auto' },
};

const ADSENSE_CLIENT  = import.meta.env.VITE_ADSENSE_CLIENT  || '';
const ADSTERRA_KEY    = import.meta.env.VITE_ADSTERRA_KEY    || '';

// Adsterra script URLs per slot (set these in your Adsterra dashboard)
const ADSTERRA_SCRIPTS = {
  'dashboard-mid':  import.meta.env.VITE_ADSTERRA_SCRIPT_DASHBOARD  || '',
  'landing-top':    import.meta.env.VITE_ADSTERRA_SCRIPT_LANDING    || '',
  'sidebar':        import.meta.env.VITE_ADSTERRA_SCRIPT_SIDEBAR    || '',
  'after-purchase': import.meta.env.VITE_ADSTERRA_SCRIPT_PURCHASE   || '',
};

function AdSenseUnit({ slot, format }) {
  const ref = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    if (!ADSENSE_CLIENT || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <div style={{ overflow: 'hidden', borderRadius: '10px', minHeight: '90px' }}>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '90px' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

function AdsterraUnit({ scriptSrc }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!scriptSrc || !containerRef.current) return;
    // Remove any previous script
    containerRef.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = scriptSrc;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    containerRef.current.appendChild(script);
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, [scriptSrc]);

  return <div ref={containerRef} style={{ minHeight: '90px', overflow: 'hidden', borderRadius: '10px' }} />;
}

export default function AdBanner({ slot = 'dashboard-mid' }) {
  const { user } = useAuth();

  // VIP users see no ads
  const isVip = user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date();
  if (isVip) return null;

  const adsterraScript = ADSTERRA_SCRIPTS[slot] || '';

  // Adsterra first — accepts gaming/cheat content, AdSense does not
  if (ADSTERRA_KEY && adsterraScript) {
    return <AdsterraUnit scriptSrc={adsterraScript} />;
  }

  // AdSense fallback (only use if your site has no cheat content)
  if (ADSENSE_CLIENT) {
    const config = ADSENSE_SLOTS[slot] || ADSENSE_SLOTS['dashboard-mid'];
    return <AdSenseUnit slot={config.slot} format={config.format} />;
  }

  // Dev placeholder — invisible to real users, visible only in dev
  if (import.meta.env.DEV) {
    return (
      <div style={{
        padding: '10px 16px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px dashed rgba(255,255,255,0.06)',
        borderRadius: '10px',
        textAlign: 'center',
        fontSize: '0.68rem',
        color: '#2a2a2a',
        letterSpacing: '1px',
        userSelect: 'none'
      }}>
        AD SPACE [{slot}] — Add VITE_ADSENSE_CLIENT or VITE_ADSTERRA_KEY to .env
      </div>
    );
  }

  return null;
}
