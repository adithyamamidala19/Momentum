/**
 * Firebase Realtime Cloud & Authentication Service
 * Manages Firestore sync, Auth state changes, Google Auth, and config modals.
 */

import { userState } from '../state.js';
import { DEFAULT_HABITS } from '../storage.js';
import { navigate } from '../router.js';

export const MomentumFirebase = (function() {
  let isInitialized = false;
  let currentUser = null;
  let unsubscribeSnapshot = null;
  let saveDebounceTimer = null;
  let authReadyCallbacks = [];
  let isAuthReady = false;

  const DEFAULT_CONFIG = {
    apiKey: (typeof process !== 'undefined' && process.env?.VITE_FIREBASE_API_KEY) || "",
    authDomain: "momentum-11.firebaseapp.com",
    projectId: "momentum-11",
    storageBucket: "momentum-11.firebasestorage.app",
    messagingSenderId: "1023958789554",
    appId: "1:1023958789554:web:04c0f7b2a3e6cf96d048ab",
    measurementId: "G-E1PZHJJZK6"
  };

  if (typeof window !== 'undefined') {
    window.FIREBASE_CONFIG = DEFAULT_CONFIG;
  }

  function parseConfigInput(inputStr) {
    if (!inputStr || typeof inputStr !== 'string') return null;
    const clean = inputStr.trim();
    try {
      const parsed = JSON.parse(clean);
      if (parsed.apiKey && parsed.projectId) return parsed;
    } catch (e) {}

    const keys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId', 'measurementId'];
    const config = {};
    for (const k of keys) {
      const regex = new RegExp(`['"]?${k}['"]?\\s*:\\s*['"]([^'",\\s]+)['"]`);
      const match = clean.match(regex);
      if (match && match[1]) {
        config[k] = match[1];
      }
    }

    if (config.apiKey && config.projectId) {
      return config;
    }
    return null;
  }

  function getStoredConfig() {
    try {
      const stored = localStorage.getItem('momentum_firebase_config');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.apiKey && parsed.projectId) return parsed;
      }
    } catch (e) {}
    if (typeof window !== 'undefined' && window.FIREBASE_CONFIG && window.FIREBASE_CONFIG.apiKey) {
      return window.FIREBASE_CONFIG;
    }
    return DEFAULT_CONFIG;
  }

  function init(configOverride) {
    const config = configOverride || getStoredConfig();
    if (!config || !config.apiKey || !config.projectId) {
      console.log('🌱 Momentum running in Local-First (Offline/LocalStorage) mode.');
      updateUIStatus(false, 'Local Storage Mode', 'Configure Firebase for Cloud Sync');
      return false;
    }

    try {
      if (typeof firebase === 'undefined') {
        console.warn('Firebase SDK scripts not loaded yet.');
        return false;
      }

      if (firebase.apps && firebase.apps.length > 0) {
        firebase.app().delete().then(() => {
          firebase.initializeApp(config);
          setupAuthAndListeners(config);
        }).catch(err => {
          console.warn('Firebase reinit warning:', err);
        });
      } else {
        firebase.initializeApp(config);
        setupAuthAndListeners(config);
      }

      isInitialized = true;
      if (firebase.analytics) {
        try { firebase.analytics(); } catch(e) {}
      }
      localStorage.setItem('momentum_firebase_config', JSON.stringify(config));
      updateUIStatus(true, `Connected to ${config.projectId}`, 'Real-time Firestore active');
      return true;
    } catch (err) {
      console.error('Firebase initialization error:', err);
      updateUIStatus(false, 'Connection Error', err.message);
      return false;
    }
  }

  function onAuthReady(callback) {
    if (isAuthReady) {
      callback(currentUser);
    } else {
      authReadyCallbacks.push(callback);
    }
  }

  function setupAuthAndListeners(config) {
    if (!firebase.auth) return;

    firebase.auth().onAuthStateChanged(user => {
      currentUser = user;
      isAuthReady = true;

      if (user) {
        console.log('✨ Firebase Auth: User active ->', user.email || user.uid);
        localStorage.removeItem('momentum_guest_session');

        const displayName = user.displayName || (user.email ? user.email.split('@')[0] : 'Mindful Practitioner');
        userState.name = displayName;
        if (user.email) userState.email = user.email;

        // Update header and profile UI
        const headerName = document.getElementById('header-user-name');
        if (headerName) headerName.textContent = userState.name;

        const profileEmail = document.getElementById('profile-firebase-email');
        if (profileEmail) profileEmail.textContent = user.email ? `Connected: ${user.email}` : `Guest UID: ${user.uid.slice(0, 10)}...`;

        const profileUid = document.getElementById('profile-firebase-uid');
        if (profileUid) profileUid.textContent = `Firestore: users/${user.uid.slice(0, 8)}...`;

        if (user.photoURL) {
          const headerAvatar = document.getElementById('header-avatar-img');
          if (headerAvatar) headerAvatar.src = user.photoURL;
          const profileAvatar = document.getElementById('profile-avatar-img');
          if (profileAvatar) profileAvatar.src = user.photoURL;
        }

        updateUIStatus(true, `Synced: ${config ? config.projectId : 'Cloud'}`, 'Active Realtime Session');
        startFirestoreSync(user.uid);
      } else {
        console.log('ℹ️ Firebase Auth: Signed out / Guest');
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        const profileEmail = document.getElementById('profile-firebase-email');
        if (profileEmail) profileEmail.textContent = 'No account connected';
        const profileUid = document.getElementById('profile-firebase-uid');
        if (profileUid) profileUid.textContent = 'Database: Local Session';
        updateUIStatus(false, 'Local Storage Mode', 'Sign in or configure Firebase to sync');
      }

      // Fire pending auth ready callbacks
      while (authReadyCallbacks.length > 0) {
        const cb = authReadyCallbacks.shift();
        try { cb(user); } catch(e) { console.error(e); }
      }
    });
  }

  function startFirestoreSync(uid) {
    if (!firebase.firestore) return;
    const db = firebase.firestore();
    const userDocRef = db.collection('users').doc(uid);

    if (unsubscribeSnapshot) unsubscribeSnapshot();

    unsubscribeSnapshot = userDocRef.onSnapshot(doc => {
      if (doc.exists) {
        const cloudData = doc.data();
        console.log('☁️ Firestore doc retrieved:', cloudData);
        mergeCloudDataIntoUserState(cloudData);
      } else {
        console.log('🌱 Seeding fresh practitioner profile in Firestore for:', uid);
        saveUserStateDirectly(uid);
      }
    }, err => {
      console.warn('Firestore snapshot notice:', err);
    });
  }

  function mergeCloudDataIntoUserState(data) {
    if (!data) return;
    if (data.name) userState.name = data.name;
    if (data.email) userState.email = data.email;
    if (data.streakDays !== undefined) userState.streakDays = Number(data.streakDays);
    if (data.bestStreak !== undefined) userState.bestStreak = Number(data.bestStreak);
    if (data.score !== undefined) userState.score = Number(data.score);
    if (data.totalScore !== undefined) userState.totalScore = Number(data.totalScore);
    if (data.mindfulHours !== undefined) userState.mindfulHours = Number(data.mindfulHours);
    if (data.todayFocusMinutes !== undefined) userState.todayFocusMinutes = Number(data.todayFocusMinutes);
    if (data.waterGlasses !== undefined) userState.waterGlasses = Number(data.waterGlasses);
    if (Array.isArray(data.customHabits) && data.customHabits.length > 0) {
      userState.customHabits = data.customHabits;
    }
    if (Array.isArray(data.movementLogs)) {
      userState.movementLogs = data.movementLogs;
    }
    if (Array.isArray(data.todos)) {
      userState.todos = data.todos;
    }
    if (Array.isArray(data.milestones)) {
      userState.milestones = data.milestones;
    }

    // Update local cache
    try {
      localStorage.setItem('momentum_profile_name', userState.name);
      localStorage.setItem('momentum_custom_habits', JSON.stringify(userState.customHabits));
      localStorage.setItem('momentum_movement_logs', JSON.stringify(userState.movementLogs));
      localStorage.setItem('momentum_todos', JSON.stringify(userState.todos || []));
      localStorage.setItem('momentum_focus_data', JSON.stringify({
        todayFocusMinutes: userState.todayFocusMinutes,
        mindfulHours: userState.mindfulHours
      }));
      localStorage.setItem('momentum_streak_data', JSON.stringify({
        streakDays: userState.streakDays,
        bestStreak: userState.bestStreak
      }));
    } catch(e) {}

    // Refresh UI elements
    const headerName = document.getElementById('header-user-name');
    if (headerName) headerName.textContent = userState.name;
    const todayGreeting = document.getElementById('today-greeting');
    if (todayGreeting) todayGreeting.textContent = `Good morning, ${userState.name}`;

    if (typeof window.recalculateAndSyncAll === 'function') {
      window.recalculateAndSyncAll(false);
    }
    if (typeof window.renderCustomHabits === 'function') {
      window.renderCustomHabits();
    }
    if (typeof window.renderMovementLogs === 'function') {
      window.renderMovementLogs();
    }
    if (typeof window.renderTodosUI === 'function') {
      window.renderTodosUI();
    }
    if (typeof window.initProfileState === 'function') {
      window.initProfileState();
    }
  }

  function saveUserStateDirectly(uid) {
    if (!firebase.firestore || !uid) return Promise.resolve();
    const db = firebase.firestore();
    const payload = {
      name: userState.name || 'Mindful Practitioner',
      email: userState.email || '',
      phone: userState.phone || '',
      streakDays: Number(userState.streakDays) || 1,
      bestStreak: Number(userState.bestStreak) || 1,
      score: Number(userState.score) || 1625,
      totalScore: Number(userState.totalScore) || 1625,
      mindfulHours: Number(userState.mindfulHours) || 0,
      todayFocusMinutes: Number(userState.todayFocusMinutes) || 0,
      waterGlasses: Number(userState.waterGlasses) || 0,
      customHabits: userState.customHabits || DEFAULT_HABITS,
      movementLogs: userState.movementLogs || [],
      todos: userState.todos || [],
      milestones: userState.milestones || [],
      lastUpdated: new Date().toISOString()
    };

    return db.collection('users').doc(uid).set(payload, { merge: true })
      .then(() => {
        console.log('✅ Firestore sync successful for', uid);
      })
      .catch(err => {
        console.warn('Firestore write notice:', err);
      });
  }

  function queueSave() {
    if (!currentUser || !firebase.firestore) return;
    clearTimeout(saveDebounceTimer);
    saveDebounceTimer = setTimeout(() => {
      if (currentUser) saveUserStateDirectly(currentUser.uid);
    }, 600);
  }

  function updateUIStatus(isConnected, mainText, subText) {
    const badge = document.getElementById('profile-cloud-status-badge');
    if (badge) {
      if (isConnected) {
        badge.className = 'px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-600"></span><span>Cloud Synced</span>';
      } else {
        badge.className = 'px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5';
        badge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span><span>Local Mode</span>';
      }
    }

    const modalDot = document.getElementById('firebase-status-dot');
    if (modalDot) {
      modalDot.className = isConnected ? 'w-3 h-3 rounded-full bg-emerald-500' : 'w-3 h-3 rounded-full bg-amber-500';
    }

    const modalText = document.getElementById('firebase-status-text');
    if (modalText) modalText.textContent = mainText || (isConnected ? 'Cloud Synced' : 'Local Storage Mode');

    const modalSub = document.getElementById('firebase-status-sub');
    if (modalSub) modalSub.textContent = subText || (isConnected ? 'Connected to Firestore' : 'Paste config to connect');
  }

  return {
    init,
    parseConfigInput,
    getStoredConfig,
    queueSave,
    saveUserStateDirectly,
    onAuthReady,
    getCurrentUser: () => currentUser,
    isReady: () => isInitialized,
    signInAnonymously: async function() {
      if (!isInitialized) return null;
      return firebase.auth().signInAnonymously();
    },
    signInWithGoogle: async function() {
      if (!isInitialized) throw new Error('Firebase is not configured yet. Please configure your Firebase keys.');
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      return firebase.auth().signInWithPopup(provider);
    },
    signInWithEmail: async function(email, password) {
      if (!isInitialized) throw new Error('Firebase is not configured yet. Please configure your Firebase keys.');
      return firebase.auth().signInWithEmailAndPassword(email, password);
    },
    signUpWithEmail: async function(email, password, name) {
      if (!isInitialized) throw new Error('Firebase is not configured yet. Please configure your Firebase keys.');
      const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
      if (cred.user) {
        if (name) {
          await cred.user.updateProfile({ displayName: name });
        }
        userState.name = name || email.split('@')[0];
        userState.email = email;
        userState.streakDays = 1;
        userState.bestStreak = 1;
        userState.score = 1625;
        userState.totalScore = 1625;
        userState.mindfulHours = 0;
        userState.todayFocusMinutes = 0;
        userState.waterGlasses = 0;
        userState.customHabits = JSON.parse(JSON.stringify(DEFAULT_HABITS)).map(h => ({ ...h, completed: false }));
        userState.movementLogs = [];
        await saveUserStateDirectly(cred.user.uid);
      }
      return cred;
    },
    sendPasswordReset: async function(email) {
      if (!isInitialized) throw new Error('Firebase is not configured yet. Please configure your Firebase keys.');
      return firebase.auth().sendPasswordResetEmail(email);
    },
    signOut: async function() {
      if (!isInitialized) return;
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }
      return firebase.auth().signOut();
    },
    saveConfig: function(config) {
      return init(config);
    }
  };
})();

