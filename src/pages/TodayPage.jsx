import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import ConcentricRings from '../components/dial/ConcentricRings.jsx';
import HabitCard from '../components/cards/HabitCard.jsx';
import WaterBottle from '../components/hydration/WaterBottle.jsx';
import ProteinCard from '../components/nutrition/ProteinCard.jsx';
import CountUp from '../components/architecture/CountUp.jsx';
import {
  CheckCircle2,
  Timer,
  Droplet,
  Utensils,
  ArrowRight,
  Camera,
  Flame,
  Sparkles,
  Info,
  X,
  Play,
  Check
} from 'lucide-react';
import { titleCaseName, pluralize } from '../utils/formatters.js';

export default function TodayPage({ setView, onOpenMovement }) {
  const {
    state,
    metrics,
    openMealScanner,
    toggleHabit,
    incrementWater,
    addProtein
  } = useMomentum();

  const [showAdherenceInfo, setShowAdherenceInfo] = useState(false);
  const [selectedFocusPreset, setSelectedFocusPreset] = useState(25);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const userName = titleCaseName(state.name || 'Adithya Mamidala');

  // Today's rituals: filter for rituals due today (or take top 4)
  const habits = state.customHabits || [];
  const todayDueHabits = habits.slice(0, 4);

  // Smooth scroll helper for mini stat tiles
  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ── Compute Next Up Suggestion from the Central Store ──
  const nextIncompleteHabit = habits.find(h => !h.completed && !h.skipped);

  let nextAction = null;
  if (nextIncompleteHabit) {
    nextAction = {
      type: 'habit',
      label: `Next: ${nextIncompleteHabit.title}`,
      cue: nextIncompleteHabit.scheduledTime ? `due ${nextIncompleteHabit.scheduledTime}` : (nextIncompleteHabit.anchor || "Today's cue"),
      buttonText: 'Check in',
      action: () => toggleHabit(nextIncompleteHabit.id)
    };
  } else if (metrics.waterMl < metrics.targetWaterMl) {
    const remainingMl = metrics.targetWaterMl - metrics.waterMl;
    nextAction = {
      type: 'water',
      label: 'Next: Hydrate with Water',
      cue: `${metrics.waterMl} / ${metrics.targetWaterMl} ml logged (${remainingMl}ml left)`,
      buttonText: '+250ml Glass',
      action: () => incrementWater(250)
    };
  } else if (metrics.focusMins < metrics.targetFocus) {
    nextAction = {
      type: 'focus',
      label: 'Next: Mindful Focus Block',
      cue: `${metrics.focusMins} / ${metrics.targetFocus} min completed`,
      buttonText: 'Start Focus',
      action: () => setView('focus')
    };
  } else if (metrics.proteinGrams < metrics.proteinTargetGrams) {
    const remainingG = metrics.proteinTargetGrams - metrics.proteinGrams;
    nextAction = {
      type: 'protein',
      label: 'Next: Nourish with Protein',
      cue: `${metrics.proteinGrams} / ${metrics.proteinTargetGrams} g logged (${remainingG}g left)`,
      buttonText: '+25g Shake',
      action: () => addProtein(25, 'Post-workout Whey')
    };
  } else {
    nextAction = {
      type: 'complete',
      label: 'All done. Beautiful day.',
      cue: 'All daily rituals, focus, and hydration goals completed.',
      buttonText: 'View Milestones',
      action: () => setView('milestones')
    };
  }

  return (
    <PageShell>
      {/* ── Row 1: Editorial Greeting & Subtitle ── */}
      <PageHeader
        eyebrow={todayDateStr}
        title={`${getGreeting()}, ${userName}.`}
        subtitle="“Small, steady actions today quietly shape the person you become.”"
        action={
          <button
            type="button"
            onClick={openMealScanner}
            className="px-4 py-2 rounded-full bg-[#0F6E56] hover:bg-[#0B5240] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-0 shadow-xs transition-all hover:scale-105 active:scale-95 shrink-0"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Snap Meal Photo 📸</span>
          </button>
        }
      />

      {/* ── Row 2: Today at a Glance Card (Full width, fixed sensible height, no empty space) ── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest hairline shadow-xs mb-8">
        <div className="flex items-center justify-between pb-4 mb-4 hairline-b">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F6E56] bg-[#0F6E56]/10 px-2.5 py-0.5 rounded-full">
              Daily Overview
            </span>
            <span className="text-xs font-bold text-on-surface">
              Today at a glance
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-outline font-medium">
            <span>Overall Adherence:</span>
            <strong className="text-on-surface font-extrabold font-mono text-sm">
              <CountUp value={metrics.dailyAdherenceScore} duration={1.2} />%
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Panel: Concentric Ring (~180px) + Legend + How adherence works popover */}
          <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-4">
            <ConcentricRings
              habitPct={metrics.habitPct}
              focusPct={metrics.focusPct}
              waterPct={metrics.waterPct}
              adherenceScore={metrics.dailyAdherenceScore}
            />

            {/* Ring Legend & Popover */}
            <div className="w-full max-w-[200px] space-y-1.5 pt-1">
              {/* Outer = Rituals */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0F6E56] shrink-0" />
                  <span className="text-outline">Rituals</span>
                </div>
                <span className="font-mono font-bold text-on-surface">
                  {metrics.completedHabitsCount} / {metrics.activeHabitsCount}
                </span>
              </div>

              {/* Middle = Focus */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D97706] shrink-0" />
                  <span className="text-outline">Focus</span>
                </div>
                <span className="font-mono font-bold text-on-surface">
                  {metrics.focusMins} / {metrics.targetFocus}m
                </span>
              </div>

              {/* Inner = Water */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0891B2] shrink-0" />
                  <span className="text-outline">Water</span>
                </div>
                <span className="font-mono font-bold text-on-surface">
                  {metrics.waterGlasses} / {metrics.targetWaterGlasses} gl
                </span>
              </div>

              {/* Popover trigger */}
              <div className="relative pt-1 text-center sm:text-left">
                <button
                  type="button"
                  onClick={() => setShowAdherenceInfo(prev => !prev)}
                  className="text-[11px] text-[#0F6E56] hover:underline flex items-center gap-1 cursor-pointer border-0 bg-transparent mx-auto sm:mx-0 font-medium"
                >
                  <Info className="w-3 h-3" />
                  <span>How adherence works</span>
                </button>

                <AnimatePresence>
                  {showAdherenceInfo && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute left-0 bottom-full mb-2 w-64 p-3 rounded-2xl bg-surface-container-lowest hairline shadow-xl text-[11px] text-on-surface z-30 space-y-1 text-left"
                    >
                      <div className="flex items-center justify-between font-bold text-[#0F6E56]">
                        <span>Adherence Formula</span>
                        <button
                          type="button"
                          onClick={() => setShowAdherenceInfo(false)}
                          className="text-outline hover:text-on-surface p-0.5 cursor-pointer border-0 bg-transparent"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-outline leading-relaxed">
                        Calculated daily: Rituals (50%), Focus (30%), and Water (20%).
                      </p>
                      <p className="text-[#0F6E56] font-medium leading-relaxed">
                        Rest and skipped days are excluded from the target so they never lower your score.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Middle Panel: 2x2 Grid of Mini Stat Tiles (Tappable with smooth scroll) */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-2.5">
            {/* Tile 1: Rituals */}
            <div
              onClick={() => scrollToSection('todays-rituals')}
              className="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border border-transparent hover:border-[#0F6E56]/30 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-outline">Rituals</span>
                <CheckCircle2 className="w-4 h-4 text-[#0F6E56]" />
              </div>
              <div className="mt-2">
                <span className="font-mono text-base font-extrabold text-on-surface">
                  {metrics.completedHabitsCount} / {metrics.activeHabitsCount}
                </span>
                <div className="w-full h-1 rounded-full bg-surface-container overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-[#0F6E56] rounded-full transition-all duration-500"
                    style={{ width: `${metrics.habitPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tile 2: Focus */}
            <div
              onClick={() => scrollToSection('focus-tracker')}
              className="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border border-transparent hover:border-[#D97706]/30 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-outline">Focus</span>
                <Timer className="w-4 h-4 text-[#D97706]" />
              </div>
              <div className="mt-2">
                <span className="font-mono text-base font-extrabold text-on-surface">
                  {metrics.focusMins} / {metrics.targetFocus}m
                </span>
                <div className="w-full h-1 rounded-full bg-surface-container overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-[#D97706] rounded-full transition-all duration-500"
                    style={{ width: `${metrics.focusPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tile 3: Water */}
            <div
              onClick={() => scrollToSection('water-tracker')}
              className="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border border-transparent hover:border-[#0891B2]/30 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-outline">Water</span>
                <Droplet className="w-4 h-4 text-[#0891B2]" />
              </div>
              <div className="mt-2">
                <span className="font-mono text-base font-extrabold text-on-surface">
                  {metrics.waterMl} ml
                </span>
                <div className="w-full h-1 rounded-full bg-surface-container overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-[#0891B2] rounded-full transition-all duration-500"
                    style={{ width: `${metrics.waterPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Tile 4: Protein */}
            <div
              onClick={() => scrollToSection('protein-tracker')}
              className="p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container transition-all cursor-pointer border border-transparent hover:border-[#92400E]/30 flex flex-col justify-between group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-outline">Protein</span>
                <Utensils className="w-4 h-4 text-[#92400E]" />
              </div>
              <div className="mt-2">
                <span className="font-mono text-base font-extrabold text-on-surface">
                  {metrics.proteinGrams} / {metrics.proteinTargetGrams}g
                </span>
                <div className="w-full h-1 rounded-full bg-surface-container overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#F0CEB8] to-[#D97706] rounded-full transition-all duration-500"
                    style={{ width: `${metrics.proteinPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: "Next up" Block */}
          <div className="lg:col-span-4 p-5 rounded-2xl bg-surface-container-low hairline flex flex-col justify-between gap-4 h-full">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F6E56] bg-[#0F6E56]/10 px-2.5 py-0.5 rounded-full">
                  Next up
                </span>
                {nextAction.type === 'complete' && (
                  <Sparkles className="w-4 h-4 text-amber-600" />
                )}
              </div>

              <h3 className="text-sm font-bold text-on-surface line-clamp-1">
                {nextAction.label}
              </h3>
              <p className="text-xs text-outline mt-1 line-clamp-2">
                {nextAction.cue}
              </p>
            </div>

            <div>
              <button
                type="button"
                onClick={nextAction.action}
                className="w-full py-2.5 px-4 rounded-full bg-[#0F6E56] hover:bg-[#0B5240] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {nextAction.type === 'habit' && <Check className="w-3.5 h-3.5" />}
                {nextAction.type === 'water' && <Droplet className="w-3.5 h-3.5" />}
                {nextAction.type === 'focus' && <Play className="w-3.5 h-3.5 fill-current" />}
                {nextAction.type === 'protein' && <Utensils className="w-3.5 h-3.5" />}
                <span>{nextAction.buttonText}</span>
              </button>

              {/* Secondary stats: Practice score & Streak */}
              <div className="mt-3 pt-3 border-t hairline flex items-center justify-between text-xs font-semibold text-outline">
                <div>
                  <span className="text-[10px] text-outline uppercase mr-1">Score:</span>
                  <span className="text-on-surface font-extrabold font-mono">
                    <CountUp value={metrics.totalPoints} duration={1.2} /> pts
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-outline uppercase mr-1">Streak:</span>
                  <span className="text-amber-700 font-extrabold font-mono flex items-center gap-0.5">
                    {pluralize(metrics.streak, 'day')} <Flame className="w-3.5 h-3.5 fill-current" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: "Today's rituals" (Full width, main task) ── */}
      <div id="todays-rituals" className="space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="font-editorial text-2xl font-normal text-on-surface">
              Today's rituals
            </h2>
            <p className="text-xs text-outline mt-0.5">
              Tap the circle to check in. Skip any ritual on rest days without losing your streak.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setView('rituals')}
            className="text-xs font-semibold text-[#0F6E56] hover:text-[#0B5240] hover:underline flex items-center gap-1 cursor-pointer border-0 bg-transparent self-start sm:self-auto"
          >
            <span>View all rituals</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 2-Column Responsive Habit Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {todayDueHabits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onOpenMovement={onOpenMovement}
            />
          ))}
        </div>
      </div>

      {/* ── Row 4: Three Equal-Height Tracker Cards (CSS grid, 3 columns, items-stretch) ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-8">
        {/* Card 1: Focus */}
        <div
          id="focus-tracker"
          className="p-6 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between select-none h-full"
        >
          {/* Header Row */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-[#D97706] shrink-0">
                  <Timer className="w-4 h-4" />
                </div>
                <h3 className="font-editorial text-lg text-on-surface">Focus</h3>
              </div>

              <span className="font-mono text-sm font-bold text-on-surface whitespace-nowrap">
                {state.todayFocusMinutes || 0} / {state.focusTargetMinutes || 25} min
              </span>
            </div>

            {/* Progress Bar */}
            <div className="my-3">
              <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
                <div
                  className="h-full bg-[#D97706] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round(((state.todayFocusMinutes || 0) / (state.focusTargetMinutes || 25)) * 100))}%`
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-outline mt-1.5 font-medium">
                <span>{metrics.focusPct}% of daily focus intention</span>
                <span>{Math.max(0, (state.focusTargetMinutes || 25) - (state.todayFocusMinutes || 0))}m remaining</span>
              </div>
            </div>
          </div>

          {/* Center Body: Soundscape cue & Session presets */}
          <div className="my-4 space-y-3 flex-1 flex flex-col justify-center">
            <div className="p-3 rounded-2xl bg-surface-container-low hairline text-center space-y-1">
              <span className="text-[11px] font-semibold text-on-surface block">
                Single-Task Presence
              </span>
              <p className="text-[10px] text-outline">
                Live synthesized 432Hz ambient soundscapes for unhurried flow.
              </p>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider text-outline block text-center">
                Session Presets
              </span>
              <div className="flex items-center justify-center gap-1.5">
                {[15, 25, 45].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setSelectedFocusPreset(mins)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
                      selectedFocusPreset === mins
                        ? 'bg-[#0F6E56] text-white border-[#0F6E56]'
                        : 'bg-surface-container text-outline hover:text-on-surface border-transparent'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Action */}
          <div className="pt-3 border-t border-surface-container">
            <button
              type="button"
              onClick={() => setView('focus')}
              className="w-full py-2.5 rounded-full bg-[#0F6E56] hover:bg-[#0B5240] text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-xs hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Start {selectedFocusPreset}m Focus Session</span>
            </button>
          </div>
        </div>

        {/* Card 2: Water */}
        <div id="water-tracker" className="h-full">
          <WaterBottle />
        </div>

        {/* Card 3: Protein */}
        <div id="protein-tracker" className="h-full">
          <ProteinCard />
        </div>
      </div>
    </PageShell>
  );
}
