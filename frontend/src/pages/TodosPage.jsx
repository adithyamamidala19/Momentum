import React, { useState } from 'react';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import {
  Plus,
  Check,
  Trash2,
  Calendar,
  Edit2,
  Sparkles,
  CheckCircle2,
  Clock,
  Feather
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatFriendlyDate, getCurrentDateISO } from '../utils/formatters.js';

export default function TodosPage() {
  const { state, addTodoTask, toggleTodoTask, deleteTodoTask, editTodoTask } = useMomentum();
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'completed'
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState('normal'); // 'low' | 'normal' | 'high'
  const [dueDate, setDueDate] = useState('');

  // Inline editing state
  const [editingId, setEditingId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const todos = state.todos || [];

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addTodoTask({
      title: newTitle.trim(),
      priority,
      date: dueDate || getCurrentDateISO(),
      createdVia: 'manual'
    });
    setNewTitle('');
    setDueDate('');
  };

  const handleStartEdit = (todo) => {
    setEditingId(todo.id);
    setEditingText(todo.title);
  };

  const handleSaveEdit = (id) => {
    if (editingText.trim()) {
      editTodoTask(id, { title: editingText.trim() });
    }
    setEditingId(null);
  };

  const filteredTodos = todos.filter(t => {
    if (filter === 'pending') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  const priorityStyles = {
    low: { dot: 'bg-[#0F6E56]', bg: 'bg-[#E8F5F1]', text: 'text-[#0F6E56]', label: 'Low' },
    normal: { dot: 'bg-[#4A5550]', bg: 'bg-surface-container', text: 'text-on-surface', label: 'Normal' },
    high: { dot: 'bg-[#D97706]', bg: 'bg-amber-100', text: 'text-amber-900', label: 'High 🔥' }
  };

  return (
    <PageShell>
      {/* ── Page Header ── */}
      <PageHeader
        eyebrow="FOCUS & CLARITY"
        title="Intentional To-Dos"
        subtitle="Lightweight, high-priority tasks with a working 10-second undo safety net and inline refinement."
      />

      {/* ── Quick Add Form with Custom Segmented Priority & Optional Due Date ── */}
      <form
        onSubmit={handleAdd}
        className="p-4 sm:p-5 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-3 mb-8"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            type="text"
            placeholder="Add an intentional task for today..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl bg-surface-container-low hairline text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
            required
          />

          <button
            type="submit"
            className="px-5 py-3 rounded-2xl bg-primary-container hover:bg-primary-container-hover text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border-0 shadow-xs transition-colors shrink-0 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Priority Segmented Control & Due Date Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-surface-container">
          {/* Custom Segmented Priority Control */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-outline mr-1">Priority:</span>
            {['low', 'normal', 'high'].map(p => {
              const isSelected = priority === p;
              const pConfig = priorityStyles[p];
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? `${pConfig.bg} ${pConfig.text} border-current shadow-2xs`
                      : 'bg-surface-container border-transparent text-outline hover:text-on-surface'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${pConfig.dot}`} />
                  <span>{pConfig.label}</span>
                </button>
              );
            })}
          </div>

          {/* Optional Due Date */}
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-outline shrink-0" />
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-surface-container-low hairline text-xs text-outline focus:outline-none focus:ring-1 focus:ring-primary-container"
              title="Optional due date"
            />
          </div>
        </div>
      </form>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-2 mb-4">
        {['all', 'pending', 'completed'].map(f => {
          const count = todos.filter(t => f === 'all' ? true : f === 'pending' ? !t.completed : t.completed).length;
          const isSelected = filter === f;

          return (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`relative px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors capitalize ${
                isSelected
                  ? 'text-white'
                  : 'bg-surface-container text-outline hover:text-on-surface'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeTodoFilter"
                  className="absolute inset-0 rounded-full bg-primary-container shadow-xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10">{f} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* ── Tasks List with Layout Animations & AnimatePresence ── */}
      <motion.div layout className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredTodos.length === 0 ? (
            /* Mindful Designed Empty State */
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3 }}
              className="p-12 text-center rounded-3xl bg-surface-container-low/70 hairline flex flex-col items-center justify-center select-none"
            >
              <div className="w-14 h-14 rounded-full bg-[#0F6E56]/10 text-[#0F6E56] flex items-center justify-center mb-3">
                <Feather className="w-7 h-7" />
              </div>
              <h3 className="font-editorial text-xl font-normal text-on-surface">
                Nothing pending. A quiet mind.
              </h3>
              <p className="text-xs text-outline mt-1 max-w-sm">
                Enjoy this open space, or write down only what truly moves your rhythm forward today.
              </p>
            </motion.div>
          ) : (
            filteredTodos.map(todo => {
              const pConfig = priorityStyles[todo.priority] || priorityStyles.normal;
              const isEditing = editingId === todo.id;

              return (
                <motion.div
                  key={todo.id}
                  layout
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92, height: 0, marginBottom: 0, overflow: 'hidden' }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className={`p-4 rounded-2xl hairline flex items-center justify-between gap-3 transition-colors ${
                    todo.completed
                      ? 'bg-surface-container-low/60 border-primary-container/20 opacity-80'
                      : 'bg-surface-container-lowest hover:bg-surface-container-low/30'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    {/* Checkbox */}
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.85 }}
                      onClick={() => toggleTodoTask(todo.id)}
                      className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 cursor-pointer border transition-colors ${
                        todo.completed
                          ? 'bg-primary-container border-primary-container text-white shadow-xs'
                          : 'border-outline-variant/60 hover:border-primary-container bg-surface-container-lowest'
                      }`}
                      aria-label={todo.completed ? 'Mark task incomplete' : 'Mark task complete'}
                    >
                      {todo.completed && (
                        <svg viewBox="0 0 24 24" className="w-4 h-4 stroke-current fill-none stroke-[3] stroke-linecap-round stroke-linejoin-round">
                          <motion.path
                            d="M 5 12 L 10 17 L 19 7"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                          />
                        </svg>
                      )}
                    </motion.button>

                    {/* Task Title & Metadata */}
                    <div className="min-w-0 flex-1" onDoubleClick={() => handleStartEdit(todo)}>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingText}
                          onChange={e => setEditingText(e.target.value)}
                          onBlur={() => handleSaveEdit(todo.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEdit(todo.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                          className="w-full px-2 py-1 rounded-lg bg-surface-container border border-primary-container text-xs font-semibold text-on-surface focus:outline-none"
                        />
                      ) : (
                        <span
                          className={`text-xs sm:text-sm font-semibold block truncate transition-all duration-300 ${
                            todo.completed
                              ? 'line-through text-outline'
                              : 'text-on-surface'
                          }`}
                        >
                          {todo.title}
                        </span>
                      )}

                      <div className="flex items-center gap-2.5 text-[10px] text-outline mt-1 flex-wrap">
                        {/* Friendly Date */}
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatFriendlyDate(todo.date)}</span>
                        </span>

                        {/* Priority Badge */}
                        <span className={`px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${pConfig.bg} ${pConfig.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pConfig.dot}`} />
                          <span>{pConfig.label}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(todo)}
                      className="w-8 h-8 rounded-lg text-outline hover:text-on-surface hover:bg-surface-container flex items-center justify-center cursor-pointer border-0 bg-transparent transition-colors"
                      title="Edit task title"
                      aria-label="Edit task"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTodoTask(todo.id)}
                      className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-error-container/20 flex items-center justify-center cursor-pointer border-0 bg-transparent transition-colors"
                      title="Delete task (10s undo available)"
                      aria-label="Delete task"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </motion.div>
    </PageShell>
  );
}
