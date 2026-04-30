import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

/**
 * Sign in with Google popup.
 * Returns the Firebase ID token string.
 */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return { idToken, name: result.user.displayName || '', email: result.user.email || '' };
}

/**
 * Register with email + password, set display name, return ID token.
 */
export async function registerWithEmail(name, email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  const idToken = await credential.user.getIdToken();
  return { idToken, name, email };
}

/**
 * Sign in with email + password, return ID token.
 */
export async function loginWithEmail(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await credential.user.getIdToken();
  return { idToken, name: credential.user.displayName || '', email };
}

/**
 * Send a password reset email via Firebase.
 */
export async function resetPasswordEmail(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Sign out from Firebase (client-side only).
 */
export async function firebaseSignOut() {
  await signOut(auth);
}

/**
 * Silent session refresh — if Firebase still has a logged-in user,
 * get a fresh ID token and exchange it for a new backend session cookie.
 * Returns true if successful, false if no Firebase user.
 */
export async function refreshFirebaseSession() {
  const currentUser = auth.currentUser;
  if (!currentUser) return false;
  try {
    const idToken = await currentUser.getIdToken(true); // force refresh
    const { api } = await import('../services/api.js');
    const res = await api.firebaseSession(idToken, currentUser.displayName || '');
    return !!(res?.ok && res?.user);
  } catch {
    return false;
  }
}

export { auth, app };
