/**
 * Momentum — Social Share Helper (Web Share API Fallback Chain)
 * Generates branded share cards and handles native OS share sheets / desktop download fallbacks
 */

import { api } from '../../services/apiClient.js';

/**
 * Generates a branded PNG card with medal render, tier badge, nickname, and brand mark
 */
export async function generateShareCardBlob({
  canvasElement,
  medal,
  nickname = 'Practitioner'
}) {
  const width = 1080;
  const height = 1080;
  const offscreen = document.createElement('canvas');
  offscreen.width = width;
  offscreen.height = height;
  const ctx = offscreen.getContext('2d');

  // 1. Serene Sanctuary Background
  const grad = ctx.createLinearGradient(0, 0, width, height);
  grad.addColorStop(0, '#0F382E');
  grad.addColorStop(0.5, '#0B2922');
  grad.addColorStop(1, '#051411');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle background halo
  const halo = ctx.createRadialGradient(width / 2, height / 2 - 40, 50, width / 2, height / 2 - 40, 480);
  halo.addColorStop(0, 'rgba(160, 243, 212, 0.12)');
  halo.addColorStop(0.6, 'rgba(15, 110, 86, 0.08)');
  halo.addColorStop(1, 'transparent');
  ctx.fillStyle = halo;
  ctx.fillRect(0, 0, width, height);

  // Outer hairline border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 16;
  ctx.strokeRect(32, 32, width - 64, height - 64);

  // 2. Top App Header / Wordmark
  ctx.textAlign = 'center';
  ctx.fillStyle = '#A0F3D4';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('MOMENTUM SANCTUARY · MILESTONE TRAJECTORY', width / 2, 95);

  // 3. Draw 3D Canvas Snapshot in the Center
  if (canvasElement) {
    try {
      const imgSize = 560;
      const x = (width - imgSize) / 2;
      const y = (height - imgSize) / 2 - 40;
      ctx.drawImage(canvasElement, x, y, imgSize, imgSize);
    } catch (e) {
      console.warn('[ShareCard] Canvas draw fallback:', e);
    }
  }

  // 4. Bottom Info Plate
  ctx.textAlign = 'center';
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.fillText(medal.name || 'Milestone', width / 2, height - 260);

  ctx.fillStyle = '#E8F5F1';
  ctx.font = '32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${medal.tier} Tier · Conferred upon ${nickname}`, width / 2, height - 205);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'italic 24px Georgia, serif';
  ctx.fillText(
    medal.date ? `Verified rhythm achieved ${medal.date}` : `Pursuing ${medal.threshold || 'Milestone'}`,
    width / 2,
    height - 155
  );

  // App Footer Pill
  ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
  const pw = 360;
  const ph = 48;
  ctx.beginPath();
  ctx.roundRect((width - pw) / 2, height - 110, pw, ph, 24);
  ctx.fill();

  ctx.fillStyle = '#A0F3D4';
  ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Earned on Momentum Mindful Habits', width / 2, height - 79);

  return new Promise((resolve) => {
    offscreen.toBlob((blob) => resolve(blob), 'image/png', 0.95);
  });
}

/**
 * Executes the 3-Tier Web Share API Fallback Chain:
 * 1. navigator.canShare with image file -> Native Share Sheet (WhatsApp, Instagram, etc.)
 * 2. navigator.share with text/url -> Native Share Sheet + Image Download
 * 3. Fallback Panel -> Direct PNG download + Copy Caption & Link
 */
export async function executeShareFlow({
  medal,
  nickname = 'Practitioner',
  canvasElement = null,
  onOpenFallbackModal
}) {
  const tierName = medal.tier || 'Bronze';
  const medalId = medal.medalId || medal.id;

  // 1. Authoritative Backend Completion Verification
  // Rejects sharing immediately if the user has not genuinely earned this activity/milestone
  const verification = await api.post('/milestones/verify-share', { medalId });
  if (!verification || !verification.verified) {
    throw new Error(verification?.error || 'This activity has not been completed yet. Only earned milestones can be shared.');
  }

  const shareTitle = `Momentum ${tierName} Milestone: ${medal.name}`;
  const shareText = `I just earned the ${tierName} medal (${medal.name}) on Momentum! Building presence, one day at a time.`;
  const shareUrl = window.location.origin + '/#milestones';

  // Log share event to server asynchronously (stats only, zero third-party trackers)
  api.post('/milestones/share-log', {
    medalId,
    tier: (medal.tier || 'bronze').toLowerCase(),
    platform: typeof navigator !== 'undefined' && navigator.share ? 'native_web_share' : 'desktop_fallback'
  }).catch(() => {});


  // Check Web Share API
  if (typeof navigator !== 'undefined' && navigator.share) {
    let file = null;

    // Check if canShare with image files is supported
    if (navigator.canShare && canvasElement) {
      try {
        const blob = await generateShareCardBlob({ canvasElement, medal, nickname });
        if (blob) {
          const testFile = new File([blob], `momentum-${medal.tier.toLowerCase()}-medal.png`, {
            type: 'image/png'
          });
          if (navigator.canShare({ files: [testFile] })) {
            file = testFile;
          }
        }
      } catch (e) {
        console.log('[Share] File prep notice:', e);
      }
    }

    // Tier 1: Native Share with image file
    if (file) {
      try {
        await navigator.share({
          files: [file],
          title: shareTitle,
          text: shareText
        });
        return { mode: 'native_file_success' };
      } catch (err) {
        if (err.name === 'AbortError') return { mode: 'cancelled' };
      }
    }

    // Tier 2: Native Share with text/link
    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl
      });
      return { mode: 'native_text_success' };
    } catch (err) {
      if (err.name === 'AbortError') return { mode: 'cancelled' };
    }
  }

  // Tier 3: Desktop / unsupported fallback modal
  if (onOpenFallbackModal) {
    onOpenFallbackModal({
      shareTitle,
      shareText,
      shareUrl,
      medal,
      nickname
    });
    return { mode: 'desktop_fallback_opened' };
  }

  return { mode: 'unsupported' };
}
