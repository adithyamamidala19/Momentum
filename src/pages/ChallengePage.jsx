import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Crown,
  Sparkles,
  ArrowUp,
  ArrowRight,
  Shield,
  HeartHandshake,
  Clock,
  Check,
  Award,
  ChevronDown,
  Info,
  LogOut,
  UserCheck
} from 'lucide-react';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import CountUp from '../components/architecture/CountUp.jsx';
import {
  getWeeklyLeaderboard,
  getLastWeekWinners,
  getCurrentWeekId
} from '../services/leaderboardService.js';
import { SCORE_CONFIG } from '../config/scoreConfig.js';

export default function ChallengePage({ setView }) {
  const { state, metrics, joinChallenge, leaveChallenge } = useMomentum();
  const [participants, setParticipants] = useState([]);
  const [lastWeekWinners, setLastWeekWinners] = useState([]);
  const [sortBy, setSortBy] = useState('weeklyScore'); // 'weeklyScore' | 'practiceScore' | 'adherence'
  const [infoOpen, setInfoOpen] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);

  // Opt-in join form state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState(state.challengeNickname || 'QuietFern');
  const [avatarInput, setAvatarInput] = useState(state.challengeAvatar || '🌿');

  // Sticky user row detection
  const userRowRef = useRef(null);
  const [userRowVisible, setUserRowVisible] = useState(true);

  // Reset Countdown to Monday 00:00 local time
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const nextMonday = new Date(now);
      const day = now.getDay();
      const diffToMonday = (8 - (day === 0 ? 7 : day)) % 7 || 7;
      nextMonday.setDate(now.getDate() + diffToMonday);
      nextMonday.setHours(0, 0, 0, 0);

      const diffMs = nextMonday.getTime() - now.getTime();
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
      setTimeLeft({ days, hours, minutes });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch leaderboard data whenever store updates or sorting changes
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const data = await getWeeklyLeaderboard({
        weekId: getCurrentWeekId(),
        userProfile: state,
        userMetrics: metrics,
        sortBy
      });
      const winners = await getLastWeekWinners();
      if (isMounted) {
        setParticipants(data);
        setLastWeekWinners(winners);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [state, metrics, sortBy]);

  // Observer to check if user's real row is in viewport
  useEffect(() => {
    if (!userRowRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setUserRowVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    observer.observe(userRowRef.current);
    return () => observer.disconnect();
  }, [participants]);

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    joinChallenge({
      nickname: nicknameInput.trim(),
      avatar: avatarInput
    });
    setJoinModalOpen(false);
  };

  const scrollToUserRow = () => {
    if (userRowRef.current) {
      userRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const top3 = participants.slice(0, 3);
  // Rearrange top 3 for classic podium aesthetic: [2nd, 1st, 3rd]
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean);
  const remainingParticipants = participants.slice(3);

  const currentUserParticipant = participants.find(p => p.isCurrentUser);
  const userPercentile = currentUserParticipant
    ? Math.max(1, Math.round((currentUserParticipant.rank / participants.length) * 100))
    : null;

  return (
    <PageShell>
      {/* ── Page Header ── */}
      <PageHeader
        eyebrow="WEEKLY CHALLENGE"
        title="Rhythm Rankings"
        subtitle="A gentle weekly circle of people building steady habits. Non-competitive: rest days and skipped rituals never lower your rank."
        action={
          <div className="flex items-center gap-2">
            {/* Weekly Countdown Chip */}
            <div className="px-3.5 py-1.5 rounded-full bg-[#FAF7F0] border border-[#E6E6E3] text-xs font-semibold text-[#0F6E56] flex items-center gap-1.5 shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-[#0F6E56]" />
              <span>Resets in: {timeLeft.days}d {timeLeft.hours}h</span>
            </div>

            {/* Score Explanation Modal Trigger */}
            <button
              type="button"
              onClick={() => setInfoOpen(prev => !prev)}
              className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0 transition-colors"
              title="How scores work"
              aria-label="How scores work"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        }
      />

      {/* ── How Scores Work Popover ── */}
      <AnimatePresence>
        {infoOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-5 rounded-2xl bg-surface-container-lowest hairline shadow-md space-y-3 select-none overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#0F6E56] flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4" />
                <span>Rhythm Over Rank — Score Philosophy</span>
              </span>
              <button
                type="button"
                onClick={() => setInfoOpen(false)}
                className="text-outline text-xs hover:text-on-surface cursor-pointer border-0 bg-transparent"
              >
                Close
              </button>
            </div>
            <p className="text-xs text-outline leading-relaxed">
              Momentum scores reflect balanced consistency, not exhaustion. Skipping a ritual on a designated rest day excludes that ritual from the adherence denominator, so you are never penalized for resting.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <span className="font-bold block text-on-surface">Weekly Score</span>
                <span className="text-outline text-[11px]">Combined harmonic index (50% Practice + 30% Adherence + 20% Focus).</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <span className="font-bold block text-on-surface">Practice Score</span>
                <span className="text-outline text-[11px]">Points accumulated from rituals, hydration, focus, and workouts.</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low">
                <span className="font-bold block text-on-surface">Adherence %</span>
                <span className="text-outline text-[11px]">Weekly habit consistency where rest days are protected.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Opt-In Privacy Card (If Not Joined) ── */}
      {!state.challengeJoined ? (
        <div className="mb-8 p-6 rounded-3xl bg-surface-container-lowest hairline shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#0F6E56]/10 text-[#0F6E56] flex items-center justify-center shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-editorial text-lg text-on-surface font-normal">
                Join the Weekly Circle
              </h3>
              <p className="text-xs text-outline mt-0.5 max-w-xl">
                Only an anonymous botanical nickname and avatar are displayed—never your real name or contact info. You can leave at any moment with one click.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setJoinModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-[#0F6E56] hover:bg-[#168A6D] text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border-0 shadow-xs shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Join Circle</span>
          </button>
        </div>
      ) : (
        /* Joined Banner with Percentile & Leave Action */
        <div className="mb-6 p-4 rounded-2xl bg-[#0F6E56]/10 border border-[#0F6E56]/20 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{state.challengeAvatar || '🌱'}</span>
            <div>
              <span className="font-bold text-[#0F6E56]">
                You are participating as {state.challengeNickname || 'CalmRiver'}
              </span>
              <span className="text-outline block text-[11px]">
                {userPercentile ? `Top ${userPercentile}% rhythm in this week's sanctuary circle` : 'Harmonious weekly rhythm'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={leaveChallenge}
            className="px-3 py-1.5 rounded-full bg-surface-container-lowest hover:bg-surface-container text-[11px] font-semibold text-outline hover:text-on-surface flex items-center gap-1 cursor-pointer border-0 transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>Leave</span>
          </button>
        </div>
      )}

      {/* ── Sort Segmented Control ── */}
      <div className="mb-8 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1 p-1 rounded-full bg-surface-container-low hairline">
          {[
            { id: 'weeklyScore', label: 'Weekly Score' },
            { id: 'practiceScore', label: 'Practice Points' },
            { id: 'adherence', label: 'Adherence %' }
          ].map(tab => {
            const isSelected = sortBy === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSortBy(tab.id)}
                className={`relative px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors ${
                  isSelected ? 'text-white' : 'text-outline hover:text-on-surface'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="activeChallengeSort"
                    className="absolute inset-0 rounded-full bg-[#0F6E56] shadow-xs"
                    transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                  />
                )}
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Weekly Goal Progress Pill */}
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-outline">
          <span>Weekly Goal:</span>
          <div className="w-24 h-2 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-[#0F6E56] rounded-full"
              style={{ width: `${Math.min(100, ((metrics.weeklyScore || 300) / 500) * 100)}%` }}
            />
          </div>
          <span className="text-on-surface font-mono">{metrics.weeklyScore || 300} / 500</span>
        </div>
      </div>

      {/* ── PODIUM FOR TOP 3 (2nd, 1st, 3rd) ── */}
      <div className="mb-12 pt-6">
        <div className="flex items-end justify-center gap-2 sm:gap-6 max-w-lg mx-auto">
          {podium.map((person) => {
            const isFirst = person.rank === 1;
            const isSecond = person.rank === 2;
            const isThird = person.rank === 3;

            const podiumHeight = isFirst ? 'h-44 sm:h-52' : isSecond ? 'h-36 sm:h-44' : 'h-28 sm:h-36';
            const medalColor = isFirst
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : isSecond
              ? 'bg-slate-100 text-slate-700 border-slate-300'
              : 'bg-orange-100 text-orange-800 border-orange-300';

            return (
              <motion.div
                key={person.id}
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{
                  duration: 0.6,
                  delay: isFirst ? 0.1 : isSecond ? 0.2 : 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
                className="flex-1 flex flex-col items-center"
              >
                {/* Avatar with soft drop-in */}
                <div className="relative mb-2 flex flex-col items-center">
                  {isFirst && (
                    <Crown className="w-5 h-5 text-amber-500 fill-amber-400 mb-1 animate-pulse" />
                  )}
                  <div
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-2xl sm:text-3xl shadow-md hairline bg-surface-container-lowest relative ${
                      isFirst ? 'ring-2 ring-amber-400/80' : ''
                    }`}
                  >
                    <span>{person.avatar}</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface mt-1 truncate max-w-[85px] sm:max-w-[110px] text-center">
                    {person.nickname}
                  </span>
                  <span className="text-[10px] font-mono text-outline">
                    <CountUp value={person[sortBy]} duration={1.5} />
                    {sortBy === 'adherence' ? '%' : ' pts'}
                  </span>
                </div>

                {/* Podium Block */}
                <div
                  className={`w-full ${podiumHeight} rounded-t-2xl sm:rounded-t-3xl flex flex-col items-center justify-start pt-3 sm:pt-4 transition-all hairline ${
                    isFirst
                      ? 'bg-gradient-to-b from-[#FAF7F0] to-[#E8F5F1] border-[#0F6E56]/30 shadow-sm'
                      : 'bg-surface-container-lowest border-surface-container'
                  }`}
                >
                  <span
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-xs font-extrabold border ${medalColor}`}
                  >
                    {person.rank}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── RANKED LIST (Rank 4 Onward) ── */}
      <div className="space-y-2 mb-16">
        <div className="flex items-center justify-between px-4 py-2 text-[10px] uppercase font-bold tracking-wider text-outline border-b border-surface-container">
          <div className="flex items-center gap-3">
            <span className="w-8 text-center">Rank</span>
            <span>Participant</span>
          </div>
          <div className="flex items-center gap-6 sm:gap-12">
            <span className="w-16 text-right">Weekly</span>
            <span className="w-16 text-right hidden sm:inline">Practice</span>
            <span className="w-16 text-right hidden sm:inline">Adherence</span>
          </div>
        </div>

        {remainingParticipants.map((user) => {
          const isUserRow = user.isCurrentUser;
          const isExpanded = expandedRowId === user.id;

          return (
            <motion.div
              key={user.id}
              ref={isUserRow ? userRowRef : null}
              layout
              onClick={() => setExpandedRowId(isExpanded ? null : user.id)}
              className={`p-3.5 sm:p-4 rounded-2xl hairline flex flex-col gap-2 transition-all cursor-pointer ${
                isUserRow
                  ? 'bg-[#0F6E56]/10 border-[#0F6E56]/40 shadow-xs'
                  : 'bg-surface-container-lowest hover:bg-surface-container-low/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 text-xs font-mono font-bold text-outline text-center">
                    #{user.rank}
                  </span>
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-base shrink-0 shadow-2xs">
                    {user.avatar}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-on-surface block truncate">
                      {user.nickname} {isUserRow && <span className="text-[#0F6E56] font-normal">(You)</span>}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 sm:gap-12">
                  <div className="w-16 text-right">
                    <span className="text-xs font-bold font-mono text-on-surface">
                      {user.weeklyScore}
                    </span>
                  </div>
                  <div className="w-16 text-right hidden sm:inline">
                    <span className="text-xs font-mono text-outline">
                      {user.practiceScore}
                    </span>
                  </div>
                  <div className="w-16 text-right hidden sm:inline">
                    <span className="text-xs font-mono text-teal-700 font-semibold">
                      {user.adherence}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Mobile Tap-To-Expand Details */}
              {isExpanded && (
                <div className="sm:hidden pt-2 border-t border-surface-container flex items-center justify-around text-xs text-outline">
                  <div>Practice: <strong className="text-on-surface">{user.practiceScore} pts</strong></div>
                  <div>Adherence: <strong className="text-teal-700">{user.adherence}%</strong></div>
                  <div>Focus: <strong className="text-on-surface">{user.focusMins}m</strong></div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── LAST WEEK'S CIRCLE WINNERS STRIP ── */}
      <div className="p-6 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-3 mb-12">
        <h3 className="font-editorial text-lg text-on-surface font-normal">
          Last Week's Rhythm Anchors
        </h3>
        <p className="text-xs text-outline">
          Recognizing unhurried consistency from the previous weekly circle.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {lastWeekWinners.map(winner => (
            <div
              key={winner.rank}
              className="p-3.5 rounded-2xl bg-surface-container-low hairline flex items-center gap-3"
            >
              <span className="text-2xl">{winner.avatar}</span>
              <div>
                <span className="text-xs font-bold text-on-surface block">
                  #{winner.rank} {winner.nickname}
                </span>
                <span className="text-[10px] text-outline">
                  {winner.weeklyScore} pts · {winner.note}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PINNED STICKY USER ROW AT BOTTOM (If joined & off-screen) ── */}
      <AnimatePresence>
        {state.challengeJoined && currentUserParticipant && !userRowVisible && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={scrollToUserRow}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-xl p-3 sm:p-4 rounded-2xl bg-[#0F6E56] text-white shadow-2xl flex items-center justify-between cursor-pointer border border-[#A0F3D4]/30"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/20">
                #{currentUserParticipant.rank}
              </span>
              <span className="text-xl">{currentUserParticipant.avatar}</span>
              <div>
                <span className="text-xs font-bold block">{currentUserParticipant.nickname} (You)</span>
                <span className="text-[10px] text-white/80">Tap to scroll to your standing</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono font-bold block">
                {currentUserParticipant.weeklyScore} pts
              </span>
              <span className="text-[10px] text-white/80">
                {currentUserParticipant.adherence}% Adherence
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Opt-In Nickname & Avatar Modal ── */}
      <AnimatePresence>
        {joinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest hairline shadow-2xl max-w-sm w-full text-center"
            >
              <div className="w-12 h-12 rounded-full bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center mx-auto mb-3">
                <Trophy className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-2xl text-on-surface">
                Join the Sanctuary Circle
              </h3>
              <p className="text-xs text-outline mt-1 leading-relaxed">
                Choose an anonymous botanical name & glyph. Your real identity remains 100% private.
              </p>

              <form onSubmit={handleJoinSubmit} className="mt-5 space-y-4 text-left">
                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Sanctuary Nickname
                  </label>
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={e => setNicknameInput(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                    placeholder="e.g. QuietFern"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-on-surface block mb-1">
                    Botanical Glyph
                  </label>
                  <div className="flex items-center gap-2 justify-center py-1">
                    {['🌿', '🌊', '🌲', '🍃', '🪨', '🎋', '🪷', '🌱'].map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAvatarInput(emoji)}
                        className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center cursor-pointer border transition-all ${
                          avatarInput === emoji
                            ? 'bg-[#0F6E56]/15 border-[#0F6E56] scale-110'
                            : 'bg-surface-container border-transparent hover:bg-surface-container-high'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setJoinModalOpen(false)}
                    className="flex-1 py-2.5 rounded-full bg-surface-container text-xs font-semibold text-outline cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-[#0F6E56] hover:bg-[#168A6D] text-white text-xs font-bold transition-all cursor-pointer border-0 shadow-xs"
                  >
                    Enter Circle
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
