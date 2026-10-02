/**
 * Server-side score configuration and weights
 */
export const SCORE_CONFIG = {
  // Weekly challenge score weights
  weights: {
    practicePoints: 0.5,
    adherenceMultiplier: 0.3, // adherencePct * 10
    focusMinutes: 0.2
  },
  // Base practice points for various actions
  points: {
    habitCompleted: 25,
    waterLoggedPerGlass: 10,
    proteinTargetReached: 50,
    focusMinuteMultiplier: 2,
    workoutCompleted: 75,
    streakDayBonus: 15
  },
  // Weekly challenge default reference timezone
  referenceTimezone: 'UTC'
};

export function calculateWeeklyScore({ practicePoints = 0, avgAdherence = 0, focusMinutes = 0 }) {
  const { weights } = SCORE_CONFIG;
  const score =
    weights.practicePoints * practicePoints +
    weights.adherenceMultiplier * (avgAdherence * 10) +
    weights.focusMinutes * focusMinutes;
  return Math.round(score);
}
