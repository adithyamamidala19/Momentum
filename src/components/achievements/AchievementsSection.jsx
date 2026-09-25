import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Calendar,
  Sparkles,
  Clock,
  Droplet,
  Flame,
  CheckCircle2,
  ChevronRight,
  Award,
  History,
  Info
} from 'lucide-react';
import CountUp from '../architecture/CountUp.jsx';

const TIER_STYLES = {
  Bronze: {
    badge: 'bg-[#B87333]/15 text-[#8C4B18] border-[#E2C7B3]',
    bar: 'from-[#C68642] to-[#8C4B18]',
    border: 'border-[#E2C7B3]',
    bg: 'bg-[#FAF5F0]',
    glow: 'rgba(198, 134, 66, 0.2)'
  },
  Silver: {
    badge: 'bg-[#64748B]/15 text-[#334155] border-[#CBD5E1]',
    bar: 'from-[#94A3B8] to-[#475569]',
    border: 'border-[#CBD5E1]',
    bg: 'bg-[#F8FAFC]',
    glow: 'rgba(148, 163, 184, 0.2)'
  },
  Gold: {
    badge: 'bg-[#F59E0B]/15 text-[#B45309] border-[#FDE68A]',
    bar: 'from-[#FBBF24] to-[#D97706]',
    border: 'border-[#FDE68A]',
    bg: 'bg-[#FFFBEB]',
    glow: 'rgba(251, 191, 36, 0.25)'
  },
  Platinum: {
    badge: 'bg-[#0284C7]/15 text-[#0369A1] border-[#BAE6FD]',
    bar: 'from-[#38BDF8] to-[#0284C7]',
    border: 'border-[#BAE6FD]',
    bg: 'bg-[#F0F9FF]',
    glow: 'rgba(56, 189, 248, 0.25)'
  }
};

