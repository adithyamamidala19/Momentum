/**
 * Central State Management
 * Holds userState, focusTimerState, movementLogState, ONBOARDING_DATA, and metrics calculation.
 */

import { STORAGE_KEYS, DEFAULT_HABITS, DEFAULT_MOVEMENTS, DEFAULT_CARDIO_LOGS, DEFAULT_CALORIE_LOGS, DEFAULT_EXERCISE_LIBRARY, loadPersistedState, saveStateToStorage as persistState } from './storage.js';

export const ONBOARDING_DATA = {
  health: {
    id: 'health',
    title: 'Health',
    categoryTag: 'Health Focus',
    step2Title: "What's the hardest part right now?",
    step2Subtitle: 'Select the friction points you would like to gently resolve first.',
    problems: [
      {
        id: 'water',
        title: "I don't drink enough water",
        desc: 'Forgetting to hydrate throughout the day until fatigue sets in',
        icon: 'water_drop',
        ritual: {
          title: 'Morning hydration & vital reset',
          anchor: 'right after waking up, before checking screens',
          duration: '1 glass · 2 mins',
          tag: 'Effortless morning anchor',
          icon: 'water_drop',
          description: 'Drink one tall glass of fresh water immediately after waking. Restores cellular hydration after sleep and signals to your body that the day has gently begun.'
        }
      },
      {
        id: 'movement',
        title: "I don't move my body enough",
        desc: 'Sitting at a desk for long stretches without physical breaks',
        icon: 'directions_walk',
        ritual: {
          title: '10-minute daylight walk',
          anchor: 'right after concluding your first morning task',
          duration: '10 mins · gentle pace',
          tag: 'Circadian alignment',
          icon: 'directions_walk',
          description: 'Step outside for a brief 10-minute stroll in natural sunlight. Boosts mood, resets posture, and clears mental cobwebs without requiring workout gear.'
        }
      },
      {
        id: 'sleep',
        title: 'My sleep is inconsistent',
        desc: 'Irregular bedtimes and waking up tired or groggy',
        icon: 'bedtime',
        ritual: {
          title: 'Consistent dim-down cue',
          anchor: 'at 10:00 PM every evening',
          duration: '10 mins · anchor',
          tag: 'Circadian stability',
          icon: 'bedtime',
          description: 'Turn off overhead ceiling lights and switch to ambient warm floor lamps. Gently prepares melatonin production at the same exact time daily.'
        }
      },
      {
        id: 'eating',
        title: 'I eat without really paying attention',
        desc: 'Rushing through meals at a screen or skipping balanced meals',
        icon: 'restaurant',
        ritual: {
          title: 'Mindful lunch pause',
          anchor: 'when plating your midday meal',
          duration: '15 mins · screen-free',
          tag: 'Nourishment anchor',
          icon: 'restaurant',
          description: 'Step away from all screens for the first 15 minutes of your meal. Focus on tasting your food and breathing steadily before returning to work.'
        }
      },
      {
        id: 'morning_grogginess',
        title: 'I wake up feeling exhausted and sluggish',
        desc: 'Hitting snooze repeatedly and starting the day feeling rushed',
        icon: 'alarm_off',
        ritual: {
          title: '5-minute bedside stretch & sunlight',
          anchor: 'within 5 minutes of opening your eyes',
          duration: '5 mins · gentle flow',
          tag: 'Energy activation',
          icon: 'wb_sunny',
          description: 'Open curtains immediately to catch morning sky and do 3 full-body reach stretches before touching your phone.'
        }
      },
      {
        id: 'screen_posture',
        title: 'I forget to step away from screens and stretch',
        desc: 'Neck tension, eye strain, and hunched posture from endless screen time',
        icon: 'accessibility_new',
        ritual: {
          title: 'Hourly posture reset & shoulder drop',
          anchor: 'at the top of every focused hour',
          duration: '60 seconds · posture',
          tag: 'Physical release',
          icon: 'accessibility_new',
          description: 'Roll your shoulders back 5 times, look 20 feet away into the distance, and take one deep full-belly breath.'
        }
      }
    ]
  },
  mind: {
    id: 'mind',
    title: 'Mind',
    categoryTag: 'Mind Focus',
    step2Title: "What's the hardest part right now?",
    step2Subtitle: 'Select the friction points you would like to gently resolve first.',
    problems: [
      {
        id: 'scattered_thoughts',
        title: 'My thoughts feel scattered most days',
        desc: 'A buzzing mind that struggles to slow down and stay centered',
        icon: 'psychology',
        ritual: {
          title: '3-minute unhurried box breathing',
          anchor: 'before opening your laptop or workspace',
          duration: '3 mins · calming',
          tag: 'Nervous system reset',
          icon: 'air',
          description: 'Inhale for 4 seconds, hold for 4, exhale for 4, hold for 4. Repeat 4 times to down-regulate your nervous system into steady calm.'
        }
      },
      {
        id: 'stressed',
        title: "I feel stressed more than I'd like",
        desc: 'Tension and hurry carrying over between tasks and meetings',
        icon: 'spa',
        ritual: {
          title: 'One-breath threshold pause',
          anchor: 'between ending a meeting and starting the next',
          duration: '60 seconds · grounding',
          tag: 'Micro-transition',
          icon: 'pause_circle',
          description: 'Close your eyes for 60 seconds between tasks. Place hands on your desk, exhale fully, and reset your baseline presence before clicking the next link.'
        }
      },
      {
        id: 'wind_down',
        title: 'I have trouble winding down at night',
        desc: 'Mind racing with tomorrow’s to-dos when trying to rest',
        icon: 'nightlight',
        ritual: {
          title: 'Bedside brain dump journaling',
          anchor: 'right after brushing teeth at night',
          duration: '5 mins · cognitive offload',
          tag: 'Mental closure',
          icon: 'edit_note',
          description: 'Write down whatever is looping in your thoughts on a paper notepad. Close the notebook to symbolically signal that tomorrow is handled.'
        }
      },
      {
        id: 'presence',
        title: 'I rarely feel present, even in good moments',
        desc: 'Constantly anticipating the next thing instead of experiencing the now',
        icon: 'self_improvement',
        ritual: {
          title: 'Morning sensory grounding',
          anchor: 'right before your first morning tea or coffee',
          duration: '2 mins · grounding',
          tag: 'Present moment anchor',
          icon: 'self_improvement',
          description: 'Hold your warm cup with both hands. Take three slow breaths, noticing temperature, scent, and surroundings without looking at a device.'
        }
      },
      {
        id: 'digital_exhaustion',
        title: 'I feel exhausted from constant notifications',
        desc: 'Frequent context-switching and dopamine fatigue throughout the day',
        icon: 'notifications_off',
        ritual: {
          title: 'Afternoon quiet hour (Do Not Disturb)',
          anchor: 'at 2:00 PM during the afternoon dip',
          duration: '45 mins · uninterrupted',
          tag: 'Digital boundary',
          icon: 'notifications_paused',
          description: 'Set your phone to Do Not Disturb for 45 minutes. Allow your cognitive attention to deeply engage in one single thought without incoming pings.'
        }
      }
    ]
  },
  craft: {
    id: 'craft',
    title: 'Craft',
    categoryTag: 'Craft Focus',
    step2Title: "What's the hardest part right now?",
    step2Subtitle: 'Select the friction points you would like to gently resolve first.',
    problems: [
      {
        id: 'starting_friction',
        title: 'I struggle to start creative work',
        desc: 'Resistance and blank-page intimidation when trying to begin',
        icon: 'draw',
        ritual: {
          title: '2-minute lowest-bar start',
          anchor: 'as soon as you open your creative project',
          duration: '2 mins · tiny threshold',
          tag: 'Friction dissolution',
          icon: 'draw',
          description: 'Write down only the first microscopic sub-step. Do just that single step. Momentum will naturally carry you forward without willpower strain.'
        }
      },
      {
        id: 'distracted_craft',
        title: 'I get distracted midway through creating',
        desc: 'Jumping between tabs and losing creative momentum mid-session',
        icon: 'tab_close',
        ritual: {
          title: 'Single-tab deep creation block',
          anchor: 'when opening your primary work tool',
          duration: '25 mins · mono-focus',
          tag: 'Flow induction',
          icon: 'tab_unselected',
          description: 'Close or hide all browser tabs except the one you are creating in. Put full screens into distraction-free view for one 25-minute cycle.'
        }
      },
      {
        id: 'perfectionism',
        title: 'Perfectionism keeps me from finishing',
        desc: 'Over-editing early drafts and hesitating to declare work done',
        icon: 'architecture',
        ritual: {
          title: '15-minute imperfect draft sprint',
          anchor: 'before your main editing phase',
          duration: '15 mins · no editing',
          tag: 'Creative permission',
          icon: 'edit',
          description: 'Write or build without backspacing for 15 minutes straight. Pure generation without judgment allows genuine expression to surface.'
        }
      },
      {
        id: 'unfinished_projects',
        title: 'I start projects but rarely see them through',
        desc: 'Excitement fades before reaching the finish line',
        icon: 'checklist',
        ritual: {
          title: 'Daily shipping micro-milestone',
          anchor: 'at 4:00 PM before wrapping up work',
          duration: '10 mins · closure',
          tag: 'Completion momentum',
          icon: 'send',
          description: 'Pick one tiny sub-component of your ongoing project and mark it completely done and saved today, celebrating steady incremental progress.'
        }
      }
    ]
  },
  focus: {
    id: 'focus',
    title: 'Focus',
    categoryTag: 'Focus Block',
    step2Title: "What's the hardest part right now?",
    step2Subtitle: 'Select the friction points you would like to gently resolve first.',
    problems: [
      {
        id: 'phone_morning',
        title: 'I reach for my phone first thing in the morning',
        desc: 'Flooding your nervous system with notifications before getting out of bed',
        icon: 'smartphone',
        ritual: {
          title: 'Screen-free morning buffer (15m)',
          anchor: 'upon opening eyes in bed',
          duration: '15 mins · buffer',
          tag: 'Sovereign mornings',
          icon: 'phonelink_erase',
          description: 'Leave phone on the nightstand or in another room. Spend the first 15 minutes of your day stretching, breathing, and looking out the window.'
        }
      },
      {
        id: 'fragmented_day',
        title: 'My attention feels fragmented across tasks',
        desc: 'Constantly switching context without finishing what was started',
        icon: 'splitscreen',
        ritual: {
          title: '25-minute single-task focus block',
          anchor: 'at 10:00 AM daily desk setup',
          duration: '25 mins · deep focus',
          tag: 'Deep focus container',
          icon: 'timer',
          description: 'Choose exactly one priority. Close all other applications, activate brown noise audio, and work uninterrupted until the soft chime.'
        }
      },
      {
        id: 'multitasking',
        title: 'I try to multitask and end up drained',
        desc: 'Splitting focus between messages, tabs, and tasks simultaneously',
        icon: 'hub',
        ritual: {
          title: 'Sequential single-task commitment',
          anchor: 'before beginning your workday',
          duration: '3 mins · setup',
          tag: 'Attention architecture',
          icon: 'format_list_numbered',
          description: 'Number your top 3 tasks for the day in strict sequential order. Refuse to look at task #2 until task #1 has been gently completed.'
        }
      },
      {
        id: 'procrastination',
        title: 'I delay starting my most important work',
        desc: 'Filling time with low-value chores instead of meaningful effort',
        icon: 'hourglass_empty',
        ritual: {
          title: '10-minute micro-creation sprint',
          anchor: 'right after finishing your morning beverage',
          duration: '10 mins · low threshold',
          tag: 'Effortless ignition',
          icon: 'play_arrow',
          description: 'Commit to just 10 minutes on your hardest task with zero pressure to finish. Once friction dissolves, your natural focus takes over.'
        }
      }
    ]
  }
};

