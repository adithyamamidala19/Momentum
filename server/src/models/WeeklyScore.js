import mongoose from 'mongoose';

const weeklyScoreSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    weekId: {
      type: String, // e.g. "2026-W39"
      required: true,
      index: true
    },
    nickname: {
      type: String,
      trim: true,
      required: true
    },
    avatar: {
      type: String,
      default: '🌱'
    },
    practicePoints: {
      type: Number,
      default: 0
    },
    adherenceAvg: {
      type: Number,
      default: 0
    },
    focusMinutes: {
      type: Number,
      default: 0
    },
    weeklyScore: {
      type: Number,
      default: 0,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// One score per user per week
weeklyScoreSchema.index({ userId: 1, weekId: 1 }, { unique: true });
// For leaderboard ranking aggregation
weeklyScoreSchema.index({ weekId: 1, weeklyScore: -1 });

export const WeeklyScore = mongoose.model('WeeklyScore', weeklyScoreSchema);
