import mongoose from 'mongoose';

const cardioLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    activityType: {
      type: String,
      trim: true,
      default: 'Running'
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1
    },
    distanceKm: {
      type: Number,
      default: 0
    },
    caloriesBurned: {
      type: Number,
      default: 0
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

cardioLogSchema.index({ userId: 1, date: 1, timestamp: -1 });

export const CardioLog = mongoose.model('CardioLog', cardioLogSchema);