// UI Modal Handlers
export function openFirebaseConfigModal() {
  const modal = document.getElementById('modal-firebase-config');
  if (!modal) return;

  const stored = MomentumFirebase.getStoredConfig();
  const textarea = document.getElementById('fb-raw-config');
  if (textarea && stored && stored.apiKey) {
    textarea.value = JSON.stringify(stored, null, 2);
  }

  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

export function closeFirebaseConfigModal() {
  const modal = document.getElementById('modal-firebase-config');
  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
}

export function handleSaveFirebaseConfig(event) {
  if (event) event.preventDefault();
  const textarea = document.getElementById('fb-raw-config');
  const rawText = textarea ? textarea.value : '';

  const parsedConfig = MomentumFirebase.parseConfigInput(rawText);
  if (!parsedConfig) {
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Could not parse Firebase config. Please check your apiKey and projectId.');
    }
    return;
  }

  const success = MomentumFirebase.init(parsedConfig);
  if (success) {
    if (typeof window.showToast === 'function') {
      window.showToast('🔥 Connected to Firebase Firestore successfully!');
    }
    closeFirebaseConfigModal();
  } else {
    if (typeof window.showToast === 'function') {
      window.showToast('⚠️ Initialization issue. Check console for details.');
    }
  }
}

export function clearFirebaseConfig() {
  localStorage.removeItem('momentum_firebase_config');
  MomentumFirebase.init({ apiKey: '', projectId: '' });
  const textarea = document.getElementById('fb-raw-config');
  if (textarea) textarea.value = '';
  if (typeof window.showToast === 'function') {
    window.showToast('🌱 Reset to Local-First offline mode.');
  }
  closeFirebaseConfigModal();
}

