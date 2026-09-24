import { FocusSession } from '../models/FocusSession.js';
import { MetricsService } from '../services/metricsService.js';
import { getLocalDateString } from '../utils/timezone.js';

export class FocusController {
  static async getSessions(req, res) {
    const today = getLocalDateString(new Date(), req.user.timezone);
    const sessions = await FocusSession.find({ userId: req.user._id, date: today }).sort({ startedAt: -1 });
    const totalMinutes = sessions.reduce((acc, curr) => acc + (curr.actualMin || 0), 0);

    return res.status(200).json({
      date: today,
      totalMinutes,
      targetMinutes: req.user.goals?.focusMin || 25,
      sessions
    });
  }

  static async createSession(req, res) {
    const { plannedMin, actualMin, intention, startedAt, endedAt, completed } = req.body;
    const today = getLocalDateString(new Date(), req.user.timezone);

    const session = await FocusSession.create({
      userId: req.user._id,
      plannedMin,
      actualMin: actualMin !== undefined ? actualMin : plannedMin,
      intention: intention || 'Deep mindful focus',
      startedAt: startedAt ? new Date(startedAt) : new Date(),
      endedAt: endedAt ? new Date(endedAt) : new Date(),
      completed: completed !== undefined ? completed : true,
      date: today
    });

    MetricsService.updateWeeklyScore(req.user).catch(() => {});
    const overview = await MetricsService.getTodayOverview(req.user);

    return res.status(201).json({
      success: true,
      session,
      overview
    });
  }

  static async getStats(req, res) {
    const sessions = await FocusSession.find({ userId: req.user._id, completed: true });
    const totalMinutes = sessions.reduce((acc, curr) => acc + (curr.actualMin || 0), 0);

    return res.status(200).json({
      totalSessions: sessions.length,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10
    });
  }
}
