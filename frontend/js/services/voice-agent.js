/**
 * Aria — Interactive AI Voice Agent Engine & Audio Reactive Visualizer
 * ───────────────────────────────────────────────────────────────────────
 * • Real-Time Web Audio API Volume & Dynamic Sine Oscillation Wave Visualizer
 * • Focused Voice Mode with Background Blur and Minimal UI Transition
 * • Scale and Aura Pulsing on Center Microphone Orb
 * • Multi-Turn Slot Filling & Conversational Loop State Machine (Chrono NLP)
 * • 10-Second Undo Buffer with Full State Restoration (Habits, Todos, Water, Logs)
 * • Web Speech Synthesis TTS with Female Voice Cadence & Auto-Listen Continuation
 * • Unified Floating Action Button (FAB) & Center Mic Control
 */

import { userState } from '../state.js';
import { STORAGE_KEYS, saveStateToStorage } from '../storage.js';
import { ConversationStateMachine } from './conversation-state-machine.js';

// ── Agent Personality ────────────────────────────────────────────────────
const ARIA = {
  name: 'Aria',
  wakeWords: ['hey aria', 'hi aria', 'okay aria', 'ok aria'],
  greeting: "Hey! I'm Aria. How can I help you today?",
  idle:      'Tap the microphone to begin listening...',
  listening: 'Listening... Speak naturally',
  thinking:  'Processing your voice request...',
  speaking:  'Speaking response...',
  unrecognized: "I heard you, but I wasn't sure what to do. Try: \"What's left today?\", \"Create a to-do list for today\", or \"Start focus session\".",
  undone:    'Done — your previous state has been restored.',
};

// ── Orb State Machine ────────────────────────────────────────────────────
const ORB_STATES = {
  idle:      'idle',
  listening: 'listening',
  thinking:  'thinking',
  speaking:  'speaking',
};

// ── Web Audio API Real-Time Voice Oscillation Visualizer ─────────────────
class AudioReactiveEngine {
  constructor(onVolumeChange) {
    this.onVolumeChange = onVolumeChange;
    this.audioCtx = null;
    this.analyser = null;
    this.stream = null;
    this.source = null;
    this.dataArray = null;
    this.animId = null;
    this.smoothedVolume = 0;
    this.canvas = null;
    this.ctx = null;
    this.phase = 0;
    this.isActive = false;
  }

