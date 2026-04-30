export default function QuickReorder({ lastOrder, onReorder }) {
  if (!lastOrder?.product) return null;

  return (
    <div style={{
      padding: '14px 18px',
      background: 'linear-gradient(135deg, rgba(230,57,70,0.12), rgba(230,57,70,0.05))',
      border: '1px solid rgba(230,57,70,0.3)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      <div>
        <div style={{ fontSize: '0.68rem', color: 'var(--muted)', fontFamily: "'Orbitron',sans-serif", letterSpacing: '1px', marginBottom: '3px' }}>
          ⚡ QUICK REORDER
        </div>
        <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.95rem' }}>
          {lastOrder.product}
          {lastOrder.package && <span style={{ color: 'var(--muted)', fontWeight: 400, fontSize: '0.85rem' }}> · {lastOrder.package}</span>}
        </div>
        {lastOrder.price && (
          <div style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
            Rs {lastOrder.price}
          </div>
        )}
      </div>
      <button
        onClick={onReorder}
        style={{
          padding: '10px 20px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--primary), #c1121f)',
          border: 'none', color: '#fff', fontWeight: 700,
          fontSize: '0.85rem', cursor: 'pointer',
          fontFamily: "'Orbitron',sans-serif", letterSpacing: '1px',
          boxShadow: '0 4px 14px rgba(230,57,70,0.4)',
          transition: 'all 0.2s', flexShrink: 0
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(230,57,70,0.6)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(230,57,70,0.4)'; }}
      >
        <i className="fas fa-bolt" /> ONE CLICK
      </button>
    </div>
  );
}
