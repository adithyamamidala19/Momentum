# Product Requirements Document (PRD)

## Project: Momentum — Mindful Rituals & Daily Rhythm Sanctuary
**Document Version:** 2.1.0  
**Focus Domain:** UI/UX Architecture, Restorative Design Systems & Interactive Experience  
**Lead Architect:** Adithya Mamidala  
**Target Platform:** Modern Web & Progressive Web App (Desktop, Tablet, Mobile PWA)  
**Repository Location:** `c:\Users\Adithya Mamidala\Documents\Demo`  
**Live Endpoint:** `http://localhost:8000`

---

## 1. Executive Summary & UI/UX Vision

### 1.1 The Psychological Problem
Traditional productivity software and habit trackers are engineered with high-friction, anxiety-inducing mechanisms:
- **Punitive Streak Resets:** Missing a single day wipes clean weeks of progress, triggering guilt and immediate app abandonment (*"streak-break churn"*).
- **Gamification Fatigue:** Arbitrary XP numbers, diamond sovereign tiers, flashing celebratory confetti, and aggressive push notifications overload cognitive bandwidth.
- **Visual Cacophony:** High-saturation neons, dense data tables, and cluttered dashboards provoke stress rather than mindful practice.

### 1.2 The Momentum UI/UX Mission
**Momentum** is designed as an **unhurried digital sanctuary**. It replaces competitive gamification with **anti-burnout, restorative principles**:
1. **Warm Botanical Aesthetics:** Soft canvas sand (`#F9F9F8`), deep pine greens (`#0F6E56`), warm sunlight amber (`#D97706`), and slate-lavender accents create a calm, non-glare environment.
2. **Editorial Typography:** High-contrast pairing of contemplative serif (*Newsreader*) with modern, crisp geometric sans-serif (*Plus Jakarta Sans*).
3. **Tactile Physical Materials:** Achievement milestones feature realistic 3D specular medals (Bronze, Silver, Gold, Platinum) with dynamic light sheen shaders reacting to mouse movement.
4. **Soundscape Integration:** Synthesized singing bowl bells (396Hz, 432Hz, 528Hz) and harmonic drone pads (F Maj9) via the Web Audio API provide soothing, multi-sensory feedback.
5. **Guilt-Free Grace:** The *"Skip for Today"* mechanism allows restorative rest days without penalty, protecting consistency and mental peace.

---

## 2. Target Personas & UX Needs Matrix

| Persona | Core Archetype | Primary UX Friction | Momentum Restorative UX Solution |
| :--- | :--- | :--- | :--- |
| **Mindful Professional** | Knowledge worker navigating high cognitive load and daily burnout. | Overwhelming notifications, cluttered task lists, stressful countdown timers. | Distraction-free focus sanctuary, ambient soundscapes, calm reminder escalation ladder, and quiet hours. |
| **Holistic Habit Builder** | Health-conscious individual cultivating hydration, mindfulness, and reading habits. | Shame upon breaking daily streaks; rigid all-or-nothing completion requirements. | Non-punitive adherence scoring, concentric progress dial, "Skip for Today" rest days, and habit stacking anchors. |
| **Fitness & Movement Practitioner** | Athlete or gym-goer seeking fast workout logging without bloated coaching apps. | Slow data entry, clunky form guides, forgotten previous weights, lack of live PR celebration. | Per-set logging, live auto-detected PR badges, 1-tap set replication, non-blocking floating rest timer, and cardio/calorie tracking. |

---

## 3. UI/UX Design System & Token Specifications

### 3.1 Color Theory & Semantic Tokens

