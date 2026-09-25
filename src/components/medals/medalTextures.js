/**
 * Momentum — Procedural Canvas Texture & PBR Material Generator for 3D Medals
 * Creates ultra-high-resolution front, back, and bump/engraving textures with escalating tier luxury.
 *
 * Tier Escalation:
 * - Bronze (7d): Real warm cast bronze & burnished copper, lathe micro-grooves, knurled perimeter beads.
 * - Silver (30d): 999 Fine Sterling Silver proof, 16-ray Guilloché rosette lattice, polished stepped rim.
 * - Gold (100d): 24K Royal Gold minted ingot, 24-ray radiant sunburst Guilloché, multi-bevel golden luster.
 * - Platinum (365d): 950 Imperial Platinum horological finish, 32-ray multi-layered celestial Guilloché tapestry, diamond-cut faceted rim, and prismatic chromatic iridescence.
 */

import * as THREE from 'three';

export const TIER_CONFIG = {
  bronze: {
    name: 'Bronze',
    subtitle: '7-Day Genesis',
    accentColor: '#F6A868',
    textColor: '#8C4416',
    rimColor: '#B8652A',
    darkPlate: '#2E1508',
    lightPlate: '#783A16',
    specularHighlight: '#FEDBB4',
    lockedPlate: '#1C0D05',
    lockedBorder: '#5C2D13',
    iconSymbol: '🌱',
    romanNumeral: 'VII',
    motto: 'Grounded Presence · 7 Days',
    guillocheRays: 0,
    beadCount: 72,
    finishLabel: 'Real Cast Phosphor Bronze'
  },
  silver: {
    name: 'Silver',
    subtitle: '30-Day Flow',
    accentColor: '#FFFFFF',
    textColor: '#1E293B',
    rimColor: '#CBD5E1',
    darkPlate: '#1E293B',
    lightPlate: '#5A6F8C',
    specularHighlight: '#FFFFFF',
    lockedPlate: '#141A22',
    lockedBorder: '#475569',
    iconSymbol: '🌊',
    romanNumeral: 'XXX',
    motto: 'Steady Flow · 30 Days',
    guillocheRays: 16,
    beadCount: 84,
    finishLabel: '999 Fine Silver Proof'
  },
  gold: {
    name: 'Gold',
    subtitle: '100-Day Centurion',
    accentColor: '#FFF275',
    textColor: '#92400E',
    rimColor: '#F59E0B',
    darkPlate: '#3D2400',
    lightPlate: '#A87400',
    specularHighlight: '#FFFDE7',
    lockedPlate: '#261700',
    lockedBorder: '#784D0A',
    iconSymbol: '☀️',
    romanNumeral: 'C',
    motto: 'Centurion of Habit · 100 Days',
    guillocheRays: 24,
    beadCount: 96,
    finishLabel: '24K Royal Gold Mint'
  },
  platinum: {
    name: 'Platinum',
    subtitle: '365-Day Master',
    accentColor: '#E0F2FE',
    textColor: '#0284C7',
    rimColor: '#38BDF8',
    darkPlate: '#0B1E33',
    lightPlate: '#246B9C',
    specularHighlight: '#FFFFFF',
    lockedPlate: '#081422',
    lockedBorder: '#1E4976',
    iconSymbol: '💎',
    romanNumeral: 'CCCLXV',
    motto: 'Lifelong Sanctuary · 365 Days',
    guillocheRays: 32,
    beadCount: 112,
    finishLabel: '950 Imperial Platinum'
  }
};


/**
 * Draws concentric lathe-turned micro-grooves onto canvas for minted bullion texture
 */