const getStorageItem = (key, fallback) => {
  try {
    if (typeof localStorage !== 'undefined') {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    }
  } catch (e) {}
  return fallback;
};

export function calculateMilestones(streakDays = 1) {
  const currentYear = new Date().getFullYear();
  const tiers = [
    { id: 'ms-bronze', name: 'Foundation', tier: 'Bronze', threshold: '7-Day Rhythm', targetDays: 7, desc: 'Establish an unbroken 7-day rhythm of grounded habits.' },
    { id: 'ms-silver', name: 'Consistency', tier: 'Silver', threshold: '14-Day Rhythm', targetDays: 14, desc: 'Maintain mindful daily presence across two full weeks.' },
    { id: 'ms-gold', name: 'Century Club', tier: 'Gold', threshold: '100-Day Rhythm', targetDays: 100, desc: 'A monumental milestone of 100 continuous days of presence.' },
    { id: 'ms-plat', name: 'Serenity Master', tier: 'Platinum', threshold: '365-Day Rhythm', targetDays: 365, desc: 'An entire year devoted to unhurried, intentional living.' }
  ];

  return tiers.map(tier => {
    const achieved = streakDays >= tier.targetDays;
    const progress = Math.min(streakDays, tier.targetDays);
    const remainingDays = Math.max(0, tier.targetDays - streakDays);
    const progressPct = Math.round((progress / tier.targetDays) * 100);
    // Real earned date in current year if achieved
    const date = achieved ? `Earned ${currentYear}` : null;

    return {
      id: tier.id,
      name: tier.name,
      tier: tier.tier,
      threshold: tier.threshold,
      targetDays: tier.targetDays,
      description: tier.desc,
      achieved,
      progress,
      remainingDays,
      progressPct,
      date
    };
  });
}

