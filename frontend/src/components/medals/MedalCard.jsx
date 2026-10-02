import React from 'react';
import { motion } from 'framer-motion';
import { Award, Lock, Sparkles, ArrowRight, Eye } from 'lucide-react';

const TIER_THEMES = {
  bronze: {
    bg: 'bg-[#FAF5F0]',
    border: 'border-[#E2C7B3]',
    badgeBg: 'bg-[#B87333]/15',
    badgeText: 'text-[#8C4B18]',
    iconRing: 'from-[#F6A868] via-[#C67A3C] to-[#5C2D13]',
    innerRing: 'from-[#783A16] to-[#2E1508]',
    borderGleam: 'border-[#FEDBB4]/50',
    glow: 'rgba(198, 122, 60, 0.45)',
    progressGrad: 'from-[#C67A3C] to-[#783A16]',
    lockedDiscBg: 'bg-gradient-to-br from-[#3D2010]/50 to-[#1C0D05]/60',
    lockedDiscBorder: 'border-[#B8652A]/40',
    lockedGlow: 'rgba(184, 101, 42, 0.25)',
    lockedText: 'text-[#F6A868]',
    romanNumeral: 'VII',
    tierSymbol: '🌱'
  },
  silver: {
    bg: 'bg-[#F8FAFC]',
    border: 'border-[#CBD5E1]',
    badgeBg: 'bg-[#64748B]/15',
    badgeText: 'text-[#334155]',
    iconRing: 'from-[#FFFFFF] via-[#CBD5E1] to-[#475569]',
    innerRing: 'from-[#5A6F8C] to-[#1E293B]',
    borderGleam: 'border-white/70',
    glow: 'rgba(203, 213, 225, 0.55)',
    progressGrad: 'from-[#94A3B8] to-[#475569]',
    lockedDiscBg: 'bg-gradient-to-br from-[#24303F]/50 to-[#141A22]/60',
    lockedDiscBorder: 'border-[#94A3B8]/40',
    lockedGlow: 'rgba(148, 163, 184, 0.25)',
    lockedText: 'text-[#E2E8F0]',
    romanNumeral: 'XXX',
    tierSymbol: '🌊'
  },
  gold: {
    bg: 'bg-[#FFFBEB]',
    border: 'border-[#FDE68A]',
    badgeBg: 'bg-[#F59E0B]/15',
    badgeText: 'text-[#B45309]',
    iconRing: 'from-[#FFF9C4] via-[#F59E0B] to-[#78350F]',
    innerRing: 'from-[#A87400] to-[#3D2400]',
    borderGleam: 'border-[#FFFDE7]/80',
    glow: 'rgba(245, 158, 11, 0.60)',
    progressGrad: 'from-[#FBBF24] to-[#B45309]',
    lockedDiscBg: 'bg-gradient-to-br from-[#3D2400]/50 to-[#261700]/60',
    lockedDiscBorder: 'border-[#F59E0B]/50',
    lockedGlow: 'rgba(245, 158, 11, 0.30)',
    lockedText: 'text-[#FFF275]',
    romanNumeral: 'C',
    tierSymbol: '☀️'
  },
  platinum: {
    bg: 'bg-[#F0F9FF]',
    border: 'border-[#BAE6FD]',
    badgeBg: 'bg-[#0284C7]/15',
    badgeText: 'text-[#0369A1]',
    iconRing: 'from-[#FFFFFF] via-[#38BDF8] to-[#03406E]',
    innerRing: 'from-[#246B9C] to-[#0B1E33]',
    borderGleam: 'border-white/90',
    glow: 'rgba(56, 189, 248, 0.65)',
    progressGrad: 'from-[#38BDF8] to-[#0284C7]',
    lockedDiscBg: 'bg-gradient-to-br from-[#0B1E33]/50 to-[#081422]/60',
    lockedDiscBorder: 'border-[#38BDF8]/50',
    lockedGlow: 'rgba(56, 189, 248, 0.35)',
    lockedText: 'text-[#BAE6FD]',
    romanNumeral: 'CCCLXV',
    tierSymbol: '💎'
  }
};


