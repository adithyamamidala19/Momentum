/**
 * leaderboardService.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Real-user API client for Weekly Sanctuary Challenge & Community Leaderboard.
 * Connects directly to backend Express + MongoDB Aggregation service.
 * ZERO mock data or fictional personas in production.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { api } from './apiClient.js';

export const MOCK_DATA = false;

/**
 * Returns current ISO Year + Week string, e.g. "2026-W39"
 */
export function getCurrentWeekId() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNumber = 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return `${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Retrieves the real-user weekly leaderboard from MongoDB aggregation API
 */
export async function getWeeklyLeaderboard({
  weekId = getCurrentWeekId(),
  sortBy = 'weeklyScore'
} = {}) {
  try {
    const data = await api.get(`/challenge/weekly?sort=${sortBy}&week=${weekId}`);
    return {
      weekId: data.weekId || weekId,
      totalParticipants: data.totalParticipants || 0,
      participants: data.participants || [],
      userRank: data.userRank || null,
      isWarmEmpty: Boolean(data.isWarmEmpty),
      emptyMessage: data.emptyMessage || null,
      shareLink: data.shareLink || 'https://momentum.app/challenge'
    };
  } catch (err) {
    console.warn('Failed to load challenge leaderboard from server:', err);
    return {
      weekId,
      totalParticipants: 0,
      participants: [],
      userRank: null,
      isWarmEmpty: true,
      emptyMessage: 'Unable to reach the sanctuary challenge registry. Please verify connection.',
      shareLink: 'https://momentum.app/challenge'
    };
  }
}

/**
 * Opts user into weekly challenge
 */
export async function joinChallenge({ nickname, avatar }) {
  const res = await api.post('/challenge/join', { nickname, avatar });
  return res;
}

/**
 * Opts user out of weekly challenge
 */
export async function leaveChallenge() {
  const res = await api.post('/challenge/leave', {});
  return res;
}

/**
 * Retrieves last week's podium winners
 */
export async function getLastWeekWinners() {
  try {
    const res = await api.get('/challenge/last-week-winners');
    return res;
  } catch {
    return { weekId: '', winners: [] };
  }
}
