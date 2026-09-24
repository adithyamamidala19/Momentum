import mongoose from 'mongoose';

const ariaMessageSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['user', 'aria', 'system'],
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true
    },
    action: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    undoToken: {
      type: String,
      default: null,
      index: true
    },
    undoExpired: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

ariaMessageSchema.index({ userId: 1, createdAt: -1 });

export const AriaMessage = mongoose.model('AriaMessage', ariaMessageSchema);
