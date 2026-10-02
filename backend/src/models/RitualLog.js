import mongoose from 'mongoose';

const ritualLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    ritualId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ritual',
      required: true,
      index: true
    },
    date: {
      type: String, // YYYY-MM-DD in user's timezone
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['done', 'skipped'],
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index: ONE status per user per ritual per day
ritualLogSchema.index({ userId: 1, ritualId: 1, date: 1 }, { unique: true });
ritualLogSchema.index({ userId: 1, date: 1 });

export const RitualLog = mongoose.model('RitualLog', ritualLogSchema);
