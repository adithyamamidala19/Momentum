import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Settings2, Trash2, Sparkles, Utensils, Camera } from 'lucide-react';
import { useMomentum } from '../../context/MomentumContext.jsx';
import CountUp from '../architecture/CountUp.jsx';

export default function ProteinCard({ compact = false, className = '' }) {
  const { state, metrics, addProtein, deleteProteinEntry, updateProteinGoal, openMealScanner } = useMomentum();
  const [goalPopoverOpen, setGoalPopoverOpen] = useState(false);
  const [customGrams, setCustomGrams] = useState(20);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [floatLabel, setFloatLabel] = useState(null);

  const currentGrams = state.proteinGrams !== undefined ? state.proteinGrams : 45;
  const targetGrams = state.proteinTargetGrams || 90;
  const entries = state.proteinEntries || [];
  const pct = Math.min(100, Math.round((currentGrams / targetGrams) * 100));
  const isGoalReached = currentGrams >= targetGrams;

  // Quick-Add food presets
  const quickPresets = [
    { label: 'Whey shake', grams: 25 },
    { label: 'Eggs (2)', grams: 12 },
    { label: 'Greek yogurt', grams: 15 },
    { label: 'Chicken breast', grams: 30 },
    { label: 'Paneer/Tofu', grams: 18 }
  ];

  const handleQuickAdd = (preset) => {
    addProtein(preset.grams, preset.label);
    // Float-up badge
    setFloatLabel(`+${preset.grams}g`);
    setTimeout(() => setFloatLabel(null), 1200);
  };

  const handleCustomAdd = (e) => {
    e.preventDefault();
    if (customGrams > 0) {
      addProtein(customGrams, 'Custom portion');
      setFloatLabel(`+${customGrams}g`);
      setTimeout(() => setFloatLabel(null), 1200);
      setShowCustomModal(false);
    }
  };

  // Compact variant for Movement page
  if (compact) {
    return (
      <div className={`p-4 rounded-2xl bg-surface-container-lowest hairline shadow-xs flex items-center justify-between gap-4 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#F0CEB8]/30 flex items-center justify-center text-[#92400E] shrink-0">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#92400E] block">
              Nutrition Anchor
            </span>
            <span className="text-xs font-bold text-on-surface">
              {currentGrams} / {targetGrams}g Protein
            </span>
            <div className="w-28 h-1.5 rounded-full bg-surface-container mt-1.5 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#F0CEB8] to-[#D97706] rounded-full transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={openMealScanner}
            className="p-1.5 rounded-full bg-[#0F6E56]/10 hover:bg-[#0F6E56]/20 text-[#0F6E56] border border-[#0F6E56]/30 cursor-pointer transition-colors shadow-xs"
            title="Scan meal photo for grams & calories"
            aria-label="Scan meal photo for grams & calories"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleQuickAdd({ label: 'Post-workout Whey', grams: 25 })}
            className="px-3 py-1.5 rounded-full bg-[#FAF7F0] hover:bg-surface-container border border-[#E6E6E3] text-xs font-semibold text-on-surface flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#D97706]" />
            <span>+25g Shake</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between select-none relative h-full ${className}`}>
      {/* ── Header Row ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F0CEB8]/30 flex items-center justify-center text-[#92400E] shrink-0">
              <Utensils className="w-4 h-4" />
            </div>
            <h3 className="font-editorial text-lg text-on-surface">Protein</h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-sm font-bold text-on-surface whitespace-nowrap">
              <CountUp value={currentGrams} duration={1.2} /> / {targetGrams} g
            </span>
            <button
              type="button"
              onClick={() => setGoalPopoverOpen(prev => !prev)}
              className="text-outline hover:text-on-surface p-1 rounded-md transition-colors cursor-pointer border-0 bg-transparent"
              title="Set daily protein goal"
              aria-label="Adjust daily protein goal"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Goal Edit Popover */}
        <AnimatePresence>
          {goalPopoverOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="mb-2 p-3 rounded-2xl bg-surface-container-low hairline shadow-md flex items-center justify-between gap-3 text-xs"
            >
              <span className="text-on-surface font-medium">Daily Goal (g):</span>
              <div className="flex items-center gap-1.5">
                {[60, 90, 120, 150].map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => {
                      updateProteinGoal(g);
                      setGoalPopoverOpen(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-xs font-bold cursor-pointer border-0 transition-colors ${
                      targetGrams === g
                        ? 'bg-[#0F6E56] text-white'
                        : 'bg-surface-container text-outline hover:text-on-surface'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Progress Bar & Floating Label ── */}
      <div className="my-3 relative">
        <div className="h-2 w-full rounded-full bg-surface-container overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#F0CEB8] via-[#F59E0B] to-[#D97706]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-outline mt-1.5 font-medium">
          <span>{pct}% of daily goal</span>
          <span>{targetGrams - currentGrams > 0 ? `${targetGrams - currentGrams}g remaining` : 'Target reached ✨'}</span>
        </div>

        {/* Float-up "+25g" animation */}
        <AnimatePresence>
          {floatLabel && (
            <motion.span
              initial={{ opacity: 0, y: 0, scale: 0.8 }}
              animate={{ opacity: 1, y: -24, scale: 1.1 }}
              exit={{ opacity: 0, y: -36 }}
              className="absolute right-0 -top-2 font-bold text-xs text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full shadow-xs pointer-events-none"
            >
              {floatLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* ── Quick-Add Chips ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase font-bold tracking-wider text-outline block">
            Quick-Add Protein
          </span>
          <button
            type="button"
            onClick={openMealScanner}
            className="text-[11px] font-bold text-[#0F6E56] hover:underline flex items-center gap-1 cursor-pointer border-0 bg-transparent p-0"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Photo</span>
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickPresets.map(preset => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleQuickAdd(preset)}
              className="px-2.5 py-1.5 rounded-full bg-surface-container hover:bg-[#FDF5F0] hover:border-[#F0CEB8] border border-transparent text-[11px] font-medium text-on-surface flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-2xs"
            >
              <Plus className="w-3 h-3 text-[#D97706]" />
              <span>{preset.label}</span>
              <span className="font-bold text-[#92400E]">+{preset.grams}g</span>
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="px-2.5 py-1.5 rounded-full bg-surface-container hover:bg-surface-container-high text-[11px] font-medium text-outline hover:text-on-surface cursor-pointer border-0 transition-colors"
          >
            Custom...
          </button>
        </div>
      </div>

      {/* ── Recent Log Window & Undo ── */}
      {entries.length > 0 && (
        <div className="mt-3 pt-3 border-t border-surface-container space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-wider text-outline block">
            Today's Log
          </span>
          <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
            {entries.slice(0, 3).map(entry => (
              <div
                key={entry.id}
                className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-surface-container-low"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-bold text-[#92400E] shrink-0">+{entry.amount}g</span>
                  <span className="text-on-surface truncate">{entry.label}</span>
                  <span className="text-outline text-[10px] font-mono whitespace-nowrap shrink-0">{entry.time}</span>
                </div>
                <button
                  type="button"
                  onClick={() => deleteProteinEntry(entry.id)}
                  className="text-outline hover:text-error p-0.5 rounded cursor-pointer border-0 bg-transparent shrink-0"
                  title="Remove entry (10s undo available)"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom Grams Modal ── */}
      <AnimatePresence>
        {showCustomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 rounded-3xl bg-surface-container-lowest hairline shadow-2xl max-w-xs w-full text-center"
            >
              <h4 className="font-editorial text-xl text-on-surface">Log Custom Protein</h4>
              <p className="text-xs text-outline mt-1">Enter amount in grams:</p>

              <form onSubmit={handleCustomAdd} className="mt-4 space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setCustomGrams(prev => Math.max(5, prev - 5))}
                    className="w-10 h-10 rounded-full bg-surface-container font-bold text-base cursor-pointer border-0"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="150"
                    value={customGrams}
                    onChange={e => setCustomGrams(parseInt(e.target.value, 10) || 0)}
                    className="w-20 text-center py-2 rounded-xl bg-surface-container-low font-bold text-lg text-on-surface border border-surface-container"
                  />
                  <button
                    type="button"
                    onClick={() => setCustomGrams(prev => prev + 5)}
                    className="w-10 h-10 rounded-full bg-surface-container font-bold text-base cursor-pointer border-0"
                  >
                    +
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="flex-1 py-2.5 rounded-full bg-surface-container text-xs font-semibold text-outline cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-[#0F6E56] text-white text-xs font-bold cursor-pointer border-0 shadow-xs"
                  >
                    Log {customGrams}g
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
