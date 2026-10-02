import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserPlus,
  MessageSquare,
  Check,
  X,
  Ban,
  Shield,
  Eye,
  EyeOff,
  Clock,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMomentum } from '../../context/MomentumContext.jsx';

export default function FriendsSection({
  onOpenChat,
  onOpenProfile
}) {
  const { user } = useAuth();
  const { showToast, refreshAll } = useMomentum();

  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('friends'); // 'friends' | 'requests' | 'blocked'
  const [onlineStatusSetting, setOnlineStatusSetting] = useState(user?.showOnlineStatus !== false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [friendsRes, requestsRes, blockedRes] = await Promise.all([
        api.get('/friends').catch(() => ({ friends: [] })),
        api.get('/friends/pending').catch(() => ({ count: 0, requests: [] })),
        api.get('/moderation/blocked').catch(() => ({ blockedUsers: [] }))
      ]);

      setFriends(friendsRes.friends || []);
      setPendingRequests(requestsRes.requests || []);
      setBlockedUsers(blockedRes.blockedUsers || []);
    } catch (err) {
      console.warn('[Friends] Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Accept, Decline, or Block-and-decline
  const handleRespond = async (requestId, action) => {
    try {
      const res = await api.post('/friends/respond', { requestId, action });
      showToast(res.message || 'Request updated.');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Action failed.');
    }
  };

  // Handle Unblock
  const handleUnblock = async (targetUserId) => {
    try {
      await api.post('/moderation/unblock', { targetUserId });
      showToast('User unblocked.');
      await loadData();
    } catch (err) {
      showToast(err.message || 'Failed to unblock.');
    }
  };

  // Toggle online status
  const handleToggleOnlineStatus = async () => {
    const nextVal = !onlineStatusSetting;
    setOnlineStatusSetting(nextVal);
    try {
      await api.put('/profile', { showOnlineStatus: nextVal });
      if (user) user.showOnlineStatus = nextVal;
      showToast(nextVal ? 'Active status visible to friends.' : 'Active status hidden.');
    } catch (err) {
      setOnlineStatusSetting(!nextVal);
      showToast('Failed to update status preference.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-surface-container">
        <div className="flex items-center gap-1 bg-surface-container-low p-1 rounded-full hairline">
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors ${
              activeTab === 'friends'
                ? 'bg-[#0F6E56] text-white'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Friends ({friends.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('requests')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors relative ${
              activeTab === 'requests'
                ? 'bg-[#0F6E56] text-white'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Requests
            {pendingRequests.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blocked')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-0 transition-colors ${
              activeTab === 'blocked'
                ? 'bg-[#0F6E56] text-white'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            Blocked ({blockedUsers.length})
          </button>
        </div>

        {/* Online Status Toggle */}
        <button
          type="button"
          onClick={handleToggleOnlineStatus}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container text-xs text-outline hover:text-on-surface cursor-pointer border-0"
          title="Toggle whether friends see when you are active"
        >
          {onlineStatusSetting ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Status: Visible</span>
            </>
          ) : (
            <>
              <EyeOff className="w-3.5 h-3.5 text-stone-400" />
              <span>Status: Hidden</span>
            </>
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-8 text-center space-y-2">
          <div className="w-6 h-6 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin mx-auto" />
          <span className="text-xs text-outline italic">Syncing connections...</span>
        </div>
      ) : activeTab === 'friends' ? (
        friends.length === 0 ? (
          <div className="p-8 rounded-3xl bg-surface-container-lowest text-center space-y-2 hairline">
            <div className="text-3xl">🤝</div>
            <h4 className="font-editorial text-lg text-on-surface">No Mutual Connections Yet</h4>
            <p className="text-xs text-outline max-w-sm mx-auto leading-relaxed">
              Explore the Challenge leaderboard to find practitioners with resonant rhythms and send a gentle friend request.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {friends.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-2xl bg-surface-container-lowest hairline flex items-center justify-between gap-3 shadow-2xs hover:shadow-xs transition-shadow"
              >
                <div
                  className="flex items-center gap-3 min-w-0 cursor-pointer"
                  onClick={() => onOpenProfile?.(f.nickname)}
                >
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-xl shrink-0">
                    <span>{f.avatar || '🌱'}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-on-surface block truncate hover:text-[#0F6E56]">
                      {f.nickname}
                    </span>
                    <span className="text-[11px] text-outline block truncate">
                      {f.bio || 'Mindful habit partner'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenChat?.(f)}
                    className="px-3.5 py-1.5 rounded-full bg-[#0F6E56] hover:bg-[#168A6D] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer border-0 shadow-2xs transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'requests' ? (
        pendingRequests.length === 0 ? (
          <div className="p-8 rounded-3xl bg-surface-container-lowest text-center space-y-2 hairline">
            <div className="text-3xl">💌</div>
            <h4 className="font-editorial text-lg text-on-surface">Your Circle is Peaceful</h4>
            <p className="text-xs text-outline max-w-sm mx-auto leading-relaxed">
              No pending connection requests at this time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-surface-container-lowest hairline flex items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-xl shrink-0">
                    <span>{req.avatar || '🌱'}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-on-surface block truncate">
                      {req.nickname}
                    </span>
                    <span className="text-[11px] text-outline flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>wants to connect as habit partners</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRespond(req.id, 'accept')}
                    className="p-2 rounded-full bg-[#0F6E56] text-white hover:bg-[#168A6D] cursor-pointer border-0 shadow-2xs"
                    title="Accept connection"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespond(req.id, 'decline')}
                    className="p-2 rounded-full bg-surface-container text-outline hover:text-on-surface cursor-pointer border-0"
                    title="Decline request"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRespond(req.id, 'block')}
                    className="p-2 rounded-full bg-surface-container hover:bg-rose-500/10 text-outline hover:text-rose-700 cursor-pointer border-0"
                    title="Block and decline"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* Blocked Users Tab */
        blockedUsers.length === 0 ? (
          <div className="p-8 rounded-3xl bg-surface-container-lowest text-center space-y-2 hairline">
            <Shield className="w-8 h-8 text-[#0F6E56] mx-auto opacity-60" />
            <h4 className="font-editorial text-lg text-on-surface">No Blocked Accounts</h4>
            <p className="text-xs text-outline max-w-sm mx-auto leading-relaxed">
              You haven't blocked any accounts. Blocked users cannot message you or view your profile.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {blockedUsers.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-2xl bg-surface-container-lowest hairline flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-sm shrink-0">
                    <span>{b.avatar || '🌱'}</span>
                  </div>
                  <span className="text-xs font-semibold text-on-surface truncate">
                    {b.nickname || 'Practitioner'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleUnblock(b.id)}
                  className="px-3 py-1 rounded-full border border-surface-container text-xs text-outline hover:text-on-surface cursor-pointer bg-transparent"
                >
                  Unblock
                </button>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
