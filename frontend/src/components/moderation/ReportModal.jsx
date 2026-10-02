import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { useMomentum } from '../../context/MomentumContext.jsx';

const REPORT_REASONS = [
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Hostile remarks, intimidation, or hate speech.' },
  { id: 'spam', label: 'Spam or Advertising', desc: 'Promotional links, external service handles, or repetitive text.' },
  { id: 'inappropriate', label: 'Inappropriate Content', desc: 'Content violating mindful community standards.' },
  { id: 'impersonation', label: 'Impersonation', desc: 'Pretending to be someone else.' },
  { id: 'other', label: 'Other Safety Concern', desc: 'Any other safety or privacy violation.' }
];

export default function ReportModal({
  isOpen,
  onClose,
  targetType = 'profile', // 'profile' | 'message' | 'bio'
  targetId = null,
  targetUserId,
  targetNickname = 'Practitioner'
}) {
  const { showToast } = useMomentum();
  const [selectedReason, setSelectedReason] = useState('harassment');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!targetUserId) {
      setErrorMsg('Missing target user reference');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);

    try {
      await api.post('/moderation/report', {
        targetType,
        targetId: targetId || undefined,
        targetUserId,
        reason: selectedReason,
        notes: notes.trim() || undefined
      });

      setSubmitted(true);
      showToast('Report submitted for moderation review.');
      setTimeout(() => {
        setSubmitted(false);
        setNotes('');
        onClose();
      }, 1800);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 12 }}
        className="relative w-full max-w-md rounded-3xl bg-[#FAF7F0] text-on-surface border border-surface-container shadow-2xl overflow-hidden p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-surface-container-high/60 hover:bg-surface-container-high flex items-center justify-center text-outline cursor-pointer border-0 transition-colors"
          aria-label="Close report dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-[#0F6E56]/15 text-[#0F6E56] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-editorial text-2xl text-on-surface">Thank You</h3>
            <p className="text-xs text-outline leading-relaxed max-w-xs mx-auto">
              Your report has been logged for admin review. Momentum maintains a kind, supportive sanctuary for everyone.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-rose-500/15 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 id="report-modal-title" className="font-editorial text-xl text-on-surface">
                  Report {targetType === 'message' ? 'Message' : targetNickname}
                </h3>
                <p className="text-[11px] text-outline">
                  Reports are anonymous and reviewed by our trust & safety team.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-semibold text-on-surface block">
                Reason for report:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {REPORT_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-2xl border cursor-pointer transition-colors ${
                      selectedReason === r.id
                        ? 'bg-[#0F6E56]/10 border-[#0F6E56]/40 text-on-surface'
                        : 'bg-surface-container-lowest border-surface-container hover:bg-surface-container-low text-outline'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reportReason"
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      className="mt-0.5 accent-[#0F6E56]"
                    />
                    <div className="text-left">
                      <div className="text-xs font-bold text-on-surface">{r.label}</div>
                      <div className="text-[10px] text-outline leading-tight">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-on-surface block">
                Additional context (optional):
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value.slice(0, 500))}
                rows={3}
                placeholder="Share any helpful details to assist review..."
                className="w-full p-2.5 rounded-2xl bg-surface-container-lowest border border-surface-container text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-[#0F6E56] resize-none"
              />
              <span className="text-[10px] text-outline block text-right font-mono">
                {notes.length}/500
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-surface-container text-xs font-medium text-outline hover:text-on-surface cursor-pointer bg-transparent"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer border-0 disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
