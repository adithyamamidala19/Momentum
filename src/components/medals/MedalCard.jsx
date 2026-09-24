import React, { useState, useRef } from 'react';
import { Award, Share2, Sparkles, CheckCircle2, Lock, ArrowRight } from 'lucide-react';
import { useMomentum } from '../../context/MomentumContext.jsx';

export default function MedalCard({ medal, isNext = false }) {
  const [flipped, setFlipped] = useState(false);
  const cardRef = useRef(null);
  const { showToast } = useMomentum();

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--spec-x', `${x}%`);
    cardRef.current.style.setProperty('--spec-y', `${y}%`);
  };

  const handleShare = (e) => {
    e.stopPropagation();
    const shareTitle = `Momentum Milestone: ${medal.name}`;
    const shareText = medal.achieved
      ? `I earned the ${medal.tier} milestone (${medal.threshold}) on Momentum!`
      : `I am currently pursuing the ${medal.tier} milestone on Momentum!`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      showToast('Milestone link copied to clipboard.');
    }
  };

  const tier = medal.tier?.toLowerCase() || 'bronze';
  const isAchieved = Boolean(medal.achieved);

  // Status classes
  let containerStatusClass = '';
  if (!isAchieved) {
    containerStatusClass = isNext ? 'medal-card-next' : 'medal-card-locked';
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onClick={() => setFlipped(prev => !prev)}
      className={`realistic-medal-card cursor-pointer select-none h-80 relative transition-transform duration-300 hover:-translate-y-1 ${containerStatusClass}`}
      style={{ perspective: '1200px' }}
    >
      <div className={`medal-card-flipper h-full ${flipped ? 'flipped' : ''}`}>
        {/* ── FRONT FACE ── */}
        <div className="medal-face-front h-full flex flex-col items-center justify-between p-5 sm:p-6 text-center">
          <div className="flex items-center justify-between w-full">
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full ${
                isAchieved
                  ? 'bg-white/10 text-white/90'
                  : isNext
                  ? 'bg-[#0F6E56]/30 text-emerald-300 border border-emerald-500/30'
                  : 'bg-white/5 text-white/40'
              }`}
            >
              {medal.threshold || 'Milestone'}
            </span>

            {isAchieved ? (
              <Sparkles className="w-4 h-4 text-amber-300 drop-shadow-sm" />
            ) : isNext ? (
              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                Next <ArrowRight className="w-3 h-3" />
              </span>
            ) : (
              <Lock className="w-3.5 h-3.5 text-white/30" />
            )}
          </div>

          {/* 3D Specular Disc */}
          <div className="relative my-auto">
            <div className={`medal-disc-wrapper medal-${tier} shadow-2xl`}>
              <Award className="w-8 h-8 text-white drop-shadow-md" />
              <div className="medal-specular-glint" />
            </div>

            {!isAchieved && (
              <div className="absolute inset-0 rounded-full bg-black/40 backdrop-blur-[2px] flex items-center justify-center">
                <Lock className="w-5 h-5 text-white/70" />
              </div>
            )}
          </div>

          {/* Bottom Title & Progress */}
          <div className="w-full">
            <h3 className="font-editorial text-lg sm:text-xl font-normal text-white">
              {medal.name}
            </h3>
            <p className="text-xs text-white/60 capitalize mt-0.5">
              {medal.tier} Tier {medal.date ? `· ${medal.date}` : ''}
            </p>

            {/* Progress bar for locked medals */}
            {!isAchieved && (
              <div className="mt-3 w-full">
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-[#0F6E56] rounded-full transition-all duration-500"
                    style={{ width: `${medal.progressPct || 0}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/50 mt-1 font-mono">
                  <span>{medal.progress || 0} / {medal.targetDays} days</span>
                  <span>{medal.remainingDays} days to go</span>
                </div>
              </div>
            )}

            <span className="text-[10px] text-white/40 block mt-2">
              Tap to inspect certificate
            </span>
          </div>
        </div>

        {/* ── BACK FACE (Verified Certificate) ── */}
        <div className="medal-face-back flex flex-col justify-between p-5 sm:p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span
                className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  isAchieved ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {isAchieved ? 'Verified Milestone' : 'Rhythm In Progress'}
              </span>
              {isAchieved ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <Lock className="w-4 h-4 text-amber-400" />
              )}
            </div>

            <h4 className="font-editorial text-lg text-white">
              {medal.name}
            </h4>
            <p className="text-xs text-white/70 leading-relaxed">
              {medal.description ||
                'Awarded for unwavering consistency and gentle presence along your daily rhythm journey.'}
            </p>
            <div className="p-3 rounded-xl bg-white/5 text-[11px] text-white/60 italic border border-white/5">
              “Slow is smooth, smooth is fast.”
            </div>
          </div>

          <div className="pt-3 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-white/40">
              {isAchieved ? (medal.date || 'Earned 2026') : `${medal.remainingDays} days remaining`}
            </span>
            <button
              type="button"
              onClick={handleShare}
              className="px-3.5 py-1.5 rounded-full bg-[#0F6E56] text-white text-xs font-bold hover:bg-[#0B5240] transition-all flex items-center gap-1.5 cursor-pointer border-0 shadow-sm"
            >
              <Share2 className="w-3 h-3" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
