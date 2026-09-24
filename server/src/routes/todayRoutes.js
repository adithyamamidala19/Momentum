import { Router } from 'express';
import { TodayController } from '../controllers/todayController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const todayRoutes = Router();

todayRoutes.use(requireAuth);
todayRoutes.get('/', TodayController.getToday);
