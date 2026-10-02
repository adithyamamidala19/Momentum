/**
 * Momentum — Content Moderation & PII Shield
 * Detects and blocks phone numbers, email addresses, social media handles, external messaging links,
 * and harassment/profanity before messages or public bios are saved.
 */

const SAFETY_WARNING =
  "For everyone's safety, messages can't include contact details or personal info. This space is for building good habits together.";

// 1. Phone number patterns (various international, domestic, spaced, and punctuated formats)
const PHONE_REGEXES = [
  /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/, // (123) 456-7890, 123-456-7890
  /\b\d{3}[-.\s]\d{3}[-.\s]\d{4}\b/,
  /\b\d{10,12}\b/, // Raw 10-12 consecutive digits
  /(?:\b\d[-.\s]?){7,11}\b/ // Spaced out digits: 9 8 7 6 5 4 3 2 1 0
];

// 2. Email patterns (standard & common obfuscations)
const EMAIL_REGEXES = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i,
  /[a-zA-Z0-9._%+-]+\s*(?:\[at\]|\(at\)|@)\s*[a-zA-Z0-9.-]+\s*(?:\[dot\]|\(dot\)|\.)\s*[a-zA-Z]{2,}/i
];

// 3. Social media handles, messenger links, and cross-platform handles
const SOCIAL_REGEXES = [
  /(?:^|\s)@[a-zA-Z0-9_.]{3,30}\b/, // @username
  /\b(?:ig|insta|instagram|snap|snapchat|discord|tiktok|tg|telegram|whatsapp|wa|twitter|twtr)[\s:=]+[a-zA-Z0-9_.]+/i,
  /\b(?:t\.me|wa\.me|discord\.gg|instagram\.com|snapchat\.com|twitter\.com|x\.com)\/[a-zA-Z0-9_.]+/i
];

// 4. Core harassment & abusive wordlist
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

/**
 * Validates text against safety policies.
 * @param {string} text - User message, bio, or nickname
 * @returns {{ passed: boolean, warning?: string, reason?: string }}
 */
export function validateSafeContent(text) {
  if (!text || typeof text !== 'string') {
    return { passed: true };
  }

  const clean = text.trim();
  const lower = clean.toLowerCase();

  // 1. Check phone numbers
  for (const regex of PHONE_REGEXES) {
    if (regex.test(clean)) {
      return {
        passed: false,
        reason: 'phone_number_detected',
        warning: SAFETY_WARNING
      };
    }
  }

  // 2. Check emails
  for (const regex of EMAIL_REGEXES) {
    if (regex.test(clean)) {
      return {
        passed: false,
        reason: 'email_detected',
        warning: SAFETY_WARNING
      };
    }
  }

  // 3. Check social media handles
  for (const regex of SOCIAL_REGEXES) {
    if (regex.test(clean)) {
      return {
        passed: false,
        reason: 'social_handle_detected',
        warning: SAFETY_WARNING
      };
    }
  }

  // 4. Check blocked words
  for (const word of BLOCKED_WORDS) {
    if (lower.includes(word)) {
      return {
        passed: false,
        reason: 'abusive_language',
        warning: 'This message violates Momentum community guidelines. Please keep communication respectful and encouraging.'
      };
    }
  }

  return { passed: true };
}
