import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import MedalCard from '../components/medals/MedalCard.jsx';
import MedalDetailModal from '../components/medals/MedalDetailModal.jsx';
import { Award, Compass, Sparkles, Trophy } from 'lucide-react';

const DEFAULT_TIERS = [
  { id: 'ms-bronze', medalId: 'streak-7', name: '7-Day Genesis', tier: 'Bronze', threshold: '7-Day Rhythm', targetDays: 7, description: 'Establish an unbroken 7-day rhythm of grounded habits.', achieved: false, progress: 0, remainingDays: 7, progressPct: 0, date: null, verificationCode: null },
  { id: 'ms-silver', medalId: 'streak-30', name: '30-Day Flow', tier: 'Silver', threshold: '30-Day Rhythm', targetDays: 30, description: 'Maintain mindful daily presence across a full month of practice.', achieved: false, progress: 0, remainingDays: 30, progressPct: 0, date: null, verificationCode: null },
  { id: 'ms-gold', medalId: 'streak-100', name: '100-Day Centurion', tier: 'Gold', threshold: '100-Day Rhythm', targetDays: 100, description: 'A monumental milestone of 100 continuous days of presence.', achieved: false, progress: 0, remainingDays: 100, progressPct: 0, date: null, verificationCode: null },
  { id: 'ms-plat', medalId: 'streak-365', name: '365-Day Master', tier: 'Platinum', threshold: '365-Day Rhythm', targetDays: 365, description: 'An entire year devoted to unhurried, intentional living.', achieved: false, progress: 0, remainingDays: 365, progressPct: 0, date: null, verificationCode: null }
];

export default function MilestonesPage() {
  const { metrics } = useMomentum();
  const [selectedMedal, setSelectedMedal] = useState(null);

  const rawMilestones = metrics?.milestones && metrics.milestones.length > 0
    ? metrics.milestones
    : DEFAULT_TIERS;

  const currentStreak = metrics?.streak || 0;

  // Enrich with current streak if not already calculated
  const milestones = rawMilestones.map((m) => {
    const achieved = m.achieved !== undefined ? m.achieved : currentStreak >= m.targetDays;
    const progress = Math.min(currentStreak, m.targetDays);
    const remainingDays = Math.max(0, m.targetDays - currentStreak);
    const progressPct = Math.round((progress / m.targetDays) * 100);
    return {
      ...m,
      achieved,
      progress,
      remainingDays,
      progressPct
    };
  });

  const nextMilestone = milestones.find((m) => !m.achieved) || milestones[milestones.length - 1];

  // Calculate overall milestone progress percentage towards 365 days
  const maxDays = 365;
  const overallPct = Math.min(100, Math.round((currentStreak / maxDays) * 100));

  return (
    <PageShell>
      <PageHeader
        eyebrow="PHYSICAL CRAFTSMANSHIP"
        title="Milestone Medals"
        subtitle="Collectibles honoring your daily rhythm. Flat in the sanctuary grid; tap any medal to inspect in authentic 3D and share your trajectory."
      />

      {/* ── 4 Medals Flat 2D Grid (Apple Fitness+ style) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 mb-12">
        {milestones.map((medal) => (
          <MedalCard
            key={medal.id || medal.medalId}
            medal={medal}
            isNext={nextMilestone && medal.id === nextMilestone.id && !medal.achieved}
            onSelect={(m) => setSelectedMedal(m)}
          />
        ))}
      </div>

      {/* ── Bottom Section: Your Rhythm Journey ── */}
      <div className="space-y-6">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-primary">
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
                className="h-full bg-gradient-to-r from-amber-500 via-primary to-teal-400 rounded-full"
              />
            </div>

            {/* Tier checkpoints */}
            <div className="grid grid-cols-4 mt-4 text-center">
              {milestones.map((m, idx) => {
                const isPassed = currentStreak >= m.targetDays;
                const isCurrentNext = nextMilestone && m.id === nextMilestone.id;

                return (
                  <div key={m.id || m.medalId} className="flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedMedal(m)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all cursor-pointer border-0 ${
                        isPassed
                          ? 'bg-primary text-white shadow-sm hover:scale-110'
                          : isCurrentNext
                          ? 'bg-amber-500 text-white ring-4 ring-amber-500/20 hover:scale-110'
                          : 'bg-surface-container text-outline hover:bg-surface-container-high'
                      }`}
                      aria-label={`Inspect ${m.tier} milestone`}
                    >
                      {idx + 1}
                    </button>
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

              <button
                type="button"
                onClick={() => setSelectedMedal(nextMilestone)}
                className="w-10 h-10 rounded-full bg-surface-container-lowest hairline flex items-center justify-center text-primary shadow-xs hover:bg-surface-container-low transition-colors cursor-pointer border-0"
                aria-label="Inspect next milestone in 3D"
              >
                <Award className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Real 3D Medal Detail Modal (Phase A & B) ── */}
      <AnimatePresence>
        {selectedMedal && (
          <MedalDetailModal
            medal={selectedMedal}
            isOpen={Boolean(selectedMedal)}
            onClose={() => setSelectedMedal(null)}
          />
        )}
      </AnimatePresence>
    </PageShell>
  );
}
