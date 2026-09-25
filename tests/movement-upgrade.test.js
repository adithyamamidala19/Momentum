import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeMovementLogs,
  DEFAULT_EXERCISE_LIBRARY,
  DEFAULT_MOVEMENTS,
  DEFAULT_CARDIO_LOGS,
  DEFAULT_CALORIE_LOGS
} from '../js/storage.js';
import { 
  userState, 
  checkAndUpdatePR, 
  getExerciseLibrary, 
  addOrUpdateExerciseInLibrary, 
  getLatestWorkoutSession, 
  logCardioSession, 
  deleteCardioLog, 
  logCalorieIntake, 
  deleteCalorieLog, 
  calculateDynamicMetrics 
} from '../js/state.js';
import { MomentumAssistant } from '../js/services/assistant.js';
import { matchIntent } from '../js/services/intent-registry.js';

test('1. Schema Migration & Normalization of Legacy Movement Logs', () => {
  const legacyLogs = [
    {
      id: 'legacy-1',
      workoutName: 'Bench Press',
      setsCount: 3,
      reps: 10,
      weightKg: 50,
      sets: [
        { set: 1, reps: 10, weight: 45 },
        { set: 2, reps: 10, weight: 50 },
        { set: 3, reps: 8, weight: 55 }
      ],
      pacing: 'Moderate',
      feel: 'Challenging'
    }
  ];

  const normalized = normalizeMovementLogs(legacyLogs);
  assert.equal(normalized.length, 1);
  const entry = normalized[0];

  assert.equal(entry.workoutName, 'Bench Press');
  assert.equal(entry.muscleGroup, 'chest'); // Inferred from default exercise library
  assert.equal(entry.sets.length, 3);
  assert.deepEqual(entry.sets[0], { setNumber: 1, weightKg: 45, reps: 10, isPR: false });
  assert.deepEqual(entry.sets[2], { setNumber: 3, weightKg: 55, reps: 8, isPR: false });
  
  // Heaviest roll-up calculation
  assert.equal(entry.weightKg, 55);
  assert.equal(entry.reps, 8);
  assert.equal(entry.setsCount, 3);
  assert.ok(entry.sessionId.startsWith('session-'));
});

test('2. Personal Records (PR) Auto-Detection and Library Sync', () => {
  // Reset exercise library for testing
  userState.exerciseLibrary = JSON.parse(JSON.stringify(DEFAULT_EXERCISE_LIBRARY));

  const exName = 'Bench Press';
  const ex = userState.exerciseLibrary.find(e => e.name === exName);
  ex.personalBest = { weightKg: 65, reps: 8, date: '2026-09-20' };

  // Lower weight is not a PR
  const prResult1 = checkAndUpdatePR(exName, 60, 10);
  assert.equal(prResult1, false);
  assert.equal(ex.personalBest.weightKg, 65);

  // Same weight with fewer reps is not a PR
  const prResult2 = checkAndUpdatePR(exName, 65, 6);
  assert.equal(prResult2, false);
  assert.equal(ex.personalBest.weightKg, 65);

  // Higher weight is a PR
  const prResult3 = checkAndUpdatePR(exName, 70, 5);
  assert.equal(prResult3, true);
  assert.equal(ex.personalBest.weightKg, 70);
  assert.equal(ex.personalBest.reps, 5);

  // Same weight with more reps is a PR
  const prResult4 = checkAndUpdatePR(exName, 70, 8);
  assert.equal(prResult4, true);
  assert.equal(ex.personalBest.weightKg, 70);
  assert.equal(ex.personalBest.reps, 8);
});

