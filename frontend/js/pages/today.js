/**
 * Today Page & Concentric Rings Dashboard
 * Manages Today view rendering, hero concentric rings sync, checklist toggles, water tracking, and quick adds.
 */

import { userState, calculateDynamicMetrics, saveStateToStorage } from '../state.js';
import { getCurrentPersonalizedRitual, getSelectedRitualsList } from './onboarding.js';

export function renderTodayView() {
  const ritual = getCurrentPersonalizedRitual();

  const nameEl = document.getElementById('first-ritual-name');
  const anchorEl = document.getElementById('first-ritual-anchor-label');
  const iconEl = document.getElementById('first-ritual-icon');

  if (nameEl) nameEl.textContent = ritual.title;
  if (anchorEl) anchorEl.textContent = `Anchor: ${ritual.anchor}`;
  if (iconEl) iconEl.textContent = ritual.icon;

  const headerName = document.getElementById('header-user-name');
  if (headerName) headerName.textContent = userState.name || 'Adithya';
  const todayGreeting = document.getElementById('today-greeting');
  if (todayGreeting) todayGreeting.textContent = `Good morning, ${userState.name || 'Adithya'}`;

  const rituals = getSelectedRitualsList();
  const todayList = document.getElementById('today-rituals-list');
  if (todayList && rituals.length > 1) {
    const extras = todayList.querySelectorAll('.onboarding-extra-ritual');
    extras.forEach(e => e.remove());

    rituals.slice(1).forEach(comp => {
      const extraCard = document.createElement('div');
      extraCard.className = 'onboarding-extra-ritual group flex items-center justify-between p-space-md bg-surface-container-lowest rounded-xl hairline transition-all duration-200 animate-fadeIn';
      extraCard.innerHTML = `
        <div class="flex items-center gap-space-md min-w-0">
          <div class="w-10 h-10 rounded-lg bg-surface-container-low text-primary-container flex items-center justify-center shrink-0">
            <span class="material-symbols-outlined text-[20px]">${comp.icon}</span>
          </div>
          <div class="flex flex-col min-w-0">
            <span class="ritual-title font-headline-sm text-headline-sm text-on-surface font-medium truncate">${comp.title}</span>
            <span class="font-body-sm text-body-sm text-outline truncate">Anchor: ${comp.anchor}</span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button aria-label="Toggle ${comp.title}" onclick="toggleTodayRitual(this)" class="ritual-toggle w-6 h-6 rounded-full border border-outline hover:border-primary-container flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors active:scale-95 bg-transparent" type="button">
          </button>
        </div>
      `;
      todayList.appendChild(extraCard);
    });
  }

  if (typeof window.renderCustomHabits === 'function') {
    window.renderCustomHabits();
  }
  updateStreakAndProgressUI();
}

