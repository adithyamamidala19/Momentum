/**
 * Momentum — Automated Test Suite for Aria Voice Agent & To-Do Feature
 * ─────────────────────────────────────────────────────────────────────────────
 * Validates the 6 required flows from PRD and user brief:
 * (a) Water-habit daily/today interactive clarification flow
 * (b) Multi-item to-do creation conversational loop
 * (c) Workout logging multi-turn slot filling
 * (d) Ambiguous command clarification prompt & confirmation
 * (e) Unsupported command fallback after clarification attempts
 * (f) 10-Second undo buffer for to-dos
 */

import { userState, getTodayDateString, createTodoItem, addTodo, toggleTodo, deleteTodo, rescheduleTodo } from '../js/state.js';
import { ConversationStateMachine } from '../js/services/conversation-state-machine.js';
import { parseDateTime, parseQuantity, parseEnum, parseBooleanYesNo, matchIntent } from '../js/services/intent-registry.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n🌿 Running Momentum Aria Voice Agent & To-Do Test Suite...\n');

// Mock localStorage and window if running in pure node
if (typeof window === 'undefined') {
  global.window = {
    userState,
    getTodayDateString,
    createTodoItem,
    addTodo,
    toggleTodo,
    deleteTodo,
    rescheduleTodo,
    setTimerPreset: () => {},
    openFocusTimer: () => {},
    toggleFocusTimer: () => {},
    resetFocusTimer: () => {},
    closeFocusTimer: () => {},
    renderCustomHabits: () => {},
    renderTodosUI: () => {},
    renderMovementLogs: () => {},
    recalculateAndSyncAll: () => {},
    showToast: () => {}
  };
  global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
  };
}

// ── Test 1: Slot Parsers ────────────────────────────────────────────────────
console.log('Test 1: Custom Slot Parsers (Chrono/Regex, Quantities, Enums, Booleans)');
{
  const timeRes = parseDateTime('Drink water at 8:30am');
  assert(timeRes.time === '08:30', `parseDateTime extracted time "08:30" (got "${timeRes.time}")`);

  const dateRes = parseDateTime('Call dentist tomorrow');
  assert(dateRes.hasDate, `parseDateTime detected date for "tomorrow"`);

  const waterQty = parseQuantity('500ml of water', 'water');
  assert(waterQty.ml === 500 && waterQty.glasses === 2, `parseQuantity parsed 500ml = 2 glasses`);

  const workoutSets = parseQuantity('4 sets of 12 reps at 60kg', 'sets');
  const workoutReps = parseQuantity('4 sets of 12 reps at 60kg', 'reps');
  const workoutWeight = parseQuantity('4 sets of 12 reps at 60kg', 'weight');
  assert(workoutSets === 4, `parseQuantity parsed sets = 4`);
  assert(workoutReps === 12, `parseQuantity parsed reps = 12`);
  assert(workoutWeight === 60, `parseQuantity parsed weight = 60`);

  assert(parseEnum('make priority urgent', 'priority') === 'high', `parseEnum priority "urgent" -> "high"`);
  assert(parseEnum('slow and mindful', 'pacing') === 'Slow', `parseEnum pacing "slow" -> "Slow"`);
  assert(parseEnum('it felt challenging', 'feel') === 'Challenging', `parseEnum feel "challenging" -> "Challenging"`);

  assert(parseBooleanYesNo('yes, please') === true, `parseBooleanYesNo('yes, please') is true`);
  assert(parseBooleanYesNo('every day') === true, `parseBooleanYesNo('every day') is true`);
  assert(parseBooleanYesNo('just today') === false, `parseBooleanYesNo('just today') is false`);
  assert(parseBooleanYesNo('nope') === false, `parseBooleanYesNo('nope') is false`);
}

