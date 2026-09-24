import { Router } from 'express';
import { z } from 'zod';
import { RitualController } from '../controllers/ritualController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const ritualRoutes = Router();

const createRitualSchema = z.object({
  name: z.string().min(1).max(100),
  category: z.enum(['Mind', 'Health', 'Focus', 'Body', 'Rest']).optional(),
  anchor: z.string().max(100).optional(),
  time: z.string().optional(),
  schedule: z.array(z.string()).optional()
}).strict();

ritualRoutes.use(requireAuth);

ritualRoutes.get('/', RitualController.getRituals);
ritualRoutes.post('/', validateRequest({ bodySchema: createRitualSchema }), RitualController.createRitual);
ritualRoutes.put('/:id', RitualController.updateRitual);
ritualRoutes.delete('/:id', RitualController.deleteRitual);

ritualRoutes.post('/:id/checkin', RitualController.checkinRitual);
ritualRoutes.post('/:id/skip', RitualController.skipRitual);
