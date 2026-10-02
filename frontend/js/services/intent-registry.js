/**
 * Momentum — Aria Intent Registry & Local NLU Pattern Library
 * ─────────────────────────────────────────────────────────────────────────────
 * Declarative intent definitions, multi-turn slot configurations, custom parsers,
 * and execution handlers for full, client-side, zero-hallucination interactive voice control.
 */

import { userState, getTodayDateString, createTodoItem, addTodo, toggleTodo, deleteTodo, rescheduleTodo, saveStateToStorage, calculateDynamicMetrics, getExerciseLibrary, checkAndUpdatePR, getLatestWorkoutSession, logCardioSession, logCalorieIntake } from '../state.js';
import { MomentumAssistant } from './assistant.js';
import { MeditativeAudio } from './soundscape.js';

// ── Custom Slot Parsers ──────────────────────────────────────────────────────

/**
 * Normalizes input: lowercase, trim, strip punctuation and common filler prefixes
 */
export function normalizeTranscript(text) {
  if (!text) return '';
  let clean = text.toLowerCase().trim();
  // Strip wake word prefixes
  clean = clean.replace(/^(hey aria|hi aria|okay aria|ok aria|aria)[,\s]*/i, '');
  // Strip filler words
  clean = clean.replace(/^(please|could you|can you|would you|just|kindly|um|uh)[,\s]*/i, '');
  return clean.trim();
}

/**
 * Date & Time Parser
 * Uses window.chrono (Chrono NLP) if available, with built-in regex fallbacks.
 */
export function parseDateTime(rawText) {
  const result = {
    date: null,     // 'YYYY-MM-DD'
    time: null,     // 'HH:MM'
    hasDate: false,
    hasTime: false,
    text: rawText
  };

  const text = rawText.toLowerCase().trim();

  // 1. Try window.chrono first
  if (typeof window !== 'undefined' && window.chrono) {
    try {
      const parsed = window.chrono.parse(rawText);
      if (parsed && parsed.length > 0) {
        const first = parsed[0];
        const dateObj = first.start.date();
        if (first.start.isCertain('day') || first.start.isCertain('month')) {
          const y = dateObj.getFullYear();
          const m = String(dateObj.getMonth() + 1).padStart(2, '0');
          const d = String(dateObj.getDate()).padStart(2, '0');
          result.date = `${y}-${m}-${d}`;
          result.hasDate = true;
        }
        if (first.start.isCertain('hour')) {
          const hh = String(dateObj.getHours()).padStart(2, '0');
          const mm = String(dateObj.getMinutes()).padStart(2, '0');
          result.time = `${hh}:${mm}`;
          result.hasTime = true;
        }
      }
    } catch (e) { }
  }

  // 2. Relative date regex fallback if date still not determined
  if (!result.hasDate) {
    const today = new Date();
    if (/\btomorrow\b/i.test(text)) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      result.date = tomorrow.toISOString().slice(0, 10);
      result.hasDate = true;
    } else if (/\btoday\b|\btonight\b/i.test(text)) {
      result.date = getTodayDateString();
      result.hasDate = true;
    }
  }

  // 3. Time regex fallback (e.g. "8am", "8:30pm", "at 9", "14:00")
  if (!result.hasTime) {
    const timeMatch = text.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) ||
      text.match(/\b(?:at\s+)(\d{1,2})(?::(\d{2}))?\b/i);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const meridiem = (timeMatch[3] || '').toLowerCase();
      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
      result.time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      result.hasTime = true;
    }
  }

  return result;
}

/**
 * Quantity Parser (quantities like ml, glasses, sets, reps, kg, minutes)
 */
export function parseQuantity(rawText, type) {
  const text = rawText.toLowerCase().trim();

  if (type === 'water') {
    // Matches e.g. "500ml", "1 liter", "2 glasses", "3 cups", or single number
    const mlMatch = text.match(/(\d+)\s*(?:ml|milliliters?)/i);
    if (mlMatch) {
      const ml = parseInt(mlMatch[1], 10);
      return { glasses: Math.max(1, Math.round(ml / 250)), ml, raw: mlMatch[0] };
    }
    const literMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:l|liter|liters)/i);
    if (literMatch) {
      const liters = parseFloat(literMatch[1]);
      return { glasses: Math.max(1, Math.round((liters * 1000) / 250)), ml: Math.round(liters * 1000), raw: literMatch[0] };
    }
    const glassMatch = text.match(/(\d+)\s*(?:glass|glasses|cup|cups)/i);
    if (glassMatch) {
      const g = parseInt(glassMatch[1], 10);
      return { glasses: g, ml: g * 250, raw: glassMatch[0] };
    }
    const numMatch = text.match(/\b(\d+)\b/);
    if (numMatch) {
      const n = parseInt(numMatch[1], 10);
      if (n >= 100) return { glasses: Math.max(1, Math.round(n / 250)), ml: n, raw: `${n}ml` };
      return { glasses: n, ml: n * 250, raw: `${n} glasses` };
    }
    return { glasses: 1, ml: 250, raw: '1 glass' };
  }

  if (type === 'duration') {
    const minMatch = text.match(/(\d+)\s*(?:minute|minutes|mins?|m\b)/i);
    if (minMatch) return parseInt(minMatch[1], 10);
    const hrMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:hour|hours|hrs?|h\b)/i);
    if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 60);
    const num = text.match(/\b(\d+)\b/);
    if (num) return parseInt(num[1], 10);
    return null;
  }

  if (type === 'weight') {
    const kgMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?|kilograms?)/i);
    if (kgMatch) return parseFloat(kgMatch[1]);
    const num = text.match(/\b(\d+(?:\.\d+)?)\b/);
    if (num) return parseFloat(num[1]);
    return 0;
  }

  if (type === 'sets') {
    const sMatch = text.match(/(\d+)\s*sets?/i);
    if (sMatch) return parseInt(sMatch[1], 10);
    const num = text.match(/\b(\d+)\b/);
    if (num) return parseInt(num[1], 10);
    return 3;
  }

  if (type === 'reps') {
    const rMatch = text.match(/(\d+)\s*reps?/i);
    if (rMatch) return parseInt(rMatch[1], 10);
    const num = text.match(/\b(\d+)\b/);
    if (num) return parseInt(num[1], 10);
    return 10;
  }

  return null;
}

/**
 * Enum Parser
 */
export function parseEnum(rawText, enumType) {
  const text = rawText.toLowerCase().trim();

  if (enumType === 'priority') {
    if (/\b(high|urgent|important|asap)\b/i.test(text)) return 'high';
    if (/\b(low|someday|minor)\b/i.test(text)) return 'low';
    return 'normal';
  }

  if (enumType === 'pacing') {
    if (/\b(slow|unhurried|mindful)\b/i.test(text)) return 'Slow';
    if (/\b(fast|quick|tempo)\b/i.test(text)) return 'Fast';
    return 'Moderate';
  }

  if (enumType === 'feel') {
    if (/\b(easy|light)\b/i.test(text)) return 'Easy';
    if (/\b(challenging|intense)\b/i.test(text)) return 'Challenging';
    if (/\b(hard|exhausting|tough)\b/i.test(text)) return 'Hard';
    return 'Comfortable';
  }

  if (enumType === 'category') {
    if (/\b(mind|meditation|breathing)\b/i.test(text)) return 'Mind';
    if (/\b(body|movement|fitness|workout)\b/i.test(text)) return 'Health';
    if (/\b(craft|reading|writing|creative)\b/i.test(text)) return 'Craft';
    if (/\b(focus|work|study)\b/i.test(text)) return 'Focus';
    return 'Health';
  }

  return text;
}

