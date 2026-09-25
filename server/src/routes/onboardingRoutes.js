import { Router } from 'express';
import { z } from 'zod';
import { OnboardingController } from '../controllers/onboardingController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const onboardingRoutes = Router();

onboardingRoutes.use(requireAuth);

const saveStepSchema = z.object({
  step: z.number().int().min(1).max(6),
  draft: z.record(z.any()).optional()
}).strict();

const completeSchema = z.object({
  displayName: z.string().min(1).max(100).optional(),
  mantra: z.string().max(200).optional(),
  age: z.number().int().min(13).max(120).nullable().optional(),
  weightKg: z.number().min(20).max(500).nullable().optional(),
  gender: z.enum(['Male', 'Female', 'Non-binary', 'Prefer not to say', '']).optional(),
  photoType: z.enum(['google', 'avatar', 'custom', '']).optional(),
  photoURL: z.string().optional(),
  avatarEmblem: z.string().optional(),
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
  rituals: z.array(
    z.object({
      name: z.string().min(1).max(100),
      category: z.enum(['Mind', 'Health', 'Focus', 'Body', 'Rest']).optional(),
      anchor: z.string().max(100).optional(),
      time: z.string().optional()
    })
  ).optional()
});

onboardingRoutes.get('/state', OnboardingController.getState);
onboardingRoutes.post('/step', validateRequest({ bodySchema: saveStepSchema }), OnboardingController.saveStep);
onboardingRoutes.post('/complete', validateRequest({ bodySchema: completeSchema }), OnboardingController.complete);
