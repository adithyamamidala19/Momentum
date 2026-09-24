import mongoose from 'mongoose';

const hydrationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amountMl: {
      type: Number,
      required: true,
      min: 1
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    loggedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

hydrationLogSchema.index({ userId: 1, date: 1, loggedAt: -1 });

export const HydrationLog = mongoose.model('HydrationLog', hydrationLogSchema);