export function testFirebaseConnection() {
  if (!MomentumFirebase.isReady()) {
    if (typeof window.showToast === 'function') {
      window.showToast('🟡 In Local Mode. Paste your Firebase Config below to connect.');
    }
    return;
  }
  const user = MomentumFirebase.getCurrentUser();
  if (user) {
    MomentumFirebase.saveUserStateDirectly(user.uid)
      .then(() => {
        if (typeof window.showToast === 'function') {
          window.showToast(`✅ Firebase Firestore test sync successful for ${user.email || 'guest'}!`);
        }
      })
      .catch(err => {
        if (typeof window.showToast === 'function') {
          window.showToast(`⚠️ Firestore Sync warning: ${err.message}`);
        }
      });
  } else {
    if (typeof window.showToast === 'function') {
      window.showToast('✅ Firebase SDK initialized and ready for Sign-In.');
    }
  }
}

export function syncFirebaseNow() {
  if (!MomentumFirebase.isReady()) {
    openFirebaseConfigModal();
    if (typeof window.showToast === 'function') {
      window.showToast('ℹ️ Please configure your Firebase keys to enable Cloud Sync.');
    }
    return;
  }
  const user = MomentumFirebase.getCurrentUser();
  if (user) {
    MomentumFirebase.saveUserStateDirectly(user.uid)
      .then(() => {
        if (typeof window.showToast === 'function') {
          window.showToast('☁️ Rhythm data synced to Firestore!');
        }
      })
      .catch(err => {
        if (typeof window.showToast === 'function') {
          window.showToast(`⚠️ Cloud sync error: ${err.message}`);
        }
      });
  } else {
    if (typeof window.showToast === 'function') {
      window.showToast('ℹ️ Sign in or click Instant Access to link your cloud session.');
    }
  }
}

