// ═══════════════════════════════════════════════════════
// MOMENTUM — FOCUS TIMER & COUNTDOWN ORCHESTRATOR
// ═══════════════════════════════════════════════════════

import { focusTimerState, userState } from '../state.js';
import { MeditativeAudio } from '../services/soundscape.js';
import { recalculateAndSyncAll } from './today.js';
import { showToast } from './profile.js';

export function openFocusTimer() {
  const modal = document.getElementById('modal-focus-timer');
  const backdrop = document.getElementById('focus-timer-backdrop');
  if (modal && backdrop) {
    backdrop.classList.add('active');
    modal.classList.add('active');
    updateFocusTimerDisplay();
    syncSoundscapeUI();
  }
}

export function closeFocusTimer() {
  const modal = document.getElementById('modal-focus-timer');
  const backdrop = document.getElementById('focus-timer-backdrop');
  if (modal && backdrop) {
    modal.classList.remove('active');
    backdrop.classList.remove('active');
  }
}

export function setTimerPreset(minutes, btn) {
  if (focusTimerState.isRunning || focusTimerState.introInProgress) return;
  focusTimerState.durationSec = minutes * 60;
  focusTimerState.remainingSec = minutes * 60;
  document.querySelectorAll('.timer-preset-btn').forEach(b => {
    b.className = 'timer-preset-btn px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface transition-all cursor-pointer border-0';
  });
  if (btn) {
    btn.className = 'timer-preset-btn px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold transition-all cursor-pointer border-0';
  }
  updateFocusTimerDisplay();
}

export function updateFocusTimerDisplay() {
  const timeEl = document.getElementById('timer-display-time');
  const ringEl = document.getElementById('timer-progress-ring');
  const captionEl = document.getElementById('timer-status-caption');
  const btnLabel = document.getElementById('timer-btn-label');
  const btnIcon = document.getElementById('timer-btn-icon');

  const mins = Math.floor(focusTimerState.remainingSec / 60);
  const secs = focusTimerState.remainingSec % 60;
  if (timeEl) timeEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  if (ringEl) {
    const circumference = 527.79;
    const progress = focusTimerState.durationSec > 0 ? (focusTimerState.remainingSec / focusTimerState.durationSec) : 0;
    const offset = circumference * (1 - progress);
    ringEl.style.strokeDashoffset = offset;
  }

  if (captionEl) {
    if (focusTimerState.remainingSec === 0) {
      captionEl.textContent = 'Session complete with presence';
      captionEl.className = 'text-xs text-primary font-semibold mt-2';
    } else if (focusTimerState.isRunning) {
      captionEl.textContent = 'In quiet focus';
      captionEl.className = 'text-xs text-primary font-medium mt-2';
    } else if (focusTimerState.remainingSec < focusTimerState.durationSec) {
      captionEl.textContent = 'Session paused';
      captionEl.className = 'text-xs text-outline mt-2 font-medium';
    } else {
      captionEl.textContent = 'Ready to begin';
      captionEl.className = 'text-xs text-outline mt-2 font-medium';
    }
  }

  if (btnLabel && btnIcon) {
    if (focusTimerState.remainingSec === 0) {
      btnLabel.textContent = 'Begin Another';
      btnIcon.textContent = 'restart_alt';
    } else if (focusTimerState.isRunning) {
      btnLabel.textContent = 'Pause';
      btnIcon.textContent = 'pause';
    } else {
      btnLabel.textContent = focusTimerState.remainingSec < focusTimerState.durationSec ? 'Resume' : 'Begin Focus';
      btnIcon.textContent = 'play_arrow';
    }
  }
}

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
      showToast('Soundscape active · will play during focus');
    } else {
      MeditativeAudio.stopPeacefulSoundscape(0.8);
      showToast('Soundscape muted');
    }
  }
}

export function toggleFocusTimer() {
  MeditativeAudio.ensureContext();

  if (focusTimerState.remainingSec === 0) {
    resetFocusTimer();
  }

  if (focusTimerState.isRunning) {
    focusTimerState.isRunning = false;
    if (focusTimerState.intervalId) clearInterval(focusTimerState.intervalId);
    focusTimerState.intervalId = null;
    MeditativeAudio.stopPeacefulSoundscape(1.2);
    updateFocusTimerDisplay();
  } else if (focusTimerState.remainingSec < focusTimerState.durationSec) {
    startTimerCountdownEngine();
  } else {
    startFocusIntroSequence();
  }
}