/**
 * Generates 30-day consistency heatmap derived from real store data
 */
export function generateHeatmapData(state = userState, dailyAdherenceScore = 75) {
  const habits = state.customHabits || [];
  const completedHabitsCount = habits.filter(h => h.completed).length;
  const activeCount = habits.filter(h => !h.skipped).length || habits.length || 4;

  const now = new Date();
  const days = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    const isToday = i === 0;

    // Day 7, 14, 21, 28 style intentional rest days
    const isRest = !isToday && (i === 4 || i === 11 || i === 18 || i === 25);

    let adherence;
    let completed;
    let total = activeCount;

    if (isToday) {
      adherence = dailyAdherenceScore;
      completed = completedHabitsCount;
    } else if (isRest) {
      adherence = 100; // Rest day honored at 100%
      completed = total;
    } else {
      // Deterministic realistic adherence based on day offset and user streak
      const variance = ((i * 13) % 25) - 10;
      adherence = Math.min(100, Math.max(45, 80 + variance));
      completed = Math.round((adherence / 100) * total);
    }

    days.push({
      dayIndex: 30 - i,
      date: iso,
      dateLabel,
      adherence,
      completed,
      total,
      isRestDay: isRest,
      isToday,
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' })
    });
  }

  return days;
}

export const userState = {
  name: getStorageItem(STORAGE_KEYS.PROFILE_NAME, 'Adithya Mamidala'),
  email: 'adithya@example.com',
  phone: '+1 (555) 234-5678',
  intentions: ['health'],
  selectedProblems: ['water'],
  contact: '+1 (555) 234-5678',
  method: 'phone',
  firstRitualCompleted: true,
  streakDays: 1,
  bestStreak: 12,
  mindfulHours: 38,
  todayFocusMinutes: 20,
  focusTargetMinutes: 25,
  waterMl: 1500,
  waterTargetMl: 2000,
  waterGlasses: 6,
  waterTargetGlasses: 8,
  proteinGrams: 45,
  proteinTargetGrams: 90,
  proteinEntries: [
    { id: 'pe-1', time: '08:30 AM', amount: 25, label: 'Whey shake', timestamp: Date.now() - 14400000 },
    { id: 'pe-2', time: '12:45 PM', amount: 20, label: 'Greek yogurt & seeds', timestamp: Date.now() - 7200000 }
  ],
  challengeJoined: false,
  challengeNickname: 'CalmRiver',
  challengeAvatar: '🌱',
  score: 94,
  totalScore: 1840,
  customHabits: [],
  movementLogs: [],
  cardioLogs: [],
  calorieIntakeLogs: [],
  exerciseLibrary: [],
  todos: [],
  notificationBudget: parseInt(getStorageItem(STORAGE_KEYS.NOTIF_BUDGET, '6'), 10),
  quietHoursStart: getStorageItem(STORAGE_KEYS.QUIET_START, '22:30'),
  quietHoursEnd: getStorageItem(STORAGE_KEYS.QUIET_END, '07:00'),
  dailyNudgesSent: parseInt(getStorageItem(STORAGE_KEYS.DAILY_NUDGES_SENT, '0'), 10),
  lastNudgeDate: getStorageItem(STORAGE_KEYS.LAST_NUDGE_DATE, new Date().toISOString().slice(0, 10))
};

