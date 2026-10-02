# Momentum — Production Launch & Operational Checklist

This document provides a verified, step-by-step operational checklist for deploying Momentum into production.

---

## 1. Cloud Infrastructure & Service Setup

### A. MongoDB Atlas Cluster
- [ ] Create an M10+ dedicated cluster (or serverless instance) in the primary user region.
- [ ] Configure Network Access:
  - Whitelist backend server IP addresses (or `0.0.0.0/0` if deploying to serverless platforms with dynamic IPs, e.g. Cloud Run/Fly.io, protected by strong credentials).
- [ ] Create Database User:
  - Role: `readWrite` on `momentum` database.
  - Generate a 32+ character high-entropy password.
- [ ] Build Production Indexes:
  - Run `npm run create-indexes` in `backend/` to instantiate compound unique indexes:
    - `users`: `{ email: 1 }`, `{ firebaseUid: 1 }`
    - `ritualLogs`: `{ user: 1, date: 1, ritual: 1 }`
    - `weeklyScores`: `{ weekId: 1, score: -1 }`

### B. Firebase Authentication & IAM
- [ ] Enable **Google** provider under *Authentication > Sign-in method*.
- [ ] Add Production Domains to *Authorized domains* (e.g., `momentum.app`, `api.momentum.app`).
- [ ] Generate Service Account Key:
  - Navigate to *Project settings > Service accounts > Firebase Admin SDK*.
  - Click **Generate new private key**.
  - Securely extract `client_email`, `private_key`, and `project_id`.

### C. Gemini AI Vision Key
- [ ] Obtain Gemini API key from Google AI Studio.
- [ ] Assign exclusively to the backend server environment (`GEMINI_API_KEY`). **Never** expose to client builds.

---

## 2. Environment Variables Verification

### Server (`backend/.env`)
| Variable | Value Requirement | Checked |
| :--- | :--- | :---: |
| `NODE_ENV` | `production` | [ ] |
| `PORT` | `5000` (or host assigned `$PORT`) | [ ] |
| `MONGODB_URI` | `mongodb+srv://<user>:<pwd>@<cluster>.mongodb.net/momentum?retryWrites=true&w=majority` | [ ] |
| `CORS_ORIGIN` | `https://momentum.app` (Exact frontend domain) | [ ] |
| `COOKIE_SECRET` | 64-char random hex string (`openssl rand -hex 32`) | [ ] |
| `FIREBASE_PROJECT_ID` | Production project ID | [ ] |
| `FIREBASE_CLIENT_EMAIL` | Service account email | [ ] |
| `FIREBASE_PRIVATE_KEY` | Exact PEM formatted string including `\n` | [ ] |
| `GEMINI_API_KEY` | Server-side Gemini API key | [ ] |

### Client (`frontend/.env.production`)
| Variable | Value Requirement | Checked |
| :--- | :--- | :---: |
| `VITE_API_URL` | `https://api.momentum.app` (leave empty if reverse-proxied) | [ ] |
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | [ ] |
| `VITE_FIREBASE_AUTH_DOMAIN` | `momentum-app.firebaseapp.com` | [ ] |
| `VITE_FIREBASE_PROJECT_ID` | Production project ID | [ ] |
| `VITE_FIREBASE_APP_ID` | Firebase Web App ID | [ ] |

---

## 3. Build & Deployment Execution

- [ ] **Run Pre-Flight CI Checks Locally:**
  ```bash
  # 1. Run all unit & storage audit tests
  npm test
  # 2. Run backend API & security tests individually
  npm run test:backend
  # 3. Check for security vulnerabilities
  npm audit
  # 4. Verify clean production build
  npm run build
  ```
- [ ] **Deploy Backend Server:**
  - Build Docker container: `docker build -t momentum-api backend/`
  - Deploy to host (Render / Fly.io / GCP Cloud Run / AWS ECS).
  - Verify container health check passes: `GET /api/health` -> `200 {"status":"ok"}`.
  - Verify database readiness probe: `GET /api/ready` -> `200 {"status":"ready","database":"connected"}`.
- [ ] **Deploy Frontend Client:**
  - Deploy `frontend/dist/` directory to static CDN (Vercel / Cloudflare Pages / Firebase Hosting).
  - Configure SPA rewrite: all paths redirect to `index.html`.

---

## 4. Post-Deployment Smoke Tests

- [ ] **Zero-Storage Confirmation:**
  - Open DevTools > Application.
  - Verify `localStorage` = 0 items.
  - Verify `sessionStorage` = 0 items.
  - Verify `IndexedDB` = 0 user records.
  - Verify `Cache Storage` = 0 items.
- [ ] **Authentication Flow:**
  - Click "Sign In" > "Continue with Google".
  - Confirm Google consent popup completes and closes.
  - Verify server sets `momentum_session` with `httpOnly; Secure; SameSite=Lax`.
- [ ] **Habit & Telemetry Actions:**
  - Check in a habit: verify instant UI checkmark and server sync.
  - Click "Undo" within 10s: verify habit unchecks and server state restores.
  - Increment hydration (+250ml): verify ring updates.
  - Upload meal photo: verify calorie & protein breakdown response.
- [ ] **Account Export & Erasure (GDPR):**
  - Navigate to Profile > Data Portability > "Export My Sanctuary Data". Verify valid JSON download.
  - Test Account Deletion on a test account: verify cascade deletion across all 14 collections and redirection to `/signin`.
- [ ] **Rate Limiting Verification:**
  - Send 15 rapid POST requests to `/api/auth/session` -> Verify `429 Too Many Requests`.
