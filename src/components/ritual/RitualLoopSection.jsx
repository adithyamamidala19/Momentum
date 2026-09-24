import React, { useRef, useState, useEffect } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useInView,
  useMotionValueEvent,
  useReducedMotion,
} from 'framer-motion';
import { EASE, RITUAL_LOOP } from '../../motionConfig';
import SplitWords from '../animation/SplitWords.jsx';
import RitualConnector from './RitualConnector.jsx';
import RitualCard from './RitualCard.jsx';

/**
 * The Daily Ritual Loop Data
 */
const RITUAL_STEPS = [
  {
    step: '01',
    title: 'Morning Intention',
    desc: 'Open Today’s Sanctuary. Review your dynamic greeting, daily wisdom quote, and set your 3 core habit intentions.',
  },
  {
    step: '02',
    title: 'Fluid Deep Work',
    desc: 'Engage 432Hz focus intervals with the non-intrusive circular timer and periodic singing bowl chimes.',
  },
  {
    step: '03',
    title: 'Strength & Rest',
    desc: 'Log per-set weights and reps. Tap ⏱ for a 90s floating rest timer, or skip habits when recovery calls.',
  },
  {
    step: '04',
    title: 'Evening Unwind',
    desc: 'Review your 30-day spline activity heatmaps, inspect your practice score, and admire your earned milestone medals.',
  },
];

