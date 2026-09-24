/**
 * motionConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for ALL animation parameters in Momentum's cinematic
 * experience. Edit values here to tune timing, easing, and feel globally.
 *
 * Sections:
 *   EASING       — Cubic-bezier curves (named for intent)
 *   LOADER       — IntroLoader letter reveal + progress line + exit
 *   HERO         — Staggered hero section entrance after loader
 *   RING         — Adherence ring scroll-triggered sequence
 *   RITUAL_LOOP  — The Daily Ritual Loop scroll-driven choreography & connector
 *   BACKGROUND   — BackgroundLayer video, overlays, blobs, parallax
 *   COLORS       — Accent colors referenced in animations (not Tailwind tokens)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── EASING ──────────────────────────────────────────────────────────────────
export const EASE = {
  /** Buttery expo ease-out: used for letter reveals and card entrances */
  expoOut: [0.22, 1, 0.36, 1],
  /** Quint ease-out: slightly snappier, used for buttons and badges */
  quintOut: [0.16, 1, 0.3, 1],
  /** Standard ease-out: used for subtle fades */
  easeOut: [0.0, 0.0, 0.2, 1],
  /** Gentle ease-in-out: used for idle animations and parallax */
  gentle: [0.4, 0, 0.6, 1],
  /** Spring-like for ring movement — smooth overshoot */
  spring: [0.34, 1.26, 0.64, 1],
};

// ── LOADER ───────────────────────────────────────────────────────────────────
export const LOADER = {
  /** Duration for each letter's individual reveal (s) — slower = more cinematic */
  letterDuration: 0.95,
  /** Stagger delay between consecutive letters (s) */
  letterStagger: 0.14,
  /** Y offset letters travel from (px) */
  letterY: 24,
  /** Blur amount letters start at */
  letterBlur: '10px',
  /** Hold duration after last letter before exit begins (s) */
  holdAfterReveal: 0.7,
  /** Duration of the progress line fill (s) */
  progressLineDuration: 1.9,
  /** Delay before progress line starts (s) */
  progressLineDelay: 0.3,
  /** Duration of the loader lift/exit animation (s) */
  exitDuration: 0.7,
  /** Easing for loader exit */
  exitEase: [0.22, 1, 0.36, 1],
};

// ── HERO REVEAL ──────────────────────────────────────────────────────────────
export const HERO = {
  /** Delay before hero entrance starts after loader exit (s) */
  startDelay: 0.1,
  /** Navbar slide-in duration (s) */
  navbarDuration: 0.8,
  /** Pill label fade-in duration (s) */
  pillDuration: 0.85,
  pillDelay: 0.2,
  /** Per-letter reveal in headline: duration (s) — buttery slow */
  headlineLetterDuration: 0.95,
  /** Per-letter reveal stagger (s) — leisurely, like words being typed in honey */
  headlineStagger: 0.05,
  /** Delay before headline starts (s) */
  headlineDelay: 0.35,
  /** "Living Works of Art." glow sweep duration (s) */
  glowSweepDuration: 1.4,
  glowSweepDelay: 0.3,
  /** Subtext line stagger (s) */
  subtextStagger: 0.22,
  subtextDelay: 0.1,
  /** Button entrance duration (s) */
  buttonDuration: 0.7,
  buttonDelay: 0.2,
  /** Badge stagger (s) */
  badgeStagger: 0.15,
  badgeDelay: 0.25,
};

// ── RING SEQUENCE ─────────────────────────────────────────────────────────────
export const RING = {
  /** IntersectionObserver threshold (0–1) */
  viewportAmount: 0.3,
  /** Duration for each background track ring to fade in (s) */
  trackFadeDuration: 0.5,
  trackStagger: 0.18,
  /** Duration for the teal arc sweep (s) */
  arcSweepDuration: 2.0,
  arcSweepDelay: 0.7,
  /** Counter count-up duration (ms) — synced with arc */
  countUpDuration: 2000,
  countUpDelay: 700,
  /** How long AFTER arc completes before ring starts moving left (s) */
  ringSettleDelay: 0.55,
  /** Duration of the ring sliding from center to left column (s) */
  ringMoveDuration: 1.0,
  /** Delay before card content starts appearing after ring settles (s) */
  contentStartDelay: 0.3,
  /** Stagger between content items (s) */
  contentStagger: 0.13,
  /** Duration of each content item entrance (s) */
  contentItemDuration: 0.65,
  /** Stat pill number count-up duration (ms) */
  statCountDuration: 1200,
  /** Idle breathing pulse: scale range and duration (s) */
  breatheScale: [1, 1.018, 1],
  breatheDuration: 4,
  /** Outer ring slow rotation: one full rotation period (s) */
  rotationPeriod: 28,
  /** Scroll parallax range on card (px) */
  parallaxRange: 12,
};

