import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from './context/AuthContext.jsx';
import { useMomentum } from './context/MomentumContext.jsx';
import AppHeader from './components/layout/AppHeader.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import RestTimerPill from './components/movement/RestTimerPill.jsx';
import GlobalToast from './components/common/GlobalToast.jsx';
import MovementModal from './components/movement/MovementModal.jsx';
import MealScannerModal from './components/nutrition/MealScannerModal.jsx';
import IntroLoader from './components/animation/IntroLoader.jsx';
import BackgroundLayer from './components/animation/BackgroundLayer.jsx';
import SmoothScroll from './components/animation/SmoothScroll.jsx';

// Pages
import HomePage from './pages/HomePage.jsx';
import TodayPage from './pages/TodayPage.jsx';
import TodosPage from './pages/TodosPage.jsx';
import VoicePage from './pages/VoicePage.jsx';
import RitualsPage from './pages/RitualsPage.jsx';
import FocusPage from './pages/FocusPage.jsx';
import MovementPage from './pages/MovementPage.jsx';
import InsightsPage from './pages/InsightsPage.jsx';
import MilestonesPage from './pages/MilestonesPage.jsx';
import ChallengePage from './pages/ChallengePage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import SignInPage from './pages/SignInPage.jsx';
import PrivacyPage from './pages/PrivacyPage.jsx';
import TermsPage from './pages/TermsPage.jsx';

// STRICT COMPLIANCE: Zero sessionStorage or localStorage. In-memory flag only.
let loaderSeenInMemory = false;

const PUBLIC_VIEWS = ['home', 'signin', 'privacy', 'terms'];
const VALID_VIEWS = [
  'home',
  'signin',
  'privacy',
  'terms',
  'today',
  'todos',
  'voice',
  'rituals',
  'focus',
  'movement',
  'insights',
  'milestones',
  'challenge',
  'profile'
];

export default function App() {
  const prefersReduced = useReducedMotion();
  const { user, loading: authLoading, setIntendedRoute } = useAuth();
  const { mealScannerOpen, closeMealScanner } = useMomentum();

  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.slice(1);
    return VALID_VIEWS.includes(hash) ? hash : 'home';
  });

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementModalTab, setMovementModalTab] = useState('strength');

  // Loader state: in-memory only
  const [loaderDone, setLoaderDone] = useState(loaderSeenInMemory);
  const [videoReady, setVideoReady] = useState(loaderSeenInMemory);

  const handleLoaderDone = () => {
    loaderSeenInMemory = true;
    setLoaderDone(true);
    setTimeout(() => setVideoReady(true), 400);
  };

  // Synchronize hash in URL and scroll to top without layout jump
  const handleSetView = (view) => {
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (VALID_VIEWS.includes(hash)) {
        setCurrentView(hash);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Route Guard: Protect non-public routes
  useEffect(() => {
    if (!authLoading && !user && !PUBLIC_VIEWS.includes(currentView)) {
      setIntendedRoute(currentView);
      handleSetView('signin');
    }
  }, [user, authLoading, currentView, setIntendedRoute]);

  const openMovementModal = (tab = 'strength') => {
    setMovementModalTab(tab);
    setMovementModalOpen(true);
  };

  const renderView = () => {
    // If loading auth state on a protected route, render a gentle calm shimmer
    if (authLoading && !PUBLIC_VIEWS.includes(currentView)) {
      return (
        <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-primary-fixed/40 animate-pulse mx-auto" />
          <p className="text-xs text-outline italic">Entering your mindful sanctuary...</p>
        </div>
      );
    }

    switch (currentView) {
      case 'home':
        return <HomePage setView={handleSetView} loaderDone={loaderDone} />;
      case 'signin':
        return <SignInPage setView={handleSetView} />;
      case 'privacy':
        return <PrivacyPage setView={handleSetView} />;
      case 'terms':
        return <TermsPage setView={handleSetView} />;
      case 'today':
        return <TodayPage setView={handleSetView} onOpenMovement={() => openMovementModal('strength')} />;
      case 'todos':
        return <TodosPage />;
      case 'voice':
        return <VoicePage />;
      case 'rituals':
        return <RitualsPage />;
      case 'focus':
        return <FocusPage />;
      case 'movement':
        return <MovementPage onOpenMovement={() => openMovementModal('strength')} />;
      case 'insights':
        return <InsightsPage />;
      case 'milestones':
        return <MilestonesPage />;
      case 'challenge':
        return <ChallengePage setView={handleSetView} />;
      case 'profile':
        return <ProfilePage setView={handleSetView} />;
      default:
        return <HomePage setView={handleSetView} loaderDone={loaderDone} />;
    }
  };

  return (
    <SmoothScroll>
      <div className="min-h-screen flex flex-col text-on-surface w-full max-w-[100vw] overflow-x-hidden" style={{ backgroundColor: '#FAF7F0' }}>
        {/* ── Premium Background (fixed, behind everything) ── */}
        <BackgroundLayer videoReady={videoReady} />

        {/* ── Cinematic Intro Loader (once per session, in-memory) ── */}
        <AnimatePresence>
          {!loaderDone && (
            <IntroLoader onDone={handleLoaderDone} />
          )}
        </AnimatePresence>

        {/* ── Desktop App Header ── */}
        <AppHeader currentView={currentView} setView={handleSetView} loaderDone={loaderDone} />

        {/* ── Main Content Area with Route Transitions ── */}
        <main className="flex-1 pb-24 md:pb-12 w-full max-w-[100vw] overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={prefersReduced ? { opacity: 1 } : { opacity: 0, y: 16 }}
              animate={prefersReduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
              exit={prefersReduced ? { opacity: 0 } : { opacity: 0, y: -8 }}
              transition={{
                duration: prefersReduced ? 0.001 : 0.45,
                ease: [0.22, 1, 0.36, 1]
              }}
              className="w-full max-w-[100vw] overflow-x-hidden"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        <BottomNav currentView={currentView} setView={handleSetView} />

        {/* ── Persistent Global Modals and Floating Overlays ── */}
        <RestTimerPill />
        <GlobalToast />
        <MovementModal
          isOpen={movementModalOpen}
          onClose={() => setMovementModalOpen(false)}
          initialTab={movementModalTab}
        />
        <MealScannerModal
          isOpen={mealScannerOpen}
          onClose={closeMealScanner}
        />
      </div>
    </SmoothScroll>
  );
}
