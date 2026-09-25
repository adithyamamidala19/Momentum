import http from 'http';
import { app } from './app.js';
import { env } from './src/config/env.js';
import { connectDatabase } from './src/config/database.js';
import { initFirebase } from './src/config/firebase.js';
import { initSocketIO } from './src/socket/chatSocket.js';
import { logger } from './src/utils/logger.js';

async function bootstrap() {
  try {
    // 1. Initialize Firebase Admin
    initFirebase();

    // 2. Connect to MongoDB Atlas
    await connectDatabase().catch((err) => {
      logger.warn({ msg: 'Database connection deferred until MongoDB Atlas is available or local replica is online', err: err.message });
    });

    // 3. Create HTTP server & bind Socket.io
    const httpServer = http.createServer(app);
    initSocketIO(httpServer);

    // 4. Start HTTP & WebSocket server
    const server = httpServer.listen(env.PORT, () => {
      logger.info({
        msg: `🌿 Momentum API + Socket.io Server running in ${env.NODE_ENV} mode`,
        port: env.PORT,
        healthCheck: `http://localhost:${env.PORT}/api/health`,
        readyCheck: `http://localhost:${env.PORT}/api/ready`
      });
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      logger.info({ msg: `Received ${signal}. Gracefully closing Momentum API server...` });
      server.close(() => {
        logger.info({ msg: 'HTTP server closed. Exiting process.' });
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    logger.error({ msg: '❌ Critical error during server bootstrap', err: error.message });
    process.exit(1);
  }
}

bootstrap();
