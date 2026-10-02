import React from 'react';
import { motion, useTransform, useSpring, useReducedMotion } from 'framer-motion';
import { ARCHITECTURE } from '../../motionConfig';

/**
 * SectionCurves
 * ─────────────────────────────────────────────────────────────────────────────
 * Scroll-linked dynamic curved edges for Architecture of Mindfulness section:
 *
 * TOP CURVE (cream to green):
 * - Driven by useScroll offset ['start end', 'start 0.3'] + useSpring.
 * - Rises from flat (scaleY: 0) to full curved amplitude (scaleY: 1).
 * - Rises and settles smoothly, staying in place with no continuous wave.
 *
 * BOTTOM CURVE (green to cream):
 * - Driven by useScroll offset ['end 0.7', 'end start'] + useSpring.
 * - Softly curves and closes from flat to full curved amplitude.
 *
 * Performance:
 * - Pure transform (scaleY) on GPU layer for rock-solid 60fps.
 * - Zero seam or subpixel gap via -top-px / -bottom-px subpixel anchoring.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function SectionTopCurve({ topProgress }) {
  const prefersReduced = useReducedMotion();

  // Smooth raw scroll with spring
  const topSpring = useSpring(topProgress, {
    stiffness: 120,
    damping: 22,
    restDelta: 0.001,
  });

  // ScaleY from 0 (flat edge) to 1 (settled curve)
  const scaleY = useTransform(topSpring, [0, 1], [0, 1]);

  return (
    <div
      className="absolute -top-[1px] left-0 right-0 w-full overflow-hidden pointer-events-none z-20 h-[50px] sm:h-[85px] lg:h-[120px]"
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 1440 120"
        className="w-full h-full block"
        preserveAspectRatio="none"
        style={{
          scaleY: prefersReduced ? 1 : scaleY,
          transformOrigin: 'top center',
        }}
      >
        <path
          d="M0,0 C480,120 960,120 1440,0 L1440,0 L0,0 Z"
          fill="#F9F9F8"
        />
      </motion.svg>
    </div>
  );
}

export function SectionBottomCurve({ bottomProgress }) {
  const prefersReduced = useReducedMotion();

  const bottomSpring = useSpring(bottomProgress, {
    stiffness: 120,
    damping: 22,
    restDelta: 0.001,
  });

  // ScaleY from 0 (flat edge) to 1 (settled closing curve)
  const scaleY = useTransform(bottomSpring, [0, 1], [0, 1]);

  return (
    <div
      className="absolute -bottom-[1px] left-0 right-0 w-full overflow-hidden pointer-events-none z-20 h-[50px] sm:h-[85px] lg:h-[120px]"
      aria-hidden="true"
    >
      <motion.svg
        viewBox="0 0 1440 120"
        className="w-full h-full block"
        preserveAspectRatio="none"
        style={{
          scaleY: prefersReduced ? 1 : scaleY,
          transformOrigin: 'bottom center',
        }}
      >
        <path
          d="M0,120 C480,0 960,0 1440,120 L1440,120 L0,120 Z"
          fill="#F9F9F8"
        />
      </motion.svg>
    </div>
  );
}

export default function SectionCurves({ topProgress, bottomProgress }) {
  return (
    <>
      <SectionTopCurve topProgress={topProgress} />
      <SectionBottomCurve bottomProgress={bottomProgress} />
    </>
  );
}
