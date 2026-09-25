import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { api } from '../../services/apiClient.js';
import { MeditativeAudio } from '../../../js/services/soundscape.js';
import { EASE } from '../../motionConfig.js';
import {
  Sparkles,
  Droplet,
  Flame,
  Timer,
  Check,
  Plus,
  ArrowRight,
  ArrowLeft,
  Heart,
  Compass,
  Smile,
  ShieldCheck,
  CheckCircle2,
  Moon,
  Sun,
  Activity,
  Globe,
  Trophy
} from 'lucide-react';

import OnboardingStep2AboutYou from './OnboardingStep2AboutYou.jsx';
import OnboardingStep5Tour from './OnboardingStep5Tour.jsx';

const TOTAL_STEPS = 6;
const STEP_PERCENTAGES = [17, 33, 50, 67, 83, 100];

const STEP_TITLES = [
  'Welcome',
  'About You',
  'Daily Goals',
  'Starter Rituals',
  'Explore Sanctuary',
  'Community & Rhythm'
];

const MANTRAS = [
  'Small, steady actions today quietly shape the person you become.',
  'Breathe gently, focus deeply, and honor the present moment.',
  'Consistency over intensity; progress over perfection.',
  'Move with intention, rest without guilt.'
];

const DEFAULT_RITUALS = [
  {
    id: 'hydr-morning',
    name: 'Morning Hydration',
    category: 'Health',
    anchor: 'Right after waking up',
    time: '07:00',
    icon: Droplet,
    selected: true
  },
  {
    id: 'mind-breath',
    name: 'Mindful Stillness & Breath',
    category: 'Mind',
    anchor: 'Before opening notifications',
    time: '07:30',
    icon: Sparkles,
    selected: true
  },
  {
    id: 'focus-block',
    name: 'Deep Mindful Focus Block',
    category: 'Focus',
    anchor: 'Starting morning work rhythm',
    time: '09:30',
    icon: Timer,
    selected: true
  },
  {
    id: 'move-daily',
    name: 'Midday Movement & Walk',
    category: 'Body',
    anchor: 'After lunch break',
    time: '13:00',
    icon: Activity,
    selected: true
  },
  {
    id: 'rest-sunset',
    name: 'Evening Digital Sunset',
    category: 'Rest',
    anchor: '1 hour before sleep',
    time: '21:30',
    icon: Moon,
    selected: false
  }
];

const AVATARS = ['🌱', '🌊', '🏔️', '☀️', '🌸', '✨', '🍃', '🌿'];

// Comprehensive IANA Timezones list
const COMMON_TIMEZONES = [
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Chicago',
  'America/Denver',
  'America/Halifax',
  'America/Lima',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Bangkok',
  'Asia/Calcutta',
  'Asia/Colombo',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Jerusalem',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Kolkata',
  'Asia/Kuala_Lumpur',
  'Asia/Manila',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Taipei',
  'Asia/Tokyo',
  'Australia/Adelaide',
  'Australia/Brisbane',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Athens',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
  'UTC'
];

