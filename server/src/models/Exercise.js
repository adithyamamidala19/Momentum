import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null means global default catalog
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    muscleGroup: {
      type: String,
      enum: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full-body', 'cardio'],
      default: 'full-body'
    },
    isCustom: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

exerciseSchema.index({ userId: 1, name: 1 });

export const Exercise = mongoose.model('Exercise', exerciseSchema);
