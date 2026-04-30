import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { signInWithGoogle, firebaseSignOut } from '../firebase/firebaseConfig';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from httpOnly cookie on app load
  useEffect(() => {
    api.me()
      .then(res => setUser(res?.user || null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  /** Google sign-in → exchange Firebase ID token for backend session cookie */
  async function loginWithGoogle() {
    const { idToken, name } = await signInWithGoogle();
    const res = await api.firebaseSession(idToken, name);
    if (!res?.ok || !res?.user) {
      throw new Error(res?.message || 'Session creation failed');
    }
    setUser(res.user);
    return res.user;
  }

  /** Sign out from Firebase + clear backend session cookie */
  async function logout() {
    try {
      await Promise.all([firebaseSignOut(), api.logout()]);
    } catch (err) {
      console.warn('Logout error:', err);
    }
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user,
      isAdmin: user?.role === 'admin',
      isVip: !!(user?.vipExpiresAt && new Date(user.vipExpiresAt) > new Date()),
      loading,
      loginWithGoogle,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
