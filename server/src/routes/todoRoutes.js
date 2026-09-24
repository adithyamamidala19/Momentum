import { Router } from 'express';
import { z } from 'zod';
import { TodoController } from '../controllers/todoController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const todoRoutes = Router();

const createTodoSchema = z.object({
  title: z.string().min(1).max(200),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  dueDate: z.string().optional()
}).strict();

const updateTodoSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  dueDate: z.string().optional(),
  status: z.enum(['pending', 'completed']).optional()
}).strict();

todoRoutes.use(requireAuth);

todoRoutes.get('/', TodoController.getTodos);
todoRoutes.post('/', validateRequest({ bodySchema: createTodoSchema }), TodoController.createTodo);
todoRoutes.put('/:id', validateRequest({ bodySchema: updateTodoSchema }), TodoController.updateTodo);
todoRoutes.delete('/:id', TodoController.deleteTodo);
todoRoutes.post('/:id/restore', TodoController.restoreTodo);
