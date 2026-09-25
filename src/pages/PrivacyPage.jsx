import React from 'react';
import {
  ShieldCheck,
  Database,
  Lock,
  Trash2,
  ArrowLeft,
  EyeOff,
  HeartHandshake,
  Server,
  FileText,
  Mail,
  CheckCircle2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

export default function PrivacyPage({ setView }) {
  const lastUpdated = 'September 25, 2026';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-10 select-none">
      {/* ── Top Header ── */}
      <div className="flex flex-col items-start gap-1">
        <button
          type="button"
          onClick={() => setView('today')}
          className="inline-flex items-center gap-1.5 text-xs text-outline hover:text-on-surface transition-colors cursor-pointer mb-3 bg-transparent border-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dashboard</span>
        </button>

        <span className="text-[10px] uppercase font-bold tracking-widest text-[#0F6E56]">
          Grounded Transparency & Trust
        </span>
        <h1 className="font-editorial text-3xl sm:text-5xl text-on-surface font-normal">
          Privacy Policy
        </h1>
        <p className="text-xs text-outline">
          Last revised: {lastUpdated} • Our plain-language commitment to your personal sanctuary.
        </p>
      </div>

      {/* ── Core Commitments Highlight Box ── */}
      <div className="p-6 rounded-3xl bg-[#0F6E56]/8 border border-[#0F6E56]/20 space-y-2">
        <div className="flex items-center gap-2 text-sm font-bold text-[#0B4D3C]">
          <ShieldCheck className="w-5 h-5 text-[#0F6E56]" />
          <span>Our Fundamental Sanctuary Promise</span>
        </div>
        <p className="text-xs text-[#1A2E26] leading-relaxed">
          Momentum exists to foster quiet, unhurried personal growth. We do not sell your personal data, broker your habits, or display third-party advertisements. Your mindfulness is an intimate practice, and our technical architecture is built to keep it that way.
        </p>
      </div>

      {/* ── Main Policy Content (7 Explicit Sections) ── */}
      <div className="space-y-8 text-xs text-outline leading-relaxed">
        {/* Section 1: What We Collect */}
        <section className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-on-surface">
            <span className="w-6 h-6 rounded-full bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center text-xs">
              1
            </span>
            <h2>What We Collect</h2>
          </div>
          <p>
            We collect only the information necessary to provide an authentic, isolated mindfulness rhythm:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-on-surface">Account Credentials:</strong> Real name, email address, and Google account profile photo retrieved when you authenticate via Google Sign-In.
            </li>
            <li>
              <strong className="text-on-surface">Optional Onboarding Demographics:</strong> Age, weight (kg), and gender. These fields are strictly optional, can be marked “Prefer not to say”, and are used solely to calibrate personal hydration and protein baselines if you choose.
            </li>
            <li>
              <strong className="text-on-surface">Daily Rhythm & Habit Logs:</strong> Habit check-ins, custom ritual titles, focus timer durations, water intake timestamps, and nutritional protein/calorie logs.
            </li>
            <li>
              <strong className="text-on-surface">Uploaded Photos:</strong> Meal photos analyzed via AI Food Vision and optional custom profile pictures.
            </li>
            <li>
              <strong className="text-on-surface">Challenge Pseudonym & Bio:</strong> If you join the Challenge, you choose a botanical pseudonym (e.g. “QuietFern”), an avatar emoji, and an optional 150-character bio.
            </li>
            <li>
              <strong className="text-on-surface">1:1 Chat Messages:</strong> Encouraging text messages exchanged between mutual, accepted habit partners.
            </li>
          </ul>
        </section>

        {/* Section 2: What Is NEVER Shown to Other Users */}
        <section className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-on-surface">
            <span className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-700 flex items-center justify-center text-xs">
              2
            </span>
            <h2>What is NEVER Shown to Other Users</h2>
          </div>
          <p>
            When other practitioners view your sanctuary profile or interact with you on the leaderboard, our backend enforces a strict data serializer (DTO) that physically prevents private attributes from leaving our database.
          </p>
          <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-900 space-y-2">
            <span className="font-bold block text-xs">The following data is NEVER transmitted to other users:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Your Real Legal Name</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Your Email Address</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Age, Weight, or Gender</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Water & Protein Intake Logs</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Exact Health & Workout Data</span>
              </div>
              <div className="flex items-center gap-2">
                <EyeOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>Cryptographic Verification Codes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: The Challenge Circle and Chat */}
        <section className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-on-surface">
            <span className="w-6 h-6 rounded-full bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center text-xs">
              3
            </span>
            <h2>The Challenge Circle & Safe Chat</h2>
          </div>
          <p>
            Participation in the Weekly Sanctuary Challenge and chat system is 100% opt-in. It exists exclusively for gentle peer accountability and mutual encouragement:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-on-surface">Two-Step Opt-In Connections:</strong> No user can message you without your explicit approval. Sending a friend request creates a pending invitation that you may Accept, Decline, or Block.
            </li>
            <li>
              <strong className="text-on-surface">Automatic Contact-Info Shield:</strong> Every chat message and bio is screened automatically before storage. Patterns resembling phone numbers, email addresses, external messaging links, or social handles (e.g. @username, ig:, snap:) are strictly blocked.
            </li>
            <li>
              <strong className="text-on-surface">10-Second Undo Window:</strong> Accidental messages can be retracted within 10 seconds of dispatch.
            </li>
            <li>
              <strong className="text-on-surface">Moderation & Blocking:</strong> You can block any practitioner or report inappropriate conduct with a single tap. Blocking instantly terminates all chat channels and hides profiles bi-directionally without alerting the blocked user.
            </li>
          </ul>
        </section>

        {/* Section 4: Data Storage and Security */}
        <section className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-on-surface">
            <span className="w-6 h-6 rounded-full bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center text-xs">
              4
            </span>
            <h2>Data Storage & Technical Security</h2>
          </div>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-on-surface">Encrypted Database:</strong> All structured application data is securely hosted on MongoDB Atlas with TLS 1.3 encryption in transit and AES-256 encryption at rest.
            </li>
            <li>
              <strong className="text-on-surface">Authentication & Session Security:</strong> Identity is verified via Firebase Authentication. Server requests use secure, httpOnly, SameSite session cookies that cannot be accessed by client-side browser scripts.
            </li>
            <li>
              <strong className="text-on-surface">Zero Browser Storage Leaks:</strong> Momentum does not write user habit logs, metrics, or personal notes to browser storage mechanisms (such as localStorage or session-based browser storage). If you log out or clear cookies, no residual data remains on your machine.
            </li>
            <li>
              <strong className="text-on-surface">Access-Controlled Cloud Assets:</strong> User profile images are stored in Firebase Storage under restricted security rules tied to your verified account UID.
            </li>
          </ul>
        </section>

        {/* Section 5: User Rights & Data Sovereignty */}
        <section className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-on-surface">
            <span className="w-6 h-6 rounded-full bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center text-xs">
              5
            </span>
            <h2>Your Rights & Data Sovereignty</h2>
          </div>
          <p>
            You hold uncompromised sovereignty over your sanctuary journey:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-on-surface">Export Your Data:</strong> You may at any time download a complete, verified JSON archive of your habits, logs, achievements, and stats from the Profile page.
            </li>
            <li>
              <strong className="text-on-surface">Leave the Challenge:</strong> You can opt out of the community leaderboard anytime with one click in Challenge settings, instantly removing your nickname and avatar from public view.
            </li>
            <li>
              <strong className="text-on-surface">Permanent Account Deletion:</strong> Clicking "Delete Account" initiates an immediate, irreversible hard purge across all MongoDB collections, deletes associated Firebase Storage objects, and revokes your identity from Firebase Auth.
            </li>
          </ul>
        </section>

        {/* Section 6: No Selling of Data, No Ads */}
        <section className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-on-surface">
            <span className="w-6 h-6 rounded-full bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center text-xs">
              6
            </span>
            <h2>No Selling of Data & No Ad Trackers</h2>
          </div>
          <p>
            Momentum is intentionally crafted as an ad-free sanctuary. We make our commitment absolute:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>We do not sell, rent, trade, or monetize your personal information to data brokers.</li>
            <li>We do not embed third-party advertising SDKs, conversion pixels, or tracking cookies (e.g. Meta Pixel, Google AdSense, TikTok trackers).</li>
            <li>Milestone medal social shares log only count statistics on our server for your personal achievement totals and contain zero third-party telemetry.</li>
          </ul>
        </section>

        {/* Section 7: Contact Information & Updates */}
        <section className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-on-surface">
            <span className="w-6 h-6 rounded-full bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center text-xs">
              7
            </span>
            <h2>Contact & Updates</h2>
          </div>
          <p>
            If you have questions regarding this Privacy Policy, wish to exercise your data rights, or need to escalate a safety report, please reach out to our trust team:
          </p>
          <div className="p-4 rounded-2xl bg-surface-container-low flex items-center gap-3">
            <Mail className="w-5 h-5 text-[#0F6E56]" />
            <div>
              <span className="font-bold text-on-surface block">Trust & Safety Desk</span>
              <span className="text-outline font-mono text-[11px]">privacy@momentumhabits.app</span>
            </div>
          </div>
          <p className="text-[11px] text-outline">
            We review this policy periodically. In the event of material changes, registered practitioners will be notified through an in-app notice prior to updates taking effect.
          </p>
        </section>
      </div>

      {/* ── Footer ── */}
      <div className="pt-6 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-outline">
        <span>© 2026 Momentum Mindful Habits. All rights reserved.</span>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setView('today')}
            className="hover:text-on-surface cursor-pointer bg-transparent border-0"
          >
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => setView('challenge')}
            className="hover:text-on-surface cursor-pointer bg-transparent border-0"
          >
            Challenge Circle
          </button>
        </div>
      </div>
    </div>
  );
}