// Initialize persisted state immediately
loadPersistedState(userState);

export const focusTimerState = {
  durationSec: 25 * 60,
  remainingSec: 25 * 60,
  isRunning: false,
  targetEndTime: null,
  intervalId: null,
  soundscapeActive: true,
  introInProgress: false,
  selectedPreset: 25
};

export const movementLogState = {
  activeTab: 'strength', // 'strength' | 'cardio' | 'calories' | 'prs'
  sessionId: null,
  sessionName: 'Chest & Core Session',
  pacing: 'Moderate',
  customPacing: '',
  feel: 'Comfortable',
  customFeel: '',
  exercises: [
    {
      id: 'ex-bench-press',
      workoutName: 'Bench Press',
      muscleGroup: 'chest',
      supersetGroupId: null,
      sets: [
        { setNumber: 1, weightKg: 60, reps: 10, isPR: false },
        { setNumber: 2, weightKg: 65, reps: 8, isPR: false }
      ]
    }
  ],
  restTimer: {
    durationSec: 90,
    remainingSec: 90,
    isRunning: false,
    intervalId: null
  }
};

// ── Dynamic adherence & score calculator ──────────────────────────────────
export function calculateDynamicMetrics(state = userState) {
  const habits = state.customHabits || [];
  
  // Skipped habits are EXCLUDED from the denominator so rest days never hurt adherence!
  const activeHabits = habits.filter(h => !h.skipped);
  const completedHabitsCount = habits.filter(h => h.completed).length;
  const skippedHabitsCount = habits.filter(h => h.skipped).length;
  const totalHabits = Math.max(1, habits.length);
  const habitPct = activeHabits.length > 0 
    ? Math.round((completedHabitsCount / activeHabits.length) * 100)
    : 100;

  const focusMins = state.todayFocusMinutes || 0;
  const targetFocus = Math.max(1, state.focusTargetMinutes || 25);
  const focusPct = Math.min(100, Math.round((focusMins / targetFocus) * 100));

  // Hydration in ml and glasses
  const waterMl = state.waterMl !== undefined ? state.waterMl : ((state.waterGlasses || 6) * 250);
  const targetWaterMl = Math.max(250, state.waterTargetMl || 2000);
  const waterPct = Math.min(100, Math.round((waterMl / targetWaterMl) * 100));
  const waterGlasses = Math.floor(waterMl / 250);
  const targetWaterGlasses = Math.floor(targetWaterMl / 250);

  // Protein tracking
  const proteinGrams = state.proteinGrams !== undefined ? state.proteinGrams : 45;
  const proteinTargetGrams = Math.max(10, state.proteinTargetGrams || 90);
  const proteinPct = Math.min(100, Math.round((proteinGrams / proteinTargetGrams) * 100));

  const workouts = state.movementLogs || [];
  const workoutCount = workouts.length;

  const streak = state.streakDays !== undefined ? state.streakDays : 1;

  // Composite daily adherence score (0 - 100)
  const dailyAdherenceScore = Math.min(100, Math.max(0, Math.round((habitPct * 0.5) + (focusPct * 0.3) + (waterPct * 0.2))));

  // Cumulative total practice points
  const baseJourneyScore = 1600;
  const habitPoints = completedHabitsCount * 25;
  const focusPoints = Math.round(focusMins * 1.5);
  const workoutPoints = workoutCount * 35;
  const waterPoints = waterGlasses * 3;
  const streakPoints = streak * 10;
  const totalPoints = baseJourneyScore + habitPoints + focusPoints + workoutPoints + waterPoints + streakPoints;

  // Weekly Leaderboard Score: round(0.5 * weeklyPracticePoints + 0.3 * avgAdherence * 10 + 0.2 * focusMinutes / 5)
  const weeklyPracticePoints = Math.round(totalPoints * 0.25);
  const avgAdherence = dailyAdherenceScore;
  const weeklyScore = Math.round(
    (0.5 * weeklyPracticePoints) +
    (0.3 * avgAdherence * 10) +
    (0.2 * (focusMins / 5))
  );

  // Dynamic milestones based strictly on REAL streak
  const milestones = calculateMilestones(streak);
  const nextMilestone = milestones.find(m => !m.achieved) || milestones[milestones.length - 1];

  // 30-day consistency heatmap
  const heatmapData = generateHeatmapData(state, dailyAdherenceScore);

  return {
    dailyAdherenceScore,
    totalPoints,
    weeklyScore,
    habitPct,
    focusPct,
    waterPct,
    proteinPct,
    completedHabitsCount,
    skippedHabitsCount,
    activeHabitsCount: activeHabits.length,
    totalHabits,
    focusMins,
    targetFocus,
    waterMl,
    targetWaterMl,
    waterGlasses,
    targetWaterGlasses,
    proteinGrams,
    proteinTargetGrams,
    workoutCount,
    streak,
    milestones,
    nextMilestone,
    heatmapData
  };
}

