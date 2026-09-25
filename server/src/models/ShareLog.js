import mongoose from 'mongoose';

const shareLogSchema = new mongoose.Schema(
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
    tier: {
      type: String,
      required: true
    },
    platform: {
      type: String,
      default: 'web_share'
    }
  },
  {
    timestamps: true
  }
);

shareLogSchema.index({ userId: 1, medalId: 1, createdAt: -1 });

export const ShareLog = mongoose.model('ShareLog', shareLogSchema);