// ── THE DAILY RITUAL LOOP (VERTICAL TIMELINE) ───────────────────────────────
export const RITUAL_LOOP = {
  /** Enable optional Lenis smooth scrolling (auto-disabled on touch / reduced motion) */
  useLenis: true,
  /** Lenis inertia smoothing factor */
  lenisLerp: 0.08,

  /** Scroll offset trigger for container expansion and timeline progression */
  containerExpandOffset: ['start 85%', 'end 30%'],
  /** Desktop starting horizontal inset percentage */
  desktopInsetX: 8, // 8%
  /** Desktop starting corner radius (px) */
  desktopStartRadius: 56,
  /** Mobile starting horizontal inset percentage */
  mobileInsetX: 4, // 4%
  /** Mobile starting corner radius (px) */
  mobileStartRadius: 44,
  /** Final settled corner radius (px) */
  finalRadius: 32,

  /** Word-by-word reveal stagger for title (s) */
  headerWordStagger: 0.08,

  /** Timeline scroll-progress thresholds for cards [01, 02, 03, 04] synced with dot travel */
  timelineThresholds: [0.10, 0.34, 0.58, 0.82],

  /** Card entrance slide distance (px) */
  cardSlideDistanceDesktop: 80,
  cardSlideDistanceMobile: 40,
  /** Slow, buttery card entrance duration (s) */
  cardEntranceDuration: 1.1,
  /** Card inner reveal stagger (s): number -> title -> desc */
  cardInnerStagger: 0.15,

  /** Card lift on active state (px) */
  cardLiftActive: -6,
  /** Card lift on cursor hover / focus (px) */
  cardLiftHover: -8,
  /** Maximum 3D cursor tilt angle (degrees, fine pointer only) */
  maxTiltDeg: 3,

  /** Traveling glowing forest green dot */
  dotColor: '#0F6E56',
  dotGlow: 'rgba(15, 110, 86, 0.45)',
  dotSize: 12, // px

  /** Subtle time-of-day tints for 01 (peach dawn), 02 (sage/teal), 03 (soft gold), 04 (dusk green) */
  timeOfDayTints: [
    {
      id: '01',
      name: 'Dawn',
      bg: 'rgba(254, 243, 199, 0.35)',
      border: 'rgba(217, 119, 6, 0.28)',
      glow: '0 12px 32px -4px rgba(245, 158, 11, 0.12)',
      numColor: '#0F6E56',
      accentColor: '#D97706',
      badgeBg: 'rgba(217, 119, 6, 0.12)',
      badgeText: '#92400E',
    },
    {
      id: '02',
      name: 'Focus',
      bg: 'rgba(230, 244, 241, 0.45)',
      border: 'rgba(8, 145, 178, 0.28)',
      glow: '0 12px 32px -4px rgba(8, 145, 178, 0.12)',
      numColor: '#0F6E56',
      accentColor: '#0891B2',
      badgeBg: 'rgba(8, 145, 178, 0.12)',
      badgeText: '#0E7490',
    },
    {
      id: '03',
      name: 'Strength',
      bg: 'rgba(254, 249, 235, 0.50)',
      border: 'rgba(202, 138, 4, 0.28)',
      glow: '0 12px 32px -4px rgba(202, 138, 4, 0.12)',
      numColor: '#0F6E56',
      accentColor: '#CA8A04',
      badgeBg: 'rgba(202, 138, 4, 0.12)',
      badgeText: '#854D0E',
    },
    {
      id: '04',
      name: 'Dusk',
      bg: 'rgba(232, 245, 241, 0.50)',
      border: 'rgba(15, 110, 86, 0.32)',
      glow: '0 12px 32px -4px rgba(15, 110, 86, 0.15)',
      numColor: '#0F6E56',
      accentColor: '#0F6E56',
      badgeBg: 'rgba(15, 110, 86, 0.12)',
      badgeText: '#064E3B',
    },
  ],
};

// ── BACKGROUND LAYER ──────────────────────────────────────────────────────────
export const BG = {
  /** Paths to botanical video / poster. Set to null to use CSS fallback only. */
  videoWebm: '/assets/bg/bg-loop.webm',
  videoMp4: '/assets/bg/bg-loop.mp4',
  videoPoster: '/assets/bg/bg-poster.jpg',

  /** Cream overlay on top of video (0–1). Higher = more cream, less video. */
  videoOverlayOpacity: 0.88,
  /** Blur applied to video element (px). Keeps it atmospheric. */
  videoBlur: '3px',

  /** Gradient mesh animation duration (s, very slow) */
  meshDuration: 22,

  /** Blob animation durations (s each) */
  blobDurations: [28, 36, 32],
  /** Film grain opacity (0–1). Keep subtle. */
  grainOpacity: 0.04,
  /** Number of floating particles (desktop only) */
  particleCount: 18,
  /** Cursor parallax sensitivity (higher = more movement) */
  cursorParallaxStrength: 18,
};

