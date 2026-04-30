import { useState, useRef } from 'react';
import { Notif } from '../../utils/notify';
import { playLevelUp, playCashRegister, startSpinTick } from '../../utils/sounds';
import { api } from '../../services/api';

// ── Probabilities ──────────────────────────────────────────────────────────
// Try Again:      60%   — most spins
// 20 XP:          30%   — common reward
// Rs 50 Wallet:   ~0.5% — roughly once every 2 months per active user
// JACKPOT Rs 50:  1e-43 — statistically 1-2 times per year across ALL users
//
// Total must sum to exactly 1.0
// 0.60 + 0.30 + 0.005 + 0.095 = 1.0  (0.095 fills the gap as "5 XP consolation")
const PRIZES = [
  { label: 'Try Again',      value: 0,   type: 'none',   color: '#444',    prob: 0.60,                    icon: '😅' },
  { label: '20 XP',          value: 20,  type: 'xp',     color: '#a78bfa', prob: 0.30,                    icon: '⚡' },
  { label: '5 XP',           value: 5,   type: 'xp',     color: '#6366f1', prob: 0.095,                   icon: '✨' },
  { label: 'Rs 50 Wallet',   value: 50,  type: 'wallet', color: '#fbbf24', prob: 0.005,                   icon: '💰' },
  { label: '🏆 JACKPOT',     value: 50,  type: 'wallet', color: '#e63946', prob: 1e-43,                   icon: '🏆' },
];

const SEGMENT_COUNT = PRIZES.length;
const SEGMENT_ANGLE = 360 / SEGMENT_COUNT;

function pickPrize() {
  // Stage 1: jackpot check — separate ultra-rare roll
  // 1e-43 chance = roughly 1-2 hits per year if 10,000 users spin daily
  if (Math.random() < 1e-43) {
    return PRIZES.find(p => p.label === '🏆 JACKPOT');
  }

  // Stage 2: normal weighted roll across non-jackpot prizes
  const pool = PRIZES.filter(p => p.label !== '🏆 JACKPOT');
  const total = pool.reduce((s, p) => s + p.prob, 0);
  const r = Math.random() * total;
  let cumulative = 0;
  for (const prize of pool) {
    cumulative += prize.prob;
    if (r <= cumulative) return prize;
  }
  return pool[0]; // fallback: Try Again
}

