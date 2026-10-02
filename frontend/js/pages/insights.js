// ═══════════════════════════════════════════════════════
// MOMENTUM — INSIGHTS PAGE CONTROLLER & CALENDAR ENGINE
// ═══════════════════════════════════════════════════════

export let selectedCalendarIndex = 23;

// Helper to construct SVG spline path and area for dynamic graph
function createGraphPaths(dots) {
  const xs = [0, 100, 280, 370, 460, 545, 630];
  let lineD = `M ${xs[0]},${dots[0]}`;
  for (let i = 0; i < dots.length - 1; i++) {
    const p0 = i > 0 ? { x: xs[i-1], y: dots[i-1] } : { x: xs[i], y: dots[i] };
    const p1 = { x: xs[i],   y: dots[i]   };
    const p2 = { x: xs[i+1], y: dots[i+1] };
    const p3 = i < dots.length - 2 ? { x: xs[i+2], y: dots[i+2] } : { x: xs[i+1], y: dots[i+1] };
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    lineD += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  const areaD = lineD + ` L 630,130 L 0,130 Z`;
  return { lineD, areaD };
}

// 30 Days of Rich Calendar Data
export const CALENDAR_DAYS_DATA = (function() {
  const baseDots100 = [118, 48, 22, 60, 28, 55, 20];
  const baseDots75  = [120, 68, 45, 75, 52, 70, 48];
  const baseDots50  = [122, 85, 70, 92, 78, 88, 75];
  const baseDots30  = [125, 105, 95, 110, 98, 105, 90];
  const baseDots0   = [128, 125, 122, 126, 124, 125, 120];

  const days = [];
  const patterns = [
    { pct: 100, score: 96, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Full morning and evening alignment held unbroken.' },
    { pct: 100, score: 94, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Deep focus flow state achieved with zero skips.' },
    { pct: 75,  score: 84, completed: '3 of 4', habits: [100, 100, 50, 100],  note: 'Solid morning consistency; evening wind-down shortened.' },
    { pct: 100, score: 95, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Smooth unhurried practice across all rituals.' },
    { pct: 100, score: 98, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Exemplary presence and mindful movement.' },
    { pct: 75,  score: 82, completed: '3 of 4', habits: [100, 75, 100, 50],   note: 'Weekend daylight movement completed gracefully.' },
    { pct: 50,  score: 68, completed: '2 of 4', habits: [100, 0, 100, 0],     note: 'Rest and recovery pacing prioritized today.' },
    { pct: 100, score: 92, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Rebounded strong with full morning hydration and focus.' },
    { pct: 100, score: 95, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Box breathing calmed afternoon transitions.' },
    { pct: 75,  score: 85, completed: '3 of 4', habits: [100, 100, 100, 0],   note: 'All daytime practices locked in before dusk.' },
    { pct: 100, score: 97, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Deep calm focus session logged with binaural audio.' },
    { pct: 100, score: 96, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Consistent dim-down cue prepared restorative sleep.' },
    { pct: 100, score: 99, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Flawless cadence across all 4 pillars.' },
    { pct: 75,  score: 81, completed: '3 of 4', habits: [100, 50, 100, 100],  note: 'Mindful breath breaks anchored a busy schedule.' },
    { pct: 100, score: 94, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Clean rhythm sustained into the third week.' },
    { pct: 100, score: 96, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Hydration and posture reset seamlessly executed.' },
    { pct: 75,  score: 83, completed: '3 of 4', habits: [100, 100, 0, 100],   note: 'Evening wind-down anchored deep recovery.' },
    { pct: 100, score: 97, completed: '4 of 4', habits: [100, 100, 100, 100], note: '21-day formation milestone unlocked today.' },
    { pct: 100, score: 95, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Strong foundation firmly established.' },
    { pct: 100, score: 98, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Peaceful consistency and steady energy.' },
    { pct: 75,  score: 86, completed: '3 of 4', habits: [100, 75, 100, 75],   note: 'Gentle recovery pacing held effortlessly.' },
    { pct: 100, score: 93, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Daily adherence steady at 94% average.' },
    { pct: 100, score: 95, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Clarity and calm maintained throughout the day.' },
    { pct: 100, score: 94, completed: '4 of 4', habits: [100, 100, 100, 100], note: 'Today: 4 of 4 rituals logged in harmonious rhythm.' }, // Day 24 (index 23 - Today)
    { pct: 0,   score: 0,  completed: 'Upcoming', habits: [0, 0, 0, 0],        note: 'Upcoming practice day.' },
    { pct: 0,   score: 0,  completed: 'Upcoming', habits: [0, 0, 0, 0],        note: 'Upcoming practice day.' },
    { pct: 0,   score: 0,  completed: 'Upcoming', habits: [0, 0, 0, 0],        note: 'Upcoming practice day.' },
    { pct: 0,   score: 0,  completed: 'Upcoming', habits: [0, 0, 0, 0],        note: 'Upcoming practice day.' },
    { pct: 0,   score: 0,  completed: 'Upcoming', habits: [0, 0, 0, 0],        note: 'Upcoming practice day.' },
    { pct: 0,   score: 0,  completed: 'Upcoming', habits: [0, 0, 0, 0],        note: 'Upcoming practice day.' },
  ];

  for (let i = 0; i < patterns.length; i++) {
    const pat = patterns[i];
    const dateStr = `Oct ${i + 1}`;
    const dots = pat.pct === 100 ? baseDots100 :
                 pat.pct === 75  ? baseDots75  :
                 pat.pct === 50  ? baseDots50  :
                 pat.pct === 30  ? baseDots30  : baseDots0;

    const { lineD, areaD } = createGraphPaths(dots);
    days.push({
      date: dateStr,
      pct: pat.pct,
      score: pat.score,
      completed: pat.completed,
      habits: pat.habits,
      note: pat.note,
      dots: dots,
      lineD: lineD,
      areaD: areaD
    });
  }
  return days;
})();

export function selectCalendarDate(btn, dayIndex) {
  if (dayIndex < 0 || dayIndex >= CALENDAR_DAYS_DATA.length) return;
  selectedCalendarIndex = dayIndex;
  const dayData = CALENDAR_DAYS_DATA[dayIndex];

  // Highlight selected date button
  const allDateBtns = document.querySelectorAll('.date-circle-btn');
  allDateBtns.forEach(b => {
    b.classList.remove('active-selected-date');
  });
  if (btn) btn.classList.add('active-selected-date');

  // ── Update Dynamic Graph SVG Paths smoothly ──
  const lineEl = document.getElementById('insights-graph-line');
  const areaEl = document.getElementById('insights-graph-area');
  if (lineEl && dayData.lineD) lineEl.setAttribute('d', dayData.lineD);
  if (areaEl && dayData.areaD) areaEl.setAttribute('d', dayData.areaD);

  // ── Move the 4 graph node circles to match the curve ──
  const nodePositions = [
    { nodeId: 'graph-node-1', x: 100,  dotIdx: 1 },
    { nodeId: 'graph-node-2', x: 280,  dotIdx: 2 },
    { nodeId: 'graph-node-3', x: 460,  dotIdx: 4 },
    { nodeId: 'graph-node-4', x: 630,  dotIdx: 6 }
  ];
  if (dayData.dots) {
    nodePositions.forEach(({ nodeId, x, dotIdx }) => {
      const nodeEl = document.getElementById(nodeId);
      if (nodeEl) {
        const y = dayData.dots[dotIdx] !== undefined ? dayData.dots[dotIdx] : 80;
        nodeEl.setAttribute('transform', `translate(${x}, ${y})`);
        nodeEl.style.transition = 'transform 0.85s cubic-bezier(0.16, 1, 0.3, 1)';
      }
    });
  }

  // ── Update Adherence Score (big number) ──
  const scoreEl = document.getElementById('insights-score-number');
  const currentScore = scoreEl ? parseInt(scoreEl.textContent, 10) || 0 : 0;
  if (scoreEl) animateNumberValue(scoreEl, currentScore, dayData.score, 700);

  // ── Update graph inspection pill ──
  const inspectionText = document.getElementById('graph-inspection-text');
  if (inspectionText) {
    const isTodayDay = dayIndex === 23;
    inspectionText.textContent = `${dayData.date}${isTodayDay ? ' (Today)' : ''} · ${dayData.pct}% Adherence (${dayData.completed})`;
  }

  // ── Update Selected Day Completion Tag ──
  const completionTag = document.getElementById('selected-day-completion-tag');
  if (completionTag) {
    if (dayData.pct === 100) completionTag.textContent = '4 of 4 Completed (100%)';
    else if (dayData.pct === 75) completionTag.textContent = '3 of 4 Completed (75%)';
    else if (dayData.pct === 50) completionTag.textContent = '2 of 4 Completed (50%)';
    else if (dayData.pct === 30) completionTag.textContent = '1 of 4 Completed (30%)';
    else if (dayData.pct === 0) completionTag.textContent = dayData.completed === 'Upcoming' ? 'Upcoming Day' : '0 of 4 Completed (0%)';
    else completionTag.textContent = `${dayData.completed}`;
  }

  // ── Update habit breakdown bars and percentage labels ──
  const statusLabels = [
    ['Logged 7:15 AM', 'Logged 8:00 AM', 'Logged 10:30 AM', 'Logged 9:15 PM'],
    ['Skipped', 'Skipped', 'Skipped', 'Skipped']
  ];
  if (dayData.habits) {
    dayData.habits.forEach((habitPct, idx) => {
      const bar = document.getElementById(`habit-bar-${idx + 1}`);
      const pctLabel = document.getElementById(`habit-pct-${idx + 1}`);
      const statusLabel = document.getElementById(`habit-status-${idx + 1}`);
      if (bar) bar.style.width = `${habitPct}%`;
      if (pctLabel) pctLabel.textContent = `${habitPct}%`;
      if (statusLabel) {
        if (habitPct === 100) {
          statusLabel.textContent = statusLabels[0][idx];
          statusLabel.className = 'text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold';
        } else if (habitPct > 0) {
          statusLabel.textContent = 'Partial';
          statusLabel.className = 'text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-semibold';
        } else if (dayData.pct === 0 && dayData.completed === 'Upcoming') {
          statusLabel.textContent = 'Scheduled';
          statusLabel.className = 'text-[10px] px-2 py-0.5 rounded-full bg-surface-container text-outline font-semibold';
        } else {
          statusLabel.textContent = 'Skipped';
          statusLabel.className = 'text-[10px] px-2 py-0.5 rounded-full bg-red-50 text-red-600 font-semibold';
        }
      }
    });
  }

  // ── Update insights habits summary text ──
  const summaryEl = document.getElementById('insights-habits-summary');
  if (summaryEl) {
    summaryEl.textContent = dayData.note;
  }

  // ── Drive the Recharts/native habit chart ──
  if (typeof window.updateHabitChart === 'function') {
    window.updateHabitChart(dayData);
  }
}

export function handleHeatmapClick(cell) {
  const feedback = document.getElementById('heatmap-feedback');
  const day = cell.getAttribute('data-day');
  const rituals = cell.getAttribute('data-rituals');
  if (feedback && day && rituals) {
    feedback.textContent = `Day ${day} ”” ${rituals} rituals completed (100% adherence)`;
    feedback.classList.remove('opacity-0');
    clearTimeout(window._heatmapTimeout);
    window._heatmapTimeout = setTimeout(() => {
      feedback.classList.add('opacity-0');
    }, 2400);
  }
}

export function animateCounters(customDuration = 2200) {
  const counters = document.querySelectorAll('.counter-number');
  counters.forEach(counter => {
    const rawTarget = counter.getAttribute('data-target') || counter.textContent.replace(/[^0-9]/g, '');
    const target = parseInt(rawTarget, 10);
    if (isNaN(target)) return;

    const duration = customDuration;
    const startTime = performance.now();
    const startVal = 0;

    function updateCounter(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(startVal + (target - startVal) * ease);
      counter.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(updateCounter);
      } else {
        counter.textContent = target.toLocaleString();
      }
    }
    requestAnimationFrame(updateCounter);
  });
}

export function animateNumberValue(element, startVal, endVal, duration = 800, suffix = '') {
  if (!element) return;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(startVal + (endVal - startVal) * ease);
    element.textContent = current + suffix;
    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = endVal + suffix;
    }
  }
  requestAnimationFrame(update);
}

export function toggleSafeguardSwitch(btn) {
  const isChecked = btn.getAttribute('aria-checked') === 'true';
  const label = btn.closest('.flex').querySelector('.safeguard-desc');

  if (isChecked) {
    btn.setAttribute('aria-checked', 'false');
    if (label) label.innerHTML = label.innerHTML.replace('Active ·', 'Paused ·');
  } else {
    btn.setAttribute('aria-checked', 'true');
    if (label) label.innerHTML = label.innerHTML.replace('Paused ·', 'Active ·');
  }
}

// Bind to window for HTML inline handlers
window.selectCalendarDate = selectCalendarDate;
window.handleHeatmapClick = handleHeatmapClick;
window.animateCounters = animateCounters;
window.animateNumberValue = animateNumberValue;
window.toggleSafeguardSwitch = toggleSafeguardSwitch;
window.CALENDAR_DAYS_DATA = CALENDAR_DAYS_DATA;
