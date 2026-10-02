import React from 'react';

/**
 * Skeleton Loader
 * ─────────────────────────────────────────────────────────────────────────────
 * Soft shimmer in sage/cream for data that takes time to load.
 * Respects prefers-reduced-motion.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function Skeleton({ className = '', variant = 'rect' }) {
  const roundedClass =
    variant === 'circle'
      ? 'rounded-full'
      : variant === 'pill'
      ? 'rounded-full'
      : 'rounded-2xl';

  return (
    <div
      className={`relative overflow-hidden bg-[#FAF7F0] border border-[#E6E6E3] ${roundedClass} ${className}`}
      aria-hidden="true"
    >
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#C8DFCF]/30 to-transparent animate-shimmer"
        style={{
          backgroundSize: '200% 100%',
          animation: 'shimmerSweep 2s infinite ease-in-out'
        }}
      />
      <style>{`
        @keyframes shimmerSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-shimmer { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
