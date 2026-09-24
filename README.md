# Momentum — Mindful Habit & Daily Rhythm Sanctuary

Momentum is a modern, modular, high-performance mindful habit tracker built with vanilla HTML, CSS, and ES Modules. It features concentric circular progress rings, realistic 3D specular medals, native SVG Catmull-Rom spline curves, a Web Audio API harmonic soundscape synthesizer, smart quiet-hours reminders with calm escalation banners, a grounded AI assistant, and a natural language voice agent.

---

## 📁 Project Architecture

```
├── index.html                  # Clean semantic HTML application shell
├── manifest.json               # Progressive Web App (PWA) manifest
├── package.json                # Project scripts, metadata, and dev tooling
├── tailwind.config.js          # Tailwind CSS theme, typography & color system
├── postcss.config.js           # PostCSS configuration with Tailwind & Autoprefixer
├── jsconfig.json               # JavaScript ES2022+ module & path aliases configuration
├── .eslintrc.json              # ESLint rules for modern ES Modules
├── .prettierrc                 # Code formatting standards
├── .prettierignore             # Prettier ignore rules
├── .gitignore                  # Git ignore rules for node_modules and builds
├── firebase.json               # Firebase Hosting & Firestore configuration
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore query indexes
├── css/
│   ├── global.css              # Base resets, typography, tokens & hairlines
│   ├── loader.css              # Initial reveal & relaxing welcome loaders
│   ├── components.css          # Habit cards, pills, drawers, sheets, modals
│   ├── medals.css              # 3D realistic medal cards & flip animations
│   ├── focus.css               # Meditative focus timer & earphones intro
│   └── voice-agent.css         # Voice FAB, wave visualizer & 10s undo toast
└── js/
    ├── app.js                  # Root application orchestrator & lifecycle bootstrap
    ├── storage.js              # Persistence keys & safe local storage engine
    ├── state.js                # State singletons & dynamic adherence scoring
    ├── router.js               # Route guards, hash routing & view transitions
    ├── services/
    │   ├── firebase.js         # Real-time Firestore sync & Auth engine
    │   ├── soundscape.js       # Web Audio API harmonic soundscape synthesizer
    │   ├── assistant.js        # Grounded AI assistant bot (zero hallucination)
    │   ├── voice-agent.js      # STT/TTS engine & Chrono NLP date parser
    │   └── reminders.js        # Calm escalation ladder & quiet hours engine
    ├── components/
    │   ├── rhythm-chart.js     # Native SVG spline chart & hover tooltips
    │   └── medals.js           # 3D sheen tracking & milestone share modal
    └── pages/
        ├── onboarding.js       # 3-step personalization flow
        ├── auth.js             # Sign-in/Sign-up tabs & Google login
        ├── today.js            # Concentric rings dashboard & water tracker
        ├── rituals.js          # Custom habits CRUD & suggestion drawer
        ├── insights.js         # 30-day calendar & analytics engine
        ├── profile.js          # Profile preferences & Zen breathing breaks
        ├── focus.js            # Focus session countdown orchestrator
        └── movement.js         # Workout logging & sets/reps tracker
```

---

## 🚀 Getting Started

### Local Development

Run the local development server on port 3000:

```bash
# Using npm
npm start

# Or using npx serve directly
npx serve -l 3000 .
```

Open `http://localhost:3000` in your web browser.

---

## 🛠️ Tooling & Scripts

| Command | Description |
| :--- | :--- |
| `npm start` / `npm run dev` | Starts local HTTP server on port `3000` |
| `npm run lint` | Runs ESLint on all modular JavaScript files in `js/` |
| `npm run format` | Formats code with Prettier |
| `npm run build:css` | Compiles CSS via Tailwind CLI (optional) |
| `npm run deploy` | Deploys to Firebase Hosting |

---

## ☁️ Firebase Cloud Sync & Security

Momentum includes local-first offline storage by default with seamless real-time cloud synchronization via Firebase Firestore:
- **Hosting Configuration**: [`firebase.json`](./firebase.json)
- **Security Rules**: [`firestore.rules`](./firestore.rules)
- **Project Configuration**: Can be configured directly through the in-app Firebase Settings modal or stored in `localStorage`.

---

## 📄 License

MIT License. Designed with mindful care.
