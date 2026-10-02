import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import { MeditativeAudio } from '../../../../js/services/soundscape.js';
import { EASE } from '../../../motionConfig';

/**
 * SoundVisual
 * ─────────────────────────────────────────────────────────────────────────────
 * Pillar 05: Harmonic Soundscape Sanctuary
 * - Procedural frequency cards with mini animated waveforms
 * - Slow concentric ripple around 432Hz Pure badge
 * - ZERO autoplay audio (Web Audio API sound is strictly user-triggered)
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function SoundVisual({ isVisible = true }) {
  const prefersReduced = useReducedMotion();
  const [activeSound, setActiveSound] = useState('forest');
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayChime = () => {
    try {
      MeditativeAudio.playChime();
      setIsPlaying(true);
      setTimeout(() => setIsPlaying(false), 2000);
    } catch (e) {}
  };

  const soundOptions = [
    { id: 'forest', label: '🌿 Forest Rain', freq: 'Pink Noise' },
    { id: 'ocean', label: '🌊 Ocean Waves', freq: 'Brown Noise' },
    { id: 'binaural', label: '🧘 Binaural Alpha', freq: '10Hz Theta' },
    { id: 'relief', label: '🕊️ Stress Relief', freq: '528Hz Solfeggio' },
  ];

  return (
    <div className="w-full max-w-md p-7 sm:p-9 rounded-3xl bg-white/[0.08] border border-white/[0.14] backdrop-blur-xl shadow-2xl relative overflow-hidden space-y-5">
      {/* Dynamic Aqua Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-[#0891B2]/30 rounded-full blur-3xl pointer-events-none" />

      {/* Synthesizer Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300">
            Web Audio API Engine
          </span>
          <h4 className="font-editorial text-xl text-[#FAF7F0] font-normal">
            432Hz Mathematical Synth
          </h4>
        </div>
        <div className="relative">
          {!prefersReduced && isVisible && (
            <div className="absolute -inset-1.5 rounded-full border border-cyan-400/40 animate-ping pointer-events-none" style={{ animationDuration: '3.5s' }} />
          )}
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 relative z-10">
            432Hz Pure
          </span>
        </div>
      </div>

      {/* Procedural Sound Selector Cards with Mini Waveforms */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {soundOptions.map((s, index) => {
          const isSelected = activeSound === s.id;
          return (
            <motion.button
              key={s.id}
              type="button"
              onClick={() => setActiveSound(s.id)}
              initial={{ opacity: 0, y: 12 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
              transition={{
                duration: 0.5,
                delay: 0.2 + index * 0.12,
                ease: EASE.expoOut,
              }}
              className={`p-3 rounded-2xl text-left transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-400/40 text-[#FAF7F0] shadow-md'
                  : 'bg-white/[0.05] border-white/10 text-[#FAF7F0]/70 hover:bg-white/[0.1]'
              }`}
            >
              <span className="text-xs font-semibold block">{s.label}</span>
              <span className="text-[10px] font-mono text-cyan-200/60 mt-1 block">
                {s.freq}
              </span>
              
              {/* Mini animated audio visualizer bars */}
              <div className="flex items-center gap-0.5 h-3 mt-2">
                {[30, 70, 50, 90, 40].map((h, bi) => (
                  <motion.div
                    key={bi}
                    className={`w-1 rounded-full ${isSelected ? 'bg-cyan-300' : 'bg-white/30'}`}
                    animate={
                      isSelected && !prefersReduced && isVisible
                        ? { height: [`${h * 0.4}%`, `${h}%`, `${h * 0.3}%`] }
                        : { height: '30%' }
                    }
                    transition={{
                      duration: 0.7 + (bi % 3) * 0.2,
                      repeat: Infinity,
                      ease: 'easeInOut',
                      delay: bi * 0.08,
                    }}
                  />
                ))}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Singing Bowl Chime Trigger Card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
        transition={{ duration: 0.6, delay: 0.55, ease: EASE.expoOut }}
        className="p-4 rounded-2xl bg-cyan-950/60 border border-cyan-400/30 flex items-center justify-between"
      >
        <div className="flex items-center gap-2.5">
          <Volume2
            className={`w-5 h-5 transition-colors ${
              isPlaying ? 'text-amber-300 animate-bounce' : 'text-cyan-300'
            }`}
          />
          <div>
            <span className="text-xs font-bold text-[#FAF7F0] block">
              Tibetan Singing Bowl
            </span>
            <span className="text-[10px] text-cyan-200/70">Interval pacing chime</span>
          </div>
        </div>
        <button
          type="button"
          onClick={handlePlayChime}
          className="px-3.5 py-1.5 rounded-full bg-cyan-400/20 hover:bg-cyan-400/30 text-cyan-200 text-xs font-semibold border border-cyan-400/30 transition-all cursor-pointer active:scale-95"
        >
          {isPlaying ? 'Playing...' : 'Play Chime'}
        </button>
      </motion.div>
    </div>
  );
}
