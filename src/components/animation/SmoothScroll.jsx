import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useReducedMotion } from 'framer-motion';
import { RITUAL_LOOP } from '../../motionConfig';

/**
 * SmoothScroll
 * ─────────────────────────────────────────────────────────────────────────────
 * Optional Lenis smooth scrolling wrapper.
 * Automatically disabled on touch devices and when prefers-reduced-motion is on.
 * Keeps scrolling natural (no pinning, no scroll-jacking, no snapping).
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function SmoothScroll({ children }) {
  const prefersReduced = useReducedMotion();
  const lenisRef = useRef(null);

  useEffect(() => {
    // Check configuration and environment
    if (!RITUAL_LOOP.useLenis || prefersReduced) return;

    // Detect touch / coarse pointer
    const isTouch = window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
    if (isTouch) return;

    const lenis = new Lenis({
      lerp: RITUAL_LOOP.lenisLerp || 0.08,
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [prefersReduced]);

  return <>{children}</>;
}
