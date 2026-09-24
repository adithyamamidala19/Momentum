import mongoose from 'mongoose';

const focusSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    plannedMin: {
      type: Number,
      required: true,
      min: 1
    },
    actualMin: {
      type: Number,
      required: true,
      min: 0
    },
    intention: {
      type: String,
      trim: true,
      default: 'Deep mindful focus'
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    },
    completed: {
      type: Boolean,
      default: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

focusSessionSchema.index({ userId: 1, date: 1, startedAt: -1 });

export const FocusSession = mongoose.model('FocusSession', focusSessionSchema);
