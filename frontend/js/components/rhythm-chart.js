/**
 * Premium Native SVG Habit Rhythm Chart & Interactions
 * Renders smooth cubic bezier splines, area gradients, interactive hover tooltips, and curve toggles.
 */

export const HABITS_CONFIG = [
  { key: 'water',     color: '#0891b2', label: 'Morning Water'     },
  { key: 'breathing', color: '#0d9488', label: 'Box Breathing'     },
  { key: 'focus',     color: '#4f46e5', label: 'Deep Focus'        },
  { key: 'winddown',  color: '#d97706', label: 'Evening Wind-Down' }
];

export const TIME_LABELS = ['5AM','6AM','7AM','8AM','9AM','10AM','11AM','12PM','1PM','2PM','3PM','4PM','5PM','6PM','7PM','8PM','9PM','10PM'];
const PAD = { top: 24, right: 20, bottom: 24, left: 42 };

let activeFocusHabit = null;
let lastHabitChartPct = 100;

export function buildData(pct) {
  const b = pct / 100;
  const rows = [
    [0,    0,    0,    0   ],
    [15,   5,    2,    0   ],
    [85,   30,   5,    0   ],
    [100,  90,   20,   0   ],
    [95,   100,  60,   0   ],
    [60,   80,   100,  0   ],
    [40,   50,   95,   0   ],
    [30,   35,   60,   0   ],
    [20,   20,   50,   0   ],
    [25,   28,   75,   0   ],
    [22,   30,   55,   0   ],
    [18,   22,   30,   0   ],
    [15,   15,   15,   10  ],
    [10,   12,   10,   45  ],
    [8,    10,   5,    80  ],
    [5,    8,    0,    100 ],
    [0,    6,    0,    90  ],
    [0,    0,    0,    40  ],
  ];
  return rows.map(r => r.map(v => Math.min(100, Math.round(v * b))));
}

