import { ChallengeService } from '../services/challengeService.js';
import { WeeklyScore } from '../models/WeeklyScore.js';
import { getIsoWeekId } from '../utils/timezone.js';

export class ChallengeController {
  static async getWeekly(req, res) {
    const { sort, week } = req.query;
    const weekId = week || getIsoWeekId(new Date());

    const result = await ChallengeService.getWeeklyLeaderboard({
      weekId,
      sortBy: sort || 'weeklyScore',
      currentUserId: req.user._id
    });

    return res.status(200).json(result);
  }

  static async join(req, res) {
    const { nickname, avatar } = req.body;
    const result = await ChallengeService.joinChallenge(req.user, { nickname, avatar });
    return res.status(200).json(result);
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
