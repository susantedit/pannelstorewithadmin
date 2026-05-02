import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/shared/Input';
import { Button } from '../../components/shared/Button';
import Scene3D from '../../components/3d/Scene3D';
import PulsingCore from '../../components/3d/PulsingCore';
import { Canvas } from '@react-three/fiber';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return setError('Email address required');
    setLoading(true);
    setError('');
    try {
      await forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/user-not-found') {
        setSent(true);
      } else {
        setError(err?.message || 'Failed to transmit reset signal');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
        <Scene3D />
        <Canvas style={{ position: 'absolute', top: 0, left: 0 }}>
          <PulsingCore />
        </Canvas>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-container glass"
        style={{ zIndex: 1, maxWidth: '440px' }}
      >
        <div className="auth-header">
          <motion.div 
            whileHover={{ rotate: 15 }}
            style={{ marginBottom: '24px', display: 'inline-block' }}
          >
            <Mail size={48} color="var(--primary)" style={{ filter: 'drop-shadow(0 0 10px var(--primary))' }} />
          </motion.div>
          <h1 className="text-gradient">RECOVER ACCESS</h1>
          <p style={{ color: 'var(--muted)', letterSpacing: '1px' }}>ENTER EMAIL TO RECEIVE RESET SIGNAL</p>
        </div>

        {sent ? (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            style={{
              padding: '24px',
              background: 'rgba(74, 222, 128, 0.1)',
              border: '1px solid rgba(74, 222, 128, 0.3)',
              borderRadius: '16px',
              color: '#4ade80',
              textAlign: 'center',
              marginBottom: '24px'
            }}
          >
            <Send size={24} style={{ marginBottom: '12px' }} />
            <div style={{ fontWeight: 700 }}>SIGNAL TRANSMITTED</div>
            <p style={{ fontSize: '0.85rem', marginTop: '8px', opacity: 0.8 }}>Check your secure inbox for the recovery link.</p>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <Input
              label="Secure Email"
              name="email"
              type="email"
              placeholder="operator@system.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              required
              icon={<Mail size={16} />}
            />
            {error && <div className="form-error-alert" style={{ marginBottom: '16px' }}>{error}</div>}
            
            <Button 
              variant="primary" 
              style={{ width: '100%', padding: '16px', fontSize: '1.1rem', gap: '10px' }} 
              disabled={loading}
            >
              {loading ? 'Transmitting...' : 'Send Reset Signal'}
            </Button>
          </form>
        )}

        <div className="auth-divider" style={{ margin: '32px 0' }} />
        
        <Button 
          variant="ghost" 
          style={{ width: '100%', gap: '8px' }} 
          onClick={() => navigate('/login')}
        >
          <ArrowLeft size={16} /> Back to Authentication
        </Button>
      </motion.div>
    </div>
  );
}
