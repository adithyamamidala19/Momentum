import React from 'react';
import { ShieldCheck, Database, Lock, Trash2, ArrowLeft } from 'lucide-react';

export default function PrivacyPage({ setView }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 select-none">
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => setView('home')}
          className="inline-flex items-center gap-1.5 text-xs text-outline hover:text-on-surface transition-colors cursor-pointer mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Sanctuary</span>
        </button>
        <span className="text-[10px] uppercase font-bold tracking-widest text-primary-container">
          Transparency & Trust
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl text-on-surface font-normal">
          Privacy Policy
        </h1>
        <p className="text-xs text-outline">
          Last revised: September 2026 • Plain language commitment to your sanctuary data.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-6 text-xs text-outline leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary-container" />
            <span>Our Privacy Philosophy</span>
          </h2>
          <p>
            Your rhythm data is private to your account. We never sell, rent, monetize, or broker your personal habits,
            reflections, workouts, or nutritional logs to advertisers or data aggregators.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Database className="w-4 h-4 text-primary-container" />
            <span>What We Store and Where</span>
          </h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>
              <strong className="text-on-surface">Account Identity:</strong> Your Firebase Google UID, email address,
              and display name. Stored in MongoDB Atlas encrypted clusters.
            </li>
            <li>
              <strong className="text-on-surface">Habits, Water & Protein Logs:</strong> Daily check-ins, hydration
              timestamps, and nutritional entries are saved under your encrypted user ID.
            </li>
            <li>
              <strong className="text-on-surface">No Local Browser Storage:</strong> To prevent unauthorized device-level
              inspection, Momentum stores zero habit data in your browser’s localStorage, sessionStorage, or IndexedDB.
              All data is transmitted through encrypted TLS with httpOnly session cookies.
            </li>
            <li>
              <strong className="text-on-surface">Meal Photo Scans:</strong> Images analyzed via our AI Food Vision
              service are processed transiently in server memory to estimate caloric and protein amounts. The image
              buffer is immediately discarded and never saved to persistent storage.
            </li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary-container" />
            <span>Community Challenge Anonymity</span>
          </h2>
          <p>
            If you choose to opt into the Weekly Sanctuary Challenge, only your chosen pseudonym and botanical avatar
            are published to the weekly community leaderboard. Your real name, email, and photo remain strictly private.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-primary-container" />
            <span>Data Sovereignty & Deletion</span>
          </h2>
          <p>
            You have complete sovereignty over your information. At any moment in your Profile settings, you can export
            a comprehensive JSON archive of your entire history, or permanently delete your account. Deletion executes
            an irreversible hard purge across all databases and revokes your identity from Firebase.
          </p>
        </section>
      </div>
    </div>
  );
}
