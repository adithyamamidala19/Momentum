/**
 * Momentum — Mindful To-Do Component
 * ─────────────────────────────────────────────────────────────────────────────
 * Independent one-off date-scoped task management with botanical styling,
 * 10-second undo buffer integration, and full WCAG 2.1 AA accessibility.
 */

import { userState, getTodayDateString, createTodoItem, addTodo, toggleTodo, deleteTodo, rescheduleTodo, saveStateToStorage } from '../state.js';
import { showToast } from '../pages/profile.js';

let activeFilter = 'today'; // 'today' | 'all' | 'completed'

export function getTodosActiveFilter() {
  return activeFilter;
}

export function setTodosFilter(filter) {
  activeFilter = filter;
  renderTodosUI();
}

/**
 * Format ISO YYYY-MM-DD to human friendly label
 */
export function formatTodoDate(dateStr) {
  if (!dateStr) return 'Today';
  const today = getTodayDateString();
  if (dateStr === today) return 'Today';

  const todayDate = new Date();
  const tomorrow = new Date(todayDate);
  tomorrow.setDate(todayDate.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);
  if (dateStr === tomorrowStr) return 'Tomorrow';

  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  } catch (e) {}
  return dateStr;
}

/**
 * Renders both the Today screen card section and the full To-Do view
 */
export function renderTodosUI() {
  renderTodayTodosSection();
  renderFullTodosView();
}

/**
 * Renders the compact To-Do card section on the Today Screen
 */
function renderTodayTodosSection() {
  const container = document.getElementById('today-todos-list');
  const countBadge = document.getElementById('today-todos-count');
  if (!container) return;

  const today = getTodayDateString();
  const allTodos = userState.todos || [];
  const todayTodos = allTodos.filter(t => t.date === today);
  const pendingToday = todayTodos.filter(t => !t.completed);

  if (countBadge) {
    countBadge.textContent = `${pendingToday.length} left`;
    countBadge.className = pendingToday.length > 0
      ? 'text-[11px] px-2 py-0.5 rounded-full bg-primary-fixed text-primary font-medium'
      : 'text-[11px] px-2 py-0.5 rounded-full bg-surface-container text-outline font-normal';
  }

  container.innerHTML = '';

  if (todayTodos.length === 0) {
    container.innerHTML = `
      <div class="p-4 rounded-2xl bg-surface-container-low text-center text-xs text-outline hairline">
        No to-dos for today. Say <span class="font-medium text-primary">"Create a to-do list for today"</span> or type below.
      </div>
    `;
    return;
  }

  todayTodos.forEach(item => {
    container.appendChild(createTodoCardElement(item, false));
  });
}

/**
 * Renders the dedicated full view (#view-todos)
 */
