import { AiScanService } from '../services/aiScanService.js';
import { logger } from '../utils/logger.js';

export class ScanController {
  /**
   * POST /api/scan/photo
   * Accepts image file in memory, verifies format, strips EXIF, calls Gemini Vision.
   */
  static async scanMealPhoto(req, res) {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ error: 'No image file uploaded. Please select an image.' });
    }

    try {
      const result = await AiScanService.analyzeMealPhoto(req.file.buffer, req.file.mimetype);
      return res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      logger.error({ msg: 'Meal photo scan controller failed', err: error.message });
      return res.status(422).json({
        error: error.message || 'Failed to process meal photo'
      });
    }
  }
}
