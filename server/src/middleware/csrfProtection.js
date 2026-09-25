import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { isOriginAllowed } from '../utils/originHelper.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function csrfProtection(req, res, next) {
  // Safe read-only methods are exempt
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  // Exempt auth bootstrap session route since user doesn't have a session yet
  if (req.path === '/api/auth/session') {
    return next();
  }

  const origin = req.headers['origin'];
  const referer = req.headers['referer'];

  // Origin check
  if (origin) {
    if (!isOriginAllowed(origin)) {
      logger.warn({ msg: 'CSRF Origin check failed', origin });
      return res.status(403).json({ error: 'Forbidden: Origin validation failed' });
    }
  } else if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      if (!isOriginAllowed(refererOrigin)) {
        logger.warn({ msg: 'CSRF Referer check failed', refererOrigin });
        return res.status(403).json({ error: 'Forbidden: Referer validation failed' });
      }
    } catch {
      return res.status(403).json({ error: 'Forbidden: Malformed referer header' });
    }
  } else if (env.NODE_ENV === 'production') {
    // In production, state-changing requests with cookie auth must provide Origin or Referer
    return res.status(403).json({ error: 'Forbidden: Missing Origin or Referer header' });
  }

  // Double-submit CSRF token validation if header present
  const csrfHeader = req.headers['x-csrf-token'];
  const csrfCookie = req.cookies?.['csrf-token'];
  if (csrfCookie && csrfHeader && csrfCookie !== csrfHeader) {
    return res.status(403).json({ error: 'Forbidden: CSRF token mismatch' });
  }

  next();
}
