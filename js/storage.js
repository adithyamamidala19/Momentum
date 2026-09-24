/**
 * Momentum Storage Service
 * Handles persistence to localStorage, sessionStorage, and fallback data structures.
 */

export const STORAGE_KEYS = {
  PROFILE_NAME: 'momentum_profile_name',
  PROFILE_PHOTO: 'momentum_profile_photo',
  PROFILE_MANTRA: 'momentum_profile_mantra',
  CUSTOM_HABITS: 'momentum_custom_habits',
  MOVEMENT_LOGS: 'momentum_movement_logs',
  CARDIO_LOGS: 'momentum_cardio_logs',
  CALORIE_INTAKE_LOGS: 'momentum_calorie_intake_logs',
  EXERCISE_LIBRARY: 'momentum_exercise_library',
  FOCUS_DATA: 'momentum_focus_data',
  STREAK_DATA: 'momentum_streak_data',
  NOTIF_BUDGET: 'momentum_notif_budget',
  QUIET_START: 'momentum_quiet_start',
  QUIET_END: 'momentum_quiet_end',
  DAILY_NUDGES_SENT: 'momentum_daily_nudges_sent',
  LAST_NUDGE_DATE: 'momentum_last_nudge_date',
  VOICE_MUTED: 'momentum_voice_muted',
  GUEST_SESSION: 'momentum_guest_session',
  FIREBASE_CONFIG: 'momentum_firebase_config',
  TODOS: 'momentum_todos',
  WATER_ML: 'momentum_water_ml',
  WATER_TARGET_ML: 'momentum_water_target_ml',
  PROTEIN_GRAMS: 'momentum_protein_grams',
  PROTEIN_TARGET_GRAMS: 'momentum_protein_target_grams',
  PROTEIN_ENTRIES: 'momentum_protein_entries',
  CHALLENGE_USER: 'momentum_challenge_user',
  DAILY_HISTORY: 'momentum_daily_history'
};

export const DEFAULT_HABITS = [
  { id: 'habit-1', title: '500ml Morning Water', icon: 'water_drop', anchor: 'Upon waking at 7:00 AM', category: 'Health', color: 'emerald', completed: true },
  { id: 'habit-2', title: '4-7-8 Box Breathing', icon: 'air', anchor: 'Right before opening laptop', category: 'Mind', color: 'teal', completed: true },
  { id: 'habit-3', title: '25-Min Deep Focus Block', icon: 'timer', anchor: 'At 10:00 AM desk setup', category: 'Focus', color: 'indigo', completed: true },
  { id: 'habit-4', title: 'Movement & Mobility', icon: 'fitness_center', anchor: 'At 4:30 PM transition', category: 'Health', color: 'emerald', completed: true },
  { id: 'habit-5', title: 'Evening Digital Sunset', icon: 'bedtime', anchor: 'At 9:30 PM before bed', category: 'Mind', color: 'amber', completed: false }
];

