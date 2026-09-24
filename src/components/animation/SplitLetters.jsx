import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '../../motionConfig';

/**
 * SplitLetters
 * ──────────────────────────────────────────────────────────────────────────
 * Splits text into individual animated letter spans, keeping words intact
 * so natural line-wrapping works correctly on all screen sizes.
 *
 * Each word is wrapped in a `.letter-mask-word` span with horizontal and
 * vertical breathing room (padding-inline: 0.15em; padding-block: 0.12em;
 * margin-inline: -0.15em; margin-block: -0.12em) so italic glyphs (f, k, y, A, t)
 * and descenders are NEVER clipped by the overflow:hidden mask while maintaining
 * exact layout, kerning, and line wrapping.
 *
 * Props:
 *   text          string     — the text to split
 *   ariaLabel     string     — accessible label for the whole element
 *   className     string     — classes for the outer wrapper
 *   charClassName string     — classes applied to each letter span
 *   duration      number     — each letter's animation duration (s)
 *   stagger       number     — per-letter stagger delay (s)
 *   startDelay    number     — initial delay before first letter (s)
 *   yOffset       number     — starting Y offset in px (default 24)
 *   blurAmount    string     — starting blur (default '6px')
 *   isVisible     boolean    — when true, animate in; when false, stay hidden
 *   onComplete    () => void — called when the last letter finishes
 * ──────────────────────────────────────────────────────────────────────────
 */
export default function SplitLetters({
  text = '',
  ariaLabel,
  className = '',
  charClassName = '',
  duration = 0.55,
  stagger = 0.025,
  startDelay = 0,
  yOffset = 24,
  blurAmount = '6px',
  isVisible = true,
  onComplete,
}) {
  const prefersReduced = useReducedMotion();
  // Split into words preserving spaces as renderable gaps
  const words = text ? text.split(' ') : [];

  const letterVariants = {
    hidden: {
      opacity: 0,
      y: yOffset,
      filter: `blur(${blurAmount})`,
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: 'blur(0px)',
    },
  };

  if (prefersReduced) {
    return (
      <span className={className} aria-label={ariaLabel || text} role="text">
        {text}
      </span>
    );
  }

  // Track the global letter index for stagger calculation
  let globalLetterIndex = 0;

  return (
    <span
      className={className}
      aria-label={ariaLabel || text}
      role="text"
      style={{ display: 'inline' }}
    >
      {words.map((word, wordIdx) => {
        const letters = word.split('');
        const wordStart = globalLetterIndex;
        globalLetterIndex += letters.length;

        return (
          <React.Fragment key={wordIdx}>
            {/* Each word in its own mask with horizontal and vertical breathing room */}
            <span
              className="letter-mask-word"
              aria-hidden="true"
              style={{
                display: 'inline-block',
                overflow: 'hidden',
                verticalAlign: 'bottom',
                lineHeight: 1.25,
                paddingInline: '0.15em',
                paddingBlock: '0.12em',
                marginInline: '-0.15em',
                marginBlock: '-0.12em',
              }}
            >
              {letters.map((char, charIdx) => {
                const letterIndex = wordStart + charIdx;
                const delay = startDelay + letterIndex * stagger;
                const isLastLetter =
                  wordIdx === words.length - 1 &&
                  charIdx === letters.length - 1;

                return (
                  <motion.span
                    key={charIdx}
                    className={`letter-char ${charClassName}`}
                    variants={letterVariants}
                    initial="hidden"
                    animate={isVisible ? 'visible' : 'hidden'}
                    transition={{
                      duration,
                      delay,
                      ease: EASE.expoOut,
                    }}
                    onAnimationComplete={
                      isLastLetter && onComplete ? onComplete : undefined
                    }
                    aria-hidden="true"
                    style={{
                      display: 'inline-block',
                      willChange: isVisible ? 'transform, opacity, filter' : 'auto',
                    }}
                  >
                    {char}
                  </motion.span>
                );
              })}
            </span>
            {/* Re-add the space between words (not in last word) */}
            {wordIdx < words.length - 1 && (
              <span aria-hidden="true" style={{ display: 'inline-block', width: '0.28em' }} />
            )}
          </React.Fragment>
        );
      })}
    </span>
  );
}
