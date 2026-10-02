import { Router } from 'express';
import { z } from 'zod';
import { FriendController } from '../controllers/friendController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const friendRoutes = Router();

const sendRequestSchema = z.object({
  targetUserId: z.string().min(1)
}).strict();

const respondRequestSchema = z.object({
  requestId: z.string().min(1),
  action: z.enum(['accept', 'decline', 'block'])
}).strict();

friendRoutes.use(requireAuth);

friendRoutes.get('/', FriendController.getFriends);
friendRoutes.get('/pending', FriendController.getPendingRequests);
friendRoutes.post('/request', validateRequest({ bodySchema: sendRequestSchema }), FriendController.sendRequest);
friendRoutes.post('/respond', validateRequest({ bodySchema: respondRequestSchema }), FriendController.respondRequest);
