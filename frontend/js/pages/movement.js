// ═══════════════════════════════════════════════════════
// MOMENTUM — FITNESS & MOVEMENT PRACTITIONER QUICK-LOG ENGINE
// ═══════════════════════════════════════════════════════

import { movementLogState, userState, saveStateToStorage, getExerciseLibrary, addOrUpdateExerciseInLibrary, checkAndUpdatePR, getLatestWorkoutSession, logCardioSession, deleteCardioLog, logCalorieIntake, deleteCalorieLog } from '../state.js';
import { renderCustomHabits } from './rituals.js';
import { updateStreakAndProgressUI, recalculateAndSyncAll } from './today.js';
import { showToast } from './profile.js';

let restTimerInterval = null;
let pickerTargetExerciseIndex = null;
let activePickerMuscleFilter = 'all';

// ── Open / Close Main Movement Logger ─────────────────────────────────────
export function openMovementLogger(initialTab = 'strength') {
  const modal = document.getElementById('modal-movement-log');
  const backdrop = document.getElementById('movement-log-backdrop');
  if (!modal || !backdrop) return;

  // Initialize active session exercises if empty
  if (!movementLogState.exercises || movementLogState.exercises.length === 0) {
    initDefaultSession();
  }

  // Set tab
  setMovementTab(initialTab);

  // Render UI sections
  renderRepeatLastWorkoutCard();
  renderSessionExercises();
  renderPacingAndFeelUI();

  backdrop.classList.add('active');
  modal.classList.add('active');
}

export function closeMovementLogger() {
  const modal = document.getElementById('modal-movement-log');
  const backdrop = document.getElementById('movement-log-backdrop');
  if (modal && backdrop) {
    modal.classList.remove('active');
    backdrop.classList.remove('active');
  }
}

function initDefaultSession() {
  movementLogState.sessionId = 'session-' + Date.now();
  movementLogState.pacing = 'Moderate';
  movementLogState.feel = 'Comfortable';
  movementLogState.exercises = [
    {
      id: 'ex-bench-press',
      workoutName: 'Bench Press',
      muscleGroup: 'chest',
      supersetGroupId: null,
      sets: [
        { setNumber: 1, weightKg: 60, reps: 10, isPR: false },
        { setNumber: 2, weightKg: 65, reps: 8, isPR: false }
      ]
    }
  ];
}

// ── Tab Navigation ────────────────────────────────────────────────────────
export function setMovementTab(tab) {
  movementLogState.activeTab = tab;
  const tabs = ['strength', 'cardio', 'calories', 'prs'];
  tabs.forEach(t => {
    const btn = document.getElementById(`movement-tab-${t}`);
    const panel = document.getElementById(`movement-${t}-panel`);
    if (btn) {
      if (t === tab) {
        btn.className = 'py-2 px-3 rounded-xl movement-tab-active text-xs font-semibold transition-all cursor-pointer border-0';
      } else {
        btn.className = 'py-2 px-3 rounded-xl movement-tab-inactive text-xs font-semibold transition-all cursor-pointer border-0';
      }
    }
    if (panel) {
      if (t === tab) panel.classList.remove('hidden');
      else panel.classList.add('hidden');
    }
  });

  if (tab === 'prs') {
    renderPersonalRecordsUI();
  } else if (tab === 'calories') {
    renderCalorieIntakeList();
  }
}

// ── Repeat Last Workout Quick-Start Card ──────────────────────────────────
export function renderRepeatLastWorkoutCard() {
  const container = document.getElementById('movement-repeat-last-card');
  if (!container) return;

  const lastSession = getLatestWorkoutSession();
  if (!lastSession || !lastSession.exercises || lastSession.exercises.length === 0) {
    container.classList.add('hidden');
    return;
  }

  const exSummary = lastSession.exercises.map(e => e.workoutName).join(', ');
  container.classList.remove('hidden');
  container.innerHTML = `
    <div class="p-3.5 rounded-2xl bg-surface-container-low border border-primary/20 flex items-center justify-between gap-3 transition-all hover:bg-surface-container">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[18px]">history</span>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-semibold text-on-surface truncate">Repeat: ${lastSession.sessionTitle}</span>
            <span class="text-[10px] text-outline px-1.5 py-0.5 rounded-md bg-surface-container-highest shrink-0">${lastSession.date}</span>
          </div>
          <p class="text-[11px] text-outline truncate">${exSummary}</p>
        </div>
      </div>
      <button type="button" onclick="repeatLastWorkout()" class="px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold hover:bg-primary-container transition-colors cursor-pointer border-0 shrink-0">
        Pre-fill
      </button>
    </div>
  `;
}

