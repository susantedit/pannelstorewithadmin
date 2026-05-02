import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { signInWithGoogle, firebaseSignOut, auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

// Store Firebase token globally so api.js can use it as fallback
let _firebaseToken = null;
export function getFirebaseToken() { return _firebaseToken; }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const firebaseUserRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const tryAuth = async (firebaseUser) => {
      firebaseUserRef.current = firebaseUser;

      // Refresh Firebase token and store it
      if (firebaseUser) {
        try {
          _firebaseToken = await firebaseUser.getIdToken(false);
          window.__firebaseToken = _firebaseToken;
        } catch { _firebaseToken = null; window.__firebaseToken = null; }
      } else {
        _firebaseToken = null;
        window.__firebaseToken = null;
      }

      if (cancelled) return;

      try {
        // Try existing backend cookie
        const res = await api.me();
        if (res?.user) {
          if (!cancelled) { setUser(res.user); setLoading(false); }
          return;
        }

        // Cookie failed — use Firebase token to get a new session
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken(true);
            _firebaseToken = idToken;
            window.__firebaseToken = idToken;
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

    const unsubscribe = onAuthStateChanged(auth, tryAuth);
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
