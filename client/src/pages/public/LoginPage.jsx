import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/shared/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const userData = await loginWithGoogle();
      navigate(userData.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <img
            src="/logo.png"
            alt="Logo"
            style={{ height: '64px', width: '64px', objectFit: 'contain', marginBottom: '20px' }}
          />
          <h1>Smart Payment System</h1>
          <p>Sign in to continue</p>
        </div>

        {error && (
          <div className="form-error-alert" style={{ marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <Button
          variant="primary"
          style={{ width: '100%', gap: '12px', fontSize: '1rem', padding: '14px' }}
          onClick={handleGoogle}
          disabled={loading}
        >
          <GoogleIcon />
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        <p style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '0.82rem',
          color: 'var(--muted)',
          lineHeight: 1.6
        }}>
          By signing in you agree to our terms of service.
          <br />
          Admin access is assigned by the platform owner.
        </p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function friendlyError(err) {
  const code = err?.code || '';
  if (code === 'auth/popup-closed-by-user') return 'Sign-in was cancelled';
  if (code === 'auth/popup-blocked') return 'Popup was blocked — allow popups for this site';
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection.';
  if (code === 'auth/cancelled-popup-request') return '';
  return err?.message || 'Sign in failed. Please try again.';
}
