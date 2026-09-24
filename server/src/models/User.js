import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    displayName: {
      type: String,
      trim: true,
      default: 'Mindful Practitioner'
    },
    photoURL: {
      type: String,
      default: ''
    },
    mantra: {
      type: String,
      trim: true,
      default: 'Slow is smooth, smooth is fast.'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    units: {
      weight: { type: String, enum: ['kg', 'lb'], default: 'kg' },
      volume: { type: String, enum: ['ml', 'oz'], default: 'ml' }
    },
    goals: {
      waterMl: { type: Number, default: 2000, min: 250, max: 10000 },
      proteinG: { type: Number, default: 90, min: 10, max: 500 },
      focusMin: { type: Number, default: 25, min: 5, max: 480 }
    },
    challenge: {
      optedIn: { type: Boolean, default: false },
      nickname: { type: String, trim: true, default: '' },
      avatar: { type: String, default: '🌱' }
    },
    notificationPrefs: {
      quietStart: { type: String, default: '21:30' },
      quietEnd: { type: String, default: '07:30' },
      dailyNudgeLimit: { type: Number, default: 3 }
    },
    theme: {
      type: String,
      enum: ['cream', 'dark', 'system'],
      default: 'cream'
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model('User', userSchema);
