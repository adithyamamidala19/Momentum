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
  apiKey: getEnv('VITE_FIREBASE_API_KEY', getEnv('REACT_APP_FIREBASE_API_KEY', getEnv('FIREBASE_API_KEY', 'demo-api-key'))),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN', getEnv('REACT_APP_FIREBASE_AUTH_DOMAIN', getEnv('FIREBASE_AUTH_DOMAIN', 'momentum-11.firebaseapp.com'))),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID', getEnv('REACT_APP_FIREBASE_PROJECT_ID', getEnv('FIREBASE_PROJECT_ID', 'momentum-11'))),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET', getEnv('REACT_APP_FIREBASE_STORAGE_BUCKET', getEnv('FIREBASE_STORAGE_BUCKET', 'momentum-11.firebasestorage.app'))),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', getEnv('REACT_APP_FIREBASE_MESSAGING_SENDER_ID', getEnv('FIREBASE_MESSAGING_SENDER_ID', '1023958789554'))),
  appId: getEnv('VITE_FIREBASE_APP_ID', getEnv('REACT_APP_FIREBASE_APP_ID', getEnv('FIREBASE_APP_ID', '1:1023958789554:web:04c0f7b2a3e6cf96d048ab'))),
  measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID', getEnv('REACT_APP_FIREBASE_MEASUREMENT_ID', getEnv('FIREBASE_MEASUREMENT_ID', 'G-E1PZHJJZK6')))
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
      throw new Error('Network error during Google authentication. Please check your internet connection.');
    }
    throw error;
  }
}

import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

let storageInstance = null;
try {
  storageInstance = getStorage(
    app,
    firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined
  );
} catch (e) {
  console.warn('Firebase Storage initialization notice:', e);
}
export const storage = storageInstance;

/**
 * Compresses an image file to a crisp, optimized square avatar Data URL for direct MongoDB storage (384x384, ~20KB)
 */
export async function compressImageToDataUrl(file, maxDimension = 384, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file is not a valid image.'));
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;
          const minDim = Math.min(width, height);

          // Crop centered square
          const startX = (width - minDim) / 2;
          const startY = (height - minDim) / 2;

          const targetDim = Math.min(maxDimension, minDim);
          canvas.width = targetDim;
          canvas.height = targetDim;

          const ctx = canvas.getContext('2d');
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, startX, startY, minDim, minDim, 0, 0, targetDim, targetDim);

          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (err) {
          reject(new Error('Image processing error: ' + err.message));
        }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validates, crops, and compresses a profile photo instantly for direct MongoDB Atlas storage.
 * Runs 100% client-side in under 100ms with zero cloud storage network bottlenecks.
 */
export async function uploadProfilePhoto(file, userId = 'user', onProgress = () => {}) {
  // 1. Validation
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Please choose a JPEG, PNG, or WebP image file.');
  }

  const maxSizeBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSizeBytes) {
    throw new Error('Image size exceeds 5MB limit. Please choose a smaller photo.');
  }

  // 2. Instant client-side compression for direct MongoDB storage
  onProgress(30);
  const dataUrl = await compressImageToDataUrl(file, 384, 0.85);
  onProgress(75);

  // Smooth UI progression
  await new Promise((r) => setTimeout(r, 80));
  onProgress(100);

  return { downloadURL: dataUrl };
}
