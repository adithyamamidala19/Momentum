import { Router } from 'express';
import { z } from 'zod';
import { ProteinController } from '../controllers/proteinController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const proteinRoutes = Router();

const logProteinSchema = z.object({
  grams: z.number().min(1).max(300),
  label: z.string().max(100).optional(),
  source: z.enum(['manual', 'scan']).optional(),
  calories: z.number().min(0).max(3000).optional()
}).strict();

proteinRoutes.use(requireAuth);

proteinRoutes.get('/', ProteinController.getProtein);
proteinRoutes.post('/', validateRequest({ bodySchema: logProteinSchema }), ProteinController.logProtein);
proteinRoutes.delete('/:id', ProteinController.deleteProteinLog);
proteinRoutes.post('/:id/restore', ProteinController.restoreProteinLog);
