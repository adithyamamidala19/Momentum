import { Router } from 'express';
import { isDatabaseReady } from '../config/database.js';

export const healthRoutes = Router();

// GET /api/health - Liveness probe (server is running)
healthRoutes.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

// GET /api/ready - Readiness probe (checks MongoDB connection)
healthRoutes.get('/ready', (req, res) => {
  const ready = isDatabaseReady();
  if (ready) {
    return res.status(200).json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } else {
    return res.status(503).json({
      status: 'not_ready',
      database: 'disconnected',
      timestamp: new Date().toISOString()
    });
  }
});
