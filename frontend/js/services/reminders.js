/**
 * Momentum Smart Reminder Engine & Calm Escalation Ladder
 * Manages quiet hours, daily notification budgets, time-based reminders, and gentle escalation banners.
 */

import { userState } from '../state.js';
import { STORAGE_KEYS, saveStateToStorage } from '../storage.js';
import { navigate } from '../router.js';

export class ReminderEngine {
  constructor() {
    this.tickerInterval = null;
    this.activeBanners = [];
  }

  init() {
    clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => this.check(), 60000);

    this.syncProfileUI();

    setTimeout(() => this.check(), 2500);

    if ('Notification' in window && Notification.permission === 'default') {
      // Permission requested when appropriate
    }
  }

  syncProfileUI() {
    const budget = userState.notificationBudget || 6;
    const slider = document.getElementById('notif-budget-slider');
    const display = document.getElementById('notif-budget-value-display');
    const quietStart = document.getElementById('quiet-hours-start');
    const quietEnd = document.getElementById('quiet-hours-end');
    const quietBadge = document.getElementById('profile-quiet-status-badge');

    if (slider) slider.value = budget;
    if (display) display.textContent = budget;
    if (quietStart) quietStart.value = userState.quietHoursStart || '22:30';
    if (quietEnd) quietEnd.value = userState.quietHoursEnd || '07:00';

    if (quietBadge) {
      if (this.isQuietHours()) {
        quietBadge.className = 'px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-semibold flex items-center gap-1.5';
        quietBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-600"></span><span>Quiet Hours Active</span>';
      } else {
        quietBadge.className = 'px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold flex items-center gap-1.5';
        quietBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-600"></span><span>Ready for Nudges</span>';
      }
    }
  }

  updateBudget(val) {
    const num = parseInt(val, 10);
    userState.notificationBudget = num;
    localStorage.setItem(STORAGE_KEYS.NOTIF_BUDGET, num);
    const display = document.getElementById('notif-budget-value-display');
    if (display) display.textContent = num;
  }

  updateQuietHours(start, end) {
    if (start) {
      userState.quietHoursStart = start;
      localStorage.setItem(STORAGE_KEYS.QUIET_START, start);
    }
    if (end) {
      userState.quietHoursEnd = end;
      localStorage.setItem(STORAGE_KEYS.QUIET_END, end);
    }
    this.syncProfileUI();
  }

  resetDefaults() {
    this.updateBudget(6);
    this.updateQuietHours('22:30', '07:00');
    this.syncProfileUI();
    if (typeof window.showToast === 'function') {
      window.showToast('🌿 Reminder settings reset to calm defaults (6 nudges/day, 10:30 PM–7:00 AM).');
    }
  }

  isQuietHours() {
    try {
      const now = new Date();
      const curMins = now.getHours() * 60 + now.getMinutes();
      const [sH, sM] = (userState.quietHoursStart || '22:30').split(':').map(Number);
      const [eH, eM] = (userState.quietHoursEnd || '07:00').split(':').map(Number);
      const startMins = sH * 60 + sM;
      const endMins = eH * 60 + eM;

      if (startMins > endMins) {
        return curMins >= startMins || curMins < endMins;
      } else {
        return curMins >= startMins && curMins < endMins;
      }
    } catch (e) {
      return false;
    }
  }

  check() {
    const todayDate = new Date().toISOString().slice(0, 10);
    if (userState.lastNudgeDate !== todayDate) {
      userState.dailyNudgesSent = 0;
      userState.lastNudgeDate = todayDate;
      localStorage.setItem(STORAGE_KEYS.DAILY_NUDGES_SENT, '0');
      localStorage.setItem(STORAGE_KEYS.LAST_NUDGE_DATE, todayDate);
    }

    if (this.isQuietHours()) {
      return;
    }

    const maxBudget = userState.notificationBudget || 6;
    if (userState.dailyNudgesSent >= maxBudget) {
      return;
    }

    const now = new Date();
    const curTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const habits = userState.customHabits || [];

    habits.forEach(habit => {
      if (habit.completed || habit.skipped) {
        this.dismissBanner(habit.id);
        return;
      }

      if (habit.triggerType === 'time' && habit.scheduledTime) {
        const isDue = habit.scheduledTime <= curTimeStr;

        if (isDue) {
          if (!habit.nudgeStage || habit.nudgeStage === 0) {
            this.sendEscalationNudge(habit, 1);
          } else if (habit.nudgeStage === 1 && habit.priority !== 'low') {
            const firstNudge = habit.firstNudgedAt || (Date.now() - 16 * 60000);
            const minsSinceFirst = (Date.now() - firstNudge) / 60000;

            if (minsSinceFirst >= 15) {
              this.sendEscalationNudge(habit, 2);
            }
          }
        }
      }
    });
  }

  sendEscalationNudge(habit, stage) {
    if (userState.dailyNudgesSent >= (userState.notificationBudget || 6)) return;

    habit.nudgeStage = stage;
    if (stage === 1) habit.firstNudgedAt = Date.now();
    habit.lastNudgedAt = Date.now();
    userState.dailyNudgesSent = (userState.dailyNudgesSent || 0) + 1;
    localStorage.setItem(STORAGE_KEYS.DAILY_NUDGES_SENT, userState.dailyNudgesSent);
    saveStateToStorage(userState);

    this.renderBanner(habit, stage);

    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const title = stage === 1 ? `Momentum: ${habit.title}` : `Momentum (Gentle follow-up): ${habit.title}`;
        const body = stage === 1 ? `🌿 Gentle reminder for your rhythm: ${habit.title}` : `✨ Still time today whenever you feel ready: ${habit.title}`;
        new Notification(title, { body, icon: 'https://cdn-icons-png.flaticon.com/512/3233/3233497.png' });
      } catch (e) {}
    }
  }

  renderBanner(habit, stage) {
    const container = document.getElementById('reminder-banner-container');
    if (!container) return;

    this.dismissBanner(habit.id);

    const banner = document.createElement('div');
    banner.id = `escalation-banner-${habit.id}`;
    banner.className = `escalation-banner ${stage === 1 ? 'escalation-banner-step1' : 'escalation-banner-step2'} rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5`;

    const isStep1 = stage === 1;
    banner.innerHTML = `
      <div class="flex items-start gap-3 min-w-0">
        <div class="w-10 h-10 rounded-xl ${isStep1 ? 'bg-primary/10 text-primary' : 'bg-amber-500/15 text-amber-700'} flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[22px]">${habit.icon || 'spa'}</span>
        </div>
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-0.5">
            <span class="px-2 py-0.5 rounded-full ${isStep1 ? 'bg-primary/20 text-primary' : 'bg-amber-500/25 text-amber-800'} text-[10px] font-bold uppercase tracking-wider">
              ${isStep1 ? 'Gentle Nudge' : 'Still Time Today'}
            </span>
            <span class="text-[11px] text-outline">${habit.anchor || 'Scheduled today'}</span>
          </div>
          <h4 class="text-sm font-semibold text-on-surface truncate">${habit.title}</h4>
          <p class="text-xs text-on-surface-variant mt-0.5">${isStep1 ? 'Take a mindful pause whenever you are ready.' : 'No guilt, no rush. Complete when you feel like it.'}</p>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
        <button onclick="MomentumReminderEngine.completeFromBanner('${habit.id}')" class="px-3.5 py-1.5 rounded-xl bg-primary hover:bg-primary-container text-on-primary text-xs font-semibold shadow-xs transition-colors cursor-pointer border-0 flex items-center gap-1">
          <span class="material-symbols-outlined text-[15px]">check</span>
          <span>Mark Done</span>
        </button>
        <button onclick="MomentumReminderEngine.snoozeHabit('${habit.id}', 15)" class="px-3 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-medium text-on-surface transition-colors cursor-pointer border-0 flex items-center gap-1" title="Snooze for 15 minutes">
          <span class="material-symbols-outlined text-[15px]">snooze</span>
          <span>Snooze 15m</span>
        </button>
        ${!isStep1 ? `
        <button onclick="MomentumReminderEngine.skipFromBanner('${habit.id}')" class="px-2.5 py-1.5 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs text-outline hover:text-on-surface transition-colors cursor-pointer border-0" title="Rest day for today">
          <span>Rest Day</span>
        </button>
        ` : ''}
      </div>
    `;

    container.appendChild(banner);
    this.activeBanners.push({ id: habit.id, title: habit.title });
  }

  completeFromBanner(habitId) {
    const habit = (userState.customHabits || []).find(h => h.id === habitId);
    if (habit) {
      habit.completed = true;
      habit.skipped = false;
      saveStateToStorage(userState);
      if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
      if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);
      if (typeof window.showToast === 'function') {
        window.showToast(`✨ "${habit.title}" completed! Score increased.`);
      }
      this.onHabitCompleted(habit);
    }
    this.dismissBanner(habitId);
  }

  skipFromBanner(habitId) {
    const habit = (userState.customHabits || []).find(h => h.id === habitId);
    if (habit) {
      habit.completed = false;
      habit.skipped = true;
      saveStateToStorage(userState);
      if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
      if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);
      if (typeof window.showToast === 'function') {
        window.showToast(`🌿 Rest day recorded for "${habit.title}". Reminders silenced.`);
      }
      this.onHabitSkipped(habit);
    }
    this.dismissBanner(habitId);
  }

  snoozeHabit(habitId, minutes = 15) {
    const habit = (userState.customHabits || []).find(h => h.id === habitId);
    if (habit) {
      const now = new Date();
      now.setMinutes(now.getMinutes() + minutes);
      habit.scheduledTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      habit.nudgeStage = 0;
      saveStateToStorage(userState);
      if (typeof window.showToast === 'function') {
        window.showToast(`🌿 Snoozed "${habit.title}" for ${minutes} minutes.`);
      }
    }
    this.dismissBanner(habitId);
  }

  dismissBanner(habitId) {
    const el = document.getElementById(`escalation-banner-${habitId}`);
    if (el) el.remove();
    this.activeBanners = this.activeBanners.filter(b => b.id !== habitId);
  }

  onHabitCompleted(completedHabit) {
    this.dismissBanner(completedHabit.id);

    const stackedHabits = (userState.customHabits || []).filter(h => 
      h.triggerType === 'after-habit' && (h.anchorHabitId === completedHabit.id || (h.anchor && h.anchor.toLowerCase().includes(completedHabit.title.toLowerCase())))
    );

    stackedHabits.forEach(stacked => {
      if (!stacked.completed && !stacked.skipped) {
        setTimeout(() => {
          this.renderBanner(stacked, 1);
          if (typeof window.showToast === 'function') {
            window.showToast(`🌱 Habit stack cue: Time for "${stacked.title}"!`);
          }
        }, 1200);
      }
    });
  }

  onHabitSkipped(skippedHabit) {
    this.dismissBanner(skippedHabit.id);
  }

  triggerTestEscalation() {
    const sampleHabit1 = {
      id: 'test-step-1',
      title: '500ml Morning Hydration & Reset',
      icon: 'water_drop',
      anchor: 'Upon waking at 7:00 AM'
    };
    const sampleHabit2 = {
      id: 'test-step-2',
      title: '25-Min Deep Flow Practice',
      icon: 'timer',
      anchor: 'Mid-morning focus block'
    };

    this.renderBanner(sampleHabit1, 1);
    setTimeout(() => {
      this.renderBanner(sampleHabit2, 2);
    }, 400);

    if (typeof window.showToast === 'function') {
      window.showToast('✨ Rendered calm escalation preview (Step 1 Gentle + Step 2 Unhurried).');
    }
    navigate('today');
  }
}

export const MomentumReminderEngine = new ReminderEngine();

export function dismissReminder(habitId) {
  MomentumReminderEngine.dismissBanner(habitId);
}

export function snoozeReminder(habitId, minutes = 15) {
  MomentumReminderEngine.snoozeHabit(habitId, minutes);
}

export function completeReminderHabit(habitId) {
  MomentumReminderEngine.completeFromBanner(habitId);
}

export function triggerTestEscalation() {
  MomentumReminderEngine.triggerTestEscalation();
}

export function updateNotificationBudget(val) {
  MomentumReminderEngine.updateBudget(val);
}

export function updateQuietHoursSetting(start, end) {
  MomentumReminderEngine.updateQuietHours(start, end);
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.MomentumReminderEngine = MomentumReminderEngine;
  window.dismissReminder = dismissReminder;
  window.snoozeReminder = snoozeReminder;
  window.completeReminderHabit = completeReminderHabit;
  window.triggerTestEscalation = triggerTestEscalation;
  window.updateNotificationBudget = updateNotificationBudget;
  window.updateQuietHoursSetting = updateQuietHoursSetting;
}
