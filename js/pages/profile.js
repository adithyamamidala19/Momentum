// ═══════════════════════════════════════════════════════
// MOMENTUM — PROFILE CONTROLLER, AVATAR, & ZEN TOOLS
// ═══════════════════════════════════════════════════════

import { userState } from '../state.js';

export let pendingAvatarUrl = '';

export function showToast(message) {
  let toast = document.getElementById('app-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'app-toast';
    toast.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 z-[10000] px-4 py-2.5 rounded-full bg-inverse-surface text-inverse-on-surface text-xs font-medium shadow-2xl flex items-center gap-2 transition-all duration-300 opacity-0 pointer-events-none translate-y-2';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.remove('opacity-0', 'translate-y-2', 'pointer-events-none');
  toast.classList.add('opacity-100', 'translate-y-0');

  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => {
    toast.classList.add('opacity-0', 'translate-y-2', 'pointer-events-none');
    toast.classList.remove('opacity-100', 'translate-y-0');
  }, 2600);
}

export function initProfileState() {
  const savedName = localStorage.getItem('momentum_profile_name') || userState.name || 'Adithya';
  const savedMantra = localStorage.getItem('momentum_profile_mantra') || userState.mantra || 'Stillness in motion, steady progress.';
  const savedPhoto = localStorage.getItem('momentum_profile_photo') || userState.avatarUrl;

  const displayEl = document.getElementById('profile-name-display');
  const mantraEl = document.getElementById('profile-mantra-display');
  const greetingEl = document.getElementById('today-greeting');
  const headerNameEl = document.getElementById('header-user-name');

  if (displayEl) displayEl.textContent = savedName;
  if (mantraEl) mantraEl.textContent = `“${savedMantra}”`;
  if (greetingEl) greetingEl.textContent = `Good morning, ${savedName}`;
  if (headerNameEl) headerNameEl.textContent = savedName.split(' ')[0];

  if (savedPhoto) {
    updateAllAvatarImages(savedPhoto);
  }
}

export function updateAllAvatarImages(url) {
  if (!url) return;
  const headerAvatar = document.getElementById('header-avatar-img');
  const profileAvatar = document.getElementById('profile-avatar-img');
  const editPreviewAvatar = document.getElementById('edit-profile-preview-img');
  
  if (headerAvatar) headerAvatar.src = url;
  if (profileAvatar) profileAvatar.src = url;
  if (editPreviewAvatar) editPreviewAvatar.src = url;
}

export function selectPresetAvatar(btn, url) {
  pendingAvatarUrl = url;
  const modalPreviewImg = document.getElementById('edit-profile-preview-img');
  if (modalPreviewImg) modalPreviewImg.src = url;

  document.querySelectorAll('.avatar-preset-pill').forEach(b => b.classList.remove('active-preset'));
  if (btn) btn.classList.add('active-preset');
}

export function handleProfilePhotoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  if (file.size > 2 * 1024 * 1024) {
    showToast('⚠️ Image size exceeds 2MB limit.');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(evt) {
    const dataUrl = evt.target.result;
    pendingAvatarUrl = dataUrl;
    const modalPreviewImg = document.getElementById('edit-profile-preview-img');
    if (modalPreviewImg) modalPreviewImg.src = dataUrl;
    
    document.querySelectorAll('.avatar-preset-pill').forEach(b => b.classList.remove('active-preset'));
    showToast('📸 Custom image loaded into preview!');
  };
  reader.readAsDataURL(file);
}

export function previewCustomUrl(url) {
  if (!url || !url.trim()) return;
  pendingAvatarUrl = url.trim();
  const modalPreviewImg = document.getElementById('edit-profile-preview-img');
  if (modalPreviewImg) modalPreviewImg.src = url.trim();
  document.querySelectorAll('.avatar-preset-pill').forEach(b => b.classList.remove('active-preset'));
}

