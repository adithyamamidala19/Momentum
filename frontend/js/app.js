// ═══════════════════════════════════════════════════════
// MOMENTUM — ROOT APPLICATION BOOTSTRAP & MODULE ORCHESTRATOR
// ═══════════════════════════════════════════════════════

import { STORAGE_KEYS, loadPersistedState, saveStateToStorage } from './storage.js?v=20260922d';
import { userState, focusTimerState, movementLogState, ONBOARDING_DATA, calculateDynamicMetrics } from './state.js?v=20260922d';
import { VIEWS, navigate, registerViewHook } from './router.js?v=20260922d';

// Services
import { MomentumFirebase, openFirebaseConfigModal, closeFirebaseConfigModal, saveFirebaseConfig, disconnectFirebase, testFirestoreConnection } from './services/firebase.js?v=20260922d';
import { MeditativeAudio } from './services/soundscape.js?v=20260922d';
import { MomentumAssistant, askAssistantChip, handleAssistantSubmit, clearAssistantChat } from './services/assistant.js?v=20260922d';
import { MomentumVoiceAgent, toggleVoiceAgentSheet, closeVoiceAgentSheet, startVoiceRecording, stopVoiceRecording, undoLastVoiceAction, toggleVoiceMute, handleVoiceTextSubmit, closeVoiceMode, handleFabClick } from './services/voice-agent.js?v=20260922d';
import { MomentumReminderEngine, dismissReminder, snoozeReminder, completeReminderHabit } from './services/reminders.js?v=20260922d';

// Components
import { renderHabitChart, updateHabitChart, toggleHabitCurve } from './components/rhythm-chart.js?v=20260922d';
import { trackMedalSheen, toggleMedalFlip, openShareModal, closeShareModal, openMilestonesDetailModal, closeMilestonesDetailModal } from './components/medals.js?v=20260922d';
import { renderTodosUI, setTodosFilter, handleToggleTodoWithUndo, handleDeleteTodoWithUndo, handleQuickAddTodo, handleFullAddTodo } from './components/todos.js?v=20260922d';

// Pages
import { selectIntention, toggleProblem, advanceOnboardingStep, selectCompanionRitual, toggleCompanionPicker, adoptPersonalizedRitual } from './pages/onboarding.js?v=20260922d';
import { switchAuthTab, openAuthView, togglePasswordVisibility, showAuthFeedback, hideAuthFeedback, openForgotPasswordModal, closeForgotPasswordModal, handleSendPasswordReset, submitLogin, instantLogin, setupOtpView, initOtpInputs, startOtpTimer, resendOtp, submitOtp, signInWithGoogleFirebase } from './pages/auth.js?v=20260922d';
import { toggleHabit, toggleTodayRitual, incrementWater, updateStreakAndProgressUI, recalculateAndSyncAll } from './pages/today.js?v=20260922d';
import { renderCustomHabits, openHabitActionPopover, closeHabitActionPopover, confirmHabitAction, openCustomHabitModal, closeCustomHabitModal, selectHabitCategory, selectHabitIcon, submitCustomHabit, quickAddHabit, deleteCustomHabit, toggleCustomHabit, openBuildRitualDrawer, closeBuildRitualDrawer, addSuggestedRitualToToday, toggleRitualCard, setActiveFilter, filterRitualsByText, toggleSuggestions, adoptRitual, openNewRitualDialog } from './pages/rituals.js?v=20260922d';
import { CALENDAR_DAYS_DATA, selectedCalendarIndex, selectCalendarDate, handleHeatmapClick, animateCounters, animateNumberValue, toggleSafeguardSwitch } from './pages/insights.js?v=20260922d';
import { initProfileState, updateAllAvatarImages, selectPresetAvatar, handleProfilePhotoUpload, previewCustomUrl, openEditProfileModal, closeEditProfileModal, saveProfileEdits, animateProfileStats, animateRelaxedCounter, exportRhythmData, triggerZenBreathBreak, openStreakModal, closeStreakModal, triggerNativeShare, copyMedalShareLink, showToast } from './pages/profile.js?v=20260922d';
import { openFocusTimer, closeFocusTimer, setTimerPreset, updateFocusTimerDisplay, syncSoundscapeUI, setSoundscapeVolume, toggleAmbientSoundscape, toggleFocusTimer, startFocusIntroSequence, startTimerCountdownEngine, resetFocusTimer, onFocusTimerComplete } from './pages/focus.js?v=20260922d';
import { 
  openMovementLogger, closeMovementLogger, setMovementTab, repeatLastWorkout, renderRepeatLastWorkoutCard,
  renderSessionExercises, addSetToExercise, updateSetField, removeSetFromExercise, removeExerciseFromSession, toggleSuperset,
  openExercisePicker, closeExercisePicker, filterExercisePickerByMuscle, renderExercisePickerList, selectExerciseFromPicker, createCustomExerciseFromPicker,
  startRestTimer, dismissRestTimer, selectMovementPacing, selectMovementFeel, saveMovementSession,
  saveCardioSession, saveCalorieIntake, renderCalorieIntakeList, deleteCalorieEntry,
  renderPersonalRecordsUI, filterPRsByMuscle
} from './pages/movement.js?v=20260922d';

