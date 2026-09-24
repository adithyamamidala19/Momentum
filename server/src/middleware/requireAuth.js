import { getAuth } from '../config/firebase.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

export async function requireAuth(req, res, next) {
  try {
    const sessionCookie = req.cookies?.[env.SESSION_COOKIE_NAME];

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

    // Verify session cookie with Firebase Admin (checkRevoked: true)
    let decodedClaims;
    try {
      const auth = getAuth();
      decodedClaims = await auth.verifySessionCookie(sessionCookie, true);
    } catch (verifyError) {
      logger.warn({
        msg: 'Failed to verify session cookie',
        errCode: verifyError.code,
        message: verifyError.message
      });

      // Clear the invalid session cookie
      res.clearCookie(env.SESSION_COOKIE_NAME, {
        path: '/',
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        domain: env.COOKIE_DOMAIN || undefined
      });

      return res.status(401).json({
        error: 'Unauthorized: Session has expired or been revoked. Please sign in again.',
        code: 'SESSION_REVOKED'
      });
    }

    // Find the user in MongoDB by firebaseUid
    let user = await User.findOne({ firebaseUid: decodedClaims.uid });

    if (!user) {
      // Upsert user if first time session verification
      user = await User.create({
        firebaseUid: decodedClaims.uid,
        email: decodedClaims.email || '',
        displayName: decodedClaims.name || 'Mindful Practitioner',
        photoURL: decodedClaims.picture || '',
        lastLoginAt: new Date()
      });
      logger.info({ msg: 'Created new user document in MongoDB', userId: user._id });
    }

    // Attach user object to request
    req.user = user;
    next();
  } catch (error) {
    logger.error({ msg: 'requireAuth unexpected error', err: error.message });
    return res.status(500).json({ error: 'Internal Authentication Error' });
  }
}
