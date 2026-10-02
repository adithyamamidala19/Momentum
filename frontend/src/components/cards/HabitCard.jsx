import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../../context/MomentumContext.jsx';
import {
  MoreVertical,
  RotateCcw,
  Trash2,
  Sparkles,
  BedDouble,
  Brain,
  Heart,
  Activity,
  Flame,
  Coffee,
  ArrowRight
} from 'lucide-react';

const CATEGORY_MAP = {
  Mind: { icon: Brain },
  Health: { icon: Heart },
  Focus: { icon: Activity },
  Body: { icon: Flame },
  Rest: { icon: BedDouble }
};

export default function HabitCard({ habit, onOpenMovement }) {
  const { metrics, toggleHabit, skipHabitForToday, resetHabit, deleteCustomHabit } = useMomentum();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setPopoverOpen(false);
      }
    }
    if (popoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [popoverOpen]);

  const isSkipped = Boolean(habit.skipped);
  const isCompleted = Boolean(habit.completed);
  const categoryConfig = CATEGORY_MAP[habit.category] || CATEGORY_MAP.Mind;
  const CategoryIcon = categoryConfig.icon;
  const currentStreak = metrics?.streak !== undefined ? metrics.streak : 1;

  return (
    <div
      className={`group relative p-4 rounded-2xl hairline transition-all duration-300 ${
        isCompleted
          ? 'bg-[#E8F5F1]/60 border-[#0F6E56]/30 shadow-2xs'
          : isSkipped
          ? 'bg-surface-container-low/50 border-[#E6E6E3] opacity-85'
          : 'bg-surface-container-lowest hover:bg-surface-container-low/40 hover:border-[#0F6E56]/20'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Animated Checkbox Circle with 44px accessible touch target and satisfying draw */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => toggleHabit(habit.id)}
          className="w-11 h-11 flex items-center justify-center -ml-2 shrink-0 cursor-pointer border-0 bg-transparent rounded-full"
          aria-label={isCompleted ? `Mark ${habit.title} incomplete` : `Complete ${habit.title}`}
        >
          <div
            className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all ${
              isCompleted
                ? 'bg-[#0F6E56] border-[#0F6E56] text-white shadow-xs'
                : isSkipped
                ? 'bg-[#E8F5F1] border-[#0F6E56]/30 text-[#0F6E56]'
                : 'bg-surface-container-lowest border-outline-variant/70 hover:border-[#0F6E56]'
            }`}
          >
            {isCompleted && (
              <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round">
                <motion.path
                  d="M 5 12 L 10 17 L 19 7"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                />
              </svg>
            )}
            {isSkipped && !isCompleted && (
              <BedDouble className="w-3.5 h-3.5 text-[#0F6E56]" />
            )}
          </div>
        </motion.button>

        {/* Content Info */}
        <div className="flex-1 min-w-0" onClick={() => toggleHabit(habit.id)}>
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-sm font-semibold truncate transition-colors ${
                isCompleted
                  ? 'line-through text-outline'
                  : isSkipped
                  ? 'italic text-on-surface/75'
                  : 'text-on-surface'
              }`}
            >
              {habit.title}
            </h3>

            {/* Resting Chip */}
            {isSkipped && (
              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F6E56] border border-[#0F6E56]/20 shrink-0">
                Resting 🌿
              </span>
            )}

            {/* Category Badge - Unified soft tint */}
            {habit.category && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-surface-container text-outline border border-outline-variant/30 flex items-center gap-1 shrink-0">
                <CategoryIcon className="w-3 h-3 text-[#0F6E56]" />
                <span>{habit.category}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-outline truncate">
              {habit.scheduledTime ? `due ${habit.scheduledTime}` : habit.anchor || 'Daily ritual cue'}
            </span>
            <span className="text-[10px] text-[#0F6E56] font-medium bg-[#FAF7F0] px-1.5 py-0.5 rounded border border-[#E6E6E3] shrink-0 font-mono">
              {currentStreak}d streak
            </span>
            {onOpenMovement && (habit.category === 'Body' || habit.title?.toLowerCase().includes('movement') || habit.title?.toLowerCase().includes('workout')) && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenMovement();
                }}
                className="text-[10px] text-[#0F6E56] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer border-0 bg-transparent shrink-0"
              >
                <span>Log workout</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        </div>

        {/* Hover / Focus Quick "Skip" Action */}
        {!isCompleted && !isSkipped && (
          <button
            type="button"
            onClick={() => skipHabitForToday(habit.id)}
            className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 focus:opacity-100 px-2.5 py-1 rounded-full bg-surface-container hover:bg-[#E8F5F1] text-[11px] font-medium text-outline hover:text-[#0F6E56] cursor-pointer border-0 transition-all shrink-0"
            title="Honor a calm rest day"
          >
            Skip today
          </button>
        )}

        {/* More Actions Popover Trigger */}
        <div className="relative" ref={popoverRef}>
          <button
            type="button"
            onClick={() => setPopoverOpen(prev => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer border-0 bg-transparent"
            aria-label="Habit options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Action Popover Menu */}
          <AnimatePresence>
            {popoverOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 w-48 rounded-2xl bg-surface-container-lowest hairline shadow-xl z-30 p-1.5 text-xs select-none"
              >
                {/* Complete */}
                <button
                  type="button"
                  onClick={() => {
                    toggleHabit(habit.id);
                    setPopoverOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left font-medium text-on-surface hover:bg-surface-container flex items-center gap-2 cursor-pointer border-0 bg-transparent transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#0F6E56]" />
                  <span>{isCompleted ? 'Mark Incomplete' : 'Complete (+25 pts)'}</span>
                </button>

                {/* Skip for Today */}
                <button
                  type="button"
                  onClick={() => {
                    skipHabitForToday(habit.id);
                    setPopoverOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left font-medium text-[#0F6E56] hover:bg-[#E8F5F1] flex items-center gap-2 cursor-pointer border-0 bg-transparent transition-colors"
                >
                  <BedDouble className="w-3.5 h-3.5 text-[#0F6E56]" />
                  <span>Skip for Today (Rest)</span>
                </button>

                {/* Reset to Pending */}
                {(isCompleted || isSkipped) && (
                  <button
                    type="button"
                    onClick={() => {
                      resetHabit(habit.id);
                      setPopoverOpen(false);
                    }}
                    className="w-full px-3 py-2 rounded-xl text-left font-medium text-outline hover:bg-surface-container flex items-center gap-2 cursor-pointer border-0 bg-transparent transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset to Pending</span>
                  </button>
                )}

                {/* Delete */}
                <button
                  type="button"
                  onClick={() => {
                    deleteCustomHabit(habit.id);
                    setPopoverOpen(false);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-left font-medium text-error hover:bg-error-container/20 flex items-center gap-2 cursor-pointer border-0 bg-transparent transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Habit</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
