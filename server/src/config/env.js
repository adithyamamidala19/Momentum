import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/momentum'),
  CLIENT_ORIGIN: z.string().default('http://localhost:3000,http://localhost:3001,http://localhost:5173'),
  FIREBASE_PROJECT_ID: z.string().default('momentum-mindful-sanctuary'),
  FIREBASE_CLIENT_EMAIL: z.string().email('FIREBASE_CLIENT_EMAIL must be a valid service account email').optional().or(z.literal('')),
  FIREBASE_PRIVATE_KEY: z.string().optional().or(z.literal('')),
  SESSION_COOKIE_NAME: z.string().default('__session'),
  SESSION_MAX_AGE_DAYS: z.string().default('14').transform((val) => parseInt(val, 10)),
  COOKIE_DOMAIN: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  SENTRY_DSN: z.string().optional().default('')
});

// Production validation refinement
const refinedEnvSchema = envSchema.superRefine((data, ctx) => {
  if (data.NODE_ENV === 'production') {
    if (!data.FIREBASE_CLIENT_EMAIL) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FIREBASE_CLIENT_EMAIL is strictly required in production',
        path: ['FIREBASE_CLIENT_EMAIL']
      });
    }
    if (!data.FIREBASE_PRIVATE_KEY) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'FIREBASE_PRIVATE_KEY is strictly required in production',
        path: ['FIREBASE_PRIVATE_KEY']
      });
    }
    if (!data.MONGODB_URI.startsWith('mongodb+srv://') && !data.MONGODB_URI.startsWith('mongodb://')) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'MONGODB_URI must be a valid MongoDB connection string',
        path: ['MONGODB_URI']
      });
    }
  }
});

let parsedEnv;
try {
  parsedEnv = refinedEnvSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Critical Environment Configuration Error:');
    error.errors.forEach((err) => {
      console.error(`  - [${err.path.join('.')}]: ${err.message}`);
    });
    // In production or test, fail immediately
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
  // Fallback defaults for dev when env variables haven't been pasted yet
  parsedEnv = {
    NODE_ENV: process.env.NODE_ENV || 'development',
    PORT: parseInt(process.env.PORT || '5000', 10),
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/momentum_dev',
    CLIENT_ORIGIN: process.env.CLIENT_ORIGIN || 'http://localhost:3000,http://localhost:3001,http://localhost:5173',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'momentum-dev',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || '',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || '',
    SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME || '__session',
    SESSION_MAX_AGE_DAYS: parseInt(process.env.SESSION_MAX_AGE_DAYS || '14', 10),
    COOKIE_DOMAIN: process.env.COOKIE_DOMAIN || '',
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
    SENTRY_DSN: process.env.SENTRY_DSN || ''
  };
}

export const env = {
  ...parsedEnv,
  // Helper to format private key properly handling escaped newlines
  getFormattedPrivateKey() {
    if (!parsedEnv.FIREBASE_PRIVATE_KEY) return '';
    return parsedEnv.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
  },
  // Parsed array of allowed origins for CORS
  getAllowedOrigins() {
    return parsedEnv.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean);
  }
};
