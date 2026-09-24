import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { EASE, ARCHITECTURE } from '../../motionConfig';

/**
 * PillarDivider
 * ─────────────────────────────────────────────────────────────────────────────
 * Scroll-triggered interactive separator between adjacent pillars:
 * 1. Thin horizontal line draws outward from center (scaleX 0 -> 1)
 * 2. Small glowing dot in the center pulses once after the line draws
 * 3. Centered uppercase label fades in for the next incoming pillar
 *
 * Props:
 *   index: number — separator index (1 to 5)
 *   label: string — uppercase label (e.g. "PILLAR 02 · HANDS-FREE AI")
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function PillarDivider({ index, label }) {
  const containerRef = useRef(null);
  const prefersReduced = useReducedMotion();

  const isInView = useInView(containerRef, {
    amount: 0.6,
    once: true,
  });

  const shouldAnimate = !prefersReduced;

  return (
    <div
      ref={containerRef}
      role="separator"
      aria-label={label}
      className="relative w-full max-w-2xl sm:max-w-4xl mx-auto my-8 sm:my-14 flex items-center justify-center pointer-events-none select-none px-4"
    >
      {/* ── 1. The Thin Horizontal Divider Line (Draws outward from center) ── */}
      <motion.div
        className="w-full h-[1px]"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(250, 247, 240, 0.15) 20%, rgba(52, 211, 153, 0.35) 50%, rgba(250, 247, 240, 0.15) 80%, transparent 100%)',
          transformOrigin: 'center center',
        }}
        initial={{ scaleX: shouldAnimate ? 0 : 1, opacity: shouldAnimate ? 0 : 1 }}
        animate={
          isInView || !shouldAnimate
            ? { scaleX: 1, opacity: 1 }
            : { scaleX: 0, opacity: 0 }
        }
        transition={{
          duration: ARCHITECTURE.dividerDrawDuration || 0.75,
          ease: EASE.expoOut,
        }}
      />

      {/* ── 2. Glowing Center Dot (Pulses softly once after line draws) ── */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
        initial={{ scale: shouldAnimate ? 0 : 1, opacity: shouldAnimate ? 0 : 1 }}
        animate={
          isInView || !shouldAnimate
            ? {
                scale: shouldAnimate ? [0, 1.4, 1] : 1,
                opacity: [0, 1, 0.85],
              }
            : { scale: 0, opacity: 0 }
        }
        transition={{
          delay: ARCHITECTURE.dividerDotDelay || 0.55,
          duration: 0.45,
          ease: EASE.expoOut,
        }}
      >
        {/* Soft pulse glow behind dot */}
        <div className="absolute w-5 h-5 rounded-full bg-emerald-400/25 blur-xs" />
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-300 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
      </motion.div>

      {/* ── 3. Centered Label (Fades in with dark-green backdrop gap) ── */}
      {label && (
        <motion.div
          className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 sm:px-4 py-0.5 rounded-full bg-[#093D30] border border-emerald-500/20 shadow-sm backdrop-blur-md"
          initial={{ opacity: shouldAnimate ? 0 : 1, y: shouldAnimate ? 4 : 0 }}
          animate={
            isInView || !shouldAnimate
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: 4 }
          }
          transition={{
            delay: ARCHITECTURE.dividerLabelDelay || 0.75,
            duration: 0.5,
            ease: EASE.expoOut,
          }}
        >
          <span className="text-[9px] sm:text-[10px] font-mono uppercase font-bold tracking-[0.14em] text-emerald-300/90 whitespace-nowrap">
            {label}
          </span>
        </motion.div>
      )}
    </div>
  );
}