function renderFullTodosView() {
  const container = document.getElementById('full-todos-list');
  const summaryEl = document.getElementById('todos-view-summary');
  if (!container) return;

  const today = getTodayDateString();
  const allTodos = userState.todos || [];

  let filtered = [];
  if (activeFilter === 'today') {
    filtered = allTodos.filter(t => t.date === today);
  } else if (activeFilter === 'completed') {
    filtered = allTodos.filter(t => t.completed);
  } else {
    filtered = [...allTodos];
  }

  // Update tabs styling
  const tabToday = document.getElementById('todo-tab-today');
  const tabAll = document.getElementById('todo-tab-all');
  const tabCompleted = document.getElementById('todo-tab-completed');

  const activeTabClass = 'px-3 py-1.5 rounded-full bg-primary text-on-primary text-xs font-semibold shadow-xs border-0 cursor-pointer transition-all';
  const inactiveTabClass = 'px-3 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-on-surface text-xs font-medium border-0 cursor-pointer transition-all';

  if (tabToday) tabToday.className = activeFilter === 'today' ? activeTabClass : inactiveTabClass;
  if (tabAll) tabAll.className = activeFilter === 'all' ? activeTabClass : inactiveTabClass;
  if (tabCompleted) tabCompleted.className = activeFilter === 'completed' ? activeTabClass : inactiveTabClass;

  if (summaryEl) {
    const pendingTotal = allTodos.filter(t => !t.completed).length;
    summaryEl.textContent = `${pendingTotal} pending task${pendingTotal === 1 ? '' : 's'} across your mindful schedule`;
  }

  container.innerHTML = '';

  if (filtered.length === 0) {
    const emptyMsg = activeFilter === 'today'
      ? 'No tasks scheduled for today. Savor the unhurried space.'
      : activeFilter === 'completed'
      ? 'No completed tasks yet. Begin with a single mindful step.'
      : 'Your to-do sanctuary is clear.';
    container.innerHTML = `
      <div class="p-8 rounded-3xl bg-surface-container-lowest text-center text-sm text-outline hairline">
        <span class="material-symbols-outlined text-[32px] text-outline/60 block mb-2">task_alt</span>
        <p>${emptyMsg}</p>
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    container.appendChild(createTodoCardElement(item, true));
  });
}

/**
 * Creates a single DOM card element for a To-Do item
 */
function createTodoCardElement(item, showDateBadge = false) {
  const card = document.createElement('div');
  const isDone = Boolean(item.completed);
  const priority = item.priority || 'normal';

  const priorityBadge = priority === 'high'
    ? '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-700 font-semibold tracking-wide">High</span>'
    : priority === 'low'
    ? '<span class="text-[10px] px-1.5 py-0.5 rounded-md bg-surface-container-highest text-outline font-medium">Low</span>'
    : '';

  const dateLabel = formatTodoDate(item.date);
  const dateBadge = showDateBadge
    ? `<span class="text-[10px] px-2 py-0.5 rounded-full ${item.date === getTodayDateString() ? 'bg-primary-fixed text-primary font-medium' : 'bg-surface-container text-outline'}">${dateLabel}</span>`
    : '';

  const timeBadge = item.time
    ? `<span class="text-[11px] text-outline flex items-center gap-0.5"><span class="material-symbols-outlined text-[13px]">schedule</span>${item.time}</span>`
    : '';

  const voiceBadge = item.createdVia === 'voice'
    ? '<span title="Created via Aria Voice" class="material-symbols-outlined text-[14px] text-primary/70">graphic_eq</span>'
    : '';

  card.className = `group flex items-center justify-between p-3.5 rounded-2xl bg-surface-container-low hover:bg-surface-container hairline transition-all ${isDone ? 'opacity-75' : ''}`;
  card.setAttribute('role', 'listitem');

  card.innerHTML = `
    <div class="flex items-center gap-3 min-w-0 flex-1 mr-2">
      <!-- Checkbox toggle button -->
      <button type="button"
              role="checkbox"
              aria-checked="${isDone}"
              aria-label="Mark task '${escapeHtml(item.title)}' as ${isDone ? 'incomplete' : 'completed'}"
              class="todo-check-btn w-6 h-6 rounded-lg border ${isDone ? 'bg-primary text-on-primary border-primary shadow-xs' : 'border-outline hover:border-primary bg-transparent'} flex items-center justify-center cursor-pointer transition-all active:scale-90 shrink-0"
              tabindex="0">
        ${isDone ? '<span class="material-symbols-outlined text-[16px]">check</span>' : ''}
      </button>

      <!-- Title & Badges -->
      <div class="flex flex-col min-w-0 flex-1">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="todo-title font-body-md text-sm font-medium ${isDone ? 'line-through text-outline' : 'text-on-surface'} truncate">
            ${escapeHtml(item.title)}
          </span>
          ${priorityBadge}
          ${voiceBadge}
        </div>
        <div class="flex items-center gap-2 mt-0.5 text-[11px] text-outline">
          ${dateBadge}
          ${timeBadge}
          ${item.notes ? `<span class="truncate">${escapeHtml(item.notes)}</span>` : ''}
        </div>
      </div>
    </div>

    <!-- Actions (Delete button) -->
    <div class="flex items-center gap-1 shrink-0">
      <button type="button"
              aria-label="Delete task '${escapeHtml(item.title)}'"
              title="Delete task"
              class="todo-delete-btn w-7 h-7 rounded-full text-outline hover:text-error hover:bg-error/10 flex items-center justify-center cursor-pointer border-0 bg-transparent opacity-50 group-hover:opacity-100 transition-all">
        <span class="material-symbols-outlined text-[16px]">delete</span>
      </button>
    </div>
  `;

  // Attach event handlers
  const checkBtn = card.querySelector('.todo-check-btn');
  if (checkBtn) {
    checkBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleToggleTodoWithUndo(item.id);
    });
    checkBtn.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleToggleTodoWithUndo(item.id);
      }
    });
  }

  const deleteBtn = card.querySelector('.todo-delete-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleDeleteTodoWithUndo(item.id);
    });
  }

  return card;
}

/**
 * Toggle completion with 10-second undo buffer integration
 */
export function handleToggleTodoWithUndo(todoId) {
  const prevSnapshot = JSON.parse(JSON.stringify(userState.todos || []));
  const updated = toggleTodo(todoId);
  if (!updated) return;

  const msg = updated.completed
    ? `Completed to-do "${updated.title}"`
    : `Marked "${updated.title}" as pending`;

  if (typeof window !== 'undefined' && window.MomentumVoiceAgent && typeof window.MomentumVoiceAgent._triggerUndoToast === 'function') {
    window.MomentumVoiceAgent._triggerUndoToast(msg, { type: 'todos', prev: prevSnapshot });
  }

  if (typeof showToast === 'function') {
    showToast(updated.completed ? `✨ ${msg}` : `🌱 ${msg}`);
  }
}

/**
 * Delete to-do with 10-second undo buffer integration
 */
export function handleDeleteTodoWithUndo(todoId) {
  const prevSnapshot = JSON.parse(JSON.stringify(userState.todos || []));
  const deleted = deleteTodo(todoId);
  if (!deleted) return;

  const msg = `Deleted to-do "${deleted.title}"`;

  if (typeof window !== 'undefined' && window.MomentumVoiceAgent && typeof window.MomentumVoiceAgent._triggerUndoToast === 'function') {
    window.MomentumVoiceAgent._triggerUndoToast(msg, { type: 'todos', prev: prevSnapshot });
  }

  if (typeof showToast === 'function') {
    showToast(`🗑️ ${msg}`);
  }
}

/**
 * Quick add submission handler for Today section form
 */
export function handleQuickAddTodo(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('today-todo-quick-input');
  if (!input) return;
  const title = input.value.trim();
  if (!title) return;

  const prevSnapshot = JSON.parse(JSON.stringify(userState.todos || []));
  const item = createTodoItem({
    title,
    date: getTodayDateString(),
    createdVia: 'manual'
  });
  addTodo(item);
  input.value = '';

  if (typeof window !== 'undefined' && window.MomentumVoiceAgent && typeof window.MomentumVoiceAgent._triggerUndoToast === 'function') {
    window.MomentumVoiceAgent._triggerUndoToast(`Added to-do "${item.title}"`, { type: 'todos', prev: prevSnapshot });
  }

  if (typeof showToast === 'function') {
    showToast(`🌿 Added to-do: "${item.title}"`);
  }
}

/**
 * Quick add submission handler for full #view-todos form
 */
export function handleFullAddTodo(e) {
  if (e) e.preventDefault();
  const inputTitle = document.getElementById('full-todo-input-title');
  const inputDate = document.getElementById('full-todo-input-date');
  const selectPriority = document.getElementById('full-todo-input-priority');

  const title = inputTitle ? inputTitle.value.trim() : '';
  if (!title) return;

  const date = inputDate && inputDate.value ? inputDate.value : getTodayDateString();
  const priority = selectPriority ? selectPriority.value : 'normal';

  const prevSnapshot = JSON.parse(JSON.stringify(userState.todos || []));
  const item = createTodoItem({
    title,
    date,
    priority,
    createdVia: 'manual'
  });
  addTodo(item);

  if (inputTitle) inputTitle.value = '';

  if (typeof window !== 'undefined' && window.MomentumVoiceAgent && typeof window.MomentumVoiceAgent._triggerUndoToast === 'function') {
    window.MomentumVoiceAgent._triggerUndoToast(`Added to-do "${item.title}"`, { type: 'todos', prev: prevSnapshot });
  }

  if (typeof showToast === 'function') {
    showToast(`🌿 Added task for ${formatTodoDate(date)}`);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.renderTodosUI = renderTodosUI;
  window.setTodosFilter = setTodosFilter;
  window.handleToggleTodoWithUndo = handleToggleTodoWithUndo;
  window.handleDeleteTodoWithUndo = handleDeleteTodoWithUndo;
  window.handleQuickAddTodo = handleQuickAddTodo;
  window.handleFullAddTodo = handleFullAddTodo;
}
