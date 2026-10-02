import { AchievementService } from '../services/achievementService.js';
import { MetricsService } from '../services/metricsService.js';

export class AchievementController {
  /**
   * GET /api/achievements
   * Recomputes and returns active weekly, active monthly, and past completed achievements
   */
  static async getAchievements(req, res) {
    try {
      const data = await AchievementService.recomputeUserAchievements(req.user);
      const totalPoints = await MetricsService.computePracticePoints(req.user._id);

      return res.status(200).json({
        ...data,
        totalPoints
      });
    } catch (err) {
      console.error('[AchievementController] Error getting achievements:', err);
      return res.status(500).json({ error: 'Failed to retrieve achievements' });
    }
  }

  /**
   * POST /api/achievements/recompute
   * Explicitly recomputes achievements and returns any newly unlocked items
   */
  static async recomputeAchievements(req, res) {
    try {
      const data = await AchievementService.recomputeUserAchievements(req.user);
      const totalPoints = await MetricsService.computePracticePoints(req.user._id);

      return res.status(200).json({
        ...data,
        totalPoints
      });
    } catch (err) {
      console.error('[AchievementController] Error recomputing achievements:', err);
      return res.status(500).json({ error: 'Failed to recompute achievements' });
    }
  }
}
