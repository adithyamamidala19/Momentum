import { Router } from 'express';
import { z } from 'zod';
import { ModerationController } from '../controllers/moderationController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const moderationRoutes = Router();

const blockSchema = z.object({
  targetUserId: z.string().min(1)
}).strict();

const reportSchema = z.object({
  targetType: z.enum(['profile', 'message', 'bio']),
  targetId: z.string().optional().nullable(),
  targetUserId: z.string().min(1),
  reason: z.enum(['harassment', 'spam', 'inappropriate', 'impersonation', 'other']),
  notes: z.string().max(500).optional()
}).strict();

moderationRoutes.use(requireAuth);

moderationRoutes.post('/block', validateRequest({ bodySchema: blockSchema }), ModerationController.blockUser);
moderationRoutes.post('/unblock', validateRequest({ bodySchema: blockSchema }), ModerationController.unblockUser);
moderationRoutes.get('/blocked', ModerationController.getBlockedUsers);
moderationRoutes.post('/report', validateRequest({ bodySchema: reportSchema }), ModerationController.createReport);
moderationRoutes.get('/admin/reports', ModerationController.getAdminReports);
