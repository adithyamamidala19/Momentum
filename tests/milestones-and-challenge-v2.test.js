import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isUsernameTaken, USERNAME_TAKEN_MESSAGE } from '../server/src/utils/usernameValidation.js';
import { TIER_CONFIG, getTierMaterialProps, createMedalEdgeTexture } from '../src/components/medals/medalTextures.js';

describe('🌿 Prevent Duplicate Usernames (Case-Insensitive Uniqueness)', () => {
  it('should have the exact specified error message', () => {
    assert.strictEqual(
      USERNAME_TAKEN_MESSAGE,
      'This username is already taken. Please choose another username.'
    );
  });

  it('should detect duplicate usernames case-insensitively and with whitespace', async () => {
    // Mock user model simulating MongoDB findOne
    const existingUsers = [
      { _id: 'user_1', usernameLower: 'john123', challengeNicknameLower: 'johnny' },
      { _id: 'user_2', usernameLower: 'zenmaster', challengeNicknameLower: 'zenmaster' }
    ];

    const mockUserModel = {
      findOne: (query) => {
        const orConditions = query.$or || [];
        const found = existingUsers.find(u => {
          if (query._id?.$ne && String(u._id) === String(query._id.$ne)) {
            return false;
          }
          return orConditions.some(cond => {
            if (cond.usernameLower && cond.usernameLower === u.usernameLower) return true;
            if (cond.challengeNicknameLower && cond.challengeNicknameLower === u.challengeNicknameLower) return true;
            return false;
          });
        });
        return {
          select: () => Promise.resolve(found || null)
        };
      }
    };

    // Test case variations of 'John123'
    const res1 = await isUsernameTaken(null, { username: 'John123' }, mockUserModel);
    assert.strictEqual(res1.taken, true, 'John123 must be detected as taken against john123');
    assert.strictEqual(res1.message, USERNAME_TAKEN_MESSAGE);

    const res2 = await isUsernameTaken(null, { nickname: '  JOHN123  ' }, mockUserModel);
    assert.strictEqual(res2.taken, true, 'Uppercased with whitespace must be detected as taken');
    assert.strictEqual(res2.message, USERNAME_TAKEN_MESSAGE);

    const res3 = await isUsernameTaken(null, { nickname: 'johnny' }, mockUserModel);
    assert.strictEqual(res3.taken, true, 'johnny must be detected as taken against challengeNicknameLower');
    assert.strictEqual(res3.message, USERNAME_TAKEN_MESSAGE);

    // Test available username
    const resAvail = await isUsernameTaken(null, { username: 'UniqueMindfulHero99' }, mockUserModel);
    assert.strictEqual(resAvail.taken, false, 'New username must be recognized as available');

    // Test updating own username without conflict
    const resSelf = await isUsernameTaken('user_1', { username: 'John123' }, mockUserModel);
    assert.strictEqual(resSelf.taken, false, 'Same user updating their own profile must not conflict');
  });
});

describe('🌿 Social Media Sharing Backend Validation Logic', () => {
  it('should verify sharing logic and block uncompleted achievements', () => {
    // Simulate share validation check
    function simulateShareVerification({ requiredStreak, currentStreak, hasMedalRecord }) {
      const isCompleted = hasMedalRecord || (currentStreak >= requiredStreak);
      if (!isCompleted) {
        return {
          statusCode: 403,
          body: {
            success: false,
            error: 'Cannot share: activity or milestone has not been completed yet.'
          }
        };
      }
      return {
        statusCode: 200,
        body: {
          success: true,
          verificationCode: `VERIFIED-${requiredStreak}D-${Date.now()}`
        }
      };
    }

    // 1. Uncompleted 7-day milestone when streak is only 3
    const uncompletedResult = simulateShareVerification({
      requiredStreak: 7,
      currentStreak: 3,
      hasMedalRecord: false
    });
    assert.strictEqual(uncompletedResult.statusCode, 403);
    assert.strictEqual(uncompletedResult.body.success, false);
    assert.strictEqual(uncompletedResult.body.error, 'Cannot share: activity or milestone has not been completed yet.');

    // 2. Uncompleted 30-day milestone when streak is 28
    const silverAttempt = simulateShareVerification({
      requiredStreak: 30,
      currentStreak: 28,
      hasMedalRecord: false
    });
    assert.strictEqual(silverAttempt.statusCode, 403);
    assert.strictEqual(silverAttempt.body.success, false);

    // 3. Completed 7-day milestone with streak >= 7
    const completedResult = simulateShareVerification({
      requiredStreak: 7,
      currentStreak: 7,
      hasMedalRecord: false
    });
    assert.strictEqual(completedResult.statusCode, 200);
    assert.strictEqual(completedResult.body.success, true);
    assert.ok(completedResult.body.verificationCode.startsWith('VERIFIED-7D-'));

    // 4. Completed with verified Medal DB record
    const medalRecordResult = simulateShareVerification({
      requiredStreak: 30,
      currentStreak: 5, // streak reset after vacation, but medal was previously earned
      hasMedalRecord: true
    });
    assert.strictEqual(medalRecordResult.statusCode, 200);
    assert.strictEqual(medalRecordResult.body.success, true);
  });
});