Momentum uses a curated HSL-tailored palette inspired by natural botanical elements, stones, and morning sunlight.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MOMENTUM BOTANICAL SYSTEM                       │
├────────────────────────────────┬───────────────────────────────────────┤
│ Token Name                     │ Hex / Value     │ Semantic Usage      │
├────────────────────────────────┼─────────────────┼─────────────────────┤
│ --color-primary-forest         │ #0F6E56         │ Active habits, CTA  │
│ --color-primary-forest-hover   │ #0B5542         │ Button hover states │
│ --color-primary-forest-subtle  │ #E8F5F1         │ Card pill badges    │
│ --color-amber-warmth           │ #D97706         │ Focus timers, solar │
│ --color-vitality-cyan          │ #0891B2         │ Hydration, recovery │
│ --color-rest-violet            │ #8B5CF6         │ Sleep, reflection   │
│ --color-canvas-sand            │ #F9F9F8         │ Application backdrop│
│ --color-surface-white          │ #FFFFFF         │ Elevated cards      │
│ --color-surface-container-low  │ #F3F3F1         │ Secondary panels    │
│ --color-surface-container-high │ #E8E8E4         │ Subdued chips       │
│ --color-hairline-border        │ #E6E6E3         │ 0.5px subtle frames │
│ --color-text-primary           │ #1C1C1A         │ Crisp headers, body │
│ --color-text-variant           │ #71716D         │ Metadata, timestamps│
│ --color-text-muted             │ #A0A09B         │ Minor captions      │
└────────────────────────────────┴─────────────────┴─────────────────────┘
```

### 3.2 Typography Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          TYPOGRAPHY TOKENS                             │
├──────────────────┬──────────────────────┬─────────┬────────────────────┤
│ Level            │ Typeface             │ Size/Wt │ Line Height/Style  │
├──────────────────┼──────────────────────┼─────────┼────────────────────┤
│ Editorial Hero   │ Newsreader (Serif)   │ 32px /  │ 1.25 / Italicized  │
│ Title            │                      │ 500     │ contemplative tone │
├──────────────────┼──────────────────────┼─────────┼────────────────────┤
│ Page Heading     │ Plus Jakarta Sans    │ 24px /  │ 1.3 / Bold, crisp  │
│                  │                      │ 700     │ navigation title   │
├──────────────────┼──────────────────────┼─────────┼────────────────────┤
│ Section Heading  │ Plus Jakarta Sans    │ 18px /  │ 1.35 / Semi-bold   │
│                  │                      │ 600     │ module title       │
├──────────────────┼──────────────────────┼─────────┼────────────────────┤
│ Metric Display   │ Plus Jakarta Sans    │ 36-48px │ 1.0 / Heavy digits │
│                  │                      │ / 800   │ with tabular figs  │
├──────────────────┼──────────────────────┼─────────┼────────────────────┤
│ Body Standard    │ Plus Jakarta Sans    │ 14px /  │ 1.5 / Clean,       │
│                  │                      │ 400     │ legible interface  │
├──────────────────┼──────────────────────┼─────────┼────────────────────┤
│ Micro Metadata   │ Plus Jakarta Sans    │ 11-12px │ 1.4 / Uppercase    │
│ & Badges         │                      │ / 600   │ letterspaced chips │
└──────────────────┴──────────────────────┴─────────┴────────────────────┘
```

### 3.3 Spatial System, Elevation & Hairline Framing
- **Hairline Framing:** All cards, drawers, dialogs, and popovers feature a `0.5px` solid border (`#E6E6E3` / `rgba(0,0,0,0.06)`). This eliminates heavy drop shadows while maintaining crisp spatial separation on high-DPI displays.
- **Corner Radii:**
  - Standard Cards: `rounded-2xl` ($16\text{px}$)
  - Modals & Sheets: `rounded-3xl` ($24\text{px}$)
  - Buttons & Interactive Pills: `rounded-full` ($9999\text{px}$)
- **Glassmorphic Overlays:** Dialog backdrops use `bg-black/50 backdrop-blur-md` for atmospheric depth that softens background noise.

---

## 4. Screen-by-Screen UI/UX Specifications

### 4.1 Today View — Daily Rhythm Sanctuary

The default dashboard is designed to establish immediate calm upon opening the application.

```
┌─────────────────────────────────────────────────────────────────────────┐
│ [● Momentum]    Today   To-Dos   Voice   Rituals   Insights   Profile   │
├─────────────────────────────────────────────────────────────────────────┤
│ Tuesday, October 24                                                     │
│ Good morning, Adithya                                                   │
│ "Small, steady actions today quietly shape the person you become."     │
│                                                                         │
│ ┌───────────────────────────────────┐ ┌───────────────────────────────┐ │
│ │ Concentric Circular Score Ring    │ │ Today's Focus                 │ │
│ │                                   │ │ 25 Mins Mindful Breathwork    │ │
│ │          ╭──────────╮             │ │ [ Start Focus Session → ]     │ │
│ │        ╭─╯  88%     ╰─╮           │ ├───────────────────────────────┤ │
│ │       │    Adherence  │           │ │ Hydration & Vitality          │ │
│ │        ╰─╮          ╭─╯           │ │ 6 / 8 Glasses (1500 ml)       │ │
│ │          ╰──────────╯             │ │ [ - ]  ● ● ● ● ● ● ○ ○  [ + ] │ │
│ └───────────────────────────────────┘ └───────────────────────────────┘ │
│                                                                         │
│ Daily Rituals & Habits                                                  │
│ ┌─────────────────────────────────────────────────────────────────────┐ │
│ │ [🧘] Morning Meditation (15m)      Completed 07:30       [ ✓ Done ] │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ [💪] Strength Practice (Chest Day) 3 sets · 95kg × 12    [ Log + ]  │ │
│ ├─────────────────────────────────────────────────────────────────────┤ │
│ │ [📖] Evening Reading (20 pages)    After dinner          [ ··· ]    │ │
│ └─────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Key UI/UX Invariants:
1. **Concentric Progress Dial (160×160 SVG ViewBox):**
   - **Outer Ring (Habits):** Radius $r=68$, Stroke $6\text{px}$, Circumference $427.26\text{px}$ (`#0F6E56`).
   - **Middle Ring (Focus):** Radius $r=54$, Stroke $6\text{px}$, Circumference $339.29\text{px}$ (`#D97706`).
   - **Inner Ring (Hydration):** Radius $r=40$, Stroke $6\text{px}$, Circumference $251.33\text{px}$ (`#0891B2`).
   - **Center Clearance Constraint:** Strict **74px clear center radius** so text (`88% Adherence`) never collides with or overlaps inner SVG ring strokes on any device.
