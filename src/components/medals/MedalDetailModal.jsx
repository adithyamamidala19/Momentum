import React, { Suspense, lazy, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  Download,
  Copy,
  CheckCircle2,
  Lock,
  Sparkles,
  ShieldCheck,
  RotateCw,
  Award
} from 'lucide-react';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { executeShareFlow, generateShareCardBlob } from './shareHelper.js';

// Lazy load the 3D bundle so it never impacts flat grid or main page performance
const Medal3D = lazy(() => import('./Medal3D.jsx'));

export default function MedalDetailModal({
  medal,
  isOpen,
  onClose,
  isOtherUser = false,
  ownerNickname = null
}) {
  const { state, showToast, setChallengeProfile } = useMomentum();
  const { user } = useAuth();
  const [sharing, setSharing] = useState(false);
  const [fallbackData, setFallbackData] = useState(null);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [downloadingImg, setDownloadingImg] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);

  // Nickname prompt state if user hasn't set challenge nickname
  const [nicknamePromptOpen, setNicknamePromptOpen] = useState(false);
  const [customNickname, setCustomNickname] = useState('');

  const modalRef = useRef(null);

  if (!isOpen || !medal) return null;

  const currentNickname = isOtherUser
    ? ownerNickname || 'Practitioner'
    : state.challengeNickname || user?.displayName?.split(' ')[0] || 'Practitioner';

  const tier = (medal.tier || 'bronze').toLowerCase();
  const isAchieved = Boolean(medal.achieved);

  // Handle Share trigger
  const handleShareClick = async () => {
    if (!isAchieved) {
      showToast('You must complete this milestone before sharing it.');
      return;
    }

    // If own medal, ensure challenge nickname is ready for public sharing
    if (!isOtherUser && !state.challengeNickname && !user?.displayName) {
      setNicknamePromptOpen(true);
      return;
    }

    setSharing(true);
    try {
      const canvas = modalRef.current?.querySelector('canvas');
      await executeShareFlow({
        medal,
        nickname: currentNickname,
        canvasElement: canvas,
        onOpenFallbackModal: (data) => setFallbackData(data)
      });
    } catch (e) {
      console.warn('[Share] Flow notice:', e);
      showToast(e.message || 'Could not verify or share medal.');
    } finally {
      setSharing(false);
    }
  };

  // Download generated PNG card
  const handleDownloadCard = async () => {
    if (!isAchieved) {
      showToast('You must complete this milestone before downloading the card.');
      return;
    }

    setDownloadingImg(true);

    try {
      const canvas = modalRef.current?.querySelector('canvas');
      const blob = await generateShareCardBlob({
        canvasElement: canvas,
        medal,
        nickname: currentNickname
      });
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `momentum-${tier}-medal-${currentNickname.toLowerCase()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Medal card saved to downloads.');
      }
    } catch (e) {
      console.error(e);
      showToast('Could not download image.');
    } finally {
      setDownloadingImg(false);
    }
  };

  const handleCopyCaption = () => {
    if (!fallbackData) return;
    navigator.clipboard.writeText(`${fallbackData.shareText}\n${fallbackData.shareUrl}`);
    setCopiedCaption(true);
    showToast('Caption & sanctuary link copied!');
    setTimeout(() => setCopiedCaption(false), 2400);
  };

  const handleSaveNickname = (e) => {
    e.preventDefault();
    if (customNickname.trim()) {
      setChallengeProfile?.(customNickname.trim(), '🌱');
      setNicknamePromptOpen(false);
      showToast('Sanctuary nickname set!');
      // Proceed to share
      setTimeout(handleShareClick, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        ref={modalRef}
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg rounded-3xl bg-[#0B241E] text-white border border-white/10 shadow-2xl overflow-hidden flex flex-col my-auto"
        role="dialog"
        aria-modal="true"
        aria-label={`${medal.name} 3D Medal Details`}
      >
        {/* Top Action Bar */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2 z-10">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full border ${
                isAchieved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-white/10 text-white/50 border-white/10'
              }`}
            >
              {medal.tier} Tier
            </span>
            {isAchieved && (
              <span className="text-[11px] text-[#A0F3D4] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer border-0 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── 3D Canvas Container ── */}
        <div className="relative w-full h-80 sm:h-96 flex items-center justify-center">
          <Suspense
            fallback={
              <div className="flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                <span className="text-xs text-white/60 tracking-wider">Polishing specular 3D metal...</span>
              </div>
            }
          >
            <Medal3D
              tier={tier}
              name={medal.name}
              nickname={currentNickname}
              date={medal.date}
              verificationCode={medal.verificationCode}
              isOtherUser={isOtherUser}
              achieved={isAchieved}
              isFlipped={isFlipped}
              autoSpin={autoSpin}
            />
          </Suspense>

          {/* Interactive controls bar & drag hint */}
          <div className="absolute bottom-3 inset-x-4 flex items-center justify-between pointer-events-none">
            <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] text-white/80 flex items-center gap-1.5 shadow-sm">
              <RotateCw className="w-3 h-3 text-emerald-400" />
              <span>Drag to spin 360°</span>
            </div>

            <div className="flex items-center gap-2 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsFlipped((prev) => !prev)}
                className="px-3.5 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 border border-white/25 text-xs font-semibold text-white flex items-center gap-1.5 cursor-pointer backdrop-blur-md transition-all shadow-md"
                title={isFlipped ? 'Flip to Front Face' : 'Flip to Back Certificate'}
              >
                <RotateCw
                  className={`w-3.5 h-3.5 text-emerald-300 transition-transform duration-500 ${
                    isFlipped ? 'rotate-180' : ''
                  }`}
                />
                <span>{isFlipped ? 'Show Front' : 'Flip to Certificate'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Medal Metadata & Information ── */}
        <div className="p-6 bg-gradient-to-t from-black/80 to-transparent space-y-4">
          <div className="text-center">
            <h2 className="font-editorial text-2xl sm:text-3xl text-white font-normal">
              {medal.name}
            </h2>
            <p className="text-xs text-white/70 max-w-sm mx-auto mt-1 leading-relaxed">
              {medal.description || 'Awarded for unwavering consistency and gentle presence along your daily rhythm.'}
            </p>
          </div>

          {/* Verification Code Box (Only for own earned medals; never shown on others' medals) */}
          {!isOtherUser && isAchieved && medal.verificationCode && (
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-white/60 text-[11px]">Certificate Code:</span>
                <span className="font-mono font-bold text-emerald-300 text-[11px] tracking-wider">
                  {medal.verificationCode}
                </span>
              </div>
              <span className="text-[10px] text-white/40">Verified on MongoDB</span>
            </div>
          )}

          {/* Locked Progress Bar */}
          {!isAchieved && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70 font-medium">Trajectory Progress</span>
                <span className="font-mono text-white/90">
                  {medal.progress || 0} / {medal.targetDays} Days
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                  style={{ width: `${medal.progressPct || 0}%` }}
                />
              </div>
              <span className="text-[11px] text-white/50 block text-right">
                {medal.remainingDays || 0} days remaining to earn
              </span>
            </div>
          )}

          {/* Action Bar (Share available ONLY after genuinely completing required activity) */}
          {isAchieved ? (
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleShareClick}
                disabled={sharing}
                className="flex-1 py-3 px-5 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer border-0 shadow-lg active:scale-95 disabled:opacity-50"
              >
                <Share2 className="w-4 h-4" />
                <span>{sharing ? 'Verifying & Preparing...' : 'Share Medal'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadCard}
                disabled={downloadingImg}
                className="py-3 px-4 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-0 transition-colors"
                aria-label="Download medal card"
                title="Download Card (PNG)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">{downloadingImg ? 'Saving...' : 'Download'}</span>
              </button>
            </div>
          ) : (
            <div className="pt-2">
              <div className="w-full py-3 px-4 rounded-full bg-white/5 border border-white/10 text-white/50 text-xs font-medium flex items-center justify-center gap-2 select-none">
                <Lock className="w-4 h-4 text-white/40" />
                <span>Complete {medal.targetDays}-day rhythm to unlock sharing</span>
              </div>
            </div>
          )}
        </div>


        {/* ── Fallback Desktop Share Modal (Tier 3) ── */}
        <AnimatePresence>
          {fallbackData && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="p-6 rounded-3xl bg-[#0B241E] border border-white/20 text-center max-w-sm w-full space-y-4 shadow-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto">
                  <Share2 className="w-6 h-6" />
                </div>
                <h3 className="font-editorial text-xl text-white">Share Your Medal</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  Web Share is unavailable on desktop. Download your custom high-res medal card or copy the caption below to share anywhere.
                </p>

                <div className="p-3 rounded-2xl bg-black/40 border border-white/10 text-left text-xs text-white/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-400">Caption Preview</span>
                  <p className="text-[11px] leading-relaxed text-white/70">
                    "{fallbackData.shareText}"
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleDownloadCard}
                    className="w-full py-3 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center justify-center gap-2 cursor-pointer border-0 shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Share Image (PNG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCaption}
                    className="w-full py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer border-0 transition-colors"
                  >
                    {copiedCaption ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCaption ? 'Copied to Clipboard!' : 'Copy Caption & Link'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setFallbackData(null)}
                  className="text-xs text-white/50 hover:text-white pt-2 cursor-pointer border-0 bg-transparent block mx-auto"
                >
                  Close
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ── Nickname Setup Modal for Public Share Safety ── */}
        <AnimatePresence>
          {nicknamePromptOpen && (
            <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <motion.form
                onSubmit={handleSaveNickname}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="p-6 rounded-3xl bg-[#0B241E] border border-white/20 text-center max-w-sm w-full space-y-4 shadow-2xl"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <h3 className="font-editorial text-xl text-white">Choose Your Nickname</h3>
                <p className="text-xs text-white/70 leading-relaxed">
                  To protect your privacy, public share cards always use your Challenge Nickname instead of your real name or email.
                </p>

                <input
                  type="text"
                  maxLength={24}
                  placeholder="e.g. ZenWalker or SageRhythm"
                  value={customNickname}
                  onChange={(e) => setCustomNickname(e.target.value)}
                  className="w-full px-4 py-3 rounded-full bg-black/40 border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-emerald-400"
                  required
                  autoFocus
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setNicknamePromptOpen(false)}
                    className="flex-1 py-2.5 rounded-full bg-white/10 text-white text-xs font-semibold cursor-pointer border-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-full bg-primary text-white text-xs font-bold cursor-pointer border-0 shadow-sm"
                  >
                    Confirm & Share
                  </button>
                </div>
              </motion.form>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
