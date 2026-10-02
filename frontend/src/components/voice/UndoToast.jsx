import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { RotateCcw, X } from 'lucide-react';

export default function UndoToast() {
  const { undoState, performUndo, dismissUndo } = useMomentum();
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!undoState.visible) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const durationMs = (undoState.duration || 10) * 1000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remainingPct);

      if (elapsed >= durationMs) {
        clearInterval(interval);
        dismissUndo();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [undoState.visible, undoState.duration, dismissUndo]);

  if (!undoState.visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md rounded-2xl bg-[#1a1c1c] text-white shadow-2xl overflow-hidden border border-white/10"
        role="alert"
        aria-live="assertive"
      >
        <div className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <RotateCcw className="w-4 h-4 text-[#00d4ff] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-medium truncate text-white">
                {undoState.message || 'Action completed'}
              </p>
              <p className="text-[10px] text-gray-400">Changed your mind?</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={performUndo}
              className="px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer border-0 transition-all bg-[#00d4ff] text-black hover:bg-[#33ddff]"
            >
              Undo ({Math.ceil((progress / 100) * 10)}s)
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

        {/* 10-Second Countdown Progress Bar */}
        <div className="w-full h-1 bg-white/10">
          <div
            className="h-full bg-[#00d4ff] transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
