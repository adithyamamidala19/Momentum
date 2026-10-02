import React, { useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE, RITUAL_LOOP } from '../../motionConfig';

/**
 * RitualCard
 * ─────────────────────────────────────────────────────────────────────────────
 * Single card in The Daily Ritual Loop Vertical Zig-Zag Timeline:
 * - Alternates Left (~44% width) on steps 01 & 03, Right on steps 02 & 04 (desktop)
 * - Single column layout on mobile (<1024px)
 * - Entrance triggered when traveling dot reaches threshold (x: +/-80px -> 0, blur 6px -> 0)
 * - Inner staggered reveal: number -> title -> description
 * - Active state: lifts -6px, number darkens to forest green (#0F6E56), subtle day glow
 * - Desktop hover lift (-8px), 3D cursor tilt (max 3°), and sheen sweep
 * - Full accessibility with semantic <li> and :focus-visible
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function RitualCard({
  item,
  index,
  isActive = false,
  isReached = false,
  isMobile = false,
}) {
  const cardRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const isEven = index % 2 === 0; // Steps 01 and 03 are even (Left on desktop)
  const tint = RITUAL_LOOP.timeOfDayTints[index] || RITUAL_LOOP.timeOfDayTints[0];

  // 3D Cursor tilt calculation (desktop fine pointer only)
  const handleMouseMove = useCallback(
    (e) => {
      if (prefersReduced || isMobile || !cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -RITUAL_LOOP.maxTiltDeg;
      const rotateY = ((x - centerX) / centerX) * RITUAL_LOOP.maxTiltDeg;

      setTilt({ rotateX, rotateY });
    },
    [prefersReduced, isMobile]
  );

  const handleMouseEnter = () => !isMobile && setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const initialSlideX = isMobile
    ? RITUAL_LOOP.cardSlideDistanceMobile || 40
    : isEven
    ? -(RITUAL_LOOP.cardSlideDistanceDesktop || 80)
    : RITUAL_LOOP.cardSlideDistanceDesktop || 80;

  return (
    <motion.li
      ref={cardRef}
      role="article"
      tabIndex={0}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      initial={
        prefersReduced
          ? { opacity: 1, x: 0, filter: 'blur(0px)' }
          : { opacity: 0, x: initialSlideX, filter: 'blur(6px)' }
      }
      animate={
        isReached || prefersReduced
          ? {
              opacity: 1,
              x: 0,
              y: isHovered
                ? RITUAL_LOOP.cardLiftHover
                : isActive
                ? RITUAL_LOOP.cardLiftActive
                : 0,
              filter: 'blur(0px)',
              rotateX: isMobile ? 0 : tilt.rotateX,
              rotateY: isMobile ? 0 : tilt.rotateY,
            }
          : { opacity: 0, x: initialSlideX, y: 0, filter: 'blur(6px)' }
      }
      transition={{
        opacity: { duration: prefersReduced ? 0 : RITUAL_LOOP.cardEntranceDuration, ease: EASE.expoOut },
        x: { duration: prefersReduced ? 0 : RITUAL_LOOP.cardEntranceDuration, ease: EASE.expoOut },
        y: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
        filter: { duration: prefersReduced ? 0 : 0.8, ease: EASE.expoOut },
        rotateX: { duration: 0.2, ease: 'easeOut' },
        rotateY: { duration: 0.2, ease: 'easeOut' },
      }}
      style={{
        transformStyle: 'preserve-3d',
        backgroundColor: isActive ? tint.bg : '#F9F9F8',
        borderColor: isActive ? tint.border : '#E6E6E3',
        boxShadow: isActive ? tint.glow : '0 2px 10px rgba(0, 0, 0, 0.03)',
      }}
      className={`relative p-6 sm:p-8 rounded-3xl border transition-colors duration-500 flex flex-col justify-between overflow-hidden cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0F6E56] select-none ${
        isActive ? 'ring-1 ring-emerald-600/20' : ''
      }`}
    >
      {/* ── Connector Node / Tick connecting to timeline line ── */}
      {!prefersReduced && (
        <div
          aria-hidden="true"
          className={`hidden lg:block absolute top-1/2 -translate-y-1/2 w-6 h-[1.5px] transition-colors duration-500 ${
            isEven ? '-right-6' : '-left-6'
          } ${isActive ? 'bg-[#0F6E56]' : 'bg-emerald-900/20'}`}
        />
      )}

      {/* Mobile Connector Node */}
      {!prefersReduced && isMobile && (
        <div
          aria-hidden="true"
          className={`block lg:hidden absolute top-1/2 -translate-y-1/2 -left-6 w-6 h-[1.5px] transition-colors duration-500 ${
            isActive ? 'bg-[#0F6E56]' : 'bg-emerald-900/20'
          }`}
        />
      )}

      {/* ── Desktop Hover Sheen Sweep ── */}
      {isHovered && !prefersReduced && !isMobile && (
        <motion.div
          className="absolute inset-0 pointer-events-none bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 z-20"
          initial={{ x: '-100%' }}
          animate={{ x: '200%' }}
          transition={{ duration: 0.85, ease: 'easeInOut' }}
        />
      )}

      {/* ── Active Top Glow Indicator Line ── */}
      {isActive && (
        <motion.div
          layoutId="ritual-active-indicator"
          className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-[#0F6E56] to-emerald-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      )}

      {/* ── Card Content: Number -> Title -> Description ── */}
      <div className="space-y-4 relative z-10">
        {/* 1. Step Number (darkens from sage to forest green on active) */}
        <motion.span
          className="font-editorial text-3xl sm:text-4xl font-normal block transition-colors duration-500"
          style={{
            color: isActive ? '#0F6E56' : 'rgba(15, 110, 86, 0.45)',
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={isReached || prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{
            duration: 0.5,
            delay: RITUAL_LOOP.cardInnerStagger,
            ease: EASE.expoOut,
          }}
        >
          {item.step}
        </motion.span>

        {/* 2. Title */}
        <motion.h3
          className="font-editorial text-xl sm:text-2xl font-normal text-on-surface leading-snug"
          initial={{ opacity: 0, y: 10 }}
          animate={isReached || prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{
            duration: 0.5,
            delay: RITUAL_LOOP.cardInnerStagger * 2,
            ease: EASE.expoOut,
          }}
        >
          {item.title}
        </motion.h3>

        {/* 3. Description */}
        <motion.p
          className="text-sm text-outline leading-relaxed font-normal"
          initial={{ opacity: 0, y: 10 }}
          animate={isReached || prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{
            duration: 0.5,
            delay: RITUAL_LOOP.cardInnerStagger * 3,
            ease: EASE.expoOut,
          }}
        >
          {item.desc}
        </motion.p>
      </div>

      {/* ── Bottom Step Status Pill ── */}
      <div className="mt-6 pt-4 border-t border-black/5 flex items-center justify-between text-[11px] font-mono text-outline">
        <span className="capitalize font-medium">{tint.name} Step</span>
        {isActive ? (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-bold shadow-2xs"
            style={{
              backgroundColor: tint.badgeBg,
              color: tint.badgeText,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E56] animate-ping" />
            Active
          </span>
        ) : (
          <span className="text-outline/70">
            {isReached ? 'Completed' : 'Upcoming'}
          </span>
        )}
      </div>
    </motion.li>
  );
}
