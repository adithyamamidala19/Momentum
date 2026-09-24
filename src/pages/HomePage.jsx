import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { useMomentum } from '../context/MomentumContext.jsx';
import HeroReveal, { HeroPill, HeroHeadline, HeroSubtext, HeroButtons, HeroBadges } from '../components/animation/HeroReveal.jsx';
import AdherenceRingSequence from '../components/animation/AdherenceRingSequence.jsx';
import ArchitectureSection from '../components/architecture/ArchitectureSection.jsx';
import RitualLoopSection from '../components/ritual/RitualLoopSection.jsx';
import { EASE } from '../motionConfig.js';
import {
  ArrowRight,
  ShieldCheck,
  Headphones,
  Zap,
  ChevronRight,
  Mic,
} from 'lucide-react';

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN HOME PAGE WITH FULL-BLEED FOREST GREEN ARCHITECTURE OF MINDFULNESS
   ───────────────────────────────────────────────────────────────────────────── */
export default function HomePage({ setView, loaderDone = true }) {
  const { state, metrics } = useMomentum();
  const pillarsSectionRef = useRef(null);

  return (
    <div className="relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 left-1/4 w-[480px] h-[480px] bg-primary-container/10 rounded-full blur-3xl opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute top-12 right-1/4 w-[420px] h-[420px] bg-[#00d4ff]/10 rounded-full blur-3xl opacity-60 animate-pulse" style={{ animationDuration: '11s' }} />
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[550px] h-[350px] bg-secondary-fixed/30 rounded-full blur-3xl opacity-50" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-20 space-y-28">
        {/* ── 1. HERO SECTION ── */}
        <section className="text-center relative max-w-4xl mx-auto space-y-8">
          {/* Top Pill Badge */}
          <HeroPill loaderDone={loaderDone}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-high/80 hairline backdrop-blur-md shadow-xs">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-ping" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary-container">
                Mindful Rituals &amp; Daily Rhythm Sanctuary
              </span>
            </div>
          </HeroPill>

          {/* Main Headline */}
          <div className="space-y-4">
            <HeroHeadline
              line1="Transform Daily Actions Into"
              greenLine="Living Works of Art."
              loaderDone={loaderDone}
            />
            <HeroSubtext loaderDone={loaderDone} delay={0.6}>
              <p className="text-base sm:text-lg text-outline max-w-2xl mx-auto font-normal leading-relaxed">
                Momentum is an intentional digital sanctuary engineered with calm botanical aesthetics, hands-free Aria AI voice control, per-set movement logging, 432Hz harmonic soundscapes, and 3D specular collectible medals.
              </p>
            </HeroSubtext>
          </div>

          {/* Primary CTA Buttons */}
          <HeroButtons loaderDone={loaderDone} delay={0.85}>
            <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
              <button
                type="button"
                onClick={() => setView('today')}
                className="px-7 py-3.5 rounded-full bg-primary-container text-white font-medium text-sm flex items-center gap-2.5 shadow-md hover:bg-primary-container/90 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer border-0"
              >
                <span>Enter Today's Sanctuary</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('overview-pillars');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface font-medium text-sm flex items-center gap-2 hairline transition-all cursor-pointer border-0"
              >
                <span>Explore The Pillars</span>
                <ChevronRight className="w-4 h-4 text-outline" />
              </button>
            </div>
          </HeroButtons>

          {/* Trust Badges */}
          <HeroBadges loaderDone={loaderDone} delay={1.05}>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-container" />
              <span className="text-xs text-outline">100% Client-Side Privacy</span>
            </div>
            <div className="flex items-center gap-2 mx-8">
              <Zap className="w-4 h-4 text-secondary-container" />
              <span className="text-xs text-outline">Zero Streak-Guilt Ethos</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones className="w-4 h-4 text-[#0891B2]" />
              <span className="text-xs text-outline">432Hz Sound Synthesizer</span>
            </div>
          </HeroBadges>

          {/* Adherence Ring Card — Smooth Fluid Glide to Left */}
          <motion.div
            className="pt-6"
            initial={{ opacity: 0 }}
            animate={loaderDone ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.5, delay: 1.2 }}
          >
            <AdherenceRingSequence setView={setView} />
          </motion.div>
        </section>

        {/* ── 2. LIVE METRICS RIBBON ── */}
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, ease: EASE.expoOut }}
          className="p-6 sm:p-8 rounded-3xl bg-surface-container-low hairline shadow-sm"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x hairline">
            <div className="pt-4 md:pt-0 md:px-4">
              <span className="text-xs text-outline block mb-1">Rhythm Adherence</span>
              <span className="font-editorial text-3xl sm:text-4xl font-normal text-primary-container">
                {metrics.dailyAdherenceScore}%
              </span>
              <span className="text-[11px] text-outline block mt-0.5">Triple-ring harmonic balance</span>
            </div>

            <div className="pt-4 md:pt-0 md:px-4">
              <span className="text-xs text-outline block mb-1">Daily Rituals Tracked</span>
              <span className="font-editorial text-3xl sm:text-4xl font-normal text-on-surface">
                {state.customHabits ? state.customHabits.length : 3}
              </span>
              <span className="text-[11px] text-outline block mt-0.5">Custom triggers &amp; anchors</span>
            </div>

            <div className="pt-4 md:pt-0 md:px-4">
              <span className="text-xs text-outline block mb-1">Personal Best Lifts</span>
              <span className="font-editorial text-3xl sm:text-4xl font-normal text-secondary-container">
                6+ PRs
              </span>
              <span className="text-[11px] text-outline block mt-0.5">Auto-detected strength records</span>
            </div>

            <div className="pt-4 md:pt-0 md:px-4">
              <span className="text-xs text-outline block mb-1">Voice Undo Window</span>
              <span className="font-editorial text-3xl sm:text-4xl font-normal text-[#0891B2]">
                10 Seconds
              </span>
              <span className="text-[11px] text-outline block mt-0.5">Zero-regret state recovery</span>
            </div>
          </div>
        </motion.section>

        {/* ── 3. ARCHITECTURE OF MINDFULNESS (FULL-BLEED FOREST GREEN SANCTUARY) ── */}
        <ArchitectureSection setView={setView} />

        {/* ── 4. THE DAILY RITUAL LOOP (NATURAL SCROLL EXPAND & CONNECTOR) ── */}
        <RitualLoopSection />

        {/* ── 5. FINAL CALL TO ACTION BANNER ── */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.7, ease: EASE.expoOut }}
          className="relative rounded-3xl p-8 sm:p-14 bg-gradient-to-br from-[#0F6E56] to-[#084C3B] text-white text-center shadow-2xl overflow-hidden space-y-6"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent pointer-events-none" />

          <div className="max-w-2xl mx-auto space-y-4 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-200">
              Your Daily Sanctuary Awaits
            </span>
            <h2 className="font-editorial text-3xl sm:text-5xl font-normal leading-tight">
              “Small, steady actions quietly shape the person you become.”
            </h2>
            <p className="text-sm text-emerald-100 max-w-lg mx-auto font-normal">
              No subscription paywalls. No guilt notifications. Just you, your rhythm, and mindful presence.
            </p>
          </div>

          <div className="pt-2 relative z-10 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => setView('today')}
              className="px-8 py-4 rounded-full bg-white text-primary-container font-semibold text-sm shadow-xl hover:bg-emerald-50 hover:scale-105 active:scale-95 transition-all cursor-pointer border-0 flex items-center gap-2"
            >
              <span>Begin Today’s Practice</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('voice')}
              className="px-6 py-4 rounded-full bg-emerald-800/80 hover:bg-emerald-800 text-white font-medium text-sm hairline transition-all cursor-pointer border-0 flex items-center gap-2"
            >
              <Mic className="w-4 h-4" />
              <span>Talk to Aria</span>
            </button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
