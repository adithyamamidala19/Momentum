import { env } from '../config/env.js';

/**
 * Validates whether a given origin or referer is permitted.
 * Automatically accepts:
 * - Missing origin (e.g. server-to-server, curl, mobile apps)
 * - Localhost and 127.0.0.1 (any port)
 * - Any Render deployment (*.onrender.com)
 * - Origins specified in CLIENT_ORIGIN environment variable
 * - Wildcard '*'
 */
export function isOriginAllowed(origin) {
  if (!origin) return true;
  
  const isLocalDev = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  if (isLocalDev) return true;

  const isRender = /^https:\/\/[a-zA-Z0-9-]+\.onrender\.com$/.test(origin);
  if (isRender) return true;

  const allowedOrigins = env.getAllowedOrigins();
  if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
    return true;
  }

  return false;
}
