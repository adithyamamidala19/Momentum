import { Block } from '../models/Block.js';
import { Report } from '../models/Report.js';
import { Friendship } from '../models/Friendship.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { User } from '../models/User.js';

export class ModerationController {
  /**
   * POST /api/moderation/block
   * Immediately blocks a user: hides profile, severs friendships, terminates chat ability
   */
  static async blockUser(req, res) {
    const { targetUserId } = req.body;
    const currentUserId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // 1. Create Block record
    await Block.findOneAndUpdate(
      { blockerId: currentUserId, blockedId: targetUserId },
      { blockerId: currentUserId, blockedId: targetUserId },
      { upsert: true }
    );

    // 2. Sever any mutual friendships
    await Friendship.deleteMany({
      $or: [
        { userA: currentUserId, userB: targetUserId },
        { userA: targetUserId, userB: currentUserId }
      ]
    });

    // 3. Clean up any pending friend requests
    await FriendRequest.deleteMany({
      $or: [
        { fromUserId: currentUserId, toUserId: targetUserId },
        { fromUserId: targetUserId, toUserId: currentUserId }
      ]
    });

    return res.status(200).json({
      success: true,
      message: 'User blocked. You will no longer interact on Momentum.'
    });
  }

  /**
   * POST /api/moderation/unblock
   * Removes active block
   */
  static async unblockUser(req, res) {
    const { targetUserId } = req.body;
    const currentUserId = req.user._id;

    await Block.deleteOne({ blockerId: currentUserId, blockedId: targetUserId });

    return res.status(200).json({
      success: true,
      message: 'User unblocked.'
    });
  }

  /**
   * GET /api/moderation/blocked
   * Lists all users blocked by current user
   */
  static async getBlockedUsers(req, res) {
    const currentUserId = req.user._id;
    const blocks = await Block.find({ blockerId: currentUserId }).populate(
      'blockedId',
      'challenge.nickname challenge.avatar'
    );

    const safeList = blocks
      .filter((b) => b.blockedId)
      .map((b) => ({
        id: b.blockedId._id,
        nickname: b.blockedId.challenge?.nickname || 'Practitioner',
        avatar: b.blockedId.challenge?.avatar || '🌱',
        blockedAt: b.createdAt
      }));

    return res.status(200).json({ blockedUsers: safeList });
  }

  /**
   * POST /api/moderation/report
   * Submits a report for profile, message, or bio
   */
  static async createReport(req, res) {
    const { targetType, targetId, targetUserId, reason, notes } = req.body;
    const currentUserId = req.user._id;

    if (!['profile', 'message', 'bio'].includes(targetType)) {
      return res.status(400).json({ error: 'Invalid targetType' });
    }
    if (!['harassment', 'spam', 'inappropriate', 'impersonation', 'other'].includes(reason)) {
      return res.status(400).json({ error: 'Invalid report reason' });
    }

    const report = await Report.create({
      reporterId: currentUserId,
      targetType,
      targetId: targetId || null,
      targetUserId,
      reason,
      notes: (notes || '').trim().slice(0, 500)
    });

    return res.status(201).json({
      success: true,
      reportId: report._id,
      message: 'Thank you for reporting. Our moderation guardians will review this promptly.'
    });
  }

  /**
   * GET /api/moderation/admin/reports
   * Admin-only endpoint to view active community reports
   */
  static async getAdminReports(req, res) {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const reports = await Report.find()
      .populate('reporterId', 'challenge.nickname email')
      .populate('targetUserId', 'challenge.nickname email')
      .sort({ createdAt: -1 })
      .limit(100);

    return res.status(200).json({ reports });
  }
}