2. **Dynamic Scoring Formula (Anti-Burnout Balance):**
   $$\text{Daily Adherence \%} = (0.50 \times \text{Habit \%}) + (0.30 \times \text{Focus \%}) + (0.20 \times \text{Water \%})$$
   $$\text{Cumulative Practice Score} = 1600 + (25 \times H) + (1.2 \times F) + (35 \times W) + (3 \times H_2O) + (10 \times S)$$
3. **Interactive Habit Action Popover (`#habit-action-popover`):**
   - **Complete (+25 pts):** Triggers celebratory ring stroke animation.
   - **Skip for Today (Rest):** Flags ritual as rest day; preserves streak intact with zero guilt.
   - **Mark Incomplete / Reset:** Reverts state with undo capability.

---

### 4.2 Fitness & Movement Quick-Logger (Modal Drawer)

Designed for fast workout logging with zero clutter:

```
┌────────────────────────────────────────────────────────────────────────┐
│ FITNESS & MOVEMENT                                               [ ✕ ] │
│ Log movement                                                           │
│ Fast, customizable logging with per-set precision & PR tracking.       │
│                                                                        │
│ [  Strength  ]    [  Cardio  ]    [  Calories  ]    [  PRs 🏆  ]       │
├────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ⟲ Repeat: Chest Day (1 exercise)    Oct 24, 2024       [ Pre-fill ] │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ Bench Press  [ CHEST ]                          PB: 65kg × 8   🔗  🗑   │
│ ┌──────┬──────────────┬──────────────┬──────────┬─────┬──────────────┐ │
│ │Set 1 │ [ 95 ] kg    │ [ 12 ] reps  │ [PR 🎉]  │ ⏱  │   [ ✕ ]      │ │
│ ├──────┼──────────────┼──────────────┼──────────┼─────┼──────────────┤ │
│ │Set 2 │ [ 65 ] kg    │ [ 8  ] reps  │          │ ⏱  │   [ ✕ ]      │ │
│ └──────┴──────────────┴──────────────┴──────────┴─────┴──────────────┘ │
│ [ + Set ] Copies previous set weight & reps                            │
│                                                                        │
│ [ + Add Exercise ]                                                     │
│                                                                        │
│ Pacing:   ( Slow )  ( Moderate ● )  ( Fast )  ( Custom )               │
│ Feel:     ( Easy )  ( Comfortable ● )  ( Challenging )  ( Hard )       │
│                                                                        │
│ [                      Save Movement Session                         ] │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key UI/UX Invariants:
1. **Per-Set Detail & 1-Tap Copy:** Adding a set immediately duplicates the preceding set's weight and repetitions.
2. **Live Auto-Detected PR Badges:** Dynamically computes personal bests against the exercise library on every keystroke. If exceeded, a pulsing amber badge (`PR 🎉`) illuminates in real time.
3. **Non-Blocking Rest Timer:** Tapping the timer icon triggers a floating countdown pill anchored to the screen bottom (`Resting: 1:30 [✕]`) with an audible singing bowl chime upon completion.
4. **Zero Coaching Bloat:** Strictly omits exercise tutorials, video embeds, and cardio step counts to maximize logging speed.

---

### 4.3 Meditative Focus Sanctuary & Audio Synthesizer

```
┌────────────────────────────────────────────────────────────────────────┐
│                              ( 🎧 )                                    │
│                    Slip on your earphones...                           │
│           Experience spatial 432Hz binaural resonance.                │
│                                                                        │
│                                 3                                      │
│                    Deep breath in... Settle in.                        │
│                                                                        │
│ ────────────────────────────────────────────────────────────────────── │
│                                                                        │
│                                24:58                                   │
│                        Deep Work & Writing                             │
│                                                                        │
│          ~~~ ~~~~ ~~~~~~~ Waveform Synthesizer ~~~~~~~ ~~~~ ~~~        │
│                                                                        │
│ Soundscape: (•) Forest Rain   ( ) Ocean Waves   ( ) Binaural Alpha     │
│ Volume: [ ────●───────── ]                                            │
│                                                                        │
│                 [ ❚❚ Pause ]         [ ◼ Complete Early ]              │
└────────────────────────────────────────────────────────────────────────┘
```

#### Key UI/UX Invariants:
1. **Earphones Intro Modal:** Floating earbuds animation that gently nudges the user to use headphones for optimal binaural benefit.
2. **Resonant Singing Bowl Countdown:** 3-2-1 visual timer synchronized with Web Audio harmonic tones (396Hz $\to$ 432Hz $\to$ 528Hz).
3. **Pure Web Audio Synthesis:** Generates a real-time F Maj9 pentatonic drone and pink-noise rain filter entirely client-side without external media assets or network latency.

---

### 4.4 3D Physical Material Craftsmanship (Milestones & Medals)

Achievements are presented as tactile physical objects rather than flat digital icons.

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│   ╭──────────────╮    ╭──────────────╮    ╭──────────────╮             │
│   │    BRONZE    │    │    SILVER    │    │     GOLD     │             │
│   │ Brushed      │    │ Polished     │    │ 24k Aurum    │             │
│   │ Copper       │    │ Chrome       │    │ Radiant      │             │
│   │ 3-Day Streak │    │ 7-Day Streak │    │ 14-Day Streak│             │
│   ╰──────────────╯    ╰──────────────╯    ╰──────────────╯             │
│                                                                        │
│              ╭──────────────────────────────────────────╮              │
│              │                 PLATINUM                 │              │
│              │       Prismatic Chromatic Iridescence    │              │
│              │              30-Day Master Flow          │              │
│              ╰──────────────────────────────────────────╯              │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

#### Specular Shader Specs:
- **Dynamic Mouse Sheen Tracking:** As the cursor glides over a medal, radial specular highlights track the pointer coordinates (`--mouse-x`, `--mouse-y`) using CSS variable transformations.
- **Double-Sided 3D Card Flip:** Clicking any medal flips it $180^\circ$ to reveal historical unlock timestamp, completion notes, and native share link.

---

### 4.5 Aria — AI Voice Agent & Audio-Reactive Visualizer

Aria provides hands-free conversational habit management with complete state reversibility.

```
┌────────────────────────────────────────────────────────────────────────┐
│                                                                        │
│                                ( ✦ )                                   │
│                            [   Aria   ]                                │
│                     "Listening... Speak naturally"                     │
│                                                                        │
│              /\    /\      /\/\    /\      /\    /\                    │
│             /  \  /  \    /    \  /  \    /  \  /  \                   │
│            /    \/    \  /      \/    \  /    \/    \                  │
│           ────────────── Canvas 2D Sine Wave ────────────              │
│                                                                        │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ "Added 2 to-dos for today: Call plumber, Buy groceries"            │ │
│ └────────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│ [ 🎙 Tap to Speak ]                   [ ⌨ Type Command ]               │
│                                                                        │
│ ────────────────────────────────────────────────────────────────────── │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ ⟲ Action completed: Added 2 to-dos.    [ Undo (10s) ]        [ ✕ ] │ │
│ │ [======================== Progress Bar ==========================] │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

