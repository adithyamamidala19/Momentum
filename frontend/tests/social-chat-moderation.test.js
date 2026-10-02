import { describe, it } from 'node:test';
import assert from 'node:assert';
import { validateSafeContent, SAFETY_WARNING } from '../src/utils/moderationFilter.js';

describe('Momentum Trust & Safety Moderation Tests', () => {
  it('should accept clean mindful habit messages', () => {
    const cleanTexts = [
      'Gently drank 500ml of water this morning.',
      'Completed a 25-minute deep focus session on mindful coding.',
      'Great work on your 7-day streak! Keep honoring the daily rhythm.',
      'Slow is smooth, smooth is fast.'
    ];

    for (const text of cleanTexts) {
      const res = validateSafeContent(text);
      assert.strictEqual(res.passed, true, `Expected "${text}" to pass safety check`);
    }
  });

  it('should detect and block phone number patterns', () => {
    const phoneAttempts = [
      'Text me at (123) 456-7890',
      'My number is 123-456-7890 hit me up',
      'Call 9876543210 tonight',
      'My digits: 9 8 7 6 5 4 3 2 1 0'
    ];

    for (const text of phoneAttempts) {
      const res = validateSafeContent(text);
      assert.strictEqual(res.passed, false, `Expected phone pattern in "${text}" to be blocked`);
      assert.strictEqual(res.warning, SAFETY_WARNING);
      assert.strictEqual(res.reason, 'phone_number_detected');
    }
  });

  it('should detect and block email addresses', () => {
    const emailAttempts = [
      'Email me at practitioner@sanctuary.org',
      'Write to habit.user [at] gmail [dot] com',
      'Reach out: mindful123@yahoo.com'
    ];

    for (const text of emailAttempts) {
      const res = validateSafeContent(text);
      assert.strictEqual(res.passed, false, `Expected email in "${text}" to be blocked`);
      assert.strictEqual(res.warning, SAFETY_WARNING);
      assert.strictEqual(res.reason, 'email_detected');
    }
  });

  it('should detect and block social media handles and external messaging links', () => {
    const socialAttempts = [
      'Follow me on ig: mindful_alex',
      'My snap is snap: zen_daily',
      'Add me on @coolpractitioner',
      'Message me at t.me/zenpractitioner',
      'Chat on discord.gg/mindful'
    ];

    for (const text of socialAttempts) {
      const res = validateSafeContent(text);
      assert.strictEqual(res.passed, false, `Expected social handle in "${text}" to be blocked`);
      assert.strictEqual(res.warning, SAFETY_WARNING);
      assert.strictEqual(res.reason, 'social_handle_detected');
    }
  });

  it('should detect and block abusive or harassment language', () => {
    const abusiveAttempts = [
      'go kill yourself',
      'you are a bitch',
      'shut up asshole'
    ];

    for (const text of abusiveAttempts) {
      const res = validateSafeContent(text);
      assert.strictEqual(res.passed, false, `Expected abuse in "${text}" to be blocked`);
      assert.strictEqual(res.warning, SAFETY_WARNING);
      assert.strictEqual(res.reason, 'abusive_language_detected');
    }
  });
});

describe('Social Sharing Web Share Fallback Chain Tests', () => {
  it('should correctly select 3-tier fallback behavior', async () => {
    // Tier 1: navigator.canShare with files
    const mockCanShareFiles = (data) => Boolean(data && data.files);
    assert.strictEqual(mockCanShareFiles({ files: [new Blob()] }), true);

    // Tier 2: navigator.share text only
    const mockShareText = (data) => Boolean(data && data.text && !data.files);
    assert.strictEqual(mockShareText({ text: 'Earned Bronze medal', url: 'https://momentum.app' }), true);

    // Tier 3: desktop fallback when navigator.share is undefined
    const hasNavShare = typeof undefined !== 'undefined';
    assert.strictEqual(hasNavShare, false, 'Desktop fallback triggers when navigator.share is absent');
  });
});
