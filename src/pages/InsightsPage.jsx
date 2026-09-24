import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import CountUp from '../components/architecture/CountUp.jsx';
import { pluralize, formatFriendlyDate } from '../utils/formatters.js';
import {
  Sparkles,
  Flame,
  Clock,
  Activity,
  Calendar,
  TrendingUp,
  Info,
  CheckCircle2,
  Leaf
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

export default function InsightsPage() {
  const { state, metrics } = useMomentum();
  const [hoveredDay, setHoveredDay] = useState(null);
  const [activeChartPoint, setActiveChartPoint] = useState(null);

  // 30-day consistency heatmap derived from real store data
  const heatmapData = metrics.heatmapData || [];

  // Generate SVG coordinates for Catmull-Rom spline wave (800x180 viewBox)
  const chartWidth = 800;
  const chartHeight = 180;
  const paddingX = 24;
  const paddingY = 24;

  const chartPoints = useMemo(() => {
    if (heatmapData.length === 0) return [];
    const step = (chartWidth - paddingX * 2) / (heatmapData.length - 1);
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

  return (
    <PageShell>
      <PageHeader
        eyebrow="Visual Reflections"
        title="Rhythm Analytics & Insights"
        subtitle="Long-term consistency patterns without guilt or arbitrary gaming mechanics."
      />

      {/* ── 4 Overview Stat Cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {/* Stat 1: Total Practice Points */}
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
              <CountUp value={metrics.totalPoints} duration={1.2} />
            </div>
            <span className="text-[10px] text-outline block mt-1">points accumulated</span>
          </div>
        </div>

        {/* Stat 2: Active Streak (Pluralized + Amber) */}
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
              {pluralize(metrics.streak, 'day')}
            </div>
            <span className="text-[10px] text-outline block mt-1">rest days honored 🌿</span>
          </div>
        </div>

        {/* Stat 3: Mindful Focus (Eliminated off-palette indigo) */}
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
              <CountUp value={state.mindfulHours || 38} duration={1} />h
            </div>
            <span className="text-[10px] text-outline block mt-1">deep work presence</span>
          </div>
        </div>

        {/* Stat 4: Composite Daily Adherence (Eliminated off-palette cyan) */}
        <div className="p-5 rounded-3xl bg-surface-container-lowest hairline shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-outline mb-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
              Daily Adherence
            </span>
            <div className="w-7 h-7 rounded-xl bg-[#0F6E56]/10 flex items-center justify-center text-[#0F6E56]">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#0F6E56] font-mono">
              <CountUp value={metrics.dailyAdherenceScore} duration={1.2} />%
            </div>
            <span className="text-[10px] text-outline block mt-1">composite balance</span>
          </div>
        </div>
      </div>

      {/* ── 30-Day Activity Heatmap ── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-5 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#0F6E56]" />
              <span>30-Day Consistency Heatmap</span>
            </h2>
            <p className="text-xs text-outline mt-0.5">
              Reflecting daily habit completions and restful pauses ending today in 2026.
            </p>
          </div>

          {/* Palette Legend */}
          <div className="flex items-center gap-2 text-[11px] text-outline self-start sm:self-auto">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-surface-container-high border border-outline/20" />
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

        {/* Heatmap Grid */}
        <div className="relative">
          <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 gap-2">
            {heatmapData.map((d, idx) => {
              // Color calculation based on brand green & rest status
              let bgStyle = '';
              let textColor = '#0F6E56';

              if (d.isRestDay) {
                bgStyle = 'bg-surface-container-high border border-dashed border-[#5A7A6E]/40';
                textColor = '#5A7A6E';
              } else if (d.adherence >= 85) {
                bgStyle = 'bg-[#0F6E56] text-white';
                textColor = '#ffffff';
              } else if (d.adherence >= 65) {
                bgStyle = 'bg-[#0F6E56]/60 text-white';
                textColor = '#ffffff';
              } else {
                bgStyle = 'bg-[#0F6E56]/30 text-[#0F6E56]';
                textColor = '#0F6E56';
              }

              return (
                <motion.div
                  key={d.dayIndex}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.015, duration: 0.2 }}
                  onMouseEnter={() => setHoveredDay(d)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`h-11 sm:h-12 rounded-xl flex flex-col items-center justify-center p-1 cursor-pointer transition-all hover:scale-105 hover:shadow-md relative ${bgStyle}`}
                >
                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-75">
                    {d.weekday}
                  </span>
                  <span className="text-xs font-bold font-mono">
                    {d.dayIndex}
                  </span>
                  {d.isRestDay && (
                    <span className="text-[8px] opacity-80 leading-none">🌿</span>
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
              <div className="flex items-center justify-between w-full">
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
                    {hoveredDay.completed} of {hoveredDay.total} rituals completed
                  </span>
                  <span className="font-mono font-extrabold text-[#0F6E56]">
                    {hoveredDay.adherence}% adherence
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-outline flex items-center gap-2">
                <Info className="w-4 h-4 text-outline/70" />
                <span>Hover over any day tile to inspect exact date, completions, and rest records.</span>
              </div>
            )}
          </div>
        </div>
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
            <span className="text-xs font-mono font-bold text-[#0F6E56]">
              {metrics.dailyAdherenceScore}% Current Momentum
            </span>
          </div>
        </div>

        {/* Responsive SVG Spline Chart */}
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
            {[25, 50, 75, 100].map(pct => {
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
                {(activeChartPoint?.dayIndex === pt.dayIndex || i === 0 || i === chartPoints.length - 1 || i % 7 === 0) && (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={activeChartPoint?.dayIndex === pt.dayIndex ? 6 : 3.5}
                    fill={activeChartPoint?.dayIndex === pt.dayIndex ? '#0F6E56' : '#FAF7F0'}
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
                  Day {activeChartPoint.dayIndex} · {activeChartPoint.dateLabel}, 2026
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
      </div>
    </PageShell>
  );
}