export function recalculateAndSyncAll(animate = true) {
  const m = calculateDynamicMetrics(userState);

  const prevScore = userState.score || 0;
  userState.score = m.dailyAdherenceScore;
  userState.totalScore = m.totalPoints;

  // 1. Update Today Hero Concentric Rings (160x160 viewBox)
  const ringHabits = document.getElementById('hero-ring-habits');
  const ringFocus = document.getElementById('hero-ring-focus');
  const ringWater = document.getElementById('hero-ring-water');
  const pctEl = document.getElementById('hero-progress-pct');

  if (ringHabits) {
    const c1 = 427.26;
    ringHabits.style.strokeDashoffset = c1 * (1 - m.habitPct / 100);
  }
  if (ringFocus) {
    const c2 = 339.29;
    ringFocus.style.strokeDashoffset = c2 * (1 - m.focusPct / 100);
  }
  if (ringWater) {
    const c3 = 251.33;
    ringWater.style.strokeDashoffset = c3 * (1 - m.waterPct / 100);
  }

  if (pctEl) {
    if (animate && typeof window.animateNumberValue === 'function') {
      window.animateNumberValue(pctEl, prevScore, m.dailyAdherenceScore, 600, '%');
    } else {
      pctEl.textContent = `${m.dailyAdherenceScore}%`;
    }
  }

  // 2. Update Legend Labels
  const lHabits = document.getElementById('legend-habits-val');
  const lFocus = document.getElementById('legend-focus-val');
  const lWater = document.getElementById('legend-water-val');
  if (lHabits) lHabits.textContent = `Habits: ${m.completedHabitsCount}/${m.totalHabits} (${m.habitPct}%)`;
  if (lFocus) lFocus.textContent = `Focus: ${m.focusMins}/${m.targetFocus}m (${m.focusPct}%)`;
  if (lWater) lWater.textContent = `Water: ${m.water}/${m.targetWater} (${m.waterPct}%)`;

  // 3. Update Hero Streak Line & Headlines
  const heroStreak = document.getElementById('hero-streak-display');
  if (heroStreak) {
    heroStreak.textContent = `${m.streak}-day rhythm · best ${userState.bestStreak || 24}`;
  }

  const headline = document.getElementById('today-progress-headline');
  const sub = document.getElementById('today-progress-sub');
  if (headline && sub) {
    if (m.dailyAdherenceScore >= 90) {
      headline.textContent = 'Rhythm honored today';
      sub.textContent = `All ${m.totalHabits} daily practices completed with stillness.`;
    } else if (m.completedHabitsCount > 0) {
      headline.textContent = 'Your rhythm in motion';
      sub.textContent = `${m.completedHabitsCount} of ${m.totalHabits} rituals completed today.`;
    } else {
      headline.textContent = 'Your rhythm awaits';
      sub.textContent = `${m.totalHabits} ritual${m.totalHabits > 1 ? 's' : ''} ready for your daily foundation.`;
    }
  }

  // 4. Update Insights Counters and Dynamic Graphs
  const insightScore = document.getElementById('insights-score-number');
  if (insightScore) {
    if (animate && typeof window.animateNumberValue === 'function') {
      window.animateNumberValue(insightScore, prevScore, m.dailyAdherenceScore, 600);
    } else {
      insightScore.textContent = m.dailyAdherenceScore;
    }
  }

  const inHabitsCount = document.getElementById('insights-total-habits-count');
  if (inHabitsCount) inHabitsCount.textContent = m.totalHabits;

  const inRitualsCount = document.getElementById('insights-total-rituals-completed');
  if (inRitualsCount) inRitualsCount.textContent = 20 + m.completedHabitsCount;

  const inStreak = document.getElementById('insights-streak-days');
  if (inStreak) inStreak.textContent = m.streak;

  // 5. Update Active Habits Matrix for Selected Day (Insights)
  const bar1 = document.getElementById('habit-bar-1');
  const pct1 = document.getElementById('habit-pct-1');
  const stat1 = document.getElementById('habit-status-1');
  if (bar1 && pct1) {
    bar1.style.width = `${m.waterPct}%`;
    pct1.textContent = `${m.waterPct}%`;
    if (stat1) stat1.textContent = m.waterPct >= 100 ? 'Logged (8/8)' : `${m.water}/8 glasses`;
  }

  const bar2 = document.getElementById('habit-bar-2');
  const pct2 = document.getElementById('habit-pct-2');
  const stat2 = document.getElementById('habit-status-2');
  const mindHabit = (userState.customHabits || []).find(h => h.category === 'Mind' || h.title.includes('Breathing'));
  const mindDone = mindHabit ? mindHabit.completed : false;
  if (bar2 && pct2) {
    bar2.style.width = `${mindDone ? 100 : 0}%`;
    pct2.textContent = `${mindDone ? 100 : 0}%`;
    if (stat2) stat2.textContent = mindDone ? 'Completed' : 'Pending';
  }

  const bar3 = document.getElementById('habit-bar-3');
  const pct3 = document.getElementById('habit-pct-3');
  const stat3 = document.getElementById('habit-status-3');
  if (bar3 && pct3) {
    bar3.style.width = `${m.focusPct}%`;
    pct3.textContent = `${m.focusPct}%`;
    if (stat3) stat3.textContent = m.focusMins > 0 ? `Logged ${m.focusMins}m` : 'Pending';
  }

  const bar4 = document.getElementById('habit-bar-4');
  const pct4 = document.getElementById('habit-pct-4');
  const stat4 = document.getElementById('habit-status-4');
  const hasWorkout = (userState.movementLogs || []).length > 0;
  if (bar4 && pct4) {
    bar4.style.width = `${hasWorkout ? 100 : 0}%`;
    pct4.textContent = `${hasWorkout ? 100 : 0}%`;
    if (stat4) stat4.textContent = hasWorkout ? `Logged (${userState.movementLogs[0].workoutName || 'Workout'})` : 'Pending';
  }

  // 6. Update Native SVG Chart in Insights
  if (typeof window.updateHabitChart === 'function') {
    window.updateHabitChart({ pct: m.dailyAdherenceScore, date: 'Oct 24 (Today)' });
  }

  saveStateToStorage();
}