/**
 * RitualLoopSection
 * ─────────────────────────────────────────────────────────────────────────────
 * "A day unfolding as you scroll" — Vertical Zig-Zag Timeline
 * - Expand & reveal entrance container
 * - Restored clean forest-green eyebrow with letter-spacing expansion (no background)
 * - Word-by-word mask reveal on title with generous line-height & breathing room
 * - Central vertical spine with traveling glowing forest-green dot
 * - Alternating 44% width cards (01 Left, 02 Right, 03 Left, 04 Right) on desktop
 * - Single column with left spine on mobile (<1024px)
 * - Semantic <section>, <h2>, <ol> and <li> elements
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function RitualLoopSection() {
  const prefersReduced = useReducedMotion();
  const sectionRef = useRef(null);
  const containerRef = useRef(null);

  const [isMobile, setIsMobile] = useState(false);
  const [activeCardIndex, setActiveCardIndex] = useState(0);
  const [reachedIndices, setReachedIndices] = useState([true, false, false, false]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Calibrated scroll tracking: completes timeline progression as section scrolls
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: RITUAL_LOOP.containerExpandOffset || ['start 85%', 'end 30%'],
  });

  // Smooth the raw scroll progress with a gentle spring
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 110,
    damping: 24,
    restDelta: 0.001,
  });

  // Track active card index & reached states based on thresholds
  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    if (prefersReduced) return;
    const thresholds = RITUAL_LOOP.timelineThresholds || [0.10, 0.34, 0.58, 0.82];

    // Determine reached cards
    const newReached = [
      latest >= 0.02,
      latest >= thresholds[1] - 0.04,
      latest >= thresholds[2] - 0.04,
      latest >= thresholds[3] - 0.04,
    ];

    if (
      newReached[0] !== reachedIndices[0] ||
      newReached[1] !== reachedIndices[1] ||
      newReached[2] !== reachedIndices[2] ||
      newReached[3] !== reachedIndices[3]
    ) {
      setReachedIndices(newReached);
    }

    // Determine current active card index
    let newActive = 0;
    if (latest < thresholds[1]) {
      newActive = 0;
    } else if (latest < thresholds[2]) {
      newActive = 1;
    } else if (latest < thresholds[3]) {
      newActive = 2;
    } else {
      newActive = 3;
    }

    if (newActive !== activeCardIndex) {
      setActiveCardIndex(newActive);
    }
  });

  // Container expand & reveal values (clip-path inset X% round Rpx)
  const insetX = isMobile ? RITUAL_LOOP.mobileInsetX : RITUAL_LOOP.desktopInsetX;
  const startRadius = isMobile ? RITUAL_LOOP.mobileStartRadius : RITUAL_LOOP.desktopStartRadius;
  const finalRadius = RITUAL_LOOP.finalRadius;

  const expandProgress = useTransform(smoothProgress, [0.0, 0.18], [0, 1]);

  const clipPathDesktop = useTransform(
    expandProgress,
    [0, 1],
    [`inset(0% ${insetX}% round ${startRadius}px)`, `inset(0% 0% round ${finalRadius}px)`]
  );

  const containerY = useTransform(expandProgress, [0, 1], [30, 0]);
  const containerShadow = useTransform(
    expandProgress,
    [0, 1],
    ['0 8px 24px rgba(0, 0, 0, 0.03)', '0 24px 48px -12px rgba(0, 0, 0, 0.08)']
  );

  // Background ambient blobs parallax
  const blob1Y = useTransform(smoothProgress, [0, 1], [-20, 30]);
  const blob2Y = useTransform(smoothProgress, [0, 1], [30, -25]);

  // Section inView trigger for header
  const isHeaderInView = useInView(containerRef, { amount: 0.15, once: true });

  return (
    <section
      ref={sectionRef}
      className="relative py-12 sm:py-20 overflow-visible"
      aria-label="The Daily Ritual Loop"
    >
      {/* ── AMBIENT BACKGROUND PARALLAX BLOBS ── */}
      {!prefersReduced && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          <motion.div
            style={{ y: blob1Y }}
            className="absolute top-1/4 -left-20 w-80 h-80 rounded-full bg-emerald-500/8 blur-3xl"
          />
          <motion.div
            style={{ y: blob2Y }}
            className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full bg-teal-600/8 blur-3xl"
          />
        </div>
      )}

      {/* ── MAIN EXPANDABLE CONTAINER CARD ── */}
      <motion.div
        ref={containerRef}
        style={{
          clipPath: prefersReduced ? 'none' : clipPathDesktop,
          y: prefersReduced ? 0 : containerY,
          boxShadow: containerShadow,
        }}
        className="relative bg-white rounded-3xl p-6 sm:p-12 lg:p-16 hairline overflow-hidden transition-shadow duration-700"
      >
        {/* Soft inner ambient gradient */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white via-white to-surface-container-lowest/40 -z-10" />

        {/* ── HEADER ── */}
        <div className="text-center max-w-xl mx-auto space-y-3 mb-14 sm:mb-20 relative z-20">
          {/* Eyebrow: Restored small uppercase forest-green text, letter-spacing expansion, NO background highlight */}
          <motion.span
            initial={{ opacity: 0, letterSpacing: '0.05em' }}
            animate={
              isHeaderInView
                ? { opacity: 1, letterSpacing: '0.14em' }
                : { opacity: 0, letterSpacing: '0.05em' }
            }
            transition={{ duration: 0.8, ease: EASE.expoOut }}
            className="text-[11px] uppercase font-bold text-[#0F6E56] block tracking-widest"
          >
            THE DAILY RITUAL LOOP
          </motion.span>

          {/* Title with Word-by-Word Mask Reveal (Generous line-height & breathing room) */}
          <h2 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-on-surface leading-[1.2] min-h-[1.4em]">
            <SplitWords
              text="How Momentum Shapes Your Day"
              isVisible={isHeaderInView}
              delay={0.15}
              stagger={RITUAL_LOOP.headerWordStagger}
            />
          </h2>
        </div>

        {/* ── THE VERTICAL ZIG-ZAG TIMELINE WRAPPER ── */}
        <div className="relative max-w-5xl mx-auto">
          {/* Vertical scroll-linked spine with traveling forest-green dot */}
          <RitualConnector smoothProgress={smoothProgress} />

          {/* 4 Cards (Semantic Ordered List) */}
          <ol className="relative z-20 list-none p-0 m-0 space-y-12 sm:space-y-16 lg:space-y-20">
            {RITUAL_STEPS.map((step, idx) => {
              const isEven = idx % 2 === 0; // Steps 01 & 03: Left on desktop
              const isReached = prefersReduced || reachedIndices[idx];
              const isActive = prefersReduced ? idx === 0 : activeCardIndex === idx;

              return (
                <div
                  key={step.step}
                  className={`w-full flex ${
                    isMobile
                      ? 'pl-12 sm:pl-16'
                      : isEven
                      ? 'justify-start'
                      : 'justify-end'
                  }`}
                >
                  <div className={`w-full ${isMobile ? 'max-w-none' : 'lg:w-[44%]'}`}>
                    <RitualCard
                      item={step}
                      index={idx}
                      isActive={isActive}
                      isReached={isReached}
                      isMobile={isMobile}
                    />
                  </div>
                </div>
              );
            })}
          </ol>
        </div>
      </motion.div>
    </section>
  );
}
