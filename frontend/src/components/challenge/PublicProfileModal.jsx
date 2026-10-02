import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Flame,
  Trophy,
  Award,
  UserPlus,
  MessageSquare,
  Shield,
  ShieldAlert,
  Ban,
  Check,
  Share2,
  ExternalLink,
  Edit3,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { useMomentum } from '../../context/MomentumContext.jsx';
import MedalDetailModal from '../medals/MedalDetailModal.jsx';
import ReportModal from '../moderation/ReportModal.jsx';

export default function PublicProfileModal({
  nickname,
  isOpen,
  onClose,
  onOpenChat,
  onBlocked
}) {
  const { showToast, state, refreshAll } = useMomentum();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  // Friend action state
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  // Selected medal for 3D inspection
  const [selectedMedal, setSelectedMedal] = useState(null);

  // Report modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Block confirmation state
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [blockingLoading, setBlockingLoading] = useState(false);

  // Self bio editing state
  const [editingBio, setEditingBio] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    if (!isOpen || !nickname) return;

    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/profile/public/${encodeURIComponent(nickname.trim())}`);
        if (isMounted) {
          setProfile(data.profile);
          setBioInput(data.profile.bio || '');
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Sanctuary profile not found or private.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [isOpen, nickname]);

  if (!isOpen) return null;

  // Add friend handler
  const handleAddFriend = async () => {
    if (!profile?.id) return;
    setFriendActionLoading(true);
    try {
      const res = await api.post('/friends/request', { targetUserId: profile.id });
      setProfile((prev) => ({
        ...prev,
        friendshipStatus: res.status || 'request_sent'
      }));
      showToast(res.message || 'Friend request sent!');
    } catch (err) {
      showToast(err.message || 'Could not send friend request.');
    } finally {
      setFriendActionLoading(false);
    }
  };

  // Block user handler
  const handleBlockUser = async () => {
    if (!profile?.id) return;
    setBlockingLoading(true);
    try {
      await api.post('/moderation/block', { targetUserId: profile.id });
      showToast(`${profile.nickname} has been blocked.`);
      onBlocked?.(profile.id);
      onClose();
    } catch (err) {
      showToast(err.message || 'Failed to block user.');
    } finally {
      setBlockingLoading(false);
      setConfirmBlockOpen(false);
    }
  };

  // Save bio handler (for self)
  const handleSaveBio = async () => {
    setSavingBio(true);
    try {
      await api.put('/profile', {
        challenge: {
          bio: bioInput.trim()
        }
      });
      setProfile((prev) => ({ ...prev, bio: bioInput.trim() }));
      setEditingBio(false);
      showToast('Bio updated.');
      await refreshAll();
    } catch (err) {
      showToast(err.message || 'Failed to update bio.');
    } finally {
      setSavingBio(false);
    }
  };

  // Copy shareable profile link
  const handleCopyLink = () => {
    const url = `${window.location.origin}/#challenge-u-${encodeURIComponent(profile?.nickname || nickname)}`;
    navigator.clipboard.writeText(url);
    showToast('Profile sanctuary link copied!');
  };

  const isSelf = profile?.friendshipStatus === 'self';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md rounded-3xl bg-[#FAF7F0] text-on-surface border border-surface-container shadow-2xl overflow-hidden my-auto"
          role="dialog"
          aria-modal="true"
          aria-label={profile ? `${profile.nickname}'s Public Profile` : 'Public Profile'}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-surface-container/60">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#0F6E56]">
              {isSelf ? 'Your Public Profile' : 'Challenge Sanctuary Profile'}
            </span>
            <div className="flex items-center gap-1.5">
              {profile && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0 transition-colors"
                  aria-label="Share profile link"
                  title="Copy profile link"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-surface-container-low hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0 transition-colors"
                aria-label="Close profile modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin mx-auto" />
              <p className="text-xs text-outline italic">Opening sanctuary rhythm...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-700 flex items-center justify-center mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-editorial text-xl text-on-surface">Profile Unavailable</h3>
              <p className="text-xs text-outline leading-relaxed max-w-xs mx-auto">
                {error}
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 px-5 py-2 rounded-full bg-surface-container-high text-xs font-semibold text-on-surface cursor-pointer border-0"
              >
                Close
              </button>
            </div>
          ) : profile ? (
            <div className="p-6 space-y-6">
              {/* Profile Identity Card */}
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-surface-container-lowest border-2 border-surface-container flex items-center justify-center text-4xl shadow-md mb-3">
                  <span>{profile.avatar}</span>
                </div>
                <h2 className="font-editorial text-2xl text-on-surface font-normal">
                  {profile.nickname}
                </h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap justify-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#0F6E56]/10 text-[#0F6E56] text-xs font-semibold">
                    <Trophy className="w-3.5 h-3.5" />
                    <span>{profile.percentile}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-semibold">
                    <Flame className="w-3.5 h-3.5 fill-amber-500" />
                    <span>{profile.streak} Day Streak</span>
                  </span>
                </div>
              </div>

              {/* Bio Section */}
              <div className="p-4 rounded-2xl bg-surface-container-lowest hairline">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-outline">
                    Practitioner Bio
                  </span>
                  {isSelf && !editingBio && (
                    <button
                      type="button"
                      onClick={() => setEditingBio(true)}
                      className="text-[11px] text-[#0F6E56] font-semibold hover:underline flex items-center gap-1 cursor-pointer border-0 bg-transparent"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  )}
                </div>

                {editingBio ? (
                  <div className="space-y-2">
                    <textarea
                      value={bioInput}
                      onChange={(e) => setBioInput(e.target.value.slice(0, 150))}
                      rows={3}
                      placeholder="Share a mindful intention (max 150 chars)..."
                      className="w-full p-2.5 rounded-xl bg-surface-container-low border border-surface-container text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-[#0F6E56] resize-none"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-outline font-mono">{bioInput.length}/150</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setBioInput(profile.bio || '');
                            setEditingBio(false);
                          }}
                          className="px-3 py-1 rounded-full border border-surface-container text-outline hover:text-on-surface cursor-pointer bg-transparent"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={savingBio}
                          onClick={handleSaveBio}
                          className="px-3 py-1 rounded-full bg-[#0F6E56] text-white font-semibold cursor-pointer border-0 disabled:opacity-50"
                        >
                          {savingBio ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-on-surface/90 italic leading-relaxed">
                    “{profile.bio || 'Gently shaping mindful habits one day at a time.'}”
                  </p>
                )}
              </div>

              {/* Earned Medals Showcase (Strictly Safe: No codes on visited profile) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-outline flex items-center gap-1">
                    <Award className="w-3.5 h-3.5 text-[#0F6E56]" />
                    <span>Earned Medals ({profile.earnedMedals?.length || 0})</span>
                  </span>
                  <span className="text-[10px] text-outline">Tap to view in 3D</span>
                </div>

                {profile.earnedMedals?.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-surface-container-lowest text-center text-xs text-outline italic hairline">
                    No milestone medals earned yet this cycle.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2.5">
                    {profile.earnedMedals.map((m) => {
                      const tier = (m.tier || 'Bronze').toLowerCase();
                      const tierColors = {
                        bronze: 'bg-amber-950/5 border-amber-700/30 text-amber-800',
                        silver: 'bg-slate-100 border-slate-300 text-slate-800',
                        gold: 'bg-amber-100 border-amber-300 text-amber-900',
                        platinum: 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      };

                      return (
                        <button
                          key={m.id || m.medalId}
                          type="button"
                          onClick={() => setSelectedMedal(m)}
                          className={`p-3 rounded-2xl border hairline text-left transition-all hover:scale-[1.02] cursor-pointer ${
                            tierColors[tier] || tierColors.bronze
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">
                              {tier === 'platinum' ? '💠' : tier === 'gold' ? '🌟' : tier === 'silver' ? '🕊️' : '🌱'}
                            </span>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold block truncate">{m.name}</span>
                              <span className="text-[10px] opacity-70 block">{m.tier} Tier</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Friendship & Interaction Action Row */}
              <div className="pt-2">
                {isSelf ? (
                  <div className="p-3 rounded-2xl bg-[#0F6E56]/10 text-center text-xs text-[#0F6E56] font-semibold">
                    This is your public appearance in the Sanctuary Challenge.
                  </div>
                ) : profile.friendshipStatus === 'friends' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenChat?.({
                          id: profile.id,
                          nickname: profile.nickname,
                          avatar: profile.avatar
                        });
                      }}
                      className="flex-1 py-3 rounded-full bg-[#0F6E56] hover:bg-[#168A6D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer border-0 flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Message Friend</span>
                    </button>
                    <span className="px-3.5 py-3 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold flex items-center gap-1 border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" />
                      <span>Friends</span>
                    </span>
                  </div>
                ) : profile.friendshipStatus === 'request_sent' ? (
                  <div className="p-3 rounded-full bg-surface-container text-center text-xs text-outline font-semibold flex items-center justify-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    <span>Friend Request Sent</span>
                  </div>
                ) : profile.friendshipStatus === 'request_received' ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={friendActionLoading}
                      onClick={handleAddFriend}
                      className="flex-1 py-3 rounded-full bg-[#0F6E56] hover:bg-[#168A6D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer border-0 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Accept Friend Request</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={friendActionLoading}
                    onClick={handleAddFriend}
                    className="w-full py-3 rounded-full bg-[#0F6E56] hover:bg-[#168A6D] text-white text-xs font-bold transition-all shadow-xs cursor-pointer border-0 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>{friendActionLoading ? 'Connecting...' : 'Add Friend'}</span>
                  </button>
                )}
              </div>

              {/* Moderation Actions (Phase C3 & D5) */}
              {!isSelf && (
                <div className="pt-2 border-t border-surface-container flex items-center justify-between text-xs text-outline">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Report Practitioner</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmBlockOpen(true)}
                    className="hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer bg-transparent border-0"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Block</span>
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </motion.div>
      </div>

      {/* 3D Medal Detail Modal for Earned Medals (Viewer mode) */}
      {selectedMedal && (
        <MedalDetailModal
          medal={selectedMedal}
          isOpen={Boolean(selectedMedal)}
          onClose={() => setSelectedMedal(null)}
          isOtherUser={!isSelf}
          ownerNickname={profile?.nickname}
        />
      )}

      {/* Trust & Safety Report Modal */}
      {reportModalOpen && profile && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => setReportModalOpen(false)}
          targetType="profile"
          targetUserId={profile.id}
          targetNickname={profile.nickname}
        />
      )}

      {/* Block Confirmation Dialog */}
      {confirmBlockOpen && profile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-sm rounded-3xl bg-[#FAF7F0] p-6 text-on-surface shadow-2xl border border-surface-container space-y-4"
          >
            <div className="w-10 h-10 rounded-full bg-rose-500/15 text-rose-700 flex items-center justify-center">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-editorial text-lg text-on-surface">Block {profile.nickname}?</h4>
              <p className="text-xs text-outline mt-1 leading-relaxed">
                They will not be able to message you, send friend requests, or view your sanctuary profile. Existing connections will be removed immediately.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmBlockOpen(false)}
                className="px-4 py-2 rounded-full border border-surface-container text-xs font-semibold text-outline hover:text-on-surface bg-transparent cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={blockingLoading}
                onClick={handleBlockUser}
                className="px-5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer border-0 disabled:opacity-50"
              >
                {blockingLoading ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