export function updateStreakAndProgressUI() {
  recalculateAndSyncAll(true);
}

export function completeFirstRitual(btn) {
  userState.firstRitualCompleted = !userState.firstRitualCompleted;
  const parent = btn.closest('#personalized-first-ritual-card');
  const title = parent ? parent.querySelector('.ritual-title') : null;

  if (userState.firstRitualCompleted) {
    btn.classList.add('bg-primary-container', 'text-on-primary');
    btn.classList.remove('bg-transparent');
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span>';
    if (title) {
      title.classList.add('line-through', 'text-outline');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('✨ First ritual completed! Day streak locked in.');
    }
  } else {
    btn.classList.remove('bg-primary-container', 'text-on-primary');
    btn.classList.add('bg-transparent');
    btn.innerHTML = '';
    if (title) {
      title.classList.remove('line-through', 'text-outline');
    }
  }

  updateStreakAndProgressUI();
}

export function toggleTodayRitual(btn) {
  const isChecked = btn.classList.contains('bg-primary-container');
  const parent = btn.closest('.group');
  const title = parent ? parent.querySelector('.ritual-title') : null;

  if (isChecked) {
    btn.classList.remove('bg-primary-container', 'text-on-primary');
    btn.classList.add('border', 'border-outline');
    btn.innerHTML = '';
    if (title) {
      title.classList.remove('line-through', 'text-outline', 'font-normal');
      title.classList.add('text-on-surface', 'font-medium');
    }
  } else {
    btn.classList.add('bg-primary-container', 'text-on-primary');
    btn.classList.remove('border', 'border-outline');
    btn.innerHTML = '<span class="material-symbols-outlined text-[16px]">check</span>';
    if (title) {
      title.classList.add('line-through', 'text-outline', 'font-normal');
      title.classList.remove('text-on-surface', 'font-medium');
    }
    if (typeof window.showToast === 'function') {
      window.showToast('🌱 Practice acknowledged.');
    }
  }
  updateStreakAndProgressUI();
}

export function incrementWater() {
  userState.waterGlasses = ((userState.waterGlasses || 6) < 8) ? (userState.waterGlasses || 6) + 1 : 1;
  const label = document.getElementById('water-count-label');
  const bar = document.getElementById('water-progress-bar');
  if (label) label.textContent = `${userState.waterGlasses}/8 glasses`;
  if (bar) bar.style.width = `${(userState.waterGlasses / 8) * 100}%`;
  recalculateAndSyncAll(true);
  if (typeof window.showToast === 'function') {
    window.showToast(`💧 Logged water (${userState.waterGlasses}/8 glasses).`);
  }
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
  if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
  recalculateAndSyncAll(true);
  if (typeof window.showToast === 'function') {
    window.showToast(`🌿 Added "${title}" to your habits!`);
  }
}

export const toggleHabit = toggleTodayRitual;

// Global window exposure
if (typeof window !== 'undefined') {
  window.renderTodayView = renderTodayView;
  window.recalculateAndSyncAll = recalculateAndSyncAll;
  window.updateStreakAndProgressUI = updateStreakAndProgressUI;
  window.completeFirstRitual = completeFirstRitual;
  window.toggleTodayRitual = toggleTodayRitual;
  window.toggleHabit = toggleHabit;
  window.incrementWater = incrementWater;
  window.quickAddHabit = quickAddHabit;
}