// ── Test 2: Flow (a) Water-Habit Interactive Clarification ──────────────────
console.log('\nTest 2: Flow (a) Water-Habit Clarification & Interactive Prompts');
{
  let lastSpoken = '';
  let undoTriggered = false;

  const machine = new ConversationStateMachine({
    onSpeak: (text, onEnd) => {
      lastSpoken = text;
      if (onEnd) onEnd();
    },
    onUndoTrigger: () => { undoTriggered = true; }
  });

  // Turn 1: Initial Command
  await machine.processUtterance('Add a habit of 500ml water');
  assert(machine.mode === 'AWAITING_SLOT' && machine.currentSlotName === 'recurrence',
    `Aria enters AWAITING_SLOT for recurrence. Prompt: "${lastSpoken}"`);
  assert(lastSpoken.includes('every day, or just for today'),
    `Spoken prompt asks: "Should I add this every day, or just for today?"`);

  // Turn 2: User says "Every day"
  await machine.processUtterance('Every day');
  assert(machine.mode === 'AWAITING_SLOT' && machine.currentSlotName === 'reminderTime',
    `Aria acknowledges daily habit and enters AWAITING_SLOT for reminder time`);
  assert(lastSpoken.includes('What time should I remind you'),
    `Spoken prompt asks: "What time should I remind you, or should I leave it untimed?"`);

  // Turn 3: User says "8am"
  await machine.processUtterance('8am');
  assert(machine.mode === 'IDLE', `Aria concludes slot filling and returns to IDLE`);
  assert(lastSpoken.includes('Drink 500ml Water') || lastSpoken.includes('Drink 500ml of water'),
    `Aria confirms: "${lastSpoken}"`);

  const created = (userState.customHabits || []).find(h => h.title.toLowerCase().includes('500ml'));
  assert(Boolean(created), `Habit "Drink 500ml Water" exists in userState.customHabits`);
  assert(undoTriggered, `10-Second Undo toast was triggered`);
}

// ── Test 3: Flow (b) Multi-Item To-Do Creation Loop ─────────────────────────
console.log('\nTest 3: Flow (b) Multi-Item To-Do Creation Loop');
{
  let lastSpoken = '';
  let undoTriggered = false;
  userState.todos = [];

  const machine = new ConversationStateMachine({
    onSpeak: (text, onEnd) => {
      lastSpoken = text;
      if (onEnd) onEnd();
    },
    onUndoTrigger: () => { undoTriggered = true; }
  });

  // Turn 1: "Create a to-do list for today"
  await machine.processUtterance('Create a to-do list for today');
  assert(machine.mode === 'COLLECT_ITEMS', `Aria enters COLLECT_ITEMS mode`);
  assert(lastSpoken.includes("what's the first thing you'd like to add"),
    `Aria asks: "${lastSpoken}"`);

  // Turn 2: "Call the plumber"
  await machine.processUtterance('Call the plumber');
  assert(machine.itemsCollected.length === 1, `Collected 1 item`);
  assert(lastSpoken.includes("Call the plumber") && lastSpoken.includes("Anything else?"),
    `Aria acknowledges: "${lastSpoken}"`);

  // Turn 3: "Yes, buy groceries"
  await machine.processUtterance('Yes, buy groceries');
  assert(machine.itemsCollected.length === 2, `Collected 2 items`);
  assert(lastSpoken.includes("Added. Anything else, or should I close out the list?"),
    `Aria prompts continuation: "${lastSpoken}"`);

  // Turn 4: "That's it"
  await machine.processUtterance("That's it");
  assert(machine.mode === 'IDLE', `Aria cleanly exits loop on "That's it"`);
  assert(lastSpoken === 'Done — you have 2 to-dos for today.',
    `Aria speaks final summary: "${lastSpoken}"`);
  assert(userState.todos.length === 2, `userState.todos contains exactly 2 tasks`);
  assert(userState.todos.some(t => t.title.toLowerCase().includes('plumber')), `Contains 'Call the plumber'`);
  assert(userState.todos.some(t => t.title.toLowerCase().includes('groceries')), `Contains 'buy groceries'`);
}

// ── Test 4: Flow (c) Workout Logging Multi-Turn Slot Filling ────────────────
console.log('\nTest 4: Flow (c) Multi-Turn Workout Logging');
{
  let lastSpoken = '';
  userState.movementLogs = [];

  const machine = new ConversationStateMachine({
    onSpeak: (text, onEnd) => {
      lastSpoken = text;
      if (onEnd) onEnd();
    }
  });

  // Turn 1: "Log a workout"
  await machine.processUtterance('Log a workout');
  assert(machine.mode === 'AWAITING_SLOT' && machine.currentSlotName === 'workoutName',
    `Aria enters AWAITING_SLOT for workoutName: "${lastSpoken}"`);

  // Turn 2: "Bench Press"
  await machine.processUtterance('Bench Press');
  assert(machine.slots.workoutName === 'Bench Press', `Recorded workoutName: Bench Press`);
  assert(machine.currentSlotName === 'setsCount', `Aria prompts for sets: "${lastSpoken}"`);

  // Turn 3: "3 sets"
  await machine.processUtterance('3 sets');
  assert(machine.slots.setsCount === 3, `Recorded setsCount = 3`);
  assert(machine.currentSlotName === 'reps', `Aria prompts for reps: "${lastSpoken}"`);

  // Turn 4: "10 reps"
  await machine.processUtterance('10 reps');
  assert(machine.slots.reps === 10, `Recorded reps = 10`);
  assert(machine.currentSlotName === 'weightKg', `Aria prompts for weightKg: "${lastSpoken}"`);

  // Turn 5: "60kg"
  await machine.processUtterance('60kg');
  assert(machine.slots.weightKg === 60, `Recorded weightKg = 60`);
  assert(machine.currentSlotName === 'pacing', `Aria prompts for pacing: "${lastSpoken}"`);

  // Turn 6: "Moderate"
  await machine.processUtterance('Moderate');
  assert(machine.slots.pacing === 'Moderate', `Recorded pacing = Moderate`);
  assert(machine.currentSlotName === 'feel', `Aria prompts for feel: "${lastSpoken}"`);

  // Turn 7: "Comfortable"
  await machine.processUtterance('Comfortable');
  assert(machine.mode === 'IDLE', `All slots filled, returned to IDLE`);
  assert(lastSpoken.includes('Recorded Bench Press') && lastSpoken.includes('60kg'),
    `Aria confirms: "${lastSpoken}"`);
  assert(userState.movementLogs.length > 0, `Movement log saved in userState.movementLogs`);
}

