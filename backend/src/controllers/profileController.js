import { User } from '../models/User.js';
import { Block } from '../models/Block.js';
import { Friendship } from '../models/Friendship.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { WeeklyScore } from '../models/WeeklyScore.js';
import { ExportService } from '../services/exportService.js';
import { AccountDeletionService } from '../services/accountDeletionService.js';
import { MetricsService } from '../services/metricsService.js';
import { getIsoWeekId } from '../utils/timezone.js';
import { validateSafeContent } from '../utils/moderationFilter.js';
import { isUsernameTaken, USERNAME_TAKEN_MESSAGE } from '../utils/usernameValidation.js';
import { env } from '../config/env.js';


export class ProfileController {
  /**
   * PUT /api/profile
   * Updates user profile, goals, timezone, units, personal metrics, and challenge settings.
   */
  static async updateProfile(req, res) {
    const user = req.user;
    const {
      displayName,
      mantra,
      timezone,
      onboardingCompleted,
      age,
      weightKg,
      gender,
      photoType,
      photoURL,
      avatarEmblem,
      units,
      goals,
      challenge,
      notificationPrefs,
      theme,
      showOnlineStatus
    } = req.body;

    // Safety validation on nickname and bio
    if (challenge?.nickname) {
      const checkNick = validateSafeContent(challenge.nickname);
      if (!checkNick.passed) {
        return res.status(400).json({ error: checkNick.warning || 'Nickname contains prohibited contact info' });
      }

      // Case-insensitive database uniqueness check
      const takenCheck = await isUsernameTaken(user._id, { nickname: challenge.nickname.trim() });
      if (takenCheck.taken) {
        return res.status(409).json({ error: USERNAME_TAKEN_MESSAGE });
      }
    }
    if (req.body.username && req.body.username.trim()) {
      const takenCheck = await isUsernameTaken(user._id, { username: req.body.username.trim() });
      if (takenCheck.taken) {
        return res.status(409).json({ error: USERNAME_TAKEN_MESSAGE });
      }
      user.username = req.body.username.trim();
    }
    if (challenge?.bio) {
      const checkBio = validateSafeContent(challenge.bio);
      if (!checkBio.passed) {
        return res.status(400).json({ error: checkBio.warning || 'Bio contains prohibited contact info' });
      }
    }


    if (displayName !== undefined) {
      user.displayName = displayName
        .trim()
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }
    if (mantra !== undefined) user.mantra = mantra.trim();
    if (timezone !== undefined) user.timezone = timezone.trim();
    if (age !== undefined) {
      user.age = age === null || age === '' ? null : Number(age);
    }
    if (weightKg !== undefined) {
      user.weightKg = weightKg === null || weightKg === '' ? null : Number(weightKg);
    }
    if (gender !== undefined) user.gender = gender;
    if (photoType !== undefined) user.photoType = photoType;
    if (photoURL !== undefined) user.photoURL = photoURL;
    if (avatarEmblem !== undefined) user.avatarEmblem = avatarEmblem;
    if (showOnlineStatus !== undefined) user.showOnlineStatus = Boolean(showOnlineStatus);

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
      if (challenge.bio) {
        const bioCheck = validateSafeContent(challenge.bio);
        if (!bioCheck.passed) {
          return res.status(400).json({ error: bioCheck.warning });
        }
      }
      if (challenge.nickname) {
        const nickCheck = validateSafeContent(challenge.nickname);
        if (!nickCheck.passed) {
          return res.status(400).json({ error: nickCheck.warning });
        }
      }
      user.challenge = {
        optedIn: challenge.optedIn !== undefined ? challenge.optedIn : user.challenge.optedIn,
        nickname: challenge.nickname !== undefined ? challenge.nickname.trim() : user.challenge.nickname,
        avatar: challenge.avatar !== undefined ? challenge.avatar : user.challenge.avatar,
        bio: challenge.bio !== undefined ? challenge.bio.trim().slice(0, 150) : user.challenge.bio || ''
      };
    }
    if (notificationPrefs !== undefined) {
      user.notificationPrefs = { ...user.notificationPrefs, ...notificationPrefs };
    }
    if (onboardingCompleted !== undefined) {
      user.onboardingCompleted = Boolean(onboardingCompleted);
    }
    try {
      await user.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        return res.status(409).json({ error: USERNAME_TAKEN_MESSAGE });
      }
      throw saveErr;
    }


    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username || '',
        displayName: user.displayName,
        photoURL: user.photoURL,
        photoType: user.photoType,
        avatarEmblem: user.avatarEmblem,
        age: user.age,
        weightKg: user.weightKg,
        gender: user.gender,
        mantra: user.mantra,
        timezone: user.timezone,
        units: user.units,
        goals: user.goals,
        challenge: user.challenge,
        showOnlineStatus: user.showOnlineStatus,
        notificationPrefs: user.notificationPrefs,
        theme: user.theme,
        onboardingCompleted: Boolean(user.onboardingCompleted)
      }
    });
  }

  /**
   * GET /api/profile/public/:nickname
   * Strict public DTO: returns ONLY nickname, avatar, bio, streak, rank/percentile,
   * safe earned medals, and friendship status.
   * NEVER returns real name, email, age, weight, gender, practice points, or health logs.
   */
  static async getPublicProfile(req, res) {
    const { nickname } = req.params;
    const targetUser = await User.findOne({
      'challenge.nickname': { $regex: new RegExp(`^${nickname.trim()}$`, 'i') },
      'challenge.optedIn': true
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Public sanctuary profile not found or user is not in Challenge' });
    }

    // Check bidirectional blocks
    const hasBlock = await Block.findOne({
      $or: [
        { blockerId: req.user._id, blockedId: targetUser._id },
        { blockerId: targetUser._id, blockedId: req.user._id }
      ]
    });

    if (hasBlock) {
      return res.status(404).json({ error: 'Profile unavailable' });
    }

    // Compute target user streak and safe medals
    const streak = await MetricsService.computeStreak(targetUser._id, targetUser.timezone);
    const { milestones } = await MetricsService.computeMilestones(targetUser._id, streak, targetUser.timezone);

    // Filter medals to safe public shape (no verificationCode, no private info)
    const earnedMedals = milestones
      .filter((m) => m.achieved)
      .map((m) => ({
        id: m.id,
        medalId: m.medalId,
        name: m.name,
        tier: m.tier,
        date: m.date,
        description: m.description,
        achieved: true
      }));

    // Compute weekly rank & percentile
    const weekId = getIsoWeekId(new Date());
    const targetScore = await WeeklyScore.findOne({ userId: targetUser._id, weekId });
    let weeklyRank = null;
    let percentile = null;

    if (targetScore) {
      const allScores = await WeeklyScore.find({ weekId }).sort({ weeklyScore: -1 });
      const idx = allScores.findIndex((s) => s.userId.toString() === targetUser._id.toString());
      if (idx !== -1) {
        weeklyRank = idx + 1;
        const pct = Math.max(1, Math.round(((idx + 1) / allScores.length) * 100));
        percentile = `Top ${pct}% this week`;
      }
    }

    // Determine friendship status
    let friendshipStatus = 'none';
    if (req.user._id.toString() === targetUser._id.toString()) {
      friendshipStatus = 'self';
    } else {
      const isFriend = await Friendship.findOne({
        $or: [
          { userA: req.user._id, userB: targetUser._id },
          { userA: targetUser._id, userB: req.user._id }
        ]
      });
      if (isFriend) {
        friendshipStatus = 'friends';
      } else {
        const sentReq = await FriendRequest.findOne({
          fromUserId: req.user._id,
          toUserId: targetUser._id,
          status: 'pending'
        });
        if (sentReq) {
          friendshipStatus = 'request_sent';
        } else {
          const recReq = await FriendRequest.findOne({
            fromUserId: targetUser._id,
            toUserId: req.user._id,
            status: 'pending'
          });
          if (recReq) {
            friendshipStatus = 'request_received';
          }
        }
      }
    }

    return res.status(200).json({
      profile: {
        id: targetUser._id,
        nickname: targetUser.challenge.nickname,
        avatar: targetUser.challenge.avatar || '🌱',
        bio: targetUser.challenge.bio || '',
        streak,
        weeklyRank,
        percentile: percentile || 'Active Contributor',
        earnedMedals,
        friendshipStatus
      }
    });
  }

  /**
   * POST /api/profile/photo
   * Updates user custom profile photo URL
   */
  static async uploadPhoto(req, res) {
    const { photoURL, dataUrl } = req.body;
    const user = req.user;
    const url = photoURL || dataUrl;
    if (!url) {
      return res.status(400).json({ error: 'Missing photoURL or dataUrl' });
    }
    user.photoURL = url;
    user.photoType = 'custom';
    await user.save();
    return res.status(200).json({ success: true, photoURL: user.photoURL, photoType: user.photoType });
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

  /**
   * GET /api/profile/check-username?username=...
   * Real-time query checking if username or nickname is already taken.
   */
  static async checkUsername(req, res) {
    const { username } = req.query;
    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Username query parameter is required' });
    }

    const check = await isUsernameTaken(req.user?._id || null, {
      username: username.trim(),
      nickname: username.trim()
    });

    return res.status(200).json({
      available: !check.taken,
      message: check.taken ? USERNAME_TAKEN_MESSAGE : 'Username is available'
    });
  }
}