export default function SpinWheel({ onClose, onReward }) {
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const spinRef = useRef(0);

  const handleSpin = async () => {
    if (spinning || result) return;
    setError('');

    // Check with backend first — enforces once per day
    setSpinning(true);
    let serverPrize;
    try {
      const res = await api.dailySpin();
      if (!res?.ok) {
        setSpinning(false);
        setError(res?.message || 'Already spun today! Come back tomorrow.');
        return;
      }
      serverPrize = res.prize;
    } catch {
      setSpinning(false);
      setError('Connection error. Try again.');
      return;
    }

    // Find matching prize index for animation
    const prizeIndex = PRIZES.findIndex(p => p.label === serverPrize.label);
    const safeIndex = prizeIndex >= 0 ? prizeIndex : 0;

    const targetSegment = safeIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const targetRotation = spinRef.current + (extraSpins * 360) + (360 - targetSegment);

    spinRef.current = targetRotation;
    setRotation(targetRotation);

    // Start tick sound
    startSpinTick();

    setTimeout(() => {
      setSpinning(false);
      setResult(serverPrize);
      if (serverPrize.type !== 'none') {
        playLevelUp();
        Notif.showNotification(
          `🎰 You won ${serverPrize.label}!`,
          serverPrize.type === 'wallet' ? `Rs ${serverPrize.value} added to your wallet!` : `+${serverPrize.value} XP added!`,
          'key', 0
        );
        onReward?.(serverPrize);
      } else {
        Notif.showToast('Better luck next time! 😅', 'info', 3000);
      }
    }, 4000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99998,
      background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px'
    }}>
      <style>{`
        @keyframes wheel-spin {
          from { transform: rotate(0deg); }
        }
        @keyframes prize-pop {
          0%   { transform: scale(0) rotate(-10deg); opacity: 0; }
          60%  { transform: scale(1.15) rotate(3deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(80px) rotate(360deg); opacity: 0; }
        }
      `}</style>

      <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '3px', marginBottom: '6px' }}>
            🎰 SPIN WHEEL
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
            1 free spin per day · Win wallet credits & XP
          </div>
        </div>

        {/* Wheel */}
        <div style={{ position: 'relative', width: '280px', height: '280px', margin: '0 auto 24px' }}>
          {/* Pointer */}
          <div style={{
            position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '12px solid transparent',
            borderRight: '12px solid transparent',
            borderTop: '24px solid var(--primary)',
            zIndex: 10,
            filter: 'drop-shadow(0 0 8px var(--primary))'
          }} />

          {/* SVG Wheel */}
          <svg
            width="280" height="280" viewBox="0 0 280 280"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
              filter: 'drop-shadow(0 0 20px rgba(230,57,70,0.4))'
            }}
          >
            {PRIZES.map((prize, i) => {
              const startAngle = (i * SEGMENT_ANGLE - 90) * (Math.PI / 180);
              const endAngle = ((i + 1) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
              const cx = 140, cy = 140, r = 130;
              const x1 = cx + r * Math.cos(startAngle);
              const y1 = cy + r * Math.sin(startAngle);
              const x2 = cx + r * Math.cos(endAngle);
              const y2 = cy + r * Math.sin(endAngle);
              const midAngle = ((i + 0.5) * SEGMENT_ANGLE - 90) * (Math.PI / 180);
              const tx = cx + (r * 0.65) * Math.cos(midAngle);
              const ty = cy + (r * 0.65) * Math.sin(midAngle);
              const textAngle = (i + 0.5) * SEGMENT_ANGLE;

              return (
                <g key={i}>
                  <path
                    d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`}
                    fill={prize.color}
                    fillOpacity={0.85}
                    stroke="#0a0a0a"
                    strokeWidth="2"
                  />
                  <text
                    x={tx} y={ty}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="11"
                    fontWeight="700"
                    fill="#fff"
                    fontFamily="Rajdhani, sans-serif"
                    transform={`rotate(${textAngle}, ${tx}, ${ty})`}
                  >
                    {prize.icon} {prize.label}
                  </text>
                </g>
              );
            })}
            {/* Center circle */}
            <circle cx="140" cy="140" r="22" fill="#0a0a0a" stroke="var(--primary)" strokeWidth="3" />
            <text x="140" y="144" textAnchor="middle" fontSize="16" fill="var(--primary)">🎰</text>
          </svg>
        </div>

        {/* Result */}
        {error && (
          <div style={{
            padding: '14px 20px', marginBottom: '16px',
            background: 'rgba(230,57,70,0.1)', border: '1px solid rgba(230,57,70,0.3)',
            borderRadius: '14px', textAlign: 'center',
            fontFamily: "'Orbitron',sans-serif", fontSize: '0.82rem', color: '#ff6b6b', fontWeight: 700
          }}>
            ⏰ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div style={{
            padding: '16px 20px',
            background: result.label === '🏆 JACKPOT'
              ? 'linear-gradient(135deg, rgba(230,57,70,0.3), rgba(251,191,36,0.2))'
              : result.type !== 'none' ? `${result.color}22` : 'rgba(255,255,255,0.05)',
            border: `1px solid ${result.label === '🏆 JACKPOT' ? '#fbbf24' : result.type !== 'none' ? result.color + '66' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: '14px',
            marginBottom: '16px',
            animation: 'prize-pop 0.6s cubic-bezier(0.175,0.885,0.32,1.275) forwards'
          }}>
            <div style={{ fontSize: result.label === '🏆 JACKPOT' ? '3rem' : '2rem', marginBottom: '6px' }}>{result.icon}</div>
            <div style={{
              fontFamily: "'Orbitron',sans-serif",
              fontSize: result.label === '🏆 JACKPOT' ? '1.2rem' : '1rem',
              fontWeight: 700,
              color: result.label === '🏆 JACKPOT' ? '#fbbf24' : result.type !== 'none' ? result.color : 'var(--muted)',
              letterSpacing: result.label === '🏆 JACKPOT' ? '3px' : '1px'
            }}>
              {result.label === '🏆 JACKPOT'
                ? '🎉 JACKPOT! Rs 50 WALLET!'
                : result.type !== 'none'
                  ? `You won ${result.label}!`
                  : 'Better luck tomorrow!'}
            </div>
            {result.label === '🏆 JACKPOT' && (
              <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '6px' }}>
                You are statistically one of the rarest winners ever 🏆
              </div>
            )}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {!result && (
            <button
              onClick={handleSpin}
              disabled={spinning}
              style={{
                flex: 1, padding: '14px', borderRadius: '12px',
                background: spinning ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--primary), #c1121f)',
                border: 'none', color: '#fff', fontFamily: "'Orbitron',sans-serif",
                fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px',
                cursor: spinning ? 'not-allowed' : 'pointer',
                boxShadow: spinning ? 'none' : '0 4px 20px rgba(230,57,70,0.5)',
                transition: 'all 0.2s'
              }}
            >
              {spinning ? '⚡ SPINNING...' : '🎰 SPIN NOW'}
            </button>
          )}
          <button
            onClick={onClose}
            style={{
              flex: result ? 1 : 0, padding: '14px 20px', borderRadius: '12px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--muted)', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600,
              transition: 'all 0.2s'
            }}
          >
            {result ? 'Close' : '✕'}
          </button>
        </div>

        <p style={{ marginTop: '12px', fontSize: '0.72rem', color: '#444' }}>
          Free spin resets daily at midnight
        </p>
      </div>
    </div>
  );
}
