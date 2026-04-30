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

// Adsterra atOptions format — key + dimensions per slot
// These are hardcoded from your Adsterra dashboard zones
const ADSTERRA_ZONES = {
  'dashboard-mid':  { key: import.meta.env.VITE_ADSTERRA_KEY_728  || 'f8f63db1607698ab4392e358b5f18242', width: 728, height: 90,  host: 'www.topcreativeformat.com' },
  'landing-top':    { key: import.meta.env.VITE_ADSTERRA_KEY_728  || 'f8f63db1607698ab4392e358b5f18242', width: 728, height: 90,  host: 'www.topcreativeformat.com' },
  'sidebar':        { key: import.meta.env.VITE_ADSTERRA_KEY_300  || '182d58801eedbe8f5f8bfea2e9234a5f', width: 300, height: 250, host: 'www.topcreativeformat.com' },
  'after-purchase': { key: import.meta.env.VITE_ADSTERRA_KEY_300  || '182d58801eedbe8f5f8bfea2e9234a5f', width: 300, height: 250, host: 'www.topcreativeformat.com' },
  'mobile-bottom':  { key: 'a980f1552ae8eadfc2afa5d33787f81e', width: 320, height: 50, host: 'www.highperformanceformat.com' },
};

// Adsterra script URLs per slot (invoke.js format — optional override)
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

// atOptions format — used when you have key + dimensions (no invoke.js needed)
function AdsterraAtUnit({ zone }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!zone?.key || !containerRef.current) return;
    containerRef.current.innerHTML = '';

    window.atOptions = {
      key: zone.key,
      format: 'iframe',
      height: zone.height,
      width: zone.width,
      params: {}
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = `//${zone.host || 'www.topcreativeformat.com'}/${zone.key}/invoke.js`;
    script.async = true;
    script.setAttribute('data-cfasync', 'false');
    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
      delete window.atOptions;
    };
  }, [zone?.key]);

  return (
    <div ref={containerRef} style={{
      minHeight: `${zone?.height || 90}px`,
      width: '100%',
      overflow: 'hidden',
      borderRadius: '10px',
      display: 'flex',
      justifyContent: 'center'
    }} />
  );
}

// VIP upsell strip shown above every ad
function VipUpsell({ onVip }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 10px', marginBottom: '4px',
      background: 'rgba(251,191,36,0.06)', borderRadius: '6px',
      fontSize: '0.68rem', color: 'rgba(255,255,255,0.35)'
    }}>
      <span>📢 Advertisement</span>
      <button
        onClick={onVip}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#fbbf24', fontSize: '0.68rem', fontWeight: 700, padding: 0
        }}
      >
        ⭐ Go VIP Rs 199/mo — Remove all ads
      </button>
    </div>
  );
}

export default function AdBanner({ slot = 'dashboard-mid', onVipClick }) {
  // Safe auth check — ads show to non-logged-in users too
  let isVip = false;
  try {
    const { user } = useAuth();
    isVip = !!(user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date());
  } catch {}

  if (isVip) return null;

  const adsterraScript = ADSTERRA_SCRIPTS[slot] || '';

  const renderAd = () => {
    if (adsterraScript) return <AdsterraUnit scriptSrc={adsterraScript} />;
    const zone = ADSTERRA_ZONES[slot];
    if (zone?.key) return <AdsterraAtUnit zone={zone} />;
    if (ADSENSE_CLIENT) {
      const config = ADSENSE_SLOTS[slot] || ADSENSE_SLOTS['dashboard-mid'];
      return <AdSenseUnit slot={config.slot} format={config.format} />;
    }
    if (import.meta.env.DEV) {
      return (
        <div style={{
          padding: '10px 16px', background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.06)', borderRadius: '10px',
          textAlign: 'center', fontSize: '0.68rem', color: '#2a2a2a',
          letterSpacing: '1px', userSelect: 'none', minHeight: '90px',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          AD [{slot}]
        </div>
      );
    }
    return null;
  };

  const ad = renderAd();
  if (!ad) return null;

  return (
    <div>
      <VipUpsell onVip={onVipClick || (() => {})} />
      {ad}
    </div>
  );
}