export const DEFAULT_EXERCISE_LIBRARY = [
  { id: 'ex-bench-press', name: 'Bench Press', muscleGroup: 'chest', personalBest: { weightKg: 65, reps: 8, date: '2026-09-20' }, lastUsed: { weightKg: 60, reps: 10, setsCount: 3, date: '2026-09-20' }, isCustom: false },
  { id: 'ex-incline-db', name: 'Incline Dumbbell Press', muscleGroup: 'chest', personalBest: { weightKg: 28, reps: 10, date: '2026-09-18' }, lastUsed: { weightKg: 26, reps: 10, setsCount: 3, date: '2026-09-18' }, isCustom: false },
  { id: 'ex-pushups', name: 'Push-ups', muscleGroup: 'chest', personalBest: { weightKg: 0, reps: 30, date: '2026-09-15' }, lastUsed: { weightKg: 0, reps: 25, setsCount: 3, date: '2026-09-15' }, isCustom: false },
  { id: 'ex-dips', name: 'Dips', muscleGroup: 'chest', personalBest: { weightKg: 15, reps: 10, date: '2026-09-12' }, lastUsed: { weightKg: 10, reps: 10, setsCount: 3, date: '2026-09-12' }, isCustom: false },

  { id: 'ex-squat', name: 'Barbell Squat', muscleGroup: 'legs', personalBest: { weightKg: 100, reps: 5, date: '2026-09-19' }, lastUsed: { weightKg: 90, reps: 8, setsCount: 3, date: '2026-09-19' }, isCustom: false },
  { id: 'ex-leg-press', name: 'Leg Press', muscleGroup: 'legs', personalBest: { weightKg: 180, reps: 10, date: '2026-09-16' }, lastUsed: { weightKg: 160, reps: 12, setsCount: 3, date: '2026-09-16' }, isCustom: false },
  { id: 'ex-rdl', name: 'Romanian Deadlift', muscleGroup: 'legs', personalBest: { weightKg: 85, reps: 8, date: '2026-09-14' }, lastUsed: { weightKg: 80, reps: 10, setsCount: 3, date: '2026-09-14' }, isCustom: false },
  { id: 'ex-bulgarian', name: 'Bulgarian Split Squat', muscleGroup: 'legs', personalBest: { weightKg: 22, reps: 10, date: '2026-09-10' }, lastUsed: { weightKg: 20, reps: 10, setsCount: 3, date: '2026-09-10' }, isCustom: false },

  { id: 'ex-deadlift', name: 'Deadlift', muscleGroup: 'back', personalBest: { weightKg: 130, reps: 5, date: '2026-09-17' }, lastUsed: { weightKg: 120, reps: 5, setsCount: 3, date: '2026-09-17' }, isCustom: false },
  { id: 'ex-barbell-row', name: 'Barbell Row', muscleGroup: 'back', personalBest: { weightKg: 70, reps: 8, date: '2026-09-17' }, lastUsed: { weightKg: 65, reps: 10, setsCount: 3, date: '2026-09-17' }, isCustom: false },
  { id: 'ex-lat-pulldown', name: 'Lat Pulldown', muscleGroup: 'back', personalBest: { weightKg: 60, reps: 10, date: '2026-09-17' }, lastUsed: { weightKg: 55, reps: 12, setsCount: 3, date: '2026-09-17' }, isCustom: false },
  { id: 'ex-pullups', name: 'Pull-ups', muscleGroup: 'back', personalBest: { weightKg: 0, reps: 12, date: '2026-09-15' }, lastUsed: { weightKg: 0, reps: 10, setsCount: 3, date: '2026-09-15' }, isCustom: false },

  { id: 'ex-ohp', name: 'Overhead Press', muscleGroup: 'shoulders', personalBest: { weightKg: 45, reps: 6, date: '2026-09-18' }, lastUsed: { weightKg: 40, reps: 8, setsCount: 3, date: '2026-09-18' }, isCustom: false },
  { id: 'ex-lat-raise', name: 'Dumbbell Lateral Raise', muscleGroup: 'shoulders', personalBest: { weightKg: 12, reps: 15, date: '2026-09-18' }, lastUsed: { weightKg: 10, reps: 15, setsCount: 3, date: '2026-09-18' }, isCustom: false },
  { id: 'ex-face-pull', name: 'Face Pull', muscleGroup: 'shoulders', personalBest: { weightKg: 30, reps: 15, date: '2026-09-18' }, lastUsed: { weightKg: 25, reps: 15, setsCount: 3, date: '2026-09-18' }, isCustom: false },

  { id: 'ex-curl', name: 'Bicep Curl', muscleGroup: 'arms', personalBest: { weightKg: 16, reps: 10, date: '2026-09-18' }, lastUsed: { weightKg: 14, reps: 12, setsCount: 3, date: '2026-09-18' }, isCustom: false },
  { id: 'ex-hammer-curl', name: 'Hammer Curl', muscleGroup: 'arms', personalBest: { weightKg: 18, reps: 10, date: '2026-09-18' }, lastUsed: { weightKg: 16, reps: 10, setsCount: 3, date: '2026-09-18' }, isCustom: false },
  { id: 'ex-pushdown', name: 'Tricep Pushdown', muscleGroup: 'arms', personalBest: { weightKg: 35, reps: 12, date: '2026-09-18' }, lastUsed: { weightKg: 30, reps: 12, setsCount: 3, date: '2026-09-18' }, isCustom: false },

  { id: 'ex-plank', name: 'Plank', muscleGroup: 'core', personalBest: { weightKg: 0, reps: 90, date: '2026-09-20' }, lastUsed: { weightKg: 0, reps: 60, setsCount: 3, date: '2026-09-20' }, isCustom: false },
  { id: 'ex-cable-crunch', name: 'Cable Crunch', muscleGroup: 'core', personalBest: { weightKg: 40, reps: 15, date: '2026-09-20' }, lastUsed: { weightKg: 35, reps: 15, setsCount: 3, date: '2026-09-20' }, isCustom: false },
  { id: 'ex-clean-press', name: 'Clean & Press', muscleGroup: 'full-body', personalBest: { weightKg: 50, reps: 5, date: '2026-09-10' }, lastUsed: { weightKg: 45, reps: 6, setsCount: 3, date: '2026-09-10' }, isCustom: false }
];

