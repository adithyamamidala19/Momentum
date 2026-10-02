import jwt from 'jsonwebtoken';
import { getAuth, hasFirebaseCredentials } from '../config/firebase.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    let bearerToken = null;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      bearerToken = authHeader.slice(7).trim();
    }

    const sessionCookie = bearerToken || req.cookies?.[env.SESSION_COOKIE_NAME];

    if (!sessionCookie) {
      // In development or test, support test bypass only if explicitly enabled
      if (env.NODE_ENV === 'test' && req.headers['x-test-user-id']) {
        const testUser = await User.findById(req.headers['x-test-user-id']);
        if (testUser) {
          req.user = testUser;
          return next();
        }
      }

      return res.status(401).json({
        error: 'Unauthorized: Session missing or expired. Please sign in.',
        code: 'AUTH_REQUIRED'
      });
    }

    let decodedClaims = null;
    const hasCreds = hasFirebaseCredentials();

    // 1. If service account credentials exist, attempt official Firebase session verification
    if (hasCreds) {
      try {
        const auth = getAuth();
        decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
      } catch (verifyError) {
        logger.debug({
          msg: 'Firebase Admin verifySessionCookie failed, falling back to local JWT check',
          err: verifyError.message
        });
      }
    }

    // 2. If not verified via Firebase Admin, verify with local session secret
    if (!decodedClaims) {
      try {
        decodedClaims = jwt.verify(sessionCookie, env.SESSION_SECRET);
      } catch (jwtError) {
        logger.warn({
          msg: 'Session cookie verification failed',
          err: jwtError.message
        });

        // Clear the invalid session cookie
        const isHttps = env.NODE_ENV === 'production' || req.secure || req.headers['x-forwarded-proto'] === 'https';
        res.clearCookie(env.SESSION_COOKIE_NAME, {
          path: '/',
          httpOnly: true,
          secure: isHttps,
          sameSite: isHttps ? 'none' : 'lax',
          domain: env.COOKIE_DOMAIN || undefined,
          partitioned: isHttps ? true : undefined
        });

        return res.status(401).json({
          error: 'Unauthorized: Session has expired or been revoked. Please sign in again.',
          code: 'SESSION_REVOKED'
        });
      }
    }

    const uid = decodedClaims.uid || decodedClaims.sub || decodedClaims.user_id;
    if (!uid) {
      return res.status(401).json({
        error: 'Unauthorized: Invalid token claims.',
        code: 'INVALID_TOKEN'
      });
    }

    // Find the user in MongoDB by firebaseUid
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Upsert user if first time session verification
      user = await User.create({
        firebaseUid: uid,
        email: decodedClaims.email || '',
        displayName: decodedClaims.name || 'Mindful Practitioner',
        photoURL: decodedClaims.picture || '',
        lastLoginAt: new Date()
      });
      logger.info({ msg: 'Created new user document in MongoDB', userId: user._id });
    }

    // Attach user object and token to request
    req.user = user;
    req.authToken = sessionCookie;
    next();
  } catch (error) {
    logger.error({ msg: 'requireAuth unexpected error', err: error.message });
    return res.status(500).json({ error: 'Internal Authentication Error' });
  }
}
