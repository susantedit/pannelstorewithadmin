import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email is required');
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        // Don't leak whether account exists — show success anyway
        setSent(true);
      } else {
        setError(err?.message || 'Failed to send reset email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <img src="/logo.png" alt="Logo" style={{ height: '48px', width: '48px', objectFit: 'contain', marginBottom: '16px' }} />
          <h1>Reset Password</h1>
          <p>We'll send a reset link to your email</p>
        </div>

        {sent ? (
          <div style={{
            padding: '16px',
            background: 'rgba(95, 226, 167, 0.12)',
            border: '1px solid rgba(95, 226, 167, 0.3)',
            borderRadius: '12px',
            color: '#5fe2a7',
            textAlign: 'center',
            marginBottom: '16px'
          }}>
            Check your inbox — a reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Email"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
            />
            {error && <div className="form-error-alert">{error}</div>}
            <Button variant="primary" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Sending...' : 'Send reset link'}
            </Button>
          </form>
        )}

        <div className="auth-divider" />
        <Button variant="secondary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
          Back to sign in
        </Button>
      </div>
    </div>
  );
}
