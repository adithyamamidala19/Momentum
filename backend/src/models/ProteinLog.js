import mongoose from 'mongoose';

const proteinLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    grams: {
      type: Number,
      required: true,
      min: 1
    },
    label: {
      type: String,
      trim: true,
      default: 'Protein portion'
    },
    source: {
      type: String,
      enum: ['manual', 'scan'],
      default: 'manual'
    },
    calories: {
      type: Number,
      default: 0
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true
    },
    loggedAt: {
      type: Date,
      default: Date.now
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true // Supports 10s undo window
    }
  },
  {
    timestamps: true
  }
);

proteinLogSchema.index({ userId: 1, date: 1, deletedAt: 1, loggedAt: -1 });

export const ProteinLog = mongoose.model('ProteinLog', proteinLogSchema);
