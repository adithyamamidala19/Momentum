import React, { useState, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import { Award } from 'lucide-react';
import { EASE, ARCHITECTURE } from '../../../motionConfig';

/**
 * MedalVisual
 * ─────────────────────────────────────────────────────────────────────────────
 * Pillar 06: 3D Specular Milestone Medals
 * - Specular gold medal performs a signature 3D entrance flip (rotateY 180° to 0°)
 * - Tier chips light up in sequence, settling on Gold
 * - Desktop: Cursor-reactive 3D perspective tilt (spring-smoothed, returns to rest)
 * - Click/Tap: Interactive 180° flip into Certificate of Mindful Practice
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function MedalVisual({ isVisible = true, selectedTier = 'gold', onSelectTier }) {
  const prefersReduced = useReducedMotion();
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef(null);

  const tiers = [
    { id: 'bronze', label: 'Bronze', medalClass: 'medal-bronze', milestone: '7-Day Genesis' },
    { id: 'silver', label: 'Silver', medalClass: 'medal-silver', milestone: '30-Day Flow' },
    { id: 'gold', label: 'Gold', medalClass: 'medal-gold', milestone: '100-Day Centurion' },
    { id: 'platinum', label: 'Platinum', medalClass: 'medal-platinum', milestone: '365-Day Master' },
  ];

  const currentTier = tiers.find((t) => t.id === selectedTier) || tiers[2];

  // 3D Tilt Physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [ARCHITECTURE.medalTiltMax, -ARCHITECTURE.medalTiltMax]), {
    stiffness: 300,
    damping: 25,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-ARCHITECTURE.medalTiltMax, ARCHITECTURE.medalTiltMax]), {
    stiffness: 300,
    damping: 25,
  });

  const handleMouseMove = (e) => {
    if (prefersReduced || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div className="w-full max-w-sm flex flex-col items-center justify-center">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          perspective: 1000,
          rotateX: prefersReduced ? 0 : rotateX,
          rotateY: prefersReduced ? 0 : rotateY,
        }}
        className="w-full"
      >
        <div
          className={`realistic-medal-card cursor-pointer select-none transition-shadow duration-300 ${
            isFlipped ? 'flipped' : ''
          }`}
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ minHeight: '330px' }}
        >
          <div className={`medal-card-flipper ${isFlipped ? 'flipped' : ''}`}>
            {/* Front Face: Specular Medal */}
            <div className="medal-face-front p-8 flex flex-col items-center justify-center text-center space-y-5">
              {/* Initial 3D Flip & Specular Disc */}
              <motion.div
                initial={prefersReduced ? { rotateY: 0 } : { rotateY: 180, scale: 0.8, opacity: 0 }}
                animate={
                  isVisible
                    ? { rotateY: 0, scale: 1, opacity: 1 }
                    : prefersReduced
                    ? { rotateY: 0 }
                    : { rotateY: 180, scale: 0.8, opacity: 0 }
                }
                transition={{ duration: 1.0, delay: 0.2, ease: EASE.expoOut }}
                className={`medal-disc-wrapper ${currentTier.medalClass} shadow-2xl relative overflow-hidden`}
              >
                <div className="medal-specular-glint" />
                <Award className="w-10 h-10 text-white drop-shadow-md relative z-10" />

                {/* Light glint sweep */}
                {!prefersReduced && isVisible && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/40 to-transparent pointer-events-none"
                    initial={{ x: '-150%', y: '-150%' }}
                    animate={{ x: '150%', y: '150%' }}
                    transition={{ duration: 1.6, delay: 1.1, ease: 'easeInOut' }}
                  />
                )}
              </motion.div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 block">
                  {currentTier.label} Tier Milestone
                </span>
                <h4 className="font-editorial text-2xl text-[#FAF7F0] mt-1 font-normal">
                  {currentTier.milestone}
                </h4>
              </div>

              <span className="text-[11px] text-emerald-200/60 italic">
                Tap to flip 180° into Certificate
              </span>
            </div>

            {/* Back Face: Certificate */}
            <div className="medal-face-back p-6 flex flex-col justify-between text-left space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
                  <span className="text-[10px] font-mono text-emerald-300 uppercase">
                    Verified Sanctuary Proof
                  </span>
                  <span className="text-[10px] font-mono text-white/50">#MOM-2026</span>
                </div>
                <h5 className="font-editorial text-lg text-white">Certificate of Mindful Practice</h5>
                <p className="text-xs text-white/70 mt-2 leading-relaxed">
                  Awarded for completing the {currentTier.milestone} practice with unbroken intention.
                </p>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
                <span>100% Client-Side Verified</span>
                <span className="text-amber-300 font-semibold">Tap to flip back</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
