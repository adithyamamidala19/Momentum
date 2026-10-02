import { MetricsService } from '../services/metricsService.js';

export class InsightsController {
  static async getInsights(req, res) {
    try {
      const range = req.query.range || '30d';
      const days = range === '365d' ? 365 : range === '90d' ? 90 : 30;
      const data = await MetricsService.computeInsightsRange(req.user, days);
      return res.status(200).json(data);
    } catch (err) {
      console.error('[InsightsController] Error computing insights:', err);
      return res.status(500).json({ error: 'Failed to compute insights data' });
    }
  }
}

