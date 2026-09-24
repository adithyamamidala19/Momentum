# Phase 0: Storage & Mock Inventory

**Audit Date:** 2026-09-24  
**Auditor:** Principal Full-Stack & Security Engineer  
**Objective:** Identify every instance of browser persistence, storage APIs, client-held credentials, and mock data across the "Momentum" codebase, and establish a one-to-one mapping to production MongoDB Atlas collections and Node/Express REST API endpoints.

---

## 1. Storage API Usage Audit

A comprehensive scan was conducted across all files (`.js`, `.jsx`, `.html`, `.json`) for `localStorage`, `sessionStorage`, `indexedDB`, `caches`, `document.cookie`, and `persist`.

| File Path | API Used | Keys / Properties Stored | Purpose & Current Behavior | Migration & Target Source of Truth |
|---|---|---|---|---|
| `src/App.jsx` | `sessionStorage` | `momentum_loader_seen` | Remembers if the intro cinematic animation has played in the current browser session. | Replaced by React in-memory runtime state (`let loaderSeenThisSession = false;`). Completely removed from browser storage. |
| `src/services/foodVisionService.js` | `localStorage` | `momentum_gemini_api_key`<br>`momentum_meal_scans_history` | Stores user's Google Gemini API key in plain text in browser storage; caches local meal scan objects. | **CRITICAL SECURITY RISK.** Removed completely. Client uploads image via multipart form (`POST /api/scan/photo`). Server strips EXIF, verifies magic bytes, and calls Gemini Vision with a server-side environment key. Scans are persisted to the `proteinLogs` collection in MongoDB. |
| `src/context/MomentumContext.jsx` | `localStorage` | `momentum_profile_name`<br>`momentum_profile_mantra`<br>`momentum_profile_photo` | Updates profile name, mantra, and avatar directly to `localStorage` on form submit. Also calls `saveStateToStorage(userState)` to persist all state. | Central client store completely decoupled from `localStorage`. Replaced with in-memory React Query cache and API layer calling `PUT /api/profile`. |
| `src/pages/ProfilePage.jsx` | Client Memory / Blob | `momentum_backup_*.json` | Generates a client-side data URI download from raw in-memory/localStorage state. | Replaced by authenticated server endpoint `GET /api/profile/export` streaming a verified JSON snapshot from MongoDB Atlas. |
| `src/services/leaderboardService.js` | In-memory Mock | `MOCK_DATA = true`<br>`BOTANICAL_PERSONAS` (24 items)<br>`seededRandom`, `hashString` | Deterministically generates 24 simulated botanical community members and pseudo-random scores. | Mock data completely removed in production. Replaced by MongoDB aggregation on the `weeklyScores` collection (`GET /api/challenge/weekly`). Only real opted-in users appear. |
| `js/storage.js` | `localStorage` | **26 Storage Keys:**<br>• `momentum_profile_name`<br>• `momentum_profile_photo`<br>• `momentum_profile_mantra`<br>• `momentum_custom_habits`<br>• `momentum_movement_logs`<br>• `momentum_cardio_logs`<br>• `momentum_calorie_intake_logs`<br>• `momentum_exercise_library`<br>• `momentum_focus_data`<br>• `momentum_streak_data`<br>• `momentum_notif_budget`<br>• `momentum_quiet_start`<br>• `momentum_quiet_end`<br>• `momentum_daily_nudges_sent`<br>• `momentum_last_nudge_date`<br>• `momentum_voice_muted`<br>• `momentum_guest_session`<br>• `momentum_firebase_config`<br>• `momentum_todos`<br>• `momentum_water_ml`<br>• `momentum_water_target_ml`<br>• `momentum_protein_grams`<br>• `momentum_protein_target_grams`<br>• `momentum_protein_entries`<br>• `momentum_challenge_user`<br>• `momentum_daily_history` | Houses all reads/writes to `localStorage` (`loadStateFromStorage`, `saveStateToStorage`, `clearAllState`). Seeds initial state with hardcoded data. | Deprecated and isolated. All data structures migrated to Mongoose models. Browser interacts exclusively through authenticated REST endpoints with `Cache-Control: no-store`. |
| `js/state.js` | `localStorage` | `userState` singleton | Directly initializes state from `loadStateFromStorage()` and invokes `persistState(userState)` on every user mutation. | Replaced by server-side business logic services. The browser holds transient in-memory state returned by the API. |
| `js/app.js` & `js/router.js` | `localStorage` | `momentum_guest_session` | Checked guest login status in legacy vanilla implementation. | Replaced by `<AuthProvider />` and server session cookie verification (`GET /api/auth/me`). |

