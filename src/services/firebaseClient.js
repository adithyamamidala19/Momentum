import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  inMemoryPersistence,
  setPersistence
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || import.meta.env.REACT_APP_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN || 'momentum.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || import.meta.env.REACT_APP_FIREBASE_PROJECT_ID || 'momentum-app',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || import.meta.env.REACT_APP_FIREBASE_APP_ID || '1:123456789:web:abcdef'
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

// STRICT HARD RULE: Force in-memory persistence only.
// ZERO tokens are ever stored in localStorage or IndexedDB.
try {
  setPersistence(auth, inMemoryPersistence);
} catch (err) {
  console.warn('Could not set inMemoryPersistence:', err);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Initiates Google popup sign-in, extracts the ID token, and immediately signs out of
 * the Firebase client SDK so the client never holds a token in memory or storage.
 * The ID token is exchanged on the server for an httpOnly session cookie.
 */
export async function signInWithGoogleAndGetIdToken() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const idToken = await result.user.getIdToken();

    // Immediately sign out from Firebase client SDK to keep browser 100% stateless
    await signOut(auth);

    return { idToken, user: result.user };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in was cancelled. Click "Continue with Google" whenever you are ready.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Sign-in popup was blocked by your browser. Please allow popups for Momentum.');
    }
    throw error;
  }
}
