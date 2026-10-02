/**
 * Onboarding Page Controller
 * Handles step 1 (intentions), step 2 (friction points), step 3 (personalized starter rituals), and breathing loader.
 */

import { userState, ONBOARDING_DATA } from '../state.js';
import { saveStateToStorage } from '../storage.js';
import { navigate } from '../router.js';
import { showToast } from './profile.js';

export function selectOnboardingIntention(intentionKey) {
  if (!ONBOARDING_DATA[intentionKey]) return;

  const idx = userState.intentions.indexOf(intentionKey);
  if (idx > -1) {
    // If it's already selected and there's more than 1 selected, toggle off
    if (userState.intentions.length > 1) {
      userState.intentions.splice(idx, 1);
    } else {
      showToast('Keep at least one intention to guide your practice.');
      return;
    }
  } else {
    // Add intention
    userState.intentions.push(intentionKey);
  }

  // Ensure selectedProblems only contains problems belonging to active intentions
  const allValidProblems = [];
  userState.intentions.forEach(intent => {
    if (ONBOARDING_DATA[intent]) {
      ONBOARDING_DATA[intent].problems.forEach(p => allValidProblems.push(p.id));
    }
  });
  userState.selectedProblems = userState.selectedProblems.filter(pid => allValidProblems.includes(pid));
  if (userState.selectedProblems.length === 0) {
    const firstIntent = userState.intentions[0] || 'health';
    userState.selectedProblems = [ONBOARDING_DATA[firstIntent].problems[0].id];
  }

  // Update visual state for all 4 cards
  ['health', 'mind', 'focus', 'craft'].forEach(key => {
    const card = document.getElementById('intent-card-' + key);
    if (!card) return;
    const isSelected = userState.intentions.includes(key);
    const check = card.querySelector('.intent-check');
    const iconBox = card.querySelector('.w-11');

    if (isSelected) {
      card.classList.add('bg-primary-fixed/30', 'border-2', 'border-primary-container', 'shadow-sm');
      card.classList.remove('bg-surface-container-lowest', 'hairline');
      if (check) check.classList.remove('hidden');
      if (iconBox) {
        iconBox.classList.add('bg-primary-fixed', 'text-primary-container');
        iconBox.classList.remove('bg-surface-container', 'text-outline');
      }
    } else {
      card.classList.remove('bg-primary-fixed/30', 'border-2', 'border-primary-container', 'shadow-sm');
      card.classList.add('bg-surface-container-lowest', 'hairline');
      if (check) check.classList.add('hidden');
      if (iconBox) {
        iconBox.classList.remove('bg-primary-fixed', 'text-primary-container');
        iconBox.classList.add('bg-surface-container', 'text-outline');
      }
    }
  });
}

// ── STEP 2: RENDER DYNAMIC AGGREGATED PROBLEMS ──
export function renderStep2Problems() {
  const tagEl = document.getElementById('step2-tag');
  const titleEl = document.getElementById('step2-title');
  const subEl = document.getElementById('step2-subtitle');
  const listEl = document.getElementById('problems-list');

  const intentNames = userState.intentions.map(i => ONBOARDING_DATA[i]?.title || i);
  if (tagEl) {
    tagEl.textContent = intentNames.length > 1 ? `${intentNames.join(' & ')} Focus` : `${intentNames[0] || 'Health'} Focus`;
  }
  if (titleEl) {
    titleEl.textContent = "What feels hardest right now?";
  }
  if (subEl) {
    subEl.textContent = intentNames.length > 1 
      ? `Select the friction points across your chosen areas (${intentNames.join(', ')}) you'd like to gently dissolve first.` 
      : 'Select the friction points you would like to gently resolve first.';
  }

  if (listEl) {
    listEl.innerHTML = '';
    
    // Render problems grouped by selected intentions
    userState.intentions.forEach((intentKey) => {
      const intentData = ONBOARDING_DATA[intentKey];
      if (!intentData) return;

      if (userState.intentions.length > 1) {
        // Section header for each category
        const catHeader = document.createElement('div');
        catHeader.className = 'pt-2.5 pb-1 flex items-center justify-between border-b border-surface-container/60';
        catHeader.innerHTML = `
          <span class="text-xs uppercase tracking-wider font-medium text-primary">${intentData.title}</span>
          <span class="text-[11px] text-outline">${intentData.problems.length} friction options</span>
        `;
        listEl.appendChild(catHeader);
      }

      intentData.problems.forEach((prob) => {
        const isSelected = userState.selectedProblems.includes(prob.id);
        const card = document.createElement('div');
        card.className = `problem-option group flex items-center justify-between p-4 sm:p-4.5 rounded-2xl cursor-pointer transition-all duration-200 select-none shadow-sm ${isSelected ? 'bg-primary-fixed/25 border-2 border-primary-container' : 'bg-surface-container-lowest hairline hover:bg-surface-container-low'}`;
        card.setAttribute('role', 'checkbox');
        card.setAttribute('aria-checked', isSelected ? 'true' : 'false');
        card.setAttribute('onclick', `selectOnboardingProblem('${prob.id}')`);

        card.innerHTML = `
          <div class="flex items-center gap-3.5 min-w-0 pr-2">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary-container text-on-primary' : 'bg-surface-container-low text-tertiary'}">
              <span class="material-symbols-outlined text-[20px]">${prob.icon}</span>
            </div>
            <div class="min-w-0">
              <span class="block font-body-lg text-sm sm:text-base text-on-surface ${isSelected ? 'font-medium' : ''}">${prob.title}</span>
              <span class="block text-xs text-outline mt-0.5">${prob.desc}</span>
            </div>
          </div>
          <div class="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'bg-primary-container text-on-primary' : 'border border-outline/40 bg-surface-container-lowest'}">
            ${isSelected ? '<span class="material-symbols-outlined text-[16px]">check</span>' : ''}
          </div>
        `;
        listEl.appendChild(card);
      });
    });
  }
}

