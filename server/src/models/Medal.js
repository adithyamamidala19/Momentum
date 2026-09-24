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
      required: true,
      enum: ['streak-3', 'streak-7', 'streak-14', 'streak-30', 'streak-60', 'streak-100', 'focus-100', 'iron-ritual', 'first-workout']
    },
    title: {
      type: String,
      required: true
    },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'emerald'],
      default: 'bronze'
    },
    earnedDate: {
      type: String, // YYYY-MM-DD
      required: true
    }
  },
  {
    timestamps: true
  }
);

medalSchema.index({ userId: 1, medalId: 1 }, { unique: true });

export const Medal = mongoose.model('Medal', medalSchema);
