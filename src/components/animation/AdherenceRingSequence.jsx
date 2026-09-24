import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
  animate,
} from 'framer-motion';
import { ChevronRight, Volume2 } from 'lucide-react';
import { RING, EASE, ANIM_COLORS } from '../../motionConfig';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { MeditativeAudio } from '../../../js/services/soundscape.js';

/**
 * AdherenceRingSequence
 * ──────────────────────────────────────────────────────────────────────────
 * 3-act cinematic scroll-triggered card.
 *
 * ACT 1 — RING CENTER (scroll enters viewport):
 *   • Rings draw in from center of the card, one by one (outer → inner)
 *   • Teal arc sweeps to adherence%; center counter counts up slowly & smoothly
 *   • Ring is visually centered in the entire card
 *
 * ACT 2 — DIRECT SLOW BUTTERY GLIDE (after arc sweep completes):
 *   • Ring smoothly, slowly, and continuously glides from center to the left
 *   • NO jumping, NO snapping, NO disappearing
 *   • Right column expands its width smoothly over 1.4s
 *   • Card header fades in smoothly
 *
 * ACT 3 — CONTENT CASCADE (ring settled in left column):
 *   • "Active Rhythm Status" label + title smoothly enter
 *   • Description paragraph
 *   • 3 stat pills enter with slow, gradual count-ups
 *   • Quote + "Jump to Today" link
 *
 * Props:
 *   setView: (view: string) => void
 * ──────────────────────────────────────────────────────────────────────────
 */

// ── Animated count-up hook ────────────────────────────────────────────────
function useCountUp(target, duration, delay, isActive) {
  const [count, setCount] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isActive || startedRef.current) return;
    startedRef.current = true;

    const timer = setTimeout(() => {
      const controls = animate(0, target, {
        duration: duration / 1000,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (v) => setCount(Math.round(v)),
      });
      return () => controls.stop();
    }, delay);

    return () => clearTimeout(timer);
  }, [isActive, target, duration, delay]);

  return count;
}

// ── SVG animated ring (pathLength draw) ──────────────────────────────────
function AnimatedRing({ cx, cy, r, stroke, strokeWidth = 6, delay = 0, isVisible, fillPct = 1 }) {
  const circumference = 2 * Math.PI * r;
  const targetOffset = circumference * (1 - Math.min(1, fillPct));
  return (
    <motion.circle
      cx={cx} cy={cy} r={r}
      fill="none" stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeDasharray={circumference}
      initial={{ strokeDashoffset: circumference, opacity: 0 }}
      animate={
        isVisible
          ? { strokeDashoffset: targetOffset, opacity: 1 }
          : { strokeDashoffset: circumference, opacity: 0 }
      }
      transition={{
        strokeDashoffset: { duration: 1.8, delay, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.5, delay },
      }}
    />
  );
}