export default function MedalCard({ medal, isNext = false, onSelect }) {
  const tierKey = (medal.tier || 'bronze').toLowerCase();
  const theme = TIER_THEMES[tierKey] || TIER_THEMES.bronze;
  const isAchieved = Boolean(medal.achieved);

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.025 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      onClick={() => onSelect && onSelect(medal)}
      className={`group relative rounded-3xl p-6 text-center select-none cursor-pointer transition-shadow duration-300 border ${
        isAchieved
          ? `${theme.bg} ${theme.border} shadow-sm hover:shadow-xl`
          : isNext
          ? 'bg-surface-container-lowest border-primary/40 ring-2 ring-primary/10 shadow-xs hover:shadow-md'
          : 'bg-surface-container-low/60 border-outline/10 opacity-90 hover:opacity-100 hover:shadow-md'
      }`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect && onSelect(medal);
        }
      }}
      aria-label={`${medal.name}, ${medal.tier} Tier Medal, ${isAchieved ? 'Earned' : 'Locked'}. Tap to view in 3D`}
    >
      {/* Top Header Badge */}
      <div className="flex items-center justify-between w-full mb-4">
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full transition-transform group-hover:scale-105 ${
            isAchieved
              ? `${theme.badgeBg} ${theme.badgeText}`
              : isNext
              ? 'bg-primary/10 text-primary font-semibold'
              : 'bg-surface-container text-outline'
          }`}
        >
          {medal.threshold || `${medal.targetDays} Days`}
        </span>

        {isAchieved ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
            <Sparkles className="w-3.5 h-3.5 fill-amber-500 animate-spin" style={{ animationDuration: '8s' }} />
            <span>Earned</span>
          </span>
        ) : isNext ? (
          <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
            Next <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </span>
        ) : (
          <Lock className="w-3.5 h-3.5 text-outline/60" />
        )}
      </div>

      {/* Flat 2D Award Icon Disc (Tier Colored Undertone + Directional Lighting + Specular Sweep) */}
      <div className="relative my-4 flex items-center justify-center">
        {/* Soft Ambient Halo behind medal (colored matching metal tier even while locked) */}
        <div
          className="absolute w-24 h-24 rounded-full blur-md opacity-35 pointer-events-none"
          style={{ backgroundColor: isAchieved ? theme.glow : theme.lockedGlow }}
        />

        <div
          className={`relative w-24 h-24 sm:w-26 sm:h-26 rounded-full p-1.5 flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
            isAchieved
              ? `bg-gradient-to-br ${theme.iconRing} border-2 ${theme.borderGleam} shadow-xl`
              : `${theme.lockedDiscBg} border-2 ${theme.lockedDiscBorder}`
          }`}
        >
          {/* Inner proof coin cavity and embossed relief */}
          <div
            className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden ${
              isAchieved
                ? `bg-gradient-to-br ${theme.innerRing} border border-white/30 shadow-inner`
                : 'bg-black/30 border border-white/10'
            }`}
          >
            {/* Specular Hologram Shimmer Sweep */}
            {isAchieved && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-full">
                <div
                  className="absolute inset-0 w-2/3 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 animate-medal-shimmer"
                />
              </div>
            )}

            {/* Soft directional highlight on upper-left to hint at metal curvature */}
            <div className="absolute top-1 left-2 w-10 h-5 bg-white/25 rounded-full blur-xs pointer-events-none -rotate-45" />

            {isAchieved ? (
              <div className="flex flex-col items-center justify-center z-10 drop-shadow-md">
                <span className="text-2xl sm:text-3xl filter drop-shadow">{theme.tierSymbol}</span>
                <span className="text-[10px] font-mono font-bold tracking-widest text-white/95 mt-0.5">
                  {theme.romanNumeral}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center z-10 text-white/60">
                <Lock className="w-5 h-5 sm:w-6 sm:h-6 mb-0.5" />
                <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">
                  {medal.targetDays}d
                </span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Medal Title & Description */}
      <div className="mt-3 space-y-1">
        <h3 className="font-editorial text-lg text-on-surface font-normal group-hover:text-primary transition-colors">
          {medal.name}
        </h3>
        <p className="text-xs text-outline capitalize">
          {medal.tier} Tier {medal.date ? `· ${medal.date}` : ''}
        </p>
      </div>

      {/* Progress Bar for Locked Medals */}
      {!isAchieved && (
        <div className="mt-4 pt-3 border-t border-outline/10 text-left">
          <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className={`h-full bg-gradient-to-r ${theme.progressGrad} rounded-full transition-all duration-500`}
              style={{ width: `${medal.progressPct || 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-outline mt-1.5 font-mono">
            <span>
              {medal.progress || 0} / {medal.targetDays}d
            </span>
            <span className="font-sans font-medium text-amber-700">
              {medal.remainingDays || 0}d left
            </span>
          </div>
        </div>
      )}

      {/* Apple Fitness+ style 3D hint badge */}
      <div className="mt-4 pt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-primary group-hover:underline">
        <Eye className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        <span>Inspect in 3D</span>
      </div>
    </motion.div>
  );
}
