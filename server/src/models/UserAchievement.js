import mongoose from 'mongoose';

const userAchievementSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    achievementDefinitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AchievementDefinition',
      required: true
    },
    achievementKey: {
      type: String,
      required: true,
      index: true
    },
    periodType: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: true
    },
    periodKey: {
      type: String,
      required: true,
      index: true // e.g. "2026-W39", "2026-09"
    },
    periodStart: {
      type: String,
      required: true // "YYYY-MM-DD"
    },
    periodEnd: {
      type: String,
      required: true // "YYYY-MM-DD"
    },
    currentProgress: {
      type: Number,
      default: 0
    },
    targetValue: {
      type: Number,
      required: true
    },
    progressPct: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    completed: {
      type: Boolean,
      default: false,
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    },
    pointsAwarded: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

// Compound index to guarantee one record per user per achievement per period
userAchievementSchema.index({ userId: 1, achievementKey: 1, periodKey: 1 }, { unique: true });

export const UserAchievement = mongoose.model('UserAchievement', userAchievementSchema);
