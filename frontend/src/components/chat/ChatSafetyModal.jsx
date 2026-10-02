import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, HeartHandshake, EyeOff, AlertCircle, X, ExternalLink } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMomentum } from '../../context/MomentumContext.jsx';

export default function ChatSafetyModal({
  isOpen,
  onClose,
  onAcknowledge,
  onOpenPrivacy
}) {
  const { user, setUser } = useAuth();
  const { showToast } = useMomentum();
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAgree = async () => {
    setSubmitting(true);
    try {
      await api.post('/chat/safety-acknowledge');
      if (setUser) {
        setUser((prev) => (prev ? { ...prev, chatSafetyAcknowledged: true } : prev));
      }
      showToast('🌿 Safe Sanctuary Circle guidelines acknowledged.');
      onAcknowledge?.();
    } catch (err) {
      console.warn('[ChatSafetyModal] Agreement API notice:', err);
      // Graceful fallback: acknowledge in local session so user is never trapped
      if (setUser) {
        setUser((prev) => (prev ? { ...prev, chatSafetyAcknowledged: true } : prev));
      }
      onAcknowledge?.();
    } finally {
      setSubmitting(false);
    }
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
      style={{ zIndex: 100 }}
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-3xl bg-[#FAF7F0] text-on-surface border border-surface-container shadow-2xl p-6 sm:p-8 space-y-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-safety-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container-high/60 hover:bg-surface-container-high flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0 transition-colors"
            aria-label="Close guidelines"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-center gap-3 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center shrink-0">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#0F6E56]">
              Safe Sanctuary Circle
            </span>
            <h3 id="chat-safety-title" className="font-editorial text-2xl text-on-surface font-normal">
              Mindful Community Guidelines
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-[#0F6E56]/8 border border-[#0F6E56]/20 text-xs text-on-surface leading-relaxed space-y-2">
          <p className="font-medium text-sm text-[#0B4D3C]">
            “Momentum's circle is for encouraging each other's habits — not for sharing personal information. Please don't share your phone number, address, social media, or other identifying details. Be kind. Report anything that feels wrong.”
          </p>
        </div>

        <div className="space-y-2.5 text-xs text-outline">
          <div className="flex items-start gap-2.5">
            <EyeOff className="w-4 h-4 text-[#0F6E56] shrink-0 mt-0.5" />
            <span>Automatic filtering blocks phone numbers, emails, and social handles.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-[#0F6E56] shrink-0 mt-0.5" />
            <span>Messaging is mutual opt-in only. You can block or report at any time.</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-3 rounded-full bg-surface-container hover:bg-surface-container-high text-outline hover:text-on-surface text-xs font-semibold transition-all cursor-pointer border-0"
            >
              Dismiss
            </button>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleAgree}
            className="w-full flex-1 py-3 rounded-full bg-[#0F6E56] hover:bg-[#168A6D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer border-0 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting
              ? 'Connecting...'
              : user?.chatSafetyAcknowledged
              ? 'Understood & Agreed'
              : 'I Understand & Agree'}
          </button>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={onOpenPrivacy}
            className="text-[11px] text-[#0F6E56] hover:underline text-center cursor-pointer border-0 bg-transparent inline-flex items-center justify-center gap-1"
          >
            <span>Read our full Privacy Policy</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalMarkup, document.body);
  }
  return modalMarkup;
}