export function openEditProfileModal() {
  const modal = document.getElementById('edit-profile-modal');
  const backdrop = document.getElementById('edit-profile-backdrop');
  
  const currentImg = document.getElementById('profile-avatar-img');
  const modalPreviewImg = document.getElementById('edit-profile-preview-img');
  if (currentImg && modalPreviewImg) {
    modalPreviewImg.src = currentImg.src;
    pendingAvatarUrl = currentImg.src;
  }

  const nameEl = document.getElementById('profile-name-display');
  const mantraEl = document.getElementById('profile-mantra-display');
  const nameInput = document.getElementById('edit-profile-name-input');
  const mantraInput = document.getElementById('edit-profile-mantra-input');
  if (nameEl && nameInput) nameInput.value = nameEl.textContent.trim();
  if (mantraEl && mantraInput) mantraInput.value = mantraEl.textContent.replace(/^[“"]|[”"]$/g, '').trim();

  if (backdrop) backdrop.classList.add('active');
  if (modal) modal.classList.add('active');
}

export function closeEditProfileModal() {
  const modal = document.getElementById('edit-profile-modal');
  const backdrop = document.getElementById('edit-profile-backdrop');
  if (modal) modal.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
}

export function saveProfileEdits(e) {
  if (e) e.preventDefault();
  const nameInput = document.getElementById('edit-profile-name-input');
  const mantraInput = document.getElementById('edit-profile-mantra-input');
  
  let newName = '';
  if (nameInput && nameInput.value.trim()) {
    newName = nameInput.value.trim();
    const displayEl = document.getElementById('profile-name-display');
    const welcomeEl = document.getElementById('welcome-user-display');
    const greetingEl = document.getElementById('today-greeting');
    const headerNameEl = document.getElementById('header-user-name');
    if (displayEl) displayEl.textContent = newName;
    if (welcomeEl) welcomeEl.textContent = `Welcome, ${newName}`;
    if (greetingEl) greetingEl.textContent = `Good morning, ${newName}`;
    if (headerNameEl) headerNameEl.textContent = newName.split(' ')[0];
    localStorage.setItem('momentum_profile_name', newName);
  }

  if (mantraInput && mantraInput.value.trim()) {
    const newMantra = mantraInput.value.trim();
    const mantraEl = document.getElementById('profile-mantra-display');
    if (mantraEl) mantraEl.textContent = `“${newMantra}”`;
    localStorage.setItem('momentum_profile_mantra', newMantra);
  }

  if (pendingAvatarUrl) {
    updateAllAvatarImages(pendingAvatarUrl);
    localStorage.setItem('momentum_profile_photo', pendingAvatarUrl);
    pendingAvatarUrl = '';
  }

  closeEditProfileModal();
  showToast('✨ Profile preferences updated!');
  
  // Trigger soothing number counter re-animation
  setTimeout(() => animateProfileStats(1600), 200);
}

export function animateProfileStats(duration = 2000) {
  const profileView = document.getElementById('view-profile');
  if (!profileView) return;

  const ritualsEl = document.getElementById('stat-completed-rituals');
  if (ritualsEl) {
    animateRelaxedCounter(ritualsEl, 0, 142, duration, (val) => `${Math.round(val)}`);
  }

  const hoursEl = document.getElementById('stat-mindful-hours');
  if (hoursEl) {
    animateRelaxedCounter(hoursEl, 0, 38, duration, (val) => `${Math.round(val)}`);
  }

  const streakEl = document.getElementById('stat-longest-streak');
  if (streakEl) {
    animateRelaxedCounter(streakEl, 0, 28, duration, (val) => `${Math.round(val)}`);
  }
}

export function animateRelaxedCounter(element, startVal, endVal, duration, formatter) {
  if (!element) return;
  element.classList.remove('number-pulse-settle');
  const startTime = performance.now();

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3.5);
    const currentVal = startVal + (endVal - startVal) * ease;

    element.textContent = formatter ? formatter(currentVal) : Math.round(currentVal);

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = formatter ? formatter(endVal) : endVal;
      element.classList.add('number-pulse-settle');
    }
  }
  requestAnimationFrame(step);
}

