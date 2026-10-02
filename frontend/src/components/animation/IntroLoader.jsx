import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LOADER, EASE, ANIM_COLORS } from '../../motionConfig';

const BRAND_LETTERS = 'MOMENTUM'.split('');

/**
 * IntroLoader
 * ──────────────────────────────────────────────────────────────────────────
 * Full-screen cinematic loader. Forest-green background with botanical
 * cream/sage/peach letter palette.
 *
 * Sequence:
 *   1. Forest-green full-screen background appears instantly
 *   2. "MOMENTUM" letters reveal one by one — each in its botanical color
 *      (cream, sage, peach cycling) — blur→sharp, y:24→0
 *   3. Cream progress line fills beneath the word
 *   4. Hold ~0.7s after reveal
 *   5. Entire loader lifts away with a clip-path upward slide
 *   6. `onDone` callback fires so the app can begin its hero reveal
 *
 * Props:
 *   onDone: () => void   — called when loader fully exits
 * ──────────────────────────────────────────────────────────────────────────
 */
export default function IntroLoader({ onDone }) {
  const prefersReduced = useReducedMotion();
  const [phase, setPhase] = useState('in'); // 'in' | 'hold' | 'exit' | 'done'
  const doneRef = useRef(false);

  // Calculate total reveal duration so we know when to start exit
  const lastLetterDelay = (BRAND_LETTERS.length - 1) * LOADER.letterStagger;
  const lastLetterEnd  = lastLetterDelay + LOADER.letterDuration;
  const holdStart      = lastLetterEnd + 0.12;

  useEffect(() => {
    if (prefersReduced) {
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
      return;
    }

    const holdTimer = setTimeout(() => setPhase('hold'),
      holdStart * 1000);

    const exitTimer = setTimeout(() => setPhase('exit'),
      (holdStart + LOADER.holdAfterReveal) * 1000);

    const doneTimer = setTimeout(() => {
      setPhase('done');
      if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    }, (holdStart + LOADER.holdAfterReveal + LOADER.exitDuration + 0.06) * 1000);

    return () => {
      clearTimeout(holdTimer);
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [prefersReduced, onDone, holdStart]);

  if (prefersReduced) return null;
  if (phase === 'done') return null;

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="intro-loader"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: ANIM_COLORS.loaderBg,
            overflow: 'hidden',
          }}
          animate={
            phase === 'exit'
              ? { clipPath: ['inset(0% 0% 0% 0%)', 'inset(100% 0% 0% 0%)'] }
              : { clipPath: 'inset(0% 0% 0% 0%)' }
          }
          transition={
            phase === 'exit'
              ? { duration: LOADER.exitDuration, ease: LOADER.exitEase }
              : {}
          }
        >
          {/* ── Botanical light blobs on dark green (sage & peach at low opacity) ── */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: `
                radial-gradient(ellipse 65% 55% at 20% 25%, ${ANIM_COLORS.loaderSageBlob} 0%, transparent 65%),
                radial-gradient(ellipse 50% 45% at 80% 75%, ${ANIM_COLORS.loaderPeachBlob} 0%, transparent 60%),
                radial-gradient(ellipse 40% 35% at 60% 15%, rgba(200, 223, 207, 0.07) 0%, transparent 55%)
              `,
              pointerEvents: 'none',
            }}
          />

          {/* ── Subtle botanical leaf silhouette — top right ── */}
          <svg
            aria-hidden="true"
            viewBox="0 0 220 220"
            style={{
              position: 'absolute',
              top: '-20px',
              right: '-30px',
              width: '260px',
              height: '260px',
              opacity: 0.06,
              pointerEvents: 'none',
            }}
          >
            <path
              d="M110 20 C 50 40 20 100 40 160 C 60 220 140 230 180 180 C 220 130 200 60 160 30 C 140 18 125 16 110 20 Z"
              fill="none"
              stroke="#C8DFCF"
              strokeWidth="1.5"
            />
            <path
              d="M110 20 L 110 170"
              stroke="#C8DFCF"
              strokeWidth="1"
              strokeDasharray="4 6"
            />
            <path d="M110 80 C 90 70 65 85 55 110" stroke="#C8DFCF" strokeWidth="0.8" fill="none" />
            <path d="M110 110 C 130 98 155 105 165 130" stroke="#C8DFCF" strokeWidth="0.8" fill="none" />
            <path d="M110 140 C 88 130 68 142 60 165" stroke="#C8DFCF" strokeWidth="0.8" fill="none" />
          </svg>

          {/* ── Small petal — bottom left ── */}
          <svg
            aria-hidden="true"
            viewBox="0 0 140 140"
            style={{
              position: 'absolute',
              bottom: '20px',
              left: '30px',
              width: '160px',
              height: '160px',
              opacity: 0.05,
              pointerEvents: 'none',
            }}
          >
            <ellipse cx="70" cy="70" rx="45" ry="60" fill="none" stroke="#F0CEB8" strokeWidth="1.5" transform="rotate(-30 70 70)" />
            <ellipse cx="70" cy="70" rx="25" ry="40" fill="none" stroke="#F0CEB8" strokeWidth="1" transform="rotate(15 70 70)" />
          </svg>

          {/* ── Center content ── */}
          <div style={{ position: 'relative', textAlign: 'center' }}>

            {/* Brand word: letter-by-letter with botanical colors */}
            <div
              aria-label="MOMENTUM"
              role="heading"
              aria-level={1}
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'center',
                gap: 0,
                letterSpacing: '0.22em',
                userSelect: 'none',
              }}
            >
              {BRAND_LETTERS.map((char, i) => {
                // Cycle through botanical palette: cream → sage → peach
                const letterColor = ANIM_COLORS.loaderLetterColors[i] ?? '#FAF7F0';
                return (
                  <div
                    key={i}
                    className="letter-mask-word"
                    aria-hidden="true"
                    style={{ lineHeight: 1.05 }}
                  >
                    <motion.span
                      className="letter-char"
                      style={{
                        display: 'inline-block',
                        fontFamily: '"Newsreader", Georgia, serif',
                        fontSize: 'clamp(2.8rem, 7vw, 5.5rem)',
                        fontWeight: 300,
                        color: letterColor,
                        lineHeight: 1.05,
                        // Subtle text shadow to make botanical colors pop on green
                        textShadow: `0 0 40px ${letterColor}40`,
                      }}
                      initial={{
                        opacity: 0,
                        y: LOADER.letterY,
                        filter: `blur(${LOADER.letterBlur})`,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        filter: 'blur(0px)',
                      }}
                      transition={{
                        duration: LOADER.letterDuration,
                        delay: i * LOADER.letterStagger,
                        ease: EASE.expoOut,
                      }}
                    >
                      {char}
                    </motion.span>
                  </div>
                );
              })}
            </div>

            {/* Cream progress line beneath the word */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: LOADER.progressLineDelay, duration: 0.4 }}
              style={{ marginTop: '1.75rem', width: '100%' }}
            >
              <div
                className="loader-progress-track"
                style={{
                  width: 'clamp(160px, 30vw, 280px)',
                  margin: '0 auto',
                  // Override the CSS track color for cream-on-green
                  backgroundColor: 'rgba(250, 247, 240, 0.15)',
                }}
              >
                <motion.div
                  className="loader-progress-fill"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  style={{ backgroundColor: ANIM_COLORS.progressLine }}
                  transition={{
                    duration: LOADER.progressLineDuration,
                    delay: LOADER.progressLineDelay,
                    ease: EASE.expoOut,
                  }}
                />
              </div>
            </motion.div>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: lastLetterEnd * 0.55, duration: 0.8 }}
              style={{
                marginTop: '0.9rem',
                fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                fontSize: '0.62rem',
                fontWeight: 500,
                letterSpacing: '0.28em',
                textTransform: 'uppercase',
                color: ANIM_COLORS.loaderTagline,
              }}
            >
              Mindful Ritual Sanctuary
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
