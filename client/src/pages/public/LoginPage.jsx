import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogIn, ShieldCheck, Mail, Zap, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/shared/Button';
import Scene3D from '../../components/3d/Scene3D';
import PulsingCore from '../../components/3d/PulsingCore';
import { Canvas } from '@react-three/fiber';

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
        transition={{ duration: 0.5 }}
        className="auth-container glass" 
        style={{ zIndex: 1, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 0 50px rgba(0,0,0,0.5)' }}
      >
        <div className="auth-header">
          <motion.img
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            src="/logo.png"
            alt="Logo"
            style={{ height: '80px', width: '80px', objectFit: 'contain', marginBottom: '24px', filter: 'drop-shadow(0 0 15px var(--primary))' }}
          />
          <h1 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 900 }}>WELCOME BACK</h1>
          <p style={{ color: 'var(--muted)', letterSpacing: '2px' }}>AUTHENTICATE TO ACCESS SYSTEM</p>
        </div>

        {error && (
          <motion.div 
            initial={{ x: -10 }}
            animate={{ x: 0 }}
            className="form-error-alert" 
            style={{ marginBottom: '24px' }}
          >
            {error}
          </motion.div>
        )}

        <div style={{ display: 'grid', gap: '16px' }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="primary"
              style={{ 
                width: '100%', 
                gap: '12px', 
                fontSize: '1.1rem', 
                padding: '16px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                color: '#fff',
                border: 'none',
                boxShadow: '0 10px 20px rgba(230, 57, 70, 0.3)'
              }}
              onClick={handleGoogle}
              disabled={loading}
            >
              <GoogleIcon />
              {loading ? 'Processing...' : 'Continue with Google'}
            </Button>
          </motion.div>
        </div>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '20px', opacity: 0.5 }}>
           <ShieldCheck size={20} />
           <Zap size={20} />
           <Globe size={20} />
        </div>

        <p style={{
          textAlign: 'center',
          marginTop: '32px',
          fontSize: '0.8rem',
          color: 'var(--muted)',
          lineHeight: 1.6
        }}>
          Secure authentication powered by Google. <br />
          By continuing, you agree to the Elite Performance Protocols.
        </p>
      </motion.div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" opacity="0.8"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" opacity="0.6"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" opacity="0.9"/>
    </svg>
  );
}

function friendlyError(err) {
  const code = err?.code || '';
  if (code === 'auth/popup-closed-by-user') return 'Session cancelled by user';
  if (code === 'auth/popup-blocked') return 'Please enable popups for authentication';
  if (code === 'auth/network-request-failed') return 'Connection error detected';
  return 'Authentication failed. Please retry.';
}