export function startFocusIntroSequence() {
  if (focusTimerState.introInProgress) return;
  focusTimerState.introInProgress = true;

  const overlay = document.getElementById('focus-intro-overlay');
  if (!overlay) {
    startTimerCountdownEngine();
    return;
  }

  overlay.className = 'active stage-earbuds';

  setTimeout(() => {
    overlay.className = 'active stage-countdown';

    const num3 = document.getElementById('countdown-num-3');
    const num2 = document.getElementById('countdown-num-2');
    const num1 = document.getElementById('countdown-num-1');

    if (num3) {
      num3.classList.remove('pop');
      void num3.offsetWidth;
      num3.classList.add('pop');
    }
    MeditativeAudio.playSingingBowlChime(396, 2.5, 0.22);

    setTimeout(() => {
      if (num2) {
        num2.classList.remove('pop');
        void num2.offsetWidth;
        num2.classList.add('pop');
      }
      MeditativeAudio.playSingingBowlChime(432, 2.5, 0.22);
    }, 1000);

    setTimeout(() => {
      if (num1) {
        num1.classList.remove('pop');
        void num1.offsetWidth;
        num1.classList.add('pop');
      }
      MeditativeAudio.playSingingBowlChime(528, 3.0, 0.25);
    }, 2000);

    setTimeout(() => {
      overlay.classList.remove('active');
      focusTimerState.introInProgress = false;

      if (focusTimerState.soundscapeActive) {
        MeditativeAudio.startPeacefulSoundscape(2.0);
      }
      startTimerCountdownEngine();
    }, 3050);

  }, 3500);
}

export function startTimerCountdownEngine() {
  focusTimerState.isRunning = true;
  focusTimerState.targetEndTime = Date.now() + focusTimerState.remainingSec * 1000;

  if (focusTimerState.soundscapeActive) {
    MeditativeAudio.startPeacefulSoundscape(2.0);
  }

  if (focusTimerState.intervalId) clearInterval(focusTimerState.intervalId);
  focusTimerState.intervalId = setInterval(() => {
    const now = Date.now();
    const leftMs = Math.max(0, focusTimerState.targetEndTime - now);
    focusTimerState.remainingSec = Math.ceil(leftMs / 1000);
    updateFocusTimerDisplay();

    if (leftMs <= 0) {
      clearInterval(focusTimerState.intervalId);
      focusTimerState.intervalId = null;
      focusTimerState.isRunning = false;
      onFocusTimerComplete();
    }
  }, 200);

  updateFocusTimerDisplay();
}

export function resetFocusTimer() {
  if (focusTimerState.intervalId) clearInterval(focusTimerState.intervalId);
  focusTimerState.intervalId = null;
  focusTimerState.isRunning = false;
  focusTimerState.introInProgress = false;
  focusTimerState.remainingSec = focusTimerState.durationSec;
  MeditativeAudio.stopPeacefulSoundscape(1.0);
  updateFocusTimerDisplay();
}

export function onFocusTimerComplete() {
  MeditativeAudio.stopPeacefulSoundscape(2.0);
  MeditativeAudio.playSingingBowlChime(528, 4.5, 0.28);
  updateFocusTimerDisplay();

  const quietMins = Math.round(focusTimerState.durationSec / 60);
  if (userState) {
    userState.todayFocusMinutes = (userState.todayFocusMinutes || 0) + quietMins;
    userState.mindfulHours = (userState.mindfulHours || 38) + (quietMins / 60);
  }
  recalculateAndSyncAll(true);
  showToast(`🧘 Focus session complete! +${Math.round(quietMins * 1.5)} score points.`);
}

// Bind to window for HTML inline handlers
window.openFocusTimer = openFocusTimer;
window.closeFocusTimer = closeFocusTimer;
window.setTimerPreset = setTimerPreset;
window.updateFocusTimerDisplay = updateFocusTimerDisplay;
window.syncSoundscapeUI = syncSoundscapeUI;
window.setSoundscapeVolume = setSoundscapeVolume;
window.toggleAmbientSoundscape = toggleAmbientSoundscape;
window.toggleFocusTimer = toggleFocusTimer;
window.startFocusIntroSequence = startFocusIntroSequence;
window.startTimerCountdownEngine = startTimerCountdownEngine;
window.resetFocusTimer = resetFocusTimer;
window.onFocusTimerComplete = onFocusTimerComplete;