export const DEFAULT_MOVEMENTS = [
  {
    id: 'move-1',
    date: '2026-09-20',
    workoutName: 'Bench Press',
    muscleGroup: 'chest',
    sets: [
      { setNumber: 1, weightKg: 60, reps: 10, isPR: false },
      { setNumber: 2, weightKg: 65, reps: 8, isPR: true }
    ],
    setsCount: 2,
    reps: 8,
    weightKg: 65,
    pacing: 'Moderate',
    feel: 'Comfortable',
    mode: 'strength',
    summary: '2 sets, up to 8 reps @ 65kg',
    supersetGroupId: null,
    sessionId: 'session-1726830000',
    timestamp: Date.now() - 172800000
  },
  {
    id: 'move-2',
    date: '2026-09-20',
    workoutName: 'Incline Dumbbell Press',
    muscleGroup: 'chest',
    sets: [
      { setNumber: 1, weightKg: 24, reps: 10, isPR: false },
      { setNumber: 2, weightKg: 26, reps: 10, isPR: false }
    ],
    setsCount: 2,
    reps: 10,
    weightKg: 26,
    pacing: 'Moderate',
    feel: 'Comfortable',
    mode: 'strength',
    summary: '2 sets, up to 10 reps @ 26kg',
    supersetGroupId: null,
    sessionId: 'session-1726830000',
    timestamp: Date.now() - 172700000
  }
];

export const DEFAULT_CARDIO_LOGS = [
  {
    id: 'cardio-1',
    date: '2026-09-21',
    activity: 'Treadmill',
    durationMin: 30,
    caloriesBurned: 280,
    timestamp: Date.now() - 86400000
  }
];

export const DEFAULT_CALORIE_LOGS = [
  {
    id: 'food-1',
    date: '2026-09-22',
    time: '13:20',
    item: 'Chicken rice bowl',
    calories: 650,
    timestamp: Date.now() - 18000000
  }
];

export const DEFAULT_TODOS = [
  {
    id: 'todo-default-1',
    title: 'Mindful garden pause & tea',
    date: new Date().toISOString().slice(0, 10),
    time: '11:00',
    notes: 'Gentle reflection window',
    priority: 'normal',
    completed: false,
    createdVia: 'manual',
    createdAt: new Date().toISOString()
  },
  {
    id: 'todo-default-2',
    title: 'Review evening reading notes',
    date: new Date().toISOString().slice(0, 10),
    time: '18:30',
    notes: null,
    priority: 'normal',
    completed: true,
    createdVia: 'manual',
    createdAt: new Date().toISOString()
  }
];

/**
 * Normalizes legacy or partially-formed movement logs into the upgraded schema
 */
export function normalizeMovementLogs(rawLogs) {
  if (!Array.isArray(rawLogs)) return [...DEFAULT_MOVEMENTS];
  return rawLogs.map((item, idx) => {
    const rawSets = Array.isArray(item.sets) ? item.sets : [];
    let normalizedSets = [];

    if (rawSets.length > 0) {
      normalizedSets = rawSets.map((s, sIdx) => ({
        setNumber: s.setNumber || s.set || (sIdx + 1),
        weightKg: typeof s.weightKg === 'number' ? s.weightKg : (typeof s.weight === 'number' ? s.weight : (item.weightKg || 0)),
        reps: typeof s.reps === 'number' ? s.reps : (item.reps || 10),
        isPR: Boolean(s.isPR)
      }));
    } else {
      const setsCount = item.setsCount || 1;
      for (let i = 1; i <= setsCount; i++) {
        normalizedSets.push({
          setNumber: i,
          weightKg: item.weightKg || 0,
          reps: item.reps || 10,
          isPR: false
        });
      }
    }

    // Determine heaviest / roll-up stats
    let heaviestWeight = 0;
    let heaviestReps = 0;
    normalizedSets.forEach(s => {
      if (s.weightKg > heaviestWeight || (s.weightKg === heaviestWeight && s.reps > heaviestReps)) {
        heaviestWeight = s.weightKg;
        heaviestReps = s.reps;
      }
    });

    const setsCount = normalizedSets.length;
    const reps = heaviestReps || item.reps || 10;
    const weightKg = heaviestWeight !== 0 ? heaviestWeight : (item.weightKg || 0);

    // Infer muscle group from workout name if missing
    let muscleGroup = item.muscleGroup || 'full-body';
    if (!item.muscleGroup && item.workoutName) {
      const match = DEFAULT_EXERCISE_LIBRARY.find(e => e.name.toLowerCase() === item.workoutName.toLowerCase());
      if (match) muscleGroup = match.muscleGroup;
    }

    const summary = item.summary || `${item.workoutName || 'Workout'}: ${setsCount} sets · up to ${reps} reps @ ${weightKg}kg`;

    return {
      id: item.id || `move-${Date.now()}-${idx}`,
      date: item.date || new Date().toISOString().slice(0, 10),
      workoutName: item.workoutName || 'Workout',
      muscleGroup: muscleGroup,
      sets: normalizedSets,
      setsCount: setsCount,
      reps: reps,
      weightKg: weightKg,
      pacing: item.pacing || 'Moderate',
      feel: item.feel || 'Comfortable',
      mode: item.mode || 'strength',
      summary: summary,
      supersetGroupId: item.supersetGroupId || null,
      sessionId: item.sessionId || `session-${item.timestamp || Date.now()}`,
      timestamp: item.timestamp || Date.now()
    };
  });
}

