/**
 * Client-side moderation filter for immediate instant feedback before sending.
 */

export const SAFETY_WARNING =
  "For everyone's safety, messages can't include contact details or personal info. This space is for building good habits together.";

const PHONE_REGEXES = [
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,
  /\b\d{10,12}\b/,
  /(?:\b\d[-.\s]?){7,11}\b/
];

const EMAIL_REGEXES = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
  /[a-zA-Z0-9._%+-]+\s*(?:\[at\]|\(at\)|@)\s*[a-zA-Z0-9.-]+\s*(?:\[dot\]|\(dot\)|\.)\s*[a-zA-Z]{2,}/i
];

const SOCIAL_REGEXES = [
  /(?:^|\s)@[a-zA-Z0-9_.]{3,30}\b/,
  /\b(?:ig|insta|instagram|snap|snapchat|discord|tiktok|tg|telegram|whatsapp|wa|twitter|twtr)[\s:=]+[a-zA-Z0-9_.]+/i,
  /\b(?:t\.me|wa\.me|discord\.gg|instagram\.com|snapchat\.com|twitter\.com|x\.com)\/[a-zA-Z0-9_.]+/i
];

const BLOCKED_WORDS = [
  'kill yourself',
  'kys',
  'hate you',
  'whore',
  'slut',
  'bitch',
  'cunt',
  'fag',
  'faggot',
  'nigger',
  'nigga',
  'retard',
  'asshole',
  'dickhead'
];

export function validateSafeContent(text) {
  if (!text || typeof text !== 'string') {
    return { passed: true };
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  for (const regex of PHONE_REGEXES) {
    if (regex.test(clean)) {
      return { passed: false, warning: SAFETY_WARNING, reason: 'phone_number_detected' };
    }
  }

  for (const regex of EMAIL_REGEXES) {
    if (regex.test(clean)) {
      return { passed: false, warning: SAFETY_WARNING, reason: 'email_detected' };
    }
  }

  for (const regex of SOCIAL_REGEXES) {
    if (regex.test(clean)) {
      return { passed: false, warning: SAFETY_WARNING, reason: 'social_handle_detected' };
    }
  }

  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return { passed: false, warning: SAFETY_WARNING, reason: 'abusive_language_detected' };
    }
  }

  return { passed: true };
}
