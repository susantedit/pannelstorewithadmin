import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Notif } from '../../utils/notify';

const RANKS = [
  { name: 'Recruit',  minSpend: 0,     color: '#888888', icon: '🪖', bg: 'rgba(136,136,136,0.1)' },
  { name: 'Soldier',  minSpend: 1000,  color: '#60a5fa', icon: '⚔️', bg: 'rgba(96,165,250,0.1)'  },
  { name: 'Elite',    minSpend: 5000,  color: '#a78bfa', icon: '💎', bg: 'rgba(167,139,250,0.1)' },
  { name: 'Legend',   minSpend: 15000, color: '#fbbf24', icon: '👑', bg: 'rgba(251,191,36,0.1)'  },
];

export default function PlayerCard({ user }) {
  const [profile, setProfile] = useState(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [checkInMsg, setCheckInMsg] = useState('');

  useEffect(() => {
    api.getGamificationProfile()
      .then(res => { if (res?.ok) setProfile(res); })
      .catch(() => {});
  }, []);

  const handleCheckIn = async () => {
    setCheckingIn(true);
    try {
      const res = await api.dailyCheckIn();
      if (res?.ok) {
        setCheckInMsg(res.message);
        setProfile(prev => prev ? {
          ...prev,
          xp: res.totalXp,
          streakCount: res.newStreak,
          canCheckIn: false,
          walletBalance: res.reward ? (prev.walletBalance + res.reward.amount) : prev.walletBalance
        } : prev);
        if (res.reward) {
          Notif.showNotification('🎁 Streak Reward!', res.reward.message, 'key', 0);
        } else {
          Notif.showNotification('✅ Checked In!', res.message, 'success', 4000);
        }
      } else {
        setCheckInMsg(res?.message || 'Already checked in');
      }
    } catch {
      setCheckInMsg('Check-in failed');
    } finally {
      setCheckingIn(false);
      setTimeout(() => setCheckInMsg(''), 4000);
    }
  };

  if (!profile) return null;

  const rank = profile.rank || RANKS[0];
  const nextRank = profile.nextRank;
  const progress = profile.progressToNext || 0;

  return (
    <div style={{
      background: `linear-gradient(135deg, ${rank.bg || 'rgba(230,57,70,0.08)'}, rgba(0,0,0,0.4))`,
      border: `1px solid ${rank.color || 'var(--line)'}40`,
      borderRadius: '16px',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>{`
        @keyframes xp-fill { from { width: 0%; } to { width: ${progress}%; } }
        @keyframes streak-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
      `}</style>

      {/* Rank glow bg */}
      <div style={{
        position: 'absolute', top: '-40px', right: '-40px',
        width: '120px', height: '120px', borderRadius: '50%',
        background: `radial-gradient(circle, ${rank.color || '#e63946'}22, transparent 70%)`,
        pointerEvents: 'none'
      }} />

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
        {/* Avatar */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '50%',
          background: `linear-gradient(135deg, ${rank.color || 'var(--primary)'}, #000)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', fontWeight: 900, color: '#fff', flexShrink: 0,
          border: `2px solid ${rank.color || 'var(--primary)'}`,
          boxShadow: `0 0 12px ${rank.color || 'var(--primary)'}44`
        }}>
          {user?.name?.charAt(0).toUpperCase() || '?'}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <strong style={{ color: '#fff', fontSize: '1rem' }}>{user?.name}</strong>
            {profile.partnerBadge && (
              <span style={{ fontSize: '0.68rem', background: 'rgba(230,57,70,0.2)', border: '1px solid rgba(230,57,70,0.4)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                ⭐ PARTNER
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
            <span style={{ fontSize: '1rem' }}>{rank.icon}</span>
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.7rem', fontWeight: 700, color: rank.color, letterSpacing: '1px' }}>
              {rank.name}
            </span>
          </div>
        </div>

        {/* Streak */}
        <div style={{
          textAlign: 'center', flexShrink: 0,
          animation: profile.streakCount > 0 ? 'streak-pulse 2s ease-in-out infinite' : 'none'
        }}>
          <div style={{ fontSize: '1.4rem' }}>🔥</div>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>
            {profile.streakCount}d
          </div>
        </div>
      </div>

      {/* XP bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--muted)', marginBottom: '5px', fontFamily: "'Orbitron',sans-serif", letterSpacing: '1px' }}>
          <span style={{ color: rank.color }}>XP {profile.xp?.toLocaleString()}</span>
          {nextRank && <span>→ {nextRank.icon} {nextRank.name} (Rs {nextRank.minSpend?.toLocaleString()})</span>}
        </div>
        <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '8px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${rank.color}, ${rank.color}88)`,
            borderRadius: '8px',
            animation: 'xp-fill 1s ease-out',
            boxShadow: `0 0 8px ${rank.color}66`
          }} />
        </div>
        {nextRank && (
          <div style={{ fontSize: '0.68rem', color: 'var(--muted)', marginTop: '3px', textAlign: 'right' }}>
            {progress}% to {nextRank.name}
          </div>
        )}
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
        {[
          { label: 'Wallet', value: `Rs ${profile.walletBalance || 0}`, color: '#4ade80' },
          { label: 'Referrals', value: profile.referralCount || 0, color: '#60a5fa' },
          { label: 'Spent', value: `Rs ${(profile.totalSpend || 0).toLocaleString()}`, color: rank.color },
        ].map(s => (
          <div key={s.label} style={{ textAlign: 'center', padding: '8px', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: '2px', letterSpacing: '0.5px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Daily check-in */}
      <button
        onClick={handleCheckIn}
        disabled={!profile.canCheckIn || checkingIn}
        style={{
          width: '100%', padding: '10px', borderRadius: '10px',
          background: profile.canCheckIn
            ? 'linear-gradient(135deg, rgba(230,57,70,0.2), rgba(230,57,70,0.1))'
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${profile.canCheckIn ? 'rgba(230,57,70,0.4)' : 'rgba(255,255,255,0.08)'}`,
          color: profile.canCheckIn ? '#fff' : 'var(--muted)',
          cursor: profile.canCheckIn ? 'pointer' : 'not-allowed',
          fontFamily: "'Orbitron',sans-serif", fontSize: '0.72rem', fontWeight: 700,
          letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          transition: 'all 0.2s'
        }}
      >
        {checkingIn ? (
          <><i className="fas fa-spinner fa-spin" /> Checking in...</>
        ) : profile.canCheckIn ? (
          <><i className="fas fa-calendar-check" /> DAILY CHECK-IN (+XP)</>
        ) : (
          <><i className="fas fa-check" /> Checked in today · Streak: {profile.streakCount} days</>
        )}
      </button>

      {checkInMsg && (
        <p style={{ margin: '8px 0 0', fontSize: '0.8rem', color: '#4ade80', textAlign: 'center' }}>{checkInMsg}</p>
      )}

      {/* Rank perks */}
      {rank.name !== 'Recruit' && (
        <div style={{ marginTop: '10px', padding: '8px 12px', background: `${rank.color}11`, border: `1px solid ${rank.color}33`, borderRadius: '8px', fontSize: '0.75rem', color: rank.color, textAlign: 'center', fontWeight: 600 }}>
          {rank.icon} {rank.name} Perk: Rs {rank.discount || 0} discount on orders
        </div>
      )}
    </div>
  );
}
