/**
 * Meditative Audio Synthesizer (Web Audio API)
 * Generates singing bowl chimes, lush harmonic pads, 10Hz alpha waves, and pink noise soundscapes.
 */

import { focusTimerState } from '../state.js';

export const MeditativeAudio = (function () {
  let ctx = null;
  let masterGain = null;
  let isPlaying = false;
  let currentVolume = 0.6; // 0 to 1

  // Soundscape nodes
  let padNodes = [];
  let filterNode = null;
  let lfoNode = null;
  let lfoGain = null;
  let noiseSource = null;
  let noiseGain = null;
  let binauralNodes = [];

  // Safe AudioContext Initializer
  function ensureContext() {
    if (!ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      ctx = new AudioCtx();
      masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0, ctx.currentTime);
      masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') {
      ctx.resume().catch(e => console.log('Resume error:', e));
    }
    return ctx;
  }

  // Play Tibetan Singing Bowl Gong / Bell Strike
  function playSingingBowlChime(freq = 432, duration = 3.2, peakVol = 0.18) {
    try {
      const audioCtx = ensureContext();
      const now = audioCtx.currentTime;
      const vol = peakVol * currentVolume;

      const strikeGain = audioCtx.createGain();
      strikeGain.gain.setValueAtTime(0.0001, now);
      strikeGain.gain.linearRampToValueAtTime(vol, now + 0.05);
      strikeGain.gain.linearRampToValueAtTime(0.0001, now + duration);
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
      overtoneGain.gain.setValueAtTime(vol * 0.4, now);
      overtoneGain.gain.linearRampToValueAtTime(0.0001, now + duration * 0.75);
      osc2.connect(overtoneGain);
      overtoneGain.connect(strikeGain);
      osc2.start(now);
      osc2.stop(now + duration);

      // 3. Shimmer Beat Tone (freq + 1.5Hz)
      const osc3 = audioCtx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq + 1.5, now);
      const shimmerGain = audioCtx.createGain();
      shimmerGain.gain.setValueAtTime(vol * 0.3, now);
      shimmerGain.gain.linearRampToValueAtTime(0.0001, now + duration);
      osc3.connect(shimmerGain);
      shimmerGain.connect(strikeGain);
      osc3.start(now);
      osc3.stop(now + duration);

    } catch (e) {
      console.log('Chime triggered:', e);
    }
  }

  // Start continuous, peaceful meditative soundscape
  function startPeacefulSoundscape(fadeDuration = 2.0) {
    try {
      const audioCtx = ensureContext();
      if (isPlaying) return;
      isPlaying = true;

      const now = audioCtx.currentTime;
      const targetGain = 0.26 * currentVolume;

      // Master Gain Ramping
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(targetGain, now + fadeDuration);

      // Layer 1: Resonant Lowpass Filter & Slow Breathing LFO
      filterNode = audioCtx.createBiquadFilter();
      filterNode.type = 'lowpass';
      filterNode.frequency.setValueAtTime(450, now);
      filterNode.Q.setValueAtTime(1.8, now);
      filterNode.connect(masterGain);

      // Slow 18s LFO sweeping filter between 280Hz and 620Hz
      lfoNode = audioCtx.createOscillator();
      lfoNode.type = 'sine';
      lfoNode.frequency.setValueAtTime(0.055, now);

      lfoGain = audioCtx.createGain();
      lfoGain.gain.setValueAtTime(170, now);
      lfoNode.connect(lfoGain);
      lfoGain.connect(filterNode.frequency);
      lfoNode.start(now);

      // Layer 2: Warm Meditative Pad Harmonies (D Minor 9 Harmony)
      const padFreqs = [73.42, 110.00, 174.61, 261.63, 329.63, 440.00];
      padNodes = [];

      padFreqs.forEach((freq, idx) => {
        const oscA = audioCtx.createOscillator();
        const oscB = audioCtx.createOscillator();
        oscA.type = (idx % 2 === 0) ? 'sine' : 'triangle';
        oscB.type = 'sine';

        oscA.frequency.setValueAtTime(freq - 0.5, now);
        oscB.frequency.setValueAtTime(freq + 0.5, now);

        const voiceGain = audioCtx.createGain();
        const voiceVol = (0.28 / padFreqs.length) * (idx === 0 ? 1.4 : 1.0);
        voiceGain.gain.setValueAtTime(voiceVol, now);

        oscA.connect(voiceGain);
        oscB.connect(voiceGain);
        voiceGain.connect(filterNode);

        oscA.start(now);
        oscB.start(now);
        padNodes.push(oscA, oscB, voiceGain);
      });

      // Layer 3: Binaural Alpha-Wave Focus Beat (10Hz Alpha Rhythm)
      const binauralLeft = audioCtx.createOscillator();
      const binauralRight = audioCtx.createOscillator();
      binauralLeft.type = 'sine';
      binauralRight.type = 'sine';
      binauralLeft.frequency.setValueAtTime(216.0, now);
      binauralRight.frequency.setValueAtTime(226.0, now);

      const binGain = audioCtx.createGain();
      binGain.gain.setValueAtTime(0.045, now);

      if (audioCtx.createStereoPanner) {
        const panL = audioCtx.createStereoPanner();
        const panR = audioCtx.createStereoPanner();
        panL.pan.setValueAtTime(-0.85, now);
        panR.pan.setValueAtTime(0.85, now);
        binauralLeft.connect(panL);
        binauralRight.connect(panR);
        panL.connect(binGain);
        panR.connect(binGain);
      } else {
        binauralLeft.connect(binGain);
        binauralRight.connect(binGain);
      }
      binGain.connect(masterGain);
      binauralLeft.start(now);
      binauralRight.start(now);
      binauralNodes.push(binauralLeft, binauralRight, binGain);

      // Layer 4: Soft Forest Breeze / Pink Noise Mist
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.06;
      }

      noiseSource = audioCtx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = audioCtx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(260, now);

      noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.02, now);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);
      noiseSource.start(now);

    } catch (e) {
      console.log('Error starting soundscape:', e);
    }
  }

  // Stop / Fade Out
  function stopPeacefulSoundscape(fadeDuration = 1.2) {
    if (!isPlaying || !ctx) return;
    isPlaying = false;
    try {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);

      setTimeout(() => {
        if (!isPlaying) {
          padNodes.forEach(node => { try { if (node.stop) node.stop(); } catch(e){} });
          padNodes = [];
          binauralNodes.forEach(node => { try { if (node.stop) node.stop(); } catch(e){} });
          binauralNodes = [];
          if (lfoNode) { try { lfoNode.stop(); } catch(e){} lfoNode = null; }
          if (noiseSource) { try { noiseSource.stop(); } catch(e){} noiseSource = null; }
        }
      }, fadeDuration * 1000 + 100);
    } catch (e) {}
  }

  // Set Live Volume
  function setVolume(val) {
    currentVolume = Math.max(0, Math.min(1, parseFloat(val) || 0));
    if (ctx && masterGain && isPlaying) {
      const now = ctx.currentTime;
      masterGain.gain.cancelScheduledValues(now);
      masterGain.gain.linearRampToValueAtTime(0.26 * currentVolume, now + 0.1);
    }
  }

  return {
    ensureContext,
    playSingingBowlChime,
    startPeacefulSoundscape,
    stopPeacefulSoundscape,
    setVolume,
    get isPlaying() { return isPlaying; },
    get currentVolume() { return currentVolume; }
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
    if (focusTimerState.soundscapeActive) MeditativeAudio.startPeacefulSoundscape(1.5);
    else MeditativeAudio.stopPeacefulSoundscape(1.0);
  } else {
    if (focusTimerState.soundscapeActive) {
      MeditativeAudio.startPeacefulSoundscape(1.0);
      if (typeof window.showToast === 'function') {
        window.showToast('Soundscape active · will play during focus');
      }
    } else {
      MeditativeAudio.stopPeacefulSoundscape(0.8);
      if (typeof window.showToast === 'function') {
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