---

## 2. Hard-Coded Mock Data Inventory

| Mock Structure | Location | Contents | Target Backend Collection & Strategy |
|---|---|---|---|
| `BOTANICAL_PERSONAS` | `src/services/leaderboardService.js:24-49` | 24 fictional botanical users (`QuietFern`, `MorningTide`, `CedarBreeze`, etc.) with synthetic scores. | **`weeklyScores` collection.** Removed in production. Real participants opt in with a pseudonym & avatar. If < 3 users, renders warm empty state: *"Be among the first. Invite a friend."* |
| `DEFAULT_HABITS` | `js/storage.js:35-41` | 5 default habits (`500ml Morning Water`, `4-7-8 Box Breathing`, `25-Min Deep Focus Block`, `Movement & Mobility`, `Evening Digital Sunset`). | **`rituals` collection.** Seeded on new user account creation during first-time onboarding via `POST /api/auth/session`. |
| `DEFAULT_EXERCISE_LIBRARY` | `js/storage.js:43-70` | 21 preset exercises with hardcoded dates (`2026-09-20`, `2026-09-18`) and personal bests. | **`exercises` & `personalRecords` collections.** Global catalog provided as reference; personal records populated dynamically as user logs sets. |
| `DEFAULT_MOVEMENTS` | `js/storage.js:72-130` | Mock workout logs for Bench Press & Incline DB Press with hardcoded timestamps. | **`workouts` collection.** Empty for new accounts. Clean state returned until the user logs an actual session. |
| `DEFAULT_CARDIO_LOGS` | `js/storage.js:132-142` | Mock cardio log (Treadmill run, `2026-09-19`). | **`cardioLogs` collection.** Empty for new accounts. |
| `DEFAULT_CALORIE_LOGS` | `js/storage.js:144-154` | Mock calorie logs (`2026-09-20`). | **`proteinLogs` collection.** Empty for new accounts. |
| `DEFAULT_TODOS` | `js/storage.js:156-162` | 3 mock to-dos (`Evening reflection`, `Prep tomorrow's workout`, `Hydrate`). | **`todos` collection.** Seeded or empty upon user creation. |
| Hardcoded Dates | Multiple files | String dates like `'2026-09-20'`, `'2026-09-24'` | **Server UTC Timestamps + User Timezone offset.** Stored in UTC (ISO 8601), converted dynamically on server using user's IANA timezone (e.g., `Asia/Kolkata`, `America/New_York`). |

---

## 3. Store Fields to Backend Schema & REST API Mapping