export function exportRhythmData() {
  const rhythmData = {
    user: document.getElementById('profile-name-display')?.textContent || 'Adithya',
    tenure: 'Practicing since October 2024',
    streak: 7,
    adherence: '94%',
    practices: 100,
    exportTimestamp: new Date().toISOString()
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(rhythmData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", "momentum_rhythm_backup.json");
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  showToast('📥 Rhythm journal downloaded successfully!');
}

export const ZEN_QUOTES = [
  "“Breathe in calm. Exhale hurry.”",
  "“Nature does not hurry, yet everything is accomplished.”",
  "“Peace comes from within. Do not seek it without.”",
  "“In the midst of movement and chaos, keep stillness inside of you.”",
  "“Quiet minds cannot be perplexed or frightened.”"
];

export function triggerZenBreathBreak() {
  const loader = document.getElementById('relaxing-welcome-loader');
  const quoteEl = document.getElementById('relaxing-welcome-quote');
  const subtextEl = document.getElementById('relaxing-welcome-subtext');
  const barEl = document.getElementById('welcome-progress-bar');
  
  if (!loader) return;

  if (quoteEl) {
    quoteEl.textContent = ZEN_QUOTES[Math.floor(Math.random() * ZEN_QUOTES.length)];
  }
  if (subtextEl) {
    subtextEl.textContent = "Take a gentle, unhurried breath with the rhythm...";
  }

  loader.style.display = 'flex';
  loader.classList.remove('hidden-loader');
  loader.style.opacity = '1';
  loader.style.pointerEvents = 'auto';

  if (barEl) {
    barEl.style.transition = 'none';
    barEl.style.width = '0%';
    setTimeout(() => {
      barEl.style.transition = 'width 4.5s cubic-bezier(0.25, 1, 0.5, 1)';
      barEl.style.width = '100%';
    }, 50);
  }

  setTimeout(() => {
    loader.style.opacity = '0';
    loader.style.pointerEvents = 'none';
    setTimeout(() => {
      loader.classList.add('hidden-loader');
      loader.style.display = 'none';
      showToast('🌿 Mindful breath complete. Centered and clear.');
    }, 650);
  }, 4800);
}

export function openStreakModal() {
  showToast('🔥 12-day rhythm active! Best streak: 24 days.');
  if (window.navigate) window.navigate('insights');
}

export function closeStreakModal() {
  const modal = document.getElementById('streak-details-modal');
  const backdrop = document.getElementById('streak-modal-backdrop');
  if (modal) modal.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
}

export function triggerNativeShare() {
  if (navigator.share) {
    navigator.share({
      title: 'Momentum Milestone Medal',
      text: 'I reached a new mindful practice milestone on Momentum!',
      url: window.location.href
    }).catch(() => {});
  } else {
    copyMedalShareLink();
  }
}

export function copyMedalShareLink() {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(window.location.href);
  }
  showToast('Milestone link copied to clipboard.');
}

// Bind to window for HTML inline handlers
window.showToast = showToast;
window.initProfileState = initProfileState;
window.updateAllAvatarImages = updateAllAvatarImages;
window.selectPresetAvatar = selectPresetAvatar;
window.handleProfilePhotoUpload = handleProfilePhotoUpload;
window.previewCustomUrl = previewCustomUrl;
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.saveProfileEdits = saveProfileEdits;
window.animateProfileStats = animateProfileStats;
window.animateRelaxedCounter = animateRelaxedCounter;
window.exportRhythmData = exportRhythmData;
window.triggerZenBreathBreak = triggerZenBreathBreak;
window.openStreakModal = openStreakModal;
window.closeStreakModal = closeStreakModal;
window.triggerNativeShare = triggerNativeShare;
window.copyMedalShareLink = copyMedalShareLink;
