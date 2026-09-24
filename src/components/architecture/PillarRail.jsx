import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * PillarRail
 * ─────────────────────────────────────────────────────────────────────────────
 * Left-edge vertical dot rail for quick pillar orientation:
 * - Rendered ONCE as a fixed element, visible ONLY while ArchitectureSection is in view
 * - 6 dots with dynamic connector progress line
 * - Active dot fills with glowing emerald accent and spring ring
 * - Clicking a dot triggers native smooth scroll to that pillar
 * - Fully keyboard accessible with aria-labels and focus-visible outlines
 * - Hidden on mobile (desktop only: lg:flex)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function PillarRail({
  activePillarIndex = 0,
  pillars = [],
  onSelectPillar,
  isVisible = false,
}) {
  const prefersReduced = useReducedMotion();

  const handleDotClick = (index, id) => {
    if (onSelectPillar) {
      onSelectPillar(index);
    }
    const el = document.getElementById(`pillar-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
    }
  };

  const lineProgressPct = (activePillarIndex / Math.max(1, pillars.length - 1)) * 100;

  return (
    <aside
      aria-label="Architecture Pillars Navigation"
      className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-30 flex-col items-center select-none"
      style={{
        pointerEvents: isVisible ? 'auto' : 'none',
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={
          isVisible
            ? { opacity: 1, x: 0 }
            : { opacity: 0, x: -16 }
        }
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex flex-col items-center gap-6 py-4 px-2 rounded-full bg-[#082A21]/80 backdrop-blur-lg border border-emerald-500/25 shadow-xl"
      >
        {/* Background Track Line */}
        <div className="absolute top-5 bottom-5 w-0.5 bg-white/15 rounded-full" />

        {/* Active Fill Line */}
        <motion.div
          className="absolute top-5 w-0.5 bg-emerald-400 rounded-full origin-top shadow-[0_0_8px_rgba(52,211,153,0.8)]"
          style={{
            height: `calc(${lineProgressPct}% * (1 - 32px / 100%))`,
          }}
          animate={{
            height: `${lineProgressPct}%`,
          }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />

        {/* 6 Interactive Dots */}
        {pillars.map((p, idx) => {
          const isActive = activePillarIndex === idx;
          const pillarNum = idx + 1;
          const ariaLabelText = `Go to pillar ${pillarNum}: ${p.title}`;

          return (
            <button
              key={p.id}
              type="button"
              onClick={() => handleDotClick(idx, p.id)}
              aria-label={ariaLabelText}
              aria-current={isActive ? 'step' : undefined}
              className="group relative z-10 w-6 h-6 flex items-center justify-center cursor-pointer border-0 bg-transparent p-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 rounded-full transition-transform"
            >
              {/* Active Outer Ring */}
              {isActive && (
                <motion.div
                  layoutId="pillarActiveDotRing"
                  className="absolute inset-0 rounded-full border-2 border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.6)]"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              {/* Inner Dot */}
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-emerald-300 scale-110 shadow-sm'
                    : 'bg-white/35 group-hover:bg-white/80 group-hover:scale-125'
                }`}
              />

              {/* Hover Tooltip Label */}
              <span className="absolute left-9 px-2.5 py-1 rounded-md bg-[#062019] border border-emerald-500/30 text-[11px] font-mono font-semibold text-emerald-200 whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                {p.navLabel || `0${pillarNum} ${p.title}`}
              </span>
            </button>
          );
        })}
      </motion.div>
    </aside>
  );
}