/**
 * Boolean / Yes-No Parser
 */
export function parseBooleanYesNo(rawText) {
  const text = rawText.toLowerCase().trim();

  // Affirmative checks
  if (/\b(yes|yeah|yup|sure|correct|definitely|please|do it|right|sounds good|every day|daily|always)\b/i.test(text)) {
    return true;
  }

  // Negative checks
  if (/\b(no|nope|nah|not now|cancel|never mind|stop|don't|just today|only today|today only)\b/i.test(text)) {
    return false;
  }

  return null;
}

// ── Intent Registry Definitions ──────────────────────────────────────────────

export const INTENT_DEFINITIONS = [
  // ── 1. Water Habit Clarification ("Add a habit of 500ml water") ─────────
  {
    name: 'water.addHabitClarification',
    category: 'water',
    patterns: [
      /add (?:a )?(?:habit|ritual) (?:of )?(\d+\s*(?:ml|glasses|cups|liters?)?\s*water)/i,
      /drink (\d+\s*(?:ml|glasses|cups?)?\s*water) (?:as a )?(?:habit|ritual)/i,
      /habit (?:to )?drink (\d+\s*(?:ml|glasses|cups?)?\s*water)/i
    ],
    requiredSlots: ['recurrence'],
    optionalSlots: ['reminderTime'],
    slotPrompts: {
      recurrence: 'Should I add this every day, or just for today?'
    },
    slotTypes: {
      recurrence: 'boolean', // true = every day, false = just today
      reminderTime: 'time'
    },
    extractInitialSlots: (rawText) => {
      const q = parseQuantity(rawText, 'water');
      return { waterQuantity: q };
    },
    execute: async (slots, machine) => {
      const q = slots.waterQuantity || { glasses: 2, ml: 500, raw: '500ml' };
      const isDaily = slots.recurrence === true || (typeof slots.recurrence === 'string' && /every|daily/i.test(slots.recurrence));

      if (isDaily) {
        // If daily, check if reminderTime has been asked
        if (!slots.reminderTime && slots.reminderTime !== 'untimed') {
          machine.enterAwaitingSlot('reminderTime', `Got it — I've added a daily habit to drink ${q.raw} of water. What time should I remind you, or should I leave it untimed?`);
          return null;
        }

        const scheduledTime = (slots.reminderTime && slots.reminderTime !== 'untimed') ? slots.reminderTime : '08:00';
        const prevSnap = JSON.parse(JSON.stringify(userState.customHabits || []));

        const newHabit = {
          id: 'habit-' + Date.now(),
          title: `Drink ${q.raw} Water`,
          icon: 'water_drop',
          anchor: `Daily hydration (${scheduledTime})`,
          category: 'Health',
          color: 'emerald',
          completed: false,
          skipped: false,
          triggerType: 'time',
          scheduledTime: scheduledTime,
          priority: 'standard',
          nudgeStage: 0,
          createdViaVoice: true
        };

        if (!userState.customHabits) userState.customHabits = [];
        userState.customHabits.push(newHabit);
        saveStateToStorage();
        if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
        if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);

        machine.triggerUndo(`Added habit "Drink ${q.raw} Water"`, { type: 'habits', prev: prevSnap });
        return `Done. Drink ${q.raw} of water, daily at ${formatTimeForSpeech(scheduledTime)}.`;
      } else {
        // Just for today -> Log water glasses
        const prevWater = userState.waterGlasses || 0;
        userState.waterGlasses = Math.min(8, prevWater + (q.glasses || 2));
        saveStateToStorage();
        if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);

        machine.triggerUndo(`Logged ${q.raw} water for today`, { type: 'water', prev: prevWater });
        return `Logged ${q.raw} of water for today. Stay refreshed!`;
      }
    }
  },

  // ── 2. Water Tracking (Log & Set Target) ──────────────────────────────────
  {
    name: 'water.log',
    category: 'water',
    patterns: [
      /log (\d+\s*(?:glasses|ml|cups|liters?)\s*(?:of )?water)/i,
      /drink (\d+\s*(?:glasses|ml|cups|liters?)\s*(?:of )?water)/i,
      /had (\d+ glasses? of water)/i,
      /drank water/i,
      /log water/i,
      /drink water/i,
      /i drank a glass of water/i
    ],
    execute: (slots, machine, rawText) => {
      const q = parseQuantity(rawText, 'water');
      const prevWater = userState.waterGlasses || 0;
      const target = userState.waterTargetGlasses || 8;
      const glassesToAdd = q.glasses || 1;
      userState.waterGlasses = Math.min(target, prevWater + glassesToAdd);

      saveStateToStorage();
      if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);

      machine.triggerUndo(`Logged ${glassesToAdd} glass${glassesToAdd > 1 ? 'es' : ''} of water`, { type: 'water', prev: prevWater });
      return `Logged ${glassesToAdd} glass${glassesToAdd > 1 ? 'es' : ''} of water. You are at ${userState.waterGlasses} of ${target} glasses today.`;
    }
  },

  {
    name: 'water.setTarget',
    category: 'water',
    patterns: [
      /set water target to (\d+)/i,
      /change water target to (\d+)/i
    ],
    execute: (slots, machine, rawText) => {
      const m = rawText.match(/\d+/);
      const target = m ? parseInt(m[0], 10) : 8;
      userState.waterTargetGlasses = target;
      saveStateToStorage();
      if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);
      return `Water target set to ${target} glasses daily.`;
    }
  },

  // ── 3. To-Do List: Multi-Item Creation Loop ─────────────────────────────
  {
    name: 'todos.createLoop',
    category: 'todos',
    patterns: [
      /create (?:a )?to-?do list(?: for today)?/i,
      /make (?:a )?to-?do list(?: for today)?/i,
      /start (?:a )?to-?do list(?: for today)?/i,
      /new to-?do list/i
    ],
    execute: (slots, machine) => {
      machine.enterCollectItemsLoop('today', "Sure — what's the first thing you'd like to add?");
      return null;
    }
  },

  // ── 4. To-Do List: Single Item Creation ─────────────────────────────────
  {
    name: 'todos.addSingle',
    category: 'todos',
    patterns: [
      /add (?:a )?to-?do (?:to |for )?(.+)/i,
      /new to-?do (.+)/i,
      /remind me to (.+)/i,
      /put (.+) on my to-?do list/i
    ],
    requiredSlots: ['title'],
    slotPrompts: {
      title: 'What to-do would you like to add?'
    },
    extractInitialSlots: (rawText) => {
      const m = rawText.match(/(?:add (?:a )?to-?do (?:to |for )?|new to-?do |remind me to |put )(.+?)(?: on my to-?do list)?$/i);
      let rawTitle = m ? m[1].trim() : '';

      // Extract date and time from the phrase
      const dt = parseDateTime(rawTitle);
      // Clean up title by removing "tomorrow", "at 8am", etc.
      let cleanTitle = rawTitle
        .replace(/\b(tomorrow|today|tonight|next week)\b/gi, '')
        .replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      const priority = parseEnum(rawText, 'priority');

      return {
        title: cleanTitle || rawTitle,
        date: dt.hasDate ? dt.date : getTodayDateString(),
        time: dt.hasTime ? dt.time : null,
        priority: priority
      };
    },
    execute: (slots, machine) => {
      const prevTodos = JSON.parse(JSON.stringify(userState.todos || []));
      const item = createTodoItem({
        title: slots.title,
        date: slots.date || getTodayDateString(),
        time: slots.time || null,
        priority: slots.priority || 'normal',
        createdVia: 'voice'
      });
      addTodo(item);

      machine.triggerUndo(`Added to-do "${item.title}"`, { type: 'todos', prev: prevTodos });
      const dayLabel = item.date === getTodayDateString() ? 'for today' : `for ${formatDateForSpeech(item.date)}`;
      return `Added to-do: "${item.title}" ${dayLabel}.`;
    }
  },

  // ── 5. To-Do List: Complete Task ────────────────────────────────────────
  {
    name: 'todos.complete',
    category: 'todos',
    patterns: [
      /complete to-?do (.+)/i,
      /finish to-?do (.+)/i,
      /mark to-?do (.+?) (?:as )?(?:done|complete|completed)/i,
      /mark (.+) to-?do (?:as )?(?:done|complete)/i
    ],
    requiredSlots: ['title'],
    slotPrompts: {
      title: 'Which to-do would you like to mark as complete?'
    },
    extractInitialSlots: (rawText) => {
      const m = rawText.match(/(?:complete to-?do |finish to-?do |mark to-?do |mark )(.+?)(?: to-?do)?(?: as done| as complete| done| complete)?$/i);
      return { title: m ? m[1].trim() : '' };
    },
    execute: (slots, machine) => {
      const todos = userState.todos || [];
      const query = (slots.title || '').toLowerCase();
      const item = todos.find(t => t.title.toLowerCase().includes(query) || query.includes(t.title.toLowerCase()));

      if (item) {
        const prevTodos = JSON.parse(JSON.stringify(userState.todos || []));
        item.completed = true;
        saveStateToStorage();
        if (typeof window.renderTodosUI === 'function') window.renderTodosUI();

        machine.triggerUndo(`Completed to-do "${item.title}"`, { type: 'todos', prev: prevTodos });
        return `Marked to-do "${item.title}" as complete.`;
      }
      return `I couldn't find a to-do matching "${slots.title}".`;
    }
  },

  // ── 6. To-Do List: Delete Task ──────────────────────────────────────────
  {
    name: 'todos.delete',
    category: 'todos',
    patterns: [
      /delete to-?do (.+)/i,
      /remove to-?do (.+)/i,
      /delete task (.+)/i,
      /remove task (.+)/i
    ],
    requiredSlots: ['title'],
    slotPrompts: {
      title: 'Which to-do would you like to delete?'
    },
    extractInitialSlots: (rawText) => {
      const m = rawText.match(/(?:delete to-?do |remove to-?do |delete task |remove task )(.+)/i);
      return { title: m ? m[1].trim() : '' };
    },
    execute: (slots, machine) => {
      const todos = userState.todos || [];
      const query = (slots.title || '').toLowerCase();
      const item = todos.find(t => t.title.toLowerCase().includes(query) || query.includes(t.title.toLowerCase()));

      if (item) {
        const prevTodos = JSON.parse(JSON.stringify(userState.todos || []));
        deleteTodo(item.id);
        machine.triggerUndo(`Deleted to-do "${item.title}"`, { type: 'todos', prev: prevTodos });
        return `Deleted to-do "${item.title}".`;
      }
      return `I couldn't find a to-do named "${slots.title}".`;
    }
  },

  // ── 7. To-Do List: Query Remaining Tasks ────────────────────────────────
  {
    name: 'todos.list',
    category: 'todos',
    patterns: [
      /what are my to-?dos/i,
      /show (?:my )?to-?dos/i,
      /read (?:my )?to-?do list/i,
      /list (?:my )?tasks/i,
      /what's on my to-?do list/i,
      /what tasks do i have/i
    ],
    execute: (slots, machine, rawText) => {
      const dt = parseDateTime(rawText);
      const targetDate = dt.hasDate ? dt.date : getTodayDateString();
      const todos = (userState.todos || []).filter(t => t.date === targetDate && !t.completed);

      if (todos.length === 0) {
        return `You have no pending to-dos for ${targetDate === getTodayDateString() ? 'today' : formatDateForSpeech(targetDate)}. All clear!`;
      }
      const titles = todos.map(t => t.title).slice(0, 4).join(', ');
      const more = todos.length > 4 ? ` and ${todos.length - 4} more` : '';
      return `You have ${todos.length} to-do${todos.length > 1 ? 's' : ''}: ${titles}${more}.`;
    }
  },

  // ── 8. To-Do List: Reschedule Task ──────────────────────────────────────
  {
    name: 'todos.reschedule',
    category: 'todos',
    patterns: [
      /reschedule (?:to-?do |task )?(.+?) to (.+)/i,
      /move (?:to-?do |task )?(.+?) to (.+)/i
    ],
    execute: (slots, machine, rawText) => {
      const m = rawText.match(/(?:reschedule|move) (?:to-?do |task )?(.+?) to (.+)/i);
      if (!m) return "Which task would you like to reschedule and to what day?";

      const query = m[1].trim().toLowerCase();
      const targetDateStr = m[2].trim();
      const dt = parseDateTime(targetDateStr);
      const newDate = dt.hasDate ? dt.date : getTodayDateString();

      const todos = userState.todos || [];
      const item = todos.find(t => t.title.toLowerCase().includes(query) || query.includes(t.title.toLowerCase()));

      if (item) {
        const prevTodos = JSON.parse(JSON.stringify(userState.todos || []));
        rescheduleTodo(item.id, newDate);
        machine.triggerUndo(`Rescheduled "${item.title}"`, { type: 'todos', prev: prevTodos });
        return `Rescheduled "${item.title}" to ${formatDateForSpeech(newDate)}.`;
      }
      return `I couldn't find a task matching "${m[1]}".`;
    }
  },

  // ── 9. Habits: Complete Habit ───────────────────────────────────────────
  {
    name: 'habits.complete',
    category: 'habits',
    patterns: [
      /mark (.+?) (?:as )?(?:done|complete|completed)/i,
      /(?:i )?(?:finished|completed|did) (.+)/i,
      /^complete (.+)/i
    ],
    requiredSlots: ['title'],
    slotPrompts: {
      title: 'Which habit did you complete?'
    },
    extractInitialSlots: (rawText) => {
      const m1 = rawText.match(/mark (.+?) (?:as )?(?:done|complete|completed)/i);
      const m2 = rawText.match(/(?:i )?(?:finished|completed|did) (.+)/i);
      const m3 = rawText.match(/^complete (.+)/i);
      const title = (m1 ? m1[1] : (m2 ? m2[1] : (m3 ? m3[1] : ''))).trim();
      return { title };
    },
    execute: (slots, machine) => {
      const query = (slots.title || '').toLowerCase();
      const habits = userState.customHabits || [];
      const habit = habits.find(h => h.title.toLowerCase().includes(query) || query.includes(h.title.toLowerCase()));

      if (habit) {
        const prevHabits = JSON.parse(JSON.stringify(habits));
        habit.completed = true;
        habit.skipped = false;
        saveStateToStorage();
        if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
        if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);

        machine.triggerUndo(`Completed "${habit.title}"`, { type: 'habits', prev: prevHabits });
        return `Marked "${habit.title}" as complete. Steady mindful presence.`;
      }
      return `I couldn't find a habit named "${slots.title}".`;
    }
  },

  // ── 10. Habits: Skip for Today (Rest Day) ────────────────────────────────
  {
    name: 'habits.skip',
    category: 'habits',
    patterns: [
      /skip (.+?)(?: today| for today)?$/i,
      /rest day for (.+)/i,
      /take a rest day for (.+)/i
    ],
    requiredSlots: ['title'],
    slotPrompts: {
      title: 'Which habit would you like to take a rest day for?'
    },
    extractInitialSlots: (rawText) => {
      const m1 = rawText.match(/skip (.+?)(?: today| for today)?$/i);
      const m2 = rawText.match(/(?:take a )?rest day for (.+)/i);
      const title = (m1 ? m1[1] : (m2 ? m2[1] : '')).trim();
      return { title };
    },
    execute: (slots, machine) => {
      const query = (slots.title || '').toLowerCase();
      const habits = userState.customHabits || [];
      const habit = habits.find(h => h.title.toLowerCase().includes(query) || query.includes(h.title.toLowerCase()));

      if (habit) {
        const prevHabits = JSON.parse(JSON.stringify(habits));
        habit.completed = false;
        habit.skipped = true;
        saveStateToStorage();
        if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
        if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);

        machine.triggerUndo(`Rest day for "${habit.title}"`, { type: 'habits', prev: prevHabits });
        return `Recorded a mindful rest day for "${habit.title}". Reminders silenced for today.`;
      }
      return `I couldn't find a habit named "${slots.title}".`;
    }
  },

  // ── 11. Habits: Mark Incomplete ─────────────────────────────────────────
  {
    name: 'habits.incomplete',
    category: 'habits',
    patterns: [
      /mark (.+?) (?:as )?(?:incomplete|pending|not done)/i,
      /uncheck (.+)/i
    ],
    execute: (slots, machine, rawText) => {
      const m = rawText.match(/(?:mark |uncheck )(.+?)(?: as incomplete| as pending| as not done)?$/i);
      const query = (m ? m[1] : '').trim().toLowerCase();
      const habits = userState.customHabits || [];
      const habit = habits.find(h => h.title.toLowerCase().includes(query) || query.includes(h.title.toLowerCase()));

      if (habit) {
        const prevHabits = JSON.parse(JSON.stringify(habits));
        habit.completed = false;
        habit.skipped = false;
        saveStateToStorage();
        if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
        if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);

        machine.triggerUndo(`Marked "${habit.title}" pending`, { type: 'habits', prev: prevHabits });
        return `Marked "${habit.title}" as pending.`;
      }
      return `I couldn't find that habit.`;
    }
  },

  // ── 12. Habits: Create New Custom Habit ─────────────────────────────────
  {
    name: 'habits.create',
    category: 'habits',
    patterns: [
      /^(?:add habit|new habit|create habit|add ritual|new ritual) (.+)/i
    ],
    requiredSlots: ['title'],
    slotPrompts: {
      title: 'What habit would you like to build?'
    },
    extractInitialSlots: (rawText) => {
      const m = rawText.match(/^(?:add habit|new habit|create habit|add ritual|new ritual) (.+)/i);
      let rawTitle = m ? m[1].trim() : '';

      const dt = parseDateTime(rawTitle);
      const cleanTitle = rawTitle.replace(/\b(?:at\s+)?\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi, '').trim();

      return {
        title: cleanTitle || rawTitle,
        scheduledTime: dt.hasTime ? dt.time : '09:00'
      };
    },
    execute: (slots, machine) => {
      const prevHabits = JSON.parse(JSON.stringify(userState.customHabits || []));
      const title = slots.title.charAt(0).toUpperCase() + slots.title.slice(1);
      const scheduledTime = slots.scheduledTime || '09:00';

      const newHabit = {
        id: 'habit-' + Date.now(),
        title: title,
        icon: inferHabitIcon(title),
        anchor: `Daily rhythm (${scheduledTime})`,
        category: parseEnum(title, 'category'),
        color: 'teal',
        completed: false,
        skipped: false,
        triggerType: 'time',
        scheduledTime: scheduledTime,
        priority: 'standard',
        nudgeStage: 0,
        createdViaVoice: true
      };

      if (!userState.customHabits) userState.customHabits = [];
      userState.customHabits.push(newHabit);
      saveStateToStorage();
      if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
      if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);

      machine.triggerUndo(`Added "${title}"`, { type: 'habits', prev: prevHabits });
      return `Added new ritual: "${title}".`;
    }
  },

  // ── 13. Habits: Delete Habit ────────────────────────────────────────────
  {
    name: 'habits.delete',
    category: 'habits',
    patterns: [
      /delete habit (.+)/i,
      /remove habit (.+)/i,
      /delete ritual (.+)/i,
      /remove ritual (.+)/i
    ],
    execute: (slots, machine, rawText) => {
      const m = rawText.match(/(?:delete|remove) (?:habit|ritual) (.+)/i);
      const query = (m ? m[1] : '').trim().toLowerCase();
      const habits = userState.customHabits || [];
      const idx = habits.findIndex(h => h.title.toLowerCase().includes(query) || query.includes(h.title.toLowerCase()));

      if (idx !== -1) {
        const prevHabits = JSON.parse(JSON.stringify(habits));
        const deleted = habits.splice(idx, 1)[0];
        saveStateToStorage();
        if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();
        if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(true);

        machine.triggerUndo(`Removed "${deleted.title}"`, { type: 'habits', prev: prevHabits });
        return `Removed "${deleted.title}" from your habits.`;
      }
      return `I couldn't find that habit.`;
    }
  },

  // ── 14. Habits: Set Anchor Cue ──────────────────────────────────────────
  {
    name: 'habits.setAnchor',
    category: 'habits',
    patterns: [
      /set anchor for (.+?) to (.+)/i,
      /anchor (.+?) (?:after|to) (.+)/i
    ],
    execute: (slots, machine, rawText) => {
      const m = rawText.match(/(?:set anchor for |anchor )(.+?) (?:to |after )(.+)/i);
      if (!m) return "Which habit anchor would you like to set?";

      const query = m[1].trim().toLowerCase();
      const newAnchor = m[2].trim();
      const habits = userState.customHabits || [];
      const habit = habits.find(h => h.title.toLowerCase().includes(query) || query.includes(h.title.toLowerCase()));

      if (habit) {
        const prevHabits = JSON.parse(JSON.stringify(habits));
        habit.anchor = newAnchor;
        habit.triggerType = 'anchor';
        saveStateToStorage();
        if (typeof window.renderCustomHabits === 'function') window.renderCustomHabits();

        machine.triggerUndo(`Updated anchor for "${habit.title}"`, { type: 'habits', prev: prevHabits });
        return `Anchor for "${habit.title}" set to: "${newAnchor}".`;
      }
      return `I couldn't find that habit.`;
    }
  },

  // ── 15. Habits: Set Priority ────────────────────────────────────────────
  {
    name: 'habits.setPriority',
    category: 'habits',
    patterns: [
      /set priority of (.+?) to (essential|standard|high|low)/i,
      /make (.+?) (essential|standard|high|low)/i
    ],
    execute: (slots, machine, rawText) => {
      const m = rawText.match(/(?:set priority of |make )(.+?) (?:to )?(essential|standard|high|low)/i);
      if (!m) return "Which habit priority would you like to adjust?";

      const query = m[1].trim().toLowerCase();
      const prio = m[2].trim().toLowerCase();
      const habits = userState.customHabits || [];
      const habit = habits.find(h => h.title.toLowerCase().includes(query) || query.includes(h.title.toLowerCase()));

      if (habit) {
        habit.priority = prio;
        saveStateToStorage();
        return `Priority for "${habit.title}" set to ${prio}.`;
      }
      return `I couldn't find that habit.`;
    }
  },

  // ── 16. Focus Sessions: Start / Stop / Duration / Soundscape ────────────
  {
    name: 'focus.start',
    category: 'focus',
    patterns: [
      /start focus(?: session)?/i,
      /begin focus/i,
      /start deep work/i,
      /start timer/i,
      /focus for (\d+)\s*(?:minutes|mins)?/i
    ],
    execute: (slots, machine, rawText) => {
      const dur = parseQuantity(rawText, 'duration');
      if (dur && typeof window.setTimerPreset === 'function') {
        window.setTimerPreset(dur);
      }
      if (typeof window.openFocusTimer === 'function') window.openFocusTimer();
      setTimeout(() => {
        if (typeof window.toggleFocusTimer === 'function') window.toggleFocusTimer();
      }, 500);
      return `Starting your focus session. Settle in and stay present.`;
    }
  },

  {
    name: 'focus.stop',
    category: 'focus',
    patterns: [
      /stop focus/i,
      /end focus/i,
      /cancel focus/i,
      /pause focus/i,
      /stop timer/i
    ],
    execute: () => {
      if (typeof window.resetFocusTimer === 'function') window.resetFocusTimer();
      if (typeof window.closeFocusTimer === 'function') window.closeFocusTimer();
      return `Focus session concluded. Wonderful mindful effort.`;
    }
  },

  {
    name: 'focus.soundscape',
    category: 'focus',
    patterns: [
      /(?:set |change |choose |play )?soundscape (.+)/i,
      /play (?:singing bowl|harmonic pad|pad|binaural beats|f maj9)(?: at \d+hz)?/i
    ],
    execute: (slots, machine, rawText) => {
      const text = rawText.toLowerCase();
      if (/396\s*hz/i.test(text)) {
        MeditativeAudio.playSingingBowlChime(396, 4.0);
        return `Playing 396Hz Root liberation singing bowl frequency.`;
      }
      if (/528\s*hz/i.test(text)) {
        MeditativeAudio.playSingingBowlChime(528, 4.0);
        return `Playing 528Hz Miracle transformation singing bowl frequency.`;
      }
      if (/432\s*hz|singing bowl/i.test(text)) {
        MeditativeAudio.playSingingBowlChime(432, 4.0);
        return `Playing 432Hz Harmonic alignment singing bowl tone.`;
      }
      if (/binaural|alpha wave/i.test(text)) {
        MeditativeAudio.startPeacefulSoundscape();
        return `Engaged 10Hz Alpha binaural focus wave rhythm.`;
      }
      // Default to F Maj9 pad
      MeditativeAudio.startPeacefulSoundscape();
      return `Playing F Maj9 harmonic pad soundscape.`;
    }
  },

  {
    name: 'focus.setDuration',
    category: 'focus',
    patterns: [
      /set focus (?:duration|target|time) to (\d+)/i
    ],
    execute: (slots, machine, rawText) => {
      const dur = parseQuantity(rawText, 'duration') || 25;
      if (typeof window.setTimerPreset === 'function') {
        window.setTimerPreset(dur);
      }
      return `Focus session duration set to ${dur} minutes.`;
    }
  },

  // ── 17. Navigation (Every Screen in the App) ─────────────────────────────
  {
    name: 'navigation.go',
    category: 'navigation',
    patterns: [
      /(?:go to|open|show|navigate to|take me to|switch to) (today|home|dashboard|rituals|habits|insights|stats|profile|settings|milestones|medals|todos|to-?dos|voice)/i,
      /^(today|rituals|insights|profile|milestones|todos)$/i
    ],
    execute: (slots, machine, rawText) => {
      const text = rawText.toLowerCase();
      let target = 'today';
      if (/to-?do/i.test(text)) target = 'todos';
      else if (/insight|stat/i.test(text)) target = 'insights';
      else if (/ritual|habit/i.test(text)) target = 'rituals';
      else if (/milestone|medal|award|badge/i.test(text)) target = 'milestones';
      else if (/profile|setting|account/i.test(text)) target = 'profile';
      else if (/voice/i.test(text)) target = 'voice';

      const label = target.charAt(0).toUpperCase() + target.slice(1);
      setTimeout(() => {
        if (typeof window.navigate === 'function') window.navigate(target);
      }, 900);
      return `Navigating to ${label}.`;
    }
  },

  // ── 19. Grounded Stats & Zero-Hallucination AI Queries ──────────────────
  {
    name: 'stats.groundedQuery',
    category: 'stats',
    patterns: [
      /my stats/i,
      /how am i doing/i,
      /my progress/i,
      /streak/i,
      /today's summary/i,
      /morning briefing/i,
      /good morning/i,
      /hello aria/i,
      /hi aria/i,
      /what('s| is) my score/i,
      /how many habits/i,
      /what habits did i complete/i,
      /what's left today/i,
      /how much focus time/i,
      /latest workout/i,
      /workout weight/i
    ],
    execute: (slots, machine, rawText) => {
      const response = MomentumAssistant.generateResponse(rawText);
      // Clean up markdown bold markers for TTS speech
      return response.replace(/\*\*/g, '').replace(/•/g, '-');
    }
  },

  // ── 20. Milestones & Medals ─────────────────────────────────────────────
  {
    name: 'milestones.query',
    category: 'milestones',
    patterns: [
      /what (?:medals|milestones|badges|awards) do i have/i,
      /which badges are unlocked/i,
      /show (?:my )?medals/i
    ],
    execute: () => {
      const milestones = userState.milestones || [];
      const achieved = milestones.filter(m => m.achieved);
      if (achieved.length === 0) {
        return "You haven't unlocked any milestone medals yet. Keep building your daily rhythm!";
      }
      const names = achieved.map(m => `${m.tier} tier ${m.name}`).join(', ');
      return `You have unlocked ${achieved.length} milestone medals: ${names}.`;
    }
  },

  // ── 21. Reminders & Quiet Hours Window ──────────────────────────────────
  {
    name: 'reminders.quietHours',
    category: 'reminders',
    patterns: [
      /set quiet hours (?:from )?(.+?) to (.+)/i,
      /change quiet hours (?:from )?(.+?) to (.+)/i
    ],
    execute: (slots, machine, rawText) => {
      const m = rawText.match(/(?:set|change) quiet hours (?:from )?(.+?) to (.+)/i);
      if (!m) return "What start and end time would you like for quiet hours?";

      const startParsed = parseDateTime(m[1]);
      const endParsed = parseDateTime(m[2]);

      const start = startParsed.hasTime ? startParsed.time : '22:30';
      const end = endParsed.hasTime ? endParsed.time : '07:00';

      if (window.MomentumReminderEngine && typeof window.MomentumReminderEngine.updateQuietHours === 'function') {
        window.MomentumReminderEngine.updateQuietHours(start, end);
      } else {
        userState.quietHoursStart = start;
        userState.quietHoursEnd = end;
        saveStateToStorage();
      }

      return `Quiet hours set from ${formatTimeForSpeech(start)} to ${formatTimeForSpeech(end)}.`;
    }
  },

  // ── 22. Data Sovereignty & Backup ───────────────────────────────────────
  {
    name: 'system.backup',
    category: 'system',
    patterns: [
      /export (?:my )?data/i,
      /backup (?:my )?data/i,
      /download backup/i,
      /export rhythm data/i
    ],
    execute: () => {
      if (typeof window.exportRhythmData === 'function') {
        window.exportRhythmData();
        return `Export initiated. Your rhythm JSON backup is downloading.`;
      }
      return `Unable to export data right now.`;
    }
  },

  // ── 23. Cloud Sync Status ───────────────────────────────────────────────
  {
    name: 'system.syncStatus',
    category: 'system',
    patterns: [
      /am i synced(?: to the cloud)?/i,
      /what('s| is) my sync status/i,
      /check cloud sync/i
    ],
    execute: () => {
      const hasFirebase = window.MomentumFirebase && typeof window.MomentumFirebase.getCurrentUser === 'function';
      const user = hasFirebase ? window.MomentumFirebase.getCurrentUser() : null;
      if (user) {
        return `You are securely synced to Cloud Firestore with authenticated user ID ${user.uid.slice(0, 6)}...`;
      }
      return `You are currently in offline Local Storage Mode. All data is preserved on your device.`;
    }
  },

  // ── 24. 10-Second Undo Buffer ───────────────────────────────────────────
  {
    name: 'undo.perform',
    category: 'undo',
    patterns: [
      /^undo(?: that)?$/i,
      /^revert(?: that)?$/i,
      /^restore previous(?: state)?$/i
    ],
    execute: () => {
      if (window.MomentumVoiceAgent && typeof window.MomentumVoiceAgent.performUndo === 'function') {
        window.MomentumVoiceAgent.performUndo();
        return null; // Handled directly by performUndo
      }
      return "Nothing to undo.";
    }
  },

  // ── 25. Strength Workout Logging ─────────────────────────────────────────
  {
    name: 'movement.logStrength',
    category: 'movement',
    patterns: [
      /(?:log|record|add) (?:a )?(?:workout|exercise|sets?|bench press|squat|deadlift|overhead press|barbell row|curl|pushdown|pull-?ups?)/i,
      /(?:did|completed) (\d+)\s*sets? of (.*?)(?: at (\d+)\s*(?:kg|kilos?))?/i,
      /(?:log|record) (\d+)\s*(?:reps|sets) (?:of )?(.*?)(?: at (\d+)\s*kg)?/i,
      /(?:log|record|add) (\d+)\s*sets? of (.*?)(?: at (\d+)\s*(?:kg|kilos?))?/i
    ],
    requiredSlots: ['workoutName', 'setsCount', 'reps', 'weightKg', 'pacing', 'feel'],
    slotPrompts: {
      workoutName: "What exercise did you practice?",
      setsCount: "How many sets did you complete?",
      reps: "How many repetitions per set?",
      weightKg: "What weight in kilograms did you use?",
      pacing: "How was your pacing — Slow, Moderate, or Fast?",
      feel: "And how did the exertion feel — Easy, Comfortable, Challenging, or Hard?"
    },
    slotTypes: {
      workoutName: 'text',
      setsCount: 'quantity',
      reps: 'quantity',
      weightKg: 'quantity',
      pacing: 'enum',
      feel: 'enum'
    },
    extractInitialSlots: (rawText) => {
      const slots = {};
      const text = rawText.toLowerCase();

      // Check exercise name
      const knownExercises = [
        'bench press', 'incline dumbbell press', 'barbell squat', 'squats', 'squat',
        'deadlift', 'deadlifts', 'overhead press', 'barbell row', 'lat pulldown',
        'pull-ups', 'pullups', 'bicep curl', 'tricep pushdown', 'pushups',
        'leg press', 'plank'
      ];
      for (const ex of knownExercises) {
        if (text.includes(ex)) {
          slots.workoutName = ex.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          if (slots.workoutName === 'Squats' || slots.workoutName === 'Squat') slots.workoutName = 'Squats';
          if (slots.workoutName === 'Pushups' || slots.workoutName === 'Pushup') slots.workoutName = 'Pushups';
          if (slots.workoutName === 'Deadlifts' || slots.workoutName === 'Deadlift') slots.workoutName = 'Deadlifts';
          break;
        }
      }

      // Check sets
      const sMatch = text.match(/(\d+)\s*sets?/i);
      if (sMatch) slots.setsCount = parseInt(sMatch[1], 10);

      // Check reps
      const rMatch = text.match(/(\d+)\s*reps?/i);
      if (rMatch) slots.reps = parseInt(rMatch[1], 10);

      // Check weight
      const wMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilos?)/i);
      if (wMatch) slots.weightKg = parseFloat(wMatch[1]);

      // Check pacing & feel
      if (/slow/i.test(text)) slots.pacing = 'Slow';
      else if (/fast/i.test(text)) slots.pacing = 'Fast';
      else if (/moderate/i.test(text)) slots.pacing = 'Moderate';

      if (/easy/i.test(text)) slots.feel = 'Easy';
      else if (/challenging/i.test(text)) slots.feel = 'Challenging';
      else if (/hard/i.test(text)) slots.feel = 'Hard';
      else if (/comfortable/i.test(text)) slots.feel = 'Comfortable';

      // If user provided a complete one-shot like "log 3 sets of bench press at 65kg", default remaining optional slots if setsCount and weightKg were provided
      if (slots.workoutName && slots.setsCount && slots.weightKg) {
        if (!slots.reps) slots.reps = 10;
        if (!slots.pacing) slots.pacing = 'Moderate';
        if (!slots.feel) slots.feel = 'Comfortable';
      }

      return slots;
    },
    execute: (slots, machine) => {
      const prevSnap = JSON.parse(JSON.stringify(userState.movementLogs || []));
      const workoutName = slots.workoutName || 'Bench Press';
      const setsCount = parseInt(slots.setsCount, 10) || 3;
      const reps = parseInt(slots.reps, 10) || 10;
      const weightKg = parseFloat(slots.weightKg) || 0;
      const pacing = slots.pacing || 'Moderate';
      const feel = slots.feel || 'Comfortable';

      const sets = [];
      for (let i = 1; i <= setsCount; i++) {
        sets.push({ setNumber: i, weightKg: Number(weightKg), reps: Number(reps), isPR: false });
      }

      const isPR = checkAndUpdatePR(workoutName, weightKg, reps);
      if (isPR && sets.length > 0) sets[sets.length - 1].isPR = true;

      const dateStr = new Date().toISOString().slice(0, 10);
      const sessionId = 'session-' + Date.now();

      const entry = {
        id: 'move-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        date: dateStr,
        workoutName: workoutName,
        muscleGroup: 'chest',
        sets: sets,
        setsCount: setsCount,
        reps: reps,
        weightKg: weightKg,
        pacing: pacing,
        feel: feel,
        mode: 'strength',
        summary: `${workoutName}: ${setsCount} sets · ${reps} reps @ ${weightKg}kg (${pacing} pace, ${feel})`,
        supersetGroupId: null,
        sessionId: sessionId,
        timestamp: Date.now()
      };

      if (!userState.movementLogs) userState.movementLogs = [];
      userState.movementLogs.unshift(entry);

      // Check habit
      let habit = (userState.customHabits || []).find(h => h.title.includes('Movement') || h.title.includes('Strength') || h.icon === 'fitness_center');
      if (habit) {
        habit.completed = true;
        habit.subtitle = `${workoutName}: ${setsCount} sets @ ${weightKg}kg`;
      }

      saveStateToStorage();
      if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(false);
      if (typeof window.renderMovementLogs === 'function') window.renderMovementLogs();

      if (machine && typeof machine.triggerUndo === 'function') {
        machine.triggerUndo(`Logged ${setsCount} sets of ${workoutName} @ ${weightKg}kg`, {
          type: 'workout',
          sessionId: sessionId,
          prev: prevSnap
        });
      }

      return `Recorded ${workoutName}: ${setsCount} sets of ${reps} reps at ${weightKg}kg, ${pacing} pace, feeling ${feel}. ${isPR ? '🎉 New Personal Record recorded!' : 'Restorative effort.'}`;
    }
  },

  // ── 26. Cardio Flow Logging ──────────────────────────────────────────────
  {
    name: 'movement.logCardio',
    category: 'movement',
    patterns: [
      /(?:log|record|add) (?:cardio|treadmill|run|running|cycling|rowing|swim|swimming|elliptical)(?: for (\d+)\s*(?:mins?|minutes?))?/i,
      /(?:log|record|add|did|ran|walked|cycled) (\d+)\s*(?:mins?|minutes?)(?: of)? (cardio|treadmill|running|cycling|rowing|swimming|elliptical)/i,
      /(?:log|record|add) (\d+)\s*(?:mins?|minutes?) (?:cardio|treadmill|running|cycling|rowing|swimming|elliptical)/i
    ],
    requiredSlots: ['activity'],
    optionalSlots: ['durationMin', 'caloriesBurned'],
    slotPrompts: {
      activity: 'Which cardio activity did you do?',
      durationMin: 'For how many minutes?',
      caloriesBurned: 'How many calories did you burn?'
    },
    extractInitialSlots: (rawText) => {
      const text = rawText.toLowerCase();
      let activity = 'Treadmill';
      if (text.includes('run') || text.includes('running')) activity = 'Running';
      else if (text.includes('cycle') || text.includes('cycling') || text.includes('bike')) activity = 'Cycling';
      else if (text.includes('row') || text.includes('rowing')) activity = 'Rowing';
      else if (text.includes('swim') || text.includes('swimming')) activity = 'Swimming';
      else if (text.includes('elliptical')) activity = 'Elliptical';

      const dMatch = text.match(/(\d+)\s*(?:min|minute|minutes)/i);
      const cMatch = text.match(/(\d+)\s*(?:cal|calorie|calories|kcal)/i);

      return {
        activity,
        durationMin: dMatch ? parseInt(dMatch[1], 10) : 30,
        caloriesBurned: cMatch ? parseInt(cMatch[1], 10) : 280
      };
    },
    execute: async (slots, machine) => {
      const activity = slots.activity || 'Treadmill';
      const durationMin = slots.durationMin || 30;
      const caloriesBurned = slots.caloriesBurned || 280;

      const prevSnap = JSON.parse(JSON.stringify(userState.cardioLogs || []));
      const entry = logCardioSession({ activity, durationMin, caloriesBurned });

      let habit = (userState.customHabits || []).find(h => h.title.includes('Movement') || h.icon === 'fitness_center' || h.icon === 'directions_walk');
      if (habit) {
        habit.completed = true;
        habit.subtitle = `${activity}: ${durationMin}m (${caloriesBurned} cal)`;
      }

      saveStateToStorage();
      if (typeof window.recalculateAndSyncAll === 'function') window.recalculateAndSyncAll(false);

      if (machine && typeof machine.triggerUndo === 'function') {
        machine.triggerUndo(`Logged ${activity} (${durationMin}m · ${caloriesBurned} cal)`, {
          type: 'cardio',
          cardioId: entry.id,
          prev: prevSnap
        });
      }

      return `Logged **${durationMin} minutes of ${activity}** (${caloriesBurned} calories burned).`;
    }
  },

  // ── 27. Calorie Intake Logging ───────────────────────────────────────────
  {
    name: 'movement.logCalorie',
    category: 'movement',
    patterns: [
      /(?:log|record|add|ate) (\d+)\s*(?:calories|kcal)(?: for| of)? (.*)/i,
      /(?:log|record|add|ate) (.*?) (?:with|at|for) (\d+)\s*(?:calories|kcal)/i,
      /(?:log|record) (?:food|meal|snack|calories|calorie intake)/i
    ],
    requiredSlots: ['item'],
    optionalSlots: ['calories'],
    slotPrompts: {
      item: 'What did you eat?',
      calories: 'How many calories was the meal?'
    },
    extractInitialSlots: (rawText) => {
      const text = rawText.toLowerCase();
      const m1 = text.match(/(?:log|record|add|ate) (\d+)\s*(?:calories|kcal)(?: for| of)? (.*)/i);
      if (m1) {
        return { calories: parseInt(m1[1], 10), item: m1[2].trim() };
      }
      const m2 = text.match(/(?:log|record|add|ate) (.*?) (?:with|at|for) (\d+)\s*(?:calories|kcal)/i);
      if (m2) {
        return { item: m2[1].trim(), calories: parseInt(m2[2], 10) };
      }
      return { item: 'Meal', calories: 500 };
    },
    execute: async (slots, machine) => {
      const item = slots.item || 'Meal';
      const calories = slots.calories || 500;

      const prevSnap = JSON.parse(JSON.stringify(userState.calorieIntakeLogs || []));
      const entry = logCalorieIntake({ item, calories });

      if (machine && typeof machine.triggerUndo === 'function') {
        machine.triggerUndo(`Logged ${item} (${calories} kcal)`, {
          type: 'calories',
          foodId: entry.id,
          prev: prevSnap
        });
      }

      return `Logged **${item}** with **${calories} kcal**.`;
    }
  },

  // ── 28. Repeat Last Workout ──────────────────────────────────────────────
  {
    name: 'movement.repeatLast',
    category: 'movement',
    patterns: [
      /repeat (?:my )?last workout/i,
      /log same workout as last time/i,
      /repeat (?:push|pull|legs|chest|back) day/i
    ],
    execute: () => {
      const session = getLatestWorkoutSession();
      if (!session) {
        return "You have not logged any previous workout sessions yet to repeat.";
      }
      if (typeof window.openMovementLogger === 'function') {
        window.openMovementLogger('strength');
        if (typeof window.repeatLastWorkout === 'function') {
          window.repeatLastWorkout();
        }
      }
      return `Pre-filled your last session: **${session.sessionTitle}** (${session.exercises.length} exercises). Opened in Log Movement for you to review or adjust.`;
    }
  },

  // ── 29. Check Personal Record (PR) ───────────────────────────────────────
  {
    name: 'movement.checkPR',
    category: 'movement',
    patterns: [
      /what('s| is) my (?:pr|personal record|personal best)(?: on| for)? (.*)/i,
      /show (?:my )?(?:prs|personal records)/i
    ],
    execute: (slots, machine, rawText) => {
      const lib = getExerciseLibrary ? getExerciseLibrary() : (userState.exerciseLibrary || []);
      const q = (rawText || '').toLowerCase();
      const matched = lib.find(e => q.includes(e.name.toLowerCase()));
      if (matched && matched.personalBest && (matched.personalBest.weightKg > 0 || matched.personalBest.reps > 0)) {
        return `Your current PR for **${matched.name}** is **${matched.personalBest.weightKg} KG for ${matched.personalBest.reps} reps**!`;
      }
      const recordedPRs = lib.filter(e => e.personalBest && (e.personalBest.weightKg > 0 || e.personalBest.reps > 0));
      if (recordedPRs.length > 0) {
        const list = recordedPRs.slice(0, 4).map(e => `• **${e.name}**: ${e.personalBest.weightKg}kg × ${e.personalBest.reps}`).join('\n');
        return `Here are your verified PRs:\n${list}`;
      }
      return "You have not recorded any Personal Records yet. Log your sets in Log Movement to track PRs automatically!";
    }
  }
];

