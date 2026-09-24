import { Router } from 'express';
import { z } from 'zod';
import { AriaController } from '../controllers/ariaController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { ariaLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const ariaRoutes = Router();

const sendMessageSchema = z.object({
  text: z.string().min(1).max(500),
  intent: z.string().optional(),
  slotValues: z.record(z.any()).optional()
}).strict();

const undoActionSchema = z.object({
  undoToken: z.string().min(1)
}).strict();

ariaRoutes.use(requireAuth);
ariaRoutes.use(ariaLimiter);

ariaRoutes.get('/messages', AriaController.getMessages);
ariaRoutes.post('/message', validateRequest({ bodySchema: sendMessageSchema }), AriaController.sendMessage);
ariaRoutes.post('/undo', validateRequest({ bodySchema: undoActionSchema }), AriaController.undoAction);
