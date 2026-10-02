import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { RotateCcw, X, CheckCircle, Info } from 'lucide-react';

/**
 * GlobalToast
 * ─────────────────────────────────────────────────────────────────────────────
 * Unified global toast system:
 * - Bottom center on desktop (bottom-6)
 * - Above the bottom tab bar on mobile (bottom-20)
 * - Displays both standard alerts AND the 10-second undo countdown
 * - Completely removes off-palette cyan; uses brand forest green & sage
 * - Accessible with aria-live="polite" / role="status"
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function GlobalToast() {
  const { undoState, performUndo, dismissUndo, toast } = useMomentum();
  const [undoProgress, setUndoProgress] = useState(100);

  // 10-Second Countdown Engine
  useEffect(() => {
    if (!undoState.visible) {
      setUndoProgress(100);
      return;
    }

    const startTime = Date.now();
    const durationMs = (undoState.duration || 10) * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setUndoProgress(remainingPct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        dismissUndo();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [undoState.visible, undoState.duration, dismissUndo]);

  return (
    <aside aria-label="Notifications" className="fixed bottom-20 md:bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-[90%] max-w-md">
      {/* 1. 10-Second Undo Toast */}
      <AnimatePresence>
        {undoState.visible && (
          <motion.div
            initial={{ y: 24, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="w-full rounded-2xl bg-[#1C1C1A] text-white shadow-2xl overflow-hidden border border-white/10 pointer-events-auto select-none"
            role="alert"
            aria-live="assertive"
          >
            <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#0F6E56]/40 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-3.5 h-3.5 text-[#A0F3D4]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold truncate text-white">
                    {undoState.message || 'Action completed'}
                  </p>
                  <p className="text-[10px] text-gray-300">
                    10-second safety net active
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={performUndo}
                  className="px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer border-0 transition-all bg-[#0F6E56] hover:bg-[#168A6D] text-white shadow-sm flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Undo ({Math.ceil((undoProgress / 100) * 10)}s)</span>
                </button>
                <button
                  type="button"
                  onClick={dismissUndo}
                  className="border-0 bg-transparent cursor-pointer p-1 text-gray-400 hover:text-white transition-colors"
                  aria-label="Dismiss undo notification"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Countdown progress bar in brand emerald */}
            <div className="w-full h-1 bg-white/10">
              <div
                className="h-full bg-gradient-to-r from-[#0F6E56] to-[#A0F3D4] transition-all duration-75 ease-linear"
                style={{ width: `${undoProgress}%` }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Standard Informational / Success Toast */}
      <AnimatePresence>
        {toast.visible && !undoState.visible && (
          <motion.div
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 450, damping: 30 }}
            className="px-4 py-2.5 rounded-full bg-[#1C1C1A]/95 text-white backdrop-blur-md shadow-lg border border-white/10 text-xs font-medium flex items-center gap-2.5 pointer-events-auto select-none"
            role="status"
            aria-live="polite"
          >
            <span className="w-2 h-2 rounded-full bg-[#A0F3D4] shrink-0 animate-pulse" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
}
