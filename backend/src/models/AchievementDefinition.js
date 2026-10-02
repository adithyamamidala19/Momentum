import mongoose from 'mongoose';

const achievementDefinitionSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    icon: {
      type: String,
      default: '🏆'
    },
    metric: {
      type: String,
      enum: ['water_ml', 'focus_min', 'protein_days', 'ritual_days', 'adherence_pct'],
      required: true
    },
    period: {
      type: String,
      enum: ['weekly', 'monthly'],
      required: true
    },
    targetValue: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      default: ''
    },
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
      default: 'Bronze'
    },
    pointsAwarded: {
      type: Number,
      default: 50
    },
    active: {
      type: Boolean,
      default: true
    },
    displayOrder: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const AchievementDefinition = mongoose.model('AchievementDefinition', achievementDefinitionSchema);
