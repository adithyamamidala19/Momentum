import { Router } from 'express';
import { z } from 'zod';
import { ChatController } from '../controllers/chatController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const chatRoutes = Router();

const sendMessageSchema = z.object({
  conversationId: z.string().min(1),
  text: z.string().min(1).max(1000)
}).strict();

const undoDeleteSchema = z.object({
  messageId: z.string().min(1)
}).strict();

chatRoutes.use(requireAuth);

chatRoutes.get('/conversations', ChatController.getConversations);
chatRoutes.get('/unread-count', ChatController.getUnreadCount);
chatRoutes.get('/conversation/:conversationId/messages', ChatController.getMessages);
chatRoutes.post('/message', validateRequest({ bodySchema: sendMessageSchema }), ChatController.sendMessage);
chatRoutes.post('/message/undo-delete', validateRequest({ bodySchema: undoDeleteSchema }), ChatController.undoDelete);
chatRoutes.post('/safety-acknowledge', ChatController.acknowledgeSafety);
