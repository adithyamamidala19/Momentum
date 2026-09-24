import crypto from 'crypto';
import { AriaMessage } from '../models/AriaMessage.js';
import { Ritual } from '../models/Ritual.js';
import { Todo } from '../models/Todo.js';
import { HydrationLog } from '../models/HydrationLog.js';
import { getLocalDateString } from '../utils/timezone.js';

export class AriaController {
  static async getMessages(req, res) {
    const messages = await AriaMessage.find({ userId: req.user._id }).sort({ createdAt: 1 }).limit(100);
    return res.status(200).json({ messages });
  }

  static async sendMessage(req, res) {
    const { text, intent, slotValues } = req.body;
    const userId = req.user._id;

    // 1. Save user's spoken message
    const userMsg = await AriaMessage.create({
      userId,
      role: 'user',
      text
    });

    let ariaResponseText = "I'm listening and holding space for your rhythm.";
    let performedAction = null;
    let undoToken = null;

    // Execute intent if provided
    if (intent === 'LOG_WATER') {
      const amount = slotValues?.amountMl || 250;
      const today = getLocalDateString(new Date(), req.user.timezone);
      const hydLog = await HydrationLog.create({
        userId,
        amountMl: amount,
        date: today
      });
      undoToken = crypto.randomUUID();
      performedAction = { type: 'LOG_WATER', targetId: hydLog._id, amountMl: amount };
      ariaResponseText = `Hydration noted: ${amount}ml added to today's sanctuary rhythm.`;
    } else if (intent === 'ADD_TODO') {
      const title = slotValues?.title || text;
      const todo = await Todo.create({
        userId,
        title,
        priority: 'normal'
      });
      undoToken = crypto.randomUUID();
      performedAction = { type: 'ADD_TODO', targetId: todo._id, title };
      ariaResponseText = `Added to your intentions: "${title}".`;
    } else if (intent === 'ADD_HABIT') {
      const name = slotValues?.name || text;
      const ritual = await Ritual.create({
        userId,
        name,
        category: 'Health',
        time: slotValues?.time || '08:00'
      });
      undoToken = crypto.randomUUID();
      performedAction = { type: 'ADD_HABIT', targetId: ritual._id, name };
      ariaResponseText = `New daily ritual cultivated: "${name}".`;
    }

    // Save Aria's response
    const ariaMsg = await AriaMessage.create({
      userId,
      role: 'aria',
      text: ariaResponseText,
      action: performedAction,
      undoToken
    });

    return res.status(200).json({
      userMessage: userMsg,
      ariaMessage: ariaMsg,
      undoToken
    });
  }

  static async undoAction(req, res) {
    const { undoToken } = req.body;
    const message = await AriaMessage.findOne({
      userId: req.user._id,
      undoToken,
      undoExpired: false
    });

    if (!message || !message.action) {
      return res.status(404).json({ error: 'Undo token expired or action not found' });
    }

    const { type, targetId } = message.action;

    if (type === 'LOG_WATER') {
      await HydrationLog.deleteOne({ _id: targetId, userId: req.user._id });
    } else if (type === 'ADD_TODO') {
      await Todo.deleteOne({ _id: targetId, userId: req.user._id });
    } else if (type === 'ADD_HABIT') {
      await Ritual.deleteOne({ _id: targetId, userId: req.user._id });
    }

    message.undoExpired = true;
    await message.save();

    return res.status(200).json({
      success: true,
      message: `Aria restored: ${type} undone.`
    });
  }
}
