import mongoose from 'mongoose';

const ritualSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      enum: ['Mind', 'Health', 'Focus', 'Body', 'Rest'],
      default: 'Health'
    },
    anchor: {
      type: String,
      trim: true,
      default: ''
    },
    time: {
      type: String,
      trim: true,
      default: '08:00'
    },
    schedule: {
      type: [String],
      default: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    },
    archived: {
      type: Boolean,
      default: false,
      index: true
    },
    order: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

ritualSchema.index({ userId: 1, archived: 1, order: 1 });

export const Ritual = mongoose.model('Ritual', ritualSchema);