  async start(canvasEl) {
    this.canvas = canvasEl || document.getElementById('voice-oscillation-canvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = (rect.width || 320) * dpr;
      this.canvas.height = (rect.height || 320) * dpr;
    }

    this.isActive = true;

    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) this.audioCtx = new AudioContextClass();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (this.audioCtx) {
          this.source = this.audioCtx.createMediaStreamSource(this.stream);
          this.analyser = this.audioCtx.createAnalyser();
          this.analyser.fftSize = 128;
          this.analyser.smoothingTimeConstant = 0.8;
          this.source.connect(this.analyser);

          const bufferLength = this.analyser.frequencyBinCount;
          this.dataArray = new Uint8Array(bufferLength);
        }
      }

      this._loop();
      return true;
    } catch (e) {
      console.warn('[Aria] AudioContext init or mic permission notice:', e);
      // Fallback smooth harmonic wave loop if live mic analyser is restricted
      this._simulatedLoop();
      return false;
    }
  }

  _loop() {
    if (!this.isActive) return;
    this.animId = requestAnimationFrame(() => this._loop());

    let rawVol = 0;
    if (this.analyser && this.dataArray) {
      this.analyser.getByteFrequencyData(this.dataArray);
      let sum = 0;
      for (let i = 0; i < this.dataArray.length; i++) {
        sum += this.dataArray[i];
      }
      rawVol = (sum / this.dataArray.length) / 160; // normalized 0..1
      rawVol = Math.min(1.0, rawVol * 1.5);
    } else {
      rawVol = 0.15;
    }

    // Smooth Lerp Damping: gradual expansion and smooth settle
    this.smoothedVolume = this.smoothedVolume * 0.72 + rawVol * 0.28;

    if (this.onVolumeChange) {
      this.onVolumeChange(this.smoothedVolume);
    }

    this._drawWaves(this.smoothedVolume);
  }

  _simulatedLoop() {
    if (!this.isActive) return;
    this.animId = requestAnimationFrame(() => this._simulatedLoop());
    this.phase += 0.05;
    const simVol = Math.max(0.04, Math.sin(this.phase * 1.8) * 0.2 + 0.12);
    this.smoothedVolume = this.smoothedVolume * 0.8 + simVol * 0.2;

    if (this.onVolumeChange) {
      this.onVolumeChange(this.smoothedVolume);
    }
    this._drawWaves(this.smoothedVolume);
  }

  _drawWaves(vol) {
    if (!this.ctx || !this.canvas) return;
    const { width, height } = this.canvas;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, width, height);

    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = width * 0.24;
    this.phase += 0.025 + vol * 0.06;

    // Harmonic wave rings with dynamic amplitude reacting to voice volume
    const layers = [
      { color: 'rgba(0, 212, 255, 0.55)', waves: 5, amp: 12 + vol * 26, speed: 1.0,  width: 2.5 },
      { color: 'rgba(15, 110, 86, 0.5)',   waves: 4, amp: 16 + vol * 32, speed: -0.7, width: 2.0 },
      { color: 'rgba(139, 92, 246, 0.4)',  waves: 6, amp: 10 + vol * 22, speed: 1.2,  width: 1.8 }
    ];

    layers.forEach(layer => {
      ctx.beginPath();
      const points = 120;
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const wave = Math.sin(angle * layer.waves + this.phase * layer.speed) * layer.amp;
        const r = baseRadius + wave;
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = layer.color;
      ctx.lineWidth = layer.width * (window.devicePixelRatio || 1);
      ctx.stroke();
    });
  }

  stop() {
    this.isActive = false;
    if (this.animId) cancelAnimationFrame(this.animId);
    if (this.stream) {
      try {
        this.stream.getTracks().forEach(track => track.stop());
      } catch (e) {}
      this.stream = null;
    }
    if (this.ctx && this.canvas) {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.smoothedVolume = 0;
    if (this.onVolumeChange) this.onVolumeChange(0);
  }
}

// ── Wake-Word Detector ("Hey Aria") ──────────────────────────────────────
class WakeWordDetector {
  constructor(onWakeWord) {
    this.onWakeWord = onWakeWord;
    this.recognition = null;
    this.active = false;
    this._restartTimer = null;
    this._init();
  }

  _init() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (evt) => {
        for (let i = evt.resultIndex; i < evt.results.length; i++) {
          const raw = evt.results[i][0].transcript.toLowerCase().trim();
          if (ARIA.wakeWords.some(w => raw.includes(w))) {
            this.recognition.abort();
            this.onWakeWord();
            return;
          }
        }
      };

      this.recognition.onend = () => {
        if (this.active) {
          clearTimeout(this._restartTimer);
          this._restartTimer = setTimeout(() => {
            try { this.recognition.start(); } catch (e) {}
          }, 1000);
        }
      };

      this.recognition.onerror = (evt) => {
        if (evt.error === 'not-allowed' || evt.error === 'service-not-allowed') {
          this.active = false;
        }
      };
    } catch (e) {}
  }

  start() {
    if (!this.recognition || this.active) return;
    this.active = true;
    try { this.recognition.start(); } catch (e) {}
  }

  stop() {
    this.active = false;
    clearTimeout(this._restartTimer);
    if (this.recognition) {
      try { this.recognition.abort(); } catch (e) {}
    }
  }
}

