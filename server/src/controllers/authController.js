import { getAuth } from '../config/firebase.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Ritual } from '../models/Ritual.js';
import { Exercise } from '../models/Exercise.js';
import { logger } from '../utils/logger.js';

export class AuthController {
  /**
   * POST /api/auth/session
   * Exchanges Firebase ID Token for a secure httpOnly session cookie.
   */
  static async createSession(req, res) {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({ error: 'Missing idToken in request body' });
    }

    try {
      const auth = getAuth();
      const expiresIn = env.SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

      // 1. Verify the ID token and ensure it's not revoked
      const decodedIdToken = await auth.verifyIdToken(idToken, true);

      // 2. Create the Firebase session cookie
      const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

      // 3. Upsert user in MongoDB
      let user = await User.findOne({ firebaseUid: decodedIdToken.uid });
      const isNewUser = !user;

      if (!user) {
        user = await User.create({
          firebaseUid: decodedIdToken.uid,
          email: decodedIdToken.email || '',
          displayName: decodedIdToken.name || 'Mindful Practitioner',
          photoURL: decodedIdToken.picture || '',
          lastLoginAt: new Date()
        });

        // Seed default rituals for new user
        await Ritual.insertMany([
          { userId: user._id, name: '500ml Morning Water', anchor: 'Upon waking at 7:00 AM', category: 'Health', time: '07:00', order: 1 },
          { userId: user._id, name: '4-7-8 Box Breathing', anchor: 'Right before opening laptop', category: 'Mind', time: '08:30', order: 2 },
          { userId: user._id, name: '25-Min Deep Focus Block', anchor: 'At 10:00 AM desk setup', category: 'Focus', time: '10:00', order: 3 },
          { userId: user._id, name: 'Movement & Mobility', anchor: 'At 4:30 PM transition', category: 'Health', time: '16:30', order: 4 },
          { userId: user._id, name: 'Evening Digital Sunset', anchor: 'At 9:30 PM before bed', category: 'Mind', time: '21:30', order: 5 }
        ]);

        logger.info({ msg: 'New user registered and default rituals seeded', userId: user._id });
      } else {
        user.lastLoginAt = new Date();
        if (decodedIdToken.picture && !user.photoURL) {
          user.photoURL = decodedIdToken.picture;
        }
        await user.save();
      }

      // 4. Set the httpOnly session cookie
      const cookieOptions = {
        maxAge: expiresIn,
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        domain: env.COOKIE_DOMAIN || undefined
      };

      res.cookie(env.SESSION_COOKIE_NAME, sessionCookie, cookieOptions);

      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          mantra: user.mantra,
          timezone: user.timezone,
          units: user.units,
          goals: user.goals,
          challenge: user.challenge
        },
        isNewUser
      });
    } catch (error) {
      logger.error({ msg: 'Failed to create session cookie', err: error.message });
      return res.status(401).json({ error: 'Unauthorized: Invalid ID token' });
    }
  }

  /**
   * POST /api/auth/logout
   * Revokes refresh tokens in Firebase and clears the session cookie.
   */
  static async logout(req, res) {
    const sessionCookie = req.cookies?.[env.SESSION_COOKIE_NAME];

    if (sessionCookie) {
      try {
        const auth = getAuth();
        const decodedClaims = await auth.verifySessionCookie(sessionCookie).catch(() => null);
        if (decodedClaims?.sub) {
          await auth.revokeRefreshTokens(decodedClaims.sub);
          logger.info({ msg: 'Revoked refresh tokens for user', uid: decodedClaims.sub });
        }
      } catch (err) {
        logger.warn({ msg: 'Error during token revocation', err: err.message });
      }
    }

    res.clearCookie(env.SESSION_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: env.COOKIE_DOMAIN || undefined
    });

    return res.status(200).json({ success: true, message: 'Logged out successfully' });
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user session details.
   */
  static async getMe(req, res) {
    const user = req.user;
    return res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        mantra: user.mantra,
        timezone: user.timezone,
        units: user.units,
        goals: user.goals,
        challenge: user.challenge,
        notificationPrefs: user.notificationPrefs,
        theme: user.theme,
        createdAt: user.createdAt
      }
    });
  }
}