#### Voice UX Invariants:
1. **Audio-Reactive Sine Oscillation:** Real-time Web Audio analyzer computes live microphone decibel amplitude to drive a 3-layer sine wave on an HTML5 `<canvas>`.
2. **10-Second Undo Toast:** Any destructive or state-modifying voice command displays a persistent 10-second countdown progress bar with 1-click state rollback.
3. **Conversational Multi-Turn Slot Filling:** Seamlessly clarifies incomplete commands (e.g., prompting: *"Should I add Drink Water every day, or just for today?"*).

---

## 5. Micro-Interactions, Transitions & Motion Design

| Interaction Event | Motion Curve / Timing | Visual & Sensory Feedback |
| :--- | :--- | :--- |
| **Habit Completion Check** | `cubic-bezier(0.34, 1.56, 0.64, 1)` $350\text{ms}$ | Micro spring-scale on checkbox, green stroke fill, 432Hz soft bell tone. |
| **Score Dial Increment** | `ease-out` $600\text{ms}$ | SVG stroke-dashoffset smooth transition; center counter numbers roll upwards. |
| **Modal / Drawer Slide** | `cubic-bezier(0.16, 1, 0.3, 1)` $400\text{ms}$ | Drawer elevates from bottom ($+100\% \to 0\%$), backdrop blurs smoothly. |
| **PR Achievement Trigger** | Infinite pulse $1.8\text{s}$ | Amber glow halo expands and contracts behind the `PR 🎉` badge. |
| **Water Glass Increment** | `ease-in-out` $300\text{ms}$ | Glass icon fills with cyan gradient; subtle ripple waves animate in container. |

