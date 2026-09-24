import { Router } from 'express';
import { z } from 'zod';
import { FocusController } from '../controllers/focusController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const focusRoutes = Router();

const createSessionSchema = z.object({
  plannedMin: z.number().int().min(1).max(480),
  actualMin: z.number().int().min(0).max(480).optional(),
  intention: z.string().max(200).optional(),
  startedAt: z.string().optional(),
  endedAt: z.string().optional(),
  completed: z.boolean().optional()
}).strict();

focusRoutes.use(requireAuth);

focusRoutes.get('/sessions', FocusController.getSessions);
focusRoutes.post('/sessions', validateRequest({ bodySchema: createSessionSchema }), FocusController.createSession);
focusRoutes.get('/stats', FocusController.getStats);
