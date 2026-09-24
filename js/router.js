/**
 * Navigation Router
 * Manages view routing, header/footer state, active nav indicators, and URL hash history.
 */

export const VIEWS = {
  'welcome':          { preAuth: true,  hasHeader: false, hasFooter: false },
  'onboarding-1':     { preAuth: true,  hasHeader: false, hasFooter: false },
  'onboarding-2':     { preAuth: true,  hasHeader: false, hasFooter: false },
  'onboarding-3':     { preAuth: true,  hasHeader: false, hasFooter: false },
  'login':            { preAuth: true,  hasHeader: false, hasFooter: false },
  'otp':              { preAuth: true,  hasHeader: false, hasFooter: false },
  'today':            { preAuth: false, hasHeader: true,  hasFooter: true, nav: 'today',    title: 'Today' },
  'voice':            { preAuth: false, hasHeader: true,  hasFooter: true, nav: 'voice',    title: 'AI Voice Agent' },
  'rituals':          { preAuth: false, hasHeader: true,  hasFooter: true, nav: 'rituals',  title: 'Rituals' },
  'insights':         { preAuth: false, hasHeader: true,  hasFooter: true, nav: 'insights', title: 'Insights' },
  'profile':          { preAuth: false, hasHeader: true,  hasFooter: true, nav: 'profile',  title: 'Profile' },
  'milestones':       { preAuth: false, hasHeader: true,  hasFooter: true, nav: 'profile',  title: 'Milestones' },
  'todos':            { preAuth: false, hasHeader: true,  hasFooter: true, nav: 'today',    title: 'Daily To-Dos' }
};

let currentView = null;
let firstAuthLoad = true;

// Registry of lifecycle callbacks registered by page modules
const viewLifecycleHooks = {};

export function registerViewHook(viewId, callback) {
  viewLifecycleHooks[viewId] = callback;
}

export function getCurrentView() {
  return currentView;
}

export function navigate(viewId) {
  if (!VIEWS[viewId]) viewId = 'welcome';
  const cfg = VIEWS[viewId];

  // Route protection for private views
  const isGuest = localStorage.getItem('momentum_guest_session') === 'true';
  const hasUser = window.MomentumFirebase && typeof window.MomentumFirebase.getCurrentUser === 'function' && window.MomentumFirebase.getCurrentUser();
  if (!cfg.preAuth && !hasUser && !isGuest) {
    console.log('🔒 Protected view requested without auth, redirecting to login');
    if (typeof window.openAuthView === 'function') {
      window.openAuthView('signIn');
    } else {
      viewId = 'login';
    }
    return;
  }

  // Hide previous view
  if (currentView) {
    const prev = document.getElementById('view-' + currentView);
    if (prev) prev.classList.remove('active');
  }

  // Run registered page lifecycle hooks
  if (typeof viewLifecycleHooks[viewId] === 'function') {
    viewLifecycleHooks[viewId]();
  }

  // Fallback for legacy globally attached hooks
  if (viewId === 'onboarding-2' && typeof window.renderStep2Problems === 'function') {
    window.renderStep2Problems();
  } else if (viewId === 'onboarding-3' && typeof window.renderStep3Ritual === 'function') {
    window.renderStep3Ritual();
  } else if (viewId === 'otp' && typeof window.setupOtpView === 'function') {
    window.setupOtpView();
  } else if (viewId === 'today') {
    if (typeof window.renderTodayView === 'function') window.renderTodayView();
    if (typeof window.renderTodosUI === 'function') window.renderTodosUI();
  } else if (viewId === 'todos') {
    if (typeof window.renderTodosUI === 'function') window.renderTodosUI();
  } else if (viewId === 'profile' && typeof window.animateProfileStats === 'function') {
    setTimeout(() => window.animateProfileStats(2000), 80);
  } else if ((viewId === 'insights' || viewId === 'milestones') && typeof window.animateCounters === 'function') {
    setTimeout(window.animateCounters, 60);
  }

  // Show target view
  const el = document.getElementById('view-' + viewId);
  if (el) {
    el.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'instant' });
    if ((viewId === 'insights' || viewId === 'milestones') && typeof window.animateCounters === 'function') {
      setTimeout(window.animateCounters, 120);
    }
  }

  // Manage header / footer
  const hdr = document.getElementById('app-header');
  const ftr = document.getElementById('app-footer');
  if (hdr) {
    if (cfg.hasHeader) {
      hdr.classList.remove('hidden');
      if (firstAuthLoad && !cfg.preAuth) {
        const logoText = hdr.querySelector('.font-editorial');
        if (logoText) {
          logoText.classList.remove('logo-enter');
          void logoText.offsetWidth;
          logoText.classList.add('logo-enter');
        }
        firstAuthLoad = false;
      }
    } else {
      hdr.classList.add('hidden');
    }
  }

  if (ftr) {
    if (cfg.hasFooter) {
      ftr.classList.remove('hidden');
    } else {
      ftr.classList.add('hidden');
    }
  }


  // Update nav link active states
  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach(link => {
    if (link.dataset.nav === cfg.nav) {
      link.classList.add('text-on-surface', 'font-medium', 'border-b-2', 'border-primary-container');
      link.classList.remove('text-on-surface-variant');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('text-on-surface', 'font-medium', 'border-b-2', 'border-primary-container');
      link.classList.add('text-on-surface-variant');
      link.removeAttribute('aria-current');
    }
  });

  document.title = 'Momentum' + (cfg.title ? ' — ' + cfg.title : '');
  try {
    history.pushState({ view: viewId }, '', '#' + viewId);
  } catch (e) {}

  currentView = viewId;
}

export function initRouter() {
  window.addEventListener('popstate', e => {
    if (e.state && e.state.view) {
      navigate(e.state.view);
    } else if (window.location.hash) {
      const hashView = window.location.hash.replace('#', '');
      if (VIEWS[hashView]) navigate(hashView);
    }
  });
}

// Global window exposure
if (typeof window !== 'undefined') {
  window.navigate = navigate;
  window.VIEWS = VIEWS;
}