// ── Dedicated Command Recognizer ─────────────────────────────────────────
class CommandRecognizer {
  constructor(onInterim, onFinal, onError) {
    this.onInterim = onInterim;
    this.onFinal   = onFinal;
    this.onError   = onError;
    this.recognition = null;
    this.isRunning   = false;
    this._init();
  }

  _init() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous   = false;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => { this.isRunning = true; };

      this.recognition.onresult = (evt) => {
        let interim = '', final = '';
        for (let i = evt.resultIndex; i < evt.results.length; i++) {
          if (evt.results[i].isFinal) { final   += evt.results[i][0].transcript; }
          else                         { interim += evt.results[i][0].transcript; }
        }
        if (interim) this.onInterim(interim);
        if (final)   this.onFinal(final.trim());
      };

      this.recognition.onerror = (evt) => {
        this.isRunning = false;
        if (evt.error !== 'no-speech') this.onError(evt.error);
      };

      this.recognition.onend = () => { this.isRunning = false; };
    } catch (e) {
      console.warn('[Aria] Command recognizer init notice:', e);
    }
  }

  start() {
    if (!this.recognition) return false;
    try {
      if (this.isRunning) { this.recognition.abort(); }
      setTimeout(() => {
        try { this.recognition.start(); } catch (e) {}
      }, 60);
      return true;
    } catch (e) { return false; }
  }

  stop() {
    if (this.recognition && this.isRunning) {
      try { this.recognition.abort(); } catch (e) {}
    }
    this.isRunning = false;
  }
}

// ── Web Speech Synthesis TTS ─────────────────────────────────────────────
class TTSSpeaker {
  constructor() {
    this.muted = localStorage.getItem(STORAGE_KEYS.VOICE_MUTED) === 'true';
  }

  speak(text, onStart, onEnd) {
    if (this.muted || !window.speechSynthesis) {
      if (onEnd) onEnd();
      return;
    }
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate  = 0.95;
    utt.pitch = 1.05;
    utt.lang  = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v =>
      (v.name.includes('Samantha') || v.name.includes('Natural') ||
       v.name.includes('Google UK English Female') || v.name.includes('Google US English') ||
       v.name.toLowerCase().includes('female')) && v.lang.startsWith('en')
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferredVoice) utt.voice = preferredVoice;

    utt.onstart = () => { if (onStart) onStart(); };
    utt.onend   = () => { if (onEnd)   onEnd(); };
    utt.onerror = () => { if (onEnd)   onEnd(); };
    window.speechSynthesis.speak(utt);
  }

  cancel() {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem(STORAGE_KEYS.VOICE_MUTED, this.muted ? 'true' : 'false');
    if (this.muted) this.cancel();
    return this.muted;
  }
}

// ── Main Voice Agent Engine ──────────────────────────────────────────────
export class VoiceAgentEngine {
  constructor() {
    this.orbState     = ORB_STATES.idle;
    this.undoSnapshot = null;
    this.undoTimeout  = null;
    this.undoInterval = null;

    this.speaker   = new TTSSpeaker();
    this.commander = new CommandRecognizer(
      (interim) => this._onInterim(interim),
      (final)   => this._onFinal(final),
      (err)     => this._onRecogError(err)
    );

    this.audioEngine = new AudioReactiveEngine((volume) => {
      this._onVolumeUpdate(volume);
    });

    this.wakeDetector = new WakeWordDetector(() => {
      this.activateVoiceFromAnywhere();
    });

    // Conversational State Machine with multi-turn slot filling & loop lists
    this.stateMachine = new ConversationStateMachine({
      onSpeak: (text, onEnd) => {
        this._respond(text, onEnd);
      },
      onPromptListen: () => {
        // Continuous conversation: automatically resume listening after asking questions
        setTimeout(() => {
          this.startListening();
        }, 220);
      },
      onUndoTrigger: (message, snapshot) => {
        this._triggerUndoToast(message, snapshot);
      }
    });

    setTimeout(() => this.wakeDetector.start(), 1500);
  }