export function loadPersistedState(userState) {
  try {
    if (typeof localStorage === 'undefined') {
      userState.customHabits = [...DEFAULT_HABITS];
      userState.movementLogs = [...DEFAULT_MOVEMENTS];
      userState.cardioLogs = [...DEFAULT_CARDIO_LOGS];
      userState.calorieIntakeLogs = [...DEFAULT_CALORIE_LOGS];
      userState.exerciseLibrary = [...DEFAULT_EXERCISE_LIBRARY];
      userState.todos = [...DEFAULT_TODOS];
      return;
    }
    const savedHabits = localStorage.getItem(STORAGE_KEYS.CUSTOM_HABITS);
    userState.customHabits = savedHabits ? JSON.parse(savedHabits) : [...DEFAULT_HABITS];

    const savedMovements = localStorage.getItem(STORAGE_KEYS.MOVEMENT_LOGS);
    userState.movementLogs = savedMovements ? normalizeMovementLogs(JSON.parse(savedMovements)) : [...DEFAULT_MOVEMENTS];

    const savedCardio = localStorage.getItem(STORAGE_KEYS.CARDIO_LOGS);
    userState.cardioLogs = savedCardio ? JSON.parse(savedCardio) : [...DEFAULT_CARDIO_LOGS];

    const savedCalories = localStorage.getItem(STORAGE_KEYS.CALORIE_INTAKE_LOGS);
    userState.calorieIntakeLogs = savedCalories ? JSON.parse(savedCalories) : [...DEFAULT_CALORIE_LOGS];

    const savedLibrary = localStorage.getItem(STORAGE_KEYS.EXERCISE_LIBRARY);
    userState.exerciseLibrary = savedLibrary ? JSON.parse(savedLibrary) : [...DEFAULT_EXERCISE_LIBRARY];

    const savedTodos = localStorage.getItem(STORAGE_KEYS.TODOS);
    userState.todos = savedTodos ? JSON.parse(savedTodos) : [...DEFAULT_TODOS];

    const savedFocus = localStorage.getItem(STORAGE_KEYS.FOCUS_DATA);
    if (savedFocus) {
      const f = JSON.parse(savedFocus);
      if (f.todayFocusMinutes !== undefined) userState.todayFocusMinutes = f.todayFocusMinutes;
      if (f.mindfulHours !== undefined) userState.mindfulHours = f.mindfulHours;
    }

    const savedStreak = localStorage.getItem(STORAGE_KEYS.STREAK_DATA);
    if (savedStreak) {
      const s = JSON.parse(savedStreak);
      if (s.streakDays !== undefined) userState.streakDays = s.streakDays;
      if (s.bestStreak !== undefined) userState.bestStreak = s.bestStreak;
    }

    const savedWaterMl = localStorage.getItem(STORAGE_KEYS.WATER_ML);
    if (savedWaterMl !== null) userState.waterMl = parseInt(savedWaterMl, 10);
    const savedWaterTargetMl = localStorage.getItem(STORAGE_KEYS.WATER_TARGET_ML);
    if (savedWaterTargetMl !== null) userState.waterTargetMl = parseInt(savedWaterTargetMl, 10);

    const savedProteinGrams = localStorage.getItem(STORAGE_KEYS.PROTEIN_GRAMS);
    if (savedProteinGrams !== null) userState.proteinGrams = parseInt(savedProteinGrams, 10);
    const savedProteinTarget = localStorage.getItem(STORAGE_KEYS.PROTEIN_TARGET_GRAMS);
    if (savedProteinTarget !== null) userState.proteinTargetGrams = parseInt(savedProteinTarget, 10);
    const savedProteinEntries = localStorage.getItem(STORAGE_KEYS.PROTEIN_ENTRIES);
    if (savedProteinEntries) userState.proteinEntries = JSON.parse(savedProteinEntries);

    const savedChallenge = localStorage.getItem(STORAGE_KEYS.CHALLENGE_USER);
    if (savedChallenge) {
      const c = JSON.parse(savedChallenge);
      userState.challengeJoined = c.joined;
      userState.challengeNickname = c.nickname;
      userState.challengeAvatar = c.avatar;
    }

    const savedHistory = localStorage.getItem(STORAGE_KEYS.DAILY_HISTORY);
    if (savedHistory) userState.dailyHistory = JSON.parse(savedHistory);
  } catch (err) {
    console.warn('Could not load localStorage data, using defaults:', err);
    userState.customHabits = [...DEFAULT_HABITS];
    userState.movementLogs = [...DEFAULT_MOVEMENTS];
    userState.cardioLogs = [...DEFAULT_CARDIO_LOGS];
    userState.calorieIntakeLogs = [...DEFAULT_CALORIE_LOGS];
    userState.exerciseLibrary = [...DEFAULT_EXERCISE_LIBRARY];
    userState.todos = [...DEFAULT_TODOS];
  }
}

