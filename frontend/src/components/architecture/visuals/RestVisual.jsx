import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { EASE } from '../../../motionConfig';
import CountUp from '../CountUp.jsx';

/**
 * RestVisual
 * ─────────────────────────────────────────────────────────────────────────────
 * Pillar 04: Guilt-Free Rest Philosophy
 * - Rest Day toggle slides on with soft emerald glow
 * - Streak card fades in and "12 Days" counts up from 0
 * - Protective shield halo pulse symbolizes streak immunity
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function RestVisual({ isVisible = true }) {
  const prefersReduced = useReducedMotion();
  const [restDayActive, setRestDayActive] = useState(true);

  return (
    <div className="w-full max-w-md p-7 sm:p-9 rounded-3xl bg-white/[0.08] border border-white/[0.14] backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-6">
      {/* Calm Sage Ambient Glow */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-[#0F6E56]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Rest Day Switcher Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
        transition={{ duration: 0.6, delay: 0.2, ease: EASE.expoOut }}
        className="p-4 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-between"
      >
        <div>
          <span className="text-xs font-bold text-[#FAF7F0] block">Rest Day Mode</span>
          <span className="text-[11px] text-emerald-200/70">Honor physical &amp; mental recovery</span>
        </div>
        <button
          type="button"
          onClick={() => setRestDayActive(!restDayActive)}
          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer border-0 ${
            restDayActive ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-white/20'
          }`}
          aria-label="Toggle Rest Day Mode"
        >
          <motion.div
            className="w-5 h-5 rounded-full bg-white shadow-md absolute top-0.5"
            animate={{ left: restDayActive ? '26px' : '3px' }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </button>
      </motion.div>

      {/* Streak Status Badge with Protective Halo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={isVisible ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.7, delay: 0.45, ease: EASE.expoOut }}
        className="p-5 rounded-2xl bg-emerald-950/60 border border-emerald-400/30 text-center space-y-2.5 relative overflow-hidden"
      >
        {/* Protective Shield Halo Pulse */}
        {!prefersReduced && isVisible && (
          <motion.div
            className="absolute -inset-1 rounded-2xl bg-emerald-400/10 pointer-events-none"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-300 block">
            {restDayActive ? 'Rest Day Active — Zero Guilt' : 'Active Momentum Rhythm'}
          </span>
        </div>

        <div className="text-3xl font-editorial font-bold text-[#FAF7F0]">
          <CountUp target={12} suffix=" Days" isVisible={isVisible} delay={0.6} duration={1.6} />{' '}
          <span className="text-xs font-normal text-emerald-200">Preserved Streak</span>
        </div>

        <p className="text-xs text-emerald-100/70 italic max-w-xs mx-auto">
          “Recovery is the fertile soil from which strength emerges.”
        </p>
      </motion.div>
    </div>
  );
}