  // ── Unified Entry Point from FAB or Navigation ────────────────────────
  handleFabClick() {
    if (typeof window.getCurrentView === 'function' && window.getCurrentView() !== 'voice') {
      if (typeof window.navigate === 'function') window.navigate('voice');
      setTimeout(() => this.startListening(), 280);
    } else {
      this.toggleMic();
    }
  }

  activateVoiceFromAnywhere() {
    if (typeof window.getCurrentView === 'function' && window.getCurrentView() !== 'voice') {
      if (typeof window.navigate === 'function') window.navigate('voice');
    }
    setTimeout(() => this.startListening(), 300);
  }

  closeVoiceMode() {
    this.stopListening();
    this.speaker.cancel();
    this.stateMachine.reset();
    document.body.classList.remove('voice-mode-active');
    if (typeof window.navigate === 'function') {
      window.navigate('today');
    }
  }

  // ── Voice Listening Controls ──────────────────────────────────────────
  startListening() {
    this.speaker.cancel();

    // 1. Activate Focus Mode & Background Blur
    document.body.classList.add('voice-mode-active');
    const voiceView = document.getElementById('view-voice');
    if (voiceView) voiceView.classList.add('voice-focused-mode');

    // 2. Set Listening State
    this._setOrbState(ORB_STATES.listening);
    this._setStatus(ARIA.listening, 'listening');
    this._setModeBadge('Listening', 'listening');

    // 3. Start Audio Reactive Engine
    const canvas = document.getElementById('voice-oscillation-canvas');
    this.audioEngine.start(canvas);

    // 4. Start Speech Recognition
    const started = this.commander.start();
    if (!started) {
      this._setTranscript('Listening for your voice... (You can also type below)');
    }

    // Stop wake detector while actively in voice mode
    this.wakeDetector.stop();
  }

  stopListening() {
    this.commander.stop();
    this.audioEngine.stop();
    this._setOrbState(ORB_STATES.idle);
    this._setStatus(ARIA.idle, '');
    this._setModeBadge('Ready', '');
    this._setWaveformActive(false);

    // Settle background blur if no response in flight
    setTimeout(() => {
      if (this.orbState === ORB_STATES.idle) {
        document.body.classList.remove('voice-mode-active');
      }
    }, 400);

    // Restart wake detector after settling
    setTimeout(() => this.wakeDetector.start(), 800);
  }

  toggleMic() {
    if (this.commander.isRunning || this.orbState === ORB_STATES.listening) {
      this.stopListening();
    } else {
      this.startListening();
    }
  }

  // ── Volume & Frequency Damping Callback ───────────────────────────────
  _onVolumeUpdate(volume) {
    const orb = document.getElementById('screen-orb-container');
    if (orb) {
      orb.style.setProperty('--voice-volume', volume.toFixed(3));
      if (this.orbState === ORB_STATES.listening) {
        const scale = (1.16 + volume * 0.22).toFixed(3);
        orb.style.setProperty('--voice-scale', scale);
      } else {
        orb.style.setProperty('--voice-scale', '1');
      }
    }

    const vbars = document.querySelectorAll('.voice-waveform-bars .vbar');
    if (vbars && vbars.length > 0) {
      vbars.forEach((bar, idx) => {
        const factor = [0.6, 1.2, 1.6, 1.3, 0.9, 1.4, 0.7][idx % 7] || 1;
        const h = Math.max(6, Math.min(36, 6 + volume * 42 * factor));
        bar.style.height = `${h}px`;
      });
    }
  }

  // ── Recognition Callbacks ─────────────────────────────────────────────
  _onInterim(text) {
    this._setTranscript(`"${text}"`, false);
  }

  _onFinal(text) {
    this._setTranscript(`"${text}"`, true);
    this._processCommand(text);
  }

  _onRecogError(errCode) {
    this._setOrbState(ORB_STATES.idle);
    this._setStatus(ARIA.idle, '');
    this._setModeBadge('Ready', '');
    if (errCode !== 'no-speech') {
      this._setTranscript(`Notice: ${errCode}. You can also type commands below.`);
    }
  }

