import React, { useState, useRef } from 'react';
import { motion, useInView, useScroll, useSpring, useTransform, useReducedMotion } from 'framer-motion';
import {
  Sparkles,
  Mic,
  Flame,
  HeartHandshake,
  Headphones,
  Award,
} from 'lucide-react';
import { EASE, ARCHITECTURE } from '../../motionConfig';
import SplitWords from '../animation/SplitWords.jsx';
import ArchitectureBackground from './ArchitectureBackground.jsx';
import { SectionTopCurve, SectionBottomCurve } from './SectionCurves.jsx';
import PillarRail from './PillarRail.jsx';
import PillarDivider from './PillarDivider.jsx';
import Pillar from './Pillar.jsx';

import DialVisual from './visuals/DialVisual.jsx';
import VoiceVisual from './visuals/VoiceVisual.jsx';
import MovementVisual from './visuals/MovementVisual.jsx';
import RestVisual from './visuals/RestVisual.jsx';
import SoundVisual from './visuals/SoundVisual.jsx';
import MedalVisual from './visuals/MedalVisual.jsx';

/**
 * ArchitectureSection
 * ─────────────────────────────────────────────────────────────────────────────
 * Dark Green Sanctuary Container:
 * - Natural scroll-linked curve section transitions (Top & Bottom curves)
 * - Section content stays hidden until top curve is ~60% settled
 * - Dynamic spotlight, firefly particles, and ambient aurora background
 * - Exactly ONE fixed left-edge pillar navigation rail (fades in/out with section)
 * - 5 Scroll-triggered PillarDividers between the six pillars
 * - Header reveal with word-mask typography
 * - 6 Zig-zag feature pillars with signature micro-interactions
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function ArchitectureSection({ setView }) {
  const sectionRef = useRef(null);
  const headerRef = useRef(null);
  const prefersReduced = useReducedMotion();
  const [activePillarIndex, setActivePillarIndex] = useState(0);
  const [activeVoicePrompt, setActiveVoicePrompt] = useState(0);
  const [selectedMedalTier, setSelectedMedalTier] = useState('gold');

  // Track overall section scroll progress for background and rail
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });

  // Top curve scroll progress: ['start end', 'start 0.3']
  const { scrollYProgress: topCurveProgress } = useScroll({
    target: sectionRef,
    offset: ARCHITECTURE.topCurveOffset || ['start end', 'start 0.3'],
  });

  // Bottom curve scroll progress: ['end 0.7', 'end start']
  const { scrollYProgress: bottomCurveProgress } = useScroll({
    target: sectionRef,
    offset: ARCHITECTURE.bottomCurveOffset || ['end 0.7', 'end start'],
  });

  // Spring for top curve to drive content entrance timing
  const topCurveSpring = useSpring(topCurveProgress, {
    stiffness: 120,
    damping: 22,
    restDelta: 0.001,
  });

  // Content reveals once the top curve reaches ~60% settled
  const contentOpacity = useTransform(topCurveSpring, [0.6, 0.95], [0, 1]);
  const contentY = useTransform(topCurveSpring, [0.6, 0.95], [24, 0]);

  const isHeaderInView = useInView(headerRef, {
    amount: 0.4,
    once: true,
  });

  // Check if section is currently active for Rail visibility
  const isSectionInView = useInView(sectionRef, {
    margin: '-8% 0px -8% 0px',
  });

  const pillarsData = [
    { id: '01', title: 'Concentric Adherence Dial', navLabel: '01 Dial' },
    { id: '02', title: 'Aria Voice Sanctuary', navLabel: '02 Aria' },
    { id: '03', title: 'Movement & Live PR Engine', navLabel: '03 Movement' },
    { id: '04', title: 'Guilt-Free Rest Philosophy', navLabel: '04 Rest' },
    { id: '05', title: 'Harmonic Soundscape Sanctuary', navLabel: '05 Sound' },
    { id: '06', title: '3D Specular Milestone Medals', navLabel: '06 Medals' },
  ];

  const voicePrompts = [
    '“Aria, log 2 glasses of water”',
    '“Add 15 minutes of evening stretching to my rituals”',
    '“Start a 25-minute deep focus interval with forest rain”',
  ];

  const medalTiers = [
    { id: 'bronze', label: 'Bronze', milestone: '7-Day Genesis' },
    { id: 'silver', label: 'Silver', milestone: '30-Day Flow' },
    { id: 'gold', label: 'Gold', milestone: '100-Day Centurion' },
    { id: 'platinum', label: 'Platinum', milestone: '365-Day Master' },
  ];

  return (
    <section
      ref={sectionRef}
      id="overview-pillars"
      aria-label="Architecture of Mindfulness"
      className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] px-4 sm:px-8 md:px-12 lg:px-20 py-24 sm:py-32 my-12 bg-gradient-to-b from-[#0A4839] via-[#0F6E56] to-[#08382C] text-[#FAF7F0] shadow-2xl overflow-hidden"
    >
      {/* ── Top Scroll-Linked Curved Transition (Cream to Green) ── */}
      {ARCHITECTURE.transitionStyle === 'curve' && (
        <SectionTopCurve topProgress={topCurveProgress} />
      )}

      {/* ── Atmospheric Background Layer (Dynamic Spotlight + Particles + Grain) ── */}
      <ArchitectureBackground
        activePillarIndex={activePillarIndex}
        scrollYProgress={scrollYProgress}
        isInSection={isSectionInView}
      />

      {/* ── Desktop Dot Rail (Mounted ONCE, visible strictly in Architecture section) ── */}
      <PillarRail
        activePillarIndex={activePillarIndex}
        pillars={pillarsData}
        isVisible={isSectionInView}
        onSelectPillar={(idx) => setActivePillarIndex(idx)}
      />

      {/* ── Central Content Container (Fades in when curve is ~60% settled) ── */}
      <motion.div
        style={{
          opacity: prefersReduced ? 1 : contentOpacity,
          y: prefersReduced ? 0 : contentY,
        }}
        className="max-w-6xl mx-auto space-y-16 sm:space-y-24 relative z-10"
      >
        {/* ── Section Header ── */}
        <header
          ref={headerRef}
          className="text-center max-w-3xl mx-auto space-y-4 pt-6"
        >
          {/* Eyebrow Pill */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isHeaderInView || prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.7, delay: ARCHITECTURE.headerRevealDelay, ease: EASE.expoOut }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-emerald-300 border border-white/15 text-[11px] uppercase font-bold tracking-wider backdrop-blur-md shadow-sm relative overflow-hidden"
          >
            {!prefersReduced && isHeaderInView && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.5, delay: 0.4, ease: 'easeInOut' }}
              />
            )}
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>Architecture of Mindfulness</span>
          </motion.div>

          {/* Word-by-Word Revealed Title */}
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl font-normal text-[#FAF7F0] leading-tight">
            <SplitWords
              text="Everything Engineered for Serene Living"
              isVisible={isHeaderInView || prefersReduced}
              delay={ARCHITECTURE.headerRevealDelay + 0.15}
              stagger={ARCHITECTURE.headerWordStagger}
            />
          </h2>

          {/* Subtext Line-by-Line */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={isHeaderInView || prefersReduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{
              duration: 0.7,
              delay: ARCHITECTURE.headerRevealDelay + 0.45,
              ease: EASE.expoOut,
            }}
            className="text-sm sm:text-base text-[#FAF7F0]/80 leading-relaxed max-w-2xl mx-auto"
          >
            Explore the six foundational instruments designed to bring quiet elegance, mathematical precision, and mindful rhythm to your daily practice.
          </motion.p>
        </header>

        {/* ── Six Pillars Zig-Zag Sequence with Scroll-Triggered Dividers ── */}
        <div className="space-y-4 sm:space-y-6">
          {/* ── PILLAR 01: DIAL ── */}
          <Pillar
            id="01"
            index={0}
            tag="Pillar 01 · Daily Core Dial"
            tagIcon={Sparkles}
            tagAccent="emerald"
            title="Concentric Adherence Dial"
            subtitle="Triple-Ring Daily Harmony with Zero Visual Clutter"
            description="The Concentric Dial synthesizes your entire day into three harmonious rings. Outer ring for mindful habits, middle for deep focus minutes, and inner for cellular hydration — engineered with strict 74px clearance and zero cognitive overload."
            chips={[
              { title: 'Outer Ring', desc: 'Habit completions & anchor triggers' },
              { title: 'Middle Ring', desc: '432Hz deep focus minutes in flow' },
              { title: 'Inner Ring', desc: 'Optimal hydration telemetry' },
            ]}
            ctaLabel="Launch Daily Dial"
            ctaVariant="white"
            onCtaClick={() => setView('today')}
            onInViewChange={(idx) => setActivePillarIndex(idx)}
            visualContent={(isVisible) => <DialVisual isVisible={isVisible} />}
          />

          {/* Separator between Pillar 01 and Pillar 02 */}
          <PillarDivider
            index={1}
            label="PILLAR 02 · HANDS-FREE AI"
          />

          {/* ── PILLAR 02: ARIA VOICE ── */}
          <Pillar
            id="02"
            index={1}
            tag="Pillar 02 · Hands-Free AI"
            tagIcon={Mic}
            tagAccent="cyan"
            title="Aria Voice Sanctuary"
            subtitle="Zero-Hallucination Local Natural Language AI"
            description="Speak naturally to your sanctuary. Aria listens with a living presence orb, visualizes multi-layer cyan sine waves, and confirms actions with an instant 10-second undo safety net for zero-regret voice interactions."
            chips={[]}
            ctaLabel="Experience Aria Voice"
            ctaVariant="cyan"
            onCtaClick={() => setView('voice')}
            onInViewChange={(idx) => setActivePillarIndex(idx)}
            visualContent={(isVisible) => (
              <div className="w-full flex flex-col items-center gap-4">
                <VoiceVisual isVisible={isVisible} activePromptIndex={activeVoicePrompt} />
                
                {/* Spoken prompt selector buttons */}
                <div className="w-full max-w-md space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-cyan-200 block text-left">
                    Try Spoken Prompts:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {voicePrompts.map((p, i) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setActiveVoicePrompt(i)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer border ${
                          activeVoicePrompt === i
                            ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40 shadow-sm'
                            : 'bg-white/[0.06] text-[#FAF7F0]/70 border-white/10 hover:bg-white/[0.12]'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          />

          {/* Separator between Pillar 02 and Pillar 03 */}
          <PillarDivider
            index={2}
            label="PILLAR 03 · STRENGTH & PR PRECISION"
          />

          {/* ── PILLAR 03: MOVEMENT ── */}
          <Pillar
            id="03"
            index={2}
            tag="Pillar 03 · Strength & PR Precision"
            tagIcon={Flame}
            tagAccent="amber"
            title="Movement & Live PR Engine"
            subtitle="Per-Set Granular Strength & Auto-Detected PR Trophies"
            description="Track weights and reps per set with one-tap replication (+ Set), live PR auto-detection with trophy badges, and a non-blocking floating rest timer that travels with you across the app."
            chips={[
              { title: 'Granular Sets', desc: 'Log individual reps, weights & RPE' },
              { title: 'Live PR Badges', desc: 'Instant trophies on lifetime records' },
              { title: 'Floating Timer', desc: '90s interval with singing bowl alert' },
            ]}
            ctaLabel="Launch Movement Log"
            ctaVariant="amber"
            onCtaClick={() => setView('movement')}
            onInViewChange={(idx) => setActivePillarIndex(idx)}
            visualContent={(isVisible) => <MovementVisual isVisible={isVisible} />}
          />

          {/* Separator between Pillar 03 and Pillar 04 */}
          <PillarDivider
            index={3}
            label="PILLAR 04 · GUILT-FREE ETHOS"
          />

          {/* ── PILLAR 04: REST PHILOSOPHY ── */}
          <Pillar
            id="04"
            index={3}
            tag="Pillar 04 · Guilt-Free Ethos"
            tagIcon={HeartHandshake}
            tagAccent="emerald"
            title="Guilt-Free Rest Philosophy"
            subtitle="Skip for Today (Rest Day) Without Streak Anxiety"
            description="Honoring recovery as essential practice. Skip habits without streak anxiety or mathematical penalties, preserving your psychological momentum and building sustainable lifelong rituals."
            chips={[
              {
                title: '🛡️ Zero Mathematical Penalty',
                desc: 'Rest days are mathematically factored into adherence metrics without breaking streak counters.',
              },
              {
                title: '🌿 Sustainable Habit Longevity',
                desc: 'Prevents burnout and eliminates the all-or-nothing mindset common in traditional habit apps.',
              },
            ]}
            ctaLabel="Explore Rituals Sanctuary"
            ctaVariant="white"
            onCtaClick={() => setView('rituals')}
            onInViewChange={(idx) => setActivePillarIndex(idx)}
            visualContent={(isVisible) => <RestVisual isVisible={isVisible} />}
          />

          {/* Separator between Pillar 04 and Pillar 05 */}
          <PillarDivider
            index={4}
            label="PILLAR 05 · ACOUSTIC ARCHITECTURE"
          />

          {/* ── PILLAR 05: SOUNDSCAPE ── */}
          <Pillar
            id="05"
            index={4}
            tag="Pillar 05 · Acoustic Architecture"
            tagIcon={Headphones}
            tagAccent="cyan"
            title="Harmonic Soundscape Sanctuary"
            subtitle="432Hz Mathematical Web Audio Generative Frequencies"
            description="Pure Web Audio API procedural soundscapes synthesized in real time directly inside your browser. No bulky audio file downloads, no buffering — tuned to 432Hz mathematical resonance with periodic Tibetan singing bowl chimes."
            chips={[
              { title: 'Zero Audio Files', desc: 'Real-time oscillator synthesis' },
              { title: 'Singing Bowls', desc: 'Interval chimes for flow state' },
              { title: 'Alpha Waves', desc: '10Hz binaural synchronization' },
            ]}
            ctaLabel="Enter Sound Sanctuary"
            ctaVariant="cyan"
            onCtaClick={() => setView('focus')}
            onInViewChange={(idx) => setActivePillarIndex(idx)}
            visualContent={(isVisible) => <SoundVisual isVisible={isVisible} />}
          />

          {/* Separator between Pillar 05 and Pillar 06 */}
          <PillarDivider
            index={5}
            label="PILLAR 06 · COLLECTIBLES"
          />

          {/* ── PILLAR 06: MEDALS ── */}
          <Pillar
            id="06"
            index={5}
            tag="Pillar 06 · Collectibles"
            tagIcon={Award}
            tagAccent="amber"
            title="3D Specular Milestone Medals"
            subtitle="Tangible Physical Craftsmanship Tokens & 180° Flip Certificates"
            description="Four material tiers modeled with dynamic specular lighting. Interactive 180° card flips reveal authentic cryptographically verified achievement certificates celebrating your unbroken rhythm."
            chips={[]}
            ctaLabel="Inspect All Medals"
            ctaVariant="amber"
            onCtaClick={() => setView('milestones')}
            onInViewChange={(idx) => setActivePillarIndex(idx)}
            visualContent={(isVisible) => (
              <div className="w-full flex flex-col items-center gap-4">
                <MedalVisual
                  isVisible={isVisible}
                  selectedTier={selectedMedalTier}
                  onSelectTier={setSelectedMedalTier}
                />
                
                {/* Material Tier Selector */}
                <div className="w-full max-w-sm space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-amber-200 block text-center sm:text-left">
                    Select Material Tier:
                  </span>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                    {medalTiers.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedMedalTier(t.id)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                          selectedMedalTier === t.id
                            ? 'bg-amber-400/20 text-amber-200 border-amber-400/40 shadow-sm'
                            : 'bg-white/[0.06] text-[#FAF7F0]/70 border-white/10 hover:bg-white/[0.12]'
                        }`}
                      >
                        {t.label} ({t.milestone})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          />
        </div>
      </motion.div>

      {/* ── Bottom Scroll-Linked Curved Transition (Green to Cream) ── */}
      {ARCHITECTURE.transitionStyle === 'curve' && (
        <SectionBottomCurve bottomProgress={bottomCurveProgress} />
      )}
    </section>
  );
}
