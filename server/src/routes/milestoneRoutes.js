import { Router } from 'express';
import { MilestoneController } from '../controllers/milestoneController.js';
import { requireAuth } from '../middleware/requireAuth.js';

export const milestoneRoutes = Router();

milestoneRoutes.use(requireAuth);
milestoneRoutes.get('/', MilestoneController.getMilestones);
