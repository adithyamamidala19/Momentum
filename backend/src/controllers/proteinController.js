import { ProteinLog } from '../models/ProteinLog.js';
import { MetricsService } from '../services/metricsService.js';
import { getLocalDateString } from '../utils/timezone.js';

export class ProteinController {
  static async getProtein(req, res) {
    const today = getLocalDateString(new Date(), req.user.timezone);
    const logs = await ProteinLog.find({
      userId: req.user._id,
      date: today,
      deletedAt: null
    }).sort({ loggedAt: -1 });

    const totalGrams = logs.reduce((acc, curr) => acc + curr.grams, 0);
    const targetGrams = req.user.goals?.proteinG || 90;

    return res.status(200).json({
      date: today,
      totalGrams,
      targetGrams,
      percentage: Math.min(100, Math.round((totalGrams / targetGrams) * 100)),
      entries: logs.map((l) => ({
        id: l._id,
        amount: l.grams,
        label: l.label,
        calories: l.calories,
        source: l.source,
        timestamp: l.loggedAt
      }))
    });
  }

  static async logProtein(req, res) {
    const { grams, label, source, calories } = req.body;
    const today = getLocalDateString(new Date(), req.user.timezone);

    const log = await ProteinLog.create({
      userId: req.user._id,
      grams,
      label: label || 'Protein portion',
      source: source || 'manual',
      calories: calories || Math.round(grams * 4),
      date: today,
      loggedAt: new Date()
    });

    MetricsService.updateWeeklyScore(req.user).catch(() => {});
    const overview = await MetricsService.getTodayOverview(req.user);

    return res.status(201).json({
      success: true,
      log: {
        id: log._id,
        amount: log.grams,
        label: log.label,
        calories: log.calories,
        source: log.source,
        timestamp: log.loggedAt
      },
      overview
    });
  }

  static async deleteProteinLog(req, res) {
    const { id } = req.params;
    const log = await ProteinLog.findOneAndUpdate(
      { _id: id, userId: req.user._id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ error: 'Protein log not found' });
    }

    const overview = await MetricsService.getTodayOverview(req.user);
    return res.status(200).json({
      success: true,
      message: 'Protein log moved to undo buffer',
      undoId: log._id,
      overview
    });
  }

  static async restoreProteinLog(req, res) {
    const { id } = req.params;
    const log = await ProteinLog.findOneAndUpdate(
      { _id: id, userId: req.user._id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({ error: 'Protein log not found in undo buffer' });
    }

    const overview = await MetricsService.getTodayOverview(req.user);
    return res.status(200).json({
      success: true,
      message: 'Protein entry restored',
      overview
    });
  }
}
