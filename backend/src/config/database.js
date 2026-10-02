import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDatabase(uri = env.MONGODB_URI) {
  if (isConnected && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  try {
    const opts = {
      maxPoolSize: 20,
      minPoolSize: 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
      autoIndex: env.NODE_ENV !== 'production'
    };

    mongoose.connection.on('connected', () => {
      isConnected = true;
      logger.info({ msg: '🍃 MongoDB Atlas connection successfully established' });
    });

    mongoose.connection.on('error', (err) => {
      isConnected = false;
      logger.error({ err, msg: '❌ MongoDB connection error' });
    });

    mongoose.connection.on('disconnected', () => {
      isConnected = false;
      logger.warn({ msg: '⚠️ MongoDB disconnected. Attempting reconnection...' });
    });

    await mongoose.connect(uri, opts);
    isConnected = true;
    return mongoose.connection;
  } catch (error) {
    isConnected = false;
    logger.error({ error: error.message, msg: '❌ Failed to connect to MongoDB' });
    // In test or non-production we don't necessarily exit immediately
    if (env.NODE_ENV === 'production') {
      process.exit(1);
    }
    throw error;
  }
}

export function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  if (isConnected || mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info({ msg: '🍃 Disconnected from MongoDB' });
  }
}