// ── STEP 2: SELECT PROBLEM (MULTI-SELECT SUPPORT) ──
export function selectOnboardingProblem(problemId) {
  const idx = userState.selectedProblems.indexOf(problemId);
  if (idx > -1) {
    if (userState.selectedProblems.length > 1) {
      userState.selectedProblems.splice(idx, 1);
    } else {
      showToast('Select at least one friction point.');
      return;
    }
  } else {
    userState.selectedProblems.push(problemId);
  }
  renderStep2Problems();
}

// ── STEP 3: RENDER PERSONALIZED RITUAL & COMPANIONS ──
export function getSelectedRitualsList() {
  const list = [];
  userState.intentions.forEach(intentKey => {
    const intentData = ONBOARDING_DATA[intentKey];
    if (intentData) {
      intentData.problems.forEach(prob => {
        if (userState.selectedProblems.includes(prob.id)) {
          list.push({
            ...prob.ritual,
            intentionTitle: intentData.title,
            problemTitle: prob.title,
            problemId: prob.id
          });
        }
      });
    }
  });
  if (list.length === 0) {
    const firstIntent = userState.intentions[0] || 'health';
    const firstProb = (ONBOARDING_DATA[firstIntent] || ONBOARDING_DATA.health).problems[0];
    list.push({
      ...firstProb.ritual,
      intentionTitle: ONBOARDING_DATA[firstIntent]?.title || 'Health',
      problemTitle: firstProb.title,
      problemId: firstProb.id
    });
  }
  return list;
}

export function getCurrentPersonalizedRitual() {
  const list = getSelectedRitualsList();
  return list[0];
}

export function renderStep3Ritual() {
  const rituals = getSelectedRitualsList();
  const primary = rituals[0];

  const subEl = document.getElementById('step3-subtitle');
  const tagEl = document.getElementById('step3-ritual-tag');
  const titleEl = document.getElementById('step3-ritual-title');
  const anchorEl = document.getElementById('step3-ritual-anchor');
  const descEl = document.getElementById('step3-ritual-desc');
  const iconEl = document.getElementById('step3-ritual-icon');

  if (subEl) {
    subEl.textContent = rituals.length > 1 
      ? `A curated starter kit of ${rituals.length} gentle micro-rituals for your chosen focus areas.`
      : `A gentle micro-ritual crafted specifically for: "${primary.problemTitle}"`;
  }
  if (tagEl) tagEl.textContent = primary.tag || 'Primary Starter Anchor';
  if (titleEl) titleEl.textContent = primary.title;
  if (anchorEl) anchorEl.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-secondary-container inline-block mr-1.5"></span><span>Anchor: ${primary.anchor}</span>`;
  if (descEl) descEl.textContent = primary.description;
  if (iconEl) iconEl.textContent = primary.icon;

  // Companion practices
  const compContainer = document.getElementById('step3-companion-container');
  const compList = document.getElementById('step3-companion-list');
  if (compContainer && compList) {
    if (rituals.length > 1) {
      compContainer.classList.remove('hidden');
      compList.innerHTML = '';
      rituals.slice(1).forEach(comp => {
        const item = document.createElement('div');
        item.className = 'flex items-center justify-between p-3.5 bg-surface-container-lowest rounded-xl hairline shadow-xs';
        item.innerHTML = `
          <div class="flex items-center gap-3 min-w-0 pr-2">
            <div class="w-9 h-9 rounded-lg bg-primary-fixed/50 text-primary-container flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[18px]">${comp.icon}</span>
            </div>
            <div class="min-w-0">
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] uppercase tracking-wider text-primary font-medium">${comp.intentionTitle}</span>
                <span class="text-[10px] text-outline">·</span>
                <span class="text-[11px] text-outline truncate">${comp.duration}</span>
              </div>
              <span class="block text-sm font-medium text-on-surface truncate">${comp.title}</span>
              <span class="block text-xs text-outline truncate">Anchor: ${comp.anchor}</span>
            </div>
          </div>
          <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-fixed/30 text-primary text-[11px] font-medium shrink-0">
            <span class="material-symbols-outlined text-[13px]">check</span>
            <span>Included</span>
          </span>
        `;
        compList.appendChild(item);
      });
    } else {
      compContainer.classList.add('hidden');
    }
  }
}


