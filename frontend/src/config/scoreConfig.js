/**
 * scoreConfig.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Central scoring formula configuration.
 * Easy-to-tweak weights and multipliers for all Momentum scoring metrics.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const SCORE_CONFIG = {
  // Weekly Leaderboard Score Weights
  weeklyScoreWeights: {
    practicePointsWeight: 0.5,
    adherenceMultiplierWeight: 0.3,
    focusMinutesWeight: 0.2,
    focusMinutesDivisor: 5,
    adherenceMultiplier: 10
  },

  // Daily Adherence Weights (skipped rituals never penalize adherence)
  adherenceWeights: {
    habitWeight: 0.5,
    focusWeight: 0.3,
    waterWeight: 0.2
  },

  // Practice Points Multipliers
  practicePoints: {
    baseJourneyPoints: 1600,
    habitCompleted: 25,
    focusMinute: 1.5,
    workoutSession: 35,
    waterGlass: 3,
    streakDay: 10
  },

  // Hydration Defaults
  hydration: {
    defaultGoalMl: 2000,
    glassStepMl: 250,
    maxMl: 4000
  },

  // Protein Defaults
  protein: {
    defaultGoalGrams: 90,
    maxGrams: 300
  },

  // Focus Defaults
  focus: {
    defaultTargetMinutes: 25
  },

  // Milestones Thresholds (days)
  milestones: [
    {
      id: 'ms-bronze',
      name: 'Foundation',
      tier: 'Bronze',
      thresholdDays: 7,
      label: '7-Day Rhythm',
      description: 'Awarded for establishing a consistent 7-day foundation of steady practice.'
    },
    {
      id: 'ms-silver',
      name: 'Consistency',
      tier: 'Silver',
      thresholdDays: 14,
      label: '14-Day Rhythm',
      description: 'Awarded for maintaining mindful daily presence across two full unbroken weeks.'
    },
    {
      id: 'ms-gold',
      name: 'Century Club',
      tier: 'Gold',
      thresholdDays: 100,
      label: '100-Day Rhythm',
      description: 'A monument to inner serenity and enduring discipline across one hundred days.'
    },
    {
      id: 'ms-plat',
      name: 'Serenity Master',
      tier: 'Platinum',
      thresholdDays: 365,
      label: '365-Day Rhythm',
      description: 'Mastery of life rhythm: an entire year grounded in effortless intentional mindfulness.'
    }
  ]
};

/**
 * Calculates weekly challenge score from metrics
 */
export function calculateWeeklyChallengeScore({
  weeklyPracticePoints = 0,
  avgAdherence = 0,
  focusMinutes = 0
}) {
  const {
    practicePointsWeight,
    adherenceMultiplierWeight,
    focusMinutesWeight,
    focusMinutesDivisor,
    adherenceMultiplier
  } = SCORE_CONFIG.weeklyScoreWeights;

  const pointsComponent = weeklyPracticePoints * practicePointsWeight;
  const adherenceComponent = (avgAdherence * adherenceMultiplier) * adherenceMultiplierWeight;
  const focusComponent = (focusMinutes / focusMinutesDivisor) * focusMinutesWeight;

  return Math.round(pointsComponent + adherenceComponent + focusComponent);
}
