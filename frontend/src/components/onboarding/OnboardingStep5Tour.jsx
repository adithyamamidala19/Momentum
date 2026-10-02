import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { EASE } from '../../motionConfig.js';
import {
  Sun,
  CheckCircle2,
  Mic,
  Flame,
  Timer,
  Activity,
  TrendingUp,
  Award,
  Trophy,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ChevronRight,
  Check
} from 'lucide-react';

const TOUR_SECTIONS = [
  {
    id: 'today',
    title: 'Today Sanctuary',
    subtitle: 'Your Daily Mindful Command Center',
    description:
      'Where habits, hydration, and focus synchronize into living adherence rings that reflect your daily rhythm.',
    icon: Sun,
    badge: 'Core Sanctuary'
  },
  {
    id: 'todos',
    title: 'Intentional To-Dos',
    subtitle: 'High-Impact Clarity',
    description:
      'Capture purposeful priorities without overwhelming clutter. Check off tasks with calm, unhurried satisfaction.',
    icon: CheckCircle2,
    badge: 'Clarity'
  },
  {
    id: 'aria',
    title: 'Aria Mindful Voice',
    subtitle: 'Conversational Voice Companion',
    description:
      'Speak naturally to log hydration, launch focus blocks, or reflect. Grounded voice awareness with 10-second undo safety.',
    icon: Mic,
    badge: 'Voice AI'
  },
  {
    id: 'rituals',
    title: 'Daily Rituals',
    subtitle: 'Atomic Habit Anchors',
    description:
      'Anchor habits to natural morning, midday, and evening cues. Celebrate consistency over intensity.',
    icon: Flame,
    badge: 'Consistency'
  },
  {
    id: 'focus',
    title: 'Mindful Focus Blocks',
    subtitle: 'Distraction-Free Immersion',
    description:
      'Enter flow states supported by ambient soundscapes, Tibetan singing bowl chimes, and gentle breathing cues.',
    icon: Timer,
    badge: 'Presence'
  },
  {
    id: 'movement',
    title: 'Mindful Movement',
    subtitle: 'Body & Vitality Tracking',
    description:
      'Log strength exercises, cardio sessions, and pacing with automated rest intervals and fluid progress bars.',
    icon: Activity,
    badge: 'Vitality'
  },
  {
    id: 'insights',
    title: 'Unhurried Insights',
    subtitle: 'Pattern Awareness Without Judgment',
    description:
      'Gain clear perspective on habit consistency, velocity, and weekly rhythm trends without guilt or shame.',
    icon: TrendingUp,
    badge: 'Growth'
  },
  {
    id: 'milestones',
    title: 'Milestones & Medals',
    subtitle: 'Honoring Your Dedication',
    description:
      'Unlock tangible medals and milestones celebrating your long-term dedication to conscious living.',
    icon: Award,
    badge: 'Achievements'
  },
  {
    id: 'challenge',
    title: 'Weekly Circle',
    subtitle: 'Anonymous Community Rhythm',
    description:
      'Practice alongside a peaceful circle of fellow practitioners. Celebrate momentum together without unhealthy pressure.',
    icon: Trophy,
    badge: 'Community'
  }
];

