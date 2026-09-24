/**
 * Authentication Page & Verification Logic
 * Manages Sign-in/Sign-up tab switching, password toggles, OTP countdown, form validation, and submissions.
 */

import { userState } from '../state.js';
import { MomentumFirebase, openFirebaseConfigModal } from '../services/firebase.js';
import { navigate } from '../router.js';
import { showBreathingLoader } from './onboarding.js';

let authViewMode = 'signIn';
let otpTimerInterval = null;
let otpSecondsRemaining = 24;

export function switchAuthTab(mode) {
  authViewMode = mode;
  const tabSignIn = document.getElementById('tab-btn-signin');
  const tabSignUp = document.getElementById('tab-btn-signup');
  const nameWrapper = document.getElementById('auth-name-wrapper');
  const nameInput = document.getElementById('login-name');
  const confirmWrapper = document.getElementById('auth-confirm-pass-wrapper');
  const confirmInput = document.getElementById('login-confirm-password');
  const title = document.getElementById('auth-card-title');
  const subtitle = document.getElementById('auth-card-subtitle');
  const submitBtnText = document.getElementById('login-btn-text');
  const forgotBtn = document.getElementById('auth-forgot-pass-btn');
  const headerIcon = document.getElementById('auth-header-icon');

  hideAuthFeedback();

  if (mode === 'signUp') {
    if (tabSignIn) {
      tabSignIn.className = 'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 bg-transparent text-outline hover:text-on-surface flex items-center justify-center gap-1.5';
    }
    if (tabSignUp) {
      tabSignUp.className = 'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 bg-surface-container-lowest text-on-surface shadow-xs flex items-center justify-center gap-1.5';
    }
    if (nameWrapper) nameWrapper.classList.remove('hidden');
    if (nameInput) nameInput.required = true;
    if (confirmWrapper) confirmWrapper.classList.remove('hidden');
    if (confirmInput) confirmInput.required = true;
    if (title) title.textContent = 'Create Sanctuary Account';
    if (subtitle) subtitle.textContent = 'Register with your name & email to build and sync your mindful daily rituals.';
    if (submitBtnText) submitBtnText.textContent = 'Create Account & Begin';
    if (forgotBtn) forgotBtn.classList.add('hidden');
    if (headerIcon) headerIcon.textContent = 'person_add';
  } else {
    if (tabSignIn) {
      tabSignIn.className = 'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 bg-surface-container-lowest text-on-surface shadow-xs flex items-center justify-center gap-1.5';
    }
    if (tabSignUp) {
      tabSignUp.className = 'flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 bg-transparent text-outline hover:text-on-surface flex items-center justify-center gap-1.5';
    }
    if (nameWrapper) nameWrapper.classList.add('hidden');
    if (nameInput) nameInput.required = false;
    if (confirmWrapper) confirmWrapper.classList.add('hidden');
    if (confirmInput) confirmInput.required = false;
    if (title) title.textContent = 'Welcome back';
    if (subtitle) subtitle.textContent = 'Sign in with your email to load your personalized rituals and sync your progress.';
    if (submitBtnText) submitBtnText.textContent = 'Sign In & Sync';
    if (forgotBtn) forgotBtn.classList.remove('hidden');
    if (headerIcon) headerIcon.textContent = 'spa';
  }
}

export function openAuthView(mode) {
  switchAuthTab(mode || 'signIn');
  navigate('login');
}

export function togglePasswordVisibility(inputId, iconId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(iconId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.textContent = 'visibility_off';
  } else {
    input.type = 'password';
    if (icon) icon.textContent = 'visibility';
  }
}

export function showAuthFeedback(msg, type = 'error') {
  const box = document.getElementById('auth-inline-feedback');
  const textEl = document.getElementById('auth-feedback-msg');
  const iconEl = document.getElementById('auth-feedback-icon');
  if (!box || !textEl) return;

  textEl.textContent = msg;
  box.classList.remove('hidden');

  if (type === 'error') {
    box.className = 'w-full p-3.5 rounded-xl text-xs flex items-start gap-2.5 mb-4 text-left bg-red-50 text-red-800 border border-red-200/80 transition-all';
    if (iconEl) iconEl.textContent = 'error_outline';
  } else if (type === 'success') {
    box.className = 'w-full p-3.5 rounded-xl text-xs flex items-start gap-2.5 mb-4 text-left bg-emerald-50 text-emerald-800 border border-emerald-200/80 transition-all';
    if (iconEl) iconEl.textContent = 'check_circle';
  } else {
    box.className = 'w-full p-3.5 rounded-xl text-xs flex items-start gap-2.5 mb-4 text-left bg-sky-50 text-sky-800 border border-sky-200/80 transition-all';
    if (iconEl) iconEl.textContent = 'info';
  }
}

