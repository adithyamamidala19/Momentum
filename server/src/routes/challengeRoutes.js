import { Router } from 'express';
import { z } from 'zod';
import { ChallengeController } from '../controllers/challengeController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const challengeRoutes = Router();

const joinChallengeSchema = z.object({
  nickname: z.string().min(2).max(40),
  avatar: z.string().max(10).optional()
}).strict();

challengeRoutes.use(requireAuth);

challengeRoutes.get('/weekly', ChallengeController.getWeekly);
challengeRoutes.post('/join', validateRequest({ bodySchema: joinChallengeSchema }), ChallengeController.join);
challengeRoutes.post('/leave', ChallengeController.leave);
challengeRoutes.get('/me', ChallengeController.getMe);
challengeRoutes.get('/last-week-winners', ChallengeController.getLastWeekWinners);
