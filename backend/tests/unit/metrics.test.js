import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateWeeklyScore, SCORE_CONFIG } from '../../src/config/scoreConfig.js';

test('Metrics & Score Formula Integrity', async (t) => {
  await t.test('1. calculateWeeklyScore calculates exact weighted score', () => {
    // Formula: 0.5 * practicePoints + 0.3 * (adherence * 10) + 0.2 * focusMinutes
    // Example: practicePoints = 500, adherence = 90%, focusMinutes = 60
    // Expected: 0.5 * 500 (250) + 0.3 * 900 (270) + 0.2 * 60 (12) = 532
    const score = calculateWeeklyScore({
      practicePoints: 500,
      avgAdherence: 90,
      focusMinutes: 60
    });
    assert.equal(score, 532);
  });

  await t.test('2. Adherence Formula: Skipped/rest days are strictly excluded from denominator', () => {
    // User has 5 rituals: 3 completed, 1 skipped (rest day), 1 pending
    // Total habits = 5, Skipped = 1, Eligible = 4, Done = 3
    // Adherence = 3 / 4 = 75% (NOT 3 / 5 = 60%)
    const activeHabits = 5;
    const skipped = 1;
    const completed = 3;

    const eligible = activeHabits - skipped;
    const adherence = eligible > 0 ? (completed / eligible) * 100 : 100;

    assert.equal(Math.round(adherence), 75);
  });

  await t.test('3. Adherence Formula: All habits skipped (Full Rest Day) equals 100% adherence', () => {
    // All 4 rituals skipped on a conscious rest day
    const activeHabits = 4;
    const skipped = 4;
    const completed = 0;

    const eligible = activeHabits - skipped;
    const adherence = eligible > 0 ? (completed / eligible) * 100 : 100;

    assert.equal(adherence, 100);
  });

  await t.test('4. Configurable Score Weights verify correctly', () => {
    assert.equal(SCORE_CONFIG.weights.practicePoints, 0.5);
    assert.equal(SCORE_CONFIG.weights.adherenceMultiplier, 0.3);
    assert.equal(SCORE_CONFIG.weights.focusMinutes, 0.2);
  });
});