test('3. Repeat Last Workout Session Extraction', () => {
  userState.movementLogs = [
    {
      id: 'move-new-1',
      date: '2026-09-22',
      workoutName: 'Barbell Squat',
      muscleGroup: 'legs',
      sets: [
        { setNumber: 1, weightKg: 90, reps: 8, isPR: false },
        { setNumber: 2, weightKg: 95, reps: 6, isPR: false }
      ],
      setsCount: 2,
      reps: 6,
      weightKg: 95,
      sessionId: 'session-legs-101',
      timestamp: 2000
    },
    {
      id: 'move-new-2',
      date: '2026-09-22',
      workoutName: 'Leg Press',
      muscleGroup: 'legs',
      sets: [
        { setNumber: 1, weightKg: 160, reps: 10, isPR: false }
      ],
      setsCount: 1,
      reps: 10,
      weightKg: 160,
      sessionId: 'session-legs-101',
      timestamp: 2001
    }
  ];

  const lastSession = getLatestWorkoutSession();
  assert.ok(lastSession);
  assert.equal(lastSession.sessionId, 'session-legs-101');
  assert.equal(lastSession.exercises.length, 2);
  assert.equal(lastSession.exercises[0].workoutName, 'Barbell Squat');
  assert.equal(lastSession.exercises[1].workoutName, 'Leg Press');
  assert.ok(lastSession.sessionTitle.includes('Legs Day'));
});

test('4. Cardio Flow & Calorie Intake Logging', () => {
  userState.cardioLogs = [];
  userState.calorieIntakeLogs = [];

  // Log cardio
  const cardio = logCardioSession({ activity: 'Treadmill', durationMin: 45, caloriesBurned: 350 });
  assert.equal(userState.cardioLogs.length, 1);
  assert.equal(cardio.durationMin, 45);
  assert.equal(cardio.caloriesBurned, 350);

  // Log calories eaten
  const food = logCalorieIntake({ item: 'Protein shake and banana', calories: 420, time: '15:00' });
  assert.equal(userState.calorieIntakeLogs.length, 1);
  assert.equal(food.item, 'Protein shake and banana');
  assert.equal(food.calories, 420);

  // Deletion
  deleteCardioLog(cardio.id);
  assert.equal(userState.cardioLogs.length, 0);

  deleteCalorieLog(food.id);
  assert.equal(userState.calorieIntakeLogs.length, 0);
});

test('5. Scoring Formula Integrity (Zero Double Counting)', () => {
  userState.customHabits = [{ id: 'h1', completed: true }];
  userState.todayFocusMinutes = 25;
  userState.waterGlasses = 8;
  userState.streakDays = 12;
  userState.movementLogs = [
    {
      id: 'm1',
      workoutName: 'Bench Press',
      sets: [{ setNumber: 1 }, { setNumber: 2 }, { setNumber: 3 }] // 3 sets
    },
    {
      id: 'm2',
      workoutName: 'Incline Press',
      sets: [{ setNumber: 1 }, { setNumber: 2 }] // 2 sets
    }
  ];

  const metrics = calculateDynamicMetrics(userState);
  // workoutCount should be 2 (number of workout items), not 5 (number of sets)
  assert.equal(metrics.workoutCount, 2);
});