export function signOutUser() {
  const doSignOut = async () => {
    localStorage.removeItem('momentum_guest_session');
    if (MomentumFirebase && MomentumFirebase.isReady()) {
      try {
        await MomentumFirebase.signOut();
      } catch (e) {
        console.warn('Sign out warning:', e);
      }
    }
    // Reset user state to clean defaults
    userState.name = 'Practitioner';
    userState.email = '';
    userState.streakDays = 1;
    userState.score = 1625;
    userState.waterGlasses = 0;
    userState.todayFocusMinutes = 0;
    userState.customHabits = JSON.parse(JSON.stringify(DEFAULT_HABITS)).map(h => ({ ...h, completed: false }));
    userState.movementLogs = [];

    const headerName = document.getElementById('header-user-name');
    if (headerName) headerName.textContent = 'Practitioner';
    const profileEmail = document.getElementById('profile-firebase-email');
    if (profileEmail) profileEmail.textContent = 'No account connected';
    const profileUid = document.getElementById('profile-firebase-uid');
    if (profileUid) profileUid.textContent = 'Database: Local Session';

    navigate('welcome');
    if (typeof window.showToast === 'function') {
      window.showToast('🌱 Signed out successfully. Have a mindful day.');
    }
  };

  if (typeof window.showBreathingLoader === 'function') {
    window.showBreathingLoader('Signing out...', doSignOut);
  } else {
    doSignOut();
  }
}

