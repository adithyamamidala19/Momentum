import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '../../../motionConfig';
import CountUp from '../CountUp.jsx';

/**
 * DialVisual
 * ─────────────────────────────────────────────────────────────────────────────
 * Pillar 01: Concentric Adherence Dial
 * - Concentric SVG rings draw in with pathLength from outer inward
 * - Arc sweeps to 82% with radiant glow
 * - Main 82% and 3 metric rows count up from 0 on reveal
 * - Subtle idle breathing pulse
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function DialVisual({ isVisible = true }) {
  const prefersReduced = useReducedMotion();
  const size = 180;
  const center = size / 2;

  const rHabits = 72;
  const rFocus = 56;
  const rWater = 40;

  const circHabits = 2 * Math.PI * rHabits;
  const circFocus = 2 * Math.PI * rFocus;
  const circWater = 2 * Math.PI * rWater;

  return (
    <div className="w-full max-w-md p-7 sm:p-9 rounded-3xl bg-white/[0.08] border border-white/[0.14] backdrop-blur-xl shadow-2xl relative overflow-hidden">
      {/* Dynamic Background Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#0F6E56]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Window Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
          <span className="text-[11px] font-mono text-emerald-200/70 ml-2">adherence.dial.74px</span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
          Live Dial
        </span>
      </div>

      {/* SVG Triple Dial Canvas */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-3">
        <motion.div
          className="relative w-44 h-44 flex items-center justify-center select-none shrink-0"
          animate={
            !prefersReduced && isVisible
              ? {
                  scale: [1, 1.025, 1],
                  transition: {
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: 2.2,
                  },
                }
              : {}
          }
        >
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90 transform">
            {/* Outer - Habits Track */}
            <circle cx={center} cy={center} r={rHabits} fill="none" stroke="rgba(245, 158, 11, 0.2)" strokeWidth="7" />
            <motion.circle
              cx={center}
              cy={center}
              r={rHabits}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circHabits}
              initial={{ strokeDashoffset: circHabits }}
              animate={isVisible ? { strokeDashoffset: circHabits * (1 - 0.75) } : { strokeDashoffset: circHabits }}
              transition={{ duration: 1.6, delay: 0.2, ease: EASE.expoOut }}
            />

            {/* Middle - Focus Track */}
            <circle cx={center} cy={center} r={rFocus} fill="none" stroke="rgba(15, 110, 86, 0.2)" strokeWidth="7" />
            <motion.circle
              cx={center}
              cy={center}
              r={rFocus}
              fill="none"
              stroke="#34D399"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circFocus}
              initial={{ strokeDashoffset: circFocus }}
              animate={isVisible ? { strokeDashoffset: circFocus * (1 - 0.60) } : { strokeDashoffset: circFocus }}
              transition={{ duration: 1.6, delay: 0.45, ease: EASE.expoOut }}
            />

            {/* Inner - Hydration Track */}
            <circle cx={center} cy={center} r={rWater} fill="none" stroke="rgba(8, 145, 178, 0.2)" strokeWidth="7" />
            <motion.circle
              cx={center}
              cy={center}
              r={rWater}
              fill="none"
              stroke="#22D3EE"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circWater}
              initial={{ strokeDashoffset: circWater }}
              animate={isVisible ? { strokeDashoffset: circWater * (1 - 0.85) } : { strokeDashoffset: circWater }}
              transition={{ duration: 1.6, delay: 0.7, ease: EASE.expoOut }}
            />
          </svg>

          {/* Centered Percentage Badge */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-extrabold text-[#FAF7F0] leading-none">
              <CountUp target={82} suffix="%" isVisible={isVisible} delay={0.3} duration={1.8} />
            </span>
            <span className="text-[10px] uppercase font-semibold text-emerald-200/75 tracking-wider mt-1">
              Harmony
            </span>
          </div>
        </motion.div>

        {/* 3 Metric Pills with Staggered Count-Up */}
        <div className="space-y-2.5 w-full sm:w-auto">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, delay: 0.5, ease: EASE.expoOut }}
            className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-xs text-[#FAF7F0]">Mindful Habits</span>
            </div>
            <span className="font-mono text-xs font-bold text-amber-300">
              <CountUp target={3} isVisible={isVisible} delay={0.6} duration={1.2} /> / 4
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, delay: 0.7, ease: EASE.expoOut }}
            className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-xs text-[#FAF7F0]">Deep Focus</span>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-300">
              <CountUp target={45} suffix=" mins" isVisible={isVisible} delay={0.8} duration={1.4} />
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={isVisible ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
            transition={{ duration: 0.6, delay: 0.9, ease: EASE.expoOut }}
            className="p-2.5 rounded-xl bg-white/[0.06] border border-white/10 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-xs text-[#FAF7F0]">Cellular Water</span>
            </div>
            <span className="font-mono text-xs font-bold text-cyan-300">
              <CountUp target={7} isVisible={isVisible} delay={1.0} duration={1.2} /> / 8 gl
            </span>
          </motion.div>
        </div>
      </div>

      {/* Footer Telemetry */}
      <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-100/60 font-mono">
        <span>74px Strict Ring Clearance</span>
        <span>Zero Streak Guilt Active</span>
      </div>
    </div>
  );
}
