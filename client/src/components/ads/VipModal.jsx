import { useState } from 'react';
import { Modal } from '../modals/Modal';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import QrDisplay from '../shared/QrDisplay';

/**
 * VipModal — lets users subscribe to VIP (Rs 199/month) to remove ads.
 * User pays via eSewa/Bank, enters transaction number, admin verifies and grants.
 */
export default function VipModal({ open, onClose }) {
  const { user, isVip } = useAuth();
  const [step, setStep] = useState('info'); // 'info' | 'pay' | 'done'
  const [payMethod, setPayMethod] = useState('esewa');
  const [txn, setTxn] = useState('');
  const [txnError, setTxnError] = useState('');
  const [loading, setLoading] = useState(false);

  const ESEWA_NUMBER  = import.meta.env.VITE_ESEWA_NUMBER  || '9708838261';
  const BANK_NAME     = import.meta.env.VITE_BANK_NAME     || 'NIC Asia Bank';
  const BANK_ACCOUNT  = import.meta.env.VITE_BANK_ACCOUNT  || '1234567890';

  const handleSubmit = async () => {
    if (!txn.trim()) { setTxnError('Transaction number is required'); return; }
    setLoading(true);
    try {
      const res = await api.requestVip({ transaction: txn.trim(), paymentMethod: payMethod });
      if (res?.ok) {
        setStep('done');
      } else {
        setTxnError(res?.message || 'Failed to submit. Try again.');
      }
    } catch {
      setTxnError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('info');
    setTxn('');
    setTxnError('');
    onClose();
  };

  return (
    <Modal isOpen={open} onClose={handleClose} title="⭐ VIP Subscription">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Already VIP */}
        {isVip && (
          <div style={{
            padding: '16px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.05))',
            border: '1px solid rgba(251,191,36,0.4)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>⭐</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.85rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '2px' }}>
              YOU ARE VIP
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '6px' }}>
              Expires: {new Date(user.vipExpiresAt).toLocaleDateString()}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#4ade80', marginTop: '4px' }}>
              ✓ Ads hidden — enjoy the clean experience!
            </div>
          </div>
        )}

        {/* Info step */}
        {!isVip && step === 'info' && (
          <>
            <div style={{
              padding: '16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(230,57,70,0.08))',
              border: '1px solid rgba(251,191,36,0.3)',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>⭐</div>
              <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '1rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '2px' }}>
                VIP — Rs 199/month
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--muted)', marginTop: '6px' }}>
                Go ad-free and support SUSANTEDIT
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {[
                { icon: '🚫', label: 'Zero ads — completely ad-free experience' },
                { icon: '⚡', label: 'Faster page loads without ad scripts' },
                { icon: '⭐', label: 'VIP badge on your profile' },
                { icon: '💰', label: 'Support the platform directly' },
                { icon: '🔄', label: 'Renew monthly — cancel anytime' },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', color: 'var(--text)' }}>
                  <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>{f.icon}</span>
                  {f.label}
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('pay')}
              style={{
                padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                color: '#000', fontFamily: "'Orbitron',sans-serif",
                fontSize: '0.85rem', fontWeight: 900, letterSpacing: '2px',
                transition: 'all 0.2s'
              }}
            >
              ⭐ GET VIP — Rs 199/month
            </button>
          </>
        )}

        {/* Pay step */}
        {!isVip && step === 'pay' && (
          <>
            {/* Payment method selector — FIRST so user picks before seeing QR */}
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { id: 'esewa', label: 'eSewa', color: '#60bb46', icon: 'fa-mobile-screen' },
                { id: 'bank',  label: 'NMB Bank', color: '#60a5fa', icon: 'fa-building-columns' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPayMethod(m.id)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', cursor: 'pointer',
                    background: payMethod === m.id ? `${m.color}22` : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${payMethod === m.id ? m.color : 'rgba(255,255,255,0.08)'}`,
                    color: payMethod === m.id ? m.color : 'var(--muted)',
                    fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                  }}
                >
                  <i className={`fas ${m.icon}`} /> {m.label}
                  {payMethod === m.id && <span style={{ fontSize: '0.65rem' }}>✓</span>}
                </button>
              ))}
            </div>

            {/* Payment details — compact row */}
            <div style={{
              padding: '10px 14px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '5px'
            }}>
              {payMethod === 'esewa' ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Send to:</span>
                    <span style={{ color: '#60bb46', fontWeight: 700, fontFamily: 'monospace' }}>{ESEWA_NUMBER}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Amount:</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>Rs 199</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Remark:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>VIP — {user?.name || 'your name'}</span>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Bank:</span>
                    <span style={{ color: '#60a5fa', fontWeight: 700 }}>{BANK_NAME}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Account:</span>
                    <span style={{ color: '#60a5fa', fontWeight: 700, fontFamily: 'monospace' }}>{BANK_ACCOUNT}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Amount:</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>Rs 199</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--muted)' }}>Remark:</span>
                    <span style={{ color: '#fff', fontWeight: 600 }}>VIP — {user?.name || 'your name'}</span>
                  </div>
                </>
              )}
            </div>

            {/* QR — compact size */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                background: '#fff', borderRadius: '12px', padding: '10px',
                border: `2px solid ${payMethod === 'esewa' ? '#60bb46' : '#60a5fa'}44`,
                width: '180px', height: '180px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'zoom-in', position: 'relative', overflow: 'hidden'
              }}
                onClick={() => {
                  // open full-size in new tab
                  const w = window.open('', '_blank');
                  w.document.write(`<img src="${payMethod === 'esewa' ? '/payment.jpeg' : '/bank.jpg'}" style="max-width:100%;height:auto;" />`);
                }}
                title="Click to view full size"
              >
                <img
                  src={payMethod === 'esewa' ? '/payment.jpeg' : '/bank.jpg'}
                  alt="Payment QR"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <div style={{
                  position: 'absolute', bottom: '4px', right: '4px',
                  background: 'rgba(0,0,0,0.6)', borderRadius: '4px',
                  padding: '2px 5px', fontSize: '0.55rem', color: '#fff'
                }}>
                  🔍 Zoom
                </div>
              </div>

              {/* Download button */}
              <a
                href={payMethod === 'esewa' ? '/payment.jpeg' : '/bank.jpg'}
                download={`susantedit-vip-${payMethod}-qr.jpeg`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '7px 16px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.6)', fontSize: '0.78rem', fontWeight: 600,
                  textDecoration: 'none', transition: 'all 0.2s'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
              >
                <i className="fas fa-download" /> Download QR
              </a>
            </div>

            {/* Transaction input */}
            <div>
              <label style={{ fontSize: '0.8rem', color: 'var(--muted)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                Transaction / Reference Number *
              </label>
              <input
                value={txn}
                onChange={e => { setTxn(e.target.value); setTxnError(''); }}
                placeholder="e.g. ESW123456789"
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)', border: `1px solid ${txnError ? '#e63946' : 'rgba(255,255,255,0.1)'}`,
                  color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box'
                }}
              />
              {txnError && <div style={{ color: '#e63946', fontSize: '0.78rem', marginTop: '4px' }}>{txnError}</div>}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setStep('info')}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                  background: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  flex: 2, padding: '12px', borderRadius: '8px', border: 'none', cursor: loading ? 'default' : 'pointer',
                  background: loading ? 'rgba(251,191,36,0.3)' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                  color: '#000', fontWeight: 900, fontSize: '0.85rem',
                  fontFamily: "'Orbitron',sans-serif", letterSpacing: '1px'
                }}
              >
                {loading ? 'Submitting...' : '⭐ Submit Payment'}
              </button>
            </div>
          </>
        )}

        {/* Done step */}
        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: '0.9rem', fontWeight: 700, color: '#4ade80', letterSpacing: '2px', marginBottom: '8px' }}>
              REQUEST SUBMITTED!
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--muted)', lineHeight: 1.6 }}>
              Admin will verify your payment and activate VIP within <strong style={{ color: '#fbbf24' }}>30 minutes</strong>.
              You'll see the ⭐ badge on your profile once activated.
            </div>
            <button
              onClick={handleClose}
              style={{
                marginTop: '16px', padding: '12px 24px', borderRadius: '8px', border: 'none',
                background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)',
                color: '#4ade80', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem'
              }}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
