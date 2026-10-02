import { Router } from 'express';
import { AchievementController } from '../controllers/achievementController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const achievementRoutes = Router();

achievementRoutes.use(requireAuth);
achievementRoutes.get('/', AchievementController.getAchievements);
achievementRoutes.post('/recompute', AchievementController.recomputeAchievements);
