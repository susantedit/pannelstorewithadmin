import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';
import { signInWithGoogle, firebaseSignOut, auth } from '../firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Wait for Firebase to initialize, then try to restore backend session
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        // First try existing backend cookie
        const res = await api.me();
        if (res?.user) {
          setUser(res.user);
          setLoading(false);
          return;
        }

        // Cookie missing/expired — if Firebase has a user, get fresh token
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken(true);
          const res2 = await api.firebaseSession(idToken, firebaseUser.displayName || '');
          if (res2?.ok && res2?.user) {
            setUser(res2.user);
            setLoading(false);
            return;
          }
        }

        setUser(null);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
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
