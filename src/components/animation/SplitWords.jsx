import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { EASE } from '../../motionConfig';

/**
 * SplitWords
 * ─────────────────────────────────────────────────────────────────────────────
 * Splits text into individual words wrapped in overflow-hidden mask spans.
 * Words slide up from y: 110% to 0 with buttery expo easing.
 *
 * Includes horizontal breathing room (padding-inline: 0.15em; margin-inline: -0.15em)
 * and vertical breathing room (padding-block: 0.12em; margin-block: -0.12em)
 * plus proper line-height (1.25) so italic glyphs (f, y, t) and descenders are
 * never cropped by the mask.
 *
 * Includes aria-label for full accessibility.
 *
 * Props:
 *   text: string — the full headline string
 *   ariaLabel: string — optional accessible label override
 *   isVisible: boolean — trigger the reveal
 *   delay: number — base delay before animation starts (s)
 *   stagger: number — delay between words (s)
 *   className: string — styling for the headline text
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function SplitWords({
  text = '',
  ariaLabel,
  isVisible = true,
  delay = 0,
  stagger = 0.08,
  className = '',
}) {
  const prefersReduced = useReducedMotion();
  const words = text ? text.split(' ') : [];

  if (prefersReduced) {
    return (
      <span className={className} aria-label={ariaLabel || text} role="text">
        {text}
      </span>
    );
  }

  return (
    <span
      className={`inline-block ${className}`}
      aria-label={ariaLabel || text}
      role="text"
      style={{ lineHeight: 1.25 }}
    >
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-block overflow-hidden align-bottom mr-[0.28em] last:mr-0"
          style={{
            verticalAlign: 'bottom',
            lineHeight: 1.25,
            paddingInline: '0.15em',
            paddingBlock: '0.12em',
            marginInline: '-0.15em',
            marginBlock: '-0.12em',
          }}
          aria-hidden="true"
        >
          <motion.span
            className="inline-block"
            initial={{ y: '110%', opacity: 0 }}
            animate={
              isVisible
                ? { y: '0%', opacity: 1 }
                : { y: '110%', opacity: 0 }
            }
            transition={{
              duration: 0.7,
              delay: delay + i * stagger,
              ease: EASE.expoOut,
            }}
            style={{
              display: 'inline-block',
              willChange: isVisible ? 'transform, opacity' : 'auto',
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
