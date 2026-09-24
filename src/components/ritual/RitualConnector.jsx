import React, { useState, useEffect } from 'react';
import { motion, useTransform, useReducedMotion } from 'framer-motion';
import { RITUAL_LOOP } from '../../motionConfig';

/**
 * RitualConnector
 * ─────────────────────────────────────────────────────────────────────────────
 * Vertical scroll-linked timeline line and glowing traveling forest-green dot:
 * - Desktop: Center-aligned vertical spine (left: 50%)
 * - Mobile: Left-aligned vertical spine (left: 24px)
 * - Active drawing line driven by smooth scroll progress
 * - Glowing forest-green dot traveling down the line in exact sync
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function RitualConnector({ smoothProgress }) {
  const prefersReduced = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Map progress (0 to 1) to vertical line fill scaleY (0 to 1)
  const lineScaleY = useTransform(smoothProgress, [0.05, 0.88], [0, 1]);

  // Dot position along the vertical spine: travels from top card height (~6%) to bottom card height (~94%)
  const dotTop = useTransform(smoothProgress, [0.05, 0.88], ['4%', '96%']);
  const dotOpacity = useTransform(smoothProgress, [0.02, 0.08, 0.94, 1.0], [0, 1, 1, 0.85]);

  if (prefersReduced) {
    return (
      <div
        aria-hidden="true"
        className={`absolute top-4 bottom-4 pointer-events-none z-10 ${
          isMobile ? 'left-6 w-0.5' : 'left-1/2 -translate-x-1/2 w-0.5'
        } bg-emerald-900/15`}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className={`absolute top-4 bottom-4 pointer-events-none z-10 ${
        isMobile ? 'left-6 w-0.5' : 'left-1/2 -translate-x-1/2 w-0.5'
      }`}
    >
      {/* ── Background Track Line ── */}
      <div className="absolute inset-0 bg-emerald-900/12 rounded-full" />

      {/* ── Active Drawing Line (Forest Green) ── */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-b from-[#0F6E56] via-[#0F6E56] to-emerald-400 rounded-full origin-top shadow-[0_0_8px_rgba(15,110,86,0.3)]"
        style={{
          scaleY: lineScaleY,
        }}
      />

      {/* ── Traveling Glowing Forest-Green Dot ── */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none z-20"
        style={{
          top: dotTop,
          opacity: dotOpacity,
        }}
      >
        {/* Pulsing ring aura */}
        <div className="w-6 h-6 rounded-full bg-[#0F6E56]/25 animate-ping absolute" />
        {/* Soft glow backdrop */}
        <div className="w-5 h-5 rounded-full bg-[#0F6E56]/40 blur-xs absolute" />
        {/* Solid core dot with crisp white border */}
        <div className="w-3.5 h-3.5 rounded-full bg-[#0F6E56] border-2 border-white shadow-md relative z-10" />
      </motion.div>
    </div>
  );
}