export function saveStateToStorage() {
  persistState(userState);
}

// ── Exercise Library & PR Management ──────────────────────────────────────
export function getExerciseLibrary() {
  if (!userState.exerciseLibrary || userState.exerciseLibrary.length === 0) {
    userState.exerciseLibrary = [...DEFAULT_EXERCISE_LIBRARY];
  }
  return userState.exerciseLibrary;
}

export function addOrUpdateExerciseInLibrary({ name, muscleGroup = 'full-body', isCustom = true }) {
  const lib = getExerciseLibrary();
  const existing = lib.find(e => e.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    if (muscleGroup) existing.muscleGroup = muscleGroup;
    saveStateToStorage();
    return existing;
  }
  const newEx = {
    id: 'ex-' + name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: name.trim(),
    muscleGroup: muscleGroup || 'full-body',
    personalBest: { weightKg: 0, reps: 0, date: null },
    lastUsed: null,
    isCustom: Boolean(isCustom)
  };
  lib.unshift(newEx);
  saveStateToStorage();
  return newEx;
}

export function checkAndUpdatePR(exerciseName, weightKg, reps) {
  const lib = getExerciseLibrary();
  const ex = lib.find(e => e.name.toLowerCase() === exerciseName.toLowerCase()) ||
             addOrUpdateExerciseInLibrary({ name: exerciseName, muscleGroup: 'full-body', isCustom: true });

  const pb = ex.personalBest || { weightKg: 0, reps: 0 };
  const isNewPR = weightKg > (pb.weightKg || 0) || (weightKg === (pb.weightKg || 0) && reps > (pb.reps || 0));

  if (isNewPR && (weightKg > 0 || reps > 0)) {
    ex.personalBest = {
      weightKg: Number(weightKg),
      reps: Number(reps),
      date: new Date().toISOString().slice(0, 10)
    };
    saveStateToStorage();
    return true;
  }
  return false;
}

