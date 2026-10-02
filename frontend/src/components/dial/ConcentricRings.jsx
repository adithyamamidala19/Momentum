import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import CountUp from '../architecture/CountUp.jsx';
import { EASE } from '../../motionConfig.js';

export default function ConcentricRings({ habitPct = 0, focusPct = 0, waterPct = 0, adherenceScore = 0 }) {
  const prefersReduced = useReducedMotion();

  // SVG dimensions
  const size = 160;
  const center = size / 2;

  // Outer Ring (Habits - Brand Forest Green)
  const rHabits = 68;
  const circHabits = 2 * Math.PI * rHabits;
  const offsetHabits = circHabits - (circHabits * Math.min(100, Math.max(0, habitPct))) / 100;

  // Middle Ring (Focus - Amber Warmth)
  const rFocus = 54;
  const circFocus = 2 * Math.PI * rFocus;
  const offsetFocus = circFocus - (circFocus * Math.min(100, Math.max(0, focusPct))) / 100;

  // Inner Ring (Hydration - Vitality Teal)
  const rWater = 40;
  const circWater = 2 * Math.PI * rWater;
  const offsetWater = circWater - (circWater * Math.min(100, Math.max(0, waterPct))) / 100;

  const duration = prefersReduced ? 0.001 : 1.6;
  const easeCurve = [0.22, 1, 0.36, 1];

  return (
    <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center select-none shrink-0">
      <svg
        viewBox="0 0 160 160"
        className="w-full h-full -rotate-90 transform overflow-visible"
        aria-label={`Daily adherence ${adherenceScore} percent`}
        role="meter"
        aria-valuenow={adherenceScore}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        {/* Background Track Rings */}
        <circle
          cx={center}
          cy={center}
          r={rHabits}
          fill="none"
          stroke="rgba(15, 110, 86, 0.12)"
          strokeWidth="6"
        />
        <circle
          cx={center}
          cy={center}
          r={rFocus}
          fill="none"
          stroke="rgba(217, 119, 6, 0.12)"
          strokeWidth="6"
        />
        <circle
          cx={center}
          cy={center}
          r={rWater}
          fill="none"
          stroke="rgba(8, 145, 178, 0.12)"
          strokeWidth="6"
        />

        {/* Active Animated Progress Rings */}
        <motion.circle
          cx={center}
          cy={center}
          r={rHabits}
          fill="none"
          stroke="#0F6E56"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circHabits}
          initial={{ strokeDashoffset: circHabits }}
          animate={{ strokeDashoffset: offsetHabits }}
          transition={{ duration, ease: easeCurve }}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={rFocus}
          fill="none"
          stroke="#D97706"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circFocus}
          initial={{ strokeDashoffset: circFocus }}
          animate={{ strokeDashoffset: offsetFocus }}
          transition={{ duration, delay: prefersReduced ? 0 : 0.15, ease: easeCurve }}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={rWater}
          fill="none"
          stroke="#0891B2"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circWater}
          initial={{ strokeDashoffset: circWater }}
          animate={{ strokeDashoffset: offsetWater }}
          transition={{ duration, delay: prefersReduced ? 0 : 0.3, ease: easeCurve }}
        />
      </svg>

      {/* Center Clearance Text Readout with CountUp */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
        style={{ width: '78px', height: '78px', margin: 'auto' }}
      >
        <span
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface leading-none"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          <CountUp value={adherenceScore} duration={1.5} />%
        </span>
        <span className="text-[10px] uppercase font-semibold tracking-wider text-outline mt-1 leading-tight">
          Adherence
        </span>
      </div>
    </div>
  );
}