export function repeatLastWorkout() {
  const lastSession = getLatestWorkoutSession();
  if (!lastSession) return;

  movementLogState.sessionId = 'session-' + Date.now();
  movementLogState.pacing = lastSession.pacing || 'Moderate';
  movementLogState.feel = lastSession.feel || 'Comfortable';
  movementLogState.exercises = lastSession.exercises.map((e, idx) => ({
    id: `ex-repeat-${Date.now()}-${idx}`,
    workoutName: e.workoutName,
    muscleGroup: e.muscleGroup || 'full-body',
    supersetGroupId: e.supersetGroupId || null,
    sets: (e.sets || []).map((s, sIdx) => ({
      setNumber: sIdx + 1,
      weightKg: s.weightKg || 0,
      reps: s.reps || 10,
      isPR: false
    }))
  }));

  renderSessionExercises();
  renderPacingAndFeelUI();
  showToast(`⚡ Pre-filled from ${lastSession.sessionTitle}`);
}

// ── Multi-Exercise Session Rendering ──────────────────────────────────────
export function renderSessionExercises() {
  const container = document.getElementById('movement-exercises-list');
  if (!container) return;

  const exercises = movementLogState.exercises || [];
  if (exercises.length === 0) {
    container.innerHTML = `
      <div class="text-center py-6 text-outline text-xs">
        No exercises added yet. Tap "+ Add Exercise" below to begin.
      </div>
    `;
    return;
  }

  const lib = getExerciseLibrary();

  container.innerHTML = exercises.map((ex, exIdx) => {
    const exLibEntry = lib.find(e => e.name.toLowerCase() === ex.workoutName.toLowerCase());
    const pb = exLibEntry?.personalBest || { weightKg: 0, reps: 0 };
    const pbLabel = pb.weightKg > 0 || pb.reps > 0 ? `PB: ${pb.weightKg}kg × ${pb.reps}` : 'No prior PR';
    const isSuperset = ex.supersetGroupId !== null && ex.supersetGroupId !== undefined;

    const setRowsHtml = (ex.sets || []).map((s, sIdx) => {
      // Check PR status live
      const isPR = (s.weightKg > pb.weightKg) || (s.weightKg === pb.weightKg && s.reps > pb.reps && pb.reps > 0);
      s.isPR = isPR;

      return `
        <div class="flex items-center gap-2 p-2 rounded-xl bg-surface-container-low hairline transition-all">
          <span class="text-xs font-semibold text-on-surface-variant w-12 shrink-0">Set ${s.setNumber || sIdx + 1}</span>
          
          <div class="flex-1 flex items-center gap-2">
            <!-- Weight (KG) -->
            <div class="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-lg hairline flex-1">
              <input type="number" value="${s.weightKg !== undefined ? s.weightKg : 0}" min="0" max="500" step="0.5" 
                     class="w-full text-xs font-semibold text-on-surface focus:outline-none bg-transparent"
                     oninput="updateSetField(${exIdx}, ${sIdx}, 'weightKg', this.value)">
              <span class="text-[10px] text-outline uppercase">kg</span>
            </div>

            <!-- Reps -->
            <div class="flex items-center gap-1 bg-surface-container-lowest px-2.5 py-1.5 rounded-lg hairline flex-1">
              <input type="number" value="${s.reps || 10}" min="1" max="100" 
                     class="w-full text-xs font-semibold text-on-surface focus:outline-none bg-transparent"
                     oninput="updateSetField(${exIdx}, ${sIdx}, 'reps', this.value)">
              <span class="text-[10px] text-outline uppercase">reps</span>
            </div>
          </div>

          <!-- PR Badge (Live auto-detected) -->
          ${isPR ? `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse shrink-0" title="Beats your recorded personal best!">
              <span>PR 🎉</span>
            </span>
          ` : ''}

          <!-- Rest Timer Trigger -->
          <button type="button" onclick="startRestTimer(90)" class="w-7 h-7 rounded-lg text-outline hover:text-primary flex items-center justify-center cursor-pointer border-0 bg-transparent shrink-0" title="Start 90s Rest Timer">
            <span class="material-symbols-outlined text-[16px]">timer</span>
          </button>

          <!-- Delete Set -->
          ${ex.sets.length > 1 ? `
            <button type="button" onclick="removeSetFromExercise(${exIdx}, ${sIdx})" class="w-7 h-7 rounded-lg text-outline hover:text-error flex items-center justify-center cursor-pointer border-0 bg-transparent shrink-0" aria-label="Remove set">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          ` : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="p-3.5 rounded-2xl bg-surface-container-lowest hairline relative ${isSuperset ? 'border-l-4 border-l-secondary' : ''}">
        <!-- Exercise Header -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2 min-w-0">
            <button type="button" onclick="openExercisePicker(${exIdx})" class="font-semibold text-sm text-on-surface hover:text-primary transition-colors flex items-center gap-1 text-left truncate cursor-pointer border-0 bg-transparent p-0">
              <span class="truncate">${ex.workoutName}</span>
              <span class="material-symbols-outlined text-[14px] text-outline">expand_more</span>
            </button>
            <span class="text-[10px] uppercase font-semibold tracking-wider text-secondary px-2 py-0.5 rounded-full bg-secondary-fixed/50 shrink-0">
              ${ex.muscleGroup || 'Full Body'}
            </span>
          </div>
          
          <div class="flex items-center gap-1">
            <span class="text-[11px] text-outline mr-1 hidden sm:inline-block">${pbLabel}</span>
            <button type="button" onclick="toggleSuperset(${exIdx})" class="p-1 rounded-lg ${isSuperset ? 'text-secondary bg-secondary-fixed/30' : 'text-outline hover:text-on-surface'} cursor-pointer border-0 bg-transparent" title="${isSuperset ? 'Superset linked' : 'Link as Superset with next exercise'}">
              <span class="material-symbols-outlined text-[18px]">link</span>
            </button>
            <button type="button" onclick="removeExerciseFromSession(${exIdx})" class="p-1 rounded-lg text-outline hover:text-error cursor-pointer border-0 bg-transparent" title="Remove exercise">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>

        <!-- Set Rows -->
        <div class="space-y-1.5 mb-2.5">
          ${setRowsHtml}
        </div>

        <!-- Add Set Button (One-tap replication) -->
        <div class="flex items-center gap-2">
          <button type="button" onclick="addSetToExercise(${exIdx})" class="py-1.5 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high hairline text-xs font-medium text-primary flex items-center gap-1 transition-colors cursor-pointer border-0">
            <span class="material-symbols-outlined text-[15px]">add</span>
            <span>+ Set</span>
          </button>
          <span class="text-[11px] text-outline">Copies previous set weight & reps</span>
        </div>
      </div>
    `;
  }).join('');
}

export function addSetToExercise(exIdx) {
  const ex = movementLogState.exercises[exIdx];
  if (!ex) return;
  const sets = ex.sets || [];
  const lastSet = sets[sets.length - 1] || { weightKg: 40, reps: 10 };
  sets.push({
    setNumber: sets.length + 1,
    weightKg: lastSet.weightKg,
    reps: lastSet.reps,
    isPR: false
  });
  renderSessionExercises();
}

export function updateSetField(exIdx, setIdx, field, val) {
  const ex = movementLogState.exercises[exIdx];
  if (!ex || !ex.sets || !ex.sets[setIdx]) return;
  ex.sets[setIdx][field] = Math.max(0, parseFloat(val) || 0);

  // Check PR dynamically
  const lib = getExerciseLibrary();
  const libEntry = lib.find(e => e.name.toLowerCase() === ex.workoutName.toLowerCase());
  const pb = libEntry?.personalBest || { weightKg: 0, reps: 0 };
  const s = ex.sets[setIdx];
  s.isPR = (s.weightKg > pb.weightKg) || (s.weightKg === pb.weightKg && s.reps > pb.reps && pb.reps > 0);
}

export function removeSetFromExercise(exIdx, setIdx) {
  const ex = movementLogState.exercises[exIdx];
  if (!ex || !ex.sets || ex.sets.length <= 1) return;
  ex.sets.splice(setIdx, 1);
  ex.sets.forEach((s, i) => { s.setNumber = i + 1; });
  renderSessionExercises();
}

export function removeExerciseFromSession(exIdx) {
  if (movementLogState.exercises.length <= 1) {
    showToast('Session must have at least one exercise.');
    return;
  }
  movementLogState.exercises.splice(exIdx, 1);
  renderSessionExercises();
}

export function toggleSuperset(exIdx) {
  const ex = movementLogState.exercises[exIdx];
  if (!ex) return;
  if (ex.supersetGroupId) {
    ex.supersetGroupId = null;
  } else {
    ex.supersetGroupId = 'ss_' + (movementLogState.sessionId || Date.now());
  }
  renderSessionExercises();
}

// ── Searchable Exercise Picker ────────────────────────────────────────────
export function openExercisePicker(targetIndex = null) {
  pickerTargetExerciseIndex = targetIndex;
  const modal = document.getElementById('modal-exercise-picker');
  if (!modal) return;
  modal.classList.remove('hidden');
  const searchInput = document.getElementById('exercise-picker-search');
  if (searchInput) {
    searchInput.value = '';
    searchInput.focus();
  }
  activePickerMuscleFilter = 'all';
  renderExercisePickerList('');
}

export function closeExercisePicker() {
  const modal = document.getElementById('modal-exercise-picker');
  if (modal) modal.classList.add('hidden');
  pickerTargetExerciseIndex = null;
}

export function filterExercisePickerByMuscle(muscleGroup, btn) {
  activePickerMuscleFilter = muscleGroup;
  const buttons = document.querySelectorAll('#picker-muscle-chips button');
  buttons.forEach(b => b.className = 'px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant cursor-pointer border-0');
  if (btn) btn.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-on-primary cursor-pointer border-0';
  const query = document.getElementById('exercise-picker-search')?.value?.trim() || '';
  renderExercisePickerList(query);
}

export function renderExercisePickerList(searchTerm = '') {
  const container = document.getElementById('exercise-picker-items');
  if (!container) return;

  const lib = getExerciseLibrary();
  const q = searchTerm.toLowerCase();

  let filtered = lib.filter(e => {
    const matchName = e.name.toLowerCase().includes(q);
    const matchMuscle = activePickerMuscleFilter === 'all' || e.muscleGroup === activePickerMuscleFilter;
    return matchName && matchMuscle;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="p-4 text-center">
        <p class="text-xs text-outline mb-2">No matching exercises in library.</p>
        <button type="button" onclick="createCustomExerciseFromPicker('${searchTerm}')" class="px-3.5 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold cursor-pointer border-0">
          + Add "${searchTerm || 'Custom Exercise'}"
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(ex => {
    const pb = ex.personalBest;
    const pbText = pb && (pb.weightKg > 0 || pb.reps > 0) ? `Best: ${pb.weightKg}kg × ${pb.reps}` : 'No PR yet';
    return `
      <div onclick="selectExerciseFromPicker('${ex.name.replace(/'/g, "\\'")}', '${ex.muscleGroup}')" 
           class="p-2.5 rounded-xl bg-surface-container-lowest hover:bg-surface-container hairline flex items-center justify-between cursor-pointer transition-colors">
        <div>
          <span class="text-xs font-semibold text-on-surface block">${ex.name}</span>
          <span class="text-[10px] text-outline capitalize">${ex.muscleGroup} &middot; ${pbText}</span>
        </div>
        <span class="material-symbols-outlined text-[16px] text-primary">arrow_forward</span>
      </div>
    `;
  }).join('');
}

export function selectExerciseFromPicker(name, muscleGroup) {
  if (pickerTargetExerciseIndex !== null && movementLogState.exercises[pickerTargetExerciseIndex]) {
    movementLogState.exercises[pickerTargetExerciseIndex].workoutName = name;
    movementLogState.exercises[pickerTargetExerciseIndex].muscleGroup = muscleGroup;
  } else {
    // Add new exercise to session
    movementLogState.exercises.push({
      id: 'ex-' + Date.now(),
      workoutName: name,
      muscleGroup: muscleGroup,
      supersetGroupId: null,
      sets: [
        { setNumber: 1, weightKg: 40, reps: 10, isPR: false },
        { setNumber: 2, weightKg: 40, reps: 10, isPR: false }
      ]
    });
  }
  closeExercisePicker();
  renderSessionExercises();
}

export function createCustomExerciseFromPicker(name) {
  const finalName = (name || 'Custom Movement').trim();
  const muscleGroup = activePickerMuscleFilter !== 'all' ? activePickerMuscleFilter : 'full-body';
  addOrUpdateExerciseInLibrary({ name: finalName, muscleGroup, isCustom: true });
  selectExerciseFromPicker(finalName, muscleGroup);
}

// ── Non-Blocking Rest Timer ───────────────────────────────────────────────
export function startRestTimer(durationSec = 90) {
  clearInterval(restTimerInterval);
  movementLogState.restTimer.durationSec = durationSec;
  movementLogState.restTimer.remainingSec = durationSec;
  movementLogState.restTimer.isRunning = true;

  const timerEl = document.getElementById('movement-rest-timer-bar');
  if (timerEl) timerEl.classList.remove('hidden');

  updateRestTimerDisplay();

  restTimerInterval = setInterval(() => {
    movementLogState.restTimer.remainingSec--;
    if (movementLogState.restTimer.remainingSec <= 0) {
      clearInterval(restTimerInterval);
      movementLogState.restTimer.isRunning = false;
      onRestTimerComplete();
    } else {
      updateRestTimerDisplay();
    }
  }, 1000);

  showToast(`⏱️ Started ${durationSec}s rest timer`);
}

function updateRestTimerDisplay() {
  const sec = movementLogState.restTimer.remainingSec;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const timeStr = `${m}:${String(s).padStart(2, '0')}`;
  const textEl = document.getElementById('rest-timer-time');
  if (textEl) textEl.textContent = timeStr;
}

function onRestTimerComplete() {
  updateRestTimerDisplay();
  const timerEl = document.getElementById('movement-rest-timer-bar');
  if (timerEl) {
    timerEl.classList.add('bg-primary', 'text-on-primary');
    setTimeout(() => {
      timerEl.classList.remove('bg-primary', 'text-on-primary');
      timerEl.classList.add('hidden');
    }, 4000);
  }
  showToast('✨ Rest time complete! Ready for your next set.');
}

export function dismissRestTimer() {
  clearInterval(restTimerInterval);
  movementLogState.restTimer.isRunning = false;
  const timerEl = document.getElementById('movement-rest-timer-bar');
  if (timerEl) timerEl.classList.add('hidden');
}

// ── Pacing & Feel Selection ───────────────────────────────────────────────
export function renderPacingAndFeelUI() {
  const pLabel = document.getElementById('pacing-current-label');
  const fLabel = document.getElementById('feel-current-label');
  if (pLabel) pLabel.textContent = movementLogState.pacing || 'Moderate';
  if (fLabel) fLabel.textContent = movementLogState.feel || 'Comfortable';

  document.querySelectorAll('#pacing-pill-group button').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === (movementLogState.pacing || 'Moderate'));
  });
  document.querySelectorAll('#feel-pill-group button').forEach(b => {
    b.classList.toggle('active', b.textContent.trim() === (movementLogState.feel || 'Comfortable'));
  });
}

export function selectMovementPacing(pacing, btn) {
  movementLogState.pacing = pacing;
  const label = document.getElementById('pacing-current-label');
  const customWrap = document.getElementById('pacing-custom-wrap');
  if (label) label.textContent = pacing;
  
  const buttons = document.querySelectorAll('#pacing-pill-group button');
  buttons.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (pacing === 'Custom') {
    if (customWrap) customWrap.classList.remove('hidden');
    const customIn = document.getElementById('movement-custom-pacing');
    if (customIn) customIn.focus();
  } else {
    if (customWrap) customWrap.classList.add('hidden');
  }
}

export function selectMovementFeel(feel, btn) {
  movementLogState.feel = feel;
  const label = document.getElementById('feel-current-label');
  const customWrap = document.getElementById('feel-custom-wrap');
  if (label) label.textContent = feel;

  const buttons = document.querySelectorAll('#feel-pill-group button');
  buttons.forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  if (feel === 'Custom') {
    if (customWrap) customWrap.classList.remove('hidden');
    const customIn = document.getElementById('movement-custom-feel');
    if (customIn) customIn.focus();
  } else {
    if (customWrap) customWrap.classList.add('hidden');
  }
}

// ── Save Movement Session ─────────────────────────────────────────────────
export function saveMovementSession() {
  const exercises = movementLogState.exercises || [];
  if (exercises.length === 0) {
    showToast('Please add at least one exercise.');
    return;
  }

  let pacingVal = movementLogState.pacing || 'Moderate';
  let feelVal = movementLogState.feel || 'Comfortable';
  if (pacingVal === 'Custom') {
    const cp = document.getElementById('movement-custom-pacing')?.value?.trim();
    if (cp) pacingVal = cp;
  }
  if (feelVal === 'Custom') {
    const cf = document.getElementById('movement-custom-feel')?.value?.trim();
    if (cf) feelVal = cf;
  }

  const sessionId = 'session-' + Date.now();
  const dateStr = new Date().toISOString().slice(0, 10);
  const prevSnapshot = JSON.parse(JSON.stringify(userState.movementLogs || []));

  // Determine dominant muscle group
  const groupCounts = {};
  exercises.forEach(e => {
    const mg = e.muscleGroup || 'full-body';
    groupCounts[mg] = (groupCounts[mg] || 0) + 1;
  });
  let dominant = 'Workout';
  let max = 0;
  for (const [g, count] of Object.entries(groupCounts)) {
    if (count > max) { max = count; dominant = g.charAt(0).toUpperCase() + g.slice(1); }
  }

  const newLogEntries = [];

  exercises.forEach(ex => {
    const sets = ex.sets || [];
    let heaviestWeight = 0;
    let heaviestReps = 0;

    sets.forEach(s => {
      if (s.weightKg > heaviestWeight || (s.weightKg === heaviestWeight && s.reps > heaviestReps)) {
        heaviestWeight = s.weightKg;
        heaviestReps = s.reps;
      }
      // Check PR and update library
      if (s.weightKg > 0 || s.reps > 0) {
        checkAndUpdatePR(ex.workoutName, s.weightKg, s.reps);
      }
    });

    const setsCount = sets.length;
    const reps = heaviestReps || 10;
    const weightKg = heaviestWeight;
    const summary = `${setsCount} sets, up to ${reps} reps @ ${weightKg}kg`;

    const entry = {
      id: 'move-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      date: dateStr,
      workoutName: ex.workoutName,
      muscleGroup: ex.muscleGroup || 'full-body',
      sets: JSON.parse(JSON.stringify(sets)),
      setsCount: setsCount,
      reps: reps,
      weightKg: weightKg,
      pacing: pacingVal,
      feel: feelVal,
      mode: 'strength',
      summary: `${ex.workoutName}: ${summary}`,
      supersetGroupId: ex.supersetGroupId || null,
      sessionId: sessionId,
      timestamp: Date.now()
    };

    newLogEntries.push(entry);
    userState.movementLogs.unshift(entry);
  });

  // Mark Today habit complete
  let habit = (userState.customHabits || []).find(h => h.title.includes('Movement') || h.title.includes('Strength') || h.icon === 'fitness_center');
  if (habit) {
    habit.completed = true;
    habit.subtitle = `${dominant} Session (${exercises.length} exercises)`;
  }

  saveStateToStorage();
  closeMovementLogger();
  renderCustomHabits();
  recalculateAndSyncAll(false);

  // Trigger 10-second undo toast
  if (window.MomentumVoiceAgent && typeof window.MomentumVoiceAgent._triggerUndoToast === 'function') {
    window.MomentumVoiceAgent._triggerUndoToast(`Logged ${dominant} session (${exercises.length} exercises)`, {
      type: 'workout',
      sessionId: sessionId,
      prev: prevSnapshot
    });
  }

  showToast(`🏋️ Logged ${dominant} session successfully!`);
}

// ── Cardio Flow Quick-Log ─────────────────────────────────────────────────
export function saveCardioSession(e) {
  if (e) e.preventDefault();
  const activity = document.getElementById('cardio-activity-select')?.value || 'Treadmill';
  const duration = parseInt(document.getElementById('cardio-duration-input')?.value, 10) || 30;
  const calories = parseInt(document.getElementById('cardio-calories-input')?.value, 10) || 280;

  const prevCardioSnapshot = JSON.parse(JSON.stringify(userState.cardioLogs || []));
  const entry = logCardioSession({ activity, durationMin: duration, caloriesBurned: calories });

  // Mark movement habit complete if exists
  let habit = (userState.customHabits || []).find(h => h.title.includes('Movement') || h.icon === 'fitness_center' || h.icon === 'directions_walk');
  if (habit) {
    habit.completed = true;
    habit.subtitle = `${activity}: ${duration} mins (${calories} cal)`;
  }

  saveStateToStorage();
  closeMovementLogger();
  renderCustomHabits();
  recalculateAndSyncAll(false);

  if (window.MomentumVoiceAgent && typeof window.MomentumVoiceAgent._triggerUndoToast === 'function') {
    window.MomentumVoiceAgent._triggerUndoToast(`Logged ${activity} (${duration}m · ${calories} cal)`, {
      type: 'cardio',
      cardioId: entry.id,
      prev: prevCardioSnapshot
    });
  }

  showToast(`🏃 Logged ${activity} (${duration}m, ${calories} cal)!`);
}

// ── Calorie Intake Quick-Log ──────────────────────────────────────────────
export function saveCalorieIntake(e) {
  if (e) e.preventDefault();
  const item = document.getElementById('calorie-food-item')?.value?.trim() || 'Meal';
  const calories = parseInt(document.getElementById('calorie-amount')?.value, 10) || 500;
  const time = document.getElementById('calorie-time')?.value || null;

  const prevCalorieSnapshot = JSON.parse(JSON.stringify(userState.calorieIntakeLogs || []));
  const entry = logCalorieIntake({ item, calories, time });

  // Clear inputs
  const itemIn = document.getElementById('calorie-food-item');
  const calIn = document.getElementById('calorie-amount');
  if (itemIn) itemIn.value = '';
  if (calIn) calIn.value = '';

  renderCalorieIntakeList();
  saveStateToStorage();

  if (window.MomentumVoiceAgent && typeof window.MomentumVoiceAgent._triggerUndoToast === 'function') {
    window.MomentumVoiceAgent._triggerUndoToast(`Logged ${item} (${calories} kcal)`, {
      type: 'calories',
      foodId: entry.id,
      prev: prevCalorieSnapshot
    });
  }

  showToast(`🥗 Logged ${item} (${calories} kcal)!`);
}

export function renderCalorieIntakeList() {
  const container = document.getElementById('calorie-today-list');
  const totalEl = document.getElementById('calorie-today-total');
  if (!container) return;

  const todayStr = new Date().toISOString().slice(0, 10);
  const logs = (userState.calorieIntakeLogs || []).filter(c => c.date === todayStr);

  const totalCal = logs.reduce((acc, c) => acc + (c.calories || 0), 0);
  if (totalEl) totalEl.textContent = `${totalCal} kcal`;

  if (logs.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-xs text-outline">
        No meals logged for today yet.
      </div>
    `;
    return;
  }

  container.innerHTML = logs.map(c => `
    <div class="p-2.5 rounded-xl bg-surface-container-low hairline flex items-center justify-between">
      <div>
        <span class="text-xs font-semibold text-on-surface block">${c.item}</span>
        <span class="text-[10px] text-outline">${c.time || 'Today'}</span>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-bold text-primary">${c.calories} kcal</span>
        <button type="button" onclick="deleteCalorieEntry('${c.id}')" class="text-outline hover:text-error cursor-pointer border-0 bg-transparent p-1" title="Delete entry">
          <span class="material-symbols-outlined text-[15px]">close</span>
        </button>
      </div>
    </div>
  `).join('');
}

export function deleteCalorieEntry(id) {
  deleteCalorieLog(id);
  renderCalorieIntakeList();
  showToast('Calorie entry removed.');
}

// ── Personal Records (PR) Viewer ──────────────────────────────────────────
export function renderPersonalRecordsUI(muscleFilter = 'all') {
  const container = document.getElementById('prs-list-container');
  if (!container) return;

  const lib = getExerciseLibrary();
  let prs = lib.filter(e => e.personalBest && (e.personalBest.weightKg > 0 || e.personalBest.reps > 0));

  if (muscleFilter !== 'all') {
    prs = prs.filter(e => e.muscleGroup === muscleFilter);
  }

  if (prs.length === 0) {
    container.innerHTML = `
      <div class="p-6 text-center text-outline text-xs">
        No personal records recorded yet for this category. Log your workouts to automatically track your all-time bests!
      </div>
    `;
    return;
  }

  container.innerHTML = prs.map(e => `
    <div class="p-3 rounded-2xl bg-surface-container-lowest hairline flex items-center justify-between">
      <div class="min-w-0">
        <span class="text-xs font-semibold text-on-surface block truncate">${e.name}</span>
        <span class="text-[10px] text-outline capitalize">${e.muscleGroup} &middot; Recorded ${e.personalBest.date || 'Recently'}</span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
          🏆 ${e.personalBest.weightKg} kg × ${e.personalBest.reps}
        </span>
      </div>
    </div>
  `).join('');
}

export function filterPRsByMuscle(muscle, btn) {
  const buttons = document.querySelectorAll('#pr-muscle-chips button');
  buttons.forEach(b => b.className = 'px-2.5 py-1 rounded-full text-xs font-medium bg-surface-container text-on-surface-variant cursor-pointer border-0');
  if (btn) btn.className = 'px-2.5 py-1 rounded-full text-xs font-semibold bg-primary text-on-primary cursor-pointer border-0';
  renderPersonalRecordsUI(muscle);
}

// ── Bind to window for inline HTML handlers ───────────────────────────────
window.openMovementLogger = openMovementLogger;
window.closeMovementLogger = closeMovementLogger;
window.setMovementTab = setMovementTab;
window.repeatLastWorkout = repeatLastWorkout;
window.renderRepeatLastWorkoutCard = renderRepeatLastWorkoutCard;

window.renderSessionExercises = renderSessionExercises;
window.addSetToExercise = addSetToExercise;
window.updateSetField = updateSetField;
window.removeSetFromExercise = removeSetFromExercise;
window.removeExerciseFromSession = removeExerciseFromSession;
window.toggleSuperset = toggleSuperset;

window.openExercisePicker = openExercisePicker;
window.closeExercisePicker = closeExercisePicker;
window.filterExercisePickerByMuscle = filterExercisePickerByMuscle;
window.renderExercisePickerList = renderExercisePickerList;
window.selectExerciseFromPicker = selectExerciseFromPicker;
window.createCustomExerciseFromPicker = createCustomExerciseFromPicker;

window.startRestTimer = startRestTimer;
window.dismissRestTimer = dismissRestTimer;

window.selectMovementPacing = selectMovementPacing;
window.selectMovementFeel = selectMovementFeel;
window.saveMovementSession = saveMovementSession;

window.saveCardioSession = saveCardioSession;
window.saveCalorieIntake = saveCalorieIntake;
window.renderCalorieIntakeList = renderCalorieIntakeList;
window.deleteCalorieEntry = deleteCalorieEntry;

window.renderPersonalRecordsUI = renderPersonalRecordsUI;
window.filterPRsByMuscle = filterPRsByMuscle;
