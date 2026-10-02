import { Todo } from '../models/Todo.js';

export class TodoController {
  static async getTodos(req, res) {
    const todos = await Todo.find({
      userId: req.user._id,
      deletedAt: null
    }).sort({ createdAt: -1 });

    return res.status(200).json({ todos });
  }

  static async createTodo(req, res) {
    const { title, priority, dueDate } = req.body;
    const todo = await Todo.create({
      userId: req.user._id,
      title,
      priority: priority || 'normal',
      dueDate: dueDate || ''
    });

    return res.status(201).json({ todo });
  }

  static async updateTodo(req, res) {
    const { id } = req.params;
    const { title, priority, dueDate, status } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (priority !== undefined) updates.priority = priority;
    if (dueDate !== undefined) updates.dueDate = dueDate;
    if (status !== undefined) {
      updates.status = status;
      updates.completedAt = status === 'completed' ? new Date() : null;
    }

    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId: req.user._id, deletedAt: null },
      updates,
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ error: 'To-do item not found' });
    }

    return res.status(200).json({ todo });
  }

  /**
   * DELETE /api/todos/:id
   * Soft-deletes the to-do item, enabling the 10-second undo window.
   */
  static async deleteTodo(req, res) {
    const { id } = req.params;
    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId: req.user._id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ error: 'To-do item not found' });
    }

    return res.status(200).json({
      success: true,
      message: 'To-do moved to undo buffer',
      undoId: todo._id
    });
  }

  /**
   * POST /api/todos/:id/restore
   * Restores a soft-deleted to-do item.
   */
  static async restoreTodo(req, res) {
    const { id } = req.params;
    const todo = await Todo.findOneAndUpdate(
      { _id: id, userId: req.user._id, deletedAt: { $ne: null } },
      { deletedAt: null },
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ error: 'To-do item not found in undo buffer' });
    }

    return res.status(200).json({
      success: true,
      message: 'To-do item restored',
      todo
    });
  }
}
