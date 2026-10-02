import { Workout } from '../models/Workout.js';
import { Exercise } from '../models/Exercise.js';
import { PersonalRecord } from '../models/PersonalRecord.js';
import { MetricsService } from '../services/metricsService.js';
import { getLocalDateString } from '../utils/timezone.js';

const STANDARD_GLOBAL_EXERCISES = [
  { name: 'Bench Press', muscleGroup: 'chest', isCustom: false },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest', isCustom: false },
  { name: 'Push-ups', muscleGroup: 'chest', isCustom: false },
  { name: 'Dips', muscleGroup: 'chest', isCustom: false },
  { name: 'Barbell Squat', muscleGroup: 'legs', isCustom: false },
  { name: 'Leg Press', muscleGroup: 'legs', isCustom: false },
  { name: 'Romanian Deadlift', muscleGroup: 'legs', isCustom: false },
  { name: 'Bulgarian Split Squat', muscleGroup: 'legs', isCustom: false },
  { name: 'Deadlift', muscleGroup: 'back', isCustom: false },
  { name: 'Barbell Row', muscleGroup: 'back', isCustom: false },
  { name: 'Lat Pulldown', muscleGroup: 'back', isCustom: false },
  { name: 'Pull-ups', muscleGroup: 'back', isCustom: false },
  { name: 'Overhead Press', muscleGroup: 'shoulders', isCustom: false },
  { name: 'Dumbbell Lateral Raise', muscleGroup: 'shoulders', isCustom: false },
  { name: 'Face Pull', muscleGroup: 'shoulders', isCustom: false },
  { name: 'Bicep Curl', muscleGroup: 'arms', isCustom: false },
  { name: 'Hammer Curl', muscleGroup: 'arms', isCustom: false },
  { name: 'Tricep Pushdown', muscleGroup: 'arms', isCustom: false },
  { name: 'Plank', muscleGroup: 'core', isCustom: false },
  { name: 'Cable Crunch', muscleGroup: 'core', isCustom: false },
  { name: 'Clean & Press', muscleGroup: 'full-body', isCustom: false }
];

export class WorkoutController {
  static async getWorkouts(req, res) {
    const workouts = await Workout.find({ userId: req.user._id }).sort({ timestamp: -1 }).limit(50);
    return res.status(200).json({ workouts });
  }

  static async logWorkout(req, res) {
    const { workoutName, muscleGroup, sets, pacing, feel, mode } = req.body;
    const today = getLocalDateString(new Date(), req.user.timezone);

    // 1. Process sets and check for PRs (strictly scoped to current user)
    let existingPR = await PersonalRecord.findOne({
      userId: req.user._id,
      exerciseName: workoutName
    });

    const processedSets = (sets || []).map((s, idx) => {
      let isPR = false;
      const weight = Number(s.weightKg) || 0;
      const reps = Number(s.reps) || 1;

      if (!existingPR || weight > existingPR.weightKg || (weight === existingPR.weightKg && reps > existingPR.reps)) {
        isPR = true;
        existingPR = {
          userId: req.user._id,
          exerciseName: workoutName,
          weightKg: weight,
          reps,
          achievedAt: new Date(),
          date: today
        };
      }

      return {
        setNumber: idx + 1,
        weightKg: weight,
        reps,
        isPR
      };
    });

    // Update PR in database if found
    if (existingPR && processedSets.some((s) => s.isPR)) {
      await PersonalRecord.findOneAndUpdate(
        { userId: req.user._id, exerciseName: workoutName },
        existingPR,
        { upsert: true }
      );
    }

    const maxWeight = Math.max(...processedSets.map((s) => s.weightKg), 0);
    const maxReps = Math.max(...processedSets.map((s) => s.reps), 10);

    const workout = await Workout.create({
      userId: req.user._id,
      workoutName,
      muscleGroup: muscleGroup || 'full-body',
      sets: processedSets,
      setsCount: processedSets.length,
      reps: maxReps,
      weightKg: maxWeight,
      pacing: pacing || 'Moderate',
      feel: feel || 'Comfortable',
      mode: mode || 'strength',
      date: today,
      timestamp: new Date()
    });

    MetricsService.updateWeeklyScore(req.user).catch(() => {});

    return res.status(201).json({
      success: true,
      workout,
      newPR: processedSets.some((s) => s.isPR)
    });
  }

  static async getRepeatLast(req, res) {
    const { exerciseName } = req.query;
    const query = { userId: req.user._id };
    if (exerciseName) query.workoutName = exerciseName;

    const lastWorkout = await Workout.findOne(query).sort({ timestamp: -1 });
    return res.status(200).json({ lastWorkout });
  }

  static async getExercises(req, res) {
    const dbExercises = await Exercise.find({
      $or: [{ userId: req.user._id }, { userId: null }]
    }).sort({ name: 1 });

    const sourceList = dbExercises.length > 0 ? dbExercises : STANDARD_GLOBAL_EXERCISES;

    // Strictly fetch personal records owned by this user
    const prs = await PersonalRecord.find({ userId: req.user._id });
    const prMap = new Map();
    prs.forEach((pr) => prMap.set(pr.exerciseName.toLowerCase(), pr));

    const enriched = sourceList.map((ex) => ({
      id: ex._id || `default-${ex.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      isCustom: Boolean(ex.isCustom),
      personalBest: prMap.get(ex.name.toLowerCase()) || null
    }));

    return res.status(200).json({ exercises: enriched });
  }

  static async createExercise(req, res) {
    const { name, muscleGroup } = req.body;
    const exercise = await Exercise.create({
      userId: req.user._id,
      name,
      muscleGroup: muscleGroup || 'full-body',
      isCustom: true
    });

    return res.status(201).json({ exercise });
  }

  static async getPRs(req, res) {
    const prs = await PersonalRecord.find({ userId: req.user._id }).sort({ achievedAt: -1 });
    return res.status(200).json({ prs });
  }
}