| Store Field | Data Type | Mongoose Model & Collection | Indexed Fields | REST API Endpoints | Business Logic & Server Calculations |
|---|---|---|---|---|---|
| **User Identity & Settings** | Object | `User` (`users`) | `firebaseUid: 1` (unique)<br>`email: 1` | `GET /api/auth/me`<br>`POST /api/auth/session`<br>`POST /api/auth/logout`<br>`PUT /api/profile`<br>`GET /api/profile/export`<br>`DELETE /api/profile/account` | • Session cookie signed via Firebase Admin.<br>• Validates display name (title-cased).<br>• Hard-deletes all associated documents across all collections upon account deletion. |
| **Habits / Rituals** | Array of Objects | `Ritual` (`rituals`)<br>`RitualLog` (`ritualLogs`) | `(userId: 1, archived: 1)`<br>`(userId: 1, ritualId: 1, date: 1)` (unique) | `GET /api/rituals`<br>`POST /api/rituals`<br>`PUT /api/rituals/:id`<br>`DELETE /api/rituals/:id`<br>`POST /api/rituals/:id/checkin`<br>`POST /api/rituals/:id/skip` | • Server computes daily adherence percentage.<br>• **Rest and skipped days are strictly excluded from the denominator**, preventing adherence drop on rest days.<br>• Computes overall streak and per-ritual streaks. |
| **To-Dos** | Array of Objects | `Todo` (`todos`) | `(userId: 1, status: 1)`<br>`(userId: 1, dueDate: 1)` | `GET /api/todos`<br>`POST /api/todos`<br>`PUT /api/todos/:id`<br>`DELETE /api/todos/:id`<br>`POST /api/todos/:id/restore` | • Soft-delete with `deletedAt` timestamp for server-backed 10-second undo window.<br>• Hard-delete cleanup after undo window expires. |
| **Water / Hydration** | Number (ml) & Logs | `HydrationLog` (`hydrationLogs`) | `(userId: 1, date: 1)` | `GET /api/hydration`<br>`POST /api/hydration`<br>`DELETE /api/hydration/:id` | • Server aggregates `amountMl` for user's local date.<br>• Computes glass count (`Math.floor(ml / 250)`) and goal percentage. |
| **Protein Nutrition** | Number (g) & Entries | `ProteinLog` (`proteinLogs`) | `(userId: 1, date: 1)` | `GET /api/protein`<br>`POST /api/protein`<br>`DELETE /api/protein/:id` | • Aggregates total grams and calories.<br>• Supports `source: 'manual' \| 'scan'`.<br>• Provides 10s undo via soft-delete or restore. |
| **Photo Meal Scan** | Multipart Image | Transient Server Processing -> `ProteinLog` | N/A | `POST /api/scan/photo` | • Accepts multipart image (max 5 MB).<br>• Verifies magic bytes (`image/jpeg`, `image/png`, `image/webp`).<br>• Strips EXIF metadata.<br>• Invokes Gemini Vision with server-side key.<br>• Returns editable suggestion; image is not stored. |
| **Focus Sessions** | Array of Objects | `FocusSession` (`focusSessions`) | `(userId: 1, startedAt: -1)` | `GET /api/focus/sessions`<br>`POST /api/focus/sessions`<br>`GET /api/focus/stats` | • Aggregates total focused minutes for today and week.<br>• Feeds into practice score and weekly challenge. |
| **Workouts & PRs** | Array of Objects | `Workout` (`workouts`)<br>`Exercise` (`exercises`)<br>`PersonalRecord` (`personalRecords`) | `(userId: 1, date: -1)`<br>`(userId: 1, exerciseId: 1)` | `GET /api/workouts`<br>`POST /api/workouts`<br>`GET /api/workouts/repeat-last`<br>`GET /api/exercises`<br>`POST /api/exercises`<br>`GET /api/workouts/prs` | • Automatically compares incoming set weight/reps against `personalRecords`.<br>• Detects PRs and updates exercise library. |
| **Voice / Aria Assistant** | Array of Messages | `AriaMessage` (`ariaMessages`) | `(userId: 1, createdAt: -1)` | `GET /api/aria/messages`<br>`POST /api/aria/message`<br>`POST /api/aria/undo` | • Logs multi-turn conversation and slot filling state.<br>• Issues reversible undo tokens for Aria-triggered actions. |
| **Streaks, Adherence, Heatmap, Milestones** | Computed Metrics | Aggregated dynamically via `MetricsService` | N/A | `GET /api/today`<br>`GET /api/insights?range=30d\|90d\|365d`<br>`GET /api/milestones` | • Single source of truth computed entirely server-side.<br>• Client receives pre-calculated scores, percentages, and heatmap grid.<br>• Never relies on client math. |
| **Weekly Challenge & Leaderboard** | Array of Scores | `WeeklyScore` (`weeklyScores`) | `(weekId: 1, weeklyScore: -1)`<br>`(userId: 1, weekId: 1)` (unique) | `GET /api/challenge/weekly`<br>`POST /api/challenge/join`<br>`POST /api/challenge/leave`<br>`GET /api/challenge/me`<br>`GET /api/challenge/last-week-winners` | • MongoDB aggregation pipeline computes exact rank.<br>• Formula: `round(0.5 * points + 0.3 * adherence * 10 + 0.2 * focus)`.<br>• Only opted-in users are visible. |

---

## 4. Phase 0 Verification Sign-Off

1. **Storage Leakage Risk:** Fully cataloged. Zero unmanaged localStorage/sessionStorage keys remain unaccounted for.
2. **Secret Leakage Risk:** Client-side Gemini API key identified in `foodVisionService.js` and marked for immediate elimination.
3. **Mock Data Elimination Strategy:** 100% of synthetic botanical personas and preset logs mapped to real Mongoose collections.
