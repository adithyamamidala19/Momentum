/**
 * Medals Component & Interactions
 * Manages 3D medal specular sheen tracking, card flipping, and medal sharing modal.
 */

export function trackMedalSheen(e, card) {
  if (!card) return;
  const rect = card.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
  card.style.setProperty('--spec-x', `${x}%`);
  card.style.setProperty('--spec-y', `${y}%`);
}

export function toggleMedalFlip(cardId) {
  const card = document.getElementById(cardId);
  if (card) {
    const flipper = card.querySelector('.medal-card-flipper');
    if (flipper) flipper.classList.toggle('flipped');
  }
}

export function openShareMedalModal(name, tier, desc, date, icon, material, quote) {
  const modal = document.getElementById('medal-share-modal');
  const backdrop = document.getElementById('medal-share-backdrop');

  const discEl = document.getElementById('share-modal-disc');
  const iconEl = document.getElementById('share-modal-icon');
  const titleEl = document.getElementById('share-modal-title');
  const tierEl = document.getElementById('share-modal-tier');
  const descEl = document.getElementById('share-modal-desc');
  const dateEl = document.getElementById('share-modal-date');
  const quoteEl = document.getElementById('share-modal-quote');

  if (titleEl) titleEl.textContent = name;
  if (tierEl) tierEl.textContent = tier;
  if (descEl) descEl.textContent = desc;
  if (dateEl) dateEl.textContent = date && date.startsWith('In Progress') ? date : `Earned on ${date || 'Today'}`;
  if (quoteEl) quoteEl.textContent = quote || '“Slow is smooth, smooth is fast.”';
  if (iconEl) iconEl.textContent = icon || 'hotel_class';

  if (discEl) {
    discEl.className = `medal-disc-wrapper medal-${material || 'gold'} !w-28 !h-28 mx-auto mb-3 shadow-2xl`;
  }

  if (modal && backdrop) {
    backdrop.classList.add('active');
    modal.classList.add('active');
  }
}

export function closeShareMedalModal() {
  const modal = document.getElementById('medal-share-modal');
  const backdrop = document.getElementById('medal-share-backdrop');
  if (modal && backdrop) {
    modal.classList.remove('active');
    backdrop.classList.remove('active');
  }
}

export const openShareModal = openShareMedalModal;
export const closeShareModal = closeShareMedalModal;

export function openMilestonesDetailModal(milestoneId) {
  const modal = document.getElementById('modal-milestone-detail');
  const backdrop = document.getElementById('milestone-modal-backdrop');
  if (modal && backdrop) {
    backdrop.classList.add('active');
    modal.classList.add('active');
  }
}

export function closeMilestonesDetailModal() {
  const modal = document.getElementById('modal-milestone-detail');
  const backdrop = document.getElementById('milestone-modal-backdrop');
  if (modal && backdrop) {
    modal.classList.remove('active');
    backdrop.classList.remove('active');
  }
}

export function copyMedalShareLink() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(window.location.href);
  }
  if (typeof window.showToast === 'function') {
    window.showToast('Milestone link copied to clipboard.');
  }
}

export function triggerNativeShare() {
  if (navigator.share) {
    navigator.share({
      title: 'Momentum Milestone Medal',
      text: 'I reached a new mindful practice milestone on Momentum!',
      url: window.location.href
    }).catch(() => {});
  } else {
    copyMedalShareLink();
  }
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.trackMedalSheen = trackMedalSheen;
  window.toggleMedalFlip = toggleMedalFlip;
  window.openShareMedalModal = openShareMedalModal;
  window.closeShareMedalModal = closeShareMedalModal;
  window.openShareModal = openShareModal;
  window.closeShareModal = closeShareModal;
  window.openMilestonesDetailModal = openMilestonesDetailModal;
  window.closeMilestonesDetailModal = closeMilestonesDetailModal;
  window.copyMedalShareLink = copyMedalShareLink;
  window.triggerNativeShare = triggerNativeShare;
}
