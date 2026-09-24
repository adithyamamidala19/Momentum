import { Router } from 'express';
import { InsightsController } from '../controllers/insightsController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const insightsRoutes = Router();

insightsRoutes.use(requireAuth);
insightsRoutes.get('/', InsightsController.getInsights);
