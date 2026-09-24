import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from '../controllers/authController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const authRoutes = Router();

// Zod validation schemas
const sessionSchema = z.object({
  idToken: z.string().min(1, 'idToken is required')
}).strict();

// Routes
authRoutes.post(
  '/session',
  authLimiter,
  validateRequest({ bodySchema: sessionSchema }),
  AuthController.createSession
);

authRoutes.post(
  '/logout',
  AuthController.logout
);

authRoutes.get(
  '/me',
  requireAuth,
  AuthController.getMe
);