export default function AchievementsSection({
  achievementsData,
  isLoading = false,
  onRefresh
}) {
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'history'

  const activeWeekly = achievementsData?.activeWeekly || [];
  const activeMonthly = achievementsData?.activeMonthly || [];
  const pastCompleted = achievementsData?.pastCompleted || [];

  const formatProgress = (item) => {
    if (item.metric === 'water_ml') {
      const currL = (item.currentProgress / 1000).toFixed(1);
      const targetL = (item.targetValue / 1000).toFixed(0);
      return `${currL} / ${targetL}L`;
    }
    if (item.metric === 'focus_min') {
      const currH = (item.currentProgress / 60).toFixed(1);
      const targetH = (item.targetValue / 60).toFixed(0);
      return `${currH} / ${targetH} hrs`;
    }
    if (item.metric === 'adherence_pct') {
      return `${item.currentProgress}% / ${item.targetValue}%`;
    }
    return `${item.currentProgress} / ${item.targetValue} ${item.unit}`;
  };

  const formatCountdown = (item) => {
    if (item.completed) return 'Completed ✨';
    if (item.daysRemaining === 0) return 'Ends today';
    if (item.daysRemaining === 1) return '1 day left';
    return `${item.daysRemaining} days left`;
  };

  return (
    <div className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-6 mb-8">
      {/* ── Section Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F6E56] bg-[#0F6E56]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Trophy className="w-3 h-3" /> Time-Boxed Goals
            </span>
            <h2 className="text-sm font-bold text-on-surface">Weekly & Monthly Achievements</h2>
          </div>
          <p className="text-xs text-outline mt-1 italic">
            “Milestones celebrate your streak. Achievements celebrate specific goals each week and month.”
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-surface-container-low rounded-2xl hairline self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 ${
              activeTab === 'active'
                ? 'bg-[#0F6E56] text-white shadow-xs'
                : 'bg-transparent text-outline hover:text-on-surface'
            }`}
          >
            Active Goals ({activeWeekly.length + activeMonthly.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border-0 flex items-center gap-1 ${
              activeTab === 'history'
                ? 'bg-[#0F6E56] text-white shadow-xs'
                : 'bg-transparent text-outline hover:text-on-surface'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Trophy Case ({pastCompleted.length})</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-2xl bg-surface-container-low animate-pulse h-28" />
          ))}
        </div>
      ) : activeTab === 'active' ? (
        <div className="space-y-6">
          {/* Weekly Goals Subsection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#0F6E56]" />
                <span>Weekly Achievements (Resets Monday)</span>
              </span>
              <span className="text-[11px] text-outline font-mono">
                {activeWeekly.length > 0 && formatCountdown(activeWeekly[0])}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeWeekly.map((item) => {
                const tierTheme = TIER_STYLES[item.tier] || TIER_STYLES.Bronze;
                return (
                  <motion.div
                    key={item.key}
                    whileHover={{ y: -2 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.completed
                        ? `${tierTheme.bg} ${tierTheme.border} shadow-xs`
                        : 'bg-surface-container-low hairline hover:border-[#0F6E56]/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-surface-container-lowest hairline flex items-center justify-center text-xl shadow-xs shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-on-surface">{item.title}</h3>
                            {item.completed && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#0F6E56] fill-[#0F6E56]/20" />
                            )}
                          </div>
                          <p className="text-[11px] text-outline line-clamp-1">{item.description}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierTheme.badge}`}
                      >
                        +{item.pointsAwarded} pts
                      </span>
                    </div>

                    {/* Progress Bar & Numeric Ratio */}
                    <div className="mt-3">
                      <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${tierTheme.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${item.progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1.5">
                        <span className="font-mono font-bold text-on-surface">
                          {formatProgress(item)}
                        </span>
                        <span className="text-outline text-[10px]">
                          {item.completed ? 'Goal reached' : `${item.progressPct}% complete`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Monthly Goals Subsection */}
          <div className="pt-2 border-t hairline">
            <div className="flex items-center justify-between mb-3 mt-4">
              <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Monthly Horizons</span>
              </span>
              <span className="text-[11px] text-outline font-mono">
                {activeMonthly.length > 0 && formatCountdown(activeMonthly[0])}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {activeMonthly.map((item) => {
                const tierTheme = TIER_STYLES[item.tier] || TIER_STYLES.Gold;
                return (
                  <motion.div
                    key={item.key}
                    whileHover={{ y: -2 }}
                    className={`p-4 rounded-2xl border transition-all ${
                      item.completed
                        ? `${tierTheme.bg} ${tierTheme.border} shadow-xs`
                        : 'bg-surface-container-low hairline hover:border-amber-600/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-surface-container-lowest hairline flex items-center justify-center text-xl shadow-xs shrink-0">
                          {item.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-xs font-bold text-on-surface">{item.title}</h3>
                            {item.completed && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-amber-600 fill-amber-600/20" />
                            )}
                          </div>
                          <p className="text-[11px] text-outline line-clamp-1">{item.description}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${tierTheme.badge}`}
                      >
                        +{item.pointsAwarded} pts
                      </span>
                    </div>

                    {/* Progress Bar & Numeric Ratio */}
                    <div className="mt-3">
                      <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${tierTheme.bar} rounded-full transition-all duration-500`}
                          style={{ width: `${item.progressPct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1.5">
                        <span className="font-mono font-bold text-on-surface">
                          {formatProgress(item)}
                        </span>
                        <span className="text-outline text-[10px]">
                          {item.completed ? 'Horizons fulfilled' : `${item.progressPct}% complete`}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Trophy Case / Past History Tab */
        <div>
          {pastCompleted.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-surface-container-low hairline text-xs text-outline space-y-2">
              <Trophy className="w-8 h-8 text-outline/40 mx-auto" />
              <p className="font-medium text-on-surface">No completed achievements archived yet.</p>
              <p>Complete weekly or monthly goals to fill your sanctuary trophy case.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {pastCompleted.map((item) => {
                const tierTheme = TIER_STYLES[item.tier] || TIER_STYLES.Bronze;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-2xl border ${tierTheme.bg} ${tierTheme.border} flex flex-col justify-between`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{item.icon}</span>
                      <span className="text-[10px] font-mono font-bold text-outline">
                        {item.periodKey}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-on-surface">{item.title}</h4>
                      <p className="text-[10px] text-outline mt-0.5">{item.description}</p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-outline/15 flex items-center justify-between text-[10px]">
                      <span className="text-[#0F6E56] font-bold">Earned</span>
                      <span className="font-mono font-bold text-amber-700">
                        +{item.pointsAwarded} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
