import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Upload,
  Sparkles,
  Camera,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  Smile,
  ShieldCheck
} from 'lucide-react';
import { uploadProfilePhoto } from '../../services/firebaseClient.js';

const AVATAR_EMBLEMS = ['🌱', '🌊', '🏔️', '☀️', '🌸', '✨', '🍃', '🌿'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

export default function OnboardingStep2AboutYou({
  user,
  data,
  onChange,
  onValidationChange
}) {
  // ── Form State ──
  const [age, setAge] = useState(
    data.age !== undefined && data.age !== null && data.age !== '' ? String(data.age) : ''
  );

  const [weightInput, setWeightInput] = useState(
    data.weightKg !== undefined && data.weightKg !== null && data.weightKg !== ''
      ? String(data.weightKg)
      : ''
  );
  const [weightUnit, setWeightUnit] = useState(data.weightUnit || 'kg');

  const [gender, setGender] = useState(data.gender || '');

  // Photo Source: 'google' | 'avatar' | 'custom'
  const [photoType, setPhotoType] = useState(data.photoType || (user?.photoURL ? 'google' : 'avatar'));
  const [avatarEmblem, setAvatarEmblem] = useState(data.avatarEmblem || '🌱');
  const [customPhotoURL, setCustomPhotoURL] = useState(data.photoURL || '');

  // Custom photo upload & crop states
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [cropPreview, setCropPreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Sync to parent & validate required personal data
  useEffect(() => {
    // 1. Age validation: Required personal data between 13 and 120
    const ageNum = parseInt(age, 10);
    const isAgeValid = !isNaN(ageNum) && ageNum >= 13 && ageNum <= 120;

    // 2. Weight validation: Required personal data within standard physiological limits
    const weightNum = parseFloat(weightInput);
    const minWeight = weightUnit === 'lb' ? 44 : 20;
    const maxWeight = weightUnit === 'lb' ? 1100 : 500;
    const isWeightValid = !isNaN(weightNum) && weightNum >= minWeight && weightNum <= maxWeight;

    // Calculate stored weight in kg
    let storedWeightKg = null;
    if (!isNaN(weightNum) && isWeightValid) {
      storedWeightKg = weightUnit === 'lb' ? Math.round(weightNum / 2.20462) : Math.round(weightNum);
    }

    // 3. Gender validation: Required selection
    const isGenderValid = Boolean(gender) && GENDER_OPTIONS.includes(gender);

    // 4. Photo validation
    let finalPhotoURL = '';
    if (photoType === 'google') {
      finalPhotoURL = user?.photoURL || '';
    } else if (photoType === 'avatar') {
      finalPhotoURL = '';
    } else if (photoType === 'custom') {
      finalPhotoURL = customPhotoURL;
    }
    const isPhotoValid = photoType !== 'custom' || Boolean(customPhotoURL);

    const stepValid = isAgeValid && isWeightValid && isGenderValid && isPhotoValid;
    onValidationChange(stepValid);

    // Calculate baseline goal recommendations for Step 3
    let suggestedProtein = null;
    let suggestedWater = null;

    if (storedWeightKg) {
      const rawProtein = storedWeightKg * 1.3;
      const proteinChips = [60, 90, 120, 150];
      suggestedProtein = proteinChips.reduce((prev, curr) =>
        Math.abs(curr - rawProtein) < Math.abs(prev - rawProtein) ? curr : prev
      );

      const rawWater = storedWeightKg * 35;
      const waterChips = [1500, 2000, 2500, 3000];
      suggestedWater = waterChips.reduce((prev, curr) =>
        Math.abs(curr - rawWater) < Math.abs(prev - rawWater) ? curr : prev
      );
    }

    onChange({
      age: isAgeValid ? ageNum : null,
      weightKg: storedWeightKg,
      weightUnit,
      gender,
      photoType,
      avatarEmblem,
      photoURL: finalPhotoURL,
      suggestedProtein,
      suggestedWater
    });
  }, [
    age,
    weightInput,
    weightUnit,
    gender,
    photoType,
    avatarEmblem,
    customPhotoURL,
    user
  ]);

  // ── Drag & Drop / File Select Handlers ──
  const handleFileSelect = (file) => {
    if (!file) return;
    setUploadError(null);

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Please select a JPEG, PNG, or WebP image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit. Please choose a smaller photo.');
      return;
    }

    setPendingFile(file);

    // Generate local circular preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setCropPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Upload and compress confirmed file
  const confirmUpload = async () => {
    if (!pendingFile) return;
    setIsUploading(true);
    setUploadProgress(10);
    setUploadError(null);

    try {
      const userId = user?.id || user?._id || 'guest';
      const result = await uploadProfilePhoto(pendingFile, userId, (pct) => {
        setUploadProgress(pct);
      });

      setCustomPhotoURL(result.downloadURL);
      setPhotoType('custom');
      setPendingFile(null);
      setCropPreview(null);
    } catch (err) {
      setUploadError(err.message || 'Photo upload failed. Please try again.');
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

  // Toggle Weight Unit
  const toggleWeightUnit = (unit) => {
    if (unit === weightUnit) return;
    const currentVal = parseFloat(weightInput);
    if (!isNaN(currentVal) && currentVal > 0) {
      if (unit === 'lb') {
        setWeightInput(String(Math.round(currentVal * 2.20462)));
      } else {
        setWeightInput(String(Math.round(currentVal / 2.20462)));
      }
    }
    setWeightUnit(unit);
  };

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <h2 className="font-editorial text-2xl sm:text-3xl font-normal text-on-surface">
          About You
        </h2>
        <p className="text-xs text-outline mt-1.5 leading-relaxed">
          Please provide your personal details to personalize your pacing, nutrition suggestions, and daily wellness rhythm.
        </p>
      </div>

      <div className="space-y-5">
        {/* ── 1. AGE FIELD (Required) ── */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
              <span>Your Age</span>
              <span className="text-[10px] font-normal text-outline">(13–120 years)</span>
              <span className="text-rose-500 font-bold" title="Required">*</span>
            </label>
            <span className="text-[10px] text-primary font-medium">Personalized pace</span>
          </div>

          <div>
            <input
              type="number"
              min="13"
              max="120"
              required
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="e.g. 28"
              className="w-full px-3.5 py-2 rounded-xl border border-outline/20 bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {age && (parseInt(age, 10) < 13 || parseInt(age, 10) > 120) && (
              <span className="text-[10px] text-red-600 mt-1 block">
                Please enter a valid age between 13 and 120.
              </span>
            )}
          </div>
        </div>

        {/* ── 2. WEIGHT FIELD (Required) ── */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-on-surface flex items-center gap-1.5">
              <span>Your Weight</span>
              <span className="text-rose-500 font-bold" title="Required">*</span>
            </label>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg overflow-hidden border border-outline/20 bg-surface-container-lowest text-[11px]">
                <button
                  type="button"
                  onClick={() => toggleWeightUnit('kg')}
                  className={`px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    weightUnit === 'kg' ? 'bg-primary text-white' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  KG
                </button>
                <button
                  type="button"
                  onClick={() => toggleWeightUnit('lb')}
                  className={`px-2.5 py-1 font-semibold transition-colors cursor-pointer ${
                    weightUnit === 'lb' ? 'bg-primary text-white' : 'text-outline hover:text-on-surface'
                  }`}
                >
                  LB
                </button>
              </div>
            </div>
          </div>

          <div>
            <input
              type="number"
              min={weightUnit === 'lb' ? 44 : 20}
              max={weightUnit === 'lb' ? 1100 : 500}
              required
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              placeholder={weightUnit === 'lb' ? 'e.g. 154' : 'e.g. 70'}
              className="w-full px-3.5 py-2 rounded-xl border border-outline/20 bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {weightInput && (
              parseFloat(weightInput) < (weightUnit === 'lb' ? 44 : 20) ||
              parseFloat(weightInput) > (weightUnit === 'lb' ? 1100 : 500)
            ) && (
              <span className="text-[10px] text-red-600 mt-1 block">
                Please enter a valid weight ({weightUnit === 'lb' ? '44–1100 lb' : '20–500 kg'}).
              </span>
            )}
          </div>
        </div>

        {/* ── 3. GENDER FIELD ── */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 space-y-1.5">
          <label className="text-xs font-medium text-on-surface block">
            Gender
          </label>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-outline/20 bg-surface-container-lowest text-xs text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="" disabled>
              Select an option...
            </option>
            {GENDER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>

        {/* ── 4. PROFILE PHOTO SELECTION ── */}
        <div className="p-4 rounded-2xl bg-surface-container-low border border-outline/10 space-y-3.5">
          <label className="text-xs font-medium text-on-surface block">
            Profile Photo
          </label>

          {/* Segmented Control / Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-surface-container-lowest border border-outline/15 text-xs font-medium">
            <button
              type="button"
              onClick={() => setPhotoType('google')}
              className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                photoType === 'google'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Google Photo
            </button>
            <button
              type="button"
              onClick={() => setPhotoType('avatar')}
              className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                photoType === 'avatar'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Avatar Emblem
            </button>
            <button
              type="button"
              onClick={() => setPhotoType('custom')}
              className={`py-1.5 px-2 rounded-lg transition-all text-center ${
                photoType === 'custom'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-outline hover:text-on-surface'
              }`}
            >
              Upload Custom
            </button>
          </div>

          {/* Tab 1: Google Photo */}
          {photoType === 'google' && (
            <div className="flex items-center gap-4 pt-1">
              {user?.photoURL ? (
                <>
                  <img
                    src={user.photoURL}
                    alt="Google account portrait"
                    className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shadow-xs"
                  />
                  <div>
                    <span className="text-xs font-semibold text-on-surface block">
                      Google Account Photo
                    </span>
                    <span className="text-[11px] text-outline">
                      Synced from your verified Google profile.
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-xs text-outline italic p-3 rounded-xl bg-surface-container/50 w-full text-center">
                  No Google profile photo found. Choose an avatar or upload a custom image.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Avatar Emblem */}
          {photoType === 'avatar' && (
            <div className="space-y-2 pt-1">
              <span className="text-[11px] text-outline block">
                Select your mindful sanctuary symbol:
              </span>
              <div className="flex flex-wrap gap-2">
                {AVATAR_EMBLEMS.map((emblem) => (
                  <button
                    key={emblem}
                    type="button"
                    onClick={() => setAvatarEmblem(emblem)}
                    className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                      avatarEmblem === emblem
                        ? 'bg-primary-fixed border-2 border-primary scale-110 shadow-xs'
                        : 'bg-surface-container hover:bg-surface-container-high'
                    }`}
                  >
                    {emblem}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: Custom Photo Upload */}
          {photoType === 'custom' && (
            <div className="space-y-3 pt-1">
              {/* Existing Uploaded or Cropped Photo Preview */}
              {customPhotoURL && !cropPreview && (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-surface-container-lowest border border-outline/15">
                  <img
                    src={customPhotoURL}
                    alt="Custom profile preview"
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary shadow-xs"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-on-surface block">
                      Custom Photo Ready
                    </span>
                    <span className="text-[10px] text-emerald-700 font-medium">
                      ✓ Uploaded & securely stored
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPhotoURL('');
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="text-xs text-outline hover:text-red-600 px-2 py-1"
                  >
                    Change
                  </button>
                </div>
              )}

              {/* Crop & Confirm Box */}
              {cropPreview && (
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-primary/30 space-y-3 text-center">
                  <span className="text-xs font-medium text-on-surface block">
                    Circular Crop Preview
                  </span>
                  <div className="relative w-28 h-28 mx-auto">
                    <img
                      src={cropPreview}
                      alt="Crop target"
                      className="w-28 h-28 rounded-full object-cover border-4 border-primary shadow-md"
                    />
                    <div className="absolute inset-0 rounded-full border-2 border-white/60 pointer-events-none" />
                  </div>

                  {isUploading && (
                    <div className="space-y-1.5 w-full max-w-xs mx-auto">
                      <div className="w-full h-1.5 bg-surface-container rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-outline">
                        Uploading photo... {uploadProgress}%
                      </span>
                    </div>
                  )}

                  {uploadError && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-red-600">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="flex justify-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={cancelUpload}
                      className="px-3 py-1.5 text-xs rounded-xl border border-outline/20 text-outline hover:text-on-surface"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={confirmUpload}
                      className="px-4 py-1.5 text-xs rounded-xl bg-primary text-white font-medium hover:bg-primary/90 shadow-xs flex items-center gap-1.5"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Compressing...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Use This Photo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Dropzone */}
              {!customPhotoURL && !cropPreview && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`p-6 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
                    isDragging
                      ? 'border-primary bg-primary/5'
                      : 'border-outline/25 hover:border-primary/50 bg-surface-container-lowest'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                  />
                  <div className="w-10 h-10 mx-auto rounded-full bg-surface-container flex items-center justify-center text-outline mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-on-surface block">
                    Choose an image or drag & drop here
                  </span>
                  <span className="text-[10px] text-outline mt-0.5 block">
                    JPEG, PNG, or WebP &bull; Max 5MB &bull; Automatic circular crop
                  </span>
                </div>
              )}

              {uploadError && !cropPreview && (
                <div className="flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
