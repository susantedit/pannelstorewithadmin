export function SupportFab({ href = 'https://wa.me/9779708838261', label = 'WhatsApp Support' }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      style={{
        position: 'fixed',
        right: '18px',
        bottom: '18px',
        zIndex: 1200,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '12px 16px',
        borderRadius: '999px',
        background: 'linear-gradient(135deg, #25D366, #1faa52)',
        color: '#fff',
        textDecoration: 'none',
        boxShadow: '0 14px 30px rgba(37, 211, 102, 0.3)',
        border: '1px solid rgba(255,255,255,0.15)',
        fontWeight: 700,
        fontSize: '0.85rem'
      }}
    >
      <i className="fab fa-whatsapp" style={{ fontSize: '1rem' }} />
      {label}
    </a>
  );
}
