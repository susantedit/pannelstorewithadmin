import { useEffect } from 'react';

export function Modal({ isOpen, onClose, title, children, size = 'md', actions = null }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)', zIndex: 1000
        }}
      />
      <div
        className={`modal modal-${size}`}
        style={{
          position: 'fixed',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 1001,
          background: '#0d0d0d',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: '20px',
          boxShadow: '0 25px 60px rgba(0,0,0,0.8), 0 0 0 1px rgba(230,57,70,0.1)',
          display: 'flex', flexDirection: 'column',
          maxHeight: '90dvh',
          width: '90%',
        }}
      >
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0
        }}>
          <h2 style={{
            margin: 0, fontSize: '1rem', fontWeight: 700,
            fontFamily: "'Orbitron', sans-serif", letterSpacing: '2px',
            textTransform: 'uppercase', color: '#fff'
          }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px', width: '32px', height: '32px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--muted)', cursor: 'pointer', fontSize: '1rem', flexShrink: 0
            }}
          >✕</button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '20px 24px' }}>
          {children}
        </div>
        {actions && (
          <div style={{
            padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)',
            display: 'flex', justifyContent: 'flex-end', gap: '10px', flexShrink: 0
          }}>
            {actions}
          </div>
        )}
      </div>
    </>
  );
}
