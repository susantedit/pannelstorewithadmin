import { useState } from 'react';
import { api } from '../../services/api';
import { showToast } from '../../utils/notify';

export default function AvatarUploadCard({ currentUser, onAvatarUpload }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentUser?.profile?.avatarUrl || '');

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { showToast('Please select an image file', 'error'); return; }
    if (file.size > 200 * 1024) { showToast('Image must be under 200KB', 'error'); return; }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      setPreview(base64);
      setUploading(true);
      try {
        const res = await api.uploadAvatar(base64);
        if (res?.ok) {
          showToast('Avatar updated!', 'success');
          if (onAvatarUpload) onAvatarUpload(base64);
        } else {
          showToast(res?.message || 'Upload failed', 'error');
        }
      } catch { showToast('Failed to upload', 'error'); }
      finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const avatarSrc = preview || currentUser?.profile?.avatarUrl || '';

  return (
    <div className="panel">
      <div className="panel-header"><h2>🎨 Profile Picture</h2></div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '8px 0' }}>
        {/* Avatar preview */}
        <div style={{ position: 'relative' }}>
          {avatarSrc ? (
            <img src={avatarSrc} alt="Avatar" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary)', boxShadow: '0 0 16px rgba(230,57,70,0.3)' }} />
          ) : (
            <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(230,57,70,0.1)', border: '3px solid rgba(230,57,70,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
              {currentUser?.name?.[0]?.toUpperCase() || '👤'}
            </div>
          )}
          <label htmlFor="avatar-input" style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--primary)', border: '2px solid #0a0a0a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '0.7rem', color: '#fff'
          }}>
            <i className="fas fa-camera" />
          </label>
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', margin: 0 }}>JPG/PNG/WebP · Max 200KB</p>
        </div>
        <label htmlFor="avatar-input" style={{
          padding: '8px 20px', borderRadius: '8px', cursor: 'pointer',
          background: uploading ? 'rgba(255,255,255,0.05)' : 'rgba(230,57,70,0.1)',
          border: '1px solid rgba(230,57,70,0.3)', color: uploading ? 'var(--muted)' : 'var(--primary)',
          fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px'
        }}>
          {uploading ? <><i className="fas fa-spinner fa-spin" /> Uploading...</> : <><i className="fas fa-upload" /> Change Photo</>}
        </label>
        <input id="avatar-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} disabled={uploading} />
      </div>
    </div>
  );
}
