// ═══════════════════════════════════════════════════════
// MOMENTUM — RITUALS PAGE CONTROLLER & HABIT ACTIONS
// ═══════════════════════════════════════════════════════

import { userState, ONBOARDING_DATA } from '../state.js';
import { saveStateToStorage } from '../storage.js';
import { recalculateAndSyncAll, updateStreakAndProgressUI } from './today.js';
import { showToast } from './profile.js';

export let editingHabitId = null;
export let selectedHabitCategory = 'Health';
export let selectedHabitIcon = 'spa';
export let activeActionHabitId = null;

export function renderCustomHabits() {
  const container = document.getElementById('custom-habits-container');
  if (!container) return;
  container.innerHTML = '';

  if (!userState.customHabits || userState.customHabits.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-2xl bg-surface-container-low text-center text-xs text-outline hairline">
        No daily practices yet. Click "+ Add Habit" to build your rhythm.
      </div>
    `;
    return;
  }

  userState.customHabits.forEach(habit => {
    const card = document.createElement('div');
    const colorClass = habit.color === 'emerald' ? 'bg-primary-container/40 text-primary' :
                       habit.color === 'teal' ? 'bg-teal-500/10 text-teal-700' :
                       habit.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-700' : 'bg-amber-500/10 text-amber-700';

    const isSkipped = habit.skipped;

    card.className = 'group flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container hairline transition-all';
    card.innerHTML = `
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[18px]">${habit.icon || 'spa'}</span>
        </div>
        <div class="flex flex-col min-w-0">
          <span class="font-headline-sm text-sm font-medium ${habit.completed ? 'line-through text-outline' : isSkipped ? 'italic text-amber-700' : 'text-on-surface'} truncate">
            ${habit.title} ${isSkipped ? '<span class="text-[10px] uppercase font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">Rest</span>' : ''}
          </span>
          <span class="font-body-sm text-[11px] text-outline truncate">
            ${habit.anchor ? 'Anchor: ' + habit.anchor : (habit.subtitle || 'Daily rhythm')}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <!-- Edit Habit Button -->
        <button onclick="openCustomHabitModal('${habit.id}')" title="Edit habit" class="w-8 h-8 rounded-full text-outline hover:text-primary hover:bg-surface-container-high flex items-center justify-center cursor-pointer border-0 bg-transparent opacity-60 hover:opacity-100 transition-all" type="button">
          <span class="material-symbols-outlined text-[17px]">edit</span>
        </button>
        <!-- Delete Habit Button -->
        <button onclick="deleteCustomHabit('${habit.id}')" title="Remove habit" class="w-8 h-8 rounded-full text-outline hover:text-error hover:bg-error/10 flex items-center justify-center cursor-pointer border-0 bg-transparent opacity-60 hover:opacity-100 transition-all" type="button">
          <span class="material-symbols-outlined text-[17px]">delete</span>
        </button>
        <!-- Interactive Check / Tick Button opening Action Menu -->
        <button onclick="openHabitActionPopover('${habit.id}')" aria-label="Mark habit options" title="Mark habit status" class="ritual-toggle w-7 h-7 rounded-full border ${habit.completed ? 'bg-primary text-on-primary border-primary shadow-xs' : isSkipped ? 'bg-amber-100 text-amber-800 border-amber-300' : 'border-outline hover:border-primary bg-transparent'} flex items-center justify-center cursor-pointer transition-all active:scale-90" type="button">
          ${habit.completed ? '<span class="material-symbols-outlined text-[16px]">check</span>' : isSkipped ? '<span class="material-symbols-outlined text-[14px]">snooze</span>' : ''}
        </button>
      </div>
    `;
    container.appendChild(card);
  });
}

export function openHabitActionPopover(habitId) {
  const habit = (userState.customHabits || []).find(h => h.id === habitId);
  if (!habit) return;

  activeActionHabitId = habitId;
  const popover = document.getElementById('habit-action-popover');
  const backdrop = document.getElementById('habit-action-backdrop');
  const titleEl = document.getElementById('popover-habit-title');
  const resetBtn = document.getElementById('popover-reset-btn');

  if (titleEl) titleEl.textContent = habit.title;

  if (resetBtn) {
    if (habit.completed || habit.skipped) resetBtn.classList.remove('hidden');
    else resetBtn.classList.add('hidden');
  }

  if (backdrop) backdrop.classList.add('active');
  if (popover) popover.classList.add('active');
}

export function closeHabitActionPopover() {
  const popover = document.getElementById('habit-action-popover');
  const backdrop = document.getElementById('habit-action-backdrop');
  if (popover) popover.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
  activeActionHabitId = null;
}

export function confirmHabitAction(action) {
  if (!activeActionHabitId) return;
  const habit = (userState.customHabits || []).find(h => h.id === activeActionHabitId);
  if (!habit) return;

  if (action === 'complete') {
    habit.completed = true;
    habit.skipped = false;
    showToast(`✨ "${habit.title}" completed! Score increased.`);
    if (window.MomentumReminderEngine && typeof window.MomentumReminderEngine.onHabitCompleted === 'function') {
      window.MomentumReminderEngine.onHabitCompleted(habit);
    }
  } else if (action === 'skip') {
    habit.completed = false;
    habit.skipped = true;
    showToast(`🌿 Rest day recorded for "${habit.title}".`);
    if (window.MomentumReminderEngine && typeof window.MomentumReminderEngine.onHabitSkipped === 'function') {
      window.MomentumReminderEngine.onHabitSkipped(habit);
    }
  } else if (action === 'incomplete') {
    habit.completed = false;
    habit.skipped = false;
    showToast(`🌱 "${habit.title}" marked as pending.`);
  }

  closeHabitActionPopover();
  saveStateToStorage();
  renderCustomHabits();
  recalculateAndSyncAll(true);
}

export function openCustomHabitModal(habitId = null) {
  const modal = document.getElementById('custom-habit-modal');
  const backdrop = document.getElementById('custom-habit-backdrop');
  const titleEl = document.getElementById('custom-habit-title');
  const submitBtn = document.getElementById('custom-habit-submit-btn');
  const inputTitle = document.getElementById('new-habit-title');
  const inputCue = document.getElementById('new-habit-cue');

  if (!modal || !backdrop) return;

  if (typeof habitId === 'string' && habitId) {
    const habit = (userState.customHabits || []).find(h => h.id === habitId);
    if (!habit) return;
    editingHabitId = habitId;
    if (titleEl) titleEl.textContent = 'Edit ritual';
    if (submitBtn) submitBtn.textContent = 'Save Changes';
    if (inputTitle) inputTitle.value = habit.title || '';
    if (inputCue) inputCue.value = habit.anchor || habit.subtitle || '';
    selectedHabitCategory = habit.category || 'Health';
    selectedHabitIcon = habit.icon || 'spa';
  } else {
    editingHabitId = null;
    if (titleEl) titleEl.textContent = 'Add a ritual';
    if (submitBtn) submitBtn.textContent = 'Add to daily rhythm';
    if (inputTitle) inputTitle.value = '';
    if (inputCue) inputCue.value = '';
    selectedHabitCategory = 'Health';
    selectedHabitIcon = 'spa';
  }

  const catBtns = document.querySelectorAll('#habit-category-picker button');
  catBtns.forEach(b => {
    if (b.textContent.trim() === selectedHabitCategory) {
      b.className = 'habit-cat-btn px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-medium cursor-pointer border-0';
    } else {
      b.className = 'habit-cat-btn px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant text-xs font-medium cursor-pointer border-0';
    }
  });

  const iconBtns = document.querySelectorAll('#habit-icon-picker button');
  iconBtns.forEach(b => {
    const iconSpan = b.querySelector('.material-symbols-outlined');
    if (iconSpan && iconSpan.textContent.trim() === selectedHabitIcon) {
      b.className = 'icon-option w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center cursor-pointer border-0 shrink-0';
    } else {
      b.className = 'icon-option w-10 h-10 rounded-xl bg-surface-container text-on-surface flex items-center justify-center cursor-pointer border-0 shrink-0';
    }
  });

  backdrop.classList.add('active');
  modal.classList.add('active');
  if (inputTitle) setTimeout(() => inputTitle.focus(), 150);
}

export function closeCustomHabitModal() {
  const modal = document.getElementById('custom-habit-modal');
  const backdrop = document.getElementById('custom-habit-backdrop');
  if (modal) modal.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
  editingHabitId = null;
}

export function selectHabitCategory(cat, btn) {
  selectedHabitCategory = cat;
  const catBtns = document.querySelectorAll('#habit-category-picker button');
  catBtns.forEach(b => {
    b.className = 'habit-cat-btn px-3 py-2 rounded-xl bg-surface-container text-on-surface-variant text-xs font-medium cursor-pointer border-0';
  });
  if (btn) btn.className = 'habit-cat-btn px-3 py-2 rounded-xl bg-primary text-on-primary text-xs font-medium cursor-pointer border-0';
}

export function selectHabitIcon(iconName, btn) {
  selectedHabitIcon = iconName;
  const iconBtns = document.querySelectorAll('#habit-icon-picker button');
  iconBtns.forEach(b => {
    b.className = 'icon-option w-10 h-10 rounded-xl bg-surface-container text-on-surface flex items-center justify-center cursor-pointer border-0 shrink-0';
  });
  if (btn) btn.className = 'icon-option w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center cursor-pointer border-0 shrink-0';
}

export function submitCustomHabit(event) {
  if (event) event.preventDefault();
  const inputTitle = document.getElementById('new-habit-title');
  const inputCue = document.getElementById('new-habit-cue');
  const title = inputTitle ? inputTitle.value.trim() : '';

  if (!title) {
    showToast('Please enter a habit name.');
    return;
  }

  const anchor = inputCue && inputCue.value.trim() ? inputCue.value.trim() : 'Daily rhythm';
  const category = selectedHabitCategory || 'Health';
  const icon = selectedHabitIcon || 'spa';
  const color = category === 'Health' ? 'emerald' : category === 'Mind' ? 'teal' : category === 'Focus' ? 'indigo' : 'amber';

  if (editingHabitId) {
    const habit = (userState.customHabits || []).find(h => h.id === editingHabitId);
    if (habit) {
      habit.title = title;
      habit.anchor = anchor;
      habit.category = category;
      habit.icon = icon;
      habit.color = color;
      showToast(`✨ Updated ritual "${title}".`);
    }
  } else {
    const newHabit = {
      id: 'habit-' + Date.now(),
      title: title,
      icon: icon,
      anchor: anchor,
      category: category,
      color: color,
      completed: false
    };
    if (!userState.customHabits) userState.customHabits = [];
    userState.customHabits.push(newHabit);
    showToast(`🌿 Added "${title}" to your rhythm.`);
  }

  saveStateToStorage();
  closeCustomHabitModal();
  renderCustomHabits();
  recalculateAndSyncAll(true);
}

export function quickAddHabit(title, icon, anchor, category, color) {
  const newHabit = {
    id: 'habit-' + Date.now(),
    title: title,
    icon: icon || 'star',
    anchor: anchor || 'Daily rhythm',
    category: category || 'Custom Habit',
    color: color || 'emerald',
    completed: false
  };

  if (!userState.customHabits) userState.customHabits = [];
  userState.customHabits.push(newHabit);
  saveStateToStorage();
  renderCustomHabits();
  recalculateAndSyncAll(true);
  showToast(`🌿 Added "${title}" to your habits!`);
}

export function deleteCustomHabit(habitId) {
  const idx = (userState.customHabits || []).findIndex(h => h.id === habitId);
  if (idx > -1) {
    const deleted = userState.customHabits.splice(idx, 1)[0];
    saveStateToStorage();
    renderCustomHabits();
    recalculateAndSyncAll(true);
    showToast(`🗑️ Removed "${deleted.title}".`);
  }
}

export function toggleCustomHabit(habitId) {
  openHabitActionPopover(habitId);
}

// ── BUILD A RITUAL DRAWER (PERSONALIZED SUGGESTIONS) ──
export function openBuildRitualDrawer() {
  const drawer = document.getElementById('build-ritual-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  const listEl = document.getElementById('drawer-suggestions-list');

  if (listEl) {
    listEl.innerHTML = '';
    const currentIntent = userState.intentions ? userState.intentions[0] : 'health';
    const intentData = ONBOARDING_DATA[currentIntent] || ONBOARDING_DATA.health;

    intentData.problems.forEach(prob => {
      const item = document.createElement('div');
      item.className = 'flex items-center justify-between p-3.5 bg-surface-container-lowest rounded-xl hairline hover:shadow-xs transition-all';
      item.innerHTML = `
        <div class="flex items-center gap-3 min-w-0 pr-2">
          <div class="w-9 h-9 rounded-lg bg-primary-fixed/60 text-primary-container flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[18px]">${prob.ritual.icon}</span>
          </div>
          <div class="min-w-0">
            <span class="block text-xs uppercase tracking-wider text-primary font-medium">${prob.ritual.tag}</span>
            <span class="block text-sm font-medium text-on-surface truncate">${prob.ritual.title}</span>
            <span class="block text-xs text-outline truncate">${prob.ritual.anchor}</span>
          </div>
        </div>
        <button onclick="addSuggestedRitualToToday(this, '${prob.ritual.title.replace(/'/g, "\\'")}', '${prob.ritual.icon}', '${prob.ritual.anchor.replace(/'/g, "\\'")}')" class="px-3 py-1.5 rounded-lg bg-primary-container hover:bg-primary text-on-primary text-xs font-medium transition-colors shrink-0 flex items-center gap-1 cursor-pointer border-0">
          <span class="material-symbols-outlined text-[14px]">add</span>
          <span>Add</span>
        </button>
      `;
      listEl.appendChild(item);
    });
  }

  if (backdrop) backdrop.classList.add('active');
  if (drawer) drawer.classList.add('active');
}

export function closeBuildRitualDrawer() {
  const drawer = document.getElementById('build-ritual-drawer');
  const backdrop = document.getElementById('drawer-backdrop');
  if (drawer) drawer.classList.remove('active');
  if (backdrop) backdrop.classList.remove('active');
}

export function addSuggestedRitualToToday(btn, title, icon, anchor) {
  btn.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span><span>Added</span>';
  btn.classList.remove('bg-primary-container', 'text-on-primary');
  btn.classList.add('bg-surface-container-low', 'text-on-surface-variant');
  btn.disabled = true;

  quickAddHabit(title, icon, anchor, 'Suggested Ritual', 'emerald');
}

// ── RITUALS SCREEN CONTROLS ──
export function toggleRitualCard(btn) {
  const isChecked = btn.classList.contains('bg-primary-container');
  const icon = btn.querySelector('.material-symbols-outlined');
  if (isChecked) {
    btn.classList.remove('bg-primary-container', 'text-on-primary');
    btn.classList.add('bg-surface-container-low', 'text-on-surface-variant');
    if (icon) icon.textContent = 'radio_button_unchecked';
  } else {
    btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');
    btn.classList.add('bg-primary-container', 'text-on-primary');
    if (icon) icon.textContent = 'check';
  }
}

export function setActiveFilter(btn, filter) {
  const buttons = document.querySelectorAll('#time-filters .filter-pill');
  buttons.forEach(b => {
    b.classList.remove('bg-primary-container', 'text-on-primary', 'shadow-sm');
    b.classList.add('bg-surface-container-low', 'text-on-surface-variant');
  });
  btn.classList.add('bg-primary-container', 'text-on-primary', 'shadow-sm');
  btn.classList.remove('bg-surface-container-low', 'text-on-surface-variant');

  const cards = document.querySelectorAll('#view-rituals .ritual-card');
  let visibleCount = 0;
  cards.forEach(card => {
    const time = card.getAttribute('data-time');
    if (filter === 'all' || time === filter) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });

  const countEl = document.getElementById('ritual-count');
  if (countEl) countEl.textContent = `${visibleCount} practices visible`;
}

export function filterRitualsByText(query) {
  const q = query.toLowerCase().trim();
  const cards = document.querySelectorAll('#view-rituals .ritual-card');
  let visibleCount = 0;
  cards.forEach(card => {
    const text = card.textContent.toLowerCase();
    if (!q || text.includes(q)) {
      card.style.display = 'flex';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  const countEl = document.getElementById('ritual-count');
  if (countEl) countEl.textContent = `${visibleCount} practices visible`;
}

export function toggleSuggestions() {
  const content = document.getElementById('suggestion-content');
  const chevron = document.getElementById('suggestion-chevron');
  if (content.classList.contains('hidden')) {
    content.classList.remove('hidden');
    if (chevron) chevron.style.transform = 'rotate(180deg)';
  } else {
    content.classList.add('hidden');
    if (chevron) chevron.style.transform = 'rotate(0deg)';
  }
}

export function adoptRitual(btn, title) {
  btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span><span>adopted</span>';
  btn.classList.remove('bg-surface-container-low');
  btn.classList.add('bg-primary-container', 'text-on-primary');
  showToast('🌿 Ritual added to your personal collection.');
}

export function openNewRitualDialog() {
  openCustomHabitModal();
}

// Attach all to window for HTML inline handlers
window.renderCustomHabits = renderCustomHabits;
window.openHabitActionPopover = openHabitActionPopover;
window.closeHabitActionPopover = closeHabitActionPopover;
window.confirmHabitAction = confirmHabitAction;
window.openCustomHabitModal = openCustomHabitModal;
window.closeCustomHabitModal = closeCustomHabitModal;
window.selectHabitCategory = selectHabitCategory;
window.selectHabitIcon = selectHabitIcon;
window.submitCustomHabit = submitCustomHabit;
window.quickAddHabit = quickAddHabit;
window.deleteCustomHabit = deleteCustomHabit;
window.toggleCustomHabit = toggleCustomHabit;
window.openBuildRitualDrawer = openBuildRitualDrawer;
window.closeBuildRitualDrawer = closeBuildRitualDrawer;
window.addSuggestedRitualToToday = addSuggestedRitualToToday;
window.toggleRitualCard = toggleRitualCard;
window.setActiveFilter = setActiveFilter;
window.filterRitualsByText = filterRitualsByText;
window.toggleSuggestions = toggleSuggestions;
window.adoptRitual = adoptRitual;
window.openNewRitualDialog = openNewRitualDialog;