// ── ARCHITECTURE OF MINDFULNESS (SIX PILLARS) ───────────────────────────────
export const ARCHITECTURE = {
  /** Transition style between cream and green sections: 'curve' | 'fade' */
  transitionStyle: 'curve',

  /** Scroll-linked curve parameters */
  curveHeightDesktop: 120, // px height at full rise
  curveHeightMobile: 50,   // px height on mobile screens
  topCurveOffset: ['start end', 'start 0.3'],
  bottomCurveOffset: ['end 0.7', 'end start'],
  curveSettledThreshold: 0.6, // content reveals when curve is 60% settled

  /** Deep forest to emerald gradient steps */
  gradientShift: ['#0A4839', '#0F6E56', '#08382C'],
  
  /** Aurora ambient light blob parallax distances (px) */
  auroraBlobParallax: [25, 50, 40],
  /** Ambient film grain opacity */
  grainOpacity: 0.035,
  /** Upward drifting firefly particles */
  fireflyCountDesktop: 24,
  fireflyCountMobile: 10,
  
  /** Dynamic spotlight tints per pillar index (01 to 06) */
  spotlightTints: [
    'rgba(52, 211, 153, 0.22)', // 01 Mint (Dial)
    'rgba(8, 145, 178, 0.25)',  // 02 Teal/Cyan (Aria Voice)
    'rgba(217, 119, 6, 0.25)',  // 03 Warm Amber (Movement)
    'rgba(16, 185, 129, 0.22)', // 04 Calm Sage (Rest Philosophy)
    'rgba(34, 211, 238, 0.24)', // 05 Aqua (Soundscape)
    'rgba(245, 158, 11, 0.25)', // 06 Gold (3D Medals)
  ],

  /** Header entrance parameters */
  headerRevealDelay: 0.1,
  headerWordStagger: 0.09,
  headerSubtextStagger: 0.18,

  /** Pillar divider animation timing */
  dividerDrawDuration: 0.75, // s (center outward)
  dividerDotDelay: 0.55,     // s (dot pulse)
  dividerLabelDelay: 0.75,   // s (label fade in)
  dividerEase: [0.22, 1, 0.36, 1],

  /** Pillar viewport reveal triggers */
  pillarViewportAmount: 0.35,
  pillarViewportAmountMobile: 0.30,
  pillarEntranceDuration: 0.85,
  pillarCardSlideX: 60,
  pillarTextDelay: 0.25,
  pillarParallaxDesktop: 18,

  /** Eased metrics count-up duration (s) */
  countUpDuration: 1.8,

  /** Interactive card hover / focus transformations */
  cardHoverLift: -6,
  cardHoverTiltMax: 3, // degrees (fine pointer only)

  /** Pillar 06 3D Specular Medal interactive tilt & flip */
  medalTiltMax: 6, // degrees
  medalFlipDuration: 0.9,
};

// ── COLORS (animation-only, not Tailwind tokens) ──────────────────────────────
export const ANIM_COLORS = {
  /** Loader background — forest green (brand color) */
  loaderBg: '#0F6E56',
  /** Botanical letter colors — cream, sage, peach cycling per letter */
  loaderLetterColors: [
    '#FAF7F0', // M — warm cream
    '#C8DFCF', // O — sage green
    '#F0CEB8', // M — peach
    '#FAF7F0', // E — warm cream
    '#C8DFCF', // N — sage green
    '#F0CEB8', // T — peach
    '#FAF7F0', // U — warm cream
    '#C8DFCF', // M — sage green
  ],
  /** Progress line color on dark bg */
  progressLine: 'rgba(250, 247, 240, 0.6)',
  /** Tagline text color on dark bg */
  loaderTagline: 'rgba(250, 247, 240, 0.45)',
  /** Glow overlay behind botanical blobs in loader */
  loaderSageBlob: 'rgba(200, 223, 207, 0.12)',
  loaderPeachBlob: 'rgba(240, 206, 184, 0.10)',

  glowGreen: 'rgba(15, 110, 86, 0.25)',
  tealArc: '#0891B2',
  tealGlow: 'rgba(8, 145, 178, 0.35)',
  blobSage: 'rgba(180, 210, 195, 0.22)',
  blobPeach: 'rgba(240, 200, 170, 0.18)',
  blobCream: 'rgba(250, 245, 235, 0.3)',
  meshSage: '#D4E8DF',
  meshPeach: '#F5E6D8',
  meshCream: '#FAF7F0',
  meshTeal: 'rgba(8, 145, 178, 0.08)',
};
