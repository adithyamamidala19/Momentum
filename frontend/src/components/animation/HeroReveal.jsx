import React, { useState, Children, cloneElement } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import SplitLetters from './SplitLetters';
import { HERO, EASE, ANIM_COLORS } from '../../motionConfig';

/**
 * HeroReveal
 * ──────────────────────────────────────────────────────────────────────────
 * Orchestrates the full 6-step staggered hero entrance sequence triggered
 * after the loader completes.
 *
 * Wraps the hero section in a transparent div and exposes sub-components
 * that internal consumers use to mark each element type:
 *
 *   <HeroReveal loaderDone={bool}>
 *     <HeroReveal.Pill>...</HeroReveal.Pill>
 *     <HeroReveal.Headline line1="..." greenLine="Living Works of Art." />
 *     <HeroReveal.Subtext lines={[...]} />
 *     <HeroReveal.Buttons>...</HeroReveal.Buttons>
 *     <HeroReveal.Badges>...</HeroReveal.Badges>
 *   </HeroReveal>
 *
 * But since we can't restructure HomePage JSX deeply, HeroReveal is also
 * usable as a simple stagger container that accepts children with phase prop.
 * In practice we expose simple animated wrappers as named exports.
 * ──────────────────────────────────────────────────────────────────────────
 */

// ── Sub-component: Pill badge ─────────────────────────────────────────────
export function HeroPill({ children, loaderDone }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={loaderDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
      transition={{
        duration: prefersReduced ? 0 : HERO.pillDuration,
        delay: prefersReduced ? 0 : HERO.pillDelay,
        ease: EASE.expoOut,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Sub-component: Split headline ─────────────────────────────────────────
/**
 * Renders the hero headline with per-letter animation.
 * line1: "Transform Daily Actions Into"
 * greenLine: "Living Works of Art."  (italic green, with glow sweep)
 */
export function HeroHeadline({ line1, greenLine, loaderDone }) {
  const prefersReduced = useReducedMotion();
  const [greenDone, setGreenDone] = useState(false);

  const line1LetterCount = line1.replace(/ /g, '').length;
  // Green italic line starts staggering after line1 letters
  const greenStartDelay = HERO.headlineDelay + line1LetterCount * HERO.headlineStagger + 0.1;

  if (prefersReduced) {
    return (
      <h1
        className="font-editorial text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-on-surface leading-[1.18]"
        aria-label={`${line1} ${greenLine}`}
      >
        {line1}
        <br className="hidden sm:inline" />
        <span className="italic text-primary-container inline-block px-1 -mx-1">{greenLine}</span>
      </h1>
    );
  }

  return (
    <h1
      className="font-editorial text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-on-surface leading-[1.18]"
      aria-label={`${line1} ${greenLine}`}
    >
      {/* Line 1: letter-by-letter */}
      <SplitLetters
        text={line1}
        ariaLabel={line1}
        duration={HERO.headlineLetterDuration}
        stagger={HERO.headlineStagger}
        startDelay={HERO.headlineDelay}
        yOffset={28}
        blurAmount="8px"
        isVisible={loaderDone}
      />
      <br className="hidden sm:inline" />
      {/* Green italic "Living Works of Art." — last, with glow sweep */}
      <span className="relative inline-block px-1 -mx-1">
        <span className="italic text-primary-container inline-block">
          <SplitLetters
            text={greenLine}
            ariaLabel={greenLine}
            duration={HERO.headlineLetterDuration}
            stagger={HERO.headlineStagger}
            startDelay={greenStartDelay}
            yOffset={28}
            blurAmount="8px"
            isVisible={loaderDone}
            onComplete={() => setGreenDone(true)}
          />
        </span>

        {/* Light sweep / glow that passes across the green line once */}
        {greenDone && (
          <motion.span
            aria-hidden="true"
            initial={{ opacity: 0, x: '-100%' }}
            animate={{ opacity: [0, 0.7, 0.7, 0], x: ['−100%', '0%', '60%', '140%'] }}
            transition={{
              duration: HERO.glowSweepDuration,
              delay: HERO.glowSweepDelay,
              ease: EASE.expoOut,
            }}
            style={{
              position: 'absolute',
              inset: '-4px -8px',
              background: `linear-gradient(90deg, transparent 0%, ${ANIM_COLORS.glowGreen} 40%, rgba(15, 110, 86, 0.12) 60%, transparent 100%)`,
              borderRadius: '4px',
              pointerEvents: 'none',
            }}
          />
        )}
      </span>
    </h1>
  );
}

// ── Sub-component: Subtext (line-by-line) ─────────────────────────────────
export function HeroSubtext({ children, loaderDone, delay = 0 }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={loaderDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
      transition={{
        duration: prefersReduced ? 0 : 0.7,
        delay: prefersReduced ? 0 : delay,
        ease: EASE.expoOut,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Sub-component: Buttons ────────────────────────────────────────────────
export function HeroButtons({ children, loaderDone, delay = 0 }) {
  const prefersReduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.96 }}
      animate={
        loaderDone
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 14, scale: 0.96 }
      }
      transition={{
        duration: prefersReduced ? 0 : HERO.buttonDuration,
        delay: prefersReduced ? 0 : delay,
        ease: EASE.expoOut,
      }}
    >
      {children}
    </motion.div>
  );
}

// ── Sub-component: Badges ─────────────────────────────────────────────────
export function HeroBadges({ children, loaderDone, delay = 0 }) {
  const prefersReduced = useReducedMotion();

  // Stagger badge children individually
  const childArray = Children.toArray(children);

  return (
    <div>
      {childArray.map((child, i) => (
        <motion.div
          key={i}
          style={{ display: 'inline-flex' }}
          initial={{ opacity: 0, y: 10 }}
          animate={loaderDone ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          transition={{
            duration: prefersReduced ? 0 : 0.5,
            delay: prefersReduced ? 0 : delay + i * HERO.badgeStagger,
            ease: EASE.expoOut,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// ── Default export: generic stagger container ─────────────────────────────
/**
 * Generic stagger wrapper — wraps children and staggers them in after loaderDone.
 * Used as a fallback for sections that don't need per-letter animation.
 */
export default function HeroReveal({ children, loaderDone }) {
  const prefersReduced = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReduced ? 0 : 0.12,
        delayChildren: prefersReduced ? 0 : HERO.startDelay,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate={loaderDone ? 'visible' : 'hidden'}
    >
      {children}
    </motion.div>
  );
}
