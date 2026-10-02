import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { Friendship } from '../models/Friendship.js';
import { Block } from '../models/Block.js';
import { User } from '../models/User.js';
import { validateSafeContent } from '../utils/moderationFilter.js';
import { getSocketIO } from '../socket/chatSocket.js';

export class ChatController {
  /**
   * GET /api/chat/conversations
   * Fetches all 1:1 conversations the user is a participant of
   */
  static async getConversations(req, res) {
    const currentUserId = req.user._id;

    const conversations = await Conversation.find({
      participants: currentUserId
    })
      .populate('participants', 'challenge.nickname challenge.avatar showOnlineStatus')
      .sort({ lastMessageAt: -1 });

    const safeList = await Promise.all(
      conversations.map(async (c) => {
        const otherUser = c.participants.find(
          (p) => p._id.toString() !== currentUserId.toString()
        );

        const unreadCount = await Message.countDocuments({
          conversationId: c._id,
          senderId: { $ne: currentUserId },
          readAt: null,
          deletedFor: { $ne: currentUserId }
        });

        return {
          id: c._id,
          lastMessageAt: c.lastMessageAt,
          lastMessagePreview: c.lastMessagePreview,
          unreadCount,
          otherUser: otherUser
            ? {
                id: otherUser._id,
                nickname: otherUser.challenge?.nickname || 'Practitioner',
                avatar: otherUser.challenge?.avatar || '🌱',
                showOnlineStatus: Boolean(otherUser.showOnlineStatus)
              }
            : null
        };
      })
    );

    const totalUnread = safeList.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

    return res.status(200).json({ conversations: safeList, totalUnread });
  }

  /**
   * GET /api/chat/unread-count
   * Returns total count of unread incoming messages
   */
  static async getUnreadCount(req, res) {
    const currentUserId = req.user._id;
    const userConversations = await Conversation.find({
      participants: currentUserId
    }).select('_id');

    const conversationIds = userConversations.map((c) => c._id);

    const totalUnread = await Message.countDocuments({
      conversationId: { $in: conversationIds },
      senderId: { $ne: currentUserId },
      readAt: null,
      deletedFor: { $ne: currentUserId }
    });

    return res.status(200).json({ unreadCount: totalUnread });
  }

  /**
   * GET /api/chat/conversation/:conversationId/messages
   * Fetches message history for a conversation
   */
  static async getMessages(req, res) {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    // Automatically mark all incoming unread messages as read
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: currentUserId },
        readAt: null
      },
      {
        $set: { readAt: new Date() }
      }
    );

    const messages = await Message.find({
      conversationId,
      deletedFor: { $ne: currentUserId }
    })
      .sort({ createdAt: 1 })
      .limit(100);

    const safeMessages = messages.map((m) => ({
      id: m._id,
      conversationId: m.conversationId,
      senderId: m.senderId,
      isMine: m.senderId.toString() === currentUserId.toString(),
      text: m.text,
      createdAt: m.createdAt,
      readAt: m.readAt
    }));

    return res.status(200).json({ messages: safeMessages });
  }

  /**
   * POST /api/chat/message
   * Sends a safe, filtered message in a conversation between mutual friends
   */
  static async sendMessage(req, res) {
    const { conversationId, text } = req.body;
    const currentUserId = req.user._id;

    if (!conversationId || !text || !text.trim()) {
      return res.status(400).json({ error: 'conversationId and text are required' });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: currentUserId
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found or access denied' });
    }

    const recipientId = conversation.participants.find(
      (p) => p.toString() !== currentUserId.toString()
    );

    if (!recipientId) {
      return res.status(400).json({ error: 'Recipient participant missing' });
    }

    // 1. Verify mutual friendship
    const isFriend = await Friendship.findOne({
      $or: [
        { userA: currentUserId, userB: recipientId },
        { userA: recipientId, userB: currentUserId }
      ]
    });

    if (!isFriend) {
      return res.status(403).json({
        error: 'Messaging is only permitted between mutual accepted friends.'
      });
    }

    // 2. Verify no blocks exist
    const hasBlock = await Block.findOne({
      $or: [
        { blockerId: currentUserId, blockedId: recipientId },
        { blockerId: recipientId, blockedId: currentUserId }
      ]
    });

    if (hasBlock) {
      return res.status(403).json({ error: 'Cannot send message to this user' });
    }

    // 3. Automated safety and contact-info filtering (Phase D3)
    const check = validateSafeContent(text);
    if (!check.passed) {
      return res.status(400).json({
        error: check.warning,
        code: 'SAFETY_PII_BLOCKED',
        reason: check.reason
      });
    }

    // 4. Save Message
    const cleanText = text.trim();
    const msg = await Message.create({
      conversationId,
      senderId: currentUserId,
      text: cleanText
    });

    // 5. Update Conversation metadata
    conversation.lastMessageAt = new Date();
    conversation.lastMessagePreview = cleanText.slice(0, 60);
    await conversation.save();

    const payload = {
      id: msg._id,
      conversationId,
      senderId: currentUserId,
      text: cleanText,
      createdAt: msg.createdAt,
      readAt: null
    };

    // 6. Broadcast via Socket.io
    try {
      const io = getSocketIO();
      if (io) {
        // Emit to conversation room (for currently open chat drawer)
        io.to(conversationId.toString()).emit('new_message', payload);

        // Also emit directly to recipient's personal user room
        const senderNickname = req.user.challenge?.nickname || req.user.displayName || 'Practitioner';
        const senderAvatar = req.user.challenge?.avatar || '🌱';
        io.to(`user_${recipientId.toString()}`).emit('chat_notification', {
          type: 'new_message',
          conversationId: conversationId.toString(),
          message: payload,
          senderId: currentUserId.toString(),
          senderNickname,
          senderAvatar
        });
      }
    } catch (e) {
      console.warn('[Chat] Socket broadcast note:', e);
    }

    return res.status(201).json({ success: true, message: payload });
  }

  /**
   * POST /api/chat/message/undo-delete
   * 10-second undo delete-for-me pattern
   */
  static async undoDelete(req, res) {
    const { messageId } = req.body;
    const currentUserId = req.user._id;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify user is sender or participant
    const conversation = await Conversation.findOne({
      _id: message.conversationId,
      participants: currentUserId
    });
    if (!conversation) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check 10 second window from creation
    const ageSeconds = (Date.now() - new Date(message.createdAt).getTime()) / 1000;
    if (ageSeconds > 10) {
      return res.status(400).json({ error: '10-second undo window has expired' });
    }

    if (!message.deletedFor.includes(currentUserId)) {
      message.deletedFor.push(currentUserId);
      await message.save();
    }

    return res.status(200).json({
      success: true,
      messageId,
      message: 'Message retracted within 10s undo window.'
    });
  }

  /**
   * POST /api/chat/safety-acknowledge
   * Records that the user has acknowledged the first-time chat safety interstitial
   */
  static async acknowledgeSafety(req, res) {
    req.user.chatSafetyAcknowledged = true;
    await req.user.save();

    return res.status(200).json({
      success: true,
      chatSafetyAcknowledged: true
    });
  }
}
