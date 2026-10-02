import test from 'node:test';
import assert from 'node:assert/strict';
import { getLocalDateString, getDaysBetween, getIsoWeekId } from '../../src/utils/timezone.js';

test('Timezone and Midnight Boundary Calculations', async (t) => {
  await t.test('1. Converts UTC midnight to respective regional local dates', () => {
    // 2026-09-24T23:30:00Z is Sept 24 in New York, but Sept 25 in Tokyo
    const dateUtc = new Date('2026-09-24T23:30:00Z');

    const nyDate = getLocalDateString(dateUtc, 'America/New_York');
    const tokyoDate = getLocalDateString(dateUtc, 'Asia/Tokyo');
    const londonDate = getLocalDateString(dateUtc, 'Europe/London');

    assert.equal(nyDate, '2026-09-24');
    assert.equal(tokyoDate, '2026-09-25');
    assert.equal(londonDate, '2026-09-25'); // BST is UTC+1
  });

  await t.test('2. Handles Daylight Saving Time (DST) correctly', () => {
    // July (EDT, UTC-4) vs January (EST, UTC-5)
    const summer = new Date('2026-07-15T02:00:00Z');
    const winter = new Date('2026-01-15T02:00:00Z');

    // 02:00 UTC - 4 hrs = 22:00 of previous day
    assert.equal(getLocalDateString(summer, 'America/New_York'), '2026-07-14');
    // 02:00 UTC - 5 hrs = 21:00 of previous day
    assert.equal(getLocalDateString(winter, 'America/New_York'), '2026-01-14');
  });

  await t.test('3. Computes days between correctly across month and year boundaries', () => {
    assert.equal(getDaysBetween('2026-09-24', '2026-09-25'), 1);
    assert.equal(getDaysBetween('2026-09-20', '2026-09-24'), 4);
    assert.equal(getDaysBetween('2025-12-31', '2026-01-01'), 1);
  });

  await t.test('4. Computes ISO Week ID consistently', () => {
    const testDate = new Date('2026-09-24T12:00:00Z');
    const weekId = getIsoWeekId(testDate);
    assert.match(weekId, /^2026-W\d{2}$/);
  });
});