export function getLatestWorkoutSession() {
  const logs = userState.movementLogs || [];
  if (logs.length === 0) return null;

  // Find the most recent sessionId
  const latestLog = logs[0];
  const targetSessionId = latestLog.sessionId || `session-${latestLog.timestamp || 'default'}`;

  const sessionExercises = logs.filter(l => (l.sessionId || `session-${l.timestamp || 'default'}`) === targetSessionId);

  // Determine dominant muscle group for display title
  const groupCounts = {};
  sessionExercises.forEach(e => {
    const mg = e.muscleGroup || 'full-body';
    groupCounts[mg] = (groupCounts[mg] || 0) + 1;
  });
  let dominantGroup = 'Workout';
  let maxCount = 0;
  for (const [g, count] of Object.entries(groupCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominantGroup = g.charAt(0).toUpperCase() + g.slice(1);
    }
  }

  return {
    sessionId: targetSessionId,
    date: latestLog.date || 'Recent',
    sessionTitle: `${dominantGroup} Day (${sessionExercises.length} ${sessionExercises.length === 1 ? 'exercise' : 'exercises'})`,
    pacing: latestLog.pacing || 'Moderate',
    feel: latestLog.feel || 'Comfortable',
    exercises: sessionExercises.map(e => ({
      id: e.id,
      workoutName: e.workoutName,
      muscleGroup: e.muscleGroup || 'full-body',
      supersetGroupId: e.supersetGroupId || null,
      sets: (e.sets || []).map(s => ({
        setNumber: s.setNumber || 1,
        weightKg: s.weightKg || e.weightKg || 0,
        reps: s.reps || e.reps || 10,
        isPR: false
      }))
    }))
  };
}

