import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    displayName: {
      type: String,
      trim: true,
      default: 'Mindful Practitioner'
    },
    photoURL: {
      type: String,
      default: ''
    },
    mantra: {
      type: String,
      trim: true,
      default: 'Slow is smooth, smooth is fast.'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    units: {
      weight: { type: String, enum: ['kg', 'lb'], default: 'kg' },
      volume: { type: String, enum: ['ml', 'oz'], default: 'ml' }
    },
    goals: {
      waterMl: { type: Number, default: 2000, min: 250, max: 10000 },
      proteinG: { type: Number, default: 90, min: 10, max: 500 },
      focusMin: { type: Number, default: 25, min: 5, max: 480 }
    },
    challenge: {
      optedIn: { type: Boolean, default: false },
      nickname: { type: String, trim: true, default: '' },
      avatar: { type: String, default: '🌱' },
      bio: { type: String, trim: true, default: '', maxLength: 150 }
    },
    chatSafetyAcknowledged: {
      type: Boolean,
      default: false
    },
    showOnlineStatus: {
      type: Boolean,
      default: true
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
    },
    notificationPrefs: {
      quietStart: { type: String, default: '21:30' },
      quietEnd: { type: String, default: '07:30' },
      dailyNudgeLimit: { type: Number, default: 3 }
    },
    theme: {
      type: String,
      enum: ['cream', 'dark', 'system'],
      default: 'cream'
    },
    onboardingCompleted: {
      type: Boolean,
      default: false
    },
    onboardingStep: {
      type: Number,
      min: 1,
      max: 6,
      default: 1
    },
    onboardingDraft: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    age: {
      type: Number,
      min: 13,
      max: 120,
      default: null
    },
    weightKg: {
      type: Number,
      min: 20,
      max: 500,
      default: null
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Non-binary', 'Prefer not to say', ''],
      default: ''
    },
    photoType: {
      type: String,
      enum: ['google', 'avatar', 'custom', ''],
      default: 'google'
    },
    avatarEmblem: {
      type: String,
      default: '🌱'
    },
    username: {
      type: String,
      trim: true
    },
    usernameLower: {
      type: String,
      lowercase: true,
      trim: true
    },
    challengeNicknameLower: {
      type: String,
      lowercase: true,
      trim: true
    },
    displayNameLower: {
      type: String,
      lowercase: true,
      trim: true
    },
    lastLoginAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Database-level uniqueness constraints to prevent race conditions (only non-empty strings)
userSchema.index(
  { challengeNicknameLower: 1 },
  {
    unique: true,
    partialFilterExpression: { challengeNicknameLower: { $type: 'string', $gt: '' } }
  }
);
userSchema.index(
  { usernameLower: 1 },
  {
    unique: true,
    partialFilterExpression: { usernameLower: { $type: 'string', $gt: '' } }
  }
);

// Pre-save hook: automatically sync lower-case fields for case-insensitive indexing
userSchema.pre('save', function (next) {
  if (this.isModified('challenge.nickname')) {
    const nick = this.challenge?.nickname ? this.challenge.nickname.trim().toLowerCase() : '';
    if (nick) {
      this.challengeNicknameLower = nick;
    } else {
      this.challengeNicknameLower = undefined;
    }
  }
  if (this.isModified('username')) {
    const un = this.username ? this.username.trim().toLowerCase() : '';
    if (un) {
      this.usernameLower = un;
    } else {
      this.usernameLower = undefined;
    }
  }
  if (this.isModified('displayName')) {
    const dn = this.displayName ? this.displayName.trim().toLowerCase() : '';
    if (dn) {
      this.displayNameLower = dn;
    } else {
      this.displayNameLower = undefined;
    }
  }
  next();
});

export const User = mongoose.model('User', userSchema);

