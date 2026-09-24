import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let firebaseApp = null;

export function initFirebase() {
  if (firebaseApp) return firebaseApp;

  try {
    const privateKey = env.getFormattedPrivateKey();

    if (env.FIREBASE_CLIENT_EMAIL && privateKey) {
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey
        })
      });
      logger.info({ msg: '🔥 Firebase Admin SDK initialized with service account' });
    } else {
      // In development or test if keys are pending, initialize with project ID or mock
      if (admin.apps.length > 0) {
        firebaseApp = admin.apps[0];
      } else {
        firebaseApp = admin.initializeApp({
          projectId: env.FIREBASE_PROJECT_ID || 'momentum-dev'
        });
        logger.warn({ msg: '⚠️ Firebase Admin initialized without explicit credentials (dev mode)' });
      }
    }
    return firebaseApp;
  } catch (error) {
    logger.error({ error: error.message, msg: '❌ Failed to initialize Firebase Admin' });
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    return null;
  }
}

export const getAuth = () => {
  if (!firebaseApp) initFirebase();
  return admin.auth();
};