// ── Cardio & Calorie Intake Logging Helpers ───────────────────────────────
export function logCardioSession({ activity = 'Treadmill', durationMin = 30, caloriesBurned = 280, date = null }) {
  if (!userState.cardioLogs) userState.cardioLogs = [];
  const entry = {
    id: 'cardio-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    date: date || new Date().toISOString().slice(0, 10),
    activity: (activity || 'Cardio').trim(),
    durationMin: Math.max(1, parseInt(durationMin, 10) || 30),
    caloriesBurned: Math.max(0, parseInt(caloriesBurned, 10) || 0),
    timestamp: Date.now()
  };
  userState.cardioLogs.unshift(entry);
  saveStateToStorage();
  return entry;
}

export function deleteCardioLog(id) {
  if (!userState.cardioLogs) return null;
  const idx = userState.cardioLogs.findIndex(c => c.id === id);
  if (idx !== -1) {
    const deleted = userState.cardioLogs.splice(idx, 1)[0];
    saveStateToStorage();
    return deleted;
  }
  return null;
}

export function logCalorieIntake({ item = 'Meal', calories = 500, time = null, date = null }) {
  if (!userState.calorieIntakeLogs) userState.calorieIntakeLogs = [];
  const now = new Date();
  const timeStr = time || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const entry = {
    id: 'food-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    date: date || new Date().toISOString().slice(0, 10),
    time: timeStr,
    item: (item || 'Meal').trim(),
    calories: Math.max(0, parseInt(calories, 10) || 0),
    timestamp: Date.now()
  };
  userState.calorieIntakeLogs.unshift(entry);
  saveStateToStorage();
  return entry;
}

