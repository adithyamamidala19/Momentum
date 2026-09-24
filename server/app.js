import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { env } from './src/config/env.js';
import { securityHeaders } from './src/middleware/securityHeaders.js';
import { requestLogger } from './src/middleware/requestLogger.js';
import { csrfProtection } from './src/middleware/csrfProtection.js';
import { globalLimiter } from './src/middleware/rateLimiter.js';
import { errorHandler } from './src/middleware/errorHandler.js';

// Route imports
import { healthRoutes } from './src/routes/healthRoutes.js';
import { authRoutes } from './src/routes/authRoutes.js';
import { profileRoutes } from './src/routes/profileRoutes.js';
import { todayRoutes } from './src/routes/todayRoutes.js';
import { ritualRoutes } from './src/routes/ritualRoutes.js';
import { todoRoutes } from './src/routes/todoRoutes.js';
import { hydrationRoutes } from './src/routes/hydrationRoutes.js';
import { proteinRoutes } from './src/routes/proteinRoutes.js';
import { focusRoutes } from './src/routes/focusRoutes.js';
import { workoutRoutes } from './src/routes/workoutRoutes.js';
import { insightsRoutes } from './src/routes/insightsRoutes.js';
import { milestoneRoutes } from './src/routes/milestoneRoutes.js';
import { challengeRoutes } from './src/routes/challengeRoutes.js';
import { scanRoutes } from './src/routes/scanRoutes.js';
import { ariaRoutes } from './src/routes/ariaRoutes.js';

export const app = express();

// Trust reverse proxy (for Render/Railway/Cloud Run/Vercel)
app.set('trust proxy', 1);

// Security headers (Helmet + Cache-Control: no-store + strict CSP)
app.use(securityHeaders);

// CORS configuration with credentials support
const allowedOrigins = env.getAllowedOrigins();
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id']
  })
);

// Body parsing with safe size limits
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Prevent NoSQL injection by sanitizing query and body keys ($ and .)
app.use(mongoSanitize());

// Structured logging with Request IDs
app.use(requestLogger);

// CSRF Origin/Referer and double-submit validation
app.use(csrfProtection);

// Global API rate limiter
app.use('/api', globalLimiter);

// Mount API routes
app.use('/api', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/today', todayRoutes);
app.use('/api/rituals', ritualRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/hydration', hydrationRoutes);
app.use('/api/protein', proteinRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/challenge', challengeRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/aria', ariaRoutes);

// Catch-all 404 for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Sanctuary path not found: ${req.originalUrl}` });
});

// Central error handler
app.use(errorHandler);
