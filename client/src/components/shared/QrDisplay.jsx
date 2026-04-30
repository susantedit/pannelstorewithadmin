import { useState, useRef } from 'react';

/**
 * QrDisplay — animated QR code display with download button
 * Works everywhere a QR needs to be shown.
 *
 * Props:
 *   src        — image src (base64 or URL)
 *   label      — e.g. "eSewa" or "NMB Bank"
 *   amount     — e.g. "Rs 199"
 *   color      — accent color
 *   filename   — download filename
 *   remark     — payment remark text
 */
export default function QrDisplay({ src, label, amount, color = '#e63946', filename = 'qr.jpeg', remark }) {
  const [copied, setCopied] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const imgRef = useRef(null);

  const handleCopyRemark = () => {
    if (!remark) return;
    navigator.clipboard.writeText(remark).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <style>{`
        @keyframes qr-pulse {
          0%,100% { box-shadow: 0 0 0 0 ${color}44; }
          50%      { box-shadow: 0 0 0 10px ${color}00; }
        }
        @keyframes qr-scan {
          0%   { top: 8px; opacity: 1; }
          90%  { top: calc(100% - 8px); opacity: 1; }
          100% { top: calc(100% - 8px); opacity: 0; }
        }
        @keyframes qr-fadein {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes qr-zoom-in {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }
        .qr-wrapper {
          animation: qr-fadein 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
        }
        .qr-scan-line {
          position: absolute;
          left: 8px; right: 8px;
          height: 2px;
          background: linear-gradient(90deg, transparent, ${color}, transparent);
          animation: qr-scan 2s ease-in-out infinite;
          border-radius: 2px;
          pointer-events: none;
        }
        .qr-download-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 16px; border-radius: 8px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.55); font-size: 0.78rem; font-weight: 600;
          text-decoration: none; transition: all 0.2s; cursor: pointer;
        }
        .qr-download-btn:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
          transform: translateY(-1px);
        }
        .qr-zoom-overlay {
          position: fixed; inset: 0; z-index: 99999;
          background: rgba(0,0,0,0.92); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          cursor: zoom-out;
          animation: qr-zoom-in 0.25s ease forwards;
        }
        .qr-zoom-img {
          max-width: min(90vw, 480px);
          max-height: 90vh;
          border-radius: 16px;
          background: #fff;
          padding: 16px;
          object-fit: contain;
        }
      `}</style>

      {/* Zoom overlay */}
      {zoomed && (
        <div className="qr-zoom-overlay" onClick={() => setZoomed(false)}>
          <img src={src} alt="QR Zoomed" className="qr-zoom-img" />
          <div style={{ position: 'absolute', top: '20px', right: '20px', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
            Click anywhere to close
          </div>
        </div>
      )}

      <div className="qr-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', width: '100%' }}>

        {/* Label badge */}
        {label && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 14px', borderRadius: '999px',
            background: `${color}18`, border: `1px solid ${color}44`,
            fontSize: '0.78rem', fontWeight: 700, color,
            fontFamily: "'Orbitron',sans-serif", letterSpacing: '1px'
          }}>
            {label}
            {amount && <span style={{ color: '#fbbf24', marginLeft: '4px' }}>· {amount}</span>}
          </div>
        )}

        {/* QR image container */}
        <div
          onClick={() => setZoomed(true)}
          title="Click to zoom"
          style={{
            position: 'relative', background: '#fff', borderRadius: '16px',
            padding: '12px', width: '100%', maxWidth: '280px',
            border: `2px solid ${color}44`,
            animation: 'qr-pulse 2.5s ease infinite',
            cursor: 'zoom-in', overflow: 'hidden',
          }}
        >
          <img
            ref={imgRef}
            src={src}
            alt="Payment QR"
            style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'contain', borderRadius: '8px' }}
          />
          {/* Scan line animation */}
          <div className="qr-scan-line" />
          {/* Zoom hint */}
          <div style={{
            position: 'absolute', bottom: '8px', right: '8px',
            background: 'rgba(0,0,0,0.5)', borderRadius: '6px',
            padding: '3px 7px', fontSize: '0.6rem', color: 'rgba(255,255,255,0.7)',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            <i className="fas fa-magnifying-glass-plus" /> Zoom
          </div>
        </div>

        {/* Action buttons row */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Download */}
          <a
            href={src}
            download={filename}
            className="qr-download-btn"
          >
            <i className="fas fa-download" /> Download QR
          </a>

          {/* Copy remark */}
          {remark && (
            <button onClick={handleCopyRemark} className="qr-download-btn" style={{ border: `1px solid ${copied ? '#4ade80' : 'rgba(255,255,255,0.12)'}`, color: copied ? '#4ade80' : 'rgba(255,255,255,0.55)' }}>
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} />
              {copied ? 'Copied!' : `Copy remark: ${remark}`}
            </button>
          )}
        </div>

        {/* Instruction */}
        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
          Tap QR to zoom · Download to pay from gallery
        </div>
      </div>
    </>
  );
}
