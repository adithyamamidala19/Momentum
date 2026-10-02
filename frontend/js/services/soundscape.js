/**
 * Meditative Audio Service & Synthesizer
 * ─────────────────────────────────────────────────────────────────────────────
 * Dual-Engine Architecture:
 * 1. Primary: High-fidelity audio playback of authentic studio soundscapes:
 *    - 'forest': Forest Rain (/assets/audio/forest-rain.wav & .mp3)
 *    - 'ocean': Ocean Waves (/assets/audio/ocean-waves.wav & .mp3)
 *    - 'alpha': Binaural Alpha Music (/assets/audio/binaural-alpha.wav & .mp3)
 *    - 'relief': Peaceful Stress Relief (/assets/audio/peaceful-stress-relief.wav & .mp3)
 *    Features immediate pause/stop without orphaned background playback or delay.
 *
 * 2. Secondary: Procedural Web Audio API synthesizer fallback and Tibetan singing bowl chimes:
 *    - 432Hz mathematical resonance & Solfeggio frequencies (396Hz, 432Hz, 528Hz)
 *    - 10Hz binaural alpha brainwave entrainment
 *    - Procedural rain, waves, and stress relief harmonics
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { focusTimerState } from '../state.js';

export const AUDIO_SOURCES = {
  forest: [
    '/assets/audio/forest-rain.mp3',
    '/assets/audio/forest-rain.wav'
  ],
  ocean: [
    '/assets/audio/ocean-waves.mp3',
    '/assets/audio/ocean-waves.wav'
  ],
  alpha: [
    '/assets/audio/binaural-alpha.mp3',
    '/assets/audio/binaural-alpha.wav'
  ],
  binaural: [
    '/assets/audio/binaural-alpha.mp3',
    '/assets/audio/binaural-alpha.wav'
  ],
  relief: [
    '/assets/audio/peaceful-stress-relief.mp3',
    '/assets/audio/peaceful-stress-relief.wav'
  ],
  peaceful: [
    '/assets/audio/peaceful-stress-relief.mp3',
    '/assets/audio/peaceful-stress-relief.wav'
  ],
  'stress-relief': [
    '/assets/audio/peaceful-stress-relief.mp3',
    '/assets/audio/peaceful-stress-relief.wav'
  ]
};

export const MeditativeAudio = (function () {
  let ctx = null;
  let masterGain = null;
  let isPlaying = false;
  let currentVolume = 0.5; // 0 to 1
  let currentPreset = 'forest';

  // Single persistent HTML5 Audio Element to guarantee complete control
  let sharedAudio = null;

  // Soundscape active Web Audio nodes for procedural synthesizer
  let activeNodes = [];
  let noiseSource = null;
  let lfoNode = null;
  let waveLfo = null;

  function getAudioElement() {
    if (typeof window === 'undefined' || typeof window.Audio === 'undefined') return null;
    if (!sharedAudio) {
      sharedAudio = new Audio();
      sharedAudio.loop = true;
      sharedAudio.preload = 'auto';
    }
    return sharedAudio;
  }

  // Safe AudioContext Initializer with user-gesture resume
  function ensureContext() {
    try {
      if (typeof window === 'undefined') return null;

      if (!ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
          return null;
        }
        ctx = new AudioCtx();
        masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
        masterGain.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
    } catch (e) {
      console.warn('[MeditativeAudio] Context init note:', e);
    }
    return ctx;
  }

  // Play Tibetan Singing Bowl Gong / Bell Strike (432Hz default harmonic)
  function playSingingBowlChime(freq = 432, duration = 3.2, peakVol = 0.22) {
    try {
      const audioCtx = ensureContext();
      if (!audioCtx) return;
      const now = audioCtx.currentTime;
      const vol = Math.max(0.01, peakVol * Math.max(0.2, currentVolume));

      const strikeGain = audioCtx.createGain();
      strikeGain.gain.setValueAtTime(0.0001, now);
      strikeGain.gain.linearRampToValueAtTime(vol, now + 0.04);
      strikeGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      strikeGain.connect(audioCtx.destination);

      // 1. Fundamental Pitch Pure Sine
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);
      osc1.connect(strikeGain);
      osc1.start(now);
      osc1.stop(now + duration);

      // 2. Harmonic Overtone (2.76x)
      const osc2 = audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.76, now);
      const overtoneGain = audioCtx.createGain();
      overtoneGain.gain.setValueAtTime(vol * 0.45, now);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.75);
      osc2.connect(overtoneGain);
      overtoneGain.connect(strikeGain);
      osc2.start(now);
      osc2.stop(now + duration);

      // 3. Shimmer Beat Tone (freq + 1.5Hz)
      const osc3 = audioCtx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq + 1.5, now);
      const shimmerGain = audioCtx.createGain();
      shimmerGain.gain.setValueAtTime(vol * 0.35, now);
      shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc3.connect(shimmerGain);
      shimmerGain.connect(strikeGain);
      osc3.start(now);
      osc3.stop(now + duration);
    } catch (e) {
      console.log('[MeditativeAudio] Chime note:', e);
    }
  }

  // Create a continuous pink noise buffer for ambient textures
  function createPinkNoiseBuffer(audioCtx, seconds = 3) {
    const bufferSize = audioCtx.sampleRate * seconds;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      data[i] = (b0 + b1 + b2) * 0.18;
    }
    return buffer;
  }

  // Teardown active Web Audio nodes cleanly and immediately
  function teardownActiveNodes() {
    activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    activeNodes = [];

    if (lfoNode) {
      try { lfoNode.stop(); lfoNode.disconnect(); } catch (e) {}
      lfoNode = null;
    }
    if (waveLfo) {
      try { waveLfo.stop(); waveLfo.disconnect(); } catch (e) {}
      waveLfo = null;
    }
    if (noiseSource) {
      try { noiseSource.stop(); noiseSource.disconnect(); } catch (e) {}
      noiseSource = null;
    }
  }

  // Build Forest Rain procedural synth (Rain + D Minor 9 Harmony Pad)
  function buildForestPreset(audioCtx, now) {
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);
    filter.Q.setValueAtTime(1.5, now);
    filter.connect(masterGain);
    activeNodes.push(filter);

    lfoNode = audioCtx.createOscillator();
    lfoNode.type = 'sine';
    lfoNode.frequency.setValueAtTime(0.08, now);
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(180, now);
    lfoNode.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfoNode.start(now);
    activeNodes.push(lfoNode, lfoGain);

    const padFreqs = [73.42, 110.00, 146.83, 220.00, 261.63, 329.63];
    padFreqs.forEach((freq, idx) => {
      const oscA = audioCtx.createOscillator();
      const oscB = audioCtx.createOscillator();
      oscA.type = idx % 2 === 0 ? 'sine' : 'triangle';
      oscB.type = 'sine';
      oscA.frequency.setValueAtTime(freq - 0.4, now);
      oscB.frequency.setValueAtTime(freq + 0.4, now);

      const voiceGain = audioCtx.createGain();
      const voiceVol = (0.35 / padFreqs.length) * (idx === 0 ? 1.3 : 1.0);
      voiceGain.gain.setValueAtTime(voiceVol, now);

      oscA.connect(voiceGain);
      oscB.connect(voiceGain);
      voiceGain.connect(filter);

      oscA.start(now);
      oscB.start(now);
      activeNodes.push(oscA, oscB, voiceGain);
    });

    const noiseBuf = createPinkNoiseBuffer(audioCtx, 4);
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuf;
    noiseSource.loop = true;

    const noiseFilter = audioCtx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, now);
    noiseFilter.Q.setValueAtTime(0.8, now);

    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);

    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseSource.start(now);
    activeNodes.push(noiseFilter, noiseGain);
  }

  // Build Ocean Waves procedural synth (8-second natural tides + deep swell drone)
  function buildOceanPreset(audioCtx, now) {
    const noiseBuf = createPinkNoiseBuffer(audioCtx, 4);
    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = noiseBuf;
    noiseSource.loop = true;

    const oceanFilter = audioCtx.createBiquadFilter();
    oceanFilter.type = 'lowpass';
    oceanFilter.frequency.setValueAtTime(450, now);
    oceanFilter.Q.setValueAtTime(2.0, now);

    waveLfo = audioCtx.createOscillator();
    waveLfo.type = 'sine';
    waveLfo.frequency.setValueAtTime(0.125, now);

    const waveFilterGain = audioCtx.createGain();
    waveFilterGain.gain.setValueAtTime(320, now);
    waveLfo.connect(waveFilterGain);
    waveFilterGain.connect(oceanFilter.frequency);

    const oceanVolGain = audioCtx.createGain();
    oceanVolGain.gain.setValueAtTime(0.12, now);

    const waveAmpGain = audioCtx.createGain();
    waveAmpGain.gain.setValueAtTime(0.06, now);
    waveLfo.connect(waveAmpGain);
    waveAmpGain.connect(oceanVolGain.gain);

    noiseSource.connect(oceanFilter);
    oceanFilter.connect(oceanVolGain);
    oceanVolGain.connect(masterGain);

    waveLfo.start(now);
    noiseSource.start(now);
    activeNodes.push(oceanFilter, waveFilterGain, oceanVolGain, waveAmpGain);

    [55, 110].forEach(f => {
      const drone = audioCtx.createOscillator();
      drone.type = 'sine';
      drone.frequency.setValueAtTime(f, now);
      const droneGain = audioCtx.createGain();
      droneGain.gain.setValueAtTime(0.06, now);
      drone.connect(droneGain);
      droneGain.connect(masterGain);
      drone.start(now);
      activeNodes.push(drone, droneGain);
    });
  }

  // Build Binaural Alpha procedural synth (10Hz beat + 432Hz Solfeggio carrier)
  function buildAlphaPreset(audioCtx, now) {
    const binLeft = audioCtx.createOscillator();
    const binRight = audioCtx.createOscillator();
    binLeft.type = 'sine';
    binRight.type = 'sine';
    binLeft.frequency.setValueAtTime(216.0, now);
    binRight.frequency.setValueAtTime(226.0, now);

    const binGain = audioCtx.createGain();
    binGain.gain.setValueAtTime(0.14, now);

    if (audioCtx.createStereoPanner) {
      const panL = audioCtx.createStereoPanner();
      const panR = audioCtx.createStereoPanner();
      panL.pan.setValueAtTime(-0.85, now);
      panR.pan.setValueAtTime(0.85, now);
      binLeft.connect(panL);
      binRight.connect(panR);
      panL.connect(binGain);
      panR.connect(binGain);
      activeNodes.push(panL, panR);
    } else {
      binLeft.connect(binGain);
      binRight.connect(binGain);
    }

    binGain.connect(masterGain);
    binLeft.start(now);
    binRight.start(now);
    activeNodes.push(binLeft, binRight, binGain);

    [108, 216, 324, 432, 540].forEach(freq => {
      const osc = audioCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.045, now);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      activeNodes.push(osc, gain);
    });
  }

  // Build Peaceful Stress Relief procedural synth (528Hz Solfeggio + Calming Ambient Chords)
  function buildReliefPreset(audioCtx, now) {
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(750, now);
    filter.Q.setValueAtTime(1.2, now);
    filter.connect(masterGain);
    activeNodes.push(filter);

    lfoNode = audioCtx.createOscillator();
    lfoNode.type = 'sine';
    lfoNode.frequency.setValueAtTime(0.1, now);
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(250, now);
    lfoNode.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    lfoNode.start(now);
    activeNodes.push(lfoNode, lfoGain);

    const solfeggioOsc = audioCtx.createOscillator();
    solfeggioOsc.type = 'sine';
    solfeggioOsc.frequency.setValueAtTime(528, now);
    const solfeggioGain = audioCtx.createGain();
    solfeggioGain.gain.setValueAtTime(0.08, now);
    solfeggioOsc.connect(solfeggioGain);
    solfeggioGain.connect(filter);
    solfeggioOsc.start(now);
    activeNodes.push(solfeggioOsc, solfeggioGain);

    const chordFreqs = [87.31, 174.61, 220.00, 261.63, 329.63, 392.00];
    chordFreqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      const gain = audioCtx.createGain();
      const vol = (0.36 / chordFreqs.length) * (idx === 0 ? 1.4 : 1.0);
      gain.gain.setValueAtTime(vol, now);
      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);
      activeNodes.push(osc, gain);
    });
  }

  // Start procedural Web Audio synthesis
  function startProceduralSynthesis(audioCtx, preset, fadeDuration = 0.5) {
    teardownActiveNodes();
    const now = audioCtx.currentTime;
    const targetGain = 0.45 * currentVolume;

    masterGain.gain.cancelScheduledValues(now);
    masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), now);
    masterGain.gain.linearRampToValueAtTime(targetGain, now + fadeDuration);

    const norm = (preset || currentPreset || 'forest').toLowerCase();
    if (norm === 'ocean') {
      buildOceanPreset(audioCtx, now);
    } else if (norm === 'alpha' || norm === 'binaural') {
      buildAlphaPreset(audioCtx, now);
    } else if (norm === 'relief' || norm === 'peaceful' || norm === 'stress-relief') {
      buildReliefPreset(audioCtx, now);
    } else {
      buildForestPreset(audioCtx, now);
    }
  }

  // Start continuous meditative soundscape with chosen preset
  function startPeacefulSoundscape(fadeDuration = 0.5, preset = 'forest') {
    try {
      const key = (preset || currentPreset || 'forest').toLowerCase();
      currentPreset = key;
      isPlaying = true;

      // 1. Ensure Web Audio Context is active for chimes
      const audioCtx = ensureContext();

      // 2. Play verified studio audio file via shared HTML5 Audio element
      const audio = getAudioElement();
      if (audio) {
        const sources = AUDIO_SOURCES[key] || AUDIO_SOURCES.forest;
        const targetSrc = sources[0];

        // If audio is already playing a different file, smoothly switch
        const isCurrentSrc = audio.src && (audio.src.includes(targetSrc) || audio.src.includes(sources[1]));
        if (!isCurrentSrc) {
          audio.pause();
          audio.currentTime = 0;
          audio.src = targetSrc;
        }

        audio.volume = Math.max(0, Math.min(1, currentVolume));

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(err => {
            if (!isPlaying) return; // If stopped in the meantime, do nothing
            // Autoplay blocked, try fallback secondary source
            if (sources[1] && !audio.src.includes(sources[1])) {
              audio.src = sources[1];
              audio.play().catch(() => {
                if (audioCtx && isPlaying) startProceduralSynthesis(audioCtx, key, fadeDuration);
              });
            } else if (audioCtx && isPlaying) {
              startProceduralSynthesis(audioCtx, key, fadeDuration);
            }
          });
        }
        return;
      }

      // Fallback: If Audio element not available (e.g. headless), run Web Audio synthesis
      if (audioCtx) {
        startProceduralSynthesis(audioCtx, key, fadeDuration);
      }
    } catch (e) {
      console.warn('[MeditativeAudio] Start soundscape error:', e);
    }
  }

  // Stop immediately: GUARANTEES 100% silence
  function stopPeacefulSoundscape() {
    isPlaying = false;

    // 1. Immediately pause and reset the shared audio element
    if (sharedAudio) {
      try {
        sharedAudio.pause();
        sharedAudio.currentTime = 0;
        // Never clear src to empty string because that emits an error event in HTML5 media!
      } catch (e) {
        console.warn('[MeditativeAudio] Audio pause error:', e);
      }
    }

    // 2. Immediately stop all procedural Web Audio nodes
    teardownActiveNodes();

    // 3. Immediately mute master gain
    if (ctx && masterGain) {
      try {
        const now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(0.0001, now);
      } catch (e) {}
    }
  }

  // Switch preset on the fly
  function setPreset(preset) {
    const key = (preset || 'forest').toLowerCase();
    currentPreset = key;
    if (isPlaying) {
      startPeacefulSoundscape(0.4, key);
    }
  }

  // Set Live Master Volume (0.0 to 1.0)
  function setVolume(val) {
    currentVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    if (sharedAudio) {
      sharedAudio.volume = currentVolume;
    }
    if (ctx && masterGain && isPlaying) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(0.45 * currentVolume, now);
    }
  }

  return {
    ensureContext,
    playSingingBowlChime,
    playChime: playSingingBowlChime,
    startPeacefulSoundscape,
    startTone: (preset) => startPeacefulSoundscape(0.4, preset || currentPreset),
    stopPeacefulSoundscape,
    stopTone: () => stopPeacefulSoundscape(),
    setPreset,
    setVolume,
    get isPlaying() { return isPlaying; },
    get currentVolume() { return currentVolume; },
    get currentPreset() { return currentPreset; }
  };
})();

export function syncSoundscapeUI() {
  const btn = document.getElementById('soundscape-toggle-btn');
  const slider = document.getElementById('soundscape-vol-slider');
  const volText = document.getElementById('soundscape-vol-text');

  if (btn) {
    btn.innerHTML = focusTimerState.soundscapeActive 
      ? '<span class="material-symbols-outlined text-[14px]">volume_up</span> <span>On</span>'
      : '<span class="material-symbols-outlined text-[14px]">volume_off</span> <span>Off</span>';
    btn.className = focusTimerState.soundscapeActive 
      ? 'px-3.5 py-1 rounded-full bg-primary text-xs font-semibold text-on-primary transition-all shadow-xs cursor-pointer border-0 flex items-center gap-1'
      : 'px-3.5 py-1 rounded-full bg-surface-container text-xs font-medium text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer border-0 flex items-center gap-1';
  }

  if (slider) {
    slider.value = MeditativeAudio.currentVolume;
  }
  if (volText) {
    volText.textContent = `${Math.round(MeditativeAudio.currentVolume * 100)}%`;
  }
}

export function setSoundscapeVolume(val) {
  MeditativeAudio.setVolume(val);
  const volText = document.getElementById('soundscape-vol-text');
  if (volText) {
    volText.textContent = `${Math.round(val * 100)}%`;
  }
}

export function toggleAmbientSoundscape() {
  MeditativeAudio.ensureContext();

  focusTimerState.soundscapeActive = !focusTimerState.soundscapeActive;
  syncSoundscapeUI();

  if (focusTimerState.isRunning || focusTimerState.introInProgress) {
    if (focusTimerState.soundscapeActive) MeditativeAudio.startPeacefulSoundscape(0.4);
    else MeditativeAudio.stopPeacefulSoundscape();
  } else {
    if (focusTimerState.soundscapeActive) {
      MeditativeAudio.startPeacefulSoundscape(0.4);
      if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast('Soundscape active · will play during focus');
      }
    } else {
      MeditativeAudio.stopPeacefulSoundscape();
      if (typeof window !== 'undefined' && typeof window.showToast === 'function') {
        window.showToast('Soundscape muted');
      }
    }
  }
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.MeditativeAudio = MeditativeAudio;
  window.syncSoundscapeUI = syncSoundscapeUI;
  window.setSoundscapeVolume = setSoundscapeVolume;
  window.toggleAmbientSoundscape = toggleAmbientSoundscape;
}
