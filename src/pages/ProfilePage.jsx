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
  LogOut,
  Users,
  Camera,
  Check,
  AlertCircle,
  Upload,
  AtSign
} from 'lucide-react';
import { uploadProfilePhoto } from '../services/firebaseClient.js';
import FriendsSection from '../components/friends/FriendsSection.jsx';
import ChatDrawer from '../components/chat/ChatDrawer.jsx';
import PublicProfileModal from '../components/challenge/PublicProfileModal.jsx';

export default function ProfilePage({ setView }) {
  const { user, logout, refreshUser } = useAuth();
  const { showToast } = useMomentum();

  // Profile fields state
  const [username, setUsername] = useState(user?.username || '');
  const [usernameError, setUsernameError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [displayName, setDisplayName] = useState(user?.displayName || 'Mindful Practitioner');
  const [mantra, setMantra] = useState(user?.mantra || 'Slow is smooth, smooth is fast.');
  const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  const [weightUnit, setWeightUnit] = useState(user?.units?.weight || 'kg');
  const [volumeUnit, setVolumeUnit] = useState(user?.units?.volume || 'ml');

  // Personal Info (About You)
  const [age, setAge] = useState(user?.age !== null && user?.age !== undefined ? String(user.age) : '');
  const [weightInput, setWeightInput] = useState(
    user?.weightKg !== null && user?.weightKg !== undefined ? String(user.weightKg) : ''
  );
  const [gender, setGender] = useState(user?.gender || '');

  // Photo Source: 'google' | 'avatar' | 'custom'
  const [photoType, setPhotoType] = useState(user?.photoType || (user?.photoURL ? 'google' : 'avatar'));
  const [avatarEmblem, setAvatarEmblem] = useState(user?.avatarEmblem || '🌱');
  const [customPhotoURL, setCustomPhotoURL] = useState(user?.photoURL || '');

  // Custom photo upload & crop states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [cropPreview, setCropPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);

  // Goals
  const [waterGoal, setWaterGoal] = useState(user?.goals?.waterMl || 2000);
  const [proteinGoal, setProteinGoal] = useState(user?.goals?.proteinG || 90);
  const [focusGoal, setFocusGoal] = useState(user?.goals?.focusMin || 25);

  // Challenge settings
  const [challengeOptIn, setChallengeOptIn] = useState(user?.challenge?.optedIn || false);
  const [challengeNickname, setChallengeNickname] = useState(user?.challenge?.nickname || '');
  const [challengeAvatar, setChallengeAvatar] = useState(user?.challenge?.avatar || '🌱');
  const [challengeBio, setChallengeBio] = useState(user?.challenge?.bio || '');

  // Friends & Chat interaction states
  const [activeChatFriend, setActiveChatFriend] = useState(null);
  const [visitedProfileNickname, setVisitedProfileNickname] = useState(null);

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
      setUsername(user.username || '');
      setDisplayName(user.displayName || 'Mindful Practitioner');
      setMantra(user.mantra || 'Slow is smooth, smooth is fast.');
      setTimezone(user.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      setWeightUnit(user.units?.weight || 'kg');
      setVolumeUnit(user.units?.volume || 'ml');
      setAge(user.age !== null && user.age !== undefined ? String(user.age) : '');
      setWeightInput(user.weightKg !== null && user.weightKg !== undefined ? String(user.weightKg) : '');
      setGender(user.gender || '');
      setPhotoType(user.photoType || (user.photoURL ? 'google' : 'avatar'));
      setAvatarEmblem(user.avatarEmblem || '🌱');
      setCustomPhotoURL(user.photoURL || '');
      setWaterGoal(user.goals?.waterMl || 2000);
      setProteinGoal(user.goals?.proteinG || 90);
      setFocusGoal(user.goals?.focusMin || 25);
      setChallengeOptIn(user.challenge?.optedIn || false);
      setChallengeNickname(user.challenge?.nickname || '');
      setChallengeAvatar(user.challenge?.avatar || '🌱');
      setChallengeBio(user.challenge?.bio || '');
      setTheme(user.theme || 'cream');
    }
  }, [user]);

  const handleFileSelect = (file) => {
    if (!file) return;
    setUploadError(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a JPEG, PNG, or WebP image file.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return;
    }
    setPendingFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setCropPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const confirmUpload = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    setUploadProgress(15);
    setUploadError(null);
    try {
      const userId = user?.id || user?._id || 'guest';
      const result = await uploadProfilePhoto(pendingFile, userId, (pct) => setUploadProgress(pct));
      setCustomPhotoURL(result.downloadURL);
      setPhotoType('custom');
      setPendingFile(null);
      setCropPreview(null);
      showToast('Custom photo cropped and uploaded.');
    } catch (err) {
      setUploadError(err.message || 'Photo upload failed.');
    } finally {
      setIsUploading(false);
    }
  };

  const cancelUpload = () => {
    setPendingFile(null);
    setCropPreview(null);
    setUploadError(null);
    setUploadProgress(0);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setUsernameError('');
    setNicknameError('');
    try {
      let finalWeightKg = null;
      if (weightInput) {
        const num = parseFloat(weightInput);
        if (!isNaN(num)) {
          finalWeightKg = weightUnit === 'lb' ? Math.round(num / 2.20462) : Math.round(num);
        }
      }

      let finalAge = null;
      if (age) {
        const a = parseInt(age, 10);
        if (!isNaN(a)) finalAge = a;
      }

      let finalPhotoURL = '';
      if (photoType === 'google') finalPhotoURL = user?.photoURL || '';
      else if (photoType === 'custom') finalPhotoURL = customPhotoURL;

      const payload = {
        username: username.trim(),
        displayName,
        mantra,
        timezone,
        age: finalAge,
        weightKg: finalWeightKg,
        gender,
        photoType,
        photoURL: finalPhotoURL,
        avatarEmblem,
        units: { weight: weightUnit, volume: volumeUnit },
        goals: { waterMl: Number(waterGoal), proteinG: Number(proteinGoal), focusMin: Number(focusGoal) },
        challenge: {
          optedIn: challengeOptIn,
          nickname: challengeNickname.trim(),
          avatar: challengeAvatar,
          bio: challengeBio.trim()
        },
        theme
      };

      await api.put('/profile', payload);
      await refreshUser();
      showToast('Profile and sanctuary preferences saved.');
    } catch (err) {
      const msg = err.message || '';
      if (err.status === 409 || msg.includes('already taken')) {
        setUsernameError(msg || 'This username is already taken. Please choose another username.');
        setNicknameError(msg || 'This username is already taken. Please choose another username.');
      }
      showToast(`Error: ${msg}`);
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
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 pb-5 hairline-b">
            {/* Live Profile Visual */}
            <div className="relative shrink-0">
              {photoType === 'google' && user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover shadow-xs border-2 border-primary"
                />
              ) : photoType === 'custom' && customPhotoURL ? (
                <img
                  src={customPhotoURL}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover shadow-xs border-2 border-primary"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-2xl shadow-xs border-2 border-primary/30">
                  {photoType === 'avatar' ? avatarEmblem : displayName.charAt(0) || '🌱'}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-on-surface truncate">{displayName}</h2>
                {username && (
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-surface-container text-primary-container">
                    @{username}
                  </span>
                )}
              </div>
              <p className="text-xs text-outline italic">“{mantra}”</p>
              <p className="text-[10px] text-outline/80 mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Profile Photo Switcher */}
          <div className="space-y-3 p-4 rounded-2xl bg-surface-container-low border border-outline/10">
            <label className="text-xs font-semibold text-on-surface block">
              Profile Photo & Emblem
            </label>

            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-container-lowest border border-outline/15 text-xs font-medium">
              <button
                type="button"
                onClick={() => setPhotoType('google')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  photoType === 'google' ? 'bg-primary text-white shadow-xs' : 'text-outline hover:text-on-surface'
                }`}
              >
                Google Photo
              </button>
              <button
                type="button"
                onClick={() => setPhotoType('avatar')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  photoType === 'avatar' ? 'bg-primary text-white shadow-xs' : 'text-outline hover:text-on-surface'
                }`}
              >
                Avatar Emblem
              </button>
              <button
                type="button"
                onClick={() => setPhotoType('custom')}
                className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                  photoType === 'custom' ? 'bg-primary text-white shadow-xs' : 'text-outline hover:text-on-surface'
                }`}
              >
                Custom Upload
              </button>
            </div>

            {/* Google tab */}
            {photoType === 'google' && (
              <div className="text-xs text-outline">
                {user?.photoURL ? (
                  <span className="text-emerald-700 font-medium">✓ Using official Google account photo</span>
                ) : (
                  <span>No Google profile photo detected on sign-in.</span>
                )}
              </div>
            )}

            {/* Avatar tab */}
            {photoType === 'avatar' && (
              <div className="flex flex-wrap gap-2 pt-1">
                {['🌱', '🌊', '🏔️', '☀️', '🌸', '✨', '🍃', '🌿'].map((emb) => (
                  <button
                    key={emb}
                    type="button"
                    onClick={() => setAvatarEmblem(emb)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg transition-all ${
                      avatarEmblem === emb ? 'bg-primary-fixed border-2 border-primary scale-105' : 'bg-surface-container hover:bg-surface-container-high'
                    }`}
                  >
                    {emb}
                  </button>
                ))}
              </div>
            )}

            {/* Custom upload tab */}
            {photoType === 'custom' && (
              <div className="space-y-3 pt-1">
                {cropPreview ? (
                  <div className="p-3 rounded-xl bg-surface-container-lowest border border-primary/30 space-y-2.5 text-center">
                    <span className="text-[11px] font-medium text-on-surface block">Crop Preview</span>
                    <img
                      src={cropPreview}
                      alt="Crop target"
                      className="w-20 h-20 rounded-full object-cover border-2 border-primary mx-auto shadow-sm"
                    />
                    {isUploading && (
                      <div className="text-[10px] text-outline">Uploading photo... {uploadProgress}%</div>
                    )}
                    {uploadError && (
                      <div className="text-xs text-red-600">{uploadError}</div>
                    )}
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={cancelUpload}
                        className="px-3 py-1 text-xs rounded-lg border border-outline/20 text-outline"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={confirmUpload}
                        className="px-3 py-1 text-xs rounded-lg bg-primary text-white font-medium shadow-xs"
                      >
                        {isUploading ? 'Uploading...' : 'Confirm Photo'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-outline/25 bg-surface-container-lowest text-xs text-on-surface hover:border-primary cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5 text-primary" />
                      <span>Upload & Crop New Image (JPEG, PNG, WebP)</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1 flex items-center gap-1.5">
                <AtSign className="w-3.5 h-3.5 text-primary-container" />
                <span>Sanctuary Username</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-outline font-medium">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    if (usernameError) setUsernameError('');
                  }}
                  placeholder="e.g. mindful_user"
                  className={`w-full pl-8 pr-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container ${
                    usernameError ? 'border-red-500 ring-1 ring-red-500' : ''
                  }`}
                />
              </div>
              {usernameError ? (
                <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 shrink-0" />
                  <span>{usernameError}</span>
                </p>
              ) : (
                <span className="text-[10px] text-outline mt-1 block">Unique identifier for your sanctuary profile</span>
              )}
            </div>

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

            {/* Age */}
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">
                Age (13–120)
              </label>
              <input
                type="number"
                min="13"
                max="120"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="e.g. 28"
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </div>

            {/* Weight */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-on-surface">Weight ({weightUnit.toUpperCase()})</label>
                <div className="flex rounded-md overflow-hidden hairline text-[10px]">
                  <button
                    type="button"
                    onClick={() => setWeightUnit('kg')}
                    className={`px-2 py-0.5 font-semibold transition-colors cursor-pointer ${
                      weightUnit === 'kg' ? 'bg-primary text-white' : 'bg-surface-container text-outline hover:text-on-surface'
                    }`}
                  >
                    KG
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeightUnit('lb')}
                    className={`px-2 py-0.5 font-semibold transition-colors cursor-pointer ${
                      weightUnit === 'lb' ? 'bg-primary text-white' : 'bg-surface-container text-outline hover:text-on-surface'
                    }`}
                  >
                    LB
                  </button>
                </div>
              </div>
              <input
                type="number"
                value={weightInput}
                onChange={(e) => setWeightInput(e.target.value)}
                placeholder={weightUnit === 'lb' ? 'e.g. 154' : 'e.g. 70'}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </div>

            {/* Gender */}
            <div>
              <label className="text-xs font-semibold text-on-surface block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container"
              >
                <option value="">Select gender option...</option>
                {['Male', 'Female', 'Non-binary', 'Prefer not to say'].map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
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
                  onChange={(e) => {
                    setChallengeNickname(e.target.value);
                    if (nicknameError) setNicknameError('');
                  }}
                  className={`w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container ${
                    nicknameError ? 'border-red-500 ring-1 ring-red-500' : ''
                  }`}
                />
                {nicknameError ? (
                  <p className="text-[11px] text-red-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 shrink-0" />
                    <span>{nicknameError}</span>
                  </p>
                ) : (
                  <span className="text-[10px] text-outline mt-1 block">Visible in anonymous weekly challenge rankings</span>
                )}
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

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-on-surface block mb-1">
                  Practitioner Bio (Max 150 characters, mindful intention)
                </label>
                <textarea
                  value={challengeBio}
                  maxLength={150}
                  rows={2}
                  placeholder="Share a gentle, mindful intention (max 150 chars)..."
                  onChange={(e) => setChallengeBio(e.target.value.slice(0, 150))}
                  className="w-full px-4 py-2.5 rounded-xl bg-surface-container-low hairline text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container resize-none"
                />
                <span className="text-[10px] text-outline block text-right font-mono">
                  {challengeBio.length}/150
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Friends & Circle Connections (Phase D) */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest hairline shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary-container" />
            <div>
              <h3 className="text-sm font-bold text-on-surface">Friends & Circle Connections</h3>
              <p className="text-xs text-outline">
                Manage your mutual habit partners, incoming connection requests, and privacy settings.
              </p>
            </div>
          </div>

          <FriendsSection
            onOpenChat={(friend) => setActiveChatFriend(friend)}
            onOpenProfile={(nickname) => setVisitedProfileNickname(nickname)}
          />
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
            onClick={() => setView('privacy')}
            className="px-5 py-2.5 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center gap-2 cursor-pointer border-0 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-primary-container" />
            <span>Privacy Policy</span>
          </button>

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

      {/* 1:1 Safe Real-Time Chat Drawer */}
      {activeChatFriend && (
        <ChatDrawer
          isOpen={Boolean(activeChatFriend)}
          onClose={() => setActiveChatFriend(null)}
          friend={activeChatFriend}
          onOpenPrivacy={() => {
            setActiveChatFriend(null);
            setView('privacy');
          }}
          onUserBlocked={() => {
            setActiveChatFriend(null);
            showToast('User blocked.');
          }}
        />
      )}

      {/* Visited Public Sanctuary Profile Modal */}
      {visitedProfileNickname && (
        <PublicProfileModal
          nickname={visitedProfileNickname}
          isOpen={Boolean(visitedProfileNickname)}
          onClose={() => setVisitedProfileNickname(null)}
          onOpenChat={(f) => {
            setVisitedProfileNickname(null);
            setActiveChatFriend(f);
          }}
          onBlocked={() => {
            setVisitedProfileNickname(null);
          }}
        />
      )}
    </div>
  );
}