  // ── Text Input Submission ─────────────────────────────────────────────
  handleTextSubmit(e) {
    if (e) e.preventDefault();
    const inp1 = document.getElementById('screen-text-input');
    const inp2 = document.getElementById('aria-text-input');
    const text = (inp1 && inp1.value ? inp1.value : (inp2 && inp2.value ? inp2.value : '')).trim();
    if (!text) return;
    if (inp1) inp1.value = '';
    if (inp2) inp2.value = '';
    this._setTranscript(`"${text}"`, true);
    this._processCommand(text);
  }

  runCommandText(text) {
    this._setTranscript(`"${text}"`, true);
    this._processCommand(text);
  }

  // ── Intent Execution via Conversation State Machine ───────────────────
  async _processCommand(rawText) {
    this._setOrbState(ORB_STATES.thinking);
    this._setStatus(ARIA.thinking, 'thinking');
    this._setModeBadge('Processing', 'thinking');
    this._setWaveformActive(false);

    await this.stateMachine.processUtterance(rawText);
  }

  _respond(text, onComplete) {
    this._setOrbState(ORB_STATES.speaking);
    this._setStatus(ARIA.speaking, 'speaking');
    this._setModeBadge('Speaking', 'speaking');
    this._setWaveformActive(true);
    this._setTranscriptResponse(text);

    this.speaker.speak(
      text,
      () => {
        this._setWaveformActive(true);
      },
      () => {
        this._setWaveformActive(false);
        if (onComplete) {
          onComplete();
        } else {
          this._setOrbState(ORB_STATES.idle);
          this._setStatus(ARIA.idle, '');
          this._setModeBadge('Ready', '');
        }
      }
    );
  }

  // ── UI Mutators & Helpers ─────────────────────────────────────────────
  _setOrbState(state) {
    this.orbState = state;
    const orb = document.getElementById('screen-orb-container');
    if (orb) {
      orb.classList.remove('idle', 'listening', 'thinking', 'speaking');
      orb.classList.add(state);
    }
  }

  _setStatus(text, stateClass) {
    const el = document.getElementById('screen-voice-status');
    if (el) {
      el.textContent = text;
      el.className = 'voice-mode-status';
      if (stateClass) el.classList.add(stateClass);
    }
  }

  _setModeBadge(text, stateClass) {
    const badge = document.getElementById('voice-status-badge');
    const badgeText = document.getElementById('voice-status-badge-text');
    if (badgeText) badgeText.textContent = text;
    if (badge) {
      badge.classList.remove('listening', 'thinking', 'speaking');
      if (stateClass) badge.classList.add(stateClass);
    }
  }

  _setWaveformActive(active) {
    const wf = document.getElementById('screen-voice-waveform');
    if (wf) wf.classList.toggle('active', active);
  }

  _setTranscript(text, isFinal = false) {
    const el = document.getElementById('screen-transcript-text');
    const card = document.getElementById('voice-transcript-card');
    if (el) el.textContent = text;
    if (card) {
      card.classList.remove('listening-glow', 'speaking-glow');
      if (!isFinal) card.classList.add('listening-glow');
    }
  }

  _setTranscriptResponse(text) {
    const el = document.getElementById('screen-transcript-text');
    const card = document.getElementById('voice-transcript-card');
    if (el) {
      el.innerHTML = `<span class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#00d4ff]/20 text-[#0088cc] uppercase tracking-wider mr-2 mb-1">Aria</span>${text}`;
    }
    if (card) {
      card.classList.remove('listening-glow');
      card.classList.add('speaking-glow');
    }
  }

