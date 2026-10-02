import React, { useState, useEffect } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Mic } from 'lucide-react';
import { EASE } from '../../../motionConfig';

/**
 * VoiceVisual
 * ─────────────────────────────────────────────────────────────────────────────
 * Pillar 02: Aria Voice Sanctuary
 * - Living presence orb with gentle expanding ripple rings
 * - Multi-layer cyan sine visualizer undulation (pure animation, NO real audio)
 * - Typing effect for spoken commands + 10s undo safety toast
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function VoiceVisual({ isVisible = true, activePromptIndex = 0 }) {
  const prefersReduced = useReducedMotion();
  const prompts = [
    '“Aria, log 2 glasses of water”',
    '“Add 15 minutes of evening stretching to my rituals”',
    '“Start a 25-minute deep focus interval with forest rain”',
  ];

  const currentPrompt = prompts[activePromptIndex] || prompts[0];
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingDone, setIsTypingDone] = useState(false);

  // Typewriter effect on prompt change or reveal
  useEffect(() => {
    if (prefersReduced) {
      setDisplayedText(currentPrompt);
      setIsTypingDone(true);
      return;
    }

    if (!isVisible) {
      setDisplayedText('');
      setIsTypingDone(false);
      return;
    }

    let i = 0;
    setDisplayedText('');
    setIsTypingDone(false);

    const startDelay = setTimeout(() => {
      const interval = setInterval(() => {
        i++;
        setDisplayedText(currentPrompt.slice(0, i));
        if (i >= currentPrompt.length) {
          clearInterval(interval);
          setIsTypingDone(true);
        }
      }, 35);

      return () => clearInterval(interval);
    }, 400);

    return () => clearTimeout(startDelay);
  }, [currentPrompt, isVisible, prefersReduced]);

  const barHeights = [40, 70, 95, 60, 85, 100, 75, 45, 90, 65, 30, 80, 95, 55, 35];

  return (
    <div className="w-full max-w-md p-7 sm:p-9 rounded-3xl bg-white/[0.08] border border-white/[0.14] backdrop-blur-xl shadow-2xl relative overflow-hidden text-center space-y-6">
      {/* Ambient Cyan Glow */}
      <div className="absolute top-0 left-0 w-48 h-48 bg-[#0891B2]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Living Presence Orb */}
      <div className="py-4 flex flex-col items-center justify-center relative">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isVisible ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.8, ease: EASE.expoOut }}
          className="w-28 h-28 rounded-full bg-gradient-to-tr from-[#00d4ff] via-[#0891B2] to-[#0F6E56] text-white flex items-center justify-center shadow-2xl relative"
        >
          {/* Concentric expanding ripples */}
          {!prefersReduced && isVisible && (
            <>
              <div className="absolute inset-0 rounded-full bg-[#00d4ff]/30 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute -inset-3 rounded-full border border-cyan-400/30 animate-pulse" style={{ animationDuration: '2.4s' }} />
            </>
          )}
          <Mic className="w-11 h-11 relative z-10 text-white drop-shadow-md" />
        </motion.div>
        <span className="text-xs font-mono text-cyan-200 mt-4 tracking-wider">
          Aria Listening · Sine Mode
        </span>
      </div>

      {/* Simulated Sine Visualizer Waves */}
      <div className="flex items-center justify-center gap-1.5 h-10 px-4">
        {barHeights.map((h, i) => (
          <motion.div
            key={i}
            className="w-1.5 bg-gradient-to-t from-cyan-400 to-emerald-300 rounded-full"
            initial={{ height: '15%' }}
            animate={
              isVisible
                ? prefersReduced
                  ? { height: `${h * 0.7}%` }
                  : { height: [`${h * 0.25}%`, `${h}%`, `${h * 0.35}%`] }
                : { height: '15%' }
            }
            transition={
              !prefersReduced && isVisible
                ? {
                    duration: 0.8 + (i % 5) * 0.15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: i * 0.04,
                  }
                : { duration: 0.4 }
            }
          />
        ))}
      </div>

      {/* Spoken Action Confirmed Toast */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
        transition={{ duration: 0.5, delay: 0.3, ease: EASE.expoOut }}
        className="p-3.5 rounded-2xl bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-between text-left min-h-[58px]"
      >
        <div className="pr-2 overflow-hidden">
          <span className="text-[10px] uppercase font-bold text-cyan-300 block">
            Voice Action Confirmed
          </span>
          <span className="text-xs text-[#FAF7F0] font-medium font-mono truncate block">
            {displayedText}
            {!isTypingDone && !prefersReduced && (
              <span className="inline-block w-1.5 h-3 bg-cyan-300 ml-0.5 animate-pulse align-middle" />
            )}
          </span>
        </div>

        <motion.span
          initial={{ scale: 0.8, opacity: 0 }}
          animate={isTypingDone || prefersReduced ? { scale: 1, opacity: 1 } : { scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE.spring }}
          className="text-xs font-mono font-bold text-amber-300 px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 shrink-0 ml-2"
        >
          Undo 10s
        </motion.span>
      </motion.div>
    </div>
  );
}
