import { User } from '../models/User.js';
import { ExportService } from '../services/exportService.js';
import { AccountDeletionService } from '../services/accountDeletionService.js';
import { env } from '../config/env.js';

export class ProfileController {
  /**
   * PUT /api/profile
   * Updates user profile, goals, timezone, units, and challenge settings.
   */
  static async updateProfile(req, res) {
    const user = req.user;
    const {
      displayName,
      mantra,
      timezone,
      units,
      goals,
      challenge,
      notificationPrefs,
      theme
    } = req.body;

    if (displayName !== undefined) {
      // Validate and title-case display name
      user.displayName = displayName
        .trim()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    if (mantra !== undefined) user.mantra = mantra.trim();
    if (timezone !== undefined) user.timezone = timezone.trim();
    if (units !== undefined) {
      user.units = {
        weight: units.weight || user.units.weight,
        volume: units.volume || user.units.volume
      };
    }
    if (goals !== undefined) {
      user.goals = {
        waterMl: goals.waterMl !== undefined ? goals.waterMl : user.goals.waterMl,
        proteinG: goals.proteinG !== undefined ? goals.proteinG : user.goals.proteinG,
        focusMin: goals.focusMin !== undefined ? goals.focusMin : user.goals.focusMin
      };
    }
    if (challenge !== undefined) {
      user.challenge = {
        optedIn: challenge.optedIn !== undefined ? challenge.optedIn : user.challenge.optedIn,
        nickname: challenge.nickname !== undefined ? challenge.nickname.trim() : user.challenge.nickname,
        avatar: challenge.avatar !== undefined ? challenge.avatar : user.challenge.avatar
      };
    }
    if (notificationPrefs !== undefined) {
      user.notificationPrefs = { ...user.notificationPrefs, ...notificationPrefs };
    }
    if (theme !== undefined) user.theme = theme;

    await user.save();

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
        challenge: user.challenge,
        notificationPrefs: user.notificationPrefs,
        theme: user.theme
      }
    });
  }

  /**
   * GET /api/profile/export
   * Generates verified JSON export of all user data.
   */
  static async exportData(req, res) {
    const data = await ExportService.exportUserData(req.user._id);

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="momentum_backup_${new Date().toISOString().slice(0, 10)}.json"`
    );
    return res.status(200).send(JSON.stringify(data, null, 2));
  }

  /**
   * DELETE /api/profile/account
   * Permanently hard-deletes user across all collections and removes Firebase identity.
   */
  static async deleteAccount(req, res) {
    const user = req.user;
    await AccountDeletionService.hardDeleteUserAccount(user._id, user.firebaseUid);

    // Clear session cookie
    res.clearCookie(env.SESSION_COOKIE_NAME, {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      domain: env.COOKIE_DOMAIN || undefined
    });

    return res.status(200).json({
      success: true,
      message: 'Account and all associated sanctuary rhythm data permanently deleted.'
    });
  }
}
