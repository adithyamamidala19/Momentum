import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { BG, ANIM_COLORS } from '../../motionConfig';

/**
 * BackgroundLayer
 * ──────────────────────────────────────────────────────────────────────────
 * Layered premium background rendered as a fixed layer behind all content.
 * Layers from back to front:
 *   1. Botanical video (WebM + MP4) with cream overlay + blur
 *   2. Animated gradient mesh (sage/cream/peach/teal drift)
 *   3. 3 large organic blobs with scroll parallax
 *   4. Film grain noise overlay
 *   5. Floating particles (desktop only)
 *   6. Cursor-based parallax on blobs (desktop only)
 *
 * Media files: place in /public/assets/bg/
 *   bg-loop.webm, bg-loop.mp4, bg-poster.jpg
 * If files are missing, a CSS gradient fallback is shown automatically.
 *
 * Props:
 *   videoReady: boolean — set to true after loader finishes to lazy-load video
 * ──────────────────────────────────────────────────────────────────────────
 */

// Particle configuration
const PARTICLE_CONFIG = Array.from({ length: BG.particleCount }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1.5,
  duration: Math.random() * 14 + 12,
  delay: Math.random() * -18,
  driftX: (Math.random() - 0.5) * 60,
  driftY: -(Math.random() * 40 + 30),
  opacity: Math.random() * 0.2 + 0.08,
}));

export default function BackgroundLayer({ videoReady = true }) {
  const prefersReduced = useReducedMotion();
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  // Cursor parallax state (desktop only)
  const [cursor, setCursor] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Cursor move handler (desktop only)
  const handleMouseMove = useCallback((e) => {
    if (isMobile || prefersReduced) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 to 1
    const y = (e.clientY / window.innerHeight - 0.5) * 2; // -1 to 1
    setCursor({ x, y });
  }, [isMobile, prefersReduced]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Check if video file exists by trying to load it
  const shouldShowVideo =
    videoReady &&
    !prefersReduced &&
    !isMobile &&
    !videoError &&
    BG.videoWebm;

  // Scroll-based blob parallax
  const { scrollY } = useScroll();
  const blob1Y = useTransform(scrollY, [0, 1000], [0, -60]);
  const blob2Y = useTransform(scrollY, [0, 1000], [0, 40]);
  const blob3Y = useTransform(scrollY, [0, 1000], [0, -30]);

  const parallaxStrength = prefersReduced || isMobile ? 0 : BG.cursorParallaxStrength;

  return (
    <div className="bg-layer" aria-hidden="true" ref={containerRef}>

      {/* ── Layer 1: Botanical video (lazy, desktop, not reduced-motion) ── */}
      {shouldShowVideo ? (
        <>
          <video
            ref={videoRef}
            className="bg-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={BG.videoPoster}
            onError={() => setVideoError(true)}
          >
            <source src={BG.videoWebm} type="video/webm" />
            <source src={BG.videoMp4} type="video/mp4" />
          </video>
          <div className="bg-video-overlay" style={{ opacity: BG.videoOverlayOpacity }} />
        </>
      ) : (
        /* Fallback: static poster image or gradient */
        <>
          {BG.videoPoster && !videoError && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: `url(${BG.videoPoster})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: `blur(${BG.videoBlur}) saturate(0.7)`,
                transform: 'scale(1.06)',
              }}
            />
          )}
          <div className="bg-video-overlay" />
        </>
      )}

      {/* ── Layer 2: Animated gradient mesh ─────────────────────────── */}
      <div className="bg-mesh" />

      {/* ── Layer 3: Organic blobs with scroll + cursor parallax ─────── */}
      <motion.div
        className="bg-blob bg-blob-1"
        style={{
          y: blob1Y,
          x: prefersReduced ? 0 : cursor.x * -parallaxStrength,
        }}
        animate={
          prefersReduced
            ? {}
            : { y: [0, 18, -12, 8, 0] }
        }
        transition={
          prefersReduced
            ? {}
            : { duration: 28, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <motion.div
        className="bg-blob bg-blob-2"
        style={{
          y: blob2Y,
          x: prefersReduced ? 0 : cursor.x * parallaxStrength * 0.7,
        }}
        animate={
          prefersReduced
            ? {}
            : { y: [0, -22, 14, -8, 0] }
        }
        transition={
          prefersReduced
            ? {}
            : { duration: 36, repeat: Infinity, ease: 'easeInOut', delay: -12 }
        }
      />
      <motion.div
        className="bg-blob bg-blob-3"
        style={{
          y: blob3Y,
          x: prefersReduced ? 0 : cursor.x * parallaxStrength * 0.5,
        }}
        animate={
          prefersReduced
            ? {}
            : { y: [0, 12, -18, 6, 0] }
        }
        transition={
          prefersReduced
            ? {}
            : { duration: 32, repeat: Infinity, ease: 'easeInOut', delay: -7 }
        }
      />

      {/* ── Layer 4: Film grain noise ────────────────────────────────── */}
      {!prefersReduced && <div className="bg-grain" />}

      {/* ── Layer 5: Floating particles (desktop only) ───────────────── */}
      {!prefersReduced && !isMobile && (
        <div className="bg-particles">
          {PARTICLE_CONFIG.map((p) => (
            <motion.div
              key={p.id}
              className="bg-particle"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                opacity: 0,
              }}
              animate={{
                y: [0, p.driftY, p.driftY * 1.5],
                x: [0, p.driftX * 0.4, p.driftX],
                opacity: [0, p.opacity, p.opacity * 0.6, 0],
              }}
              transition={{
                duration: p.duration,
                delay: p.delay,
                repeat: Infinity,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