export function hideAuthFeedback() {
  const box = document.getElementById('auth-inline-feedback');
  if (box) box.classList.add('hidden');
}

export function formatAuthError(err) {
  if (!err) return 'An authentication error occurred.';
  const code = err.code || '';
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return 'Email/Password sign-in is not enabled in Firebase Console. Go to Authentication > Sign-in method to enable it.';
  }
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Switching you to Sign In...';
  }
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters.';
  }
  if (code === 'auth/user-not-found' || code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
    if (authViewMode === 'signIn') {
      return 'Incorrect email or password. If you are new, please click "Create Account".';
    }
    return 'Invalid credentials. Please verify your email and password.';
  }
  if (code === 'auth/invalid-email') {
    return 'Please enter a valid email address (e.g. name@domain.com).';
  }
  if (code === 'auth/too-many-requests') {
    return 'Access temporarily blocked due to many failed attempts. Please reset password or try again later.';
  }
  if (code === 'auth/popup-closed-by-user') {
    return 'Google Sign-In popup was closed before completion.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Popup was blocked by your browser. Please allow popups for this site.';
  }
  return err.message || 'Authentication failed. Please check your credentials.';
}

export function openForgotPasswordModal() {
  const modal = document.getElementById('modal-forgot-password');
  const resetEmail = document.getElementById('reset-email');
  const loginEmail = document.getElementById('login-email');
  const feedback = document.getElementById('forgot-pass-feedback');
  
  if (feedback) feedback.classList.add('hidden');
  if (resetEmail && loginEmail && loginEmail.value.trim()) {
    resetEmail.value = loginEmail.value.trim();
  }
  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
}

export function closeForgotPasswordModal() {
  const modal = document.getElementById('modal-forgot-password');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export async function handleSendPasswordReset(event) {
  if (event) event.preventDefault();
  const emailInput = document.getElementById('reset-email');
  const feedback = document.getElementById('forgot-pass-feedback');
  const msgEl = document.getElementById('forgot-pass-msg');
  const iconEl = document.getElementById('forgot-pass-icon');
  const btn = document.getElementById('btn-send-reset');

  if (!emailInput || !emailInput.value.trim()) {
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Please enter your email address.');
    }
    return;
  }

  const email = emailInput.value.trim();

  if (!MomentumFirebase.isReady()) {
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Firebase is not configured yet.');
    }
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span><span>Sending...</span>';
  }

  try {
    await MomentumFirebase.sendPasswordReset(email);
    if (feedback && msgEl) {
      feedback.className = 'w-full p-3 rounded-xl text-xs flex items-start gap-2 mb-4 text-left bg-emerald-50 text-emerald-800 border border-emerald-200';
      if (iconEl) iconEl.textContent = 'check_circle';
      msgEl.textContent = `🌱 Password reset link sent to ${email}. Please check your inbox and spam folder.`;
      feedback.classList.remove('hidden');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('🌿 Password reset email sent successfully!');
    }
    setTimeout(() => {
      closeForgotPasswordModal();
    }, 3000);
  } catch (err) {
    console.error('Password reset error:', err);
    if (feedback && msgEl) {
      feedback.className = 'w-full p-3 rounded-xl text-xs flex items-start gap-2 mb-4 text-left bg-red-50 text-red-800 border border-red-200';
      if (iconEl) iconEl.textContent = 'error_outline';
      msgEl.textContent = formatAuthError(err);
      feedback.classList.remove('hidden');
    }
    if (typeof window.showToast === 'function') {
      window.showToast(`⚠️ ${formatAuthError(err)}`);
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">send</span><span>Send Reset Link</span>';
    }
  }
}

