import { useState } from 'react';
import { showToast } from '../../utils/notify';

export default function ReferralShareCard({ referralCode, userName }) {
  const [copied, setCopied] = useState(false);
  
  const referralUrl = `${window.location.origin}?ref=${referralCode}`;
  const shareText = `Join SUSANTEDIT! Use my referral code "${referralCode}" to get extra wallet credit. 🎮`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    showToast('Code copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    showToast('Link copied!', 'success');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareTikTok = () => {
    // TikTok share opens the native share dialog
    if (navigator.share) {
      navigator.share({
        title: 'SUSANTEDIT Referral',
        text: shareText,
        url: referralUrl
      }).catch(err => console.log('Share cancelled'));
    } else {
      // Fallback: copy and show instruction
      navigator.clipboard.writeText(shareText);
      showToast('Share text copied! Paste on TikTok bio or DM', 'info');
    }
  };

  return (
    <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(251,191,36,0.1), rgba(251,191,36,0.05))', border: '1px solid rgba(251,191,36,0.3)', marginBottom: '16px' }}>
      <div className="panel-header">
        <h2>🔗 Referral Program</h2>
        <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Share & earn rewards</span>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
        Share your referral code with friends. When they sign up using your code, you both get wallet credit!
      </p>

      {/* Referral Code Display */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px',
        padding: '12px', background: 'rgba(251,191,36,0.08)', borderRadius: '10px',
        border: '1px solid rgba(251,191,36,0.2)'
      }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Your Code</p>
          <p style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fbbf24', margin: 0, fontFamily: "'Orbitron', monospace" }}>{referralCode}</p>
        </div>
        <button
          onClick={handleCopyCode}
          style={{
            padding: '8px 16px', borderRadius: '8px',
            background: copied ? 'rgba(74,222,128,0.15)' : 'rgba(251,191,36,0.15)',
            border: `1px solid ${copied ? 'rgba(74,222,128,0.3)' : 'rgba(251,191,36,0.3)'}`,
            color: copied ? '#4ade80' : '#fbbf24',
            cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700,
            transition: 'all 0.2s'
          }}
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>

      {/* Share Buttons */}
      <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))' }}>
        <button
          onClick={handleShareWhatsApp}
          style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #25d366, #128c4e)',
            border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '0.85rem', transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          <i className="fab fa-whatsapp" /> Share on WhatsApp
        </button>

        <button
          onClick={handleShareTikTok}
          style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #000, #333)',
            border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '0.85rem', transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          <i className="fab fa-tiktok" /> Share on TikTok
        </button>

        <button
          onClick={handleCopyLink}
          style={{
            padding: '12px 16px', borderRadius: '10px',
            background: 'rgba(99,102,241,0.2)',
            border: '1px solid rgba(99,102,241,0.4)', color: '#818cf8', fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            fontSize: '0.85rem', transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
        >
          <i className="fas fa-link" /> Copy Link
        </button>
      </div>
    </div>
  );
}
