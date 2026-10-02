import React from 'react';
import { ArrowLeft, BookOpen, Heart, Scale } from 'lucide-react';

export default function TermsPage({ setView }) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-8 select-none">
      <div className="flex flex-col items-start gap-1">
        <div>
          <button
            type="button"
            onClick={() => setView('home')}
            className="inline-flex items-center gap-1.5 text-xs text-outline hover:text-on-surface transition-colors cursor-pointer mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sanctuary</span>
          </button>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-widest text-primary-container">
          Agreement & Mindful Conduct
        </span>
        <h1 className="font-editorial text-3xl sm:text-4xl text-on-surface font-normal">
          Terms of Sanctuary
        </h1>
        <p className="text-xs text-outline">
          Last revised: September 2026 • Guidelines for our quiet, mindful collective.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-6 text-xs text-outline leading-relaxed">
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary-container" />
            <span>The Mindful Covenant</span>
          </h2>
          <p>
            Momentum is created as a digital sanctuary — an intentional space for quiet focus, self-compassion, and
            daily consistency. By entering the sanctuary, you agree to engage with reverence for your own well-being and
            that of your fellow practitioners.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-container" />
            <span>Health & Nutrition Disclaimer</span>
          </h2>
          <p>
            Suggestions provided by Momentum, including water reminders, protein goals, workout logs, and AI meal
            estimations, are intended solely for personal wellness motivation and general informational purposes. They
            do not constitute clinical dietary or medical advice. Always listen to your body and consult licensed health
            professionals for personalized dietary plans.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Scale className="w-4 h-4 text-primary-container" />
            <span>Community Challenge Guidelines</span>
          </h2>
          <p>
            Participation in the Weekly Challenge is voluntary and mindful. Unsportsmanlike conduct, automation, or
            attempting to disrupt the scoring of fellow participants is contrary to the spirit of the sanctuary and may
            result in removal from the community leaderboard.
          </p>
        </section>
      </div>
    </div>
  );
}