export async function signInWithGoogleFirebase() {
  if (!MomentumFirebase.isReady()) {
    openFirebaseConfigModal();
    if (typeof window.showToast === 'function') {
      window.showToast('ℹ️ Please configure your Firebase keys to enable Google Sign-In.');
    }
    return;
  }

  const doGoogleAuth = async () => {
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
      if (typeof window.showAuthFeedback === 'function') {
        window.showAuthFeedback(window.formatAuthError ? window.formatAuthError(err) : err.message, 'error');
      }
      if (typeof window.showToast === 'function') {
        window.showToast(`⚠️ ${window.formatAuthError ? window.formatAuthError(err) : err.message}`);
      }
    }
  };

  if (typeof window.showBreathingLoader === 'function') {
    window.showBreathingLoader('Connecting with Google...', doGoogleAuth);
  } else {
    doGoogleAuth();
  }
}

export const saveFirebaseConfig = handleSaveFirebaseConfig;
export const disconnectFirebase = clearFirebaseConfig;
export const testFirestoreConnection = testFirebaseConnection;

// Global window exposure
if (typeof window !== 'undefined') {
  window.MomentumFirebase = MomentumFirebase;
  window.openFirebaseConfigModal = openFirebaseConfigModal;
  window.closeFirebaseConfigModal = closeFirebaseConfigModal;
  window.handleSaveFirebaseConfig = handleSaveFirebaseConfig;
  window.saveFirebaseConfig = saveFirebaseConfig;
  window.clearFirebaseConfig = clearFirebaseConfig;
  window.disconnectFirebase = disconnectFirebase;
  window.testFirebaseConnection = testFirebaseConnection;
  window.testFirestoreConnection = testFirestoreConnection;
  window.syncFirebaseNow = syncFirebaseNow;
  window.signOutUser = signOutUser;
  window.signInWithGoogleFirebase = signInWithGoogleFirebase;
}
