import { Router } from 'express';
import { z } from 'zod';
import { ProfileController } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const profileRoutes = Router();

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  mantra: z.string().max(200).optional(),
  timezone: z.string().max(100).optional(),
  units: z.object({
    weight: z.enum(['kg', 'lb']).optional(),
    volume: z.enum(['ml', 'oz']).optional()
  }).optional(),
  goals: z.object({
    waterMl: z.number().min(250).max(10000).optional(),
    proteinG: z.number().min(10).max(500).optional(),
    focusMin: z.number().min(5).max(480).optional()
  }).optional(),
  challenge: z.object({
    optedIn: z.boolean().optional(),
    nickname: z.string().max(50).optional(),
    avatar: z.string().max(10).optional()
  }).optional(),
  notificationPrefs: z.object({
    quietStart: z.string().optional(),
    quietEnd: z.string().optional(),
    dailyNudgeLimit: z.number().min(0).max(10).optional()
  }).optional(),
  theme: z.enum(['cream', 'dark', 'system']).optional()
}).strict();

profileRoutes.use(requireAuth);

profileRoutes.put(
  '/',
  validateRequest({ bodySchema: updateProfileSchema }),
  ProfileController.updateProfile
);

profileRoutes.get('/export', ProfileController.exportData);
profileRoutes.delete('/account', ProfileController.deleteAccount);