export default function OnboardingWizard({ onComplete }) {
  const { user, refreshUser } = useAuth();
  const { refreshAll } = useMomentum();
  const prefersReduced = useReducedMotion();

  // Step 1–6
  const [step, setStep] = useState(1);
  const [isInitializing, setIsInitializing] = useState(true);

  // ── Step 1: Welcome ──
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [mantra, setMantra] = useState(
    user?.mantra || 'Small, steady actions today quietly shape the person you become.'
  );

  // ── Step 2: About You (Personal Data Required) ──
  const [aboutYouData, setAboutYouData] = useState({
    age: user?.age ?? '',
    weightKg: user?.weightKg ?? '',
    weightUnit: user?.units?.weight || 'kg',
    gender: user?.gender || '',
    photoType: user?.photoType || (user?.photoURL ? 'google' : 'avatar'),
    avatarEmblem: user?.avatarEmblem || '🌱',
    photoURL: user?.photoURL || '',
    suggestedProtein: null,
    suggestedWater: null
  });
  const [isStep2Valid, setIsStep2Valid] = useState(false);

  // ── Step 3: Daily Goals ──
  const [waterMl, setWaterMl] = useState(user?.goals?.waterMl || 2000);
  const [proteinG, setProteinG] = useState(user?.goals?.proteinG || 90);
  const [focusMin, setFocusMin] = useState(user?.goals?.focusMin || 25);
  const [volumeUnit, setVolumeUnit] = useState(user?.units?.volume || 'ml');
  const [weightUnit, setWeightUnit] = useState(user?.units?.weight || 'kg');

  // ── Step 4: Starter Rituals ──
  const [rituals, setRituals] = useState(DEFAULT_RITUALS);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState('Mind');
  const [customAnchor, setCustomAnchor] = useState('');

  // ── Step 6: Community & Timezone ──
  // BUG FIX 2: Pre-populate detected timezone automatically
  const detectedTimezone = (() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return tz || 'UTC';
    } catch {
      return 'UTC';
    }
  })();

  const [timezone, setTimezone] = useState(() => {
    if (user?.timezone && user.timezone !== 'UTC') return user.timezone;
    return detectedTimezone;
  });

  const [challengeOptIn, setChallengeOptIn] = useState(true);
  const defaultNickname = user?.displayName
    ? user.displayName.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '') + 'Rhythm'
    : 'CalmRiver';
  const [challengeNickname, setChallengeNickname] = useState(defaultNickname);
  const [challengeAvatar, setChallengeAvatar] = useState('🌱');

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [ariaAnnouncement, setAriaAnnouncement] = useState('Step 1 of 6, Welcome');

  // ── On Mount: Restore saved progress from MongoDB ──
  useEffect(() => {
    async function loadSavedState() {
      try {
        const res = await api.get('/onboarding/state');
        if (res && res.draft) {
          const draft = res.draft;
          if (draft.displayName) setDisplayName(draft.displayName);
          if (draft.mantra) setMantra(draft.mantra);

          if (draft.aboutYou) {
            setAboutYouData((prev) => ({ ...prev, ...draft.aboutYou }));
          }
          if (draft.goals) {
            if (draft.goals.waterMl) setWaterMl(draft.goals.waterMl);
            if (draft.goals.proteinG) setProteinG(draft.goals.proteinG);
            if (draft.goals.focusMin) setFocusMin(draft.goals.focusMin);
          }
          if (draft.units) {
            if (draft.units.volume) setVolumeUnit(draft.units.volume);
            if (draft.units.weight) setWeightUnit(draft.units.weight);
          }
          if (draft.timezone) setTimezone(draft.timezone);
          if (draft.challenge) {
            if (draft.challenge.optedIn !== undefined) setChallengeOptIn(draft.challenge.optedIn);
            if (draft.challenge.nickname) setChallengeNickname(draft.challenge.nickname);
            if (draft.challenge.avatar) setChallengeAvatar(draft.challenge.avatar);
          }
          if (res.step && res.step >= 1 && res.step <= TOTAL_STEPS) {
            setStep(res.step);
            setAriaAnnouncement(`Step ${res.step} of 6, ${STEP_TITLES[res.step - 1]}`);
          }
        }
      } catch (err) {
        console.warn('Could not load draft onboarding state:', err);
      } finally {
        setIsInitializing(false);
      }
    }
    loadSavedState();
  }, []);

  // Update starting goals suggestions when Step 2 calculates them
  useEffect(() => {
    if (aboutYouData.suggestedProtein && !user?.goals?.proteinG) {
      setProteinG(aboutYouData.suggestedProtein);
    }
    if (aboutYouData.suggestedWater && !user?.goals?.waterMl) {
      setWaterMl(aboutYouData.suggestedWater);
    }
  }, [aboutYouData.suggestedProtein, aboutYouData.suggestedWater, user]);

  // ── Save intermediate step progress to MongoDB ──
  const saveStepProgress = async (nextStep) => {
    try {
      const draftPayload = {
        displayName,
        mantra,
        aboutYou: aboutYouData,
        age: aboutYouData.age,
        weightKg: aboutYouData.weightKg,
        gender: aboutYouData.gender,
        photoType: aboutYouData.photoType,
        photoURL: aboutYouData.photoURL,
        avatarEmblem: aboutYouData.avatarEmblem,
        goals: { waterMl, proteinG, focusMin },
        units: { volume: volumeUnit, weight: weightUnit },
        timezone,
        challenge: {
          optedIn: challengeOptIn,
          nickname: challengeNickname,
          avatar: challengeAvatar
        }
      };

      await api.post('/onboarding/step', {
        step: nextStep,
        draft: draftPayload
      });
    } catch (err) {
      console.warn('Draft save error:', err);
    }
  };

  const goToStep = (targetStep) => {
    if (targetStep < 1 || targetStep > TOTAL_STEPS) return;
    setErrorMsg(null);
    saveStepProgress(targetStep);
    setStep(targetStep);
    setAriaAnnouncement(`Step ${targetStep} of 6, ${STEP_TITLES[targetStep - 1]}`);
  };

  // Prevent Escape from skipping
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
      if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA') {
        if (step === 1 && displayName.trim()) goToStep(2);
        else if (step === 2 && isStep2Valid) goToStep(3);
        else if (step === 3) goToStep(4);
        else if (step === 4) goToStep(5);
        else if (step === 6) handleFinish();
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [step, displayName, isStep2Valid]);

  const toggleRitual = (id) => {
    setRituals((prev) =>
      prev.map((r) => (r.id === id ? { ...r, selected: !r.selected } : r))
    );
  };

  const addCustomRitual = () => {
    if (!customName.trim()) return;
    const newRitual = {
      id: 'custom-' + Date.now(),
      name: customName.trim(),
      category: customCategory,
      anchor: customAnchor.trim() || 'Daily practice',
      time: '08:00',
      icon: Sparkles,
      selected: true
    };
    setRituals((prev) => [...prev, newRitual]);
    setCustomName('');
    setCustomAnchor('');
  };

  // Final Complete Handler
  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const chosenRituals = rituals
        .filter((r) => r.selected)
        .map((r) => ({
          name: r.name,
          category: r.category,
          anchor: r.anchor || '',
          time: r.time || '08:00'
        }));

      const finalPayload = {
        displayName: displayName.trim() || user?.displayName || 'Mindful Practitioner',
        mantra: mantra.trim(),
        age: aboutYouData.age,
        weightKg: aboutYouData.weightKg,
        gender: aboutYouData.gender,
        photoType: aboutYouData.photoType,
        photoURL: aboutYouData.photoURL,
        avatarEmblem: aboutYouData.avatarEmblem,
        timezone: timezone || detectedTimezone,
        units: { volume: volumeUnit, weight: weightUnit },
        goals: {
          waterMl: Number(waterMl) || 2000,
          proteinG: Number(proteinG) || 90,
          focusMin: Number(focusMin) || 25
        },
        challenge: {
          optedIn: challengeOptIn,
          nickname: challengeNickname.trim() || 'CalmRiver',
          avatar: challengeAvatar || '🌱'
        },
        rituals: chosenRituals
      };

      await api.post('/onboarding/complete', finalPayload);

      // Refresh in-memory user and momentum data
      await refreshUser();
      await refreshAll();

      try {
        MeditativeAudio.playChime();
      } catch {}

      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Onboarding finalize error:', err);
      setErrorMsg(err.message || 'Setup could not be saved. Please check your connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-outline italic">Opening your mindful sanctuary setup...</p>
        </div>
      </div>
    );
  }

  const currentPercent = STEP_PERCENTAGES[step - 1];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-surface text-on-surface">
      {/* Screen-reader announcement */}
      <div aria-live="polite" className="sr-only">
        {ariaAnnouncement}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE.expoOut }}
        className="w-full max-w-xl bg-surface-container-lowest hairline rounded-3xl shadow-xl p-6 sm:p-9 space-y-7 relative overflow-hidden"
      >
        {/* ── Progress Bar & Step Counter ── */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-outline font-sans">
            <span className="flex items-center gap-1.5 font-medium text-primary tracking-wide uppercase text-[10px]">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>
                Step {step} of {TOTAL_STEPS} &bull; {STEP_TITLES[step - 1]}
              </span>
            </span>
            <span className="font-mono text-xs font-semibold text-primary">
              {currentPercent}%
            </span>
          </div>

          <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${currentPercent}%` }}
              transition={{ duration: 0.35, ease: EASE.expoOut }}
            />
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-700">
            {errorMsg}
          </div>
        )}

        {/* ── Step Views ── */}
        <AnimatePresence mode="wait">
          {/* ════════ STEP 1: WELCOME ════════ */}
          {step === 1 && (
            <motion.div
              key="step-1"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: EASE.expoOut }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-on-surface">
                  Welcome to Your Sanctuary
                </h2>
                <p className="text-xs text-outline mt-1.5 leading-relaxed">
                  Let's personalize your daily rhythm. Tell us how you wish to be greeted and the guiding intention you carry.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-on-surface mb-1.5">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-on-surface mb-1.5">
                    Daily Mantra / Guiding Intention
                  </label>
                  <textarea
                    rows={2}
                    value={mantra}
                    onChange={(e) => setMantra(e.target.value)}
                    placeholder="A calm intention for your days..."
                    className="w-full px-4 py-2.5 rounded-xl border border-outline/20 bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 text-sm resize-none"
                  />

                  <div className="mt-2.5 space-y-1.5">
                    <span className="text-[10px] text-outline uppercase font-semibold">
                      Or choose an intention:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {MANTRAS.map((m, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setMantra(m)}
                          className={`text-[11px] px-2.5 py-1 rounded-lg text-left transition-all ${
                            mantra === m
                              ? 'bg-primary-fixed text-primary font-medium border border-primary/30'
                              : 'bg-surface-container text-outline hover:text-on-surface border border-transparent'
                          }`}
                        >
                          "{m.slice(0, 36)}..."
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ STEP 2: ABOUT YOU (NEW) ════════ */}
          {step === 2 && (
            <motion.div
              key="step-2"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: EASE.expoOut }}
            >
              <OnboardingStep2AboutYou
                user={user}
                data={aboutYouData}
                onChange={setAboutYouData}
                onValidationChange={setIsStep2Valid}
              />
            </motion.div>
          )}

          {/* ════════ STEP 3: DAILY HEALTH & FOCUS GOALS ════════ */}
          {step === 3 && (
            <motion.div
              key="step-3"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: EASE.expoOut }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-on-surface">
                  Daily Health & Focus Goals
                </h2>
                <p className="text-xs text-outline mt-1.5 leading-relaxed">
                  Tailor your baseline wellness targets. You can always refine these later in your profile.
                </p>

                {aboutYouData.weightKg && (
                  <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-[11px] text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Suggested starting targets highlighted below based on your weight input.
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {/* Water Target */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                      <Droplet className="w-3.5 h-3.5 text-blue-500" />
                      Daily Hydration Target
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {waterMl} ml (~{Math.round(waterMl / 250)} glasses)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[1500, 2000, 2500, 3000].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setWaterMl(val)}
                        className={`flex-1 py-1.5 text-xs rounded-xl transition-all ${
                          waterMl === val
                            ? 'bg-primary text-white font-medium shadow-xs'
                            : 'bg-surface-container text-outline hover:text-on-surface'
                        }`}
                      >
                        {val} ml
                      </button>
                    ))}
                  </div>
                </div>

                {/* Protein Target */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      Daily Protein Target
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {proteinG} grams
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[60, 90, 120, 150].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setProteinG(val)}
                        className={`flex-1 py-1.5 text-xs rounded-xl transition-all ${
                          proteinG === val
                            ? 'bg-primary text-white font-medium shadow-xs'
                            : 'bg-surface-container text-outline hover:text-on-surface'
                        }`}
                      >
                        {val}g
                      </button>
                    ))}
                  </div>
                </div>

                {/* Focus Target */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-on-surface flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-emerald-500" />
                      Daily Mindful Focus Block
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {focusMin} minutes
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {[15, 25, 45, 60].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setFocusMin(val)}
                        className={`flex-1 py-1.5 text-xs rounded-xl transition-all ${
                          focusMin === val
                            ? 'bg-primary text-white font-medium shadow-xs'
                            : 'bg-surface-container text-outline hover:text-on-surface'
                        }`}
                      >
                        {val}m
                      </button>
                    ))}
                  </div>
                </div>

                {/* Units */}
                <div className="flex gap-4 pt-1">
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-outline mb-1">
                      Volume Units
                    </label>
                    <div className="flex gap-2">
                      {['ml', 'oz'].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setVolumeUnit(u)}
                          className={`flex-1 py-1.5 text-xs rounded-xl uppercase font-medium ${
                            volumeUnit === u
                              ? 'bg-primary text-white'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] font-medium text-outline mb-1">
                      Weight Units
                    </label>
                    <div className="flex gap-2">
                      {['kg', 'lb'].map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setWeightUnit(u)}
                          className={`flex-1 py-1.5 text-xs rounded-xl uppercase font-medium ${
                            weightUnit === u
                              ? 'bg-primary text-white'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          {u}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ STEP 4: STARTER RITUALS (BUG FIX 1 APPLIED) ════════ */}
          {step === 4 && (
            <motion.div
              key="step-4"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: EASE.expoOut }}
              className="space-y-5"
            >
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-on-surface">
                  Starter Rituals
                </h2>
                <p className="text-xs text-outline mt-1.5 leading-relaxed">
                  Select the mindful habits you wish to anchor into your daily journey. Uncheck any you'd like to omit.
                </p>
              </div>

              {/* Habit list: clean scroll without stray bottom borders */}
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {rituals.map((r) => {
                  const Icon = r.icon || Sparkles;
                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleRitual(r.id)}
                      className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between border transition-all ${
                        r.selected
                          ? 'bg-surface-container-low border-primary/40 shadow-xs'
                          : 'bg-surface-container-lowest border-outline/10 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                            r.selected ? 'bg-primary/10 text-primary' : 'bg-surface-container text-outline'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-on-surface">
                            {r.name}
                          </div>
                          <div className="text-[10px] text-outline">
                            {r.anchor} &bull; {r.time}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                          r.selected
                            ? 'bg-primary border-primary text-white'
                            : 'border-outline/40 bg-surface'
                        }`}
                      >
                        {r.selected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Habit: clean borders, no bottom stray line */}
              <div className="p-3 rounded-2xl bg-surface-container-low border border-outline/10 space-y-2">
                <span className="text-[11px] font-medium text-on-surface block">
                  + Add a custom habit
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Habit title (e.g. 10m Reading)"
                    className="flex-1 px-3 py-1.5 rounded-xl border border-outline/20 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="px-2 py-1.5 rounded-xl border border-outline/20 bg-surface-container-lowest text-xs text-on-surface focus:outline-none"
                  >
                    <option value="Mind">Mind</option>
                    <option value="Health">Health</option>
                    <option value="Focus">Focus</option>
                    <option value="Body">Body</option>
                    <option value="Rest">Rest</option>
                  </select>
                  <button
                    type="button"
                    onClick={addCustomRitual}
                    className="px-3 py-1.5 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-all shadow-xs"
                  >
                    Add
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ════════ STEP 5: FEATURE TOUR (NEW) ════════ */}
          {step === 5 && (
            <motion.div
              key="step-5"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: EASE.expoOut }}
            >
              <OnboardingStep5Tour
                onTourComplete={() => goToStep(6)}
                onSkipTour={() => goToStep(6)}
              />
            </motion.div>
          )}

          {/* ════════ STEP 6: COMMUNITY & TIMEZONE (BUG FIX 2 APPLIED) ════════ */}
          {step === 6 && (
            <motion.div
              key="step-6"
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, x: -12 }}
              transition={{ duration: 0.28, ease: EASE.expoOut }}
              className="space-y-6"
            >
              <div>
                <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-on-surface">
                  Community & Timezone
                </h2>
                <p className="text-xs text-outline mt-1.5 leading-relaxed">
                  Join our weekly mindful rhythm challenge circle, or practice completely privately.
                </p>
              </div>

              <div className="space-y-4">
                {/* Timezone: BUG FIX 2 — Pre-populates detected timezone in dropdown */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 space-y-1.5">
                  <label className="block text-xs font-medium text-on-surface flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>Sanctuary Timezone</span>
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-outline/20 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono"
                  >
                    {!COMMON_TIMEZONES.includes(timezone) && (
                      <option value={timezone}>{timezone} (Detected)</option>
                    )}
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz} {tz === detectedTimezone ? '★ (Detected)' : ''}
                      </option>
                    ))}
                  </select>
                  <span className="text-[10px] text-emerald-700 font-medium mt-1 block">
                    ✓ Auto-detected your location: {detectedTimezone}
                  </span>
                </div>

                {/* Challenge Circle Card */}
                <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500" />
                        Weekly Challenge Circle
                      </span>
                      <p className="text-[11px] text-outline mt-0.5">
                        Anonymously celebrate habit consistency with peers.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChallengeOptIn(!challengeOptIn)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        challengeOptIn ? 'bg-primary' : 'bg-surface-container-high'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          challengeOptIn ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {challengeOptIn && (
                    <div className="pt-2 space-y-3 border-t border-outline/10">
                      <div>
                        <label className="block text-[11px] font-medium text-outline mb-1">
                          Sanctuary Nickname (Displayed on circle leaderboard)
                        </label>
                        <input
                          type="text"
                          value={challengeNickname}
                          onChange={(e) => {
                            setChallengeNickname(e.target.value);
                            if (errorMsg) setErrorMsg(null);
                          }}
                          placeholder="e.g. CalmRiver"
                          className={`w-full px-3 py-1.5 rounded-xl border ${
                            errorMsg && errorMsg.includes('username')
                              ? 'border-red-500 focus:ring-1 focus:ring-red-500'
                              : 'border-outline/20'
                          } bg-surface-container-lowest text-xs text-on-surface`}
                        />
                        {errorMsg && errorMsg.includes('username') && (
                          <p className="text-[11px] text-red-600 mt-1 font-medium">{errorMsg}</p>
                        )}
                      </div>


                      <div>
                        <label className="block text-[11px] font-medium text-outline mb-1">
                          Choose Avatar Emblem
                        </label>
                        <div className="flex gap-2">
                          {AVATARS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setChallengeAvatar(emoji)}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                                challengeAvatar === emoji
                                  ? 'bg-primary-fixed border-2 border-primary scale-105'
                                  : 'bg-surface-container hover:bg-surface-container-high'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Privacy Badge */}
                <div className="flex items-center justify-between gap-2 text-[11px] text-outline p-2.5 rounded-xl bg-surface-container/50">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Your habits, focus, and journal remain completely isolated and private.</span>
                  </div>
                  <a
                    href="#privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary font-medium underline hover:text-primary-hover shrink-0"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Navigation Bottom Bar (Clean borders without stray line) ── */}
        {step !== 5 && (
          <div className="flex items-center justify-between pt-4 border-t border-outline/10">
            {step > 1 ? (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => goToStep(step - 1)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-outline hover:text-on-surface flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back
              </button>
            ) : (
              <div />
            )}

            {step < TOTAL_STEPS ? (
              <button
                type="button"
                disabled={step === 2 && !isStep2Valid}
                onClick={() => goToStep(step + 1)}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-medium hover:bg-primary/90 flex items-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Entering Sanctuary...</span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Complete Setup & Enter Sanctuary</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
