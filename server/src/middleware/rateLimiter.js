import rateLimit from 'express-rate-limit';

// Global API rate limit: 300 requests per 15 minutes
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

// Stricter Auth Rate Limiter: 30 requests per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please try again in a few minutes.' }
});

// Stricter Meal Photo Scan Rate Limiter: 10 uploads per 10 minutes
export const scanLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Meal scan rate limit exceeded. Please wait 10 minutes before scanning another meal.' }
});

// Stricter Voice / Aria Assistant Rate Limiter: 40 messages per 5 minutes
export const ariaLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Aria assistant rate limit exceeded. Please pause for a moment to reflect.' }
});
