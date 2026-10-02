import mongoose from 'mongoose';

const medalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    medalId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum', 'emerald'],
      default: 'bronze'
    },
    earnedDate: {
      type: String, // YYYY-MM-DD
      required: true
    },
    verificationCode: {
      type: String,
      unique: true,
      sparse: true
    },
    sharedCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

medalSchema.index({ userId: 1, medalId: 1 }, { unique: true });

export const Medal = mongoose.model('Medal', medalSchema);
