/**
 * Timezone and Date Utility
 * Converts UTC Dates to/from user local dates and handles week boundaries.
 */

/**
 * Returns current YYYY-MM-DD string in specified IANA timezone (or UTC fallback)
 */
export function getLocalDateString(date = new Date(), timezone = 'UTC') {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

/**
 * Computes difference in calendar days between two YYYY-MM-DD strings
 */
export function getDaysBetween(dateStrA, dateStrB) {
  const a = new Date(`${dateStrA}T00:00:00Z`);
  const b = new Date(`${dateStrB}T00:00:00Z`);
  const diffTime = Math.abs(b - a);
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Returns current ISO Year + Week string, e.g. "2026-W39" based on standard ISO-8601
 */
export function getIsoWeekId(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  // Calculate full weeks to nearest Thursday
  const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

/**
 * Returns the date string for yesterday in given timezone
 */
export function getYesterdayDateString(timezone = 'UTC') {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d, timezone);
}

/**
 * Checks if a given timestamp falls into today in user's timezone
 */
export function isTimestampToday(timestamp, timezone = 'UTC') {
  const todayStr = getLocalDateString(new Date(), timezone);
  const itemStr = getLocalDateString(new Date(timestamp), timezone);
  return todayStr === itemStr;
}