// ── Teal main arc sweep ───────────────────────────────────────────────────
function TealArc({ cx, cy, r, pct, isVisible, delay = 0 }) {
  const circumference = 2 * Math.PI * r;
  const targetOffset = circumference - (circumference * pct) / 100;
  return (
    <motion.circle
      cx={cx} cy={cy} r={r}
      fill="none"
      stroke={ANIM_COLORS.tealArc}
      strokeWidth={7}
      strokeLinecap="round"
      strokeDasharray={circumference}
      className="ring-glow"
      initial={{ strokeDashoffset: circumference, opacity: 0 }}
      animate={
        isVisible
          ? { strokeDashoffset: targetOffset, opacity: 1 }
          : { strokeDashoffset: circumference, opacity: 0 }
      }
      transition={{
        strokeDashoffset: { duration: 2.2, delay, ease: [0.16, 1, 0.3, 1] },
        opacity: { duration: 0.5, delay },
      }}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────
export default function AdherenceRingSequence({ setView }) {
  const { state, metrics } = useMomentum();
  const [soundPlaying, setSoundPlaying] = useState(false);
  const prefersReduced = useReducedMotion();

  const sectionRef = useRef(null);
  const cardRef = useRef(null);

  const isInView = useInView(sectionRef, { amount: 0.25, once: true });

  const [stage, setStage] = useState('idle');

  useEffect(() => {
    if (!isInView) return;

    if (prefersReduced) {
      setStage('content');
      return;
    }

    // ACT 1 — start drawing immediately
    setStage('drawing');

    // ACT 2 — after arc sweep completes + settle buffer, slowly and smoothly glide left
    // 0.7s delay + 2.2s sweep + 0.6s settle buffer = 3.5s
    const settleTimer = setTimeout(() => setStage('settling'), 3500);

    // ACT 3 — cascade right-column content as ring finishes gliding
    const contentTimer = setTimeout(() => setStage('content'), 4600);

    return () => {
      clearTimeout(settleTimer);
      clearTimeout(contentTimer);
    };
  }, [isInView, prefersReduced]);

  // Scroll parallax
  const { scrollYProgress } = useScroll({ target: cardRef, offset: ['start end', 'end start'] });
  const cardY = useTransform(scrollYProgress, [0, 1], [-RING.parallaxRange, RING.parallaxRange]);

  // Live data
  const adherenceScore = metrics.dailyAdherenceScore ?? 15;
  const totalPoints    = metrics.totalPoints ?? 1628;
  const streakDays     = state.streakDays ?? 1;
  const waterGlasses   = state.waterGlasses ?? 6;

  // Count-ups (slow, gradual, butter-smooth)
  const ringActive = stage !== 'idle';
  const contentActive = stage === 'content';
  const isSettled = stage === 'settling' || stage === 'content';

  const countedAdherence = useCountUp(adherenceScore, 2200, 700, ringActive);
  const countedPoints    = useCountUp(totalPoints, 1800, 200, contentActive);
  const countedStreak    = useCountUp(streakDays, 1400, 400, contentActive);
  const countedWater     = useCountUp(waterGlasses, 1400, 600, contentActive);

  const handlePlayCalmChime = () => {
    try { MeditativeAudio.playChime(); setSoundPlaying(true); setTimeout(() => setSoundPlaying(false), 1800); } catch (e) {}
  };

  // SVG dimensions
  const size = 160, center = size / 2;
  const rHabits = 68, rFocus = 54, rWater = 40;

  // Content stagger helper
  const contentItem = (n) => ({
    initial: { opacity: 0, y: 14 },
    animate: contentActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 },
    transition: { duration: 0.7, delay: n * 0.14, ease: [0.22, 1, 0.36, 1] },
  });

  return (
    <motion.div
      ref={sectionRef}
      style={{ y: prefersReduced ? 0 : cardY }}
    >
      <motion.div
        ref={cardRef}
        className="glass-card rounded-3xl relative overflow-hidden text-left max-w-3xl mx-auto shadow-xl"
        initial={{ opacity: 0, y: 24 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        transition={{ duration: 0.8, ease: EASE.expoOut }}
      >
        {/* ── CARD HEADER — fades in smoothly as ring glides ──────────── */}
        <motion.div
          className="flex items-center justify-between border-b hairline-b px-6 sm:px-8 py-3.5 bg-surface-container-lowest/40 backdrop-blur-sm"
          initial={{ opacity: 0, y: -10 }}
          animate={
            isSettled
              ? { opacity: 1, y: 0 }
              : { opacity: 0, y: -10 }
          }
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            <span className="text-[11px] font-mono text-outline ml-2">sanctuary.adherence.engine</span>
          </div>
          <button
            type="button"
            onClick={handlePlayCalmChime}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-xs text-on-surface hover:bg-primary-container hover:text-white transition-all cursor-pointer border-0"
          >
            <Volume2 className={`w-3.5 h-3.5 ${soundPlaying ? 'animate-bounce text-amber-300' : ''}`} />
            <span>{soundPlaying ? 'Playing Singing Bowl...' : 'Preview Soundscape'}</span>
          </button>
        </motion.div>

        {/* ── CARD BODY (Continuous Fluid Flex Layout — Zero Jumping) ─────── */}
        <div className="p-6 sm:p-8 pt-6 sm:pt-7">
          <div className="flex flex-col sm:flex-row items-center justify-center min-h-[260px] gap-6 relative">

            {/* ── Ring Column: ALWAYS mounted, smoothly transitions position ── */}
            <motion.div
              className={`flex flex-col items-center justify-center p-4 rounded-2xl shrink-0 transition-colors duration-1000 ${
                isSettled ? 'bg-surface-container-low/60' : 'bg-transparent'
              }`}
              animate={{
                scale: isSettled ? 1 : 1.05,
              }}
              transition={{
                duration: 1.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {/* Breathing idle pulse wrapper */}
              <motion.div
                animate={
                  contentActive
                    ? { scale: [1, 1.018, 1], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' } }
                    : {}
                }
              >
                <div className="relative w-40 h-40 sm:w-44 sm:h-44 flex items-center justify-center select-none shrink-0">
                  <svg
                    viewBox={`0 0 ${size} ${size}`}
                    className="w-full h-full -rotate-90 transform"
                    aria-label={`Daily adherence ${adherenceScore} percent`}
                    role="meter"
                    aria-valuenow={adherenceScore}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    {/* Background track rings */}
                    <motion.circle cx={center} cy={center} r={rHabits}
                      fill="none" stroke="rgba(15, 110, 86, 0.12)" strokeWidth="6"
                      initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                    />
                    <motion.circle cx={center} cy={center} r={rFocus}
                      fill="none" stroke="rgba(217, 119, 6, 0.12)" strokeWidth="6"
                      initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.6, delay: 0.28 }}
                    />
                    <motion.circle cx={center} cy={center} r={rWater}
                      fill="none" stroke="rgba(8, 145, 178, 0.12)" strokeWidth="6"
                      initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                      transition={{ duration: 0.6, delay: 0.46 }}
                    />

                    {/* Peach ring — habits */}
                    <AnimatedRing cx={center} cy={center} r={rHabits}
                      stroke="rgba(245, 158, 11, 0.38)" strokeWidth={6}
                      delay={0.25} isVisible={ringActive}
                      fillPct={(metrics.habitPct ?? 15) / 100}
                    />
                    {/* Sage ring — focus */}
                    <AnimatedRing cx={center} cy={center} r={rFocus}
                      stroke="rgba(15, 110, 86, 0.42)" strokeWidth={6}
                      delay={0.5} isVisible={ringActive}
                      fillPct={(metrics.focusPct ?? 10) / 100}
                    />
                    {/* Sage-light ring — hydration */}
                    <AnimatedRing cx={center} cy={center} r={rWater}
                      stroke="rgba(180, 210, 195, 0.48)" strokeWidth={6}
                      delay={0.7} isVisible={ringActive}
                      fillPct={(metrics.waterPct ?? 75) / 100}
                    />

                    {/* Teal main arc — sweeps to adherenceScore% */}
                    <TealArc
                      cx={center} cy={center} r={rHabits}
                      pct={adherenceScore}
                      isVisible={ringActive}
                      delay={0.7}
                    />

                    {/* Idle slow outer rotation ring */}
                    {contentActive && (
                      <motion.circle
                        cx={center} cy={center} r={rHabits + 10}
                        fill="none" stroke="rgba(15, 110, 86, 0.08)"
                        strokeWidth={1} strokeDasharray="4 8"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
                        style={{ transformOrigin: `${center}px ${center}px` }}
                      />
                    )}
                  </svg>

                  {/* Center count-up readout */}
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
                    style={{ width: '74px', height: '74px', margin: 'auto' }}
                  >
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={ringActive ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.8, delay: 0.8, ease: EASE.expoOut }}
                      className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface leading-none"
                    >
                      {countedAdherence}%
                    </motion.span>
                    <motion.span
                      initial={{ opacity: 0, y: 3 }}
                      animate={ringActive ? { opacity: 1, y: 0 } : { opacity: 0, y: 3 }}
                      transition={{ duration: 0.6, delay: 1.1, ease: EASE.expoOut }}
                      className="text-[10px] uppercase font-semibold tracking-wider text-outline mt-1 leading-tight"
                    >
                      Adherence
                    </motion.span>
                  </div>
                </div>
              </motion.div>

              {/* "Live Adherence Ring" label */}
              <motion.span
                className="text-[11px] font-semibold text-outline mt-3 block"
                initial={{ opacity: 0 }}
                animate={isSettled ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                Live Adherence Ring
              </motion.span>
            </motion.div>

            {/* ── Right Column: Smoothly expands width, naturally gliding ring to the left ── */}
            <motion.div
              initial={false}
              animate={{
                width: isSettled ? '100%' : '0%',
                maxWidth: isSettled ? '420px' : '0px',
                opacity: isSettled ? 1 : 0,
              }}
              transition={{
                duration: 1.4,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="overflow-hidden space-y-4"
            >
              {/* Content Cascade Container */}
              <div className="min-w-[280px] sm:min-w-[340px] space-y-4 py-1">
                {/* Label + Title */}
                <motion.div {...contentItem(0)}>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary-container">
                    Active Rhythm Status
                  </span>
                  <h3 className="font-editorial text-2xl font-normal text-on-surface mt-0.5">
                    Your Mindful Day in Flow
                  </h3>
                </motion.div>

                {/* Description */}
                <motion.p
                  className="text-xs text-outline leading-relaxed"
                  {...contentItem(1)}
                >
                  All habits, hydration targets, and movement sessions synthesize harmoniously into your practice score.
                </motion.p>

                {/* Stat pills with slow gradual count-up */}
                <motion.div
                  className="grid grid-cols-3 gap-2.5 pt-1"
                  {...contentItem(2)}
                >
                  <div className="p-3 rounded-xl bg-surface-container hairline">
                    <span className="text-[10px] text-outline block">Practice Score</span>
                    <span className="font-editorial text-lg font-bold text-primary-container">
                      {contentActive ? countedPoints : 0}{' '}
                      <span className="text-xs font-normal">pts</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container hairline">
                    <span className="text-[10px] text-outline block">Active Streak</span>
                    <span className="font-editorial text-lg font-bold text-secondary-container">
                      {contentActive ? countedStreak : 0}{' '}
                      <span className="text-xs font-normal">days 🔥</span>
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-surface-container hairline">
                    <span className="text-[10px] text-outline block">Hydration</span>
                    <span className="font-editorial text-lg font-bold text-[#0891B2]">
                      {contentActive ? countedWater : 0}{' '}
                      <span className="text-xs font-normal">/ 8</span>
                    </span>
                  </div>
                </motion.div>

                {/* Quote + link */}
                <motion.div
                  className="pt-2 flex items-center justify-between"
                  {...contentItem(3)}
                >
                  <span className="text-xs text-outline italic">
                    "Small, steady actions quietly shape you."
                  </span>
                  <button
                    type="button"
                    onClick={() => setView('today')}
                    className="text-xs font-semibold text-primary-container hover:underline flex items-center gap-1 cursor-pointer border-0 bg-transparent"
                  >
                    <span>Jump to Today</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              </div>
            </motion.div>

          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
