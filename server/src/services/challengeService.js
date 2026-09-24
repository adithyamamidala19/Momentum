import { WeeklyScore } from '../models/WeeklyScore.js';
import { User } from '../models/User.js';
import { getIsoWeekId } from '../utils/timezone.js';
import { MetricsService } from './metricsService.js';

export class ChallengeService {
  /**
   * Retrieves real-user weekly leaderboard using MongoDB aggregation pipeline
   */
  static async getWeeklyLeaderboard({ weekId = getIsoWeekId(new Date()), sortBy = 'weeklyScore', currentUserId = null }) {
    let sortStage = { weeklyScore: -1 };
    if (sortBy === 'practice') {
      sortStage = { practicePoints: -1 };
    } else if (sortBy === 'adherence') {
      sortStage = { adherenceAvg: -1 };
    }

    // Aggregation pipeline on weeklyScores index
    const pipeline = [
      { $match: { weekId } },
      { $sort: sortStage },
      {
        $project: {
          _id: 1,
          userId: 1,
          weekId: 1,
          nickname: 1,
          avatar: 1,
          practicePoints: 1,
          adherenceAvg: 1,
          focusMinutes: 1,
          weeklyScore: 1
        }
      }
    ];

    const participants = await WeeklyScore.aggregate(pipeline);

    // Compute 1-indexed ranks and flag current user
    let userRank = null;
    const rankedParticipants = participants.map((p, index) => {
      const isCurrentUser = currentUserId && p.userId.toString() === currentUserId.toString();
      const rank = index + 1;
      if (isCurrentUser) userRank = rank;

      return {
        rank,
        id: p._id,
        nickname: p.nickname,
        avatar: p.avatar,
        practicePoints: p.practicePoints,
        adherence: p.adherenceAvg,
        focusMins: p.focusMinutes,
        weeklyScore: p.weeklyScore,
        isCurrentUser: Boolean(isCurrentUser)
      };
    });

    const isWarmEmpty = rankedParticipants.length < 3;

    return {
      weekId,
      totalParticipants: rankedParticipants.length,
      participants: rankedParticipants,
      userRank,
      isWarmEmpty,
      emptyMessage: isWarmEmpty ? 'Be among the first in the sanctuary this week. Invite a mindful companion.' : null,
      shareLink: 'https://momentum.app/challenge'
    };
  }

  /**
   * Opts user into weekly challenge
   */
  static async joinChallenge(user, { nickname, avatar }) {
    user.challenge = {
      optedIn: true,
      nickname: nickname || user.displayName || 'CalmRiver',
      avatar: avatar || '🌱'
    };
    await user.save();

    // Compute initial weekly score document
    const weeklyDoc = await MetricsService.updateWeeklyScore(user);
    return { success: true, challenge: user.challenge, weeklyScore: weeklyDoc };
  }

  /**
   * Opts user out of weekly challenge and removes them from leaderboard
   */
  static async leaveChallenge(user) {
    user.challenge.optedIn = false;
    await user.save();

    const weekId = getIsoWeekId(new Date());
    await WeeklyScore.deleteOne({ userId: user._id, weekId });

    return { success: true, challenge: user.challenge };
  }

  /**
   * Gets previous week's podium winners
   */
  static async getLastWeekWinners() {
    const prevDate = new Date();
    prevDate.setDate(prevDate.getDate() - 7);
    const lastWeekId = getIsoWeekId(prevDate);

    const winners = await WeeklyScore.find({ weekId: lastWeekId })
      .sort({ weeklyScore: -1 })
      .limit(3)
      .select('nickname avatar weeklyScore practicePoints adherenceAvg');

    return {
      weekId: lastWeekId,
      winners: winners.map((w, i) => ({
        rank: i + 1,
        nickname: w.nickname,
        avatar: w.avatar,
        weeklyScore: w.weeklyScore
      }))
    };
  }
}
