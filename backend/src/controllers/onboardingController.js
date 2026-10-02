import { User } from '../models/User.js';
import { Ritual } from '../models/Ritual.js';
import { MetricsService } from '../services/metricsService.js';
import { isUsernameTaken, USERNAME_TAKEN_MESSAGE } from '../utils/usernameValidation.js';
import { logger } from '../utils/logger.js';


export class OnboardingController {
  /**
   * GET /api/onboarding/state
   * Retrieves user's saved onboarding progress and draft inputs.
   */
  static async getState(req, res) {
    const user = req.user;
    return res.status(200).json({
      success: true,
      completed: Boolean(user.onboardingCompleted),
      step: user.onboardingStep || 1,
      draft: user.onboardingDraft || {},
      user: {
        id: user._id,
        displayName: user.displayName,
        mantra: user.mantra,
        email: user.email,
        photoURL: user.photoURL,
        photoType: user.photoType,
        avatarEmblem: user.avatarEmblem,
        age: user.age,
        weightKg: user.weightKg,
        gender: user.gender,
        timezone: user.timezone,
        units: user.units,
        goals: user.goals,
        challenge: user.challenge
      }
    });
  }

  /**
   * POST /api/onboarding/step
   * Saves progress and intermediate draft data after each step.
   * Ensures data survives page refreshes mid-flow without localStorage.
   */
  static async saveStep(req, res) {
    const user = req.user;
    const { step, draft } = req.body;

    if (typeof step === 'number' && step >= 1 && step <= 6) {
      user.onboardingStep = step;
    }

    if (draft && typeof draft === 'object') {
      user.onboardingDraft = {
        ...(user.onboardingDraft || {}),
        ...draft
      };

      // Opportunistically apply fields to user document
      if (draft.displayName !== undefined) {
        user.displayName = draft.displayName.trim();
      }
      if (draft.mantra !== undefined) {
        user.mantra = draft.mantra.trim();
      }
      if (draft.age !== undefined) {
        user.age = draft.age === null || draft.age === '' ? null : Number(draft.age);
      }
      if (draft.weightKg !== undefined) {
        user.weightKg = draft.weightKg === null || draft.weightKg === '' ? null : Number(draft.weightKg);
      }
      if (draft.gender !== undefined) {
        user.gender = draft.gender;
      }
      if (draft.photoType !== undefined) {
        user.photoType = draft.photoType;
      }
      if (draft.photoURL !== undefined) {
        user.photoURL = draft.photoURL;
      }
      if (draft.avatarEmblem !== undefined) {
        user.avatarEmblem = draft.avatarEmblem;
      }
      if (draft.timezone !== undefined && draft.timezone.trim()) {
        user.timezone = draft.timezone.trim();
      }
      if (draft.units) {
        user.units = {
          weight: draft.units.weight || user.units.weight,
          volume: draft.units.volume || user.units.volume
        };
      }
      if (draft.goals) {
        user.goals = {
          waterMl: draft.goals.waterMl !== undefined ? Number(draft.goals.waterMl) : user.goals.waterMl,
          proteinG: draft.goals.proteinG !== undefined ? Number(draft.goals.proteinG) : user.goals.proteinG,
          focusMin: draft.goals.focusMin !== undefined ? Number(draft.goals.focusMin) : user.goals.focusMin
        };
      }
      if (draft.challenge) {
        if (draft.challenge.nickname && draft.challenge.nickname.trim()) {
          const check = await isUsernameTaken(user._id, {
            nickname: draft.challenge.nickname.trim(),
            username: draft.username
          });
          if (check.taken) {
            return res.status(409).json({ error: USERNAME_TAKEN_MESSAGE });
          }
        }
        user.challenge = {
          optedIn: draft.challenge.optedIn !== undefined ? Boolean(draft.challenge.optedIn) : user.challenge.optedIn,
          nickname: draft.challenge.nickname !== undefined ? draft.challenge.nickname.trim() : user.challenge.nickname,
          avatar: draft.challenge.avatar !== undefined ? draft.challenge.avatar : user.challenge.avatar
        };
      }
    }

    user.markModified('onboardingDraft');
    try {
      await user.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        return res.status(409).json({ error: USERNAME_TAKEN_MESSAGE });
      }
      throw saveErr;
    }

