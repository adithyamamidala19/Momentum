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
import OnboardingWizard from './components/onboarding/OnboardingWizard.jsx';
import ChatDrawer from './components/chat/ChatDrawer.jsx';
import { getSocket } from './services/socketService.js';
import { api } from './services/apiClient.js';
import { MeditativeAudio } from '../js/services/soundscape.js';

// STRICT COMPLIANCE: Zero storage usage; in-memory flag only.
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
  const { mealScannerOpen, closeMealScanner, showToast } = useMomentum();

  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.slice(1);
    return VALID_VIEWS.includes(hash) ? hash : 'home';
  });

  const [movementModalOpen, setMovementModalOpen] = useState(false);
  const [movementModalTab, setMovementModalTab] = useState('strength');
  const [globalChatFriend, setGlobalChatFriend] = useState(null);

  // Global real-time socket listener for incoming chat notifications
  useEffect(() => {
    if (!user) return;
    const socket = getSocket(user.id);

    const onChatNotification = (data) => {
      if (data?.type === 'new_message' && data.senderNickname) {
        // If drawer is already open with this user, don't duplicate toast
        if (globalChatFriend?.id === data.senderId) return;

        showToast(
          `💬 ${data.senderAvatar || '🌱'} ${data.senderNickname}: "${(data.message?.text || '').slice(0, 36)}${
            data.message?.text?.length > 36 ? '...' : ''
          }"`
        );
      }
    };

    socket.on('chat_notification', onChatNotification);
    return () => socket.off('chat_notification', onChatNotification);
  }, [user, globalChatFriend, showToast]);

  const handleOpenGlobalChat = async () => {
    try {
      const res = await api.get('/chat/conversations');
      if (res.conversations && res.conversations.length > 0) {
        const unreadConv = res.conversations.find((c) => (c.unreadCount || 0) > 0) || res.conversations[0];
        if (unreadConv?.otherUser) {
          setGlobalChatFriend({
            id: unreadConv.otherUser.id,
            nickname: unreadConv.otherUser.nickname,
            avatar: unreadConv.otherUser.avatar,
            conversationId: unreadConv.id,
            showOnlineStatus: unreadConv.otherUser.showOnlineStatus
          });
          return;
        }
      }
      handleSetView('challenge');
    } catch {
      handleSetView('challenge');
    }
  };

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
    if (currentView === 'focus' && view !== 'focus') {
      try { MeditativeAudio.stopTone(); } catch (e) {}
    }
    setCurrentView(view);
    window.location.hash = view;
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (VALID_VIEWS.includes(hash)) {
        if (currentView === 'focus' && hash !== 'focus') {
          try { MeditativeAudio.stopTone(); } catch (e) {}
        }
        setCurrentView(hash);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [currentView]);

  // Route Guard: Protect non-public routes & redirect authenticated users away from home/signin
  useEffect(() => {
    if (!authLoading) {
      if (!user && !PUBLIC_VIEWS.includes(currentView)) {
        setIntendedRoute(currentView);
        handleSetView('signin');
      } else if (user && (currentView === 'home' || currentView === 'signin')) {
        handleSetView('today');
      }
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
        return <InsightsPage setView={handleSetView} />;
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

  // If user is authenticated but hasn't completed onboarding, render the setup wizard
  if (user && user.onboardingCompleted === false) {
    return (
      <SmoothScroll>
        <div className="min-h-screen flex flex-col text-on-surface w-full max-w-[100vw] overflow-x-hidden" style={{ backgroundColor: '#FAF7F0' }}>
          <BackgroundLayer videoReady={videoReady} />
          <OnboardingWizard onComplete={() => handleSetView('today')} />
          <GlobalToast />
        </div>
      </SmoothScroll>
    );
  }

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
        <AppHeader
          currentView={currentView}
          setView={handleSetView}
          loaderDone={loaderDone}
          onOpenChat={handleOpenGlobalChat}
        />

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

        {/* ── Mobile Bottom Navigation (Hidden on Home & Sign In) ── */}
        {currentView !== 'home' && currentView !== 'signin' && (
          <BottomNav currentView={currentView} setView={handleSetView} />
        )}

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

        {/* ── Global 1:1 Safe Chat Drawer ── */}
        {globalChatFriend && (
          <ChatDrawer
            isOpen={Boolean(globalChatFriend)}
            onClose={() => setGlobalChatFriend(null)}
            friend={globalChatFriend}
            onOpenPrivacy={() => {
              setGlobalChatFriend(null);
              handleSetView('privacy');
            }}
            onUserBlocked={() => {
              setGlobalChatFriend(null);
              showToast('User blocked.');
            }}
          />
        )}
      </div>
    </SmoothScroll>
  );
}
