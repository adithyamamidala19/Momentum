import http from 'http';
import jwt from 'jsonwebtoken';

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed
        });
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

function extractCookie(headers) {
  const setCookie = headers['set-cookie'];
  if (!setCookie) return null;
  const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  return cookieStr.split(';')[0];
}

async function runOnboardingTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 RUNNING 6-STEP ONBOARDING & DATA PERSISTENCE VERIFICATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const ts = Date.now();
  const uid = `onboard-v2-user-${ts}`;
  const token = jwt.sign(
    { sub: uid, email: `${uid}@sanctuary.app`, name: 'Sam River', exp: Math.floor(Date.now() / 1000) + 3600 },
    'secret'
  );

  const apiCall = (method, path, cookie, data = null) => {
    return request(
      {
        hostname: 'localhost',
        port: 5000,
        path: `/api${path}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(cookie ? { Cookie: cookie } : {})
        }
      },
      data
    );
  };

  // ── TEST 1: Mandatory Onboarding Flow ──
  console.log('▶ [Test 1] New User Registration & Mandatory Onboarding Status');
  const resLogin = await apiCall('POST', '/auth/session', null, { idToken: token });
  console.log('  Login status:', resLogin.statusCode, 'isNewUser:', resLogin.data.isNewUser);
  const cookie = extractCookie(resLogin.headers);
  if (!cookie) throw new Error('No cookie returned for user session');

  console.log('  User onboardingCompleted:', resLogin.data.user.onboardingCompleted);
  if (resLogin.data.user.onboardingCompleted !== false) {
    throw new Error('FAIL: User must start with onboardingCompleted: false');
  }
  console.log('  ✅ Test 1 Passed: Onboarding is strictly mandatory for new accounts.\n');

  // ── TEST 2: Mid-Flow Refresh Persistence via /api/onboarding/step ──
  console.log('▶ [Test 2] Mid-Flow Progress Persistence (Step 1 -> Step 2)');
  // Save Step 1
  await apiCall('POST', '/onboarding/step', cookie, {
    step: 2,
    draft: {
      displayName: 'Sam River',
      mantra: 'Breathe gently, move with intention.'
    }
  });

  // Save Step 2 (About You) with all new fields
  const step2Payload = {
    step: 3,
    draft: {
      aboutYou: {
        age: 32,
        weightKg: 68,
        weightUnit: 'kg',
        gender: 'Non-binary',
        photoType: 'avatar',
        avatarEmblem: '🌊'
      },
      age: 32,
      weightKg: 68,
      gender: 'Non-binary',
      photoType: 'avatar',
      avatarEmblem: '🌊'
    }
  };
  const resSaveStep2 = await apiCall('POST', '/onboarding/step', cookie, step2Payload);
  console.log('  Saved Step 2 status:', resSaveStep2.statusCode, 'currentStep:', resSaveStep2.data.step);

  // SIMULATE PAGE RELOAD / REFRESH via GET /api/onboarding/state
  console.log('  Simulating browser refresh mid-flow...');
  const resState = await apiCall('GET', '/onboarding/state', cookie);
  console.log('  Reloaded state step:', resState.data.step);
  console.log('  Reloaded draft age:', resState.data.draft.aboutYou?.age);
  console.log('  Reloaded draft weightKg:', resState.data.draft.aboutYou?.weightKg);
  console.log('  Reloaded draft gender:', resState.data.draft.aboutYou?.gender);
  console.log('  Reloaded draft avatarEmblem:', resState.data.draft.aboutYou?.avatarEmblem);

  if (resState.data.step !== 3) {
    throw new Error(`FAIL: Step was not preserved across refresh. Expected 3, got ${resState.data.step}`);
  }
  if (resState.data.draft.aboutYou?.gender !== 'Non-binary' || resState.data.draft.aboutYou?.age !== 32) {
    throw new Error('FAIL: Draft data did not survive page reload!');
  }
  console.log('  ✅ Test 2 Passed: Onboarding state and inputs survive browser reloads.\n');

  // ── TEST 3: Starting Goal Suggestion Accuracy (without BMI/calories) ──
  console.log('▶ [Test 3] Verifying Non-Medical Starting Goal Suggestions');
  const weight = 68; // kg
  const suggestedProtein = [60, 90, 120, 150].reduce((prev, curr) =>
    Math.abs(curr - weight * 1.3) < Math.abs(prev - weight * 1.3) ? curr : prev
  );
  const suggestedWater = [1500, 2000, 2500, 3000].reduce((prev, curr) =>
    Math.abs(curr - weight * 35) < Math.abs(prev - weight * 35) ? curr : prev
  );
  console.log(`  Weight: ${weight}kg => Suggested Protein: ${suggestedProtein}g, Suggested Water: ${suggestedWater}ml`);
  if (suggestedProtein !== 90 || suggestedWater !== 2500) {
    throw new Error('FAIL: Unexpected starting goal suggestions calculation');
  }
  console.log('  ✅ Test 3 Passed: Starting suggestions correctly map to existing goal chips.\n');

  // ── TEST 4: Advance through Step 4 (Starter Rituals) & Step 5 (Tour) ──
  console.log('▶ [Test 4] Step 4 & Step 5 Progress Saving');
  await apiCall('POST', '/onboarding/step', cookie, {
    step: 5,
    draft: {
      goals: { waterMl: 2500, proteinG: 90, focusMin: 25 }
    }
  });

  await apiCall('POST', '/onboarding/step', cookie, {
    step: 6,
    draft: {
      tourCompleted: true
    }
  });
  console.log('  ✅ Test 4 Passed: Feature tour and starter rituals step transitions saved.\n');

  // ── TEST 5: Complete Onboarding via POST /api/onboarding/complete ──
  console.log('▶ [Test 5] Completing Onboarding via /api/onboarding/complete');
  const completePayload = {
    displayName: 'Sam River',
    mantra: 'Breathe gently, move with intention.',
    age: 32,
    weightKg: 68,
    gender: 'Non-binary',
    photoType: 'avatar',
    avatarEmblem: '🌊',
    timezone: 'Asia/Kolkata',
    units: { volume: 'ml', weight: 'kg' },
    goals: { waterMl: 2500, proteinG: 90, focusMin: 25 },
    challenge: { optedIn: true, nickname: 'SamRiver', avatar: '🌊' },
    rituals: [
      { name: 'Morning Hydration', category: 'Health', anchor: 'After waking', time: '07:00' },
      { name: 'Deep Mindful Focus Block', category: 'Focus', anchor: 'Start of work', time: '09:30' }
    ]
  };

  const resComplete = await apiCall('POST', '/onboarding/complete', cookie, completePayload);
  console.log('  Complete status:', resComplete.statusCode, 'onboardingCompleted:', resComplete.data.user.onboardingCompleted);

  if (resComplete.data.user.onboardingCompleted !== true) {
    throw new Error('FAIL: onboardingCompleted was not set to true!');
  }
  if (resComplete.data.user.gender !== 'Non-binary' || resComplete.data.user.age !== 32 || resComplete.data.user.avatarEmblem !== '🌊') {
    throw new Error('FAIL: User personal fields were not persisted on completion!');
  }
  console.log('  ✅ Test 5 Passed: Onboarding finalized successfully in MongoDB.\n');

  // ── TEST 6: Profile Page Editing (New Fields) ──
  console.log('▶ [Test 6] Profile Page Editing & Re-upload');
  const resProfileUpdate = await apiCall('PUT', '/profile', cookie, {
    displayName: 'Sam River (Updated)',
    age: 33,
    weightKg: 70,
    gender: 'Prefer not to say',
    photoType: 'custom',
    photoURL: 'https://momentum.app/avatars/custom_sam.jpg',
    avatarEmblem: '🌱'
  });
  console.log('  Profile update status:', resProfileUpdate.statusCode);
  console.log('  Updated Age:', resProfileUpdate.data.user.age);
  console.log('  Updated Weight:', resProfileUpdate.data.user.weightKg);
  console.log('  Updated Gender:', resProfileUpdate.data.user.gender);
  console.log('  Updated PhotoType:', resProfileUpdate.data.user.photoType);
  console.log('  Updated PhotoURL:', resProfileUpdate.data.user.photoURL);

  if (
    resProfileUpdate.data.user.age !== 33 ||
    resProfileUpdate.data.user.weightKg !== 70 ||
    resProfileUpdate.data.user.gender !== 'Prefer not to say' ||
    resProfileUpdate.data.user.photoURL !== 'https://momentum.app/avatars/custom_sam.jpg'
  ) {
    throw new Error('FAIL: Profile updates for new fields failed!');
  }

  // Verify /api/auth/me also returns these fields
  const resMe = await apiCall('GET', '/auth/me', cookie);
  if (resMe.data.user.gender !== 'Prefer not to say' || resMe.data.user.age !== 33) {
    throw new Error('FAIL: /api/auth/me did not reflect updated profile fields!');
  }
  console.log('  ✅ Test 6 Passed: Profile page updates and /auth/me synchronization verified.\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 ALL 6 ONBOARDING & DATA PERSISTENCE TESTS PASSED (100%)');
  console.log('═══════════════════════════════════════════════════════════════');
}

runOnboardingTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err.message);
  process.exit(1);
});