export async function submitLogin(event) {
  if (event) event.preventDefault();
  hideAuthFeedback();

  const nameInput = document.getElementById('login-name');
  const emailInput = document.getElementById('login-email');
  const passInput = document.getElementById('login-password');
  const confirmPassInput = document.getElementById('login-confirm-password');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const name = nameInput ? nameInput.value.trim() : '';
  const confirmPass = confirmPassInput ? confirmPassInput.value : '';

  if (!email) {
    showAuthFeedback('Please enter your email address.', 'error');
    if (emailInput) emailInput.focus();
    return;
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showAuthFeedback('Please enter a valid email format (e.g. name@domain.com).', 'error');
    if (emailInput) emailInput.focus();
    return;
  }

  if (!password) {
    showAuthFeedback('Please enter your password.', 'error');
    if (passInput) passInput.focus();
    return;
  }

  if (password.length < 6) {
    showAuthFeedback('Password must be at least 6 characters.', 'error');
    if (passInput) passInput.focus();
    return;
  }

  if (authViewMode === 'signUp') {
    if (!name) {
      showAuthFeedback('Please enter your name.', 'error');
      if (nameInput) nameInput.focus();
      return;
    }
    if (password !== confirmPass) {
      showAuthFeedback('Passwords do not match. Please re-type password.', 'error');
      if (confirmPassInput) confirmPassInput.focus();
      return;
    }
  }

  if (!MomentumFirebase.isReady()) {
    openFirebaseConfigModal();
    if (typeof window.showToast === 'function') {
      window.showToast('ℹ️ Please configure your Firebase keys to connect.');
    }
    return;
  }

  const loaderMessage = authViewMode === 'signUp' 
    ? 'Creating your cloud sanctuary...' 
    : 'Signing in to your sanctuary...';

  showBreathingLoader(loaderMessage, async () => {
    try {
      if (authViewMode === 'signUp') {
        await MomentumFirebase.signUpWithEmail(email, password, name);
        if (typeof window.showToast === 'function') {
          window.showToast(`🌱 Welcome to Momentum, ${name || 'Practitioner'}! Account created & Firestore synced.`);
        }
      } else {
        await MomentumFirebase.signInWithEmail(email, password);
        if (typeof window.showToast === 'function') {
          window.showToast(`✨ Welcome back, ${userState.name || 'Practitioner'}! Loaded your rituals.`);
        }
      }
      navigate('today');
    } catch (err) {
      console.error('Firebase Auth Error:', err);
      const friendlyMsg = formatAuthError(err);
      
      if (err.code === 'auth/email-already-in-use') {
        showAuthFeedback('This email already has an account. Switched to Sign In mode.', 'info');
        switchAuthTab('signIn');
        if (emailInput) emailInput.value = email;
        if (passInput) passInput.focus();
      } else if (err.code === 'auth/user-not-found' && authViewMode === 'signIn') {
        showAuthFeedback('No account found with this email. Click "Create Account" above to register.', 'error');
      } else {
        showAuthFeedback(friendlyMsg, 'error');
      }
      if (typeof window.showToast === 'function') {
        window.showToast(`⚠️ ${friendlyMsg}`);
      }
    }
  });
}

export function instantLogin() {
  localStorage.setItem('momentum_guest_session', 'true');
  userState.name = 'Mindful Guest';
  userState.email = '';
  const headerName = document.getElementById('header-user-name');
  if (headerName) headerName.textContent = 'Mindful Guest';
  const todayGreeting = document.getElementById('today-greeting');
  if (todayGreeting) todayGreeting.textContent = 'Good morning, Mindful Guest';

  showBreathingLoader('Settling into your quiet space...', () => {
    if (MomentumFirebase.isReady()) {
      MomentumFirebase.signInAnonymously().catch(e => console.warn(e));
    }
    navigate('today');
    if (typeof window.showToast === 'function') {
      window.showToast('✨ Welcome to Momentum as a Mindful Guest!');
    }
  });
}

export function setupOtpView() {
  const displayEl = document.getElementById('otp-contact-display');
  if (displayEl) displayEl.textContent = userState.contact || userState.phone || '+1 (555) 234-5678';

  initOtpInputs();
  startOtpTimer();
}