export function saveStateToStorage(userState) {
  try {
    if (window.MomentumFirebase && typeof window.MomentumFirebase.queueSave === 'function') {
      window.MomentumFirebase.queueSave();
    }
  } catch (e) {}

  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.CUSTOM_HABITS, JSON.stringify(userState.customHabits || []));
    localStorage.setItem(STORAGE_KEYS.MOVEMENT_LOGS, JSON.stringify(userState.movementLogs || []));
    localStorage.setItem(STORAGE_KEYS.CARDIO_LOGS, JSON.stringify(userState.cardioLogs || []));
    localStorage.setItem(STORAGE_KEYS.CALORIE_INTAKE_LOGS, JSON.stringify(userState.calorieIntakeLogs || []));
    localStorage.setItem(STORAGE_KEYS.EXERCISE_LIBRARY, JSON.stringify(userState.exerciseLibrary || []));
    localStorage.setItem(STORAGE_KEYS.TODOS, JSON.stringify(userState.todos || []));
    localStorage.setItem(STORAGE_KEYS.FOCUS_DATA, JSON.stringify({
      todayFocusMinutes: userState.todayFocusMinutes,
      mindfulHours: userState.mindfulHours
    }));
    localStorage.setItem(STORAGE_KEYS.STREAK_DATA, JSON.stringify({
      streakDays: userState.streakDays,
      bestStreak: userState.bestStreak
    }));
    if (userState.waterMl !== undefined) {
      localStorage.setItem(STORAGE_KEYS.WATER_ML, String(userState.waterMl));
    }
    if (userState.waterTargetMl !== undefined) {
      localStorage.setItem(STORAGE_KEYS.WATER_TARGET_ML, String(userState.waterTargetMl));
    }
    if (userState.proteinGrams !== undefined) {
      localStorage.setItem(STORAGE_KEYS.PROTEIN_GRAMS, String(userState.proteinGrams));
    }
    if (userState.proteinTargetGrams !== undefined) {
      localStorage.setItem(STORAGE_KEYS.PROTEIN_TARGET_GRAMS, String(userState.proteinTargetGrams));
    }
    if (userState.proteinEntries) {
      localStorage.setItem(STORAGE_KEYS.PROTEIN_ENTRIES, JSON.stringify(userState.proteinEntries));
    }
    if (userState.challengeJoined !== undefined) {
      localStorage.setItem(STORAGE_KEYS.CHALLENGE_USER, JSON.stringify({
        joined: userState.challengeJoined,
        nickname: userState.challengeNickname,
        avatar: userState.challengeAvatar
      }));
    }
    if (userState.dailyHistory) {
      localStorage.setItem(STORAGE_KEYS.DAILY_HISTORY, JSON.stringify(userState.dailyHistory));
    }
  } catch (err) {
    console.warn('Could not persist to localStorage:', err);
  }
}