// Explicitly register everything to window for inline HTML attributes (onclick, onsubmit, onchange)
Object.assign(window, {
  userState,
  focusTimerState,
  movementLogState,
  ONBOARDING_DATA,
  calculateDynamicMetrics,
  STORAGE_KEYS,
  loadPersistedState,
  saveStateToStorage,
  VIEWS,
  navigate,

  MomentumFirebase,
  openFirebaseConfigModal,
  closeFirebaseConfigModal,
  saveFirebaseConfig,
  disconnectFirebase,
  testFirestoreConnection,

  MeditativeAudio,

  MomentumAssistant,
  askAssistantChip,
  handleAssistantSubmit,
  clearAssistantChat,

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

  MomentumReminderEngine,
  dismissReminder,
  snoozeReminder,
  completeReminderHabit,

  renderHabitChart,
  updateHabitChart,
  toggleHabitCurve,

  trackMedalSheen,
  toggleMedalFlip,
  openShareModal,
  closeShareModal,
  openMilestonesDetailModal,
  closeMilestonesDetailModal,

  selectIntention,
  toggleProblem,
  advanceOnboardingStep,
  selectCompanionRitual,
  toggleCompanionPicker,
  adoptPersonalizedRitual,

  switchAuthTab,
  openAuthView,
  togglePasswordVisibility,
  showAuthFeedback,
  hideAuthFeedback,
  openForgotPasswordModal,
  closeForgotPasswordModal,
  handleSendPasswordReset,
  submitLogin,
  instantLogin,
  setupOtpView,
  initOtpInputs,
  startOtpTimer,
  resendOtp,
  submitOtp,
  signInWithGoogleFirebase,

  toggleHabit,
  toggleTodayRitual,
  incrementWater,
  updateStreakAndProgressUI,
  recalculateAndSyncAll,

  renderCustomHabits,
  openHabitActionPopover,
  closeHabitActionPopover,
  confirmHabitAction,
  openCustomHabitModal,
  closeCustomHabitModal,
  selectHabitCategory,
  selectHabitIcon,
  submitCustomHabit,
  quickAddHabit,
  deleteCustomHabit,
  toggleCustomHabit,
  openBuildRitualDrawer,
  closeBuildRitualDrawer,
  addSuggestedRitualToToday,
  toggleRitualCard,
  setActiveFilter,
  filterRitualsByText,
  toggleSuggestions,
  adoptRitual,
  openNewRitualDialog,

  CALENDAR_DAYS_DATA,
  selectedCalendarIndex,
  selectCalendarDate,
  handleHeatmapClick,
  animateCounters,
  animateNumberValue,
  toggleSafeguardSwitch,

  initProfileState,
  updateAllAvatarImages,
  selectPresetAvatar,
  handleProfilePhotoUpload,
  previewCustomUrl,
  openEditProfileModal,
  closeEditProfileModal,
  saveProfileEdits,
  animateProfileStats,
  animateRelaxedCounter,
  exportRhythmData,
  triggerZenBreathBreak,
  openStreakModal,
  closeStreakModal,
  triggerNativeShare,
  copyMedalShareLink,
  showToast,

  openFocusTimer,
  closeFocusTimer,
  setTimerPreset,
  updateFocusTimerDisplay,
  syncSoundscapeUI,
  setSoundscapeVolume,
  toggleAmbientSoundscape,
  toggleFocusTimer,
  startFocusIntroSequence,
  startTimerCountdownEngine,
  resetFocusTimer,
  onFocusTimerComplete,

  openMovementLogger,
  closeMovementLogger,
  setMovementTab,
  repeatLastWorkout,
  renderRepeatLastWorkoutCard,
  renderSessionExercises,
  addSetToExercise,
  updateSetField,
  removeSetFromExercise,
  removeExerciseFromSession,
  toggleSuperset,
  openExercisePicker,
  closeExercisePicker,
  filterExercisePickerByMuscle,
  renderExercisePickerList,
  selectExerciseFromPicker,
  createCustomExerciseFromPicker,
  startRestTimer,
  dismissRestTimer,
  selectMovementPacing,
  selectMovementFeel,
  saveMovementSession,
  saveCardioSession,
  saveCalorieIntake,
  renderCalorieIntakeList,
  deleteCalorieEntry,
  renderPersonalRecordsUI,
  filterPRsByMuscle,

  // To-Do management
  renderTodosUI,
  setTodosFilter,
  handleToggleTodoWithUndo,
  handleDeleteTodoWithUndo,
  handleQuickAddTodo,
  handleFullAddTodo
});

