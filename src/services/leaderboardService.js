/**
 * leaderboardService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Data layer for Weekly Sanctuary Challenge & Community Leaderboard.
 *
 * HOW TO SWAP TO FIREBASE / SUPABASE / REST API:
 * 1. Set MOCK_DATA = false below.
 * 2. In getWeeklyLeaderboard(weekId):
 *    - Firebase: const snap = await getDocs(query(collection(db, 'leaderboards', weekId, 'participants'), orderBy('weeklyScore', 'desc')));
 *    - Supabase: const { data } = await supabase.from('weekly_leaderboard').select('*').eq('week_id', weekId).order('weekly_score', { ascending: false });
 *    - REST: const res = await fetch(`/api/leaderboard?week=${weekId}`);
 * 3. In joinChallenge() / leaveChallenge():
 *    - Perform corresponding setDoc / insert / delete call.
 * 4. The UI components (ChallengePage) ONLY call this service interface and
 *    never interact with mock data directly!
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { calculateWeeklyChallengeScore } from '../config/scoreConfig.js';

export const MOCK_DATA = true;

// 24 Botanical / Mindful anonymous personas (NO real names or photos)
const BOTANICAL_PERSONAS = [
  { nickname: 'QuietFern', avatar: '🌿', baseScore: 920, adherence: 96, focusMins: 180 },
  { nickname: 'MorningTide', avatar: '🌊', baseScore: 885, adherence: 94, focusMins: 165 },
  { nickname: 'CedarBreeze', avatar: '🌲', baseScore: 840, adherence: 91, focusMins: 140 },
  { nickname: 'SageDrift', avatar: '🍃', baseScore: 815, adherence: 89, focusMins: 155 },
  { nickname: 'SunlitMoss', avatar: '☀️', baseScore: 780, adherence: 88, focusMins: 130 },
  { nickname: 'RiverPebble', avatar: '🪨', baseScore: 755, adherence: 87, focusMins: 120 },
  { nickname: 'BambooHollow', avatar: '🎋', baseScore: 730, adherence: 85, focusMins: 125 },
  { nickname: 'AutumnLeaf', avatar: '🍂', baseScore: 705, adherence: 84, focusMins: 110 },
  { nickname: 'StillWaters', avatar: '💧', baseScore: 680, adherence: 83, focusMins: 105 },
  { nickname: 'DuskSparrow', avatar: '🕊️', baseScore: 655, adherence: 82, focusMins: 95 },
  { nickname: 'WildLotus', avatar: '🪷', baseScore: 630, adherence: 80, focusMins: 100 },
  { nickname: 'AmberGlow', avatar: '✨', baseScore: 605, adherence: 79, focusMins: 90 },
  { nickname: 'SilverBirch', avatar: '🌾', baseScore: 580, adherence: 78, focusMins: 85 },
  { nickname: 'CanyonEcho', avatar: '🏔️', baseScore: 550, adherence: 76, focusMins: 80 },
  { nickname: 'PineNeedle', avatar: '🌱', baseScore: 520, adherence: 75, focusMins: 75 },
  { nickname: 'LichenRock', avatar: '🪴', baseScore: 490, adherence: 74, focusMins: 70 },
  { nickname: 'DawnMist', avatar: '🌫️', baseScore: 460, adherence: 72, focusMins: 65 },
  { nickname: 'DesertSage', avatar: '🌵', baseScore: 430, adherence: 70, focusMins: 60 },
  { nickname: 'CloverField', avatar: '🍀', baseScore: 400, adherence: 68, focusMins: 55 },
  { nickname: 'EchoMeadow', avatar: '🌻', baseScore: 370, adherence: 66, focusMins: 50 },
  { nickname: 'MoonlitReed', avatar: '🌙', baseScore: 340, adherence: 65, focusMins: 45 },
  { nickname: 'ValleyMist', avatar: '☁️', baseScore: 310, adherence: 62, focusMins: 40 },
  { nickname: 'RainfallSprout', avatar: '🌧️', baseScore: 280, adherence: 60, focusMins: 35 },
  { nickname: 'TerraStone', avatar: '🪐', baseScore: 250, adherence: 58, focusMins: 30 }
];

/**
 * Returns current ISO Year + Week string, e.g. "2026-W39"
 */
