import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext.jsx';
import { ShieldCheck, Sparkles, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function SignInPage({ setView }) {
  const { loginWithGoogle, authError, sessionExpiredNotice, setSessionExpiredNotice, intendedRoute } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    setLocalError(null);
    try {
      await loginWithGoogle();
      // Redirect back to intended page or today (never home for authenticated users)
      const destination = intendedRoute && intendedRoute !== 'signin' && intendedRoute !== 'home' ? intendedRoute : 'today';
      setView(destination);
    } catch (err) {
      setLocalError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 py-12 select-none">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-surface-container-lowest hairline shadow-lg space-y-6 text-center"
      >
        {/* Brand Emblem */}
        <div className="w-16 h-16 mx-auto rounded-full bg-primary-fixed text-primary-container flex items-center justify-center shadow-xs">
          <Sparkles className="w-8 h-8 text-primary-container" />
        </div>

        {/* Title & Subtitle */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary-container">
            Sanctuary Access
          </span>
          <h1 className="font-editorial text-3xl sm:text-4xl text-on-surface font-normal">
            Welcome to Momentum
          </h1>
          <p className="text-xs text-outline leading-relaxed max-w-xs mx-auto">
            Step into your mindful-habit sanctuary. Your rhythm, notes, and progress are securely preserved.
          </p>
        </div>

        {/* Session Expired Notice */}
        {sessionExpiredNotice && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-left flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-amber-900 leading-snug">
              <span className="font-bold">Your session peacefully timed out.</span>
              <p className="text-[10px] text-amber-800/80 mt-0.5">
                Sign back in to pick up right where you left off. All your logged rhythms are safe.
              </p>
            </div>
          </motion.div>
        )}

        {/* Error Notice */}
        {(localError || authError) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-left flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
            <p className="text-xs text-red-800 leading-snug">
              {localError || authError}
            </p>
          </motion.div>
        )}

        {/* Google Sign-In Action */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isSigningIn}
            className={`w-full py-3.5 px-6 rounded-full flex items-center justify-center gap-3 font-semibold text-xs transition-all shadow-xs cursor-pointer border ${
              isSigningIn
                ? 'bg-surface-container text-outline border-outline-variant/40 cursor-wait'
                : 'bg-white hover:bg-surface-container-low text-on-surface border-outline-variant/30 hover:border-outline-variant/60 hover:shadow-sm'
            }`}
          >
            {isSigningIn ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-primary-container" />
                <span>Opening secure sanctuary gateway...</span>
              </>
            ) : (
              <>
                {/* Official Google G Icon */}
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>

        {/* Security & Privacy Commitment */}
        <div className="pt-4 hairline-t space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-outline">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-container" />
            <span>Encrypted Session • Zero Local Tracking</span>
          </div>
          <p className="text-[10px] text-outline/80 leading-relaxed">
            By signing in, you agree to our{' '}
            <button
              type="button"
              onClick={() => setView('terms')}
              className="text-primary-container underline hover:text-primary-container-hover"
            >
              Terms of Sanctuary
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setView('privacy')}
              className="text-primary-container underline hover:text-primary-container-hover"
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>

        {/* Return to Home link */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setView('home')}
            className="inline-flex items-center gap-1.5 text-xs text-outline hover:text-on-surface transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to overview</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
