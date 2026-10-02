import React, { useRef } from 'react';
import { motion, useInView, useTransform, useScroll, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { EASE, ARCHITECTURE } from '../../motionConfig';
import SplitWords from '../animation/SplitWords.jsx';

/**
 * Pillar
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable Zig-Zag Pillar Section:
 * - Alternating layout: even (visual left / text right), odd (text left / visual right)
 * - Mobile stacks: visual first, text second
 * - Card entrance: +/-60px slide, unblur 8px -> 0, edge glow trace
 * - Text entrance: 0.25s stagger, word-mask title, staggered chips, magnetic CTA
 * - Light scroll parallax differential between card & text
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function Pillar({
  id,
  index,
  tag,
  tagIcon: TagIcon,
  tagAccent = 'emerald', // 'emerald' | 'cyan' | 'amber'
  title,
  subtitle,
  description,
  chips = [],
  ctaLabel,
  ctaVariant = 'emerald', // 'white' | 'cyan' | 'amber'
  onCtaClick,
  visualContent,
  onInViewChange,
}) {
  const containerRef = useRef(null);
  const visualCardRef = useRef(null);
  const prefersReduced = useReducedMotion();

  const isEven = index % 2 === 0;

  // Viewport trigger for choreography
  const isInView = useInView(containerRef, {
    amount: ARCHITECTURE.pillarViewportAmount,
    once: true,
  });

  // Active pillar tracking
  const isActiveInCenter = useInView(containerRef, {
    amount: 0.5,
  });

  React.useEffect(() => {
    if (isActiveInCenter && onInViewChange) {
      onInViewChange(index);
    }
  }, [isActiveInCenter, index, onInViewChange]);

  // Subtle Scroll Parallax (Differential speeds)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });

  const visualParallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [-ARCHITECTURE.pillarParallaxDesktop, ARCHITECTURE.pillarParallaxDesktop]
  );
  const textParallaxY = useTransform(
    scrollYProgress,
    [0, 1],
    prefersReduced ? [0, 0] : [ARCHITECTURE.pillarParallaxDesktop * 0.5, -ARCHITECTURE.pillarParallaxDesktop * 0.5]
  );

  // Desktop 3D Card Hover Tilt (Max 3 degrees)
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const springTiltX = useSpring(useTransform(tiltY, [-0.5, 0.5], [ARCHITECTURE.cardHoverTiltMax, -ARCHITECTURE.cardHoverTiltMax]), { stiffness: 300, damping: 25 });
  const springTiltY = useSpring(useTransform(tiltX, [-0.5, 0.5], [-ARCHITECTURE.cardHoverTiltMax, ARCHITECTURE.cardHoverTiltMax]), { stiffness: 300, damping: 25 });

  const handleCardMouseMove = (e) => {
    if (prefersReduced || !visualCardRef.current) return;
    const rect = visualCardRef.current.getBoundingClientRect();
    tiltX.set((e.clientX - rect.left) / rect.width - 0.5);
    tiltY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handleCardMouseLeave = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  // Tag Pill Accent Styles
  const tagColors = {
    emerald: 'bg-white/10 text-emerald-300 border-white/15',
    cyan: 'bg-white/10 text-cyan-300 border-white/15',
    amber: 'bg-white/10 text-amber-300 border-white/15',
  };

  const subtitleColors = {
    emerald: 'text-emerald-300',
    cyan: 'text-cyan-300',
    amber: 'text-amber-300',
  };

  const buttonStyles = {
    white: 'bg-white text-[#0F6E56] hover:bg-emerald-50 shadow-xl',
    cyan: 'bg-[#0891B2] text-white hover:bg-[#0891B2]/90 shadow-xl shadow-[#0891B2]/20',
    amber: 'bg-[#D97706] text-white hover:bg-[#D97706]/90 shadow-xl shadow-[#D97706]/20',
  };

  const slideInitialX = isEven ? -ARCHITECTURE.pillarCardSlideX : ARCHITECTURE.pillarCardSlideX;

  return (
    <section
      ref={containerRef}
      id={`pillar-${id}`}
      className="min-h-[75vh] sm:min-h-[82vh] flex items-center py-10 sm:py-16"
    >
      <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* ── 1. VISUAL CARD COLUMN (Desktop Alternating / Mobile First) ── */}
        <motion.div
          style={{ y: visualParallaxY }}
          className={`lg:col-span-6 flex flex-col items-center justify-center ${
            isEven ? 'order-1 lg:order-1' : 'order-1 lg:order-2'
          }`}
        >
          <motion.div
            ref={visualCardRef}
            onMouseMove={handleCardMouseMove}
            onMouseLeave={handleCardMouseLeave}
            style={{
              perspective: 1000,
              rotateX: prefersReduced ? 0 : springTiltX,
              rotateY: prefersReduced ? 0 : springTiltY,
            }}
            initial={
              prefersReduced
                ? { opacity: 1, x: 0, filter: 'blur(0px)' }
                : { opacity: 0, x: slideInitialX, filter: 'blur(8px)' }
            }
            animate={
              isInView || prefersReduced
                ? { opacity: 1, x: 0, filter: 'blur(0px)' }
                : { opacity: 0, x: slideInitialX, filter: 'blur(8px)' }
            }
            transition={{
              duration: ARCHITECTURE.pillarEntranceDuration,
              ease: EASE.expoOut,
            }}
            whileHover={
              !prefersReduced
                ? {
                    y: ARCHITECTURE.cardHoverLift,
                    transition: { duration: 0.3, ease: 'easeOut' },
                  }
                : {}
            }
            className="w-full flex items-center justify-center relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 rounded-3xl"
            tabIndex={0}
          >
            {/* Render Pillar-Specific Visual */}
            {typeof visualContent === 'function' ? visualContent(isInView) : visualContent}
          </motion.div>
        </motion.div>

        {/* ── 2. EDITORIAL TEXT COLUMN ── */}
        <motion.div
          style={{ y: textParallaxY }}
          className={`lg:col-span-6 space-y-6 text-[#FAF7F0] ${
            isEven ? 'order-2 lg:order-2' : 'order-2 lg:order-1'
          }`}
        >
          {/* Pillar Eyebrow Tag */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={isInView || prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{
              duration: 0.6,
              delay: ARCHITECTURE.pillarTextDelay,
              ease: EASE.expoOut,
            }}
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full ${
              tagColors[tagAccent] || tagColors.emerald
            } text-[10px] uppercase font-bold tracking-wider backdrop-blur-sm shadow-xs`}
          >
            {TagIcon && <TagIcon className="w-3.5 h-3.5" />}
            <span>{tag}</span>
          </motion.div>

          {/* Headline (Word-by-Word Reveal) */}
          <div className="space-y-3">
            <h3 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-[#FAF7F0]">
              <SplitWords
                text={title}
                isVisible={isInView || prefersReduced}
                delay={ARCHITECTURE.pillarTextDelay + 0.1}
                stagger={ARCHITECTURE.headerWordStagger}
              />
            </h3>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={isInView || prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{
                  duration: 0.6,
                  delay: ARCHITECTURE.pillarTextDelay + 0.25,
                  ease: EASE.expoOut,
                }}
                className={`${subtitleColors[tagAccent] || subtitleColors.emerald} text-sm sm:text-base font-medium`}
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          {/* Main Description */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={isInView || prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{
              duration: 0.6,
              delay: ARCHITECTURE.pillarTextDelay + 0.35,
              ease: EASE.expoOut,
            }}
            className="text-sm sm:text-base text-[#FAF7F0]/80 leading-relaxed"
          >
            {description}
          </motion.p>

          {/* Feature Highlight Chips */}
          {chips && chips.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={isInView || prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{
                duration: 0.6,
                delay: ARCHITECTURE.pillarTextDelay + 0.45,
                ease: EASE.expoOut,
              }}
              className={`grid gap-3 pt-2 ${
                chips.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'
              }`}
            >
              {chips.map((c, ci) => (
                <div key={ci} className="p-3.5 rounded-2xl bg-white/[0.07] border border-white/10">
                  <span
                    className={`text-[10px] uppercase font-bold ${
                      subtitleColors[tagAccent] || subtitleColors.emerald
                    } block mb-1`}
                  >
                    {c.title}
                  </span>
                  <p className="text-xs text-[#FAF7F0]/75 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </motion.div>
          )}

          {/* Interactive CTA Button */}
          {ctaLabel && (
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.96 }}
              animate={
                isInView || prefersReduced
                  ? { opacity: 1, y: 0, scale: 1 }
                  : { opacity: 0, y: 12, scale: 0.96 }
              }
              transition={{
                duration: 0.6,
                delay: ARCHITECTURE.pillarTextDelay + 0.55,
                ease: EASE.expoOut,
              }}
              className="pt-3"
            >
              <button
                type="button"
                onClick={onCtaClick}
                className={`group px-7 py-3.5 rounded-full font-semibold text-sm transition-all duration-200 cursor-pointer border-0 flex items-center gap-2.5 active:scale-95 ${
                  buttonStyles[ctaVariant] || buttonStyles.white
                }`}
              >
                <span>{ctaLabel}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
