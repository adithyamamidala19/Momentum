import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    targetType: {
      type: String,
      enum: ['profile', 'message', 'bio'],
      required: true
    },
    targetId: {
      type: String,
      default: null
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    reason: {
      type: String,
      enum: ['harassment', 'spam', 'inappropriate', 'impersonation', 'other'],
      required: true
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxLength: 500
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed', 'actioned'],
      default: 'pending'
    }
  },
  {
    timestamps: true
  }
);

reportSchema.index({ targetUserId: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
