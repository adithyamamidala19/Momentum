import { Router } from 'express';
import multer from 'multer';
import { ScanController } from '../controllers/scanController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { scanLimiter } from '../middleware/rateLimiter.js';

export const scanRoutes = Router();

// Configure Multer for in-memory upload (no disk persistence)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB maximum
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are permitted'));
    }
  }
});

scanRoutes.use(requireAuth);
scanRoutes.use(scanLimiter);

scanRoutes.post('/photo', upload.single('image'), ScanController.scanMealPhoto);