  toggleMute() {
    const muted = this.speaker.toggleMute();
    const btn = document.getElementById('voice-mute-btn');
    if (btn) {
      const icon = btn.querySelector('.material-symbols-outlined');
      if (icon) icon.textContent = muted ? 'volume_off' : 'volume_up';
      btn.classList.toggle('muted', muted);
    }
    if (typeof window.showToast === 'function') {
      window.showToast(muted ? '🔇 Aria audio muted.' : '🔊 Aria audio unmuted.');
    }
  }

  // ── 10-Second Undo Buffer (Extended for Todos, Habits, Water, Movement) ──
  _triggerUndoToast(message, snapshot) {
    this.undoSnapshot = snapshot;
    const toast = document.getElementById('voice-undo-toast');
    const msgEl = document.getElementById('voice-undo-message');
    const bar = document.getElementById('voice-undo-bar');

    if (!toast || !msgEl || !bar) return;

    msgEl.textContent = message;
    toast.classList.add('show');
    bar.style.transition = 'none';
    bar.style.width = '100%';

    clearTimeout(this.undoTimeout);
    clearInterval(this.undoInterval);

    const startTime = Date.now();
    const duration = 10000;

    this.undoInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / duration) * 100);
      bar.style.width = pct + '%';
      if (elapsed >= duration) {
        clearInterval(this.undoInterval);
      }
    }, 100);

    this.undoTimeout = setTimeout(() => {
      this.dismissUndo();
    }, duration);
  }

  performUndo() {
    if (!this.undoSnapshot) return;
    const { type, prev } = this.undoSnapshot;

    if (type === 'habits' && Array.isArray(prev)) {
      userState.customHabits = JSON.parse(JSON.stringify(prev));
    } else if (type === 'todos' && Array.isArray(prev)) {
      userState.todos = JSON.parse(JSON.stringify(prev));
    } else if (type === 'water') {
      userState.waterGlasses = prev;
    } else if (type === 'movement' && Array.isArray(prev)) {
      userState.movementLogs = JSON.parse(JSON.stringify(prev));
    }

    saveStateToStorage();
    this._syncUI();

    this.dismissUndo();
    if (typeof window.showToast === 'function') {
      window.showToast(ARIA.undone);
    }
    this.speaker.speak("Undone. Restored your previous state.");
  }

  dismissUndo() {
    const toast = document.getElementById('voice-undo-toast');
    if (toast) toast.classList.remove('show');
    clearTimeout(this.undoTimeout);
    clearInterval(this.undoInterval);
    this.undoSnapshot = null;
  }

  _syncUI() {
    if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
    if (typeof window.renderTodosUI === 'function') window.renderTodosUI();
    if (typeof window.renderMovementLogs === 'function') window.renderMovementLogs();
    if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);
  }
}

// ── Singleton Export ───────────────────────────────────────────────────────
export const MomentumVoiceAgent = new VoiceAgentEngine();

// Named function exports
export function toggleVoiceAgentSheet()  { MomentumVoiceAgent.toggleMic(); }
export function closeVoiceAgentSheet()   { MomentumVoiceAgent.stopListening(); }
export function startVoiceRecording()    { MomentumVoiceAgent.startListening(); }
export function stopVoiceRecording()     { MomentumVoiceAgent.stopListening(); }
export function undoLastVoiceAction()    { MomentumVoiceAgent.performUndo(); }
export function toggleVoiceMute()        { MomentumVoiceAgent.toggleMute(); }
export function handleVoiceTextSubmit(e) { MomentumVoiceAgent.handleTextSubmit(e); }
export function closeVoiceMode()         { MomentumVoiceAgent.closeVoiceMode(); }
export function handleFabClick()         { MomentumVoiceAgent.handleFabClick(); }

if (typeof window !== 'undefined') {
  Object.assign(window, {
    MomentumVoiceAgent,
    toggleVoiceAgentSheet,
    closeVoiceAgentSheet,
    startVoiceRecording,
    stopVoiceRecording,
    undoLastVoiceAction,
    toggleVoiceMute,
    handleVoiceTextSubmit,
    closeVoiceMode,
    handleFabClick,
  });
}
