import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  inMemoryPersistence,
  browserPopupRedirectResolver
} from 'firebase/auth';

const getEnv = (key, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta?.env?.[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process?.env?.[key]) {
    return process.env[key];
  }
  return fallback;
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY', getEnv('REACT_APP_FIREBASE_API_KEY', 'demo-api-key')),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', getEnv('REACT_APP_FIREBASE_AUTH_DOMAIN', 'momentum.firebaseapp.com')),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', getEnv('REACT_APP_FIREBASE_PROJECT_ID', 'momentum-app')),
  appId: getEnv('VITE_FIREBASE_APP_ID', getEnv('REACT_APP_FIREBASE_APP_ID', '1:123456789:web:abcdef'))
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// STRICT HARD RULE: Force in-memory persistence ONLY from initialization.
// We configure browserPopupRedirectResolver so signInWithPopup works seamlessly.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: inMemoryPersistence,
    popupRedirectResolver: browserPopupRedirectResolver
  });
} catch (_) {
  authInstance = getAuth(app);
}
export const auth = authInstance;

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Initiates Google popup sign-in, extracts the ID token, and immediately signs out of
 * the Firebase client SDK so the client never holds a token in memory or storage.
 * The ID token is exchanged on the server for an httpOnly session cookie.
 */
export async function signInWithGoogleAndGetIdToken() {
  try {
    const result = await signInWithPopup(auth, googleProvider, browserPopupRedirectResolver);
    const idToken = await result.user.getIdToken();

    // Immediately sign out from Firebase client SDK to keep browser 100% stateless
    await signOut(auth);

    return { idToken, user: result.user };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Click "Continue with Google" whenever you are ready.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for Momentum.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized in Firebase Console. Please add localhost (or your domain) under Authentication > Settings > Authorized domains.');
    } else if (error.code === 'auth/operation-not-allowed') {
      throw new Error('Google Sign-In is not enabled in Firebase. Please enable Google under Authentication > Sign-in method in Firebase Console.');
    } else if (error.code === 'auth/invalid-api-key' || error.code === 'auth/api-key-not-valid') {
      throw new Error('Firebase API key is invalid or not yet active. Please check your .env configuration.');
    } else if (error.code === 'auth/network-request-failed') {
      throw new Error('Network error connecting to Firebase. Please check your internet connection.');
    }
    throw error;
  }
}
