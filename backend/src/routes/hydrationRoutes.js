import { Router } from 'express';
import { z } from 'zod';
import { HydrationController } from '../controllers/hydrationController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const hydrationRoutes = Router();

const logHydrationSchema = z.object({
  amountMl: z.number().int().min(1).max(5000)
}).strict();

const setWaterSchema = z.object({
  targetMl: z.number().int().min(0).max(10000)
}).strict();

hydrationRoutes.use(requireAuth);

hydrationRoutes.get('/', HydrationController.getHydration);
hydrationRoutes.post('/', validateRequest({ bodySchema: logHydrationSchema }), HydrationController.logHydration);
hydrationRoutes.post('/decrement', HydrationController.removeLatest);
hydrationRoutes.delete('/latest', HydrationController.removeLatest);
hydrationRoutes.put('/', validateRequest({ bodySchema: setWaterSchema }), HydrationController.setWater);
hydrationRoutes.delete('/:id', HydrationController.deleteHydrationLog);
