import crypto from 'crypto';
import { Medal } from '../models/Medal.js';
import { ShareLog } from '../models/ShareLog.js';
import { MetricsService } from '../services/metricsService.js';
import { getLocalDateString } from '../utils/timezone.js';

const TIER_TARGETS = {
  'streak-7': { targetDays: 7, tier: 'bronze', name: '7-Day Genesis' },
  'ms-bronze': { targetDays: 7, tier: 'bronze', name: '7-Day Genesis' },
  'streak-30': { targetDays: 30, tier: 'silver', name: '30-Day Flow' },
  'ms-silver': { targetDays: 30, tier: 'silver', name: '30-Day Flow' },
  'streak-100': { targetDays: 100, tier: 'gold', name: '100-Day Centurion' },
  'ms-gold': { targetDays: 100, tier: 'gold', name: '100-Day Centurion' },
  'streak-365': { targetDays: 365, tier: 'platinum', name: '365-Day Master' },
  'ms-plat': { targetDays: 365, tier: 'platinum', name: '365-Day Master' }
};

export class MilestoneController {
  static async getMilestones(req, res) {
    const streak = await MetricsService.computeStreak(req.user._id, req.user.timezone);
    const { milestones, nextMilestone } = await MetricsService.computeMilestones(
      req.user._id,
      streak,
      req.user.timezone
    );

    return res.status(200).json({
      streak,
      milestones,
      nextMilestone
    });
  }

  /**
   * POST /api/milestones/verify-share
   * Server-authoritative verification ensuring a user has genuinely completed the milestone before sharing.
   * Returns 403 Forbidden if the user has not achieved the required streak/activity.
   */
  static async verifyShare(req, res) {
    const { medalId } = req.body;
    if (!medalId) {
      return res.status(400).json({ success: false, error: 'medalId is required' });
    }

    const info = TIER_TARGETS[medalId];
    if (!info) {
      return res.status(400).json({ success: false, error: 'Unknown milestone medal ID' });
    }

    // 1. Check if verified Medal document already exists in MongoDB
    let medal = await Medal.findOne({
      userId: req.user._id,
      medalId: { $in: [medalId, info.tier === 'bronze' ? 'streak-7' : info.tier === 'silver' ? 'streak-30' : info.tier === 'gold' ? 'streak-100' : 'streak-365'] }
    });

    // 2. If not found in Medal collection, verify actual user streak from database logs
    const streak = await MetricsService.computeStreak(req.user._id, req.user.timezone);
    const isCompleted = Boolean(medal) || streak >= info.targetDays;

    if (!isCompleted) {
      return res.status(403).json({
        success: false,
        verified: false,
        error: 'Cannot share: activity or milestone has not been completed yet.',
        requiredDays: info.targetDays,
        currentStreak: streak
      });
    }

    // If earned through streak but Medal document wasn't created yet, create it now
    if (!medal) {
      const today = getLocalDateString(new Date(), req.user.timezone);
      const verificationCode = `MMTM-${info.tier.slice(0, 1).toUpperCase()}${info.targetDays}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      try {
        medal = await Medal.create({
          userId: req.user._id,
          medalId: medalId.startsWith('streak-') ? medalId : `streak-${info.targetDays}`,
          title: info.name,
          tier: info.tier,
          earnedDate: today,
          verificationCode
        });
      } catch {
        medal = await Medal.findOne({ userId: req.user._id, tier: info.tier });
      }
    }

    return res.status(200).json({
      success: true,
      verified: true,
      medalId,
      tier: info.tier,
      title: medal?.title || info.name,
      earnedDate: medal?.earnedDate,
      verificationCode: medal?.verificationCode
    });
  }

  static async logShare(req, res) {
    const { medalId, tier, platform } = req.body;
    if (!medalId) {
      return res.status(400).json({ error: 'medalId is required' });
    }

    // Enforce backend completion verification before logging any share
    const info = TIER_TARGETS[medalId];
    if (info) {
      const streak = await MetricsService.computeStreak(req.user._id, req.user.timezone);
      const medalExists = await Medal.findOne({
        userId: req.user._id,
        medalId: { $in: [medalId, info.tier === 'bronze' ? 'streak-7' : info.tier === 'silver' ? 'streak-30' : info.tier === 'gold' ? 'streak-100' : 'streak-365'] }
      });

      if (!medalExists && streak < info.targetDays) {
        return res.status(403).json({
          error: 'Cannot share: activity or milestone has not been completed yet.'
        });
      }
    }

    // 1. Create share log entry for user stats
    const log = await ShareLog.create({
      userId: req.user._id,
      medalId,
      tier: tier || 'bronze',
      platform: platform || 'web_share'
    });

    // 2. Increment sharedCount on Medal document if exists
    const medal = await Medal.findOneAndUpdate(
      { userId: req.user._id, medalId },
      { $inc: { sharedCount: 1 } },
      { new: true }
    );

    const totalShares = await ShareLog.countDocuments({ userId: req.user._id });

    return res.status(200).json({
      success: true,
      sharedCount: medal?.sharedCount || 1,
      totalShares
    });
  }
}

