import { Ritual } from '../models/Ritual.js';
import { RitualLog } from '../models/RitualLog.js';
import { MetricsService } from '../services/metricsService.js';
import { getLocalDateString } from '../utils/timezone.js';

export class RitualController {
  static async getRituals(req, res) {
    const rituals = await Ritual.find({ userId: req.user._id, archived: false }).sort({ order: 1 });
    const today = getLocalDateString(new Date(), req.user.timezone);
    const logs = await RitualLog.find({ userId: req.user._id, date: today });

    const logMap = new Map();
    logs.forEach((l) => logMap.set(l.ritualId.toString(), l.status));

    const result = await Promise.all(
      rituals.map(async (r) => {
        const streak = await MetricsService.computeRitualStreak(req.user._id, r._id, req.user.timezone);
        return {
          id: r._id,
          name: r.name,
          category: r.category,
          anchor: r.anchor,
          time: r.time,
          schedule: r.schedule,
          completed: logMap.get(r._id.toString()) === 'done',
          skipped: logMap.get(r._id.toString()) === 'skipped',
          streak
        };
      })
    );

    return res.status(200).json({ rituals: result });
  }

  static async createRitual(req, res) {
    const { name, category, anchor, time, schedule } = req.body;
    const count = await Ritual.countDocuments({ userId: req.user._id });

    const ritual = await Ritual.create({
      userId: req.user._id,
      name,
      category: category || 'Health',
      anchor: anchor || '',
      time: time || '08:00',
      schedule: schedule || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      order: count + 1
    });

    return res.status(201).json({ ritual });
  }

  static async updateRitual(req, res) {
    const { id } = req.params;
    const ritual = await Ritual.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      req.body,
      { new: true }
    );

    if (!ritual) {
      return res.status(404).json({ error: 'Ritual not found' });
    }

    return res.status(200).json({ ritual });
  }

  static async deleteRitual(req, res) {
    const { id } = req.params;
    const ritual = await Ritual.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { archived: true },
      { new: true }
    );

    if (!ritual) {
      return res.status(404).json({ error: 'Ritual not found' });
    }

    return res.status(200).json({ success: true, message: 'Ritual archived' });
  }

  /**
   * POST /api/rituals/:id/checkin
   * Idempotent check-in for today. Updates score and weekly challenge.
   */
  static async checkinRitual(req, res) {
    const { id } = req.params;
    const today = getLocalDateString(new Date(), req.user.timezone);

    const ritual = await Ritual.findOne({ _id: id, userId: req.user._id });
    if (!ritual) {
      return res.status(404).json({ error: 'Ritual not found' });
    }

    // Upsert ritual log idempotently
    const log = await RitualLog.findOneAndUpdate(
      { userId: req.user._id, ritualId: ritual._id, date: today },
      { status: 'done', completedAt: new Date() },
      { upsert: true, new: true }
    );

    // Recompute weekly score asynchronously
    MetricsService.updateWeeklyScore(req.user).catch(() => {});

    // Compute updated today overview
    const overview = await MetricsService.getTodayOverview(req.user);

    return res.status(200).json({
      success: true,
      log,
      overview
    });
  }

  /**
   * POST /api/rituals/:id/skip
   * Marks ritual skipped for today (Rest day). Rest days never lower adherence!
   */
  static async skipRitual(req, res) {
    const { id } = req.params;
    const today = getLocalDateString(new Date(), req.user.timezone);

    const ritual = await Ritual.findOne({ _id: id, userId: req.user._id });
    if (!ritual) {
      return res.status(404).json({ error: 'Ritual not found' });
    }

    // Upsert ritual log with status 'skipped'
    const log = await RitualLog.findOneAndUpdate(
      { userId: req.user._id, ritualId: ritual._id, date: today },
      { status: 'skipped', completedAt: new Date() },
      { upsert: true, new: true }
    );

    // Compute updated today overview
    const overview = await MetricsService.getTodayOverview(req.user);

    return res.status(200).json({
      success: true,
      log,
      overview
    });
  }

  /**
   * POST /api/rituals/:id/uncheck
   * Removes today's checkin or skip log, returning ritual to pending state.
   */
  static async uncheckRitual(req, res) {
    const { id } = req.params;
    const today = getLocalDateString(new Date(), req.user.timezone);

    await RitualLog.deleteOne({
      userId: req.user._id,
      ritualId: id,
      date: today
    });

    MetricsService.updateWeeklyScore(req.user).catch(() => {});
    const overview = await MetricsService.getTodayOverview(req.user);

    return res.status(200).json({
      success: true,
      overview
    });
  }

  /**
   * POST /api/rituals/batch
   * Creates multiple rituals at once (used during onboarding setup).
   */
  static async createRitualsBatch(req, res) {
    const { rituals } = req.body;
    if (!Array.isArray(rituals) || rituals.length === 0) {
      return res.status(200).json({ rituals: [] });
    }

    const currentCount = await Ritual.countDocuments({ userId: req.user._id });
    const docs = rituals.map((r, i) => ({
      userId: req.user._id,
      name: r.name,
      category: r.category || 'Health',
      anchor: r.anchor || '',
      time: r.time || '08:00',
      schedule: r.schedule || ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'],
      order: currentCount + i + 1
    }));

    const created = await Ritual.insertMany(docs);
    return res.status(201).json({ rituals: created });
  }
}
