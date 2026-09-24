import { MetricsService } from '../services/metricsService.js';
import { getLocalDateString } from '../utils/timezone.js';

export class InsightsController {
  static async getInsights(req, res) {
    const range = req.query.range || '90d';
    const days = range === '365d' ? 365 : range === '30d' ? 30 : 90;
    const timezone = req.user.timezone || 'UTC';

    const heatmap = [];
    const momentumCurve = [];
    let cumulativeAdherence = 0;

    const cursor = new Date();
    // Start backwards from today
    for (let i = 0; i < days; i++) {
      const dStr = getLocalDateString(cursor, timezone);
      const metrics = await MetricsService.computeDailyAdherence(req.user._id, dStr);

      heatmap.unshift({
        date: dStr,
        adherence: metrics.adherencePct,
        completed: metrics.completedCount,
        skipped: metrics.skippedCount,
        total: metrics.activeCount,
        isRestDay: metrics.skippedCount > 0 && metrics.completedCount === 0
      });

      cumulativeAdherence += metrics.adherencePct;
      cursor.setDate(cursor.getDate() - 1);
    }

    // Momentum curve: last 14 days
    const curvePoints = heatmap.slice(-14).map((pt, idx) => ({
      day: pt.date.slice(5), // MM-DD
      adherence: pt.adherence,
      rollingAverage: Math.round(
        heatmap
          .slice(Math.max(0, heatmap.length - 14 + idx - 2), heatmap.length - 14 + idx + 1)
          .reduce((a, b) => a + b.adherence, 0) /
          Math.min(3, idx + 1)
      )
    }));

    const averageAdherence = Math.round(cumulativeAdherence / Math.max(1, days));

    return res.status(200).json({
      range,
      averageAdherence,
      heatmap,
      momentumCurve: curvePoints
    });
  }
}