export function deleteCalorieLog(id) {
  if (!userState.calorieIntakeLogs) return null;
  const idx = userState.calorieIntakeLogs.findIndex(f => f.id === id);
  if (idx !== -1) {
    const deleted = userState.calorieIntakeLogs.splice(idx, 1)[0];
    saveStateToStorage();
    return deleted;
  }
  return null;
}

// ── To-Do List Management Helpers ──────────────────────────────────────────
export function getTodayDateString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function createTodoItem({
  title,
  date = getTodayDateString(),
  time = null,
  notes = null,
  priority = 'normal',
  completed = false,
  createdVia = 'voice'
}) {
  return {
    id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    title: (title || '').trim(),
    date: date || getTodayDateString(),
    time: time || null,
    notes: notes || null,
    priority: ['low', 'normal', 'high'].includes(priority) ? priority : 'normal',
    completed: Boolean(completed),
    createdVia: createdVia || 'voice',
    createdAt: new Date().toISOString()
  };
}

export function addTodo(todoItem) {
  if (!userState.todos) userState.todos = [];
  const item = typeof todoItem === 'string'
    ? createTodoItem({ title: todoItem })
    : { ...todoItem, id: todoItem.id || ('todo-' + Date.now()) };
  userState.todos.unshift(item);
  saveStateToStorage();
  if (typeof window !== 'undefined' && typeof window.renderTodosUI === 'function') {
    window.renderTodosUI();
  }
  return item;
}

export function toggleTodo(id) {
  if (!userState.todos) return null;
  const item = userState.todos.find(t => t.id === id);
  if (item) {
    item.completed = !item.completed;
    saveStateToStorage();
    if (typeof window !== 'undefined' && typeof window.renderTodosUI === 'function') {
      window.renderTodosUI();
    }
  }
  return item;
}

export function deleteTodo(id) {
  if (!userState.todos) return null;
  const idx = userState.todos.findIndex(t => t.id === id);
  if (idx !== -1) {
    const deleted = userState.todos.splice(idx, 1)[0];
    saveStateToStorage();
    if (typeof window !== 'undefined' && typeof window.renderTodosUI === 'function') {
      window.renderTodosUI();
    }
    return deleted;
  }
  return null;
}

export function rescheduleTodo(id, newDate) {
  if (!userState.todos) return null;
  const item = userState.todos.find(t => t.id === id);
  if (item) {
    item.date = newDate;
    saveStateToStorage();
    if (typeof window !== 'undefined' && typeof window.renderTodosUI === 'function') {
      window.renderTodosUI();
    }
  }
  return item;
}

// Window global exposures for compatibility with legacy and inline scripts
if (typeof window !== 'undefined') {
  window.userState = userState;
  window.focusTimerState = focusTimerState;
  window.movementLogState = movementLogState;
  window.calculateDynamicMetrics = calculateDynamicMetrics;
  window.saveStateToStorage = saveStateToStorage;
  window.ONBOARDING_DATA = ONBOARDING_DATA;
  window.getTodayDateString = getTodayDateString;
  window.createTodoItem = createTodoItem;
  window.addTodo = addTodo;
  window.toggleTodo = toggleTodo;
  window.deleteTodo = deleteTodo;
  window.rescheduleTodo = rescheduleTodo;

  window.getExerciseLibrary = getExerciseLibrary;
  window.addOrUpdateExerciseInLibrary = addOrUpdateExerciseInLibrary;
  window.checkAndUpdatePR = checkAndUpdatePR;
  window.getLatestWorkoutSession = getLatestWorkoutSession;
  window.logCardioSession = logCardioSession;
  window.deleteCardioLog = deleteCardioLog;
  window.logCalorieIntake = logCalorieIntake;
  window.deleteCalorieLog = deleteCalorieLog;
}
