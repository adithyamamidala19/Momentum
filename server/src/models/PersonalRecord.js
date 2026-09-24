import mongoose from 'mongoose';

const personalRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    exerciseName: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    weightKg: {
      type: Number,
      required: true,
      min: 0
    },
    reps: {
      type: Number,
      required: true,
      min: 1
    },
    achievedAt: {
      type: Date,
      default: Date.now
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    }
  },
  {
    timestamps: true
  }
);

personalRecordSchema.index({ userId: 1, exerciseName: 1 }, { unique: true });

export const PersonalRecord = mongoose.model('PersonalRecord', personalRecordSchema);
