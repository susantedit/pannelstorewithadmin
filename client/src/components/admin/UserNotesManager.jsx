import { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/shared/Button';
import { showToast } from '../../utils/notify';

export default function UserNotesManager({ users = [], onNotesUpdate }) {
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const selectedUser = users.find(u => u._id === selectedUserId);

  const handleSelectUser = (user) => {
    setSelectedUserId(user._id);
    setNotes(user.adminNotes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedUserId) return;
    setLoading(true);
    try {
      const res = await api.updateUserNotes(selectedUserId, notes);
      if (res?.ok) {
        showToast('Notes saved successfully!', 'success');
        onNotesUpdate(selectedUserId, notes);
      } else {
        showToast(res?.message || 'Failed to save notes', 'error');
      }
    } catch (error) {
      showToast('Error saving notes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="panel" style={{ marginTop: '16px' }}>
      <div className="panel-header"><h2>📝 User Notes</h2></div>
      <p style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '14px' }}>
        Add private notes about users. Visible only to admins.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minHeight: '400px' }}>
        {/* User List */}
        <div>
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '8px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--text)',
              marginBottom: '12px',
              fontSize: '0.85rem'
            }}
          />
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            maxHeight: '350px',
            overflowY: 'auto'
          }}>
            {filteredUsers.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center' }}>No users found</p>
            ) : (
              filteredUsers.map(user => (
                <button
                  key={user._id}
                  onClick={() => handleSelectUser(user)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: selectedUserId === user._id ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${selectedUserId === user._id ? 'var(--primary)' : 'rgba(255,255,255,0.1)'}`,
                    color: selectedUserId === user._id ? '#000' : 'var(--text)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontWeight: 700 }}>{user.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>{user.email}</div>
                  {user.adminNotes && (
                    <div style={{ fontSize: '0.7rem', marginTop: '4px', opacity: 0.6 }}>
                      📝 Has notes
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Notes Editor */}
        <div>
          {selectedUser ? (
            <>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--muted)' }}>Editing notes for:</p>
                <p style={{ fontSize: '0.9rem', color: '#fff', margin: '4px 0' }}>{selectedUser.name}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--muted)', margin: 0 }}>{selectedUser.email}</p>
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Add notes here... e.g., 'Paid twice, refunded on May 1', 'VIP customer', 'Needs follow-up'"
                style={{
                  width: '100%',
                  minHeight: '200px',
                  padding: '12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text)',
                  fontSize: '0.85rem',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                  marginBottom: '12px'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSaveNotes}
                  disabled={loading}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'var(--primary)',
                    border: 'none',
                    color: '#000',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    opacity: loading ? 0.5 : 1
                  }}
                >
                  {loading ? 'Saving...' : '💾 Save Notes'}
                </button>
                <button
                  onClick={() => setNotes('')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.1)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  Clear
                </button>
              </div>
            </>
          ) : (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'var(--muted)',
              textAlign: 'center',
              minHeight: '300px'
            }}>
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📝</div>
                <p>Select a user to add notes</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
