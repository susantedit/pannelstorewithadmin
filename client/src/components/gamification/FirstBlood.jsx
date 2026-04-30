import { useState, useEffect } from 'react';

export default function FirstBlood({ onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 600);
    }, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <style>{`
        @keyframes firstblood-in {
          0%   { opacity:0; transform:scale(0.5) rotate(-5deg); }
          60%  { opacity:1; transform:scale(1.1) rotate(2deg); }
          100% { opacity:1; transform:scale(1) rotate(0deg); }
        }
        @keyframes firstblood-out {
          from { opacity:1; transform:scale(1); }
          to   { opacity:0; transform:scale(0.8) translateY(-20px); }
        }
        @keyframes blood-drip {
          0%   { transform:scaleY(0); transform-origin:top; }
          100% { transform:scaleY(1); transform-origin:top; }
        }
        @keyframes xp-bounce {
          0%,100% { transform:translateY(0); }
          50%     { transform:translateY(-8px); }
        }
      `}</style>
      <div style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
        animation: visible ? 'none' : 'firstblood-out 0.6s ease forwards',
        cursor: 'pointer'
      }} onClick={() => { setVisible(false); setTimeout(onDismiss, 600); }}>
        <div style={{
          textAlign: 'center',
          animation: 'firstblood-in 0.8s cubic-bezier(0.175,0.885,0.32,1.275) forwards'
        }}>
          {/* Blood drip effect */}
          <div style={{ fontSize: '4rem', marginBottom: '8px', filter: 'drop-shadow(0 0 20px rgba(230,57,70,0.8))' }}>
            🩸
          </div>

          <div style={{
            fontFamily: "'Orbitron',sans-serif",
            fontSize: 'clamp(2rem, 8vw, 4rem)',
            fontWeight: 900,
            color: '#e63946',
            letterSpacing: '4px',
            textShadow: '0 0 30px rgba(230,57,70,0.8), 0 0 60px rgba(230,57,70,0.4)',
            lineHeight: 1,
            marginBottom: '12px'
          }}>
            FIRST BLOOD
          </div>

          <div style={{
            fontFamily: "'Rajdhani',sans-serif",
            fontSize: '1.1rem',
            color: '#fff',
            marginBottom: '20px',
            opacity: 0.9
          }}>
            Your first order is complete! Welcome to the squad.
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '10px',
            padding: '12px 24px',
            background: 'rgba(230,57,70,0.15)',
            border: '1px solid rgba(230,57,70,0.4)',
            borderRadius: '12px',
            animation: 'xp-bounce 1s ease-in-out infinite'
          }}>
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.9rem', color: '#fbbf24', fontWeight: 700, letterSpacing: '2px' }}>
              +50 XP BONUS
            </span>
          </div>

          <div style={{ marginTop: '20px', fontSize: '0.78rem', color: 'var(--muted)' }}>
            Tap anywhere to continue
          </div>
        </div>
      </div>
    </>
  );
}
