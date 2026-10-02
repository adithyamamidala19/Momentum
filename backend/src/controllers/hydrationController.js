import { HydrationLog } from '../models/HydrationLog.js';
import { MetricsService } from '../services/metricsService.js';
import { getLocalDateString } from '../utils/timezone.js';

export class HydrationController {
  static async getHydration(req, res) {
    const today = getLocalDateString(new Date(), req.user.timezone);
    const logs = await HydrationLog.find({ userId: req.user._id, date: today }).sort({ loggedAt: -1 });

    const totalMl = logs.reduce((acc, curr) => acc + curr.amountMl, 0);
    const targetMl = req.user.goals?.waterMl || 2000;

    return res.status(200).json({
      date: today,
      totalMl,
      targetMl,
      percentage: Math.min(100, Math.round((totalMl / targetMl) * 100)),
      glasses: Math.floor(totalMl / 250),
      targetGlasses: Math.floor(targetMl / 250),
      logs
    });
  }

  static async logHydration(req, res) {
    const { amountMl } = req.body;
    const today = getLocalDateString(new Date(), req.user.timezone);

    const log = await HydrationLog.create({
      userId: req.user._id,
      amountMl: amountMl || 250,
      date: today,
      loggedAt: new Date()
    });

    // Recompute weekly score asynchronously
    MetricsService.updateWeeklyScore(req.user).catch(() => {});

    // Return updated overview
    const overview = await MetricsService.getTodayOverview(req.user);

    return res.status(201).json({
      success: true,
      log,
      overview
    });
  }

  static async removeLatest(req, res) {
    const today = getLocalDateString(new Date(), req.user.timezone);
    const latest = await HydrationLog.findOne({ userId: req.user._id, date: today }).sort({ loggedAt: -1 });

    if (latest) {
      await HydrationLog.deleteOne({ _id: latest._id });
    }

    MetricsService.updateWeeklyScore(req.user).catch(() => {});
    const overview = await MetricsService.getTodayOverview(req.user);
    return res.status(200).json({ success: true, overview });
  }

  static async setWater(req, res) {
    const { targetMl } = req.body;
    const today = getLocalDateString(new Date(), req.user.timezone);

    await HydrationLog.deleteMany({ userId: req.user._id, date: today });
    let log = null;
    const ml = Number(targetMl) || 0;
    if (ml > 0) {
      log = await HydrationLog.create({
        userId: req.user._id,
        amountMl: ml,
        date: today,
        loggedAt: new Date()
      });
    }

    MetricsService.updateWeeklyScore(req.user).catch(() => {});
    const overview = await MetricsService.getTodayOverview(req.user);
    return res.status(200).json({ success: true, log, overview });
  }

  static async deleteHydrationLog(req, res) {
    const { id } = req.params;
    const log = await HydrationLog.findOneAndDelete({ _id: id, userId: req.user._id });

    if (!log) {
      return res.status(404).json({ error: 'Hydration log not found' });
    }

    const overview = await MetricsService.getTodayOverview(req.user);
    return res.status(200).json({ success: true, overview });
  }
}