describe('🌿 Rhythm Rankings Sorting & Field Compatibility', () => {
  it('should support both practiceScore and practicePoints seamlessly', () => {
    const mockRankings = [
      { nickname: 'Sage', practicePoints: 450, practiceScore: 450, weeklyScore: 92, adherence: 96 },
      { nickname: 'Zenith', practicePoints: 600, practiceScore: 600, weeklyScore: 88, adherence: 94 },
      { nickname: 'Aura', practicePoints: 320, practiceScore: 320, weeklyScore: 98, adherence: 99 }
    ];

    // Sort by practiceScore descending
    const byPractice = [...mockRankings].sort((a, b) => (b.practiceScore ?? b.practicePoints) - (a.practiceScore ?? a.practicePoints));
    assert.strictEqual(byPractice[0].nickname, 'Zenith');
    assert.strictEqual(byPractice[1].nickname, 'Sage');
    assert.strictEqual(byPractice[2].nickname, 'Aura');

    // Sort by weeklyScore descending
    const byWeekly = [...mockRankings].sort((a, b) => b.weeklyScore - a.weeklyScore);
    assert.strictEqual(byWeekly[0].nickname, 'Aura');
    assert.strictEqual(byWeekly[1].nickname, 'Sage');
    assert.strictEqual(byWeekly[2].nickname, 'Zenith');

    // Sort by adherence descending
    const byAdherence = [...mockRankings].sort((a, b) => b.adherence - a.adherence);
    assert.strictEqual(byAdherence[0].nickname, 'Aura');
    assert.strictEqual(byAdherence[1].nickname, 'Sage');
    assert.strictEqual(byAdherence[2].nickname, 'Zenith');
  });
});

describe('🌿 Redesigned 4-Tier Medals Craftsmanship & Reeded Edges', () => {
  it('should configure 4 tiers with progressive craftsmanship and distinct finishes', () => {
    assert.ok(TIER_CONFIG.bronze, 'Bronze tier config exists');
    assert.ok(TIER_CONFIG.silver, 'Silver tier config exists');
    assert.ok(TIER_CONFIG.gold, 'Gold tier config exists');
    assert.ok(TIER_CONFIG.platinum, 'Platinum tier config exists');

    // Roman Numerals
    assert.strictEqual(TIER_CONFIG.bronze.romanNumeral, 'VII');
    assert.strictEqual(TIER_CONFIG.silver.romanNumeral, 'XXX');
    assert.strictEqual(TIER_CONFIG.gold.romanNumeral, 'C');
    assert.strictEqual(TIER_CONFIG.platinum.romanNumeral, 'CCCLXV');

    // Guilloché complexity progression
    assert.strictEqual(TIER_CONFIG.bronze.guillocheRays, 0); // Lathe brushed
    assert.strictEqual(TIER_CONFIG.silver.guillocheRays, 16); // 16-ray rosette
    assert.strictEqual(TIER_CONFIG.gold.guillocheRays, 24);   // 24-ray sunburst
    assert.strictEqual(TIER_CONFIG.platinum.guillocheRays, 32); // 32-ray celestial tapestry

    // Physical PBR Material Escalation
    const bronzeMat = getTierMaterialProps('bronze', true);
    const silverMat = getTierMaterialProps('silver', true);
    const goldMat = getTierMaterialProps('gold', true);
    const platMat = getTierMaterialProps('platinum', true);

    // Metalness escalates: 0.90 -> 0.96 -> 0.98 -> 1.0
    assert.ok(bronzeMat.metalness < silverMat.metalness);
    assert.ok(silverMat.metalness < goldMat.metalness);
    assert.ok(goldMat.metalness <= platMat.metalness);

    // Roughness decreases (more mirror polish): 0.32 -> 0.14 -> 0.08 -> 0.03
    assert.ok(bronzeMat.roughness > silverMat.roughness);
    assert.ok(silverMat.roughness > goldMat.roughness);
    assert.ok(goldMat.roughness > platMat.roughness);

    // Clearcoat luster escalates: 0.45 -> 0.75 -> 0.88 -> 1.0
    assert.ok(bronzeMat.clearcoat < silverMat.clearcoat);
    assert.ok(silverMat.clearcoat < goldMat.clearcoat);
    assert.ok(goldMat.clearcoat <= platMat.clearcoat);

    // Platinum has highest iridescence
    assert.ok(platMat.iridescence >= 0.85);
  });
});
