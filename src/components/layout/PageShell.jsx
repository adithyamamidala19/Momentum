import React from 'react';

/**
 * PageShell
 * ─────────────────────────────────────────────────────────────────────────────
 * Single unified layout container for all Momentum pages.
 * Enforces:
 * - Max width 1200px
 * - Consistent side padding (24px desktop, 16px mobile)
 * - Safe area handling
 * - Zero horizontal overflow at 320px–1920px
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function PageShell({ children, className = '', centered = false }) {
  return (
    <div
      className={`w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-10 ${
        centered ? 'flex flex-col items-center text-center' : ''
      } ${className}`}
      style={{ overflowX: 'hidden' }}
    >
      {children}
    </div>
  );
}
