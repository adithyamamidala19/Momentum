import React from 'react';
import { motion } from 'framer-motion';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import MedalCard from '../components/medals/MedalCard.jsx';
import CountUp from '../components/architecture/CountUp.jsx';
import { pluralize } from '../utils/formatters.js';
import { Sparkles, Trophy, Award, ArrowRight, ShieldCheck, Flame, Compass } from 'lucide-react';

export default function MilestonesPage() {
  const { state, metrics } = useMomentum();
  const milestones = metrics.milestones || [];
  const nextMilestone = metrics.nextMilestone || milestones[0];
  const currentStreak = metrics.streak || 1;

  // Calculate overall milestone progress percentage towards 365 days
  const maxDays = 365;
  const overallPct = Math.min(100, Math.round((currentStreak / maxDays) * 100));

  return (
    <PageShell>
      <PageHeader
        eyebrow="Physical Craftsmanship"
        title="Milestone Medals"
        subtitle="Realistic 3D specular material collectibles honoring your daily rhythm. Hover to track light reflections; tap to flip and inspect verified certificates."
      />

      {/* ── 4 Medals Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-12">
        {milestones.map(medal => (
          <MedalCard
            key={medal.id}
            medal={medal}
            isNext={nextMilestone && medal.id === nextMilestone.id && !medal.achieved}
          />
        ))}
      </div>

      {/* ── Bottom Section: Your Rhythm Journey ── */}
      <div className="space-y-6">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#0F6E56]">
            Continuous Trajectory
          </span>
          <h2 className="font-editorial text-2xl font-normal text-on-surface mt-0.5">
            Your Rhythm Journey
          </h2>
          <p className="text-xs text-outline">
            An unbroken continuum of self-trust, moving from single days to lifelong presence.
          </p>
        </div>

        {/* Milestone Pathway Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-6">
          {/* Pathway Progress Line */}
          <div className="relative pt-6 pb-2">
            <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(4, overallPct)}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="h-full bg-gradient-to-r from-amber-500 via-[#0F6E56] to-teal-400 rounded-full"
              />
            </div>

            {/* Tier checkpoints */}
            <div className="grid grid-cols-4 mt-4 text-center">
              {milestones.map((m, idx) => {
                const isPassed = currentStreak >= m.targetDays;
                const isCurrentNext = nextMilestone && m.id === nextMilestone.id;

                return (
                  <div key={m.id} className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPassed
                          ? 'bg-[#0F6E56] text-white shadow-sm'
                          : isCurrentNext
                          ? 'bg-amber-500 text-white ring-4 ring-amber-500/20'
                          : 'bg-surface-container text-outline'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-xs font-bold text-on-surface mt-2">
                      {m.tier}
                    </span>
                    <span className="text-[10px] text-outline font-mono">
                      {m.targetDays}d
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Next Milestone Spotlight Card */}
          <div className="p-5 rounded-2xl bg-surface-container-low hairline flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-700 shrink-0">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800">
                    Next Destination
                  </span>
                  <h3 className="text-sm font-bold text-on-surface">
                    {nextMilestone?.name || 'Foundation'} ({nextMilestone?.tier} Tier)
                  </h3>
                </div>
                <p className="text-xs text-outline mt-1 max-w-lg">
                  {nextMilestone?.description || 'Build steady, quiet presence one day at a time.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0 border-t sm:border-0 pt-3 sm:pt-0 border-outline/10 justify-between sm:justify-end">
              <div className="text-left sm:text-right">
                <span className="text-xs font-bold text-on-surface block font-mono">
                  {currentStreak} / {nextMilestone?.targetDays} Days
                </span>
                <span className="text-[11px] text-amber-700 font-semibold">
                  {nextMilestone?.remainingDays || 0} days remaining
                </span>
              </div>

              <div className="w-10 h-10 rounded-full bg-surface-container-lowest hairline flex items-center justify-center text-[#0F6E56] shadow-xs">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
