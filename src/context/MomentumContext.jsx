import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/apiClient.js';
import { useAuth } from './AuthContext.jsx';
import { MeditativeAudio } from '../../js/services/soundscape.js';

const MomentumContext = createContext(null);

export function MomentumProvider({ children }) {
  const { user } = useAuth();

  // In-memory state (Zero localStorage / sessionStorage)
  const [state, setState] = useState(() => ({
    name: 'Adithya Mamidala',
    mantra: 'Small, steady actions today quietly shape the person you become.',
    photo: '',
    customHabits: [],
    movementLogs: [],
    cardioLogs: [],
    calorieIntakeLogs: [],
    exerciseLibrary: [],
    todos: [],
    waterMl: 1750,
    waterTargetMl: 2000,
    waterGlasses: 7,
    waterTargetGlasses: 8,
    proteinGrams: 45,
    proteinTargetGrams: 90,
    proteinEntries: [],
    challengeJoined: false,
    challengeNickname: 'CalmRiver',
    challengeAvatar: '🌱',
    streakDays: 1,
    todayFocusMinutes: 20,
    mindfulHours: 0.3
  }));

  // Authoritative server metrics
  const [metrics, setMetrics] = useState(() => ({
    dailyAdherenceScore: 83,
    habitPct: 83,
    focusPct: 80,
    waterPct: 88,
    proteinPct: 50,
    completedHabitsCount: 5,
    activeHabitsCount: 6,
    eligibleHabitsCount: 6,
    waterMl: 1750,
    waterTargetMl: 2000,
    proteinGrams: 45,
    proteinTargetGrams: 90,
    focusMinutes: 20,
    focusTargetMinutes: 25,
    streak: 12,
    totalPoints: 1931
  }));

  const [nextUp, setNextUp] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [networkError, setNetworkError] = useState(null);

  // Floating Rest Timer State
  const [restTimer, setRestTimer] = useState({
    active: false,
    duration: 90,
    remaining: 90
  });

  // Undo Buffer State (10-second undo window)
  const [undoState, setUndoState] = useState({
    visible: false,
    message: '',
    undoFn: null,
    duration: 10
  });

  // Toast notifications
  const [toast, setToast] = useState({ visible: false, message: '' });

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => {
      setToast((prev) => (prev.message === message ? { ...prev, visible: false } : prev));
    }, 3200);
  }, []);

  // Meal Scanner Modal
  const [mealScannerOpen, setMealScannerOpen] = useState(false);
  const openMealScanner = useCallback(() => setMealScannerOpen(true), []);
  const closeMealScanner = useCallback(() => setMealScannerOpen(false), []);

  // ── Fetch all authoritative data from server ──
  const refreshAll = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoadingData(true);
      setNetworkError(null);

      const [todayData, todosData, workoutsData, exercisesData] = await Promise.all([
        api.get('/today').catch(() => null),
        api.get('/todos').catch(() => ({ todos: [] })),
        api.get('/workouts').catch(() => ({ workouts: [] })),
        api.get('/workouts/exercises').catch(() => ({ exercises: [] }))
      ]);

      if (todayData) {
        setMetrics(todayData.metrics);
        setNextUp(todayData.nextUp);

        setState((prev) => ({
          ...prev,
          name: todayData.user?.displayName || prev.name,
          mantra: todayData.user?.mantra || prev.mantra,
          photo: todayData.user?.photoURL || prev.photo,
          customHabits: (todayData.rituals || []).map((r) => ({
            id: r.id,
            title: r.name,
            anchor: r.anchor,
            category: r.category,
            scheduledTime: r.time,
            completed: Boolean(r.completed),
            skipped: Boolean(r.skipped),
            streak: r.streak || 0
          })),
          waterMl: todayData.metrics.waterMl,
          waterTargetMl: todayData.metrics.waterTargetMl,
          waterGlasses: Math.floor(todayData.metrics.waterMl / 250),
          waterTargetGlasses: Math.floor(todayData.metrics.waterTargetMl / 250),
          proteinGrams: todayData.metrics.proteinGrams,
          proteinTargetGrams: todayData.metrics.proteinTargetGrams,
          proteinEntries: (todayData.proteinEntries || []).map((p) => ({
            id: p._id,
            amount: p.grams,
            label: p.label,
            calories: p.calories,
            timestamp: new Date(p.loggedAt).getTime(),
            time: new Date(p.loggedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          })),
          todos: (todosData?.todos || []).map((t) => ({
            id: t._id,
            title: t.title,
            priority: t.priority,
            dueDate: t.dueDate,
            completed: t.status === 'completed'
          })),
          movementLogs: workoutsData?.workouts || [],
          exerciseLibrary: exercisesData?.exercises || [],
          streakDays: todayData.metrics.streak
        }));
      }
    } catch (err) {
      console.warn('Network sync error:', err);
      setNetworkError(err.message || 'Unable to connect to server');
    } finally {
      setIsLoadingData(false);
    }
  }, [user]);

  // Initial fetch and focus revalidation
  useEffect(() => {
    refreshAll();
    const handleFocus = () => refreshAll();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshAll]);

  // Rest Timer Interval
  useEffect(() => {
    let interval = null;
    if (restTimer.active && restTimer.remaining > 0) {
      interval = setInterval(() => {
        setRestTimer((prev) => {
          if (prev.remaining <= 1) {
            try { MeditativeAudio.playChime(); } catch {}
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
    setRestTimer({ active: true, duration: seconds, remaining: seconds });
    showToast(`⏱ Rest timer started (${seconds}s)`);
  }, [showToast]);

  const dismissRestTimer = useCallback(() => {
    setRestTimer((prev) => ({ ...prev, active: false }));
  }, []);

  // 10-Second Undo Management
  const triggerUndo = useCallback((message, undoFn) => {
    setUndoState({
      visible: true,
      message,
      undoFn,
      duration: 10
    });
  }, []);

  const performUndo = useCallback(() => {
    if (undoState.undoFn) {
      undoState.undoFn();
    }
    setUndoState({ visible: false, message: '', undoFn: null, duration: 10 });
    showToast('↩ Restored from undo buffer');
    try { MeditativeAudio.playChime(); } catch {}
  }, [undoState, showToast]);

  const dismissUndo = useCallback(() => {
    setUndoState({ visible: false, message: '', undoFn: null, duration: 10 });
  }, []);

  // ── Habit / Ritual Actions ──
  const checkinRitual = useCallback(async (id) => {
    // 1. Optimistic update
    setState((prev) => ({
      ...prev,
      customHabits: prev.customHabits.map((h) =>
        h.id === id ? { ...h, completed: true, skipped: false } : h
      )
    }));
    try { MeditativeAudio.playChime(); } catch {}

    triggerUndo('Ritual checked in', async () => {
      // Undo rollback
      setState((prev) => ({
        ...prev,
        customHabits: prev.customHabits.map((h) => (h.id === id ? { ...h, completed: false } : h))
      }));
      await refreshAll();
    });

    try {
      const res = await api.post(`/rituals/${id}/checkin`, {});
      if (res?.overview) {
        setMetrics(res.overview.metrics);
        setNextUp(res.overview.nextUp);
      }
    } catch (err) {
      showToast(`Sync error: ${err.message}`);
      await refreshAll();
    }
  }, [triggerUndo, showToast, refreshAll]);

  const skipHabitForToday = useCallback(async (id) => {
    setState((prev) => ({
      ...prev,
      customHabits: prev.customHabits.map((h) =>
        h.id === id ? { ...h, completed: false, skipped: true } : h
      )
    }));
    showToast('Rest day honored ("Skip for today")');

    try {
      const res = await api.post(`/rituals/${id}/skip`, {});
      if (res?.overview) {
        setMetrics(res.overview.metrics);
        setNextUp(res.overview.nextUp);
      }
    } catch (err) {
      showToast(`Error skipping ritual: ${err.message}`);
      await refreshAll();
    }
  }, [showToast, refreshAll]);

  const toggleHabit = useCallback((id) => {
    const habit = state.customHabits.find((h) => h.id === id);
    if (!habit?.completed) {
      checkinRitual(id);
    } else {
      skipHabitForToday(id);
    }
  }, [state.customHabits, checkinRitual, skipHabitForToday]);

  const addCustomHabit = useCallback(async (habit) => {
    try {
      const res = await api.post('/rituals', {
        name: habit.title || habit.name,
        category: habit.category || 'Health',
        anchor: habit.anchor || '',
        time: habit.scheduledTime || '08:00'
      });
      showToast(`Added ritual: ${res.ritual.name}`);
      await refreshAll();
      return res.ritual;
    } catch (err) {
      showToast(`Failed to add ritual: ${err.message}`);
      throw err;
    }
  }, [showToast, refreshAll]);

  const deleteCustomHabit = useCallback(async (id) => {
    try {
      await api.delete(`/rituals/${id}`);
      showToast('Ritual archived');
      await refreshAll();
    } catch (err) {
      showToast(`Failed to delete ritual: ${err.message}`);
    }
  }, [showToast, refreshAll]);

  // ── Water Hydration Actions ──
  const incrementWater = useCallback(async (amount = 250) => {
    // Optimistic update
    setState((prev) => {
      const nextMl = prev.waterMl + amount;
      return {
        ...prev,
        waterMl: nextMl,
        waterGlasses: Math.floor(nextMl / 250)
      };
    });
    setMetrics((prev) => ({
      ...prev,
      waterMl: prev.waterMl + amount,
      waterPct: Math.min(100, Math.round(((prev.waterMl + amount) / prev.waterTargetMl) * 100))
    }));
    try { MeditativeAudio.playChime(); } catch {}

    try {
      const res = await api.post('/hydration', { amountMl: amount });
      if (res?.overview) {
        setMetrics(res.overview.metrics);
        setNextUp(res.overview.nextUp);
      }
    } catch (err) {
      showToast(`Failed to log water: ${err.message}`);
      await refreshAll();
    }
  }, [showToast, refreshAll]);

  const decrementWater = useCallback(async (amount = 250) => {
    setState((prev) => {
      const nextMl = Math.max(0, prev.waterMl - amount);
      return {
        ...prev,
        waterMl: nextMl,
        waterGlasses: Math.floor(nextMl / 250)
      };
    });

    try {
      const res = await api.post('/hydration', { amountMl: -amount });
      if (res?.overview) {
        setMetrics(res.overview.metrics);
        setNextUp(res.overview.nextUp);
      }
    } catch (err) {
      await refreshAll();
    }
  }, [refreshAll]);

  const setWaterMl = useCallback(async (ml) => {
    setState((prev) => ({
      ...prev,
      waterMl: ml,
      waterGlasses: Math.floor(ml / 250)
    }));
    await api.post('/hydration', { amountMl: ml }).catch(() => {});
    await refreshAll();
  }, [refreshAll]);

  // ── Protein Tracker Actions ──
  const addProtein = useCallback(async (grams, label = 'Protein portion') => {
    // Optimistic update
    const tempId = 'temp-' + Date.now();
    setState((prev) => ({
      ...prev,
      proteinGrams: prev.proteinGrams + Number(grams),
      proteinEntries: [
        {
          id: tempId,
          amount: Number(grams),
          label,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          timestamp: Date.now()
        },
        ...prev.proteinEntries
      ]
    }));
    showToast(`Logged +${grams}g protein (${label})`);

    try {
      const res = await api.post('/protein', {
        grams: Number(grams),
        label,
        calories: Math.round(Number(grams) * 4)
      });
      if (res?.overview) {
        setMetrics(res.overview.metrics);
        setNextUp(res.overview.nextUp);
      }
    } catch (err) {
      showToast(`Failed to log protein: ${err.message}`);
      await refreshAll();
    }
  }, [showToast, refreshAll]);

  const deleteProteinEntry = useCallback(async (id) => {
    // Optimistic delete
    const target = state.proteinEntries.find((e) => e.id === id);
    setState((prev) => ({
      ...prev,
      proteinGrams: Math.max(0, prev.proteinGrams - (target?.amount || 0)),
      proteinEntries: prev.proteinEntries.filter((e) => e.id !== id)
    }));

    triggerUndo('Removed protein entry', async () => {
      // Restore on server
      await api.post(`/protein/${id}/restore`, {}).catch(() => {});
      await refreshAll();
    });

    try {
      await api.delete(`/protein/${id}`);
    } catch (err) {
      showToast(`Delete failed: ${err.message}`);
      await refreshAll();
    }
  }, [state.proteinEntries, triggerUndo, showToast, refreshAll]);

  const updateProteinGoal = useCallback(async (newGoal) => {
    const goal = Math.max(20, Math.min(300, parseInt(newGoal, 10) || 90));
    setState((prev) => ({ ...prev, proteinTargetGrams: goal }));
    await api.put('/profile', { goals: { proteinG: goal } }).catch(() => {});
    showToast(`Updated daily protein target to ${goal}g`);
  }, [showToast]);

  // ── Focus Session Actions ──
  const addFocusMinutes = useCallback(async (mins, intention = 'Deep mindful focus') => {
    setState((prev) => ({
      ...prev,
      todayFocusMinutes: (prev.todayFocusMinutes || 0) + mins
    }));
    showToast(`✨ Completed ${mins} mins of mindful focus.`);

    try {
      const res = await api.post('/focus/sessions', {
        plannedMin: mins,
        actualMin: mins,
        intention,
        completed: true
      });
      if (res?.overview) {
        setMetrics(res.overview.metrics);
        setNextUp(res.overview.nextUp);
      }
    } catch (err) {
      await refreshAll();
    }
  }, [showToast, refreshAll]);

  // ── Movement & Workout Actions ──
  const saveWorkoutSession = useCallback(async (sessionData) => {
    const { exercises, pacing, feel } = sessionData;

    try {
      for (const ex of exercises) {
        await api.post('/workouts', {
          workoutName: ex.workoutName,
          muscleGroup: ex.muscleGroup || 'full-body',
          sets: ex.sets || [{ weightKg: 0, reps: 10 }],
          pacing: pacing || 'Moderate',
          feel: feel || 'Comfortable'
        });
      }
      showToast(`⚡ Saved workout: ${exercises.length} ${exercises.length === 1 ? 'exercise' : 'exercises'}`);
      await refreshAll();
    } catch (err) {
      showToast(`Workout sync failed: ${err.message}`);
    }
  }, [showToast, refreshAll]);

  const logCardio = useCallback(async (cardio) => {
    showToast(`🏃 Cardio noted: ${cardio.activity}`);
    await refreshAll();
  }, [showToast, refreshAll]);

  const removeCardio = useCallback(() => {}, []);
  const logCalories = useCallback(() => {}, []);
  const removeCalories = useCallback(() => {}, []);

  // ── To-Do Actions ──
  const addTodoTask = useCallback(async (todo) => {
    try {
      const res = await api.post('/todos', {
        title: todo.title || todo.text,
        priority: todo.priority || 'normal',
        dueDate: todo.dueDate || ''
      });
      showToast(`Task added: "${res.todo.title}"`);
      await refreshAll();
      return res.todo;
    } catch (err) {
      showToast(`Failed to add task: ${err.message}`);
    }
  }, [showToast, refreshAll]);

  const toggleTodoTask = useCallback(async (id) => {
    const todo = state.todos.find((t) => t.id === id);
    const nextStatus = todo?.completed ? 'pending' : 'completed';

    setState((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    }));

    try {
      await api.put(`/todos/${id}`, { status: nextStatus });
    } catch (err) {
      await refreshAll();
    }
  }, [state.todos, refreshAll]);

  const deleteTodoTask = useCallback(async (id) => {
    setState((prev) => ({
      ...prev,
      todos: prev.todos.filter((t) => t.id !== id)
    }));

    triggerUndo('Task moved to undo buffer', async () => {
      await api.post(`/todos/${id}/restore`, {}).catch(() => {});
      await refreshAll();
    });

    try {
      await api.delete(`/todos/${id}`);
    } catch (err) {
      await refreshAll();
    }
  }, [triggerUndo, refreshAll]);

  const editTodoTask = useCallback(async (id, updates) => {
    try {
      await api.put(`/todos/${id}`, updates);
      await refreshAll();
      showToast('Task updated.');
    } catch (err) {
      showToast(`Update failed: ${err.message}`);
    }
  }, [showToast, refreshAll]);

  // ── Challenge Actions ──
  const joinChallenge = useCallback(async ({ nickname, avatar }) => {
    try {
      await api.post('/challenge/join', { nickname, avatar });
      showToast('🌿 Joined the Weekly Challenge circle!');
      await refreshAll();
    } catch (err) {
      showToast(`Challenge join failed: ${err.message}`);
    }
  }, [showToast, refreshAll]);

  const leaveChallenge = useCallback(async () => {
    try {
      await api.post('/challenge/leave', {});
      showToast('Left the challenge. Your rhythm remains private.');
      await refreshAll();
    } catch (err) {
      showToast(`Error leaving challenge: ${err.message}`);
    }
  }, [showToast, refreshAll]);

  // ── Profile Actions ──
  const updateProfile = useCallback(async ({ name, mantra }) => {
    try {
      await api.put('/profile', { displayName: name, mantra });
      showToast('Profile updated successfully.');
      await refreshAll();
    } catch (err) {
      showToast(`Profile update failed: ${err.message}`);
    }
  }, [showToast, refreshAll]);

  const value = {
    state,
    metrics,
    nextUp,
    isLoadingData,
    networkError,
    refreshAll,
    restTimer,
    startRestTimer,
    dismissRestTimer,
    undoState,
    performUndo,
    dismissUndo,
    triggerUndoableAction: triggerUndo,
    toast,
    showToast,
    // Habits
    toggleHabit,
    checkinRitual,
    skipHabitForToday,
    resetHabit: checkinRitual,
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
    // Meal Scanner
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
