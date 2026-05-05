import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Input } from '../../components/shared/Input';
import { Badge } from '../../components/shared/Badge';
import { formatDate, getStatusColor } from '../../utils/helpers';
import { showToast } from '../../utils/notify';

export default function OrderHistoryPage({ currentUser }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getRequests('mine');
      if (res?.requests) {
        setOrders(res.requests.map(r => ({ ...r, id: r.id || r._id })));
      }
    } catch (e) {
      showToast('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const matchSearch = !searchTerm || 
      o.product?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.packageName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(o.id || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchStatus = filter === 'all' || o.status.toLowerCase().includes(filter);
    
    const orderDate = new Date(o.createdAt || o.updatedAt);
    const matchFromDate = !dateFrom || orderDate >= new Date(dateFrom);
    const matchToDate = !dateTo || orderDate <= new Date(dateTo + 'T23:59:59');
    
    return matchSearch && matchStatus && matchFromDate && matchToDate;
  }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const totalSpend = filteredOrders
    .filter(o => o.status.toLowerCase().includes('accept'))
    .reduce((sum, o) => sum + (parseFloat(o.packagePrice) || 0), 0);

  const stats = {
    total: filteredOrders.length,
    completed: filteredOrders.filter(o => o.status.toLowerCase().includes('accept')).length,
    pending: filteredOrders.filter(o => o.status.toLowerCase().includes('pending') || o.status.toLowerCase().includes('awaiting')).length,
    rejected: filteredOrders.filter(o => o.status.toLowerCase().includes('reject')).length,
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease' }}>
      <div className="section-header">
        <h1>📦 Order History</h1>
        <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: '4px' }}>Track all your purchases and their status</p>
      </div>

      {/* Stats Summary */}
      <div className="stats-grid" style={{ marginBottom: '20px' }}>
        <div className="stat-card glass-card">
          <div className="stat-icon"><i className="fas fa-bag-shopping" /></div>
          <div className="stat-info"><h3>{stats.total}</h3><p>Total Orders</p></div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ color: '#4ade80', background: 'rgba(74,222,128,0.15)', borderColor: 'rgba(74,222,128,0.3)' }}><i className="fas fa-check-circle" /></div>
          <div className="stat-info"><h3 style={{ color: '#4ade80' }}>{stats.completed}</h3><p>Completed</p></div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon" style={{ color: '#fbbf24', background: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.3)' }}><i className="fas fa-clock" /></div>
          <div className="stat-info"><h3 style={{ color: '#fbbf24' }}>{stats.pending}</h3><p>Pending</p></div>
        </div>
        <div className="stat-card glass-card">
          <div className="stat-icon"><i className="fas fa-indian-rupee-sign" /></div>
          <div className="stat-info"><h3>Rs {totalSpend.toLocaleString()}</h3><p>Total Spend</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="panel" style={{ marginBottom: '16px' }}>
        <div className="panel-header"><h2>Filters</h2></div>
        <div style={{ display: 'grid', gap: '12px', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))' }}>
          <Input
            placeholder="Search product, package, ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Input
            type="date"
            placeholder="From date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
          <Input
            type="date"
            placeholder="To date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '6px', alignItems: 'flex-end' }}>
            {['all', 'accepted', 'pending', 'rejected'].map(f => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
                style={{ fontSize: '0.75rem', padding: '6px 10px' }}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="panel" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <p style={{ padding: '40px', textAlign: 'center', color: 'var(--muted)' }}>Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="table-empty">No orders found</p>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Package</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Order Date</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(o => (
                  <tr key={o.id} style={{
                    background: o.status.toLowerCase().includes('accept') ? 'rgba(74,222,128,0.04)' : 
                                o.status.toLowerCase().includes('reject') ? 'rgba(230,57,70,0.04)' : 'transparent',
                    borderLeft: o.status.toLowerCase().includes('accept') ? '3px solid #4ade80' :
                                o.status.toLowerCase().includes('reject') ? '3px solid #ff6b6b' : 'none'
                  }}>
                    <td>
                      <strong style={{ color: '#fff' }}>{o.product}</strong>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>{o.packageName || '—'}</td>
                    <td style={{ color: '#fbbf24', fontWeight: 700 }}>Rs {o.packagePrice || '0'}</td>
                    <td><Badge variant={getStatusColor(o.status)}>{o.status}</Badge></td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{formatDate(o.createdAt || o.updatedAt)}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{formatDate(o.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>📦</div>
          <p>No orders yet. Start shopping to see your order history!</p>
        </div>
      )}
    </div>
  );
}
