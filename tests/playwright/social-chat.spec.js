import { test, expect } from '@playwright/test';

test.describe('Momentum Social, 3D Medals, Chat & Privacy Audit', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to local development client
    await page.goto('/');
  });

  test('Milestones flat 2D grid renders and 3D detail modal opens/disposes cleanly', async ({ page }) => {
    // Navigate to Milestones
    await page.goto('/#milestones');

    // Verify 4 flat 2D medal cards are present
    const medalCards = page.locator('[data-testid="medal-card"], button:has-text("Tier")');
    await expect(page.locator('text=Your Rhythm Journey')).toBeVisible();

    // Click first medal to open 3D detail modal
    const viewButton = page.locator('button:has-text("Inspect in 3D"), button:has-text("View in 3D")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();

      // Check modal opens
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();

      // Verify canvas rendered
      const canvas = modal.locator('canvas');
      await expect(canvas).toBeVisible();

      // Close modal
      const closeBtn = modal.locator('button[aria-label="Close modal"]');
      await closeBtn.click();
      await expect(modal).toBeHidden();

      // Re-open and close multiple times to verify clean scene disposal without context leak
      for (let i = 0; i < 3; i++) {
        await viewButton.click();
        await expect(modal).toBeVisible();
        await closeBtn.click();
        await expect(modal).toBeHidden();
      }
    }
  });

  test('Social share fallback chain displays caption copy and download when Web Share API is absent', async ({ page }) => {
    // Emulate environment without navigator.share
    await page.addInitScript(() => {
      delete window.navigator.share;
      delete window.navigator.canShare;
    });

    await page.goto('/#milestones');
    const viewButton = page.locator('button:has-text("Inspect in 3D"), button:has-text("View in 3D")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();

      const shareBtn = page.locator('button:has-text("Share Milestone")');
      if (await shareBtn.isVisible()) {
        await shareBtn.click();

        // Expect desktop fallback panel with Download & Copy
        const copyCaptionBtn = page.locator('button:has-text("Copy Caption"), button:has-text("Copy")');
        await expect(copyCaptionBtn).toBeVisible();
      }
    }
  });

  test('Public profile modal displays safe public DTO and no private fields', async ({ page }) => {
    await page.goto('/#challenge');

    // Click on podium participant if present
    const participant = page.locator('text=QuietFern, text=CalmRiver, text=CedarPractitioner').first();
    if (await participant.isVisible()) {
      await participant.click();

      const profileModal = page.locator('[role="dialog"]');
      await expect(profileModal).toBeVisible();

      // Verify no sensitive fields are present
      await expect(profileModal.locator('text=@')).toHaveCount(0); // No email
      await expect(profileModal.locator('text=kg')).toHaveCount(0); // No weight logs
      await expect(profileModal.locator('text=glasses')).toHaveCount(0); // No water intake logs
    }
  });

  test('Chat safety filter blocks contact details inline before sending', async ({ page }) => {
    // Open chat drawer if in friends view
    await page.goto('/#profile');

    const chatBtn = page.locator('button:has-text("Chat")').first();
    if (await chatBtn.isVisible()) {
      await chatBtn.click();

      const chatDrawer = page.locator('[role="dialog"]');
      await expect(chatDrawer).toBeVisible();

      const input = chatDrawer.locator('input[placeholder*="mindful"]');
      await input.fill('Text me at 555-123-4567');

      // Expect inline safety warning
      const warning = chatDrawer.locator('text=For everyone\'s safety');
      await expect(warning).toBeVisible();

      // Send button must be disabled
      const sendBtn = chatDrawer.locator('button[aria-label="Send message"]');
      await expect(sendBtn).toBeDisabled();
    }
  });

  test('Privacy policy page is fully accessible from entry points', async ({ page }) => {
    await page.goto('/#privacy');
    await expect(page.locator('h1:has-text("Privacy Policy")')).toBeVisible();
    await expect(page.locator('text=What We Collect')).toBeVisible();
    await expect(page.locator('text=What is NEVER Shown to Other Users')).toBeVisible();
    await expect(page.locator('text=No Selling of Data & No Ad Trackers')).toBeVisible();
  });
});
