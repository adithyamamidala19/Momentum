# Momentum — Mindful Rituals Platform
## Comprehensive Project Report & Feature Specification (Refined)

> **Project Name:** Momentum — Mindful Rituals Cultivation Platform  
> **Repository:** `c:/Users/Adithya Mamidala/Documents/Demo`  
> **Main Application:** [`index.html`](file:///c:/Users/Adithya%20Mamidala/Documents/Demo/index.html)  
> **Design Specification:** [`stitch_spec_driven_ui_design_system/`](file:///c:/Users/Adithya%20Mamidala/Documents/Demo/stitch_spec_driven_ui_design_system)  
> **Latest Update:** September 18, 2026 — *Spacious Concentric Score Ring (Zero Overlap), Real Dynamic Scoring Engine, Habit Tick Action Popover, Dynamic Insights Synchronization, and Zero-Hallucination AI Bot*

---

## 1. Executive Summary & Design Philosophy

**Momentum** is a mindful habit cultivation and daily ritual platform built on unhurried, anti-burnout principles. Unlike conventional habit trackers that rely on anxiety-inducing streaks, gamified XP ladders, and aggressive notification guilt, Momentum creates a quiet digital sanctuary featuring organic typography, botanical color palettes, physical material craftsmanship, and restorative tracking.

### Core Architectural Invariants:
1. **Zero Gamification Bloat:** Strict exclusion of "Levels", "XP", "Diamond Sovereign", "River Flow", "Trophies", "Badges", "Prestige", and celebratory confetti/burst screens.
2. **Spacious Concentric Circular Score Ring (160×160 viewBox):** Multi-ring visualization representing daily habits (Outer, `#0f6e56`, $r=68$), mindful focus minutes (Middle, `#d97706`, $r=54$), and hydration/vitality (Inner, `#0891b2`, $r=40$). Features over 74px of clear inner clearance, ensuring centered score text never touches or overlaps any ring across mobile, tablet, and desktop screens.
3. **Dynamic Practice-Grounded Scoring Engine:** Dynamic calculation of daily adherence score (0–100%) and cumulative practice points (1600+ base journey + habit points + focus points + workout points + hydration points + streak bonus). Every activity dynamically updates and animates score counters across the Home Screen and Insights section.
4. **Interactive Habit Action Popover:** Clicking the tick on any habit opens an interactive modal with **Complete** (+25 pts), **Skip for Today** (rest day without penalty), **Mark Incomplete**, and **Cancel** options.
5. **Dynamic & Animated Insights Section:** All graphs, counters, 4-habit matrix bars, and the Native SVG Habit Rhythm Chart are directly bound to live user data and animate smoothly with easing.
6. **Focused Session with Meditative Audio & Earbuds Intro:** Fullscreen backdrop blur, smooth upward float animation of wireless earbuds, prominent audio instruction, 3-2-1 countdown with singing bowl chimes, zero music during countdown, and calm ambient music starting precisely when the timer begins.
7. **Customizable Movement & Workout Logger:** User-editable Workout Name (`[ Bench Press ]`), customizable Sets/Reps/Weight (KG), customizable Pacing (`Slow`, `Moderate`, `Fast`, `Custom` + input), and customizable Feel (`Easy`, `Comfortable`, `Challenging`, `Hard`, `Custom` + input).
8. **Grounded Home Screen AI Assistant Bot:** Personal assistant answering exclusively from real website data with a strict zero-hallucination rule (*"I don't have enough data to answer that yet."*).

---

## 2. Technical Stack & Implementation Details

| Component | Technology | Implementation Details |
| :--- | :--- | :--- |
| **Architecture** | Single-Page Application (SPA) | Pure semantic HTML5 + Vanilla ES6+ JavaScript. No build step required. |
| **Design Tokens & CSS** | Tailwind CSS + Custom CSS3 | Material/Botanical Design tokens mapped to CSS variables, 0.5px hairline framing (`#E6E6E3`). |
| **Typography** | Google Fonts | **Newsreader** (Editorial serif for mindful aphorisms) + **Plus Jakarta Sans** (Clean sans-serif for UI clarity). |
| **Iconography** | Google Material Symbols | Monochromatic 1.5px outline stroke symbols. |
| **Concentric Gauge** | Scaled SVG ($160\times 160$) | Concentric rings with smooth rounded endpoints (`stroke-linecap="round"`), radial center aura glow, and centered score readout with zero overlap. |
| **Audio Engine** | Web Audio API (`MeditativeAudio`) | Standalone synthesized pentatonic harmonic pad (F Maj9), resonant 396Hz/432Hz/528Hz singing bowl bells, and binaural alpha waves. |
| **State Persistence** | `localStorage` API | Persists user profile, mantra, avatar, custom habits, movement logs, and focus sessions across page reloads. |
| **Dynamic Scoring** | `calculateDynamicMetrics` | Real-time calculation of adherence percentages, cumulative score points, and interconnected metrics. |

---

## 3. Screen-by-Screen Feature Breakdown

```
[view-welcome] ──► [view-onboarding-1] ──► [view-onboarding-2] ──► [view-onboarding-3]
                                                                          │
[view-today] ◄── [view-otp] ◄─────────────────────────────────────────────┘
      │
      ├──► [view-rituals]    (Rituals Directory & Needs-Care Cards)
      ├──► [view-insights]   (Momentum Arc & Practice Heatmap)
      ├──► [view-milestones] (Crafted Material Medals & Inscriptions)
      └──► [view-profile]    (Practitioner Identity & Data Export)
```

---

## 4. Concentric Circular Progress Ring Design

* **Scaled Geometry ($160 \times 160$ ViewBox):**
  * **Outer Ring (Habits):** Radius $r=68$, stroke width $6.0$, circumference $427.26$ (`#0f6e56`).
  * **Middle Ring (Focus):** Radius $r=54$, stroke width $6.0$, circumference $339.29$ (`#d97706`).
  * **Inner Ring (Hydration):** Radius $r=40$, stroke width $6.0$, circumference $251.33$ (`#0891b2`).
* **Centered Score Typography:**
  * Clean, ample 74px clear center clearance.
  * Number and label centered with absolute flexbox centering (`inset-0 flex flex-col items-center justify-center`).
  * Zero overlap or touching at any screen width.
* **Loading and Update Animations:**
  * Eased transitions (`cubic-bezier(0.16, 1, 0.3, 1)`) from 0% on initial load, and animated number counting on score changes.

---

## 5. Dynamic Score & Action Popover Engine

* **Score Formula:**
  $$\text{Score} = 1600 + (25 \times \text{Habits}) + (1.2 \times \text{Focus Mins}) + (35 \times \text{Workouts}) + (3 \times \text{Water}) + (10 \times \text{Streak})$$
  $$\text{Daily Adherence \%} = (0.5 \times \text{Habit \%}) + (0.3 \times \text{Focus \%}) + (0.2 \times \text{Water \%})$$
* **Habit Tick Action Popover (`#habit-action-popover`):**
  * **Complete:** Marks habit done, adds points, updates concentric rings & insights, triggers toast.
  * **Skip for Today:** Marks habit as rest day without streak penalties.
  * **Mark Incomplete:** Resets habit back to pending state.
  * **Cancel:** Closes modal with no state changes.
* **All Activity Triggers Synchronized:**
  * Completing habits, logging workouts, completing focus sessions, and drinking water all trigger `recalculateAndSyncAll()`.


---

## 6. Firebase Authentication & Cloud Firestore Real-Time Sync

* **Firebase Web SDK Architecture:**
  * Imported Firebase v10 Compat SDK (`firebase-app-compat.js`, `firebase-auth-compat.js`, `firebase-firestore-compat.js`) in `<head>`.
  * Modular `MomentumFirebase` singleton engine with local-first offline fallback.
* **Authentication Options:**
  1. **1-Click Instant Mindful Access:** Anonymous authentication (`signInAnonymously`) ensuring zero-friction onboarding with instant Cloud Firestore document binding.
  2. **Google Sign-In:** 1-Click popup authentication (`signInWithPopup` + `GoogleAuthProvider`).
  3. **Email & Password Authentication:** Full sign-in and sign-up with password encryption and user profile updates.
* **Cloud Firestore Schema (`users/{userId}`):**
  * Auto-synchronized document fields: `name`, `email`, `phone`, `streakDays`, `bestStreak`, `score`, `totalScore`, `mindfulHours`, `todayFocusMinutes`, `waterGlasses`, `customHabits` array, `movementLogs` array, and `milestones` array.
  * Real-time bidirectional synchronization: local mutations trigger debounced writes (`queueSave`), and remote database changes automatically update UI progress rings, charts, and habits.
* **In-App Firebase Configuration & Test Modal (`#modal-firebase-config`):**
  * Provides live connection testing, JSON/JS snippet auto-parsing, and instant project switching with visual status badges (`🟢 Cloud Synced` / `🟡 Local Mode`).