// ── APP BOOTSTRAPPER ──
function bootstrapApp() {
  // 1. Initialize Profile & Storage values
  initProfileState();
  renderCustomHabits();
  renderTodosUI();
  recalculateAndSyncAll(false);

  // 2. Initialize Reminders & Voice Hooks
  if (MomentumReminderEngine && typeof MomentumReminderEngine.init === 'function') {
    MomentumReminderEngine.init();
  }
  registerViewHook('voice', () => {
    if (MomentumVoiceAgent && typeof MomentumVoiceAgent.startListening === 'function') {
      setTimeout(() => MomentumVoiceAgent.startListening(), 200);
    }
  });

  // 3. Remove Loading Overlay smoothly
  setTimeout(() => {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.classList.add('exit');
      setTimeout(() => { overlay.style.display = 'none'; }, 650);
    }
  }, 900);

  // 4. Initialize Firebase & Auth Routing
  MomentumFirebase.init();

  const hash = location.hash.slice(1);
  const targetView = VIEWS[hash] ? hash : null;

  MomentumFirebase.onAuthReady(user => {
    const isGuest = localStorage.getItem('momentum_guest_session') === 'true';
    if (user || isGuest) {
      if (targetView && !VIEWS[targetView].preAuth) {
        navigate(targetView);
      } else {
        navigate('today');
      }
    } else {
      if (targetView && VIEWS[targetView].preAuth) {
        navigate(targetView);
      } else {
        navigate('welcome');
      }
    }
  });
}

// Attach lifecycle events
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrapApp);
} else {
  bootstrapApp();
}

window.addEventListener('popstate', e => {
  if (e.state && e.state.view) {
    navigate(e.state.view);
  } else if (location.hash) {
    const hash = location.hash.slice(1);
    if (VIEWS[hash]) navigate(hash);
  }
});
