import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { signInWithGoogle, firebaseSignOut, auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const tryAuth = async (firebaseUser) => {
      if (cancelled) return;
      try {
        const res = await api.me();
        if (res?.user) {
          if (!cancelled) { setUser(res.user); setLoading(false); }
          return;
        }

        // No valid cookie — re-auth via Firebase token
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken(true);
            const res2 = await api.firebaseSession(idToken, firebaseUser.displayName || '');
            if (res2?.ok && res2?.user) {
              if (!cancelled) { setUser(res2.user); setLoading(false); }
              return;
            }
          } catch {}
        }

        if (!cancelled) { setUser(null); setLoading(false); }
      } catch {
        if (!cancelled) { setUser(null); setLoading(false); }
      }
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      tryAuth(firebaseUser);
    });

    return () => { cancelled = true; unsubscribe(); };
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
