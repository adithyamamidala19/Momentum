import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export function errorHandler(err, req, res, next) {
  const statusCode = err.status || err.statusCode || 500;
  const isProd = env.NODE_ENV === 'production';

  logger.error({
    msg: 'Unhandled Request Error',
    requestId: req.id,
    path: req.originalUrl,
    method: req.method,
    statusCode,
    error: err.message,
    stack: isProd ? undefined : err.stack
  });

  // Safe client response
  const response = {
    error: isProd && statusCode === 500
      ? 'An unexpected error occurred. Our sanctuary guardians have been notified.'
      : err.message || 'Internal Server Error'
  };

  if (!isProd && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
