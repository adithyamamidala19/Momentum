import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Award, Check } from 'lucide-react';
import { EASE } from '../../../motionConfig';
import CountUp from '../CountUp.jsx';

/**
 * MovementVisual
 * ─────────────────────────────────────────────────────────────────────────────
 * Pillar 03: Movement & Live PR Engine
 * - Set rows tick in one by one with counting weights (220 kg, 230 kg, 240 kg)
 * - PR badge springs in with a subtle gold specular shimmer
 * - Rest timer circular indicator fills and time counts to 01:30
 * - Interactive "+ Add Next Set (Auto-Clone)"
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function MovementVisual({ isVisible = true }) {
  const prefersReduced = useReducedMotion();
  const [sets, setSets] = useState([
    { id: 1, set: 'Set 1', weight: 220, reps: '8 reps', pr: false },
    { id: 2, set: 'Set 2', weight: 230, reps: '6 reps', pr: false },
    { id: 3, set: 'Set 3', weight: 240, reps: '5 reps', pr: true },
  ]);

  const handleAddSet = () => {
    setSets((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        set: `Set ${prev.length + 1}`,
        weight: 245,
        reps: '4 reps',
        pr: true,
      },
    ]);
  };

  return (
    <div className="w-full max-w-md p-7 sm:p-9 rounded-3xl bg-white/[0.08] border border-white/[0.14] backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-5">
      {/* Warm Amber Radial Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#D97706]/25 rounded-full blur-3xl pointer-events-none" />

      {/* Workout Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-300">
            Granular Strength Log
          </span>
          <h4 className="font-editorial text-xl text-[#FAF7F0] font-normal">
            Barbell Back Squat
          </h4>
        </div>
        <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
          Auto-PR On
        </span>
      </div>

      {/* Set Matrix */}
      <div className="space-y-2">
        {sets.map((s, index) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, x: -20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{
              duration: 0.6,
              delay: 0.2 + index * 0.18,
              ease: EASE.expoOut,
            }}
            className="p-3 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between"
          >
            <span className="text-xs font-mono text-emerald-200/80">{s.set}</span>
            <span className="font-mono text-sm font-bold text-[#FAF7F0]">
              <CountUp target={s.weight} suffix=" kg" isVisible={isVisible} delay={0.3 + index * 0.2} duration={1.2} />
            </span>
            <span className="text-xs text-[#FAF7F0]/80">{s.reps}</span>
            {s.pr ? (
              <motion.span
                initial={{ scale: 0.7, opacity: 0 }}
                animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
                transition={{ delay: 0.8, duration: 0.5, ease: EASE.spring }}
                className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-sm relative overflow-hidden"
              >
                {!prefersReduced && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
                  />
                )}
                <Award className="w-3 h-3 text-amber-300" /> PR
              </motion.span>
            ) : (
              <Check className="w-4 h-4 text-emerald-400" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Next Set Button */}
      <button
        type="button"
        onClick={handleAddSet}
        className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-semibold text-[#FAF7F0] border border-white/15 transition-all cursor-pointer flex items-center justify-center gap-1.5 active:scale-[0.98]"
      >
        <span>+ Add Next Set (Auto-Clone)</span>
      </button>

      {/* Floating Rest Interval Preview */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
        transition={{ duration: 0.6, delay: 0.6, ease: EASE.expoOut }}
        className="p-3.5 rounded-2xl bg-amber-950/50 border border-amber-400/30 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-full h-full -rotate-90">
              <circle cx="16" cy="16" r="13" fill="none" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="2.5" />
              <motion.circle
                cx="16"
                cy="16"
                r="13"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 13}
                initial={{ strokeDashoffset: 2 * Math.PI * 13 }}
                animate={isVisible ? { strokeDashoffset: 2 * Math.PI * 13 * (1 - 0.75) } : { strokeDashoffset: 2 * Math.PI * 13 }}
                transition={{ duration: 1.8, delay: 0.7, ease: EASE.expoOut }}
              />
            </svg>
            <div className="w-2 h-2 rounded-full bg-amber-400 absolute animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-300 block">Rest Interval</span>
            <span className="font-mono text-sm font-bold text-[#FAF7F0]">01:30 Active</span>
          </div>
        </div>
        <span className="text-[11px] text-amber-200/80 italic">Chimes on finish</span>
      </motion.div>
    </div>
  );
}
