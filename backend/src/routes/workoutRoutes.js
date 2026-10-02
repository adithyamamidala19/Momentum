import { Router } from 'express';
import { z } from 'zod';
import { WorkoutController } from '../controllers/workoutController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validateRequest } from '../middleware/validateRequest.js';

export const workoutRoutes = Router();

const logWorkoutSchema = z.object({
  workoutName: z.string().min(1).max(100),
  muscleGroup: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full-body', 'cardio']).optional(),
  sets: z.array(
    z.object({
      weightKg: z.number().min(0).max(1000),
      reps: z.number().int().min(1).max(500)
    })
  ).min(1),
  pacing: z.enum(['Slow', 'Moderate', 'Fast']).optional(),
  feel: z.enum(['Easy', 'Comfortable', 'Challenging', 'Hard']).optional(),
  mode: z.enum(['strength', 'cardio', 'mobility']).optional()
}).strict();

const createExerciseSchema = z.object({
  name: z.string().min(1).max(100),
  muscleGroup: z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full-body', 'cardio']).optional()
}).strict();

workoutRoutes.use(requireAuth);

workoutRoutes.get('/', WorkoutController.getWorkouts);
workoutRoutes.post('/', validateRequest({ bodySchema: logWorkoutSchema }), WorkoutController.logWorkout);
workoutRoutes.get('/repeat-last', WorkoutController.getRepeatLast);
workoutRoutes.get('/exercises', WorkoutController.getExercises);
workoutRoutes.post('/exercises', validateRequest({ bodySchema: createExerciseSchema }), WorkoutController.createExercise);
workoutRoutes.get('/prs', WorkoutController.getPRs);
