import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useReducedMotion, useInView } from 'framer-motion';
import { Plus, Minus, Droplet, Sparkles } from 'lucide-react';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { MeditativeAudio } from '../../../js/services/soundscape.js';

export default function WaterBottle({ className = '' }) {
  const { state, incrementWater, decrementWater } = useMomentum();
  const prefersReduced = useReducedMotion();
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { amount: 0.2 });

  // Real store data
  const currentMl = state.waterMl !== undefined ? state.waterMl : 1500;
  const targetMl = state.waterTargetMl || 2000;
  const glasses = Math.floor(currentMl / 250);
  const targetGlasses = Math.floor(targetMl / 250);
  const fillRatio = Math.min(1, Math.max(0, currentMl / targetMl));

  // Visual spring-driven water level (0 to 100%)
  const fillPercentageSpring = useSpring(fillRatio * 100, {
    stiffness: 120,
    damping: 18,
    mass: 0.8
  });

  const [displayPct, setDisplayPct] = useState(fillRatio * 100);

  useEffect(() => {
    fillPercentageSpring.set(fillRatio * 100);
  }, [fillRatio, fillPercentageSpring]);

  useEffect(() => {
    return fillPercentageSpring.on('change', (latest) => {
      setDisplayPct(latest);
    });
  }, [fillPercentageSpring]);

  // Slosh ripple and bubbles on tap
  const [ripples, setRipples] = useState([]);
  const [bubbles, setBubbles] = useState([]);
  const [isSloshing, setIsSloshing] = useState(false);

  // Tilt with cursor (Desktop) / Orientation (Mobile)
  const [tiltDeg, setTiltDeg] = useState(0);

  const handleMouseMove = (e) => {
    if (prefersReduced || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const deg = Math.max(-5, Math.min(5, (x / (rect.width / 2)) * 4));
    setTiltDeg(deg);
  };

  const handleMouseLeave = () => {
    setTiltDeg(0);
  };

  // Device orientation support on mobile
  useEffect(() => {
    if (prefersReduced) return;

    const handleOrientation = (e) => {
      if (typeof e.gamma === 'number') {
        const deg = Math.max(-8, Math.min(8, e.gamma * 0.25));
        setTiltDeg(deg);
      }
    };

    if (window.DeviceOrientationEvent) {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    return () => {
      if (window.DeviceOrientationEvent) {
        window.removeEventListener('deviceorientation', handleOrientation);
      }
    };
  }, [prefersReduced]);

  const triggerSloshAnimation = () => {
    setIsSloshing(true);
    setTimeout(() => setIsSloshing(false), 900);

    // Create 4 floating bubbles
    const newBubbles = Array.from({ length: 4 }).map((_, i) => ({
      id: Date.now() + i,
      x: 35 + Math.random() * 30, // 35% to 65% of bottle width
      delay: i * 0.1,
      size: 3 + Math.random() * 3
    }));
    setBubbles(newBubbles);
    setTimeout(() => setBubbles([]), 1500);

    // Create surface ripple
    const rippleId = Date.now();
    setRipples(prev => [...prev, rippleId]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r !== rippleId));
    }, 1200);

    try {
      MeditativeAudio.playChime(528);
    } catch (e) {}
  };

  const handleAdd = () => {
    incrementWater(250);
    triggerSloshAnimation();
  };

  const handleSubtract = () => {
    decrementWater(250);
    triggerSloshAnimation();
  };

  // Bottle SVG internal dimensions:
  // ViewBox: 0 0 140 260
  // Bottle body starts around Y=60 down to Y=240 (height = 180)
  const bodyTop = 60;
  const bodyBottom = 236;
  const waterHeight = (displayPct / 100) * (bodyBottom - bodyTop);
  const waterSurfaceY = bodyBottom - waterHeight;
  const isGoalReached = currentMl >= targetMl;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`p-6 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between select-none relative overflow-hidden h-full ${className}`}
    >
      {/* ── Header Row ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E6F4F1] flex items-center justify-center text-[#0891B2] shrink-0">
              <Droplet className="w-4 h-4" />
            </div>
            <h3 className="font-editorial text-lg text-on-surface">Water</h3>
          </div>

          <span
            className="font-mono text-sm font-bold text-on-surface whitespace-nowrap"
            aria-live="polite"
          >
            {currentMl} / {targetMl} ml
          </span>
        </div>

        {/* Progress Bar */}
        <div className="my-3">
          <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#22D3EE] to-[#0891B2]"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.round((currentMl / targetMl) * 100))}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-outline mt-1.5 font-medium">
            <span>{Math.min(100, Math.round((currentMl / targetMl) * 100))}% of daily goal</span>
            <span>{glasses} of {targetGlasses} glasses (250ml)</span>
          </div>
        </div>
      </div>

      {/* ── Interactive Water Bottle Centerpiece ── */}
      <div className="relative my-2 flex flex-col items-center justify-center flex-1">
        <motion.div
          animate={
            prefersReduced
              ? {}
              : {
                  rotate: tiltDeg || [0, 0.8, 0, -0.8, 0]
                }
          }
          transition={
            tiltDeg
              ? { type: 'spring', stiffness: 200, damping: 20 }
              : { repeat: Infinity, duration: 8, ease: 'easeInOut' }
          }
          className="relative w-32 h-44 flex items-center justify-center"
          role="img"
          aria-label={`Water bottle filled at ${currentMl} milliliters out of ${targetMl} milliliter goal.`}
        >
          {/* Subtle Glow behind bottle */}
          <div
            className={`absolute inset-0 rounded-full blur-2xl transition-opacity duration-700 pointer-events-none ${
              isGoalReached ? 'bg-[#0891B2]/25 opacity-100' : 'bg-[#0891B2]/10 opacity-60'
            }`}
          />

          <svg
            viewBox="0 0 140 260"
            className="w-full h-full drop-shadow-md overflow-visible"
          >
            <defs>
              {/* Bottle Interior Shape for water clipping */}
              <clipPath id="bottleInteriorClip">
                <path
                  d="M 52 52
                     L 88 52
                     C 88 58, 92 68, 102 78
                     C 114 90, 116 100, 116 112
                     L 116 220
                     C 116 235, 108 240, 92 240
                     L 48 240
                     C 32 240, 24 235, 24 220
                     L 24 112
                     C 24 100, 26 90, 38 78
                     C 48 68, 52 58, 52 52 Z"
                />
              </clipPath>

              {/* Water Liquid Gradient */}
              <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.85" />
                <stop offset="50%" stopColor="#0891B2" stopOpacity="0.92" />
                <stop offset="100%" stopColor="#0E7490" stopOpacity="0.98" />
              </linearGradient>

              {/* Secondary wave gradient for gentle depth */}
              <linearGradient id="waterDepthGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#67E8F9" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0891B2" stopOpacity="0.75" />
              </linearGradient>

              {/* Glass Reflection Gradient */}
              <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
                <stop offset="15%" stopColor="#FFFFFF" stopOpacity="0.1" />
                <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.0" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            {/* 1. Bottle Outline Glass Base */}
            <path
              d="M 50 30
                 L 90 30
                 L 90 52
                 C 90 60, 94 70, 104 80
                 C 116 92, 118 102, 118 114
                 L 118 222
                 C 118 238, 109 244, 92 244
                 L 48 244
                 C 31 244, 22 238, 22 222
                 L 22 114
                 C 22 102, 24 92, 36 80
                 C 46 70, 50 60, 50 52 Z"
              fill="#FAF7F0"
              stroke="#D1D5DB"
              strokeWidth="2.5"
              className="drop-shadow-xs"
            />

            {/* 2. Stainless Bamboo Cap */}
            <rect
              x="46"
              y="18"
              width="48"
              height="14"
              rx="4"
              fill="#0F6E56"
              stroke="#0A4839"
              strokeWidth="1.5"
            />
            {/* Cap Grip Ring */}
            <line x1="52" y1="25" x2="88" y2="25" stroke="#A0F3D4" strokeWidth="1.5" strokeLinecap="round" />

            {/* 3. Water Fill with Waves (Clipped to Bottle Interior) */}
            <g clipPath="url(#bottleInteriorClip)">
              {/* Back Wave (slower drift) */}
              <g
                style={{
                  transform: `translateY(${waterSurfaceY}px)`,
                  transition: prefersReduced ? 'none' : 'transform 0.4s ease-out'
                }}
              >
                <path
                  d="M -140 0
                     Q -105 -6, -70 0
                     T 0 0
                     T 70 0
                     T 140 0
                     T 210 0
                     T 280 0
                     L 280 260 L -140 260 Z"
                  fill="url(#waterDepthGradient)"
                  className={isInView && !prefersReduced ? 'animate-wave-back' : ''}
                />
              </g>

              {/* Front Wave (drifts opposite, higher opacity) */}
              <g
                style={{
                  transform: `translateY(${waterSurfaceY}px)`,
                  transition: prefersReduced ? 'none' : 'transform 0.4s ease-out'
                }}
              >
                <path
                  d="M -140 0
                     Q -105 7, -70 0
                     T 0 0
                     T 70 0
                     T 140 0
                     T 210 0
                     T 280 0
                     L 280 260 L -140 260 Z"
                  fill="url(#waterGradient)"
                  className={isInView && !prefersReduced ? 'animate-wave-front' : ''}
                />

                {/* Surface ripple ring on add */}
                {ripples.map(rId => (
                  <ellipse
                    key={rId}
                    cx="70"
                    cy="0"
                    rx="38"
                    ry="5"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                    className="animate-ping opacity-75"
                  />
                ))}
              </g>

              {/* Floating Bubbles */}
              {bubbles.map(b => (
                <circle
                  key={b.id}
                  cx={b.x}
                  cy={waterSurfaceY + 40}
                  r={b.size}
                  fill="rgba(255, 255, 255, 0.75)"
                  className="animate-bubble-rise"
                  style={{ animationDelay: `${b.delay}s` }}
                />
              ))}

              {/* Glass interior highlight / specular stripe */}
              <rect
                x="32"
                y="60"
                width="12"
                height="170"
                rx="6"
                fill="url(#glassSheen)"
                pointerEvents="none"
              />
            </g>

            {/* 4. Measurement Graduation Ticks on Bottle Exterior */}
            <g opacity="0.65">
              {/* 2000 ml (near top) */}
              <line x1="88" y1="80" x2="102" y2="80" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" />
              <text x="70" y="83" fontSize="8" fill="#4A5550" fontWeight="600" textAnchor="end">2000</text>

              {/* 1500 ml */}
              <line x1="90" y1="120" x2="102" y2="120" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" />
              <text x="74" y="123" fontSize="8" fill="#4A5550" fontWeight="600" textAnchor="end">1500</text>

              {/* 1000 ml */}
              <line x1="90" y1="160" x2="102" y2="160" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" />
              <text x="74" y="163" fontSize="8" fill="#4A5550" fontWeight="600" textAnchor="end">1000</text>

              {/* 500 ml */}
              <line x1="90" y1="200" x2="102" y2="200" stroke="#0F6E56" strokeWidth="1.5" strokeLinecap="round" />
              <text x="74" y="203" fontSize="8" fill="#4A5550" fontWeight="600" textAnchor="end">500</text>
            </g>

            {/* 5. Outer Glass Stroke Overlay */}
            <path
              d="M 50 30
                 L 90 30
                 L 90 52
                 C 90 60, 94 70, 104 80
                 C 116 92, 118 102, 118 114
                 L 118 222
                 C 118 238, 109 244, 92 244
                 L 48 244
                 C 31 244, 22 238, 22 222
                 L 22 114
                 C 22 102, 24 92, 36 80
                 C 46 70, 50 60, 50 52 Z"
              fill="none"
              stroke="rgba(15, 110, 86, 0.2)"
              strokeWidth="2"
            />
          </svg>
        </motion.div>

        {/* Goal Reached Calm Message */}
        {isGoalReached && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E6F4F1] text-[#0891B2] text-[11px] font-bold"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Beautifully hydrated</span>
          </motion.div>
        )}
      </div>

      {/* ── Interactive +/- Controls ── */}
      <div className="flex items-center justify-between gap-3 pt-3 border-t border-surface-container">
        <button
          type="button"
          onClick={handleSubtract}
          disabled={currentMl <= 0}
          className="px-3 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-outline hover:text-on-surface cursor-pointer border-0 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
          aria-label="Remove 250ml (one glass) of water"
        >
          <Minus className="w-3.5 h-3.5" />
          <span>250ml</span>
        </button>

        <div className="text-center font-mono text-xs font-bold text-on-surface">
          {glasses} / {targetGlasses} gl
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="px-3.5 py-2 rounded-xl bg-[#0891B2] hover:bg-[#0E7490] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer border-0 transition-all shadow-xs hover:scale-105 active:scale-95"
          aria-label="Add 250ml (one glass) of water"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+250ml Glass</span>
        </button>
      </div>

      {/* CSS Animations for waves and bubbles */}
      <style>{`
        @keyframes waveFrontDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(-140px); }
        }
        @keyframes waveBackDrift {
          0% { transform: translateX(0); }
          100% { transform: translateX(140px); }
        }
        @keyframes bubbleRise {
          0% { transform: translateY(0); opacity: 0.8; }
          100% { transform: translateY(-70px); opacity: 0; }
        }
        .animate-wave-front {
          animation: waveFrontDrift 4s linear infinite;
        }
        .animate-wave-back {
          animation: waveBackDrift 6s linear infinite;
        }
        .animate-bubble-rise {
          animation: bubbleRise 1.2s ease-out forwards;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-wave-front, .animate-wave-back, .animate-bubble-rise {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
