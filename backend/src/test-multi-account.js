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

async function runTests() {
  console.log('--- Starting Multi-Account & Data Isolation Verification ---');

  const ts = Date.now();
  const uidA = `test-user-a-${ts}`;
  const uidB = `test-user-b-${ts}`;

  // Helper to make authenticated requests
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

  // ── Step 1: Register User A ──
  console.log('\n[User A] 1. Creating session / Registering...');
  const tokenA = jwt.sign(
    { sub: uidA, email: `${uidA}@example.com`, name: 'User A', exp: Math.floor(Date.now() / 1000) + 3600 },
    'secret'
  );
  const resLoginA = await apiCall('POST', '/auth/session', null, { idToken: tokenA });
  console.log('User A Session:', resLoginA.statusCode, 'isNewUser:', resLoginA.data.isNewUser);
  const cookieA = extractCookie(resLoginA.headers);
  if (!cookieA) throw new Error('No cookie returned for User A');

  console.log('[User A] onboardingCompleted initially:', resLoginA.data.user.onboardingCompleted);
  if (resLoginA.data.user.onboardingCompleted !== false) {
    throw new Error('User A should start with onboardingCompleted: false');
  }

  // Verify User A starts with 0 habits and 0 water and 0 focus
  const todayA0 = await apiCall('GET', '/today', cookieA);
  console.log('[User A] Initial clean check: rituals =', todayA0.data.rituals.length,
    'waterMl =', todayA0.data.metrics.waterMl,
    'focusMinutes =', todayA0.data.metrics.focusMinutes,
    'dailyAdherence =', todayA0.data.metrics.dailyAdherenceScore
  );
  if (todayA0.data.rituals.length !== 0 || todayA0.data.metrics.waterMl !== 0 || todayA0.data.metrics.focusMinutes !== 0) {
    throw new Error('User A initial state is not zeroed/clean!');
  }

  // ── Step 2: User A Completes Onboarding ──
  console.log('\n[User A] 2. Completing Onboarding Setup...');
  const resOnboardA = await apiCall('PUT', '/profile', cookieA, {
    displayName: 'Alice Practitioner',
    mantra: 'Breathe and create.',
    timezone: 'America/New_York',
    units: { volume: 'ml', weight: 'kg' },
    goals: { waterMl: 2500, proteinG: 100, focusMin: 45 },
    challenge: { optedIn: true, nickname: 'AliceFlow', avatar: '🌸' },
    onboardingCompleted: true
  });
  console.log('[User A] Onboarding update:', resOnboardA.statusCode, 'onboardingCompleted:', resOnboardA.data.user.onboardingCompleted);

  // User A creates 2 starter habits via batch endpoint
  const resRitualsA = await apiCall('POST', '/rituals/batch', cookieA, {
    rituals: [
      { name: 'Morning Tea & Intention', category: 'Mind', anchor: 'After waking', time: '07:00' },
      { name: '45m Deep Code Focus', category: 'Focus', anchor: 'Morning block', time: '09:00' }
    ]
  });
  console.log('[User A] Created rituals batch:', resRitualsA.data.rituals.length);
  const ritualA1 = resRitualsA.data.rituals[0];

  // ── Step 3: User A Checks In Habit & Untoggles (Uncheck) ──
  console.log('\n[User A] 3. Testing habit checkin & uncheck toggle...');
  const resCheckin = await apiCall('POST', `/rituals/${ritualA1._id}/checkin`, cookieA, {});
  console.log('[User A] Checked in ritual. Completed habits count:', resCheckin.data.overview.metrics.completedHabitsCount);
  if (resCheckin.data.overview.metrics.completedHabitsCount !== 1) {
    throw new Error('User A completedHabitsCount should be 1 after checkin');
  }

  const resUncheck = await apiCall('POST', `/rituals/${ritualA1._id}/uncheck`, cookieA, {});
  console.log('[User A] Unchecked ritual. Completed habits count:', resUncheck.data.overview.metrics.completedHabitsCount);
  if (resUncheck.data.overview.metrics.completedHabitsCount !== 0) {
    throw new Error('User A completedHabitsCount should be 0 after uncheck');
  }

  // Re-check in ritual for User A
  await apiCall('POST', `/rituals/${ritualA1._id}/checkin`, cookieA, {});

  // ── Step 4: User A Hydration Operations ──
  console.log('\n[User A] 4. Testing Hydration (Increment, Decrement, Set)...');
  // Increment +500ml (2 logs of 250)
  await apiCall('POST', '/hydration', cookieA, { amountMl: 250 });
  const hydrInc = await apiCall('POST', '/hydration', cookieA, { amountMl: 250 });
  console.log('[User A] After +500ml:', hydrInc.data.overview.metrics.waterMl, 'ml');

  // Decrement -250ml
  const hydrDec = await apiCall('POST', '/hydration/decrement', cookieA, {});
  console.log('[User A] After decrement:', hydrDec.data.overview.metrics.waterMl, 'ml');
  if (hydrDec.data.overview.metrics.waterMl !== 250) {
    throw new Error(`Expected 250ml after decrement, got ${hydrDec.data.overview.metrics.waterMl}`);
  }

  // Set water to 1250ml
  const hydrSet = await apiCall('PUT', '/hydration', cookieA, { targetMl: 1250 });
  console.log('[User A] After setWater(1250):', hydrSet.data.overview.metrics.waterMl, 'ml');
  if (hydrSet.data.overview.metrics.waterMl !== 1250) {
    throw new Error(`Expected 1250ml after setWater, got ${hydrSet.data.overview.metrics.waterMl}`);
  }

  // ── Step 5: User A Focus Session ──
  console.log('\n[User A] 5. Logging Focus Session...');
  const resFocus = await apiCall('POST', '/focus/sessions', cookieA, {
    plannedMin: 45,
    actualMin: 45,
    intention: 'Architecture refactor',
    tag: 'deep-work',
    completed: true
  });
  console.log('[User A] Focus logged. Focus minutes:', resFocus.data.overview.metrics.focusMinutes);
  if (resFocus.data.overview.metrics.focusMinutes !== 45) {
    throw new Error(`Expected 45 focus minutes, got ${resFocus.data.overview.metrics.focusMinutes}`);
  }

  // ── Step 6: Register User B (DATA ISOLATION TEST) ──
  console.log('\n[User B] 6. Creating Brand New User B session...');
  const tokenB = jwt.sign(
    { sub: uidB, email: `${uidB}@example.com`, name: 'User B', exp: Math.floor(Date.now() / 1000) + 3600 },
    'secret'
  );
  const resLoginB = await apiCall('POST', '/auth/session', null, { idToken: tokenB });
  console.log('User B Session:', resLoginB.statusCode, 'isNewUser:', resLoginB.data.isNewUser);
  const cookieB = extractCookie(resLoginB.headers);

  console.log('[User B] onboardingCompleted initially:', resLoginB.data.user.onboardingCompleted);
  if (resLoginB.data.user.onboardingCompleted !== false) {
    throw new Error('User B must start with onboardingCompleted: false');
  }

  console.log('[User B] 7. Verifying STRICT DATA ISOLATION from User A...');
  const todayB = await apiCall('GET', '/today', cookieB);
  console.log('[User B] Data:',
    'ritualsCount =', todayB.data.rituals.length,
    'waterMl =', todayB.data.metrics.waterMl,
    'focusMinutes =', todayB.data.metrics.focusMinutes,
    'completedHabitsCount =', todayB.data.metrics.completedHabitsCount,
    'dailyAdherenceScore =', todayB.data.metrics.dailyAdherenceScore
  );

  // Assertions for zero-leakage
  if (todayB.data.rituals.length !== 0) {
    throw new Error(`DATA LEAKAGE: User B sees ${todayB.data.rituals.length} rituals! Expected 0.`);
  }
  if (todayB.data.metrics.waterMl !== 0) {
    throw new Error(`DATA LEAKAGE: User B sees ${todayB.data.metrics.waterMl} ml water! Expected 0.`);
  }
  if (todayB.data.metrics.focusMinutes !== 0) {
    throw new Error(`DATA LEAKAGE: User B sees ${todayB.data.metrics.focusMinutes} focus minutes! Expected 0.`);
  }
  if (todayB.data.metrics.completedHabitsCount !== 0) {
    throw new Error(`DATA LEAKAGE: User B sees ${todayB.data.metrics.completedHabitsCount} completed habits! Expected 0.`);
  }
  if (todayB.data.metrics.dailyAdherenceScore !== 0) {
    throw new Error(`DATA LEAKAGE: User B sees adherence ${todayB.data.metrics.dailyAdherenceScore}%! Expected 0%.`);
  }
  console.log('>>> ZERO DATA LEAKAGE CONFIRMED: User B has a 100% clean account! <<<');

  // ── Step 7.1: Workout & Personal Record Cross-Account Isolation Test ──
  console.log('\n[Workouts & PRs] 7.1 Testing Personal Records Isolation...');
  // User A logs Bench Press at 80kg (creating PR for User A)
  const resWorkoutA = await apiCall('POST', '/workouts', cookieA, {
    workoutName: 'Bench Press',
    muscleGroup: 'chest',
    sets: [
      { weightKg: 70, reps: 10 },
      { weightKg: 80, reps: 6 }
    ],
    pacing: 'Moderate',
    feel: 'Challenging'
  });
  console.log('[User A] Logged Bench Press 80kg. New PR:', resWorkoutA.data.newPR);
  if (!resWorkoutA.data.newPR) throw new Error('Expected new PR for User A');

  // Verify User A has 1 PR of 80kg
  const prsA = await apiCall('GET', '/workouts/prs', cookieA);
  console.log('[User A] PRs count:', prsA.data.prs.length, 'Best weight:', prsA.data.prs[0]?.weightKg);
  if (prsA.data.prs.length !== 1 || prsA.data.prs[0].weightKg !== 80) {
    throw new Error('User A should have 1 PR with 80kg');
  }

  // User B checks PRs & exercise library -> MUST BE 0 PRs and ALL personalBest = null!
  const prsB = await apiCall('GET', '/workouts/prs', cookieB);
  console.log('[User B] PRs count:', prsB.data.prs.length);
  if (prsB.data.prs.length !== 0) {
    throw new Error(`DATA LEAKAGE: User B sees ${prsB.data.prs.length} PRs from User A! Expected 0.`);
  }

  const exB = await apiCall('GET', '/workouts/exercises', cookieB);
  const benchExB = exB.data.exercises.find(e => e.name === 'Bench Press');
  console.log('[User B] Bench Press personalBest:', benchExB?.personalBest);
  if (benchExB?.personalBest !== null) {
    throw new Error('DATA LEAKAGE: User B exercise catalog shows User A personalBest!');
  }
  console.log('>>> ZERO PR LEAKAGE CONFIRMED: User B starts with 0 PRs and null personalBest! <<<');

  // User B logs Bench Press at 50kg
  await apiCall('POST', '/workouts', cookieB, {
    workoutName: 'Bench Press',
    muscleGroup: 'chest',
    sets: [{ weightKg: 50, reps: 10 }]
  });

  const prsBAfter = await apiCall('GET', '/workouts/prs', cookieB);
  const prsAAfter = await apiCall('GET', '/workouts/prs', cookieA);
  console.log('[User B] PR weight:', prsBAfter.data.prs[0]?.weightKg, '[User A] PR weight:', prsAAfter.data.prs[0]?.weightKg);
  if (prsBAfter.data.prs[0]?.weightKg !== 50 || prsAAfter.data.prs[0]?.weightKg !== 80) {
    throw new Error('Cross-account PR corruption detected!');
  }
  console.log('>>> COMPLETE USER-SPECIFIC PR SEPARATION CONFIRMED! <<<');

  // ── Step 8: Challenge API Verification ──
  console.log('\n[Challenge] 9. Verifying Leaderboard endpoints...');
  const resLeaderboard = await apiCall('GET', '/challenge/weekly', cookieA);
  console.log('Leaderboard response:', resLeaderboard.statusCode, 'participants:', resLeaderboard.data.participants?.length);
  if (!Array.isArray(resLeaderboard.data.participants)) {
    throw new Error('Leaderboard participants must be an array');
  }

  const resLastWeek = await apiCall('GET', '/challenge/last-week-winners', cookieA);
  console.log('Last week winners response:', resLastWeek.statusCode, 'winners:', resLastWeek.data.winners?.length);
  if (!Array.isArray(resLastWeek.data.winners)) {
    throw new Error('Last week winners must be an array');
  }

  console.log('\n=========================================');
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY! ✅');
  console.log('=========================================');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