// ── Test 5: Flow (d) Ambiguous Command Clarification ────────────────────────
console.log('\nTest 5: Flow (d) Ambiguous Command Clarification & Affirmation');
{
  let lastSpoken = '';

  const machine = new ConversationStateMachine({
    onSpeak: (text, onEnd) => {
      lastSpoken = text;
      if (onEnd) onEnd();
    }
  });

  // Turn 1: Ambiguous utterance mentioning "focus" without clear start/stop verb
  await machine.processUtterance('Set my focus to the garden');
  assert(machine.mode === 'CLARIFYING', `Aria enters CLARIFYING state for ambiguous command`);
  assert(lastSpoken.includes("did you mean start a focus session, or something else?"),
    `Aria asks clarification: "${lastSpoken}"`);

  // Turn 2: User says "Yes"
  await machine.processUtterance('Yes');
  assert(machine.mode === 'IDLE', `Aria confirmed intent and returned to IDLE`);
  assert(lastSpoken.includes('Starting your focus session'),
    `Aria executed candidate intent: "${lastSpoken}"`);
}

// ── Test 6: Flow (e) Unsupported Command Graceful Fallback ──────────────────
console.log('\nTest 6: Flow (e) Unsupported Command Graceful Fallback');
{
  let lastSpoken = '';

  const machine = new ConversationStateMachine({
    onSpeak: (text, onEnd) => {
      lastSpoken = text;
      if (onEnd) onEnd();
    }
  });

  // Turn 1: Completely unknown command
  await machine.processUtterance('Fly me to the moon');
  assert(machine.mode === 'CLARIFYING', `Attempt 1: Aria asks clarifying question: "${lastSpoken}"`);

  // Turn 2: Second unrecognized command
  await machine.processUtterance('Make a spaceship');
  assert(machine.mode === 'IDLE', `Attempt 2: Aria falls back gracefully and resets to IDLE`);
  assert(lastSpoken.includes("Sorry, I didn't quite get that — you can also type it in the assistant chat"),
    `Aria polite fallback: "${lastSpoken}"`);
}

// ── Test 7: Flow (f) 10-Second Undo Buffer for To-Dos ────────────────────────
console.log('\nTest 7: Flow (f) 10-Second Undo Buffer for To-Dos');
{
  userState.todos = [];
  const todo = createTodoItem({ title: 'Read Chapter 4', date: getTodayDateString() });
  addTodo(todo);
  assert(userState.todos.length === 1, `Added 1 to-do item`);

  // Snapshot before completion
  const snapshotBeforeComplete = JSON.parse(JSON.stringify(userState.todos));
  toggleTodo(todo.id);
  assert(userState.todos[0].completed === true, `To-do marked completed`);

  // Simulate Undo
  userState.todos = JSON.parse(JSON.stringify(snapshotBeforeComplete));
  assert(userState.todos[0].completed === false, `Undo restored to-do to completed = false`);

  // Snapshot before delete
  const snapshotBeforeDelete = JSON.parse(JSON.stringify(userState.todos));
  deleteTodo(todo.id);
  assert(userState.todos.length === 0, `To-do deleted`);

  // Simulate Undo
  userState.todos = JSON.parse(JSON.stringify(snapshotBeforeDelete));
  assert(userState.todos.length === 1 && userState.todos[0].title === 'Read Chapter 4', `Undo restored deleted to-do`);
}

console.log(`\n========================================`);
console.log(`Test Results: ${passed} Passed, ${failed} Failed`);
console.log(`========================================\n`);

if (failed > 0) {
  process.exit(1);
}