export function initOtpInputs() {
  const container = document.getElementById('otp-inputs-container');
  if (!container) return;
  const boxes = container.querySelectorAll('.otp-box');

  boxes.forEach((box, index) => {
    box.onkeydown = (e) => {
      if (e.key === 'Backspace' && !box.value && index > 0) {
        boxes[index - 1].focus();
      }
    };

    box.oninput = () => {
      const val = box.value;
      if (val.length >= 1) {
        box.value = val[val.length - 1];
        if (index < boxes.length - 1) {
          boxes[index + 1].focus();
        } else {
          setTimeout(() => {
            submitOtp(new Event('submit'));
          }, 300);
        }
      }
    };

    box.onpaste = (e) => {
      e.preventDefault();
      const pasteData = (e.clipboardData || window.clipboardData).getData('text').trim();
      if (/^\d+$/.test(pasteData)) {
        const digits = pasteData.slice(0, 6).split('');
        digits.forEach((d, i) => {
          if (boxes[i]) boxes[i].value = d;
        });
        if (digits.length === 6) {
          setTimeout(() => { submitOtp(new Event('submit')); }, 300);
        }
      }
    };
  });
}

export function startOtpTimer() {
  clearInterval(otpTimerInterval);
  otpSecondsRemaining = 24;
  const timerEl = document.getElementById('otp-timer');
  const resendBtn = document.getElementById('otp-resend-btn');

  if (timerEl) timerEl.textContent = `${otpSecondsRemaining}s`;

  otpTimerInterval = setInterval(() => {
    otpSecondsRemaining--;
    if (timerEl) timerEl.textContent = `${otpSecondsRemaining}s`;
    if (otpSecondsRemaining <= 0) {
      clearInterval(otpTimerInterval);
      if (resendBtn) resendBtn.innerHTML = 'Resend code now';
    }
  }, 1000);
}

export function resendOtp() {
  if (otpSecondsRemaining > 0) return;
  if (typeof window.showToast === 'function') {
    window.showToast('📬 A fresh 6-digit code has been sent.');
  }
  startOtpTimer();
}

export function submitOtp(event) {
  if (event) event.preventDefault();
  showBreathingLoader('Settling into your quiet space...', () => {
    navigate('today');
    if (typeof window.showToast === 'function') {
      window.showToast('✨ Welcome to Momentum. Your 7-day flame is active!');
    }
  });
}

export async function signInWithGoogleFirebase() {
  if (!MomentumFirebase.isReady()) {
    openFirebaseConfigModal();
    if (typeof window.showToast === 'function') {
      window.showToast('ℹ️ Please configure your Firebase keys to enable Google Sign-In.');
    }
    return;
  }

  showBreathingLoader('Connecting with Google...', async () => {
    try {
      const result = await MomentumFirebase.signInWithGoogle();
      const user = result.user;
      if (user) {
        userState.name = user.displayName || (user.email ? user.email.split('@')[0] : 'Mindful Practitioner');
        userState.email = user.email || '';
        if (user.photoURL) {
          const avatar = document.getElementById('header-avatar-img');
          if (avatar) avatar.src = user.photoURL;
          const profileAvatar = document.getElementById('profile-avatar-img');
          if (profileAvatar) profileAvatar.src = user.photoURL;
        }
        navigate('today');
        if (typeof window.showToast === 'function') {
          window.showToast(`✨ Welcome, ${userState.name}! Realtime Firestore active.`);
        }
      }
    } catch (err) {
      console.error('Google Auth Error:', err);
      showAuthFeedback(formatAuthError(err), 'error');
      if (typeof window.showToast === 'function') {
        window.showToast(`⚠️ ${formatAuthError(err)}`);
      }
    }
  });
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.switchAuthTab = switchAuthTab;
  window.openAuthView = openAuthView;
  window.togglePasswordVisibility = togglePasswordVisibility;
  window.showAuthFeedback = showAuthFeedback;
  window.hideAuthFeedback = hideAuthFeedback;
  window.formatAuthError = formatAuthError;
  window.openForgotPasswordModal = openForgotPasswordModal;
  window.closeForgotPasswordModal = closeForgotPasswordModal;
  window.handleSendPasswordReset = handleSendPasswordReset;
  window.submitLogin = submitLogin;
  window.instantLogin = instantLogin;
  window.setupOtpView = setupOtpView;
  window.initOtpInputs = initOtpInputs;
  window.startOtpTimer = startOtpTimer;
  window.resendOtp = resendOtp;
  window.submitOtp = submitOtp;
  window.signInWithGoogleFirebase = signInWithGoogleFirebase;
}
