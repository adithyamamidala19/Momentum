import mongoose from 'mongoose';

const todoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high'],
      default: 'normal'
    },
    dueDate: {
      type: String, // YYYY-MM-DD
      default: ''
    },
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending',
      index: true
    },
    completedAt: {
      type: Date,
      default: null
    },
    deletedAt: {
      type: Date,
      default: null,
      index: true // Supports soft-delete for the 10-second undo window
    }
  },
  {
    timestamps: true
  }
);

todoSchema.index({ userId: 1, deletedAt: 1, status: 1 });

export const Todo = mongoose.model('Todo', todoSchema);
