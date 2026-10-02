import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { DEFAULT_EXERCISE_LIBRARY } from '../../../js/storage.js';
import {
  X, Plus, Timer, Trash2, Link, Trophy, Flame, Activity, Utensils, Search, Check, Sparkles
} from 'lucide-react';

export default function MovementModal({ isOpen, onClose, initialTab = 'strength' }) {
  const {
    state,
    saveWorkoutSession,
    logCardio,
    removeCardio,
    logCalories,
    removeCalories,
    startRestTimer,
    showToast
  } = useMomentum();

  const [activeTab, setActiveTab] = useState(initialTab);

  // Strength Session State
  const [exercises, setExercises] = useState([
    {
      id: 'ex-bench-press',
      workoutName: 'Bench Press',
      muscleGroup: 'chest',
      supersetGroupId: null,
      sets: [
        { setNumber: 1, weightKg: 0, reps: 10, isPR: false }
      ]
    }
  ]);
  const [pacing, setPacing] = useState('Moderate');
  const [feel, setFeel] = useState('Comfortable');

  // Exercise Picker Modal State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTargetIdx, setPickerTargetIdx] = useState(null);
  const [pickerSearch, setPickerSearch] = useState('');
  const [pickerMuscle, setPickerMuscle] = useState('all');

  // Cardio Form State
  const [cardioActivity, setCardioActivity] = useState('Treadmill');
  const [cardioDuration, setCardioDuration] = useState(30);
  const [cardioCalories, setCardioCalories] = useState(280);

  // Calories Form State
  const [foodItem, setFoodItem] = useState('');
  const [foodCalories, setFoodCalories] = useState(450);

  // PR Filter State
  const [prMuscleFilter, setPrMuscleFilter] = useState('all');

  // Authoritative user-isolated exercise library and last workout session
  const library = useMemo(() => {
    if (state.exerciseLibrary && state.exerciseLibrary.length > 0) {
      return state.exerciseLibrary;
    }
    return DEFAULT_EXERCISE_LIBRARY;
  }, [state.exerciseLibrary]);

  const lastSession = useMemo(() => {
    const logs = state.movementLogs || [];
    if (logs.length === 0) return null;

    const latestLog = logs[0];
    const targetSessionId = latestLog.sessionId || `session-${latestLog.timestamp || latestLog.id || 'default'}`;
    const sessionExercises = logs.filter(
      l => (l.sessionId || `session-${l.timestamp || l.id || 'default'}`) === targetSessionId
    );

    const groupCounts = {};
    sessionExercises.forEach(e => {
      const g = e.muscleGroup || 'Full-body';
      groupCounts[g] = (groupCounts[g] || 0) + 1;
    });
    const dominantGroup = Object.keys(groupCounts).sort((a, b) => groupCounts[b] - groupCounts[a])[0] || 'Strength';

    return {
      sessionId: targetSessionId,
      sessionTitle: `${dominantGroup.charAt(0).toUpperCase() + dominantGroup.slice(1)} Session`,
      pacing: latestLog.pacing || 'Moderate',
      feel: latestLog.feel || 'Comfortable',
      exercises: sessionExercises
    };
  }, [state.movementLogs]);

  // Filtered Exercises for Picker
  const filteredPickerExercises = useMemo(() => {
    return library.filter(ex => {
      const matchSearch = !pickerSearch.trim() || ex.name.toLowerCase().includes(pickerSearch.toLowerCase().trim());
      const matchMuscle = pickerMuscle === 'all' || ex.muscleGroup.toLowerCase() === pickerMuscle.toLowerCase();
      return matchSearch && matchMuscle;
    });
  }, [library, pickerSearch, pickerMuscle]);

  // ── Set Operations ──
  const handleAddSet = (exIdx) => {
    setExercises(prev => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const lastSet = ex.sets[ex.sets.length - 1] || { weightKg: 40, reps: 10 };
      ex.sets = [
        ...ex.sets,
        {
          setNumber: ex.sets.length + 1,
          weightKg: lastSet.weightKg,
          reps: lastSet.reps,
          isPR: false
        }
      ];
      next[exIdx] = ex;
      return next;
    });
  };

  const handleUpdateSet = (exIdx, setIdx, field, val) => {
    const numVal = Math.max(0, parseFloat(val) || 0);
    setExercises(prev => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      const sets = [...ex.sets];
      const currentSet = { ...sets[setIdx], [field]: numVal };

      // PR live auto-detection
      const libEntry = library.find(e => e.name.toLowerCase() === ex.workoutName.toLowerCase());
      const pb = libEntry?.personalBest || { weightKg: 0, reps: 0 };
      const weight = field === 'weightKg' ? numVal : currentSet.weightKg;
      const reps = field === 'reps' ? numVal : currentSet.reps;

      currentSet.isPR = (weight > pb.weightKg) || (weight === pb.weightKg && reps > pb.reps && pb.reps > 0);
      sets[setIdx] = currentSet;
      ex.sets = sets;
      next[exIdx] = ex;
      return next;
    });
  };

  const handleRemoveSet = (exIdx, setIdx) => {
    setExercises(prev => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      if (ex.sets.length <= 1) return prev;
      ex.sets = ex.sets.filter((_, i) => i !== setIdx).map((s, i) => ({ ...s, setNumber: i + 1 }));
      next[exIdx] = ex;
      return next;
    });
  };

  const handleRemoveExercise = (exIdx) => {
    if (exercises.length <= 1) {
      showToast('Session must have at least one exercise.');
      return;
    }
    setExercises(prev => prev.filter((_, i) => i !== exIdx));
  };

  const handleToggleSuperset = (exIdx) => {
    setExercises(prev => {
      const next = [...prev];
      const ex = { ...next[exIdx] };
      ex.supersetGroupId = ex.supersetGroupId ? null : 'ss_' + Date.now();
      next[exIdx] = ex;
      return next;
    });
  };

  // ── Pre-fill Last Workout ──
  const handleRepeatLast = () => {
    if (!lastSession) return;
    setPacing(lastSession.pacing || 'Moderate');
    setFeel(lastSession.feel || 'Comfortable');
    setExercises(lastSession.exercises.map((e, idx) => ({
      id: `ex-repeat-${Date.now()}-${idx}`,
      workoutName: e.workoutName,
      muscleGroup: e.muscleGroup || 'full-body',
      supersetGroupId: e.supersetGroupId || null,
      sets: (e.sets || []).map((s, sIdx) => ({
        setNumber: sIdx + 1,
        weightKg: s.weightKg || 0,
        reps: s.reps || 10,
        isPR: false
      }))
    })));
    showToast(`⚡ Pre-filled from ${lastSession.sessionTitle}`);
  };

  // ── Exercise Picker Selection ──
  const handleSelectExercise = (ex) => {
    if (pickerTargetIdx !== null && exercises[pickerTargetIdx]) {
      setExercises(prev => {
        const next = [...prev];
        next[pickerTargetIdx] = {
          ...next[pickerTargetIdx],
          workoutName: ex.name,
          muscleGroup: ex.muscleGroup
        };
        return next;
      });
    } else {
      setExercises(prev => [
        ...prev,
        {
          id: 'ex-' + Date.now(),
          workoutName: ex.name,
          muscleGroup: ex.muscleGroup,
          supersetGroupId: null,
          sets: [{ setNumber: 1, weightKg: ex.personalBest?.weightKg || 0, reps: 10, isPR: false }]
        }
      ]);
    }
    setPickerOpen(false);
  };

  // ── Submit Strength Workout ──
  const handleSaveStrength = () => {
    saveWorkoutSession({
      exercises,
      pacing,
      feel,
      sessionTitle: `${exercises[0]?.workoutName || 'Strength'} Session`
    });
    onClose();
  };

  // ── Cardio & Calorie Submissions ──
  const handleSaveCardio = (e) => {
    e.preventDefault();
    logCardio({
      activity: cardioActivity,
      durationMin: cardioDuration,
      caloriesBurned: cardioCalories
    });
  };

  const handleSaveCalories = (e) => {
    e.preventDefault();
    if (!foodItem.trim()) return;
    logCalories({
      item: foodItem.trim(),
      calories: foodCalories
    });
    setFoodItem('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-3xl bg-surface-container-lowest hairline shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 hairline-b bg-surface-container-lowest/80 flex items-start justify-between gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-primary-container">
              Fitness & Movement
            </span>
            <h2 className="font-editorial text-2xl font-normal text-on-surface mt-0.5">
              Log movement
            </h2>
            <p className="text-xs text-outline">
              Fast, customizable logging with per-set precision & PR tracking.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer border-0"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-3 pb-2 flex items-center gap-1.5 overflow-x-auto bg-surface-container-lowest hairline-b">
          {[
            { id: 'strength', label: 'Strength', icon: Flame },
            { id: 'cardio', label: 'Cardio', icon: Activity },
            { id: 'calories', label: 'Calories', icon: Utensils },
            { id: 'prs', label: 'PRs 🏆', icon: Trophy }
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-0 transition-all flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-primary-container text-white shadow-xs'
                  : 'bg-surface-container text-outline hover:text-on-surface'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* TAB: STRENGTH */}
          {activeTab === 'strength' && (
            <div className="space-y-4">
              {/* Repeat Last Workout Card */}
              {lastSession && (
                <div className="p-3.5 rounded-2xl bg-surface-container-low border border-primary-container/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary-container/10 text-primary-container flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-on-surface truncate">
                          Repeat: {lastSession.sessionTitle}
                        </span>
                        <span className="text-[10px] text-outline px-1.5 py-0.5 rounded bg-surface-container-highest shrink-0">
                          {lastSession.date}
                        </span>
                      </div>
                      <p className="text-[11px] text-outline truncate">
                        {lastSession.exercises.map(e => e.workoutName).join(', ')}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRepeatLast}
                    className="px-3 py-1.5 rounded-full bg-primary-container text-white text-xs font-semibold hover:bg-primary-container-hover transition-colors cursor-pointer border-0 shrink-0"
                  >
                    Pre-fill
                  </button>
                </div>
              )}

              {/* Exercises List */}
              <div className="space-y-3">
                {exercises.map((ex, exIdx) => {
                  const libEntry = library.find(e => e.name.toLowerCase() === ex.workoutName.toLowerCase());
                  const pb = libEntry?.personalBest || { weightKg: 0, reps: 0 };
                  const pbLabel = pb.weightKg > 0 || pb.reps > 0 ? `PB: ${pb.weightKg}kg × ${pb.reps}` : 'No prior PR';
                  const isSuperset = ex.supersetGroupId !== null;

                  return (
                    <div
                      key={ex.id || exIdx}
                      className={`p-4 rounded-2xl bg-surface-container-lowest hairline relative ${
                        isSuperset ? 'border-l-4 border-l-secondary' : ''
                      }`}
                    >
                      {/* Exercise Header */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              setPickerTargetIdx(exIdx);
                              setPickerOpen(true);
                            }}
                            className="font-bold text-sm text-on-surface hover:text-primary-container transition-colors flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0 truncate"
                          >
                            <span className="truncate">{ex.workoutName}</span>
                            <span className="text-xs text-outline">▾</span>
                          </button>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary-fixed/50 text-secondary shrink-0">
                            {ex.muscleGroup || 'Full Body'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[11px] text-outline hidden sm:inline">{pbLabel}</span>
                          <button
                            type="button"
                            onClick={() => handleToggleSuperset(exIdx)}
                            className={`p-1.5 rounded-lg cursor-pointer border-0 bg-transparent ${
                              isSuperset ? 'text-secondary bg-secondary-fixed/30' : 'text-outline hover:text-on-surface'
                            }`}
                            title="Link Superset"
                          >
                            <Link className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveExercise(exIdx)}
                            className="p-1.5 rounded-lg text-outline hover:text-error cursor-pointer border-0 bg-transparent"
                            title="Remove exercise"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Set Rows */}
                      <div className="space-y-2 mb-3">
                        {ex.sets.map((set, setIdx) => (
                          <div
                            key={setIdx}
                            className="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low hairline"
                          >
                            <span className="text-xs font-semibold text-on-surface-variant w-12 shrink-0">
                              Set {set.setNumber || setIdx + 1}
                            </span>

                            <div className="flex-1 flex items-center gap-2">
                              {/* Weight */}
                              <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-lg hairline flex-1">
                                <input
                                  type="number"
                                  value={set.weightKg}
                                  min="0"
                                  max="500"
                                  step="0.5"
                                  onChange={e => handleUpdateSet(exIdx, setIdx, 'weightKg', e.target.value)}
                                  className="w-full text-xs font-semibold text-on-surface focus:outline-none bg-transparent"
                                />
                                <span className="text-[10px] uppercase text-outline">kg</span>
                              </div>

                              {/* Reps */}
                              <div className="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-lg hairline flex-1">
                                <input
                                  type="number"
                                  value={set.reps}
                                  min="1"
                                  max="100"
                                  onChange={e => handleUpdateSet(exIdx, setIdx, 'reps', e.target.value)}
                                  className="w-full text-xs font-semibold text-on-surface focus:outline-none bg-transparent"
                                />
                                <span className="text-[10px] uppercase text-outline">reps</span>
                              </div>
                            </div>

                            {/* Live PR Badge */}
                            {set.isPR && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shrink-0">
                                PR 🎉
                              </span>
                            )}

                            {/* Rest Timer Button */}
                            <button
                              type="button"
                              onClick={() => startRestTimer(90)}
                              className="w-7 h-7 rounded-lg text-outline hover:text-primary-container flex items-center justify-center cursor-pointer border-0 bg-transparent shrink-0"
                              title="Start 90s Rest Timer"
                            >
                              <Timer className="w-4 h-4" />
                            </button>

                            {/* Remove Set */}
                            {ex.sets.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveSet(exIdx, setIdx)}
                                className="w-7 h-7 rounded-lg text-outline hover:text-error flex items-center justify-center cursor-pointer border-0 bg-transparent shrink-0"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Add Set Button */}
                      <button
                        type="button"
                        onClick={() => handleAddSet(exIdx)}
                        className="py-1.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high hairline text-xs font-medium text-primary-container flex items-center gap-1 transition-colors cursor-pointer border-0"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>+ Set</span>
                        <span className="text-[10px] text-outline ml-1 font-normal">
                          (copies previous weight & reps)
                        </span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add Exercise Button */}
              <button
                type="button"
                onClick={() => {
                  setPickerTargetIdx(null);
                  setPickerOpen(true);
                }}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-outline-variant hover:border-primary-container text-xs font-semibold text-primary-container flex items-center justify-center gap-1.5 transition-colors cursor-pointer bg-transparent"
              >
                <Plus className="w-4 h-4" />
                <span>Add Another Exercise to Session</span>
              </button>

              {/* Pacing & Feel Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-surface-container-low hairline">
                  <label className="text-xs font-semibold text-on-surface block mb-1.5">
                    Pacing
                  </label>
                  <div className="flex gap-1.5">
                    {['Slow', 'Moderate', 'Fast'].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPacing(p)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-0 transition-colors ${
                          pacing === p
                            ? 'bg-primary-container text-white font-semibold'
                            : 'bg-surface-container text-outline hover:text-on-surface'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-surface-container-low hairline">
                  <label className="text-xs font-semibold text-on-surface block mb-1.5">
                    Perceived Exertion
                  </label>
                  <div className="flex gap-1.5">
                    {['Easy', 'Comfortable', 'Challenging', 'Hard'].map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFeel(f)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-medium cursor-pointer border-0 transition-colors ${
                          feel === f
                            ? 'bg-primary-container text-white font-semibold'
                            : 'bg-surface-container text-outline hover:text-on-surface'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Session CTA */}
              <button
                type="button"
                onClick={handleSaveStrength}
                className="w-full py-3.5 rounded-full bg-primary-container hover:bg-primary-container-hover text-white text-sm font-semibold transition-all shadow-xs cursor-pointer border-0 mt-3"
              >
                Save Movement Session ({exercises.length} {exercises.length === 1 ? 'exercise' : 'exercises'})
              </button>
            </div>
          )}

          {/* TAB: CARDIO */}
          {activeTab === 'cardio' && (
            <div className="space-y-4">
              <form onSubmit={handleSaveCardio} className="p-4 rounded-2xl bg-surface-container-low hairline space-y-3">
                <h3 className="text-sm font-semibold text-on-surface">Log Cardio Session</h3>
                <div>
                  <label className="text-xs font-medium text-outline block mb-1">Activity</label>
                  <select
                    value={cardioActivity}
                    onChange={e => setCardioActivity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest hairline text-xs text-on-surface focus:outline-none"
                  >
                    <option value="Treadmill">Treadmill (Walk / Run)</option>
                    <option value="Outdoor Run">Outdoor Run</option>
                    <option value="Cycling">Indoor / Outdoor Cycling</option>
                    <option value="Rowing">Rowing Machine</option>
                    <option value="Stairmaster">Stairmaster</option>
                    <option value="Swimming">Swimming</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-outline block mb-1">Duration (Mins)</label>
                    <input
                      type="number"
                      min="1"
                      max="300"
                      value={cardioDuration}
                      onChange={e => setCardioDuration(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest hairline text-xs font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-outline block mb-1">Calories Burned (kcal)</label>
                    <input
                      type="number"
                      min="0"
                      max="3000"
                      value={cardioCalories}
                      onChange={e => setCardioCalories(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest hairline text-xs font-semibold text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-primary-container text-white text-xs font-semibold hover:bg-primary-container-hover transition-colors cursor-pointer border-0"
                >
                  Save Cardio Log
                </button>
              </form>

              {/* Past Cardio Logs */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-on-surface">Recent Cardio Logs</span>
                {(state.cardioLogs || []).length === 0 ? (
                  <p className="text-xs text-outline py-3 text-center">No cardio logged yet.</p>
                ) : (
                  (state.cardioLogs || []).slice(0, 5).map(c => (
                    <div key={c.id} className="p-3 rounded-xl bg-surface-container-lowest hairline flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-on-surface">{c.activity}</span>
                        <p className="text-[11px] text-outline">{c.durationMin} mins · {c.caloriesBurned} kcal · {c.date}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCardio(c.id)}
                        className="text-outline hover:text-error p-1 cursor-pointer border-0 bg-transparent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: CALORIES */}
          {activeTab === 'calories' && (
            <div className="space-y-4">
              <form onSubmit={handleSaveCalories} className="p-4 rounded-2xl bg-surface-container-low hairline space-y-3">
                <h3 className="text-sm font-semibold text-on-surface">Quick Calorie Intake</h3>
                <div>
                  <label className="text-xs font-medium text-outline block mb-1">Meal / Food Item</label>
                  <input
                    type="text"
                    placeholder="e.g., Post-Workout Oats & Protein"
                    value={foodItem}
                    onChange={e => setFoodItem(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest hairline text-xs text-on-surface focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-outline block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={foodCalories}
                    onChange={e => setFoodCalories(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-surface-container-lowest hairline text-xs font-semibold text-on-surface focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-primary-container text-white text-xs font-semibold hover:bg-primary-container-hover transition-colors cursor-pointer border-0"
                >
                  Save Calorie Entry
                </button>
              </form>

              {/* Past Food Logs */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-on-surface">Today's Calorie Entries</span>
                {(state.calorieIntakeLogs || []).length === 0 ? (
                  <p className="text-xs text-outline py-3 text-center">No calorie entries logged yet.</p>
                ) : (
                  (state.calorieIntakeLogs || []).slice(0, 5).map(f => (
                    <div key={f.id} className="p-3 rounded-xl bg-surface-container-lowest hairline flex items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-semibold text-on-surface">{f.item}</span>
                        <p className="text-[11px] text-outline">{f.calories} kcal · {f.time || f.date}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCalories(f.id)}
                        className="text-outline hover:text-error p-1 cursor-pointer border-0 bg-transparent"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: PRS */}
          {activeTab === 'prs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-on-surface">Verified Best Lifts</span>
                <span className="text-[10px] text-outline">Auto-updated on every PR</span>
              </div>

              {/* Muscle Filters */}
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                {['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPrMuscleFilter(m)}
                    className={`px-3 py-1 rounded-full text-xs font-medium cursor-pointer border-0 transition-colors shrink-0 capitalize ${
                      prMuscleFilter === m
                        ? 'bg-primary-container text-white font-semibold'
                        : 'bg-surface-container text-outline hover:text-on-surface'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Verified Lifts List */}
              {(() => {
                const prsList = library.filter(e => {
                  const pb = e.personalBest;
                  const hasPR = pb && (Number(pb.weightKg) > 0 || Number(pb.reps) > 0);
                  const matchMuscle = prMuscleFilter === 'all' || (e.muscleGroup || '').toLowerCase() === prMuscleFilter.toLowerCase();
                  return hasPR && matchMuscle;
                });

                if (prsList.length === 0) {
                  return (
                    <div className="p-8 text-center rounded-2xl bg-surface-container-low hairline space-y-2">
                      <Trophy className="w-8 h-8 text-outline/50 mx-auto" />
                      <h4 className="text-xs font-bold text-on-surface">No Personal Records Yet</h4>
                      <p className="text-[11px] text-outline max-w-xs mx-auto">
                        Your personal bests will automatically appear here as you log your strength workouts.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {prsList.map(ex => {
                      const pb = ex.personalBest;
                      return (
                        <div
                          key={ex.id || ex.name}
                          className="p-3.5 rounded-2xl bg-surface-container-lowest hairline flex items-center justify-between gap-3"
                        >
                          <div>
                            <h4 className="text-xs font-bold text-on-surface">{ex.name}</h4>
                            <span className="text-[10px] text-outline capitalize">
                              {ex.muscleGroup} {pb.date ? `· ${pb.date}` : ''}
                            </span>
                          </div>
                          <div className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 text-xs font-bold flex items-center gap-1 shrink-0">
                            <Trophy className="w-3 h-3 text-amber-600" />
                            <span>{pb.weightKg} kg × {pb.reps}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* EXERCISE PICKER DRAWER / MODAL */}
        <AnimatePresence>
          {pickerOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-surface-container-lowest flex flex-col p-5 sm:p-6"
            >
              <div className="flex items-center justify-between pb-3 hairline-b mb-3">
                <h3 className="text-sm font-bold text-on-surface">Select Exercise</h3>
                <button
                  type="button"
                  onClick={() => setPickerOpen(false)}
                  className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface border-0 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Search */}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-outline" />
                <input
                  type="text"
                  placeholder="Search exercise library..."
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Muscle Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2">
                {['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core'].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPickerMuscle(m)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer border-0 capitalize shrink-0 ${
                      pickerMuscle === m ? 'bg-primary-container text-white' : 'bg-surface-container text-outline'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto space-y-1.5">
                {filteredPickerExercises.map(ex => {
                  const pb = ex.personalBest;
                  const hasPR = pb && (Number(pb.weightKg) > 0 || Number(pb.reps) > 0);
                  return (
                    <button
                      key={ex.id || ex.name}
                      type="button"
                      onClick={() => handleSelectExercise(ex)}
                      className="w-full p-2.5 rounded-xl hover:bg-surface-container flex items-center justify-between text-left cursor-pointer border-0 bg-transparent transition-colors"
                    >
                      <div>
                        <span className="text-xs font-semibold text-on-surface block">{ex.name}</span>
                        <span className="text-[10px] text-outline capitalize">{ex.muscleGroup}</span>
                      </div>
                      {hasPR ? (
                        <span className="text-[10px] text-amber-800 font-medium">
                          PB: {pb.weightKg}kg × {pb.reps}
                        </span>
                      ) : (
                        <span className="text-[10px] text-outline font-normal">
                          No PR yet
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
