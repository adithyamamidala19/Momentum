import React, { useEffect, useRef } from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import { EASE, ARCHITECTURE } from '../../motionConfig';

/**
 * CountUp
 * ─────────────────────────────────────────────────────────────────────────────
 * Eased number counter that animates smoothly from 0 to target value on reveal.
 * Writes directly to the DOM element's textContent for 60fps performance without
 * triggering per-frame React state re-renders.
 *
 * Props:
 *   target: number — final numerical value
 *   startValue: number — starting value (default 0)
 *   duration: number — duration in seconds (default ARCHITECTURE.countUpDuration)
 *   delay: number — delay in seconds before animation begins
 *   prefix: string — text before the number
 *   suffix: string — text after the number
 *   decimals: number — decimal places to format
 *   formatter: func — custom formatting function (val) => string (e.g. for time MM:SS)
 *   isVisible: boolean — trigger for the counter animation
 *   className: string — CSS classes
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function CountUp({
  target,
  value,
  startValue = 0,
  duration = ARCHITECTURE.countUpDuration,
  delay = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  formatter = null,
  isVisible = true,
  className = '',
}) {
  const spanRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const hasAnimatedRef = useRef(false);

  const numericTarget = target !== undefined ? target : (value !== undefined ? value : 0);

  const formatDisplay = (val) => {
    if (formatter) {
      return formatter(val);
    }
    const formattedNum = decimals > 0 ? Number(val).toFixed(decimals) : Math.round(Number(val) || 0).toString();
    return `${prefix}${formattedNum}${suffix}`;
  };

  useEffect(() => {
    if (prefersReduced) {
      if (spanRef.current) {
        spanRef.current.textContent = formatDisplay(numericTarget);
      }
      return;
    }

    if (!isVisible) {
      if (spanRef.current && !hasAnimatedRef.current) {
        spanRef.current.textContent = formatDisplay(startValue);
      }
      return;
    }

    hasAnimatedRef.current = true;

    const timeout = setTimeout(() => {
      const controls = animate(startValue, numericTarget, {
        duration,
        ease: EASE.expoOut,
        onUpdate: (latest) => {
          if (spanRef.current) {
            spanRef.current.textContent = formatDisplay(latest);
          }
        },
        onComplete: () => {
          if (spanRef.current) {
            spanRef.current.textContent = formatDisplay(numericTarget);
          }
        },
      });

      return () => controls.stop();
    }, delay * 1000);

    return () => clearTimeout(timeout);
  }, [numericTarget, startValue, duration, delay, isVisible, prefersReduced]);

  return (
    <span ref={spanRef} className={className}>
      {formatDisplay(prefersReduced ? numericTarget : numericTarget)}
    </span>
  );
}
