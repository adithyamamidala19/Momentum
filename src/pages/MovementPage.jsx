import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import ProteinCard from '../components/nutrition/ProteinCard.jsx';
import CountUp from '../components/architecture/CountUp.jsx';
import { formatFriendlyDate } from '../utils/formatters.js';
import {
  Plus,
  Trophy,
  Flame,
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Utensils,
  CheckCircle2,
  Clock,
  Camera
} from 'lucide-react';

export default function MovementPage({ onOpenMovement }) {
  const { state, addProtein, showToast, openMealScanner } = useMomentum();
  const logs = state.movementLogs || [];
  const exerciseLibrary = state.exerciseLibrary || [];

  // Expanded session details map
  const [expandedSessions, setExpandedSessions] = useState({});

  const toggleSession = (id) => {
    setExpandedSessions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Group workout logs into coherent sessions if sessionId exists, or treat individual logs as sessions
  const sessions = useMemo(() => {
    if (logs.length === 0) return [];

    const grouped = {};
    logs.forEach(log => {
      const sId = log.sessionId || `session-${log.id}`;
      if (!grouped[sId]) {
        grouped[sId] = {
          id: sId,
          date: log.date,
          workoutName: log.workoutName || 'Strength Session',
          muscleGroup: log.muscleGroup || 'Full-body',
          pacing: log.pacing || 'Moderate',
          feel: log.feel || 'Comfortable',
          exercises: []
        };
      }
      grouped[sId].exercises.push(log);
    });

    return Object.values(grouped);
  }, [logs]);

  // Aggregate stats: Total volume (kg), total sets, total sessions
  const stats = useMemo(() => {
    let totalVolumeKg = 0;
    let totalSets = 0;
    let prCount = 0;

    logs.forEach(log => {
      if (log.sets && Array.isArray(log.sets)) {
        log.sets.forEach(set => {
          totalSets += 1;
          totalVolumeKg += (Number(set.weightKg) || 0) * (Number(set.reps) || 0);
          if (set.isPR) prCount += 1;
        });
      } else {
        totalSets += Number(log.setsCount) || 1;
        totalVolumeKg += (Number(log.weightKg) || 0) * (Number(log.reps) || 0) * (Number(log.setsCount) || 1);
      }
    });

    // Also count PRs recorded in exerciseLibrary
    const libraryPRs = exerciseLibrary.filter(ex => ex.personalBest && ex.personalBest.weightKg > 0);
    const finalPrCount = Math.max(prCount, libraryPRs.length);

    return {
      volumeKg: Math.round(totalVolumeKg),
      sets: totalSets,
      sessionsCount: sessions.length,
      prsCount: finalPrCount,
      personalBests: libraryPRs
    };
  }, [logs, sessions, exerciseLibrary]);

  const handlePostWorkoutShake = () => {
    addProtein(25, 'Post-workout Whey');
    showToast('Logged +25g post-workout protein! 🌿');
  };

  return (
    <PageShell>
      <PageHeader
        eyebrow="Physical Practice"
        title="Movement & Strength"
        subtitle="Per-set workout tracking, live PR detection, and floating rest timers."
        actions={
          <button
            type="button"
            onClick={onOpenMovement}
            className="px-5 py-2.5 rounded-full bg-[#0F6E56] hover:bg-[#0B5240] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Log Workout Session</span>
          </button>
        }
      />

      {/* ── Top Metrics Banner & Nutrition Anchor ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {/* Metric 1: Total Volume */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
              Session Volume
            </span>
            <div className="w-7 h-7 rounded-xl bg-primary-container/10 flex items-center justify-center text-primary-container">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-on-surface font-mono">
              <CountUp value={stats.volumeKg} duration={1.2} /> <span className="text-sm font-medium text-outline">kg</span>
            </div>
            <p className="text-[11px] text-outline mt-1">
              across {stats.sets} sets · mindful pacing
            </p>
          </div>
        </div>

        {/* Metric 2: PRs & Consistency */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
              Personal Bests
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Trophy className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">
              <CountUp value={stats.prsCount} duration={1} /> <span className="text-sm font-medium text-outline">records</span>
            </div>
            <p className="text-[11px] text-outline mt-1">
              celebrating continuous steady progression
            </p>
          </div>
        </div>

        {/* Metric 3: Compact Nutrition Anchor */}
        <div className="flex flex-col justify-center">
          <ProteinCard compact className="h-full" />
        </div>
      </div>

      {/* ── Personal Records Showcase ── */}
      {stats.personalBests.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <h2 className="text-sm font-bold text-on-surface">Verified Personal Records</h2>
            </div>
            <span className="text-[11px] text-outline font-medium">Automatic benchmark tracking</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.personalBests.map(pb => (
              <motion.div
                key={pb.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-surface-container-lowest hairline shadow-xs flex items-center justify-between gap-3 border-l-4 border-l-amber-500"
              >
                <div>
                  <h3 className="text-xs font-bold text-on-surface">{pb.name}</h3>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-outline block mt-0.5">
                    {pb.muscleGroup}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-extrabold text-on-surface font-mono block">
                    {pb.personalBest.weightKg}kg
                  </span>
                  <span className="text-[10px] text-amber-700 font-medium">
                    {pb.personalBest.reps} reps · {formatFriendlyDate(pb.personalBest.date)}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ── Workout Sessions List ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-on-surface">Practice Sessions</h2>
          <span className="text-xs text-outline font-medium">
            {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} recorded
          </span>
        </div>

        {sessions.length === 0 ? (
          /* Mindful Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 text-center rounded-3xl bg-surface-container-low hairline shadow-xs flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#0F6E56]/10 flex items-center justify-center text-[#0F6E56]">
              <Activity className="w-7 h-7" />
            </div>
            <div className="max-w-md">
              <h3 className="font-editorial text-xl font-normal text-on-surface">
                No movement recorded yet
              </h3>
              <p className="text-xs text-outline mt-1.5 leading-relaxed">
                Every physical practice begins with a single mindful repetition. Step onto the floor, breathe into your cadence, and honor your strength.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenMovement}
              className="mt-2 px-6 py-2.5 rounded-full bg-[#0F6E56] hover:bg-[#0B5240] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer border-0 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log Your First Session</span>
            </button>
          </motion.div>
        ) : (
          <div className="space-y-3">
            {sessions.map(session => {
              const isExpanded = expandedSessions[session.id] ?? false;

              return (
                <div
                  key={session.id}
                  className="rounded-3xl bg-surface-container-lowest hairline shadow-xs overflow-hidden transition-all"
                >
                  {/* Session Header / Summary Row */}
                  <div
                    onClick={() => toggleSession(session.id)}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-surface-container/20 transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      <div className="w-10 h-10 rounded-2xl bg-secondary-fixed/50 flex items-center justify-center text-secondary shrink-0 mt-0.5 sm:mt-0">
                        <Activity className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-sm font-bold text-on-surface">
                            {session.workoutName}
                          </h3>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary-fixed/60 text-secondary">
                            {session.muscleGroup}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-outline mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-outline/70" />
                            {formatFriendlyDate(session.date)}
                          </span>
                          <span>·</span>
                          <span>Pacing: <strong className="text-on-surface font-semibold">{session.pacing}</strong></span>
                          <span>·</span>
                          <span>Feel: <strong className="text-on-surface font-semibold">{session.feel}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-outline/10">
                      <div className="text-left sm:text-right">
                        <span className="text-xs font-bold text-on-surface block">
                          {session.exercises.reduce((acc, ex) => acc + (ex.sets?.length || ex.setsCount || 1), 0)} Total Sets
                        </span>
                        <span className="text-[10px] text-outline">
                          {session.exercises.length} {session.exercises.length === 1 ? 'movement' : 'movements'}
                        </span>
                      </div>

                      <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline transition-transform">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expandable Exercise & Set Details */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        className="border-t hairline px-5 py-4 bg-surface-container-low/40 space-y-4"
                      >
                        {session.exercises.map((ex, exIdx) => (
                          <div key={ex.id || exIdx} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <h4 className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                                <span>{ex.workoutName}</span>
                                {ex.summary && (
                                  <span className="text-[11px] font-normal text-outline">
                                    ({ex.summary})
                                  </span>
                                )}
                              </h4>
                              <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
                                {ex.muscleGroup}
                              </span>
                            </div>

                            {/* Sets breakdown */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                              {ex.sets && ex.sets.length > 0 ? (
                                ex.sets.map((set, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className={`p-2.5 rounded-xl hairline text-xs flex items-center justify-between ${
                                      set.isPR
                                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-900'
                                        : 'bg-surface-container-lowest'
                                    }`}
                                  >
                                    <span className="text-[10px] text-outline font-semibold">
                                      Set {set.setNumber || sIdx + 1}
                                    </span>
                                    <span className="font-mono font-bold">
                                      {set.weightKg}kg × {set.reps}
                                    </span>
                                    {set.isPR && (
                                      <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500 text-white flex items-center gap-0.5">
                                        PR
                                      </span>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="p-2.5 rounded-xl bg-surface-container-lowest hairline text-xs flex items-center justify-between col-span-2 sm:col-span-4">
                                  <span className="text-[10px] text-outline font-semibold">Summary</span>
                                  <span className="font-mono font-bold">
                                    {ex.weightKg || 0}kg × {ex.reps || 10} ({ex.setsCount || 1} sets)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                        {/* Post-Workout Protein Shortcut */}
                        <div className="pt-3 border-t hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface-container-lowest p-3 rounded-2xl">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-[#F0CEB8]/30 flex items-center justify-center text-[#92400E]">
                              <Utensils className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-xs font-bold text-on-surface block">
                                Fuel muscle recovery
                              </span>
                              <span className="text-[11px] text-outline">
                                Pair this practice with targeted protein nourishment.
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={openMealScanner}
                              className="px-3.5 py-1.5 rounded-full bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20 border border-[#0F6E56]/30 text-xs font-semibold text-[#0F6E56] flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Camera className="w-3.5 h-3.5" />
                              <span>Scan Meal 📸</span>
                            </button>
                            <button
                              type="button"
                              onClick={handlePostWorkoutShake}
                              className="px-3.5 py-1.5 rounded-full bg-[#FAF7F0] hover:bg-surface-container border border-[#E6E6E3] text-xs font-semibold text-on-surface flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5 text-[#D97706]" />
                              <span>Log +25g Shake</span>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PageShell>
  );
}