export function smoothPath(pts, W, H, chartH) {
  if (!pts.length) return '';
  const n = pts.length;
  const xs = pts.map((_, i) => PAD.left + (W / (n - 1)) * i);
  const ys = pts.map(v => PAD.top + chartH - (v / 100) * chartH);

  if (n === 1) return `M ${xs[0]},${ys[0]}`;
  let d = `M ${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const p0 = i > 0 ? { x: xs[i-1], y: ys[i-1] } : { x: xs[i], y: ys[i] };
    const p1 = { x: xs[i],   y: ys[i]   };
    const p2 = { x: xs[i+1], y: ys[i+1] };
    const p3 = i < n - 2 ? { x: xs[i+2], y: ys[i+2] } : { x: xs[i+1], y: ys[i+1] };
    const tension = 0.3;
    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;
    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }
  return d;
}

export function areaPath(pts, W, H, chartH) {
  const line = smoothPath(pts, W, H, chartH);
  if (!line) return '';
  const n = pts.length;
  const lastX = PAD.left + W;
  const baseY = PAD.top + chartH;
  return line + ` L ${lastX},${baseY} L ${PAD.left},${baseY} Z`;
}

export function animatePath(el, targetD) {
  if (!el) return;
  el.setAttribute('d', targetD);
}

export function renderChart(pct) {
  pct = (pct !== undefined && pct !== null) ? pct : lastHabitChartPct;
  lastHabitChartPct = pct;
  if (typeof window !== 'undefined') window._lastHabitChartPct = pct;

  const svg    = document.getElementById('habit-chart-svg');
  const shell  = document.getElementById('habit-chart-shell');
  if (!svg || !shell) return;

  const totalW = shell.getBoundingClientRect().width || 750;
  const totalH = 258;
  const chartW = Math.max(100, totalW - PAD.left - PAD.right);
  const chartH = Math.max(80, totalH - PAD.top - PAD.bottom);

  svg.setAttribute('viewBox', `0 0 ${totalW} ${totalH}`);
  svg.setAttribute('height', totalH);

  // Mouse area
  const mouseRect = document.getElementById('hc-mouse-area');
  if (mouseRect) {
    mouseRect.setAttribute('x', PAD.left);
    mouseRect.setAttribute('y', PAD.top);
    mouseRect.setAttribute('width', chartW);
    mouseRect.setAttribute('height', chartH);
  }

  // Grid lines
  const grid = document.getElementById('hc-grid');
  const yAxis = document.getElementById('hc-yaxis');
  const xAxis = document.getElementById('hc-xaxis');
  if (grid) grid.innerHTML  = '';
  if (yAxis) yAxis.innerHTML = '';
  if (xAxis) xAxis.innerHTML = '';

  const yTicks = [0, 25, 50, 75, 100];
  yTicks.forEach(pv => {
    const y = PAD.top + chartH - (pv / 100) * chartH;
    if (grid) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', PAD.left); line.setAttribute('x2', PAD.left + chartW);
      line.setAttribute('y1', y);        line.setAttribute('y2', y);
      line.setAttribute('stroke', '#e2e8f0');
      line.setAttribute('stroke-width', pv === 0 ? '1' : '0.75');
      if (pv > 0) line.setAttribute('stroke-dasharray', '4 8');
      grid.appendChild(line);
    }

    if (yAxis) {
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', PAD.left - 8); txt.setAttribute('y', y + 3.5);
      txt.setAttribute('text-anchor', 'end');
      txt.setAttribute('font-size', '9.5'); txt.setAttribute('fill', '#94a3b8');
      txt.setAttribute('font-family', "'Plus Jakarta Sans',sans-serif");
      txt.setAttribute('font-weight', '500');
      txt.textContent = pv + '%';
      yAxis.appendChild(txt);
    }
  });

  // X-axis labels
  const n = TIME_LABELS.length;
  if (xAxis) {
    TIME_LABELS.forEach((lbl, i) => {
      if (i % 3 !== 0 && i !== n - 1) return;
      const x = PAD.left + (chartW / (n - 1)) * i;
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', x); txt.setAttribute('y', PAD.top + chartH + 16);
      txt.setAttribute('text-anchor', 'middle');
      txt.setAttribute('font-size', '9.5'); txt.setAttribute('fill', '#94a3b8');
      txt.setAttribute('font-family', "'Plus Jakarta Sans',sans-serif");
      txt.setAttribute('font-weight', '500');
      txt.textContent = lbl;
      xAxis.appendChild(txt);
    });
  }

  // Build data & render lines
  const data = buildData(pct);
  HABITS_CONFIG.forEach((h, hi) => {
    const pts = data.map(r => r[hi]);
    const linePath = smoothPath(pts, chartW, totalH, chartH);
    const fillPath = areaPath(pts, chartW, totalH, chartH);
    animatePath(document.getElementById(`hc-line-${h.key}`), linePath);
    animatePath(document.getElementById(`hc-area-${h.key}`), fillPath);
  });

  // Update cursor height
  const cursor = document.getElementById('hc-cursor');
  if (cursor) {
    cursor.setAttribute('y1', PAD.top);
    cursor.setAttribute('y2', PAD.top + chartH);
  }

  svg._chartState = { chartW, chartH, n, data, totalW };
}

export function toggleHabitCurve(key) {
  if (activeFocusHabit === key) {
    activeFocusHabit = null;
  } else {
    activeFocusHabit = key;
  }

  HABITS_CONFIG.forEach(h => {
    const line = document.getElementById(`hc-line-${h.key}`);
    const area = document.getElementById(`hc-area-${h.key}`);
    const btn  = document.getElementById(`legend-btn-${h.key}`);

    if (!activeFocusHabit) {
      if (line) { line.style.opacity = '1'; line.setAttribute('stroke-width', '2.5'); }
      if (area) { area.style.opacity = '1'; }
      if (btn)  { btn.classList.remove('opacity-40'); btn.classList.add('opacity-100'); }
    } else if (activeFocusHabit === h.key) {
      if (line) { line.style.opacity = '1'; line.setAttribute('stroke-width', '3.5'); }
      if (area) { area.style.opacity = '1'; }
      if (btn)  { btn.classList.remove('opacity-40'); btn.classList.add('opacity-100', 'ring-2', 'ring-primary/40'); }
    } else {
      if (line) { line.style.opacity = '0.15'; line.setAttribute('stroke-width', '1.5'); }
      if (area) { area.style.opacity = '0.05'; }
      if (btn)  { btn.classList.remove('ring-2', 'ring-primary/40', 'opacity-100'); btn.classList.add('opacity-40'); }
    }
  });
}

export function bindHover() {
  const svg       = document.getElementById('habit-chart-svg');
  const tooltip   = document.getElementById('habit-chart-tooltip');
  const cursor    = document.getElementById('hc-cursor');
  const shell     = document.getElementById('habit-chart-shell');
  const dots      = HABITS_CONFIG.map(h => document.getElementById(`hc-dot-${h.key}`));

  function showTooltip(e) {
    const state = svg ? svg._chartState : null;
    if (!state || !tooltip || !cursor || !shell) return;
    const { chartW, chartH, n, data } = state;
    const rect = svg.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
    const clientY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);
    const mx = clientX - rect.left - PAD.left;
    const step = chartW / (n - 1);
    const idx = Math.max(0, Math.min(n - 1, Math.round(mx / step)));
    const x = PAD.left + step * idx;
    const rowVals = data[idx];

    // Cursor
    cursor.setAttribute('x1', x); cursor.setAttribute('x2', x);
    cursor.setAttribute('opacity', '1');

    // Dots
    dots.forEach((dot, hi) => {
      if (!dot) return;
      const v = rowVals[hi];
      const y = PAD.top + chartH - (v / 100) * chartH;
      dot.setAttribute('cx', x); dot.setAttribute('cy', y);
      dot.setAttribute('opacity', v > 0 && (!activeFocusHabit || activeFocusHabit === HABITS_CONFIG[hi].key) ? '1' : '0');
    });

    // Tooltip content
    const active = HABITS_CONFIG.filter((h, hi) => rowVals[hi] > 0 && (!activeFocusHabit || activeFocusHabit === h.key));
    if (!active.length) {
      tooltip.style.display = 'none';
      return;
    }

    tooltip.innerHTML = `<div class="font-semibold text-on-surface-variant text-[10px] tracking-wider uppercase mb-1.5 pb-1 border-b border-outline-variant/20 flex items-center justify-between">`
      + `<span>${TIME_LABELS[idx]} SNAPSHOT</span>`
      + `<span class="text-primary font-bold">${lastHabitChartPct}% DAY</span>`
      + `</div>`
      + active.map(h => {
        const hi = HABITS_CONFIG.indexOf(h);
        return `<div class="flex items-center justify-between gap-3 py-0.5">`
          + `<div class="flex items-center gap-1.5">`
          + `<div style="width:8px;height:8px;border-radius:50%;background:${h.color};"></div>`
          + `<span class="text-on-surface text-[11px] font-medium">${h.label}</span>`
          + `</div>`
          + `<span class="font-bold text-[11px] tabular-nums" style="color:${h.color}">${rowVals[hi]}%</span>`
          + `</div>`;
      }).join('');
    tooltip.style.display = 'block';

    const shellRect = shell.getBoundingClientRect();
    let tx = clientX - shellRect.left + 14;
    const tw = tooltip.offsetWidth || 190;
    if (tx + tw > shellRect.width - 10) tx = clientX - shellRect.left - tw - 14;
    if (tx < 10) tx = 10;
    let ty = clientY - shellRect.top - 10;
    if (ty < 0) ty = 10;
    tooltip.style.left  = tx + 'px';
    tooltip.style.top   = ty + 'px';
  }

  function hideTooltip() {
    if (tooltip) tooltip.style.display = 'none';
    if (cursor) cursor.setAttribute('opacity', '0');
    dots.forEach(d => { if (d) d.setAttribute('opacity', '0'); });
  }

  const mouseArea = document.getElementById('hc-mouse-area');
  if (mouseArea) {
    mouseArea.addEventListener('mousemove', showTooltip);
    mouseArea.addEventListener('mouseleave', hideTooltip);
    mouseArea.addEventListener('touchmove', e => { showTooltip(e.touches[0]); }, { passive: true });
    mouseArea.addEventListener('touchend', hideTooltip);
  }
}

export function updateHabitChart(dayData) {
  if (!dayData) return;
  renderChart(dayData.pct !== undefined ? dayData.pct : 100);
}

export function initRhythmChart() {
  renderChart(100);
  bindHover();

  const shell = document.getElementById('habit-chart-shell');
  if (shell && window.ResizeObserver) {
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(() => renderChart(lastHabitChartPct));
    });
    ro.observe(shell);
  } else {
    window.addEventListener('resize', () => {
      renderChart(lastHabitChartPct);
    });
  }
}

export const renderHabitChart = renderChart;

// Global window exposure
if (typeof window !== 'undefined') {
  window.renderHabitChart = renderHabitChart;
  window.renderChart = renderChart;
  window.toggleHabitCurve = toggleHabitCurve;
  window.updateHabitChart = updateHabitChart;
  window._lastHabitChartPct = lastHabitChartPct;
}
