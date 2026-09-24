import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  userState as rawUserState,
  focusTimerState as rawFocusState,
  movementLogState as rawMovementState,
  calculateDynamicMetrics,
  saveStateToStorage,
  getExerciseLibrary,
  addOrUpdateExerciseInLibrary,
  checkAndUpdatePR,
  getLatestWorkoutSession,
  logCardioSession,
  deleteCardioLog,
  logCalorieIntake,
  deleteCalorieLog,
  addTodo,
  toggleTodo,
  deleteTodo,
  rescheduleTodo,
  createTodoItem
} from '../../js/state.js';
import { STORAGE_KEYS } from '../../js/storage.js';
import { MeditativeAudio } from '../../js/services/soundscape.js';

const MomentumContext = createContext(null);

export function MomentumProvider({ children }) {
  // Reactive copy of userState
  const [state, setState] = useState(() => ({
    ...rawUserState,
    customHabits: [...(rawUserState.customHabits || [])],
    movementLogs: [...(rawUserState.movementLogs || [])],
    cardioLogs: [...(rawUserState.cardioLogs || [])],
    calorieIntakeLogs: [...(rawUserState.calorieIntakeLogs || [])],
    exerciseLibrary: [...(rawUserState.exerciseLibrary || [])],
    todos: [...(rawUserState.todos || [])],
    waterMl: rawUserState.waterMl !== undefined ? rawUserState.waterMl : 1500,
    waterTargetMl: rawUserState.waterTargetMl || 2000,
    waterGlasses: Math.floor((rawUserState.waterMl !== undefined ? rawUserState.waterMl : 1500) / 250),
    waterTargetGlasses: Math.floor((rawUserState.waterTargetMl || 2000) / 250),
    proteinGrams: rawUserState.proteinGrams !== undefined ? rawUserState.proteinGrams : 45,
    proteinTargetGrams: rawUserState.proteinTargetGrams || 90,
    proteinEntries: [...(rawUserState.proteinEntries || [
      { id: 'pe-1', time: '08:30 AM', amount: 25, label: 'Whey shake', timestamp: Date.now() - 14400000 },
      { id: 'pe-2', time: '12:45 PM', amount: 20, label: 'Greek yogurt & seeds', timestamp: Date.now() - 7200000 }
    ])],
    challengeJoined: Boolean(rawUserState.challengeJoined),
    challengeNickname: rawUserState.challengeNickname || 'CalmRiver',
    challengeAvatar: rawUserState.challengeAvatar || '🌱',
    streakDays: rawUserState.streakDays !== undefined ? rawUserState.streakDays : 1
  }));

  // Floating Rest Timer State
  const [restTimer, setRestTimer] = useState({
    active: false,
    duration: 90,
    remaining: 90
  });

  // Undo Buffer State (10-second undo)
  const [undoState, setUndoState] = useState({
    visible: false,
    message: '',
    snapshot: null,
    duration: 10
  });

  // Toast notifications
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast(prev => prev.message === message ? { ...prev, visible: false } : prev);
    }, 3200);
  }, []);

  // Sync state back to rawUserState and localStorage
  const syncState = useCallback((updater) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      // Mirror onto singleton rawUserState
      Object.assign(rawUserState, next);
      saveStateToStorage(rawUserState);
      return next;
    });
  }, []);

  // Rest Timer Interval
  useEffect(() => {
    let interval = null;
    if (restTimer.active && restTimer.remaining > 0) {
      interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev.remaining <= 1) {
            // Play soothing singing bowl chime when rest finishes
            try { MeditativeAudio.playChime(); } catch (e) {}
            showToast('🔔 Rest timer complete! Ready for next set.');
            return { ...prev, active: false, remaining: 0 };
          }
          return { ...prev, remaining: prev.remaining - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [restTimer.active, restTimer.remaining, showToast]);

  const startRestTimer = useCallback((seconds = 90) => {
    setRestTimer({
      active: true,
      duration: seconds,
      remaining: seconds
    });
    showToast(`⏱ Rest timer started (${seconds}s)`);
  }, [showToast]);

  const dismissRestTimer = useCallback(() => {
    setRestTimer(prev => ({ ...prev, active: false }));
  }, []);

  // Meal Scanner Modal
  const [mealScannerOpen, setMealScannerOpen] = useState(false);
  const openMealScanner = useCallback(() => setMealScannerOpen(true), []);
  const closeMealScanner = useCallback(() => setMealScannerOpen(false), []);

  // 10-Second Undo Management
  const triggerUndoableAction = useCallback((message, actionFn) => {
    // Take deep snapshot of current state
    const snapshot = {
      habits: JSON.parse(JSON.stringify(state.customHabits || [])),
      todos: JSON.parse(JSON.stringify(state.todos || [])),
      waterMl: state.waterMl,
      proteinGrams: state.proteinGrams,
      proteinEntries: JSON.parse(JSON.stringify(state.proteinEntries || [])),
      movementLogs: JSON.parse(JSON.stringify(state.movementLogs || [])),
      calorieIntakeLogs: JSON.parse(JSON.stringify(state.calorieIntakeLogs || []))
    };

    actionFn();

    setUndoState({
      visible: true,
      message,
      snapshot,
      duration: 10
    });
  }, [state]);

  const performUndo = useCallback(() => {
    if (!undoState.snapshot) return;
    const { habits, todos, waterMl, proteinGrams, proteinEntries, movementLogs } = undoState.snapshot;
    syncState(prev => ({
      ...prev,
      customHabits: habits,
      todos: todos,
      waterMl: waterMl !== undefined ? waterMl : prev.waterMl,
      waterGlasses: Math.floor((waterMl !== undefined ? waterMl : prev.waterMl) / 250),
      proteinGrams: proteinGrams !== undefined ? proteinGrams : prev.proteinGrams,
      proteinEntries: proteinEntries || prev.proteinEntries,
      movementLogs: movementLogs || prev.movementLogs
    }));
    setUndoState({ visible: false, message: '', snapshot: null, duration: 10 });
    showToast('↩ Undone — previous state restored.');
    try { MeditativeAudio.playChime(); } catch (e) {}
  }, [undoState.snapshot, syncState, showToast]);

  const dismissUndo = useCallback(() => {
    setUndoState({ visible: false, message: '', snapshot: null, duration: 10 });
  }, []);

  // Habit Actions
  const toggleHabit = useCallback((id) => {
    triggerUndoableAction('Habit status updated', () => {
      syncState(prev => ({
        ...prev,
        customHabits: prev.customHabits.map(h => {
          if (h.id === id) {
            const nextCompleted = !h.completed;
            if (nextCompleted) {
              try { MeditativeAudio.playChime(); } catch (e) {}
            }
            return { ...h, completed: nextCompleted, skipped: false };
          }
          return h;
        })
      }));
    });
  }, [triggerUndoableAction, syncState]);

  const skipHabitForToday = useCallback((id) => {
    triggerUndoableAction('Rest day honored ("Skip for Today")', () => {
      syncState(prev => ({
        ...prev,
        customHabits: prev.customHabits.map(h => 
          h.id === id ? { ...h, completed: false, skipped: true } : h
        )
      }));
    });
  }, [triggerUndoableAction, syncState]);

  const resetHabit = useCallback((id) => {
    triggerUndoableAction('Habit reset to pending', () => {
      syncState(prev => ({
        ...prev,
        customHabits: prev.customHabits.map(h => 
          h.id === id ? { ...h, completed: false, skipped: false } : h
        )
      }));
    });
  }, [triggerUndoableAction, syncState]);

  const addCustomHabit = useCallback((habit) => {
    const newHabit = {
      id: 'habit-' + Date.now(),
      title: habit.title.trim(),
      icon: habit.icon || 'self_improvement',
      anchor: habit.anchor || 'Daily ritual cue',
      category: habit.category || 'Mind',
      color: habit.color || 'emerald',
      completed: false,
      skipped: false,
      scheduledTime: habit.scheduledTime || '08:00',
      priority: habit.priority || 'normal'
    };
    syncState(prev => ({
      ...prev,
      customHabits: [newHabit, ...prev.customHabits]
    }));
    showToast(`Added ritual: ${newHabit.title}`);
    return newHabit;
  }, [syncState, showToast]);

  const deleteCustomHabit = useCallback((id) => {
    triggerUndoableAction('Ritual deleted', () => {
      syncState(prev => ({
        ...prev,
        customHabits: prev.customHabits.filter(h => h.id !== id)
      }));
    });
  }, [triggerUndoableAction, syncState]);

  // Water Hydration (in ml & glasses, step 250ml)
  const incrementWater = useCallback((amount = 250) => {
    syncState(prev => {
      const current = prev.waterMl !== undefined ? prev.waterMl : 1500;
      const target = prev.waterTargetMl || 2000;
      const nextMl = Math.min(target + 1000, current + amount);
      return {
        ...prev,
        waterMl: nextMl,
        waterGlasses: Math.floor(nextMl / 250)
      };
    });
  }, [syncState]);

  const decrementWater = useCallback((amount = 250) => {
    syncState(prev => {
      const current = prev.waterMl !== undefined ? prev.waterMl : 1500;
      const nextMl = Math.max(0, current - amount);
      return {
        ...prev,
        waterMl: nextMl,
        waterGlasses: Math.floor(nextMl / 250)
      };
    });
  }, [syncState]);

  const setWaterMl = useCallback((ml) => {
    syncState(prev => {
      const nextMl = Math.max(0, ml);
      return {
        ...prev,
        waterMl: nextMl,
        waterGlasses: Math.floor(nextMl / 250)
      };
    });
  }, [syncState]);

  // Protein Tracker Actions
  const addProtein = useCallback((grams, label = 'Quick protein') => {
    triggerUndoableAction(`Logged +${grams}g protein (${label})`, () => {
      const entry = {
        id: 'pe-' + Date.now(),
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        amount: Number(grams),
        label: label,
        timestamp: Date.now()
      };

      syncState(prev => {
        const nextGrams = (prev.proteinGrams || 0) + Number(grams);
        const nextEntries = [entry, ...(prev.proteinEntries || [])];
        return {
          ...prev,
          proteinGrams: nextGrams,
          proteinEntries: nextEntries
        };
      });
    });
  }, [triggerUndoableAction, syncState]);

  const deleteProteinEntry = useCallback((entryId) => {
    triggerUndoableAction('Removed protein entry', () => {
      syncState(prev => {
        const target = (prev.proteinEntries || []).find(e => e.id === entryId);
        const diff = target ? target.amount : 0;
        const nextEntries = (prev.proteinEntries || []).filter(e => e.id !== entryId);
        const nextGrams = Math.max(0, (prev.proteinGrams || 0) - diff);
        return {
          ...prev,
          proteinGrams: nextGrams,
          proteinEntries: nextEntries
        };
      });
    });
  }, [triggerUndoableAction, syncState]);

  const updateProteinGoal = useCallback((newGoal) => {
    const goal = Math.max(20, Math.min(300, parseInt(newGoal, 10) || 90));
    syncState(prev => ({
      ...prev,
      proteinTargetGrams: goal
    }));
    showToast(`Updated daily protein target to ${goal}g`);
  }, [syncState, showToast]);

  // Focus Minutes Update
  const addFocusMinutes = useCallback((mins, intention = '') => {
    syncState(prev => ({
      ...prev,
      todayFocusMinutes: (prev.todayFocusMinutes || 0) + mins,
      mindfulHours: parseFloat(((prev.mindfulHours || 0) + (mins / 60)).toFixed(1))
    }));
    showToast(`✨ Completed ${mins} mins of mindful focus.`);
  }, [syncState, showToast]);

  // Movement & Workout Logs
  const saveWorkoutSession = useCallback((sessionData) => {
    const { exercises, pacing, feel, sessionTitle } = sessionData;
    const sessionId = 'session-' + Date.now();
    const dateStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const newLogs = exercises.map(ex => {
      // Check PR
      ex.sets.forEach(s => {
        checkAndUpdatePR(ex.workoutName, s.weightKg, s.reps);
      });

      const maxWeight = Math.max(...ex.sets.map(s => s.weightKg || 0));
      const maxReps = Math.max(...ex.sets.map(s => s.reps || 0));

      return {
        id: 'move-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        date: dateStr,
        workoutName: ex.workoutName,
        muscleGroup: ex.muscleGroup || 'full-body',
        sets: ex.sets,
        setsCount: ex.sets.length,
        reps: maxReps,
        weightKg: maxWeight,
        pacing: pacing || 'Moderate',
        feel: feel || 'Comfortable',
        mode: 'strength',
        summary: `${ex.workoutName}: ${ex.sets.length} sets · ${maxReps} reps @ ${maxWeight}kg`,
        supersetGroupId: ex.supersetGroupId || null,
        sessionId,
        timestamp: Date.now()
      };
    });

    syncState(prev => ({
      ...prev,
      movementLogs: [...newLogs, ...(prev.movementLogs || [])],
      exerciseLibrary: getExerciseLibrary()
    }));

    showToast(`⚡ Saved workout: ${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'}`);
  }, [syncState, showToast]);

  // Cardio & Calorie logging
  const logCardio = useCallback((cardio) => {
    const entry = logCardioSession(cardio);
    syncState(prev => ({
      ...prev,
      cardioLogs: [entry, ...(prev.cardioLogs || [])]
    }));
    showToast(`🏃 Logged cardio: ${entry.activity} (${entry.durationMin}m)`);
  }, [syncState, showToast]);

  const removeCardio = useCallback((id) => {
    deleteCardioLog(id);
    syncState(prev => ({
      ...prev,
      cardioLogs: prev.cardioLogs.filter(c => c.id !== id)
    }));
  }, [syncState]);

  const logCalories = useCallback((intake) => {
    const entry = logCalorieIntake(intake);
    syncState(prev => ({
      ...prev,
      calorieIntakeLogs: [entry, ...(prev.calorieIntakeLogs || [])]
    }));
    showToast(`🥗 Logged: ${entry.item} (${entry.calories} kcal)`);
  }, [syncState, showToast]);

  const removeCalories = useCallback((id) => {
    deleteCalorieLog(id);
    syncState(prev => ({
      ...prev,
      calorieIntakeLogs: prev.calorieIntakeLogs.filter(f => f.id !== id)
    }));
  }, [syncState]);

  // To-Dos
  const addTodoTask = useCallback((todo) => {
    const item = addTodo(todo);
    syncState(prev => ({
      ...prev,
      todos: [item, ...(prev.todos.filter(t => t.id !== item.id))]
    }));
    showToast(`Task added: "${item.title}"`);
    return item;
  }, [syncState, showToast]);

  const toggleTodoTask = useCallback((id) => {
    triggerUndoableAction('Task status toggled', () => {
      toggleTodo(id);
      syncState(prev => ({
        ...prev,
        todos: prev.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
      }));
    });
  }, [triggerUndoableAction, syncState]);

  const deleteTodoTask = useCallback((id) => {
    triggerUndoableAction('Task removed', () => {
      deleteTodo(id);
      syncState(prev => ({
        ...prev,
        todos: prev.todos.filter(t => t.id !== id)
      }));
    });
  }, [triggerUndoableAction, syncState]);

  const editTodoTask = useCallback((id, updates) => {
    syncState(prev => ({
      ...prev,
      todos: prev.todos.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
    showToast('Task updated.');
  }, [syncState, showToast]);

  // Challenge (Weekly Leaderboard) Actions
  const joinChallenge = useCallback(({ nickname, avatar }) => {
    syncState(prev => ({
      ...prev,
      challengeJoined: true,
      challengeNickname: nickname || prev.challengeNickname || 'CalmRiver',
      challengeAvatar: avatar || prev.challengeAvatar || '🌱'
    }));
    showToast('🌿 Joined the Weekly Challenge circle!');
  }, [syncState, showToast]);

  const leaveChallenge = useCallback(() => {
    syncState(prev => ({
      ...prev,
      challengeJoined: false
    }));
    showToast('Left the challenge. Your rhythm remains private.');
  }, [syncState, showToast]);

  // Profile Edit
  const updateProfile = useCallback(({ name, mantra, photo }) => {
    syncState(prev => ({
      ...prev,
      name: name !== undefined ? name : prev.name,
      mantra: mantra !== undefined ? mantra : prev.mantra,
      photo: photo !== undefined ? photo : prev.photo
    }));
    if (name) localStorage.setItem(STORAGE_KEYS.PROFILE_NAME, name);
    if (mantra) localStorage.setItem(STORAGE_KEYS.PROFILE_MANTRA, mantra);
    if (photo) localStorage.setItem(STORAGE_KEYS.PROFILE_PHOTO, photo);
    showToast('Profile updated successfully.');
  }, [syncState, showToast]);

  // Derived metrics (strictly calculated from single state object)
  const metrics = calculateDynamicMetrics(state);

  const value = {
    state,
    metrics,
    restTimer,
    startRestTimer,
    dismissRestTimer,
    undoState,
    performUndo,
    dismissUndo,
    triggerUndoableAction,
    syncState,
    toast,
    showToast,
    // Habits
    toggleHabit,
    skipHabitForToday,
    resetHabit,
    addCustomHabit,
    deleteCustomHabit,
    // Hydration
    incrementWater,
    decrementWater,
    setWaterMl,
    // Protein
    addProtein,
    deleteProteinEntry,
    updateProteinGoal,
    // Focus
    addFocusMinutes,
    // Movement
    saveWorkoutSession,
    logCardio,
    removeCardio,
    logCalories,
    removeCalories,
    // Todos
    addTodoTask,
    toggleTodoTask,
    deleteTodoTask,
    editTodoTask,
    // Challenge
    joinChallenge,
    leaveChallenge,
    // Profile
    updateProfile,
    // Meal Photo Scanner
    mealScannerOpen,
    openMealScanner,
    closeMealScanner
  };

  return (
    <MomentumContext.Provider value={value}>
      {children}
    </MomentumContext.Provider>
  );
}

export function useMomentum() {
  const context = useContext(MomentumContext);
  if (!context) {
    throw new Error('useMomentum must be used within a MomentumProvider');
  }
  return context;
}
