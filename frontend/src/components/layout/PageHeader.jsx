import React from 'react';

/**
 * PageHeader
 * ─────────────────────────────────────────────────────────────────────────────
 * Consistent editorial header pattern across all 8 sanctuary pages:
 * - Small uppercase brand-green eyebrow
 * - Serif display title
 * - Grey subtitle
 * - Optional right-aligned (or centered) action button
 * ─────────────────────────────────────────────────────────────────────────────
 */
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  centered = false,
  className = ''
}) {
  return (
    <header
      className={`w-full mb-6 sm:mb-8 ${
        centered
          ? 'flex flex-col items-center text-center'
          : 'flex flex-col sm:flex-row sm:items-end justify-between gap-4'
      } ${className}`}
    >
      <div className={`space-y-1.5 ${centered ? 'max-w-xl mx-auto' : 'max-w-2xl'}`}>
        {eyebrow && (
          <span className="text-[11px] uppercase font-bold tracking-widest text-[#0F6E56] block">
            {eyebrow}
          </span>
        )}
        {title && (
          <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl font-normal text-on-surface tracking-tight leading-tight">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm text-outline leading-relaxed pt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {action && (
        <div className={`shrink-0 ${centered ? 'mt-4' : 'self-start sm:self-auto'}`}>
          {action}
        </div>
      )}
    </header>
  );
}
