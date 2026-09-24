import React, { useState } from 'react';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import HabitCard from '../components/cards/HabitCard.jsx';
import {
  Plus,
  X,
  Sparkles,
  Filter,
  Brain,
  Heart,
  Activity,
  Flame,
  BedDouble,
  Feather
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RitualsPage() {
  const { state, addCustomHabit } = useMomentum();
  const [activeCategory, setActiveCategory] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Mind');
  const [anchor, setAnchor] = useState('');
  const [scheduledTime, setScheduledTime] = useState('08:00');
  const [priority, setPriority] = useState('normal');

  const habits = state.customHabits || [];

  const handleCreate = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    addCustomHabit({
      title: title.trim(),
      category,
      anchor: anchor.trim() || 'Daily ritual cue',
      scheduledTime,
      priority
    });
    setTitle('');
    setAnchor('');
    setIsDrawerOpen(false);
  };

  const filteredHabits = habits.filter(h => {
    if (activeCategory === 'all') return true;
    return (h.category || '').toLowerCase() === activeCategory.toLowerCase();
  });

  const categories = [
    { id: 'all', label: 'All Rituals', icon: Sparkles },
    { id: 'Mind', label: 'Mind', icon: Brain },
    { id: 'Health', label: 'Health', icon: Heart },
    { id: 'Focus', label: 'Focus', icon: Activity },
    { id: 'Body', label: 'Body', icon: Flame },
    { id: 'Rest', label: 'Rest', icon: BedDouble }
  ];

  return (
    <PageShell>
      {/* ── Page Header ── */}
      <PageHeader
        eyebrow="RHYTHM ARCHITECTURE"
        title="Rituals & Daily Cues"
        subtitle="Habit loops anchored to natural circadian transitions rather than rigid willpower or guilt."
        action={
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="px-5 py-2.5 rounded-full bg-primary-container hover:bg-primary-container-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer border-0 shadow-xs transition-colors active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>New Ritual</span>
          </button>
        }
      />

      {/* ── Filter Chips with Shared Animated Pill Indicator ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 select-none">
        {categories.map(cat => {
          const isSelected = activeCategory.toLowerCase() === cat.id.toLowerCase();
          const Icon = cat.icon;
          const count = habits.filter(h => cat.id === 'all' ? true : (h.category || '').toLowerCase() === cat.id.toLowerCase()).length;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`relative px-4 py-2 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors shrink-0 flex items-center gap-1.5 ${
                isSelected
                  ? 'text-white'
                  : 'bg-surface-container text-outline hover:text-on-surface'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="activeRitualFilter"
                  className="absolute inset-0 rounded-full bg-primary-container shadow-xs"
                  transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label} ({count})</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Ritual Cards Grid: 1-col on mobile, 2-col on desktop with odd card spanning full width ── */}
      <motion.div
        layout
        className="grid grid-cols-1 md:grid-cols-2 gap-3.5 [&>*:last-child:nth-child(odd)]:md:col-span-2 mb-12"
      >
        <AnimatePresence mode="popLayout">
          {filteredHabits.length === 0 ? (
            <motion.div
              key="empty-category"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="col-span-full p-12 text-center rounded-3xl bg-surface-container-low/70 hairline flex flex-col items-center justify-center select-none"
            >
              <div className="w-12 h-12 rounded-full bg-[#0F6E56]/10 text-[#0F6E56] flex items-center justify-center mb-3">
                <Feather className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl font-normal text-on-surface">
                No {activeCategory === 'all' ? '' : activeCategory} rituals currently anchored.
              </h3>
              <p className="text-xs text-outline mt-1 max-w-sm">
                Add an unhurried daily cue to gently integrate this focus into your morning or evening cadence.
              </p>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="mt-4 px-4 py-2 rounded-full bg-primary-container text-white text-xs font-semibold cursor-pointer border-0 shadow-xs"
              >
                Create {activeCategory === 'all' ? 'Ritual' : activeCategory + ' Ritual'}
              </button>
            </motion.div>
          ) : (
            filteredHabits.map(habit => (
              <motion.div
                key={habit.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <HabitCard habit={habit} />
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── CREATE RITUAL MODAL / SHEET ── */}
      <AnimatePresence>
        {isDrawerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest hairline shadow-2xl max-w-md w-full select-none"
            >
              <div className="flex items-center justify-between pb-3 border-b border-surface-container mb-4">
                <div>
                  <h3 className="font-editorial text-2xl text-on-surface font-normal">Build a Ritual</h3>
                  <p className="text-xs text-outline">Anchor your new practice to an existing daily cue.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">Ritual Name</label>
                  <input
                    type="text"
                    placeholder="e.g., 10-Minute Daylight Walk"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-on-surface block mb-1">Category</label>
                    <select
                      value={category}
                      onChange={e => setCategory(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none"
                    >
                      <option value="Mind">Mind</option>
                      <option value="Health">Health</option>
                      <option value="Focus">Focus</option>
                      <option value="Body">Body</option>
                      <option value="Rest">Rest</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-on-surface block mb-1">Target Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={e => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">Anchor Cue</label>
                  <input
                    type="text"
                    placeholder="e.g., Right after morning coffee, before checking email"
                    value={anchor}
                    onChange={e => setAnchor(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-full bg-primary-container text-white text-xs font-bold hover:bg-primary-container-hover transition-all cursor-pointer border-0 shadow-xs mt-2"
                >
                  Adopt Ritual
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