export function getCurrentWeekId() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  // Thursday in current week decides the year.
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Deterministic pseudo-random number generator seeded by integer
 */
function seededRandom(seed) {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

/**
 * Hash string to integer
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Retrieves the weekly leaderboard with demo participants deterministically generated
 * and seamlessly merges the real user's live score from the store if joined.
 */
export async function getWeeklyLeaderboard({
  weekId = getCurrentWeekId(),
  userProfile = null,
  userMetrics = null,
  sortBy = 'weeklyScore' // 'weeklyScore' | 'practiceScore' | 'adherence'
} = {}) {
  const seed = hashString(weekId);

  // Generate deterministic community participants
  const participants = BOTANICAL_PERSONAS.map((persona, index) => {
    const pSeed = seed + index * 17;
    const scoreFluctuation = Math.floor(seededRandom(pSeed) * 40) - 20;
    const adherenceFluctuation = Math.floor(seededRandom(pSeed + 1) * 6) - 3;
    const focusFluctuation = Math.floor(seededRandom(pSeed + 2) * 30) - 15;

    const practiceScore = Math.max(120, persona.baseScore + scoreFluctuation);
    const adherence = Math.min(100, Math.max(50, persona.adherence + adherenceFluctuation));
    const focusMins = Math.max(20, persona.focusMins + focusFluctuation);

    // Weekly combined score
    const weeklyScore = calculateWeeklyChallengeScore({
      weeklyPracticePoints: practiceScore,
      avgAdherence: adherence,
      focusMinutes: focusMins
    });

    // Movement trend: +1 (up), 0 (same), -1 (down - neutral grey)
    const movementRand = seededRandom(pSeed + 3);
    const movement = movementRand > 0.65 ? 1 : movementRand > 0.35 ? 0 : -1;

    return {
      id: `botanical-${index}`,
      nickname: persona.nickname,
      avatar: persona.avatar,
      weeklyScore,
      practiceScore,
      adherence,
      focusMins,
      movement,
      isCurrentUser: false
    };
  });

  // If user has opted in to the challenge, calculate and insert their REAL data row!
  if (userProfile && userProfile.challengeJoined && userMetrics) {
    const userPractice = Math.round(userMetrics.totalPoints * 0.25);
    const userAdherence = userMetrics.dailyAdherenceScore;
    const userFocus = userMetrics.focusMins;

    const userWeeklyScore = calculateWeeklyChallengeScore({
      weeklyPracticePoints: userPractice,
      avgAdherence: userAdherence,
      focusMinutes: userFocus
    });

    participants.push({
      id: 'current-user-standing',
      nickname: userProfile.challengeNickname || 'You',
      avatar: userProfile.challengeAvatar || '🌱',
      weeklyScore: userWeeklyScore,
      practiceScore: userPractice,
      adherence: userAdherence,
      focusMins: userFocus,
      movement: 1, // Encouraging soft green trend for active presence
      isCurrentUser: true
    });
  }

  // Sort based on chosen metric
  participants.sort((a, b) => {
    if (sortBy === 'adherence') {
      return b.adherence - a.adherence;
    }
    if (sortBy === 'practiceScore') {
      return b.practiceScore - a.practiceScore;
    }
    return b.weeklyScore - a.weeklyScore;
  });

  // Assign 1-indexed ranks
  return participants.map((item, idx) => ({
    ...item,
    rank: idx + 1
  }));
}

/**
 * Returns last week's podium winners
 */
export async function getLastWeekWinners() {
  return [
    { rank: 1, nickname: 'CedarBreeze', avatar: '🌲', weeklyScore: 618, note: 'Consistency Anchor' },
    { rank: 2, nickname: 'QuietFern', avatar: '🌿', weeklyScore: 594, note: 'Mindful Breathing' },
    { rank: 3, nickname: 'MorningTide', avatar: '🌊', weeklyScore: 572, note: 'Daily Daylight Walk' }
  ];
}
