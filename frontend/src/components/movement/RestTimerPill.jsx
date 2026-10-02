import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { Timer, X } from 'lucide-react';

export default function RestTimerPill() {
  const { restTimer, dismissRestTimer } = useMomentum();

  if (!restTimer.active) return null;

  const mins = Math.floor(restTimer.remaining / 60);
  const secs = restTimer.remaining % 60;
  const formatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const pct = Math.max(0, (restTimer.remaining / restTimer.duration) * 100);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.9 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="rest-timer-floating flex items-center gap-3 px-4 py-2.5 rounded-full bg-surface-container-lowest/95 backdrop-blur-md hairline shadow-xl select-none"
      >
        {/* Animated Icon Ring */}
        <div className="relative w-7 h-7 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke="#E8E8E4"
              strokeWidth="2.5"
            />
            <circle
              cx="14"
              cy="14"
              r="11"
              fill="none"
              stroke="#0F6E56"
              strokeWidth="2.5"
              strokeDasharray="69.11"
              strokeDashoffset={69.11 - (69.11 * pct) / 100}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <Timer className="absolute w-3.5 h-3.5 text-primary-container" />
        </div>

        {/* Countdown Readout */}
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-wider text-outline font-semibold leading-none">
            Resting
          </span>
          <span className="text-sm font-bold text-on-surface font-mono leading-tight mt-0.5">
            {formatted}
          </span>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={dismissRestTimer}
          className="w-6 h-6 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors cursor-pointer border-0 bg-transparent p-0 ml-1"
          aria-label="Dismiss rest timer"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
