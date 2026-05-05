import { useState } from 'react';
import { api } from '../../services/api';
import { Button } from '../../components/shared/Button';
import { showToast } from '../../utils/notify';

export default function AvatarUploadCard({ currentAvatar, onAvatarUpdate }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(currentAvatar);

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('Please select an image file', 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be under 2MB', 'error');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
    };
    reader.readAsDataURL(file);

    // Upload
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const res = await api.request('/api/auth/upload-avatar', {
        method: 'POST',
        body: formData
      });

      if (res?.ok) {
        showToast('Avatar updated successfully!', 'success');
        onAvatarUpdate(res.avatarUrl);
      } else {
        showToast(res?.message || 'Upload failed', 'error');
      }
    } catch (error) {
      showToast('Failed to upload avatar', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      const input = document.getElementById('avatar-input');
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      handleFileSelect({ target: input });
    }
  };

  return (
    <div className="panel" style={{ marginBottom: '16px' }}>
      <div className="panel-header"><h2>🎨 Profile Picture</h2></div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onDragLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
        }}
        onDrop={handleDrop}
        onClick={() => document.getElementById('avatar-input').click()}
        style={{
          border: '2px dashed rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          minHeight: '200px',
          justifyContent: 'center'
        }}
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt="Avatar preview"
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid var(--primary)'
              }}
            />
            <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
              Click or drag to replace
            </p>
          </>
        ) : (
          <>
            <div style={{ fontSize: '3rem' }}>📷</div>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, margin: '0 0 4px 0' }}>Upload Profile Picture</p>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', margin: 0 }}>
                JPG, PNG or WebP (Max 2MB)
              </p>
            </div>
          </>
        )}
      </div>

      <input
        id="avatar-input"
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleFileSelect}
        disabled={uploading}
      />

      <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
        <Button
          variant="primary"
          onClick={() => document.getElementById('avatar-input').click()}
          disabled={uploading}
          style={{ flex: 1 }}
        >
          {uploading ? 'Uploading...' : '📤 Choose Image'}
        </Button>
        {preview && preview !== currentAvatar && (
          <button
            onClick={() => setPreview(currentAvatar)}
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
            Cancel
          </button>
        )}
      </div>

      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: '12px', textAlign: 'center' }}>
        Your profile picture helps others recognize you
      </p>
    </div>
  );
}
