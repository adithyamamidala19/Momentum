import { MetricsService } from '../services/metricsService.js';

export class TodayController {
  /**
   * GET /api/today
   * Aggregates adherence ring, 2x2 stats, next up action, rituals, and trackers.
   */
  static async getToday(req, res) {
    const data = await MetricsService.getTodayOverview(req.user);
    return res.status(200).json(data);
  }
}