// ── Candidate Matcher & Clarification Detector ───────────────────────────────

/**
 * Finds best intent candidate for an utterance or identifies ambiguity.
 * Returns { intentDef, initialSlots, confidence, candidateGuess }
 */
export function matchIntent(rawText) {
  const norm = normalizeTranscript(rawText);

  // Exact pattern matching pass
  for (const def of INTENT_DEFINITIONS) {
    for (const pattern of def.patterns) {
      if (pattern instanceof RegExp) {
        if (pattern.test(norm) || pattern.test(rawText)) {
          const initialSlots = def.extractInitialSlots ? def.extractInitialSlots(rawText) : {};
          return { intentDef: def, initialSlots, confidence: 1.0 };
        }
      } else if (typeof pattern === 'string') {
        if (norm.includes(pattern.toLowerCase())) {
          const initialSlots = def.extractInitialSlots ? def.extractInitialSlots(rawText) : {};
          return { intentDef: def, initialSlots, confidence: 0.9 };
        }
      }
    }
  }

  // Fuzzy / Keyword detection for clarification candidates
  if (/focus/i.test(norm)) {
    const focusDef = INTENT_DEFINITIONS.find(d => d.name === 'focus.start');
    return { intentDef: null, candidateGuess: { intentDef: focusDef, description: 'start a focus session' }, confidence: 0.5 };
  }
  if (/water|hydrat/i.test(norm)) {
    const waterDef = INTENT_DEFINITIONS.find(d => d.name === 'water.log');
    return { intentDef: null, candidateGuess: { intentDef: waterDef, description: 'log your water intake' }, confidence: 0.5 };
  }
  if (/to-?do|task/i.test(norm)) {
    const todoDef = INTENT_DEFINITIONS.find(d => d.name === 'todos.createLoop');
    return { intentDef: null, candidateGuess: { intentDef: todoDef, description: 'create a to-do list' }, confidence: 0.5 };
  }
  if (/workout|bench|exercise/i.test(norm)) {
    const moveDef = INTENT_DEFINITIONS.find(d => d.name === 'movement.logStrength');
    return { intentDef: null, candidateGuess: { intentDef: moveDef, description: 'log a workout' }, confidence: 0.5 };
  }
  if (/habit|ritual/i.test(norm)) {
    const habitDef = INTENT_DEFINITIONS.find(d => d.name === 'habits.complete');
    return { intentDef: null, candidateGuess: { intentDef: habitDef, description: 'complete a habit' }, confidence: 0.5 };
  }

  return { intentDef: null, candidateGuess: null, confidence: 0.0 };
}

// ── Speech Formatter Helpers ─────────────────────────────────────────────────

function inferHabitIcon(title) {
  const t = title.toLowerCase();
  if (/water|drink|hydrat/.test(t)) return 'water_drop';
  if (/breath|meditat|stillness|mindful/.test(t)) return 'air';
  if (/read|book|journal|write/.test(t)) return 'auto_stories';
  if (/walk|run|gym|workout|stretch|exercise/.test(t)) return 'directions_walk';
  if (/focus|work|study|deep work/.test(t)) return 'center_focus_strong';
  if (/sleep|bed|night|rest/.test(t)) return 'bedtime';
  return 'spa';
}

function formatTimeForSpeech(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let h = parseInt(parts[0], 10);
  const m = parseInt(parts[1] || '0', 10);
  const ampm = h >= 12 ? 'pm' : 'am';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return m === 0 ? `${h} ${ampm}` : `${h}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatDateForSpeech(dateStr) {
  if (!dateStr) return 'today';
  if (dateStr === getTodayDateString()) return 'today';
  try {
    const parts = dateStr.split('-');
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateStr;
  }
}