    logger.info({ msg: 'Saved onboarding step draft', userId: user._id, step: user.onboardingStep });


    return res.status(200).json({
      success: true,
      step: user.onboardingStep,
      draft: user.onboardingDraft
    });
  }

  /**
   * POST /api/onboarding/complete
   * Finalizes onboarding: updates profile, creates starter rituals, sets onboardingCompleted: true.
   */
  static async complete(req, res) {
    const user = req.user;
    const {
      displayName,
      mantra,
      age,
      weightKg,
      gender,
      photoType,
      photoURL,
      avatarEmblem,
      timezone,
      units,
      goals,
      challenge,
      rituals
    } = req.body;

    // 1. Update Profile Fields
    if (displayName !== undefined && displayName.trim()) {
      user.displayName = displayName.trim();
    }
    if (mantra !== undefined) {
      user.mantra = mantra.trim();
    }
    if (age !== undefined) {
      user.age = age === null || age === '' ? null : Number(age);
    }
    if (weightKg !== undefined) {
      user.weightKg = weightKg === null || weightKg === '' ? null : Number(weightKg);
    }
    if (gender !== undefined) {
      user.gender = gender;
    }
    if (photoType !== undefined) {
      user.photoType = photoType;
    }
    if (photoURL !== undefined) {
      user.photoURL = photoURL;
    }
    if (avatarEmblem !== undefined) {
      user.avatarEmblem = avatarEmblem;
    }
    if (timezone !== undefined && timezone.trim()) {
      user.timezone = timezone.trim();
    }
    if (units) {
      user.units = {
        weight: units.weight || user.units.weight,
        volume: units.volume || user.units.volume
      };
    }
    if (goals) {
      user.goals = {
        waterMl: goals.waterMl !== undefined ? Number(goals.waterMl) : user.goals.waterMl,
        proteinG: goals.proteinG !== undefined ? Number(goals.proteinG) : user.goals.proteinG,
        focusMin: goals.focusMin !== undefined ? Number(goals.focusMin) : user.goals.focusMin
      };
    }
    if (challenge) {
      if (challenge.nickname && challenge.nickname.trim()) {
        const check = await isUsernameTaken(user._id, {
          nickname: challenge.nickname.trim(),
          username: req.body.username
        });
        if (check.taken) {
          return res.status(409).json({ error: USERNAME_TAKEN_MESSAGE });
        }
      }
      user.challenge = {
        optedIn: challenge.optedIn !== undefined ? Boolean(challenge.optedIn) : user.challenge.optedIn,
        nickname: challenge.nickname !== undefined ? challenge.nickname.trim() : user.challenge.nickname,
        avatar: challenge.avatar !== undefined ? challenge.avatar : user.challenge.avatar
      };
    }

    // 2. Mark completed
    user.onboardingCompleted = true;
    user.onboardingStep = 6;
    user.onboardingDraft = {};
    user.markModified('onboardingDraft');
    try {
      await user.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        return res.status(409).json({ error: USERNAME_TAKEN_MESSAGE });
      }
      throw saveErr;
    }


    // 3. Batch insert starter rituals if provided
    if (Array.isArray(rituals) && rituals.length > 0) {
      const currentCount = await Ritual.countDocuments({ userId: user._id });
      const docs = rituals.map((r, i) => ({
        userId: user._id,
        name: r.name,
        category: r.category || 'Health',
        anchor: r.anchor || '',
        time: r.time || '08:00',
        schedule: r.schedule || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
        order: currentCount + i + 1
      }));
      await Ritual.insertMany(docs);
    }

    // 4. Update weekly score asynchronously
    MetricsService.updateWeeklyScore(user).catch(() => {});

    logger.info({ msg: 'Onboarding finalized successfully', userId: user._id });

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        displayName: user.displayName,
        mantra: user.mantra,
        email: user.email,
        photoURL: user.photoURL,
        photoType: user.photoType,
        avatarEmblem: user.avatarEmblem,
        age: user.age,
        weightKg: user.weightKg,
        gender: user.gender,
        timezone: user.timezone,
        units: user.units,
        goals: user.goals,
        challenge: user.challenge,
        onboardingCompleted: true
      }
    });
  }
}