export function showBreathingLoader(message = 'Settling into your quiet space...', onComplete) {
  const overlay = document.getElementById('relaxing-welcome-loader');
  const userDisplay = document.getElementById('welcome-user-display');
  const subtextEl = document.getElementById('relaxing-welcome-subtext');
  const quoteEl = document.getElementById('relaxing-welcome-quote');
  const progressBar = document.getElementById('welcome-progress-bar');

  const userName = userState.name || 'Adithya';
  if (userDisplay) userDisplay.textContent = `Welcome, ${userName}`;
  if (subtextEl) subtextEl.textContent = message;

  const quotes = [
    '“Small, steady actions quietly shape who you become.”',
    '“Breathe in calm. Exhale hurry.”',
    '“Your quiet space is ready for you.”',
    '“No rush, no score. Just your gentle rhythm.”'
  ];
  if (quoteEl) quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];

  if (overlay) {
    overlay.style.display = 'flex';
    overlay.classList.remove('hidden-loader');
    overlay.style.opacity = '1';

    // Reset and trigger smooth progress bar animation
    if (progressBar) {
      progressBar.style.width = '0%';
      setTimeout(() => {
        progressBar.style.width = '100%';
      }, 50);
    }

    // Relaxing 2.6s calming duration
    setTimeout(() => {
      overlay.style.opacity = '0';
      overlay.style.transform = 'scale(1.02)';
      setTimeout(() => {
        overlay.classList.add('hidden-loader');
        overlay.style.display = 'none';
        if (onComplete) onComplete();
      }, 500);
    }, 2500);
  } else {
    if (onComplete) onComplete();
  }
}


// Bind aliases & methods
export const selectIntention = selectOnboardingIntention;
export const toggleProblem = selectOnboardingProblem;
export const advanceOnboardingStep = function(step) {
  navigate('onboarding-' + step);
};

export function selectCompanionRitual(problemId) {
  selectOnboardingProblem(problemId);
}

export function toggleCompanionPicker() {
  const drawer = document.getElementById('companion-picker-drawer');
  if (drawer) drawer.classList.toggle('active');
}

export function adoptPersonalizedRitual() {
  navigate('login');
  showToast('🌿 Personalized starter rhythm configured!');
}

// Expose to window for inline HTML onclick/onsubmit handlers
if (typeof window !== 'undefined') {
  window.selectOnboardingIntention = selectOnboardingIntention;
  window.selectIntention = selectIntention;
  window.renderStep2Problems = renderStep2Problems;
  window.selectOnboardingProblem = selectOnboardingProblem;
  window.toggleProblem = toggleProblem;
  window.renderStep3Ritual = renderStep3Ritual;
  window.getSelectedRitualsList = getSelectedRitualsList;
  window.getCurrentPersonalizedRitual = getCurrentPersonalizedRitual;
  window.selectCompanionRitual = selectCompanionRitual;
  window.toggleCompanionPicker = toggleCompanionPicker;
  window.adoptPersonalizedRitual = adoptPersonalizedRitual;
  window.showBreathingLoader = showBreathingLoader;
  window.advanceOnboardingStep = advanceOnboardingStep;
}