test('6. Grounded AI Assistant Query Responses for Movement, PRs, and Nutrition', () => {
  userState.movementLogs = [
    {
      id: 'm-test',
      workoutName: 'Overhead Press',
      weightKg: 50,
      reps: 6,
      pacing: 'Moderate',
      feel: 'Challenging',
      sets: [
        { setNumber: 1, weightKg: 45, reps: 8, isPR: false },
        { setNumber: 2, weightKg: 50, reps: 6, isPR: true }
      ]
    }
  ];

  userState.exerciseLibrary = [
    {
      name: 'Overhead Press',
      muscleGroup: 'shoulders',
      personalBest: { weightKg: 50, reps: 6, date: '2026-09-22' }
    }
  ];

  userState.cardioLogs = [
    {
      date: new Date().toISOString().slice(0, 10),
      activity: 'Rowing',
      durationMin: 20,
      caloriesBurned: 180
    }
  ];

  userState.calorieIntakeLogs = [
    {
      date: new Date().toISOString().slice(0, 10),
      item: 'Salmon Salad',
      calories: 550,
      time: '12:30'
    }
  ];

  // Query sets detail
  const setsAns = MomentumAssistant.generateResponse('Show my latest workout sets');
  assert.ok(setsAns.includes('Overhead Press'));
  assert.ok(setsAns.includes('Set 1: **45 KG** × **8 reps**'));
  assert.ok(setsAns.includes('Set 2: **50 KG** × **6 reps**'));

  // Query PR
  const prAns = MomentumAssistant.generateResponse('What is my Overhead Press PR?');
  assert.ok(prAns.includes('50 KG for 6 reps'));

  // Query Cardio
  const cardioAns = MomentumAssistant.generateResponse('How much cardio did I do today?');
  assert.ok(cardioAns.includes('Rowing'));
  assert.ok(cardioAns.includes('20 minutes'));
  assert.ok(cardioAns.includes('180 kcal'));

  // Query Calories
  const foodAns = MomentumAssistant.generateResponse('What food did I log today?');
  assert.ok(foodAns.includes('Salmon Salad'));
  assert.ok(foodAns.includes('550 kcal'));
});

test('7. Aria Voice Intent Pattern Matching for Movement Upgrades', () => {
  // Strength logging voice match
  const match1 = matchIntent('log 3 sets of bench press at 65kg');
  assert.ok(match1.intentDef);
  assert.equal(match1.intentDef.name, 'movement.logStrength');
  assert.equal(match1.initialSlots.setsCount, 3);
  assert.equal(match1.initialSlots.weightKg, 65);
  assert.equal(match1.initialSlots.workoutName, 'Bench Press');

  // Cardio voice match
  const match2 = matchIntent('log 30 minutes of treadmill');
  assert.ok(match2.intentDef);
  assert.equal(match2.intentDef.name, 'movement.logCardio');
  assert.equal(match2.initialSlots.activity, 'Treadmill');
  assert.equal(match2.initialSlots.durationMin, 30);

  // Calorie voice match
  const match3 = matchIntent('ate 650 calories for chicken rice bowl');
  assert.ok(match3.intentDef);
  assert.equal(match3.intentDef.name, 'movement.logCalorie');
  assert.equal(match3.initialSlots.calories, 650);
  assert.equal(match3.initialSlots.item, 'chicken rice bowl');

  // Repeat last workout voice match
  const match4 = matchIntent('repeat my last workout');
  assert.ok(match4.intentDef);
  assert.equal(match4.intentDef.name, 'movement.repeatLast');

  // Check PR voice match
  const match5 = matchIntent('what is my PR on overhead press');
  assert.ok(match5.intentDef);
  assert.equal(match5.intentDef.name, 'movement.checkPR');
});

test('8. Clean Slate & User-Isolated Personal Records Integrity', () => {
  // 1. Verify default exercise library has zero hardcoded personal bests
  assert.ok(Array.isArray(DEFAULT_EXERCISE_LIBRARY));
  assert.equal(DEFAULT_EXERCISE_LIBRARY.length, 21, 'Should have 21 standard movements in catalog');
  DEFAULT_EXERCISE_LIBRARY.forEach((ex) => {
    assert.equal(ex.personalBest, null, `Exercise "${ex.name}" must not have pre-seeded personal bests`);
    assert.equal(ex.lastUsed, null, `Exercise "${ex.name}" must not have pre-seeded lastUsed`);
  });

  // 2. Verify all default log arrays are completely empty
  assert.deepEqual(DEFAULT_MOVEMENTS, [], 'DEFAULT_MOVEMENTS must be empty for new users');
  assert.deepEqual(DEFAULT_CARDIO_LOGS, [], 'DEFAULT_CARDIO_LOGS must be empty for new users');
  assert.deepEqual(DEFAULT_CALORIE_LOGS, [], 'DEFAULT_CALORIE_LOGS must be empty for new users');
});
