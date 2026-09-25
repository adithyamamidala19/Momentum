import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { MeditativeAudio } from '../../js/services/soundscape.js';
import {
  Play,
  Pause,
  Square,
  Headphones,
  Volume2,
  Sparkles,
  CheckCircle2,
  Sliders,
  X,
  Clock,
  Compass
} from 'lucide-react';

export default function FocusPage() {
  const { state, addFocusMinutes, showToast } = useMomentum();

  // Presets & Duration
  const presets = [15, 25, 45, 60];
  const [selectedDuration, setSelectedDuration] = useState(25);
  const [remainingSec, setRemainingSec] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusIntention, setFocusIntention] = useState('Deep architectural reflection');

  // Custom Stepper Modal
  const [customModalOpen, setCustomModalOpen] = useState(false);
  const [customMins, setCustomMins] = useState(30);

  // Ceremonial sequence: 'idle' | 'earphones' | 'countdown' | 'focused' | 'completed'
  const [focusStage, setFocusStage] = useState('idle');
  const [countdownNum, setCountdownNum] = useState(3);

  // Soundscape Presets
  const SOUNDSCAPE_PRESETS = [
    { id: 'forest', label: 'Forest Rain', icon: '🌿' },
    { id: 'ocean', label: 'Ocean Waves', icon: '🌊' },
    { id: 'alpha', label: 'Binaural Alpha', icon: '🧘' },
    { id: 'relief', label: 'Peaceful Relief', fullLabel: 'Peaceful Stress Relief', icon: '🕊️' }
  ];

  const getSoundLabel = (presetId) => {
    switch (presetId) {
      case 'forest': return 'Forest Rain';
      case 'ocean': return 'Ocean Waves';
      case 'alpha':
      case 'binaural': return 'Binaural Alpha';
      case 'relief':
      case 'peaceful':
      case 'stress-relief': return 'Peaceful Stress Relief';
      default: return 'Harmonic Soundscape';
    }
  };

  // Soundscape
  const [soundscapePreset, setSoundscapePreset] = useState('forest');
  const [soundscapePlaying, setSoundscapePlaying] = useState(false);
  const [volume, setVolume] = useState(0.4);

  const timerRef = useRef(null);

  // Countdown timer engine
  useEffect(() => {
    if (isRunning && remainingSec > 0) {
      timerRef.current = setInterval(() => {
        setRemainingSec(prev => Math.max(0, prev - 1));
      }, 1000);
    } else if (isRunning && remainingSec === 0) {
      handleCompleteFocus();
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, remainingSec]);

  // Stop audio on page unmount
  useEffect(() => {
    return () => {
      try { MeditativeAudio.stopTone(); } catch (e) {}
    };
  }, []);

  // Handle Preset Click
  const handleSelectPreset = (mins) => {
    if (isRunning) return;
    setSelectedDuration(mins);
    setRemainingSec(mins * 60);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (customMins >= 5 && customMins <= 120) {
      setSelectedDuration(customMins);
      setRemainingSec(customMins * 60);
      setCustomModalOpen(false);
    }
  };

  // Start Ceremonial Sequence
  const handleStartIntro = () => {
    setFocusStage('earphones');
  };

  const handleProceedFromEarphones = () => {
    try { MeditativeAudio.ensureContext(); } catch (e) {}
    setFocusStage('countdown');
    setCountdownNum(3);

    try { MeditativeAudio.playChime(396); } catch (e) {}

    let count = 3;
    const interval = setInterval(() => {
      count -= 1;
      if (count === 2) {
        setCountdownNum(2);
        try { MeditativeAudio.playChime(432); } catch (e) {}
      } else if (count === 1) {
        setCountdownNum(1);
        try { MeditativeAudio.playChime(528); } catch (e) {}
      } else if (count <= 0) {
        clearInterval(interval);
        setFocusStage('focused');
        setIsRunning(true);
        try {
          MeditativeAudio.ensureContext();
          MeditativeAudio.setVolume(volume);
          MeditativeAudio.startTone(soundscapePreset);
          setSoundscapePlaying(true);
        } catch (e) {}
      }
    }, 1000);
  };

  const handleTogglePlayPause = () => {
    setIsRunning(prev => {
      const next = !prev;
      if (next) {
        if (soundscapePlaying) {
          try {
            MeditativeAudio.setVolume(volume);
            MeditativeAudio.startTone(soundscapePreset);
          } catch (e) {}
        }
      } else {
        if (soundscapePlaying) {
          try { MeditativeAudio.stopTone(); } catch (e) {}
        }
      }
      return next;
    });
  };

  const handleSelectSoundscapePreset = (presetId) => {
    // If user clicks the sound currently playing, toggle pause
    if (soundscapePreset === presetId && soundscapePlaying) {
      try {
        MeditativeAudio.stopTone();
        setSoundscapePlaying(false);
      } catch (e) {}
      return;
    }

    setSoundscapePreset(presetId);
    try {
      MeditativeAudio.ensureContext();
      MeditativeAudio.setVolume(volume);
      MeditativeAudio.startTone(presetId);
      setSoundscapePlaying(true);
      if (showToast) {
        showToast(`Soundscape: ${getSoundLabel(presetId)} playing`);
      }
    } catch (e) {
      console.error('[FocusPage] Play soundscape error:', e);
    }
  };

  const handleToggleSoundscape = () => {
    setSoundscapePlaying(prev => {
      const next = !prev;
      if (next) {
        try {
          MeditativeAudio.ensureContext();
          MeditativeAudio.setVolume(volume);
          MeditativeAudio.startTone(soundscapePreset);
          if (showToast) {
            showToast(`Soundscape: ${getSoundLabel(soundscapePreset)} playing`);
          }
        } catch (e) {
          console.error('[FocusPage] Toggle soundscape error:', e);
        }
      } else {
        try {
          MeditativeAudio.stopTone();
        } catch (e) {}
      }
      return next;
    });
  };

  const handleCompleteFocus = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    try {
      MeditativeAudio.stopTone();
      MeditativeAudio.playChime(528);
    } catch (e) {}
    setSoundscapePlaying(false);
    const completedMins = Math.round((selectedDuration * 60 - remainingSec) / 60) || selectedDuration;
    addFocusMinutes(completedMins, focusIntention);
    setFocusStage('completed');
  };

  const handleReset = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    try { MeditativeAudio.stopTone(); } catch (e) {}
    setSoundscapePlaying(false);
    setRemainingSec(selectedDuration * 60);
    setFocusStage('idle');
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // SVG Progress Ring calculations
  const totalSec = selectedDuration * 60;
  const progressRatio = totalSec > 0 ? (totalSec - remainingSec) / totalSec : 0;
  const radius = 120;
  const circumference = 2 * Math.PI * radius; // ~753.98
  const strokeDashoffset = circumference - (circumference * progressRatio);

  const isFocusMode = focusStage === 'focused' && isRunning;

  return (
    <PageShell centered className="transition-colors duration-700">
      {/* ── STAGE: EARPHONES INTRO MODAL ── */}
      <AnimatePresence>
        {focusStage === 'earphones' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="p-8 rounded-3xl bg-surface-container-lowest max-w-sm w-full text-center hairline shadow-2xl"
            >
              <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Headphones className="w-8 h-8" />
              </div>
              <h3 className="font-editorial text-2xl font-normal text-on-surface">
                Slip on your earphones
              </h3>
              <p className="text-xs text-outline leading-relaxed mt-2">
                For optimal binaural alpha immersion and 432Hz ambient resonance, connect headphones before we gently begin.
              </p>
              <button
                type="button"
                onClick={handleProceedFromEarphones}
                className="w-full mt-6 py-3.5 rounded-full bg-primary-container text-white text-xs font-bold hover:bg-primary-container-hover transition-all cursor-pointer border-0 shadow-xs active:scale-95"
              >
                Ready & Focused →
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── STAGE: 3-2-1 CEREMONIAL COUNTDOWN ── */}
      <AnimatePresence>
        {focusStage === 'countdown' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-lg text-white">
            <motion.div
              key={countdownNum}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center justify-center"
            >
              <span className="font-editorial text-8xl font-light text-primary-fixed">
                {countdownNum}
              </span>
              <p className="text-sm font-light text-gray-300 tracking-wider mt-4">
                Deep breath in... Settle into presence.
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Page Header (Fades in Focus Mode) ── */}
      <div className={`transition-opacity duration-500 w-full ${isFocusMode ? 'opacity-20 pointer-events-none' : 'opacity-100'}`}>
        <PageHeader
          eyebrow="QUIET SANCTUARY"
          title="Deep Focus Session"
          subtitle="A dedicated container for single-task presence, supported by live synthesized harmonic soundscapes."
          centered
        />
      </div>

      {/* ── Focus Intention Input Field ── */}
      <div className={`w-full max-w-md mx-auto mb-6 transition-opacity duration-500 ${isFocusMode ? 'opacity-40' : 'opacity-100'}`}>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest hairline shadow-2xs">
          <Compass className="w-4 h-4 text-[#0F6E56] shrink-0" />
          <input
            type="text"
            placeholder="What will you focus on?"
            value={focusIntention}
            disabled={isRunning}
            onChange={e => setFocusIntention(e.target.value)}
            className="w-full bg-transparent text-xs sm:text-sm font-medium text-on-surface focus:outline-none disabled:opacity-80"
          />
        </div>
      </div>

      {/* ── Central Circular Timer with SVG Progress Ring & Halo ── */}
      <div className="relative my-8 sm:my-10 w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Breathing Halo Aura */}
        <motion.div
          animate={
            isRunning
              ? { scale: [1, 1.04, 1], opacity: [0.25, 0.4, 0.25] }
              : { scale: [1, 1.06, 1], opacity: [0.12, 0.28, 0.12] }
          }
          transition={{
            repeat: Infinity,
            duration: isRunning ? 3 : 5.5,
            ease: 'easeInOut'
          }}
          className="absolute inset-0 rounded-full bg-primary-container filter blur-3xl pointer-events-none"
        />

        {/* SVG Progress Ring */}
        <svg
          viewBox="0 0 280 280"
          className="absolute inset-0 w-full h-full -rotate-90 transform overflow-visible pointer-events-none"
        >
          {/* Track Ring */}
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="rgba(15, 110, 86, 0.12)"
            strokeWidth="6"
          />
          {/* Animated Progress Stroke */}
          <motion.circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="#0F6E56"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </svg>

        {/* Inner Circle Content */}
        <div className="w-[230px] h-[230px] rounded-full bg-surface-container-lowest hairline shadow-2xl flex flex-col items-center justify-center relative select-none">
          {/* Display Serif Tabular Digits */}
          <span
            className="font-editorial text-5xl sm:text-6xl font-normal tracking-tight text-on-surface leading-none"
            style={{ fontVariantNumeric: 'tabular-nums' }}
          >
            {formatTime(remainingSec)}
          </span>
          <span className="text-xs text-outline font-medium mt-2">
            {isRunning ? 'Presence in progress' : `${selectedDuration} Minutes Planned`}
          </span>
        </div>
      </div>

      {/* ── Duration Chips (15 / 25 / 45 / 60 / Custom) ── */}
      {focusStage === 'idle' && (
        <div className="flex items-center gap-2 mb-8 select-none flex-wrap justify-center">
          {presets.map(mins => {
            const isSelected = selectedDuration === mins;
            return (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectPreset(mins)}
                className={`relative px-4 py-2 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors ${
                  isSelected
                    ? 'text-white'
                    : 'bg-surface-container text-outline hover:text-on-surface'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeFocusPreset"
                    className="absolute inset-0 rounded-full bg-primary-container shadow-xs"
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{mins}m</span>
              </button>
            );
          })}

          {/* Custom Duration Chip */}
          <button
            type="button"
            onClick={() => setCustomModalOpen(true)}
            className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-outline hover:text-on-surface cursor-pointer border-0 transition-colors flex items-center gap-1"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom</span>
          </button>
        </div>
      )}

      {/* ── Prominent Session Controls ── */}
      <div className="flex items-center gap-4 mb-8">
        {focusStage === 'idle' ? (
          <button
            type="button"
            onClick={handleStartIntro}
            className="px-8 py-4 rounded-full bg-primary-container text-white text-sm font-bold hover:bg-primary-container-hover transition-all shadow-md flex items-center gap-2 cursor-pointer border-0 active:scale-95"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Enter Focus Mode</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={handleTogglePlayPause}
              className="w-14 h-14 rounded-full bg-primary-container text-white flex items-center justify-center hover:bg-primary-container-hover transition-all cursor-pointer border-0 shadow-md active:scale-95"
              aria-label={isRunning ? 'Pause focus session' : 'Resume focus session'}
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-white" />}
            </button>
            <button
              type="button"
              onClick={handleCompleteFocus}
              className="px-6 py-3.5 rounded-full bg-surface-container text-outline hover:text-on-surface text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-0 transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>Complete Early</span>
            </button>
          </>
        )}
      </div>

      {/* ── Soundscape Synthesizer Card (Matches Timer Width) ── */}
      <div className="p-5 rounded-3xl bg-surface-container-lowest hairline w-full max-w-md mx-auto text-left shadow-xs mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary-container" />
            <span>Harmonic Soundscape</span>
          </span>
          <button
            type="button"
            onClick={handleToggleSoundscape}
            className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border cursor-pointer transition-colors ${
              soundscapePlaying
                ? 'bg-primary-container text-white border-primary-container'
                : 'bg-surface-container text-outline border-transparent hover:text-on-surface'
            }`}
          >
            {soundscapePlaying ? 'Active · 432Hz' : 'Muted (Tap to Play)'}
          </button>
        </div>

        {/* Soundscape Preset Options */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          {SOUNDSCAPE_PRESETS.map(snd => {
            const isSelected = soundscapePreset === snd.id;
            const isPlayingThis = isSelected && soundscapePlaying;
            return (
              <button
                key={snd.id}
                type="button"
                onClick={() => handleSelectSoundscapePreset(snd.id)}
                className={`py-2 px-2 rounded-xl text-xs font-medium text-center cursor-pointer border transition-all flex items-center justify-center gap-1.5 ${
                  isPlayingThis
                    ? 'bg-primary-container text-white font-semibold border-primary-container shadow-xs'
                    : isSelected
                    ? 'bg-primary-container/20 text-primary-container font-semibold border-primary-container/30'
                    : 'bg-surface-container text-outline hover:text-on-surface border-transparent'
                }`}
                title={`${snd.fullLabel || snd.label} - ${isPlayingThis ? 'Currently playing (tap to pause)' : 'Tap to play'}`}
              >
                <span>{snd.icon}</span>
                <span className="truncate">{snd.label}</span>
              </button>
            );
          })}
        </div>

        {/* Volume Slider */}
        <div className="flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-outline shrink-0" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={e => {
              const v = parseFloat(e.target.value);
              setVolume(v);
              try { MeditativeAudio.setVolume(v); } catch (err) {}
            }}
            className="w-full accent-primary-container cursor-pointer"
            aria-label="Soundscape volume"
          />
          <span className="text-xs text-outline font-mono w-8 text-right shrink-0">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      {/* ── Recent Sessions Row (Today's minutes, weekly total) ── */}
      <div className="w-full max-w-md mx-auto p-4 rounded-2xl bg-surface-container-low hairline flex items-center justify-between text-xs text-outline mb-12">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#0F6E56]" />
          <span>Today's Mindful Focus:</span>
          <strong className="text-on-surface">{state.todayFocusMinutes || 0} mins</strong>
        </div>
        <div>
          <span>Weekly Total: </span>
          <strong className="text-primary-container">{state.mindfulHours || 38}h</strong>
        </div>
      </div>

      {/* ── Custom Duration Stepper Modal (5 to 120 min) ── */}
      <AnimatePresence>
        {customModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="p-6 rounded-3xl bg-surface-container-lowest hairline shadow-2xl max-w-xs w-full text-center"
            >
              <h4 className="font-editorial text-xl text-on-surface">Custom Focus Block</h4>
              <p className="text-xs text-outline mt-1">Select duration (5 to 120 min):</p>

              <div className="my-5 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setCustomMins(prev => Math.max(5, prev - 5))}
                  className="w-10 h-10 rounded-full bg-surface-container font-bold text-lg cursor-pointer border-0"
                >
                  -
                </button>
                <span className="text-3xl font-editorial font-bold text-on-surface w-16">
                  {customMins}m
                </span>
                <button
                  type="button"
                  onClick={() => setCustomMins(prev => Math.min(120, prev + 5))}
                  className="w-10 h-10 rounded-full bg-surface-container font-bold text-lg cursor-pointer border-0"
                >
                  +
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCustomModalOpen(false)}
                  className="flex-1 py-2.5 rounded-full bg-surface-container text-xs font-semibold text-outline cursor-pointer border-0"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="flex-1 py-2.5 rounded-full bg-primary-container text-white text-xs font-bold cursor-pointer border-0 shadow-xs"
                >
                  Apply
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Session Completed Modal ── */}
      <AnimatePresence>
        {focusStage === 'completed' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="p-8 rounded-3xl bg-surface-container-lowest max-w-sm w-full text-center hairline shadow-2xl"
            >
              <div className="w-14 h-14 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center mx-auto mb-4 shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="font-editorial text-2xl font-normal text-on-surface">
                {selectedDuration} minutes of presence
              </h3>
              <p className="text-xs text-outline leading-relaxed mt-2">
                You gently concluded your focus block. Your rhythm points and focus presence have been saved to your sanctuary.
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="w-full mt-6 py-3 rounded-full bg-primary-container text-white text-xs font-bold cursor-pointer border-0 shadow-xs active:scale-95"
              >
                Return to Sanctuary
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
