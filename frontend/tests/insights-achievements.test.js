import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_ACHIEVEMENT_DEFINITIONS, AchievementService } from '../../backend/src/services/achievementService.js';
import { getTierMaterialProps } from '../src/components/medals/medalTextures.js';

test('🌿 1. Achievement Definitions Seed Integrity', () => {
  assert.equal(DEFAULT_ACHIEVEMENT_DEFINITIONS.length, 6, 'Should define exactly 6 core achievements');

  const hydrationHero = DEFAULT_ACHIEVEMENT_DEFINITIONS.find((a) => a.key === 'hydration-hero-weekly');
  assert.ok(hydrationHero, 'Hydration Hero weekly should exist');
  assert.equal(hydrationHero.metric, 'water_ml');
  assert.equal(hydrationHero.targetValue, 10000);
  assert.equal(hydrationHero.period, 'weekly');
  assert.equal(hydrationHero.pointsAwarded, 50);

  const deepDiver = DEFAULT_ACHIEVEMENT_DEFINITIONS.find((a) => a.key === 'deep-diver-monthly');
  assert.ok(deepDiver, 'Deep Diver monthly should exist');
  assert.equal(deepDiver.metric, 'water_ml');
  assert.equal(deepDiver.targetValue, 40000);
  assert.equal(deepDiver.period, 'monthly');
  assert.equal(deepDiver.pointsAwarded, 150);

  const monthlyMomentum = DEFAULT_ACHIEVEMENT_DEFINITIONS.find((a) => a.key === 'monthly-momentum');
  assert.ok(monthlyMomentum, 'Monthly Momentum should exist');
  assert.equal(monthlyMomentum.metric, 'adherence_pct');
  assert.equal(monthlyMomentum.targetValue, 80);
  assert.equal(monthlyMomentum.period, 'monthly');
  assert.equal(monthlyMomentum.tier, 'Platinum');
  assert.equal(monthlyMomentum.pointsAwarded, 200);
});

test('🌿 2. Timezone-Aware Period Boundaries Calculation', () => {
  const testDate = new Date('2026-09-25T12:00:00Z'); // Friday
  const bounds = AchievementService.getPeriodBounds(testDate, 'UTC');

  assert.ok(bounds.weekly, 'Weekly bounds should be defined');
  assert.equal(bounds.weekly.periodStart, '2026-09-21', 'Monday of week 39');
  assert.equal(bounds.weekly.periodEnd, '2026-09-27', 'Sunday of week 39');
  assert.equal(bounds.weekly.daysRemaining, 2, 'Friday -> 2 days left (Sat, Sun)');

  assert.ok(bounds.monthly, 'Monthly bounds should be defined');
  assert.equal(bounds.monthly.periodStart, '2026-09-01', 'First day of September');
  assert.equal(bounds.monthly.periodEnd, '2026-09-30', 'Last day of September');
  assert.equal(bounds.monthly.daysRemaining, 5, '25th -> 5 days left in 30-day month');
});

test('🌿 3. 4-Tier Medal PBR Materials Distinctness & Contrast', () => {
  // Bronze (warm copper-brown, lathe brushed)
  const bronze = getTierMaterialProps('bronze', true);
  assert.equal(bronze.color, '#C67A3C');
  assert.equal(bronze.roughness, 0.32);
  assert.equal(bronze.metalness, 0.90);
  assert.equal(bronze.clearcoat, 0.45);

  // Silver (bright 999 fine silver, polished proof)
  const silver = getTierMaterialProps('silver', true);
  assert.equal(silver.color, '#F8FAFC');
  assert.equal(silver.roughness, 0.14);
  assert.equal(silver.metalness, 0.96);
  assert.equal(silver.clearcoat, 0.75);

  // Gold (rich 24K Royal Gold, radiant luster)
  const gold = getTierMaterialProps('gold', true);
  assert.equal(gold.color, '#FFD700');
  assert.equal(gold.roughness, 0.08);
  assert.equal(gold.metalness, 0.98);
  assert.equal(gold.clearcoat, 0.88);

  // Platinum (mirror-finish 950 platinum, liquid chrome, clearcoat & iridescence)
  const platinum = getTierMaterialProps('platinum', true);
  assert.equal(platinum.color, '#FFFFFF');
  assert.equal(platinum.type, 'physical');
  assert.equal(platinum.roughness, 0.03);
  assert.equal(platinum.metalness, 1.0);
  assert.equal(platinum.clearcoat, 1.0);
  assert.ok(platinum.iridescence > 0, 'Platinum must feature iridescent sheen');

  // Progressive luxury escalation verification
  assert.ok(bronze.metalness < silver.metalness && silver.metalness < gold.metalness && gold.metalness <= platinum.metalness, 'Metalness escalates progressively');
  assert.ok(bronze.clearcoat < silver.clearcoat && silver.clearcoat < gold.clearcoat && gold.clearcoat <= platinum.clearcoat, 'Clearcoat luster escalates progressively');
  assert.ok(bronze.roughness > silver.roughness && silver.roughness > gold.roughness && gold.roughness > platinum.roughness, 'Surface polish gets progressively smoother/mirror-finish');

  // Locked tiers must have distinct undertones (not identical grey)
  const lockedBronze = getTierMaterialProps('bronze', false);
  const lockedSilver = getTierMaterialProps('silver', false);
  const lockedGold = getTierMaterialProps('gold', false);
  const lockedPlatinum = getTierMaterialProps('platinum', false);

  assert.notEqual(lockedBronze.color, lockedSilver.color, 'Locked bronze and silver must differ');
  assert.notEqual(lockedGold.color, lockedPlatinum.color, 'Locked gold and platinum must differ');
  assert.notEqual(lockedBronze.color, lockedGold.color, 'Locked bronze and gold must differ');
});
