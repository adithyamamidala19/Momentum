import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../context/MomentumContext.jsx';
import { api } from '../services/apiClient.js';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import CountUp from '../components/architecture/CountUp.jsx';
import AchievementsSection from '../components/achievements/AchievementsSection.jsx';
import { pluralize } from '../utils/formatters.js';
import {
  Sparkles,
  Flame,
  Clock,
  Activity,
  Calendar,
  TrendingUp,
  Info,
  CheckCircle2,
  Leaf,
  RefreshCw,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

/**
 * Catmull-Rom spline converter to SVG cubic Bezier path
 */
function getCatmullRomPath(points) {
  if (!points || points.length < 2) return '';
  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, points.length - 1)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export default function InsightsPage({ setView }) {
  const { state, metrics, refreshAll } = useMomentum();
  const [hoveredDay, setHoveredDay] = useState(null);
  const [activeChartPoint, setActiveChartPoint] = useState(null);

  // Dedicated Insights API state
  const [insightsData, setInsightsData] = useState(null);
  const [achievementsData, setAchievementsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRange, setSelectedRange] = useState('30d');

  // Fetch real authoritative insights and achievements
  const fetchInsights = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [insRes, achRes] = await Promise.all([
        api.get(`/insights?range=${selectedRange}`),
        api.get('/achievements').catch(() => null)
      ]);

      setInsightsData(insRes);
      if (achRes) setAchievementsData(achRes);
    } catch (err) {
      console.error('[InsightsPage] Error loading insights:', err);
      setError('Unable to load rhythm reflections right now.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedRange]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  // 30-day consistency heatmap derived from real backend response
  const heatmapData = useMemo(() => {
    return insightsData?.heatmap || [];
  }, [insightsData]);

  // Generate SVG coordinates for Catmull-Rom spline wave (800x180 viewBox)
  const chartWidth = 800;
  const chartHeight = 180;
  const paddingX = 24;
  const paddingY = 24;

  const chartPoints = useMemo(() => {
    if (heatmapData.length === 0) return [];
    const step = (chartWidth - paddingX * 2) / Math.max(1, heatmapData.length - 1);
    const usableHeight = chartHeight - paddingY * 2;

    return heatmapData.map((d, idx) => {
      const x = paddingX + idx * step;
      // Adherence 0-100 maps to usable height (invert y because SVG 0 is top)
      const y = paddingY + usableHeight - (d.adherence / 100) * usableHeight;
      return {
        ...d,
        x,
        y
      };
    });
  }, [heatmapData]);

  const splinePath = useMemo(() => getCatmullRomPath(chartPoints), [chartPoints]);
  const areaPath = useMemo(() => {
    if (!splinePath || chartPoints.length === 0) return '';
    const last = chartPoints[chartPoints.length - 1];
    const first = chartPoints[0];
    const bottomY = chartHeight - paddingY + 6;
    return `${splinePath} L ${last.x.toFixed(1)} ${bottomY} L ${first.x.toFixed(1)} ${bottomY} Z`;
  }, [splinePath, chartPoints]);

  // Derived metrics with fallback to central store
  const totalScore = insightsData?.totalScore ?? metrics.totalPoints ?? 0;
  const streakCount = insightsData?.streak ?? metrics.streak ?? 0;
  const mindfulHours = insightsData?.mindfulHours ?? state.mindfulHours ?? 0;
  const avgAdherence = insightsData?.averageAdherence ?? metrics.dailyAdherenceScore ?? 0;
  const currentMomentum = insightsData?.currentMomentum ?? avgAdherence;

  const hasZeroLogs = insightsData && !insightsData.hasAnyLogs && heatmapData.every((d) => d.adherence === 0 && !d.isRestDay);

  return (
    <PageShell>
      <PageHeader
        eyebrow="Visual Reflections"
        title="Rhythm Analytics & Insights"
        subtitle="Long-term consistency patterns without guilt or arbitrary gaming mechanics."
        action={
          <button
            type="button"
            onClick={fetchInsights}
            disabled={isLoading}
            className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container hairline text-outline hover:text-on-surface transition-all cursor-pointer border-0 shadow-xs active:scale-95"
            title="Refresh rhythm data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#0F6E56]' : ''}`} />
          </button>
        }
      />

      {/* ── 4 Overview Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {/* Stat 1: Unified Total Score */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
              Total Score
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center text-[#0F6E56]">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F6E56] font-mono">
              <CountUp value={totalScore} duration={1.2} />
            </div>
            <span className="text-[10px] text-outline block mt-1">practice points accumulated</span>
          </div>
        </div>

        {/* Stat 2: Active Streak */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
              Active Streak
            </span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Flame className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-700 font-mono">
              {pluralize(streakCount, 'day')}
            </div>
            <span className="text-[10px] text-outline block mt-1">rest days honored 🌿</span>
          </div>
        </div>

        {/* Stat 3: Mindful Focus */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
              Mindful Focus
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center text-[#0F6E56]">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F6E56] font-mono">
              <CountUp value={mindfulHours} duration={1} decimals={mindfulHours % 1 !== 0 ? 1 : 0} />h
            </div>
            <span className="text-[10px] text-outline block mt-1">deep work presence</span>
          </div>
        </div>

        {/* Stat 4: Composite Daily Adherence */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
              30-Day Adherence
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center text-[#0F6E56]">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F6E56] font-mono">
              <CountUp value={avgAdherence} duration={1.2} />%
            </div>
            <span className="text-[10px] text-outline block mt-1">rolling period average</span>
          </div>
        </div>
      </div>

      {/* ── Error State Banner ── */}
      {error && (
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 text-red-800 flex items-center justify-between mb-8 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchInsights}
            className="px-3 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer border-0 shadow-xs"
          >
            Retry
          </button>
        </div>
      )}

      {/* ── 30-Day Activity Heatmap ── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-5 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F6E56]" />
              <span>30-Day Consistency Heatmap</span>
            </h2>
            <p className="text-xs text-outline mt-0.5">
              Reflecting daily habit completions, hydration, and mindful focus ending today.
            </p>
          </div>

          {/* Palette Legend */}
          <div className="flex items-center gap-2 text-[11px] text-outline self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-surface-container-high border border-dashed border-[#5A7A6E]/50" />
              <span>Rest</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#0F6E56]/30" />
              <span>Low</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#0F6E56]/60" />
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-[#0F6E56]" />
              <span>Peak</span>
            </div>
          </div>
        </div>

        {/* Heatmap States */}
        {isLoading ? (
          /* Loading Skeleton: 30 Shimmering Tiles */
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="h-11 sm:h-12 rounded-xl bg-surface-container-low animate-pulse"
              />
            ))}
          </div>
        ) : hasZeroLogs ? (
          /* Empty State: Only when user has zero historical logs */
          <div className="p-8 text-center rounded-2xl bg-surface-container-low hairline text-xs text-outline space-y-3">
            <Calendar className="w-8 h-8 text-[#0F6E56]/40 mx-auto" />
            <div>
              <p className="font-bold text-on-surface text-sm">No data yet</p>
              <p className="mt-1">Start a ritual or log a focus session today to begin your heatmap.</p>
            </div>
            {setView && (
              <button
                type="button"
                onClick={() => setView('today')}
                className="px-4 py-2 rounded-full bg-[#0F6E56] hover:bg-[#0B5240] text-white font-semibold inline-flex items-center gap-1.5 cursor-pointer border-0 shadow-xs"
              >
                <span>Go to Today's Practice</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          /* Real Heatmap Grid */
          <div className="relative">
            <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2">
              {heatmapData.map((d, idx) => {
                let bgStyle = '';
                let textColor = '#0F6E56';

                if (d.isRestDay) {
                  bgStyle = 'bg-surface-container-high border border-dashed border-[#5A7A6E]/50 text-[#5A7A6E]';
                  textColor = '#5A7A6E';
                } else if (d.adherence >= 80) {
                  bgStyle = 'bg-[#0F6E56] text-white';
                  textColor = '#ffffff';
                } else if (d.adherence >= 50) {
                  bgStyle = 'bg-[#0F6E56]/60 text-white';
                  textColor = '#ffffff';
                } else if (d.adherence > 0) {
                  bgStyle = 'bg-[#0F6E56]/30 text-[#0F6E56]';
                  textColor = '#0F6E56';
                } else {
                  bgStyle = 'bg-surface-container text-outline/60';
                  textColor = 'inherit';
                }

                return (
                  <motion.div
                    key={d.date || idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.015, duration: 0.2 }}
                    onMouseEnter={() => setHoveredDay(d)}
                    onMouseLeave={() => setHoveredDay(null)}
                    onClick={() => setHoveredDay(d)}
                    className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 hover:shadow-md relative ${bgStyle}`}
                  >
                    <span className="text-[9px] uppercase font-bold tracking-wider opacity-75">
                      {d.weekday}
                    </span>
                    <span className="text-xs font-bold font-mono">
                      {d.dayIndex}
                    </span>
                    {d.isRestDay && (
                      <span className="text-[8px] opacity-90 leading-none">🌿</span>
                    )}
                    {d.isToday && (
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute bottom-1" />
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Interactive Tooltip Card */}
            <div className="mt-4 p-3.5 rounded-2xl bg-surface-container-low hairline flex items-center justify-between text-xs">
              {hoveredDay ? (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">
                      {hoveredDay.dateLabel}, 2026 ({hoveredDay.weekday})
                    </span>
                    {hoveredDay.isToday && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 text-[10px] font-bold">
                        Today
                      </span>
                    )}
                    {hoveredDay.isRestDay && (
                      <span className="px-2 py-0.5 rounded-full bg-[#5A7A6E]/20 text-[#5A7A6E] text-[10px] font-bold flex items-center gap-1">
                        <Leaf className="w-3 h-3" /> Rest Day Honored
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-outline">
                      {hoveredDay.completed} of {hoveredDay.total || 0} rituals completed
                    </span>
                    <span className="font-mono font-extrabold text-[#0F6E56]">
                      {hoveredDay.adherence}% adherence
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-outline flex items-center gap-2">
                  <Info className="w-4 h-4 text-outline/70 shrink-0" />
                  <span>Hover or tap any day tile to inspect exact date, completions, and rest records.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Momentum Curve (Catmull-Rom Spline) ── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0F6E56]" />
              <span>Momentum Curve (Catmull-Rom Spline)</span>
            </h2>
            <p className="text-xs text-outline mt-0.5">
              Continuous mathematical trajectory reflecting 30-day practice consistency without abrupt jagged edges.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-mono font-bold text-[#0F6E56] bg-[#0F6E56]/10 px-2.5 py-1 rounded-full">
              {currentMomentum}% Current Momentum
            </span>
          </div>
        </div>

        {/* Responsive SVG Spline Chart */}
        {isLoading ? (
          <div className="w-full h-44 sm:h-52 rounded-2xl bg-surface-container-low animate-pulse flex items-center justify-center text-xs text-outline">
            Rendering trajectory curve...
          </div>
        ) : hasZeroLogs ? (
          <div className="w-full h-44 sm:h-52 rounded-2xl bg-surface-container-low hairline flex flex-col items-center justify-center p-6 text-center text-xs text-outline">
            <TrendingUp className="w-8 h-8 text-[#0F6E56]/30 mb-2" />
            <p className="font-bold text-on-surface">No momentum trajectory yet</p>
            <p className="text-[11px] mt-1">Daily completions will generate your smooth Catmull-Rom curve.</p>
          </div>
        ) : (
          <div className="relative w-full overflow-hidden pt-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 sm:h-52 overflow-visible select-none"
              onMouseLeave={() => setActiveChartPoint(null)}
            >
              <defs>
                <linearGradient id="splineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0F6E56" stopOpacity="0.28" />
                  <stop offset="70%" stopColor="#0F6E56" stopOpacity="0.06" />
                  <stop offset="100%" stopColor="#0F6E56" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[25, 50, 75, 100].map((pct) => {
                const usableHeight = chartHeight - paddingY * 2;
                const y = paddingY + usableHeight - (pct / 100) * usableHeight;
                return (
                  <g key={pct}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={chartWidth - paddingX}
                      y2={y}
                      stroke="#E6E6E3"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingX - 6}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[9px] fill-[#8A8A85] font-mono"
                    >
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Gradient Area Fill */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="url(#splineGradient)"
                  className="transition-all duration-300"
                />
              )}

              {/* Catmull-Rom Spline Stroke */}
              {splinePath && (
                <path
                  d={splinePath}
                  fill="none"
                  stroke="#0F6E56"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Points & Crosshair Hover */}
              {chartPoints.map((pt, i) => (
                <g
                  key={i}
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveChartPoint(pt)}
                >
                  {/* Invisible hover hitbox */}
                  <rect
                    x={pt.x - 12}
                    y={0}
                    width={24}
                    height={chartHeight}
                    fill="transparent"
                  />

                  {/* Point dot on key intervals or active hover */}
                  {(activeChartPoint?.date === pt.date ||
                    i === 0 ||
                    i === chartPoints.length - 1 ||
                    i % 7 === 0) && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={activeChartPoint?.date === pt.date ? 6 : 3.5}
                      fill={activeChartPoint?.date === pt.date ? '#0F6E56' : '#FAF7F0'}
                      stroke="#0F6E56"
                      strokeWidth="2.5"
                      className="transition-all duration-150"
                    />
                  )}
                </g>
              ))}

              {/* Active vertical cursor line */}
              {activeChartPoint && (
                <g>
                  <line
                    x1={activeChartPoint.x}
                    y1={paddingY}
                    x2={activeChartPoint.x}
                    y2={chartHeight - paddingY}
                    stroke="#0F6E56"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </g>
              )}
            </svg>

            {/* Active Hover Floating Bubble */}
            <div className="min-h-[44px] flex items-center justify-between px-3 py-2 rounded-2xl bg-surface-container-low hairline text-xs mt-2">
              {activeChartPoint ? (
                <div className="flex items-center justify-between w-full">
                  <span className="font-semibold text-on-surface">
                    {activeChartPoint.dateLabel}, 2026 ({activeChartPoint.weekday})
                  </span>
                  <div className="flex items-center gap-2">
                    {activeChartPoint.isRestDay && (
                      <span className="text-[10px] text-[#5A7A6E] font-bold">Rest Day 🌿</span>
                    )}
                    <span className="font-mono font-extrabold text-[#0F6E56]">
                      {activeChartPoint.adherence}% Momentum
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-outline text-[11px]">
                  Hover along the momentum curve to inspect historic adherence coordinates.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── NEW FEATURE: Weekly + Monthly Achievement Badges ── */}
      <AchievementsSection
        achievementsData={achievementsData}
        isLoading={isLoading}
        onRefresh={fetchInsights}
      />
    </PageShell>
  );
}
