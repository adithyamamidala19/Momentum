import mongoose from 'mongoose';

const setSchema = new mongoose.Schema(
  {
    setNumber: { type: Number, required: true },
    weightKg: { type: Number, required: true, min: 0 },
    reps: { type: Number, required: true, min: 1 },
    isPR: { type: Boolean, default: false }
  },
  { _id: false }
);

const workoutSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    workoutName: {
      type: String,
      required: true,
      trim: true
    },
    muscleGroup: {
      type: String,
      enum: ['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full-body', 'cardio'],
      default: 'full-body'
    },
    sets: [setSchema],
    setsCount: {
      type: Number,
      default: 1
    },
    reps: {
      type: Number,
      default: 10
    },
    weightKg: {
      type: Number,
      default: 0
    },
    pacing: {
      type: String,
      enum: ['Slow', 'Moderate', 'Fast'],
      default: 'Moderate'
    },
    feel: {
      type: String,
      enum: ['Easy', 'Comfortable', 'Challenging', 'Hard'],
      default: 'Comfortable'
    },
    mode: {
      type: String,
      enum: ['strength', 'cardio', 'mobility'],
      default: 'strength'
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

workoutSchema.index({ userId: 1, date: 1, timestamp: -1 });

export const Workout = mongoose.model('Workout', workoutSchema);