export default function OnboardingStep5Tour({ onTourComplete, onSkipTour }) {
  const prefersReduced = useReducedMotion();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isFinishing, setIsFinishing] = useState(false);

  const currentSection = TOUR_SECTIONS[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === TOUR_SECTIONS.length - 1;

  const handleNext = () => {
    if (currentIndex < TOUR_SECTIONS.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } else {
      finishTour();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const finishTour = () => {
    setIsFinishing(true);
    setTimeout(() => {
      onTourComplete();
    }, 450);
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight') handleNext();
    if (e.key === 'ArrowLeft') handlePrev();
  };

  // 3D-feeling card transition variants
  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? (prefersReduced ? 0 : 70) : (prefersReduced ? 0 : -70),
      opacity: 0,
      scale: prefersReduced ? 1 : 0.94,
      rotateY: dir > 0 ? (prefersReduced ? 0 : 6) : (prefersReduced ? 0 : -6)
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: prefersReduced ? 0.01 : 0.52,
        ease: EASE.expoOut
      }
    },
    exit: (dir) => ({
      x: dir > 0 ? (prefersReduced ? 0 : -70) : (prefersReduced ? 0 : 70),
      opacity: 0,
      scale: prefersReduced ? 1 : 0.94,
      rotateY: dir > 0 ? (prefersReduced ? 0 : -6) : (prefersReduced ? 0 : 6),
      transition: {
        duration: prefersReduced ? 0.01 : 0.42,
        ease: EASE.expoOut
      }
    })
  };

  return (
    <div
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="space-y-6 focus:outline-none select-none relative"
    >
      {/* Light celebratory sweep overlay upon finish */}
      {isFinishing && !prefersReduced && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: [0, 0.4, 0], scale: [0.8, 1.2, 1.4] }}
          transition={{ duration: 0.45, ease: EASE.expoOut }}
          className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-emerald-200/30 to-transparent pointer-events-none rounded-3xl z-30"
        />
      )}

      {/* Header with Skip Tour */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-on-surface">
            Explore Your Sanctuary
          </h2>
          <p className="text-xs text-outline mt-1 leading-relaxed">
            Take a peaceful preview of your mindfulness sanctuary tools.
          </p>
        </div>
        <button
          type="button"
          onClick={onSkipTour}
          className="text-xs text-outline hover:text-primary transition-colors py-1 px-2.5 rounded-lg border border-transparent hover:border-outline/20 font-medium"
        >
          Skip tour
        </button>
      </div>

      {/* 3D-Slideable Carousel Container */}
      <div className="relative min-h-[310px] sm:min-h-[290px] flex items-center justify-center overflow-hidden rounded-3xl bg-surface-container-lowest border border-outline/15 shadow-xs p-5 sm:p-7">
        <AnimatePresence custom={direction} mode="wait">
          <motion.div
            key={currentSection.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full flex flex-col sm:flex-row items-center gap-6"
          >
            {/* Left: Section Details */}
            <div className="flex-1 space-y-3 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider">
                <Sparkles className="w-3 h-3" />
                <span>{currentSection.badge}</span>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-3">
                {/* Icon with soft pop entrance */}
                <motion.div
                  initial={prefersReduced ? { scale: 1 } : { scale: 0.85, opacity: 0 }}
                  animate={prefersReduced ? { scale: 1, opacity: 1 } : { scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20
                  }}
                  className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-xs"
                >
                  <currentSection.icon className="w-5 h-5" />
                </motion.div>

                <div>
                  <h3 className="font-editorial text-xl font-normal text-on-surface">
                    {currentSection.title}
                  </h3>
                  <p className="text-[11px] text-outline font-sans">
                    {currentSection.subtitle}
                  </p>
                </div>
              </div>

              <p className="text-xs text-outline leading-relaxed max-w-sm">
                {currentSection.description}
              </p>
            </div>

            {/* Right: Section Tasteful Interactive Micro-Preview */}
            <div className="w-full sm:w-48 h-36 rounded-2xl bg-surface-container-low border border-outline/15 flex items-center justify-center p-3 relative overflow-hidden shrink-0">
              <MicroPreview sectionId={currentSection.id} prefersReduced={prefersReduced} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer Navigation & Dots */}
      <div className="flex items-center justify-between pt-2">
        {/* Carousel Dots with layoutId smooth glide */}
        <div className="flex items-center gap-1.5">
          {TOUR_SECTIONS.map((sec, idx) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => {
                setDirection(idx > currentIndex ? 1 : -1);
                setCurrentIndex(idx);
              }}
              aria-label={`Go to slide ${idx + 1}: ${sec.title}`}
              className="relative p-1 rounded-full focus:outline-none"
            >
              <div className="w-2 h-2 rounded-full bg-outline/25" />
              {currentIndex === idx && (
                <motion.div
                  layoutId="tourDot"
                  className="absolute inset-0.5 rounded-full bg-primary"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
            </button>
          ))}
          <span className="text-[10px] text-outline ml-2 font-mono">
            {currentIndex + 1} / {TOUR_SECTIONS.length}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {!isFirst && (
            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-xl border border-outline/20 text-outline hover:text-on-surface hover:bg-surface-container transition-all"
              aria-label="Previous tour slide"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {!isLast ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-xs"
            >
              <span>Next Feature</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={finishTour}
              className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Got it, let's begin</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Micro-Preview Mock Element Per Section ──
function MicroPreview({ sectionId, prefersReduced }) {
  if (prefersReduced) {
    return (
      <div className="text-center space-y-1">
        <Sparkles className="w-6 h-6 text-primary mx-auto" />
        <span className="text-[11px] font-medium text-on-surface">Momentum Preview</span>
      </div>
    );
  }

  switch (sectionId) {
    case 'today':
      return (
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-24 h-24 -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#E6E6E3"
              strokeWidth="6"
              fill="transparent"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="40"
              stroke="#0F6E56"
              strokeWidth="6"
              strokeLinecap="round"
              fill="transparent"
              initial={{ pathLength: 0.15 }}
              animate={{ pathLength: [0.15, 0.85, 0.15] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </svg>
          <div className="absolute text-center">
            <span className="text-xs font-mono font-bold text-primary">85%</span>
          </div>
        </div>
      );

    case 'todos':
      return (
        <div className="w-full space-y-2 px-2">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-2 rounded-xl bg-surface-container-lowest border border-outline/10 flex items-center gap-2"
            >
              <motion.div
                animate={i === 1 ? { scale: [1, 1.15, 1], backgroundColor: ['#E6E6E3', '#0F6E56', '#0F6E56'] } : {}}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1 }}
                className="w-4 h-4 rounded-md border border-outline/30 flex items-center justify-center text-white"
              >
                {i === 1 && <Check className="w-3 h-3 stroke-[3]" />}
              </motion.div>
              <motion.div
                animate={i === 1 ? { opacity: [1, 0.45, 1] } : {}}
                transition={{ duration: 2.8, repeat: Infinity, repeatDelay: 1 }}
                className="h-2 rounded bg-outline/30 flex-1"
              />
            </div>
          ))}
        </div>
      );

    case 'aria':
      return (
        <div className="flex items-center gap-1.5 h-12">
          {[0.3, 0.7, 1.0, 0.6, 0.85, 0.4].map((scale, i) => (
            <motion.div
              key={i}
              animate={{ height: ['25%', `${Math.round(scale * 100)}%`, '25%'] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut'
              }}
              className="w-1.5 bg-primary rounded-full min-h-[6px]"
            />
          ))}
        </div>
      );

    case 'rituals':
      return (
        <div className="text-center space-y-2">
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="w-10 h-10 mx-auto rounded-2xl bg-amber-500/15 text-amber-600 flex items-center justify-center shadow-xs"
          >
            <Flame className="w-5 h-5 fill-amber-500" />
          </motion.div>
          <div className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-mono font-bold">
            12 Day Streak
          </div>
        </div>
      );

    case 'focus':
      return (
        <div className="relative w-20 h-20 flex items-center justify-center">
          <motion.div
            animate={{ scale: [0.9, 1.12, 0.9], opacity: [0.35, 0.7, 0.35] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-full border-2 border-emerald-500/40"
          />
          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-sm">
            <Timer className="w-5 h-5" />
          </div>
        </div>
      );

    case 'movement':
      return (
        <div className="w-full space-y-2 px-3 text-center">
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="text-on-surface font-bold">Set 3 of 4</span>
            <span className="text-primary font-bold">10 Reps</span>
          </div>
          <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden">
            <motion.div
              animate={{ width: ['20%', '85%', '20%'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <span className="text-[10px] text-outline block">90s Rest Timer</span>
        </div>
      );

    case 'insights':
      return (
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 2.2,
                repeat: Infinity,
                delay: (i % 5) * 0.2 + Math.floor(i / 5) * 0.1,
                ease: 'easeInOut'
              }}
              className={`w-4 h-4 rounded-md ${
                i % 3 === 0
                  ? 'bg-primary'
                  : i % 2 === 0
                  ? 'bg-primary/50'
                  : 'bg-surface-container'
              }`}
            />
          ))}
        </div>
      );

    case 'milestones':
      return (
        <div className="relative w-14 h-14 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-amber-400 text-amber-950 flex items-center justify-center shadow-md relative overflow-hidden border border-amber-300">
            <Award className="w-7 h-7" />
            <motion.div
              animate={{ x: ['-140%', '140%'] }}
              transition={{
                duration: 2.6,
                repeat: Infinity,
                repeatDelay: 1.2,
                ease: 'easeInOut'
              }}
              className="absolute inset-0 w-8 bg-gradient-to-r from-transparent via-white/70 to-transparent skew-x-12"
            />
          </div>
        </div>
      );

    case 'challenge':
      return (
        <div className="flex items-end justify-center gap-1.5 h-16 pt-2">
          {/* Rank 2 */}
          <div className="w-7 h-8 rounded-t-lg bg-surface-container border border-outline/20 flex items-center justify-center text-[10px] font-bold text-outline">
            2
          </div>
          {/* Rank 1 */}
          <div className="w-8 h-12 rounded-t-lg bg-primary text-white flex flex-col items-center justify-center text-xs font-bold shadow-xs">
            <motion.span
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            >
              🌱
            </motion.span>
            <span>1</span>
          </div>
          {/* Rank 3 */}
          <div className="w-7 h-6 rounded-t-lg bg-surface-container border border-outline/20 flex items-center justify-center text-[10px] font-bold text-outline">
            3
          </div>
        </div>
      );

    default:
      return null;
  }
}
