import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { useMomentum } from '../context/MomentumContext.jsx';
import { api } from '../services/apiClient.js';
import {
  User,
  Download,
  Trash2,
  ShieldAlert,
  Sparkles,
  Heart,
  ShieldCheck,
  Clock,
  Sliders,
  Target,
  Trophy,
  RefreshCw,
  LogOut
} from 'lucide-react';

export default function ProfilePage({ setView }) {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useMomentum();

  // Profile fields state
  const [displayName, setDisplayName] = useState(user?.displayName || 'Mindful Practitioner');
  const [mantra, setMantra] = useState(user?.mantra || 'Slow is smooth, smooth is fast.');
  const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [weightUnit, setWeightUnit] = useState(user?.units?.weight || 'kg');
  const [volumeUnit, setVolumeUnit] = useState(user?.units?.volume || 'ml');

  // Goals
  const [waterGoal, setWaterGoal] = useState(user?.goals?.waterMl || 2000);
  const [proteinGoal, setProteinGoal] = useState(user?.goals?.proteinG || 90);
  const [focusGoal, setFocusGoal] = useState(user?.goals?.focusMin || 25);

  // Challenge settings
  const [challengeOptIn, setChallengeOptIn] = useState(user?.challenge?.optedIn || false);
  const [challengeNickname, setChallengeNickname] = useState(user?.challenge?.nickname || '');
  const [challengeAvatar, setChallengeAvatar] = useState(user?.challenge?.avatar || '🌱');

  // Theme
  const [theme, setTheme] = useState(user?.theme || 'cream');

  // Modal / status states
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');

  // Sync state if user loads later
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || 'Mindful Practitioner');
      setMantra(user.mantra || 'Slow is smooth, smooth is fast.');
      setTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      setWeightUnit(user.units?.weight || 'kg');
      setVolumeUnit(user.units?.volume || 'ml');
      setWaterGoal(user.goals?.waterMl || 2000);
      setProteinGoal(user.goals?.proteinG || 90);
      setFocusGoal(user.goals?.focusMin || 25);
      setChallengeOptIn(user.challenge?.optedIn || false);
      setChallengeNickname(user.challenge?.nickname || '');
      setChallengeAvatar(user.challenge?.avatar || '🌱');
      setTheme(user.theme || 'cream');
    }
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        displayName,
        mantra,
        timezone,
        units: { weight: weightUnit, volume: volumeUnit },
        goals: { waterMl: Number(waterGoal), proteinG: Number(proteinGoal), focusMin: Number(focusGoal) },
        challenge: { optedIn: challengeOptIn, nickname: challengeNickname, avatar: challengeAvatar },
        theme
      };

      await api.put('/profile', payload);
      await refreshUser();
      showToast('Profile and sanctuary preferences saved.');
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const data = await api.get('/profile/export');
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `momentum_sanctuary_export_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast('Sanctuary rhythm data exported successfully.');
    } catch (err) {
      showToast(`Export failed: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationInput !== 'DELETE') {
      showToast('Please type DELETE to confirm permanent account purge.');
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete('/profile/account');
      showToast('Account and all sanctuary data permanently erased.');
      setTimeout(() => {
        window.location.hash = 'home';
        window.location.reload();
      }, 1000);
    } catch (err) {
      showToast(`Deletion failed: ${err.message}`);
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-primary-container">
            Sanctuary Identity & Preferences
          </span>
          <h1 className="font-editorial text-3xl font-normal text-on-surface mt-0.5">
            Profile & Settings
          </h1>
          <p className="text-xs text-outline">
            Personalize your rhythm, configure daily intentions, and manage data sovereignty.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="self-start sm:self-auto px-4 py-2 rounded-full hairline bg-surface-container-low hover:bg-surface-container text-xs font-semibold text-outline hover:text-on-surface flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-outline" />
          <span>Sign Out</span>
        </button>
      </div>

      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Identity Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-5">
          <div className="flex items-center gap-4 pb-4 hairline-b">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={displayName}
                className="w-16 h-16 rounded-full object-cover shadow-xs border-2 border-primary-container/20"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary-container flex items-center justify-center font-bold text-xl shadow-xs">
                {displayName.charAt(0) || 'A'}
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-on-surface">{displayName}</h2>
              <p className="text-xs text-outline italic">“{mantra}”</p>
              <p className="text-[10px] text-outline/80 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">Personal Daily Mantra</label>
              <input
                type="text"
                value={mantra}
                onChange={(e) => setMantra(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-primary-container" />
                <span>Timezone (Midnight boundary calculation)</span>
              </label>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-primary-container" />
                <span>Measurement Units</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={weightUnit}
                  onChange={(e) => setWeightUnit(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                >
                  <option value="kg">Weight: Kilograms (kg)</option>
                  <option value="lb">Weight: Pounds (lb)</option>
                </select>
                <select
                  value={volumeUnit}
                  onChange={(e) => setVolumeUnit(e.target.value)}
                  className="px-3 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                >
                  <option value="ml">Liquid: Milliliters (ml)</option>
                  <option value="oz">Liquid: Ounces (oz)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Intentions / Goals */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
            <Target className="w-4 h-4 text-primary-container" />
            <span>Daily Intentions & Targets</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">Water Intention (ml)</label>
              <input
                type="number"
                step="250"
                min="500"
                max="8000"
                value={waterGoal}
                onChange={(e) => setWaterGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
              <span className="text-[10px] text-outline mt-1 block">Default: 2000 ml (8 glasses)</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">Protein Intention (g)</label>
              <input
                type="number"
                step="5"
                min="30"
                max="400"
                value={proteinGoal}
                onChange={(e) => setProteinGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
              <span className="text-[10px] text-outline mt-1 block">Default: 90 grams</span>
            </div>

            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">Focus Intention (minutes)</label>
              <input
                type="number"
                step="5"
                min="5"
                max="240"
                value={focusGoal}
                onChange={(e) => setFocusGoal(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
              <span className="text-[10px] text-outline mt-1 block">Default: 25 minutes</span>
            </div>
          </div>
        </div>

        {/* Weekly Challenge Anonymous Profile */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-on-surface">Weekly Sanctuary Challenge</h3>
                <p className="text-xs text-outline">
                  Opt into friendly community rhythm inspiration. Your real name and email are never shown.
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={challengeOptIn}
                onChange={(e) => setChallengeOptIn(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-surface-container peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-container"></div>
            </label>
          </div>

          {challengeOptIn && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 hairline-t">
              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">Sanctuary Nickname</label>
                <input
                  type="text"
                  value={challengeNickname}
                  placeholder="e.g. QuietFern, PineNeedle"
                  onChange={(e) => setChallengeNickname(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface block mb-1">Botanical Avatar</label>
                <select
                  value={challengeAvatar}
                  onChange={(e) => setChallengeAvatar(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
                >
                  <option value="🌱">🌱 Sprout</option>
                  <option value="🌿">🌿 Fern</option>
                  <option value="🌲">🌲 Cedar</option>
                  <option value="🪷">🪷 Lotus</option>
                  <option value="🪨">🪨 River Stone</option>
                  <option value="🌊">🌊 Tide</option>
                  <option value="☀️">☀️ Sunlit</option>
                  <option value="✨">✨ Glow</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div>
          <button
            type="submit"
            disabled={isSaving}
            className="px-8 py-3 rounded-full bg-primary-container hover:bg-primary-container-hover text-white text-xs font-semibold cursor-pointer border-0 shadow-xs transition-all flex items-center gap-2"
          >
            {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Preferences</span>
          </button>
        </div>
      </form>

      {/* Data Sovereignty & Privacy Controls */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-on-surface flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary-container" />
          <span>Data Sovereignty & Privacy</span>
        </h3>
        <p className="text-xs text-outline leading-relaxed">
          Your data belongs to you. You can export a verified JSON copy of your entire sanctuary rhythm history, or
          permanently delete your account and all associated documents across our encrypted MongoDB cluster.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-2 cursor-pointer border-0 transition-colors"
          >
            {isExporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5 text-primary-container" />}
            <span>Export My Data (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-5 py-2.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-700 flex items-center gap-2 cursor-pointer border border-red-500/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-600" />
            <span>Delete My Account</span>
          </button>
        </div>
      </div>

      {/* Irreversible Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white shadow-2xl space-y-5 border border-red-200">
            <div className="flex items-center gap-3 text-red-600">
              <ShieldAlert className="w-6 h-6" />
              <h4 className="font-editorial text-xl font-normal text-on-surface">Permanently Delete Account?</h4>
            </div>

            <p className="text-xs text-outline leading-relaxed">
              This action is <strong className="text-red-700">irreversible</strong>. It will immediately hard-delete
              all your habits, streaks, focus sessions, workouts, PRs, hydration logs, and nutritional history across
              all databases, remove you from community rankings, and delete your Google authentication identity.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-on-surface block">
                Type <strong className="text-red-700">DELETE</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low border border-red-300 text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmationInput('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-full text-xs font-medium text-outline hover:text-on-surface cursor-pointer border-0 bg-transparent"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={deleteConfirmationInput !== 'DELETE' || isDeleting}
                className={`px-5 py-2 rounded-full text-xs font-semibold text-white transition-all border-0 shadow-xs ${
                  deleteConfirmationInput === 'DELETE' && !isDeleting
                    ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                    : 'bg-red-300 cursor-not-allowed'
                }`}
              >
                {isDeleting ? 'Erasing Everything...' : 'Confirm Permanent Deletion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
