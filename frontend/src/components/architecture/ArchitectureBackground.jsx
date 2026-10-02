import React, { useMemo } from 'react';
import { motion, useTransform, useReducedMotion } from 'framer-motion';
import { ARCHITECTURE } from '../../motionConfig';

/**
 * ArchitectureBackground
 * ─────────────────────────────────────────────────────────────────────────────
 * Atmospheric dark botanical background:
 * - Dynamic Spotlight centered on active pillar with tailored chromatic tints
 * - Aurora light blobs drifting with scroll parallax
 * - Firefly particles floating upward (paused when off-screen)
 * - Fine film grain & vignette overlay
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function ArchitectureBackground({
  activePillarIndex = 0,
  scrollYProgress,
  isInSection = true,
}) {
  const prefersReduced = useReducedMotion();

  // Scroll Parallax for Aurora Blobs
  const blob1Y = useTransform(scrollYProgress || { get: () => 0 }, [0, 1], [-ARCHITECTURE.auroraBlobParallax[0], ARCHITECTURE.auroraBlobParallax[0]]);
  const blob2Y = useTransform(scrollYProgress || { get: () => 0 }, [0, 1], [ARCHITECTURE.auroraBlobParallax[1], -ARCHITECTURE.auroraBlobParallax[1]]);
  const blob3Y = useTransform(scrollYProgress || { get: () => 0 }, [0, 1], [-ARCHITECTURE.auroraBlobParallax[2], ARCHITECTURE.auroraBlobParallax[2]]);

  // Spotlight Tint and Position based on Active Pillar
  const currentTint = ARCHITECTURE.spotlightTints[activePillarIndex] || ARCHITECTURE.spotlightTints[0];
  const spotlightTopPct = 12 + activePillarIndex * 15; // 12% to ~87%

  // 24 Firefly Particles on Desktop, 10 on Mobile
  const fireflies = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      left: `${(i * 17 + 7) % 94}%`,
      top: `${(i * 23 + 11) % 90}%`,
      size: 2 + (i % 3) * 1.5,
      duration: 6 + (i % 5) * 2.5,
      delay: (i % 6) * 1.2,
      opacity: 0.15 + (i % 4) * 0.1,
      driftX: -15 + (i % 7) * 5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none -z-10">
      {/* ── Dynamic Spotlight Glow (Centered on Active Pillar) ── */}
      <motion.div
        className="absolute left-1/2 -translate-x-1/2 w-[750px] h-[750px] rounded-full blur-[140px] pointer-events-none transition-all"
        style={{
          top: `${spotlightTopPct}%`,
          backgroundColor: currentTint,
        }}
        animate={{
          backgroundColor: currentTint,
          scale: [1, 1.06, 1],
        }}
        transition={{
          backgroundColor: { duration: 1.0, ease: 'easeOut' },
          scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* ── Aurora Light Blobs ── */}
      <motion.div
        style={{ y: prefersReduced ? 0 : blob1Y }}
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#14876B]/35 blur-[130px]"
      />
      <motion.div
        style={{ y: prefersReduced ? 0 : blob2Y }}
        className="absolute top-1/2 -right-32 w-[650px] h-[650px] rounded-full bg-[#0891B2]/20 blur-[150px]"
      />
      <motion.div
        style={{ y: prefersReduced ? 0 : blob3Y }}
        className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full bg-[#0A4839]/60 blur-[130px]"
      />

      {/* ── Fine Radial Vignette & Sheen ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.06),_transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_50%,_rgba(0,0,0,0.35)_100%)]" />

      {/* ── Floating Firefly Particles (Desktop & Mobile) ── */}
      {!prefersReduced && isInSection && (
        <div className="absolute inset-0 overflow-hidden">
          {fireflies.map((p, idx) => (
            <motion.div
              key={p.id}
              className={`absolute rounded-full bg-[#A7F3D0] ${idx >= 10 ? 'hidden md:block' : 'block'}`}
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                boxShadow: '0 0 8px 1px rgba(167, 243, 208, 0.6)',
              }}
              animate={{
                y: [0, -60, -120],
                x: [0, p.driftX, 0],
                opacity: [0, p.opacity, 0],
              }}
              transition={{
                duration: p.duration,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}

      {/* ── Fine Film Grain Texture (3.5% Opacity) ── */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}
