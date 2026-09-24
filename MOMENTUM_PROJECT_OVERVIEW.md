# Momentum — Complete Project Handover & Status Report
> **Prepared for:** Project Partner / Developer Review  
> **Project Name:** Momentum — Mindful Rituals & Daily Habit Platform  
> **Repository Location:** `c:\Users\Adithya Mamidala\Documents\Demo`  
> **Primary File:** [`index.html`](file:///c:/Users/Adithya%20Mamidala/Documents/Demo/index.html)  
> **Status:** 🟢 **Production-Ready SPA (Zero Build Required, Runs Directly in Any Browser)**

---

## 📌 1. What is Momentum? (Executive Summary)

**Momentum** is a mindful habit cultivation and daily ritual web application built on **anti-burnout principles**.

Unlike typical habit apps that rely on anxiety-inducing streaks, aggressive notification guilt, and gamified XP bloat, Momentum creates an unhurried digital sanctuary. It helps users build sustainable daily rhythms using organic typography, botanical color palettes, physical material medals, and restorative tracking.

### Core Philosophy:
* **Zero Gamification Bloat:** No XP, no diamond tiers, no flashing popups.
* **Rest Days Without Guilt:** Skipping a habit for rest is supported without breaking streaks.
* **Calm Aesthetic:** Deep forest greens (`#0f6e56`), warm amber (`#d97706`), soft sand backgrounds (`#f9f9f8`), and editorial typography (*Newsreader* serif + *Plus Jakarta Sans*).

---

## ⚙️ 2. Current Project State & Technical Architecture

| Dimension | Implementation Details |
| :--- | :--- |
| **Architecture** | **Single-Page Application (SPA)** in a single self-contained [`index.html`](file:///c:/Users/Adithya%20Mamidala/Documents/Demo/index.html) file. No build step, webpack, or npm installation needed. |
| **Styling & Tokens** | **Tailwind CSS (CDN)** + Custom CSS3 variables with 0.5px hairline framing (`#E6E6E3`). |
| **Typography** | **Google Fonts**: *Newsreader* (Editorial serif for mindful aphorisms) + *Plus Jakarta Sans* (UI clarity). |
| **Icons** | **Google Material Symbols Outlined** (monochromatic 1.5px outline stroke). |
| **Database & Sync** | **Dual Engine**: Local-First `localStorage` + **Firebase v10 Cloud Firestore** real-time sync with offline fallback. |
| **Authentication** | **3-Tier Auth**: 1-Click Anonymous Guest Access, Google Popup Sign-In, and Email/Password with encryption. |
| **Audio Engine** | **Web Audio API**: Standalone synthesized pentatonic harmonic pad (F Maj9), 396Hz/432Hz/528Hz singing bowls, and binaural alpha waves. |

---

## 📱 3. Screen-by-Screen Flow & Navigation

```
[view-welcome] ──► [view-onboarding-1] ──► [view-onboarding-2] ──► [view-onboarding-3]
                                                                          │
[view-today] ◄── [view-otp] ◄─────────────────────────────────────────────┘
      │
      ├──► [view-today]      (Concentric Score Ring, Active Habits, Quick Action Popover)
      ├──► [view-rituals]    (Habits Directory, Needs-Care Cards, Workout Logger)
      ├──► [view-insights]   (Dynamic Heatmap, SVG Rhythm Chart, Habit Matrix)
      ├──► [view-milestones] (Layered Physical Material Medals: Bronze, Silver, Gold, Platinum)
      └──► [view-profile]    (Identity, Avatar, Mantra, Firebase Switcher & JSON Export)
```

---

## 🎯 4. Key Interactive Features

### 1. Spacious Concentric Circular Score Ring ($160 \times 160$ SVG)
* **Outer Ring (Habits):** Radius $r=68$, stroke width $6.0$, circumference $427.26$ (`#0f6e56`).
* **Middle Ring (Mindful Focus):** Radius $r=54$, stroke width $6.0$, circumference $339.29$ (`#d97706`).
* **Inner Ring (Vitality / Water):** Radius $r=40$, stroke width $6.0$, circumference $251.33$ (`#0891b2`).
* **Center Clearance:** **74px clear center clearance** ensuring the score number (`78%`) never touches any ring across any screen size.

### 2. Interactive Habit Action Popover (`#habit-action-popover`)
Clicking any habit tick opens an interactive popover with 4 clean actions:
1. **Complete:** Marks habit done, awards +25 practice points, animates rings and insights.
2. **Skip for Today:** Marks a guilt-free rest day with zero streak penalty.
3. **Mark Incomplete:** Resets the habit to pending state.
4. **Cancel:** Closes the popover without changes.

### 3. Dynamic Scoring Formula
$$\text{Score} = 1600 + (25 \times \text{Habits}) + (1.2 \times \text{Focus Mins}) + (35 \times \text{Workouts}) + (3 \times \text{Water}) + (10 \times \text{Streak})$$
$$\text{Daily Adherence \%} = (0.5 \times \text{Habit \%}) + (0.3 \times \text{Focus \%}) + (0.2 \times \text{Water \%})$$

### 4. Focused Session with Meditative Audio & Earbuds Intro
* Fullscreen backdrop blur with an upward floating wireless earbuds animation.
* 3-2-1 visual countdown with authentic singing bowl chimes.
* Calm ambient meditative music generated live in real-time via Web Audio API.

### 5. Customizable Workout & Movement Logger
* Editable Workout Name (`[ Bench Press ]`).
* Sets, Reps, Weight (KG), Customizable Pacing (`Slow`, `Moderate`, `Fast`, `Custom`), and Feel rating (`Easy` to `Hard`).

### 6. Cloud Sync & Firebase Configuration Modal (`#modal-firebase-config`)
* Instant switching between Local Mode (`🟡 Local Storage`) and Cloud Mode (`🟢 Cloud Synced`).
* Auto-parses Firebase JSON/JS config snippets with 1-click connection testing.

---

## 🚀 5. How to Run and Test This Project

### Quickest Way (Zero Dependencies):
1. Navigate to the project folder: `c:\Users\Adithya Mamidala\Documents\Demo`
2. Double-click or open [`index.html`](file:///c:/Users/Adithya%20Mamidala/Documents/Demo/index.html) directly in **Google Chrome**, **Microsoft Edge**, or **Safari**.
3. That's it! Everything runs directly in the browser.

---

## 📄 6. Summary for Your Friend

> *"Momentum is a fully functional, complete Single-Page Web App in `index.html`. It has zero external build dependencies, runs instantly in any browser, stores state locally and in Firebase Cloud Firestore, features real Web Audio synthesizers for meditation, and includes a custom SVG concentric score ring."*