function drawLatheBrushing(ctx, cx, cy, innerR, outerR, isAchieved, tier = 'bronze') {
  const step = tier === 'platinum' ? 5 : tier === 'gold' ? 6 : tier === 'silver' ? 7 : 8;
  const numRings = Math.floor((outerR - innerR) / step);
  ctx.save();
  for (let i = 0; i < numRings; i++) {
    const r = innerR + i * step;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    if (isAchieved) {
      ctx.strokeStyle = i % 2 === 0
        ? 'rgba(255, 255, 255, 0.055)'
        : 'rgba(0, 0, 0, 0.08)';
    } else {
      ctx.strokeStyle = i % 2 === 0
        ? 'rgba(255, 255, 255, 0.02)'
        : 'rgba(0, 0, 0, 0.05)';
    }
    ctx.lineWidth = 1.0;
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Draws radial anisotropic sunburst specular highlights simulating real metallic light play
 */
function drawRadialSunburst(ctx, cx, cy, r, isAchieved, tier = 'bronze') {
  if (!isAchieved) return;
  ctx.save();
  const numSlices = tier === 'platinum' ? 16 : tier === 'gold' ? 16 : tier === 'silver' ? 12 : 8;
  for (let i = 0; i < numSlices; i++) {
    if (i % 2 === 0) continue;
    const startAngle = (i / numSlices) * Math.PI * 2;
    const endAngle = ((i + 1) / numSlices) * Math.PI * 2;
    const grad = ctx.createRadialGradient(cx, cy, 30, cx, cy, r);

    if (tier === 'platinum') {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.16)');
      grad.addColorStop(0.4, 'rgba(224, 242, 254, 0.08)');
      grad.addColorStop(0.8, 'rgba(186, 230, 253, 0.03)');
      grad.addColorStop(1, 'transparent');
    } else if (tier === 'gold') {
      grad.addColorStop(0, 'rgba(255, 245, 157, 0.14)');
      grad.addColorStop(0.45, 'rgba(251, 191, 36, 0.07)');
      grad.addColorStop(1, 'transparent');
    } else if (tier === 'silver') {
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.12)');
      grad.addColorStop(0.5, 'rgba(241, 245, 249, 0.05)');
      grad.addColorStop(1, 'transparent');
    } else {
      // Bronze
      grad.addColorStop(0, 'rgba(254, 215, 170, 0.09)');
      grad.addColorStop(0.5, 'rgba(217, 119, 54, 0.04)');
      grad.addColorStop(1, 'transparent');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/**
 * Draws precision Guilloché geometric rosette pattern for higher tiers (Silver, Gold, Platinum)
 */
function drawGuillocheRings(ctx, cx, cy, r, rays, strokeStyle, tier = 'silver') {
  if (rays <= 0) return;
  ctx.save();
  ctx.strokeStyle = strokeStyle;
  ctx.lineWidth = 1.2;

  // Primary Guilloché Rosette
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const px = cx + Math.cos(angle) * (r * 0.38);
    const py = cy + Math.sin(angle) * (r * 0.38);
    ctx.beginPath();
    ctx.arc(px, py, r * 0.52, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Multi-phase secondary rosette for Platinum & Gold (creates high-security horological moiré pattern)
  if (tier === 'platinum' || tier === 'gold') {
    ctx.lineWidth = 0.8;
    const subRays = rays * 2;
    for (let i = 0; i < subRays; i++) {
      const angle = (i / subRays) * Math.PI * 2 + Math.PI / rays;
      const px = cx + Math.cos(angle) * (r * 0.22);
      const py = cy + Math.sin(angle) * (r * 0.22);
      ctx.beginPath();
      ctx.arc(px, py, r * 0.32, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  ctx.restore();
}

/**
 * Creates high-res circular canvas texture for FRONT face
 */
export function createMedalFrontTexture(tierKey = 'bronze', medalName = 'Milestone', achieved = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const tKey = (tierKey || 'bronze').toLowerCase();
  const cfg = TIER_CONFIG[tKey] || TIER_CONFIG.bronze;

  const cx = 512;
  const cy = 512;
  const r = 490;

  // 1. Base Bullion Disc Gradient (Multi-stop metallic radial)
  const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, r);
  if (achieved) {
    bgGrad.addColorStop(0, cfg.lightPlate);
    bgGrad.addColorStop(0.45, cfg.darkPlate);
    bgGrad.addColorStop(0.85, cfg.darkPlate);
    bgGrad.addColorStop(1, '#050608');
  } else {
    bgGrad.addColorStop(0, cfg.lockedPlate);
    bgGrad.addColorStop(0.72, '#141619');
    bgGrad.addColorStop(1, '#070809');
  }
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // 2. Realistic Radial Sunburst & Minting Lathe Micro-Brushing
  drawRadialSunburst(ctx, cx, cy, r - 30, achieved, tKey);
  drawLatheBrushing(ctx, cx, cy, 140, r - 35, achieved, tKey);

  // 3. Precision Guilloché Geometric Rosette for Silver, Gold, Platinum
  if (achieved && cfg.guillocheRays > 0) {
    const strokeColor = tKey === 'platinum'
      ? 'rgba(224, 242, 254, 0.12)'
      : tKey === 'gold'
      ? 'rgba(255, 241, 118, 0.11)'
      : 'rgba(255, 255, 255, 0.09)';
    drawGuillocheRings(ctx, cx, cy, r - 60, cfg.guillocheRays, strokeColor, tKey);
  }

  // 4. Polished Stepped Chamfer / Beveled Outer Rim
  const rimGrad = ctx.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
  if (achieved) {
    rimGrad.addColorStop(0, cfg.specularHighlight);
    rimGrad.addColorStop(0.25, cfg.rimColor);
    rimGrad.addColorStop(0.55, cfg.darkPlate);
    rimGrad.addColorStop(0.8, cfg.accentColor);
    rimGrad.addColorStop(1, cfg.specularHighlight);
  } else {
    rimGrad.addColorStop(0, cfg.lockedBorder);
    rimGrad.addColorStop(0.5, '#16191C');
    rimGrad.addColorStop(1, cfg.lockedBorder);
  }
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = 16;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 10, 0, Math.PI * 2);
  ctx.stroke();

  // Specular hairline inner edge
  ctx.strokeStyle = achieved ? 'rgba(255, 255, 255, 0.55)' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 19, 0, Math.PI * 2);
  ctx.stroke();

  // 5. Coin Knurling / Minted Perimetric Beading (3D micro-dots with drop shadow & specular glint)
  const numBeads = cfg.beadCount || 72;
  for (let i = 0; i < numBeads; i++) {
    const angle = (i / numBeads) * Math.PI * 2;
    const bx = cx + Math.cos(angle) * (r - 32);
    const by = cy + Math.sin(angle) * (r - 32);

    // Dark ambient occlusion drop shadow
    ctx.fillStyle = achieved ? 'rgba(0, 0, 0, 0.55)' : 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    ctx.arc(bx + 1.2, by + 1.2, 3.8, 0, Math.PI * 2);
    ctx.fill();

    // Convex specular metal bead
    const beadGrad = ctx.createRadialGradient(bx - 1, by - 1, 0.5, bx, by, 3.8);
    if (achieved) {
      beadGrad.addColorStop(0, cfg.specularHighlight);
      beadGrad.addColorStop(0.4, cfg.accentColor);
      beadGrad.addColorStop(1, cfg.rimColor);
    } else {
      beadGrad.addColorStop(0, cfg.lockedBorder);
      beadGrad.addColorStop(1, '#111315');
    }
    ctx.fillStyle = beadGrad;
    ctx.beginPath();
    ctx.arc(bx, by, 3.6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Inner decorative stepped ring
  ctx.strokeStyle = achieved ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 52, 0, Math.PI * 2);
  ctx.stroke();

  // Secondary fine ring for Gold and Platinum (horological depth)
  if (tKey === 'gold' || tKey === 'platinum') {
    ctx.strokeStyle = achieved ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r - 60, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 6. Front Center Plate Content
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Arched Header: TIER NAME
  ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
  ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(achieved ? `${tKey.toUpperCase()} TIER MEDAL` : `${tKey.toUpperCase()} LOCKED`, cx + 1.5, cy - 218.5);

  ctx.fillStyle = achieved ? cfg.accentColor : cfg.lockedBorder;
  ctx.fillText(achieved ? `${tKey.toUpperCase()} TIER MEDAL` : `${tKey.toUpperCase()} LOCKED`, cx, cy - 220);

  // Subtitle / Roman numeral
  ctx.font = '300 28px Georgia, serif';
  ctx.fillStyle = achieved ? 'rgba(255, 255, 255, 0.92)' : 'rgba(255, 255, 255, 0.35)';
  ctx.fillText(achieved ? cfg.romanNumeral : '—', cx, cy - 165);

  // Center Emblem: Large Icon, Elevated Pedestal & Halo
  const emblemHalo = ctx.createRadialGradient(cx, cy, 20, cx, cy, 145);
  emblemHalo.addColorStop(0, achieved ? 'rgba(255, 255, 255, 0.30)' : 'rgba(255, 255, 255, 0.06)');
  emblemHalo.addColorStop(1, 'transparent');
  ctx.fillStyle = emblemHalo;
  ctx.beginPath();
  ctx.arc(cx, cy, 145, 0, Math.PI * 2);
  ctx.fill();

  // Pedestal Circle (Raised Medallion)
  const pedestalGrad = ctx.createLinearGradient(cx - 110, cy - 110, cx + 110, cy + 110);
  if (achieved) {
    pedestalGrad.addColorStop(0, cfg.specularHighlight);
    pedestalGrad.addColorStop(0.5, cfg.lightPlate);
    pedestalGrad.addColorStop(1, cfg.darkPlate);
  } else {
    pedestalGrad.addColorStop(0, cfg.lockedBorder);
    pedestalGrad.addColorStop(1, '#0e1114');
  }
  ctx.strokeStyle = pedestalGrad;
  ctx.lineWidth = 3.0;
  ctx.beginPath();
  ctx.arc(cx, cy, 110, 0, Math.PI * 2);
  ctx.stroke();

  if (achieved) {
    ctx.font = '120px serif';
    ctx.fillText(cfg.iconSymbol, cx, cy);
  } else {
    // Engraved lock icon for locked medals with tier tint
    ctx.fillStyle = cfg.lockedBorder;
    ctx.font = 'bold 90px sans-serif';
    ctx.fillText('🔒', cx, cy);
  }

  // Bottom Center: Medal Name (with engraved shadow)
  ctx.font = 'bold 34px Georgia, serif';
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillText(medalName.toUpperCase(), cx + 1.5, cy + 176.5);

  ctx.fillStyle = achieved ? '#FFFFFF' : 'rgba(255, 255, 255, 0.55)';
  ctx.fillText(medalName.toUpperCase(), cx, cy + 175);

  // Bottom Motto
  ctx.font = '19px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = achieved ? cfg.accentColor : 'rgba(255, 255, 255, 0.35)';
  ctx.fillText(achieved ? cfg.motto : 'Continue daily rhythm to unlock', cx, cy + 225);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates high-res circular canvas texture for BACK face (Certificate / Verification)
 */
export function createMedalBackTexture({
  tierKey = 'bronze',
  medalName = 'Milestone',
  nickname = 'Mindful Practitioner',
  date = '2026',
  verificationCode = null,
  isOtherUser = false,
  achieved = true
}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');
  const tKey = (tierKey || 'bronze').toLowerCase();
  const cfg = TIER_CONFIG[tKey] || TIER_CONFIG.bronze;

  const cx = 512;
  const cy = 512;
  const r = 490;

  // Background disc gradient
  const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, r);
  if (achieved) {
    bgGrad.addColorStop(0, cfg.lightPlate);
    bgGrad.addColorStop(0.68, cfg.darkPlate);
    bgGrad.addColorStop(1, '#050608');
  } else {
    bgGrad.addColorStop(0, cfg.lockedPlate);
    bgGrad.addColorStop(0.72, '#141619');
    bgGrad.addColorStop(1, '#070809');
  }
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle lathe brushing on certificate back
  drawLatheBrushing(ctx, cx, cy, 140, r - 35, achieved, tKey);

  // Outer border & beading
  ctx.strokeStyle = achieved ? cfg.accentColor : cfg.lockedBorder;
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 12, 0, Math.PI * 2);
  ctx.stroke();

  // Inner hairline ring
  ctx.strokeStyle = achieved ? 'rgba(255, 255, 255, 0.40)' : 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 52, 0, Math.PI * 2);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Header wordmark: MOMENTUM
  ctx.font = 'bold 36px Georgia, serif';
  ctx.fillStyle = achieved ? cfg.accentColor : cfg.lockedBorder;
  ctx.fillText('MOMENTUM', cx, cy - 230);

  ctx.font = 'italic 20px Georgia, serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.fillText('Sanctuary Practice Certificate', cx, cy - 185);

  if (achieved) {
    ctx.font = '22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText('Conferred upon', cx, cy - 140);

    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = cfg.accentColor;
    ctx.fillText(nickname || 'Mindful Practitioner', cx, cy - 85);

    // Medal Title
    ctx.font = 'bold 32px Georgia, serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(medalName.toUpperCase(), cx, cy - 20);

    // Date Earned
    ctx.font = 'normal 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.fillText(date ? `Awarded ${date}` : 'Verified Sanctuary Milestone', cx, cy + 35);

    // Motto Divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 180, cy + 80);
    ctx.lineTo(cx + 180, cy + 80);
    ctx.stroke();

    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fillText('“Slow is smooth, smooth is fast.”', cx, cy + 120);

    // Server Verification Code
    if (!isOtherUser && verificationCode) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.50)';
      const pw = 420;
      const ph = 54;
      const px = cx - pw / 2;
      const py = cy + 185 - ph / 2;
      ctx.beginPath();
      ctx.roundRect(px, py, pw, ph, 27);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = 'bold 20px "SF Mono", Menlo, Consolas, monospace';
      ctx.fillStyle = '#A0F3D4';
      ctx.fillText(`VERIFIED: ${verificationCode}`, cx, cy + 185);

      ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
      ctx.fillText('Cryptographically anchored to your personal trajectory', cx, cy + 235);
    } else {
      ctx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.48)';
      ctx.fillText('Momentum Circle Verified Trajectory', cx, cy + 190);
    }
  } else {
    // Locked Back
    ctx.font = '24px Georgia, serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('Awaiting Conformance', cx, cy - 80);

    ctx.font = 'bold 36px Georgia, serif';
    ctx.fillStyle = cfg.lockedBorder;
    ctx.fillText(medalName.toUpperCase(), cx, cy - 10);

    ctx.font = '20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fillText('This certificate will be issued upon achieving milestone.', cx, cy + 60);

    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillText('“Small, steady actions quietly shape who you become.”', cx, cy + 140);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  // Flip horizontal & vertical so back certificate face reads upright and straight when medal rotates 180 degrees
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(-1, -1);
  texture.offset.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates high-contrast grayscale height/bump map for engraved relief
 */
export function createMedalBumpTexture(tierKey = 'bronze', isFront = true, achieved = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  const tKey = (tierKey || 'bronze').toLowerCase();
  const cfg = TIER_CONFIG[tKey] || TIER_CONFIG.bronze;

  const cx = 256;
  const cy = 256;
  const r = 245;

  // Base background: dark field (low relief)
  ctx.fillStyle = '#080808';
  ctx.fillRect(0, 0, 512, 512);

  // Outer protective beveled rim (highest relief)
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 8, 0, Math.PI * 2);
  ctx.stroke();

  // Recessed coin beading (3D domed beads with surrounding dark moat)
  const numBeads = Math.floor((cfg.beadCount || 72) * 0.75);
  for (let i = 0; i < numBeads; i++) {
    const angle = (i / numBeads) * Math.PI * 2;
    const bx = cx + Math.cos(angle) * (r - 18);
    const by = cy + Math.sin(angle) * (r - 18);

    // Dark moat ring around bead
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(bx, by, 4.0, 0, Math.PI * 2);
    ctx.fill();

    // Convex spherical bead gradient
    const beadGrad = ctx.createRadialGradient(bx, by, 0.5, bx, by, 3.2);
    beadGrad.addColorStop(0, '#FFFFFF');
    beadGrad.addColorStop(0.7, '#A0A0A0');
    beadGrad.addColorStop(1, '#202020');
    ctx.fillStyle = beadGrad;
    ctx.beginPath();
    ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lathe concentric grooved ridges in bump map
  const numGrooves = tKey === 'platinum' ? 24 : tKey === 'gold' ? 20 : 16;
  for (let i = 0; i < numGrooves; i++) {
    const gr = 65 + i * 8;
    ctx.strokeStyle = i % 2 === 0 ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.45)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(cx, cy, gr, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Guilloché relief etching for Silver, Gold, Platinum
  if (achieved && cfg.guillocheRays > 0) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.20)';
    ctx.lineWidth = 1.0;
    for (let i = 0; i < cfg.guillocheRays; i++) {
      const angle = (i / cfg.guillocheRays) * Math.PI * 2;
      const px = cx + Math.cos(angle) * (r * 0.38);
      const py = cy + Math.sin(angle) * (r * 0.38);
      ctx.beginPath();
      ctx.arc(px, py, r * 0.52, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Inner stepped hairline ring
  ctx.strokeStyle = '#B0B0B0';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 32, 0, Math.PI * 2);
  ctx.stroke();

  // Center relief pedestal ring
  ctx.strokeStyle = '#E0E0E0';
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 80, 0, Math.PI * 2);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  if (!isFront) {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(-1, -1);
    texture.offset.set(1, 1);
  }
  texture.needsUpdate = true;
  return texture;
}

/**
 * Creates vertical reeded/milled edge bump texture for authentic bullion coin perimeter
 */
export function createMedalEdgeTexture(tierKey = 'bronze', achieved = true) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const tKey = (tierKey || 'bronze').toLowerCase();

  // Fine vertical milled coin ridges (serrations)
  const numGrooves = tKey === 'platinum' ? 144 : tKey === 'gold' ? 128 : tKey === 'silver' ? 108 : 92;
  const grooveWidth = canvas.width / numGrooves;

  ctx.fillStyle = '#666666';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < numGrooves; i++) {
    const x = i * grooveWidth;
    const grad = ctx.createLinearGradient(x, 0, x + grooveWidth, 0);
    grad.addColorStop(0, '#101010');
    grad.addColorStop(0.25, '#FFFFFF');
    grad.addColorStop(0.75, '#FFFFFF');
    grad.addColorStop(1, '#101010');
    ctx.fillStyle = grad;
    ctx.fillRect(x, 0, grooveWidth * 0.72, canvas.height);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Authoritative PBR Material configurations for the 4 tiers (Progressive Luxury Escalation)
 */
export function getTierMaterialProps(tierKey = 'bronze', achieved = true) {
  const t = (tierKey || 'bronze').toLowerCase();

  if (!achieved) {
    // Locked tiers: distinctly tinted matte version matching metal
    switch (t) {
      case 'platinum':
        return {
          type: 'physical',
          color: '#385068',
          rimColor: '#243A4E',
          metalness: 0.75,
          roughness: 0.48,
          clearcoat: 0.35,
          clearcoatRoughness: 0.20,
          iridescence: 0.2,
          bumpScale: 0.03
        };
      case 'gold':
        return {
          type: 'physical',
          color: '#554117',
          rimColor: '#453310',
          metalness: 0.72,
          roughness: 0.52,
          clearcoat: 0.25,
          clearcoatRoughness: 0.20,
          bumpScale: 0.03
        };
      case 'silver':
        return {
          type: 'physical',
          color: '#3F4A57',
          rimColor: '#303945',
          metalness: 0.70,
          roughness: 0.55,
          clearcoat: 0.20,
          bumpScale: 0.03
        };
      case 'bronze':
      default:
        return {
          type: 'physical',
          color: '#4E2D18',
          rimColor: '#381E10',
          metalness: 0.65,
          roughness: 0.60,
          clearcoat: 0.15,
          bumpScale: 0.03
        };
    }
  }

  // Earned tiers: strictly calibrated physical metal materials with progressive craftsmanship
  switch (t) {
    case 'platinum':
      return {
        type: 'physical',
        color: '#FFFFFF',
        rimColor: '#E2F1FE',
        metalness: 1.0,
        roughness: 0.03, // Mirror-finish platinum proof with liquid chrome sheen
        clearcoat: 1.0,
        clearcoatRoughness: 0.015,
        iridescence: 0.85,
        iridescenceIOR: 1.6,
        reflectivity: 1.0,
        bumpScale: 0.045
      };
    case 'gold':
      return {
        type: 'physical',
        color: '#FFD700',
        rimColor: '#F59E0B',
        metalness: 0.98,
        roughness: 0.08, // Rich 24K Royal Gold mirror luster with warm amber highlights
        clearcoat: 0.88,
        clearcoatRoughness: 0.03,
        reflectivity: 0.98,
        bumpScale: 0.05
      };
    case 'silver':
      return {
        type: 'physical',
        color: '#F8FAFC',
        rimColor: '#E2E8F0',
        metalness: 0.96,
        roughness: 0.14, // Crisp 999 fine silver with bright sterling specular highlights
        clearcoat: 0.75,
        clearcoatRoughness: 0.05,
        reflectivity: 0.94,
        bumpScale: 0.045
      };
    case 'bronze':
    default:
      return {
        type: 'physical',
        color: '#C67A3C',
        rimColor: '#A85825',
        metalness: 0.90,
        roughness: 0.32, // Genuine cast phosphor bronze with lathe brushed texture & warm copper reflections
        clearcoat: 0.45,
        clearcoatRoughness: 0.12,
        reflectivity: 0.88,
        bumpScale: 0.055
      };
  }
}


