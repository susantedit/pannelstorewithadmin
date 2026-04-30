import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import AiChat from './components/chat/AiChat';
import KillFeed from './components/feed/KillFeed';
import { api } from './services/api';

// Pages - Public
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';

// Pages - User
import UserDashboardPage from './pages/user/UserDashboardPage';

// Pages - Admin
import AdminDashboardPage from './pages/admin/AdminDashboardPage';

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
}

// Pings the backend every 3 minutes so Render free tier never sleeps
function KeepAlive() {
  useEffect(() => {
    const ping = () => api.ping().catch(() => {});
    ping();
    const id = setInterval(ping, 3 * 60 * 1000);
    return () => clearInterval(id);
  }, []);
  return null;
}

// Injects Popunder + Social Bar scripts globally (highest earning ad formats)
// VIP users are excluded via CSS class on body
function GlobalAds() {
  const { user } = useAuth();
  const isVip = !!(user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date());
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isVip || isAdmin) return;

    const scripts = [];
    const popunderSrc = import.meta.env.VITE_AD_POPUNDER_SRC;
    const socialBarSrc = import.meta.env.VITE_AD_SOCIALBAR_SRC;

    if (popunderSrc) {
      const s = document.createElement('script');
      s.src = popunderSrc; s.async = true;
      document.head.appendChild(s);
      scripts.push(s);
    }
    if (socialBarSrc) {
      const s = document.createElement('script');
      s.src = socialBarSrc; s.async = true;
      document.head.appendChild(s);
      scripts.push(s);
    }

    return () => scripts.forEach(s => { try { document.head.removeChild(s); } catch {} });
  }, [isVip, isAdmin]);

  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <KeepAlive />
        <GlobalAds />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/dashboard" element={<RequireAuth><UserDashboardPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAdmin><AdminDashboardPage /></RequireAdmin>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* AI Chat — visible on every page */}
        <AiChat />
        {/* Kill-Feed purchase ticker */}
        <KillFeed />
      </Router>
    </AuthProvider>
  );
}
