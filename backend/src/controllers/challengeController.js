import { ChallengeService } from '../services/challengeService.js';
import { WeeklyScore } from '../models/WeeklyScore.js';
import { MetricsService } from '../services/metricsService.js';
import { isUsernameTaken, USERNAME_TAKEN_MESSAGE } from '../utils/usernameValidation.js';
import { getIsoWeekId } from '../utils/timezone.js';

export class ChallengeController {
  static async getWeekly(req, res) {
    const { sort, week } = req.query;
    const weekId = week || getIsoWeekId(new Date());

    // Proactively refresh current user's weekly score if opted in so ranking is live
    if (req.user?.challenge?.optedIn) {
      await MetricsService.updateWeeklyScore(req.user).catch(() => {});
    }

    const result = await ChallengeService.getWeeklyLeaderboard({
      weekId,
      sortBy: sort || 'weeklyScore',
      currentUserId: req.user._id
    });

    return res.status(200).json(result);
  }

  static async join(req, res) {
    const { nickname, avatar } = req.body;

    if (nickname && nickname.trim()) {
      const check = await isUsernameTaken(req.user._id, { nickname: nickname.trim() });
      if (check.taken) {
        return res.status(409).json({ error: USERNAME_TAKEN_MESSAGE });
      }
    }

    try {
      const result = await ChallengeService.joinChallenge(req.user, { nickname, avatar });
      return res.status(200).json(result);
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({ error: USERNAME_TAKEN_MESSAGE });
      }
      throw err;
    }
  }


  static async leave(req, res) {
    const result = await ChallengeService.leaveChallenge(req.user);
    return res.status(200).json(result);
  }

  static async getMe(req, res) {
    const weekId = getIsoWeekId(new Date());
    const score = await WeeklyScore.findOne({ userId: req.user._id, weekId });

    return res.status(200).json({
      optedIn: Boolean(req.user.challenge?.optedIn),
      challenge: req.user.challenge,
      currentWeekScore: score
    });
  }

  static async getLastWeekWinners(req, res) {
    const result = await ChallengeService.getLastWeekWinners();
    return res.status(200).json(result);
  }
}
