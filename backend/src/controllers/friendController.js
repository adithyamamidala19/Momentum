import { User } from '../models/User.js';
import { FriendRequest } from '../models/FriendRequest.js';
import { Friendship } from '../models/Friendship.js';
import { Conversation } from '../models/Conversation.js';
import { Block } from '../models/Block.js';

export class FriendController {
  /**
   * POST /api/friends/request
   * Sends a two-step opt-in friend request to another user
   */
  static async sendRequest(req, res) {
    const { targetUserId } = req.body;
    const currentUserId = req.user._id;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    if (currentUserId.toString() === targetUserId.toString()) {
      return res.status(400).json({ error: 'You cannot send a friend request to yourself' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser || !targetUser.challenge?.optedIn) {
      return res.status(404).json({ error: 'Target user not found or is not participating in the Challenge circle' });
    }

    // Check blocks
    const hasBlock = await Block.findOne({
      $or: [
        { blockerId: currentUserId, blockedId: targetUserId },
        { blockerId: targetUserId, blockedId: currentUserId }
      ]
    });
    if (hasBlock) {
      return res.status(403).json({ error: 'Unable to send friend request' });
    }

    // Check if already mutual friends
    const existingFriendship = await Friendship.findOne({
      $or: [
        { userA: currentUserId, userB: targetUserId },
        { userA: targetUserId, userB: currentUserId }
      ]
    });
    if (existingFriendship) {
      return res.status(400).json({ error: 'You are already mutual friends with this user' });
    }

    // Check if reverse request is pending -> auto-accept!
    const incomingReq = await FriendRequest.findOne({
      fromUserId: targetUserId,
      toUserId: currentUserId,
      status: 'pending'
    });

    if (incomingReq) {
      incomingReq.status = 'accepted';
      await incomingReq.save();

      await Friendship.create({ userA: currentUserId, userB: targetUserId });
      let conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, targetUserId] }
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [currentUserId, targetUserId]
        });
      }

      return res.status(200).json({
        success: true,
        status: 'friends',
        message: `You and ${targetUser.challenge.nickname} are now friends!`
      });
    }

    // Create or update outgoing request
    const request = await FriendRequest.findOneAndUpdate(
      { fromUserId: currentUserId, toUserId: targetUserId },
      { status: 'pending' },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      success: true,
      status: 'request_sent',
      message: `Friend request sent to ${targetUser.challenge.nickname}`
    });
  }

  /**
   * POST /api/friends/respond
   * Accept, decline, or block-and-decline an incoming friend request
   */
  static async respondRequest(req, res) {
    const { requestId, action } = req.body;
    const currentUserId = req.user._id;

    if (!['accept', 'decline', 'block'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be accept, decline, or block' });
    }

    const request = await FriendRequest.findOne({
      _id: requestId,
      toUserId: currentUserId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({ error: 'Pending friend request not found' });
    }

    const senderId = request.fromUserId;

    if (action === 'accept') {
      request.status = 'accepted';
      await request.save();

      // Create mutual friendship
      await Friendship.findOneAndUpdate(
        { userA: currentUserId, userB: senderId },
        { userA: currentUserId, userB: senderId },
        { upsert: true }
      );

      // Initialize or find conversation
      let conversation = await Conversation.findOne({
        participants: { $all: [currentUserId, senderId] }
      });
      if (!conversation) {
        conversation = await Conversation.create({
          participants: [currentUserId, senderId]
        });
      }

      return res.status(200).json({
        success: true,
        status: 'accepted',
        conversationId: conversation._id,
        message: 'Friend request accepted. Safe messaging is now unlocked!'
      });
    } else if (action === 'decline') {
      request.status = 'declined';
      await request.save();

      return res.status(200).json({
        success: true,
        status: 'declined',
        message: 'Friend request declined.'
      });
    } else if (action === 'block') {
      request.status = 'blocked';
      await request.save();

      // Create Block record
      await Block.findOneAndUpdate(
        { blockerId: currentUserId, blockedId: senderId },
        { blockerId: currentUserId, blockedId: senderId },
        { upsert: true }
      );

      return res.status(200).json({
        success: true,
        status: 'blocked',
        message: 'User blocked.'
      });
    }
  }

  /**
   * GET /api/friends
   * Lists all accepted friends with their public Challenge details and recent conversation
   */
  static async getFriends(req, res) {
    const currentUserId = req.user._id;

    // Fetch friendships where user is userA or userB
    const friendships = await Friendship.find({
      $or: [{ userA: currentUserId }, { userB: currentUserId }]
    });

    const friendUserIds = friendships.map((f) =>
      f.userA.toString() === currentUserId.toString() ? f.userB : f.userA
    );

    // Filter out any users who are blocked by either party
    const blocks = await Block.find({
      $or: [
        { blockerId: currentUserId, blockedId: { $in: friendUserIds } },
        { blockerId: { $in: friendUserIds }, blockedId: currentUserId }
      ]
    });
    const blockedSet = new Set();
    blocks.forEach((b) => {
      blockedSet.add(b.blockerId.toString());
      blockedSet.add(b.blockedId.toString());
    });

    const validFriendIds = friendUserIds.filter((id) => !blockedSet.has(id.toString()));

    // Fetch public safe friend user records
    const friends = await User.find({ _id: { $in: validFriendIds } }).select(
      'challenge.nickname challenge.avatar challenge.bio showOnlineStatus'
    );

    // Fetch conversations
    const conversations = await Conversation.find({
      participants: currentUserId
    });

    const conversationMap = new Map();
    conversations.forEach((c) => {
      const other = c.participants.find((p) => p.toString() !== currentUserId.toString());
      if (other) {
        conversationMap.set(other.toString(), {
          conversationId: c._id,
          lastMessageAt: c.lastMessageAt,
          lastMessagePreview: c.lastMessagePreview
        });
      }
    });

    const result = friends.map((f) => {
      const convo = conversationMap.get(f._id.toString()) || null;
      return {
        id: f._id,
        nickname: f.challenge?.nickname || 'Practitioner',
        avatar: f.challenge?.avatar || '🌱',
        bio: f.challenge?.bio || '',
        showOnlineStatus: Boolean(f.showOnlineStatus),
        conversationId: convo?.conversationId || null,
        lastMessageAt: convo?.lastMessageAt || null,
        lastMessagePreview: convo?.lastMessagePreview || ''
      };
    });

    return res.status(200).json({ friends: result });
  }

  /**
   * GET /api/friends/pending
   * Lists incoming pending friend requests for in-app notification badges
   */
  static async getPendingRequests(req, res) {
    const currentUserId = req.user._id;

    const requests = await FriendRequest.find({
      toUserId: currentUserId,
      status: 'pending'
    })
      .populate('fromUserId', 'challenge.nickname challenge.avatar')
      .sort({ createdAt: -1 });

    const safeRequests = requests
      .filter((r) => r.fromUserId && r.fromUserId.challenge?.nickname)
      .map((r) => ({
        id: r._id,
        fromUserId: r.fromUserId._id,
        nickname: r.fromUserId.challenge.nickname,
        avatar: r.fromUserId.challenge.avatar || '🌱',
        createdAt: r.createdAt
      }));

    return res.status(200).json({
      count: safeRequests.length,
      requests: safeRequests
    });
  }
}
