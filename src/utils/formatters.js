/**
 * formatters.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared formatting utilities across Momentum.
 * Single source of truth for string casing, pluralization, and dates.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * Pluralizes a word based on count.
 * e.g. pluralize(1, "day") => "1 day"
 *      pluralize(2, "day") => "2 days"
 *      pluralize(0, "day") => "0 days"
 */
export function pluralize(count, singular, plural = null) {
  const n = typeof count === 'number' ? count : parseInt(count, 10) || 0;
  const word = n === 1 ? singular : (plural || `${singular}s`);
  return `${n} ${word}`;
}

/**
 * Title-cases a user name, handling mixed case and multiple names.
 * e.g. "aditya mamidala" => "Aditya Mamidala"
 *      "adithya" => "Adithya"
 */
export function titleCaseName(name) {
  if (!name || typeof name !== 'string') return 'Friend';
  return name
    .trim()
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Formats a date into a warm, friendly string.
 * Returns "Today", "Yesterday", or "Tue, Sep 22" (current year 2026).
 * Replaces raw ISO strings like "2026-09-24".
 */
export function formatFriendlyDate(dateInput) {
  if (!dateInput) return 'Today';
  
  let d;
  if (dateInput instanceof Date) {
    d = dateInput;
  } else if (typeof dateInput === 'string') {
    // If it's a YYYY-MM-DD string, parse parts to avoid timezone shift
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      const [year, month, day] = dateInput.split('-').map(Number);
      d = new Date(year, month - 1, day);
    } else {
      d = new Date(dateInput);
    }
  } else if (typeof dateInput === 'number') {
    d = new Date(dateInput);
  } else {
    return 'Today';
  }

  if (isNaN(d.getTime())) return 'Today';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  const diffTime = today.getTime() - target.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';

  // Format as "Wed, Sep 24"
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Formats a timestamp into friendly time e.g. "11:30 AM"
 */
export function formatFriendlyTime(dateInput) {
  if (!dateInput) return '';
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Returns current real date formatted for default store entries
 */
export function getCurrentDateISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