---

## 6. Accessibility (a11y) & Ergonomics Guidelines

1. **WCAG 2.1 Level AA Compliance:**
   - Text contrast ratio $\ge 4.5:1$ for body copy and $\ge 3:1$ for large titles across all sand (`#F9F9F8`) and container surfaces.
2. **Keyboard Traversal:**
   - Full keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-primary`) across all drawers, checkboxes, tabs, and modals.
   - `Escape` key immediately closes any active drawer or modal.
3. **Screen Reader (ARIA) Semantics:**
   - Dials equipped with `role="meter"`, `aria-valuenow`, `aria-valuemin="0"`, and `aria-valuemax="100"`.
   - Voice agent transcript updates announced via `aria-live="assertive"`.
4. **Reduced Motion Mode:**
   - `@media (prefers-reduced-motion: reduce)` automatically disables complex specular sheen calculations and canvas wave oscillations.

---

## 7. Responsive Breakpoints & Viewport Layouts

```
┌─────────────────┬─────────────────┬──────────────────────────────────┐
│ Device Class    │ Viewport Range  │ Layout Transformation            │
├─────────────────┼─────────────────┼──────────────────────────────────┤
│ **Mobile PWA**  │ $320 - 640\text{px}$  │ Single-column vertical rhythm,   │
│                 │                 │ bottom floating navigation bar,  │
│                 │                 │ full-width bottom modal sheets.  │
├─────────────────┼─────────────────┼──────────────────────────────────┤
│ **Tablet**      │ $641 - 1024\text{px}$ │ 2-column balanced grid, sticky   │
│                 │                 │ progress dial summary sidebar.   │
├─────────────────┼─────────────────┼──────────────────────────────────┤
│ **Desktop**     │ $> 1024\text{px}$     │ 3-column dashboard, top header   │
│                 │                 │ navigation, expanded analytics   │
│                 │                 │ graphs and full specular medals. │
└─────────────────┴─────────────────┴──────────────────────────────────┘
```

---

## 8. Verification & UI/UX Acceptance Criteria

| Test Suite / Area | Verification Procedure | Acceptance Standard |
| :--- | :--- | :--- |
| **Progress Dial Center Clearance** | Render dial at $320\text{px}$, $375\text{px}$, $768\text{px}$, $1440\text{px}$. | Minimum $74\text{px}$ clear inner diameter; percentage readouts never overlap SVG strokes. |
| **Live PR Auto-Detection** | Input weights in Strength logger. | `PR 🎉` badge triggers immediately when entered weight/reps exceeds library PB. |
| **Non-Blocking Rest Timer** | Start 90s timer in movement modal. | Floating timer pill remains visible across all navigation tabs; chimes upon expiry. |
| **10-Second Undo Buffer** | Trigger voice command (e.g., delete to-do). | Toast appears with moving progress bar; tapping Undo restores deleted item completely. |
| **Specular Medal Sheen** | Hover and tilt mouse over medals. | Radiant light reflection smoothly follows cursor coordinates at 60 FPS. |
| **Console Runtime Integrity** | Hard refresh browser at `http://localhost:8000/#today`. | **Zero uncaught errors or unhandled exceptions** in browser console. |

---

## 9. Version History & Roadmap

- **v1.0.0:** Anti-burnout architectural design, concentric progress dial, and botanical tokens.
- **v2.0.0:** Aria AI voice agent, real-time audio synthesizer, and 3D specular medals.
- **v2.1.0 (Current):** Per-set fitness movement quick-logger, live PR auto-detection, non-blocking rest timer, and full ES2022 module cache stability.
- **v2.2.0 (Planned):** Web Bluetooth heart-rate variability (HRV) sync and customizable binaural Hz frequency sliders.
