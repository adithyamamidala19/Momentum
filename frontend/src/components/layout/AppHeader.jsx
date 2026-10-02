import React, { useState, useRef, useEffect } from 'react';
import { motion, useReducedMotion, useScroll, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import {
  Home,
  Sparkles,
  CheckSquare,
  Mic,
  Calendar,
  Activity,
  Flame,
  TrendingUp,
  Award,
  Trophy,
  User,
  ChevronDown,
  ExternalLink,
  FlameKindling,
  Bell,
  MessageCircle,
  ShieldCheck
} from 'lucide-react';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/apiClient.js';
import { getSocket } from '../../services/socketService.js';
import { EASE } from '../../motionConfig';
import { titleCaseName, pluralize } from '../../utils/formatters.js';

export default function AppHeader({ currentView, setView, loaderDone = true, onOpenChat }) {
  const { state, metrics } = useMomentum();
  const { user, logout } = useAuth();
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [routeProgress, setRouteProgress] = useState(100);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const profileRef = useRef(null);

  // Poll pending friend requests and unread chat messages for in-app notifications
  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const checkPending = async () => {
      try {
        const res = await api.get('/friends/pending');
        if (isMounted) setPendingRequestsCount(res.count || 0);
      } catch (e) {
        // ignore
      }
    };

    const checkUnread = async () => {
      try {
        const res = await api.get('/chat/unread-count');
        if (isMounted && typeof res.unreadCount === 'number') {
          setUnreadMessagesCount(res.unreadCount);
        }
      } catch (e) {
        // ignore
      }
    };

    checkPending();
    checkUnread();

    const interval = setInterval(() => {
      checkPending();
      checkUnread();
    }, 12000);

    // Socket.io real-time listener for incoming messages and notifications
    const socket = getSocket(user.id);
    const handleLiveAlert = () => {
      checkUnread();
    };

    socket.on('chat_notification', handleLiveAlert);
    socket.on('new_message', handleLiveAlert);

    return () => {
      isMounted = false;
      clearInterval(interval);
      socket.off('chat_notification', handleLiveAlert);
      socket.off('new_message', handleLiveAlert);
    };
  }, [user]);

  // Close profile dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Intentional route transition progress bar in brand green
  useEffect(() => {
    setRouteProgress(0);
    const t1 = setTimeout(() => setRouteProgress(70), 50);
    const t2 = setTimeout(() => setRouteProgress(100), 220);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [currentView]);

  // Track scroll direction: hide on scroll down, show on scroll up
  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const diff = latest - previous;

    if (latest < 40) {
      setHidden(false);
    } else if (diff > 6 && latest > 80) {
      setHidden(true);
      setProfileDropdownOpen(false);
    } else if (diff < -6) {
      setHidden(false);
    }
  });

  // Navigation tabs (Home tab hidden for logged-in users; Sanctuary dashboard 'Today' is their anchor)
  const allNavItems = [
    { id: 'home', label: 'Home', icon: Home, publicOnly: true },
    { id: 'today', label: 'Today', icon: Sparkles },
    { id: 'todos', label: 'To-Dos', icon: CheckSquare },
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'rituals', label: 'Rituals', icon: Calendar },
    { id: 'focus', label: 'Focus', icon: Activity },
    { id: 'movement', label: 'Movement', icon: Flame },
    { id: 'insights', label: 'Insights', icon: TrendingUp },
    { id: 'milestones', label: 'Milestones', icon: Award },
    { id: 'challenge', label: 'Challenge', icon: Trophy }
  ];
  const navItems = user ? allNavItems.filter(item => !item.publicOnly) : allNavItems;

  // Extract first name for desktop profile pill
  const fullName = titleCaseName(state.name || 'Mindful Practitioner');
  const firstName = fullName.split(' ')[0] || 'Practitioner';

  return (
    <motion.header
      className="sticky top-0 z-40 w-full glass-nav select-none"
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: -80, opacity: 0 },
      }}
      initial={prefersReduced ? 'visible' : 'hidden'}
      animate={
        prefersReduced
          ? 'visible'
          : !loaderDone
          ? 'hidden'
          : hidden
          ? 'hidden'
          : 'visible'
      }
      transition={{
        duration: 0.35,
        ease: EASE.expoOut,
      }}
    >
      {/* ── Intentional Route Progress Bar (Brand Green) ── */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-transparent overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-[#0F6E56] via-[#168A6D] to-[#A0F3D4] transition-all duration-300 ease-out"
          style={{
            width: `${routeProgress}%`,
            opacity: routeProgress >= 100 ? 0 : 1,
            transition: 'width 250ms ease-out, opacity 400ms 150ms ease'
          }}
        />
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Logo / Wordmark */}
        <button
          type="button"
          onClick={() => {
            setView(user ? 'today' : 'home');
            setProfileDropdownOpen(false);
          }}
          className="flex items-center gap-2.5 cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container rounded-full"
          aria-label={user ? 'Momentum Today Dashboard' : 'Momentum Home'}
        >
          {currentView !== 'home' && (
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white shadow-xs shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#A0F3D4]" />
            </div>
          )}
          <span className="font-editorial text-2xl font-bold tracking-tight text-on-surface inline">
            Momentum
          </span>
        </button>

        {/* ── Desktop Navigation Links (Hidden on Home Page) ── */}
        {currentView !== 'home' && (
          <nav
            className="hidden md:flex items-center gap-1 lg:gap-1.5 bg-surface-container-low/80 backdrop-blur-md p-1.5 rounded-full hairline shadow-xs"
            role="navigation"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setView(item.id);
                    setProfileDropdownOpen(false);
                  }}
                  className={`relative group px-2.5 lg:px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border-0 flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                    isActive
                      ? 'text-white'
                      : 'text-outline hover:text-on-surface hover:bg-surface-container/60'
                  }`}
                  title={item.label}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNavTab"
                      className="absolute inset-0 rounded-full bg-primary-container shadow-xs"
                      transition={{
                        type: 'spring',
                        stiffness: 450,
                        damping: 32
                      }}
                    />
                  )}

                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    {/* Active tab expands to show label; inactive tabs remain icon-only with tooltip */}
                    <AnimatePresence initial={false}>
                      {isActive && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="whitespace-nowrap overflow-hidden inline-block"
                        >
                          {item.label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                </button>
              );
            })}
          </nav>
        )}

        {/* ── Right Navigation / Actions ── */}
        <div className="flex items-center gap-2">
          {/* ── Chat Messages Notification Button (Hidden on Home Page) ── */}
          {user && currentView !== 'home' && (
            <button
              type="button"
              onClick={() => {
                if (onOpenChat) {
                  onOpenChat();
                } else {
                  setView('challenge');
                }
              }}
              className="relative w-8 h-8 rounded-full bg-surface-container-lowest hover:bg-surface-container hairline flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0 transition-colors"
              title={unreadMessagesCount > 0 ? `${unreadMessagesCount} unread message(s)` : 'Chat Messages'}
              aria-label="Chat messages"
            >
              <MessageCircle className="w-4 h-4 text-[#0F6E56]" />
              {unreadMessagesCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs animate-bounce">
                  {unreadMessagesCount > 9 ? '9+' : unreadMessagesCount}
                </span>
              )}
            </button>
          )}

          {/* ── Notification Bell for Pending Friend Requests (Hidden on Home Page) ── */}
          {user && currentView !== 'home' && (
            <button
              type="button"
              onClick={() => setView('profile')}
              className="relative w-8 h-8 rounded-full bg-surface-container-lowest hover:bg-surface-container hairline flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0 transition-colors"
              title={pendingRequestsCount > 0 ? `${pendingRequestsCount} pending connection request(s)` : 'Friends & Circle'}
              aria-label="Friends and connection requests"
            >
              <Bell className="w-4 h-4" />
              {pendingRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}

          {/* ── Profile Chip or Sign In Button ── */}
          {currentView === 'home' ? (
            !user ? (
              <button
                type="button"
                onClick={() => setView('signin')}
                className="py-2 px-5 rounded-full bg-primary-container hover:bg-primary-container-hover text-white text-xs font-semibold cursor-pointer border-0 shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                Sign In
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setView('today')}
                className="py-2 px-5 rounded-full bg-primary-container hover:bg-primary-container-hover text-white text-xs font-semibold cursor-pointer border-0 shadow-xs transition-all hover:scale-105 active:scale-95"
              >
                Enter Sanctuary
              </button>
            )
          ) : (
            <div className="relative" ref={profileRef}>
              {!user ? (
                <button
                  type="button"
                  onClick={() => setView('signin')}
                  className="py-1.5 px-4 rounded-full bg-primary-container hover:bg-primary-container-hover text-white text-xs font-semibold cursor-pointer border-0 shadow-xs transition-all"
                >
                  Sign In
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setProfileDropdownOpen((prev) => !prev)}
                  aria-expanded={profileDropdownOpen}
                  aria-haspopup="true"
                  className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full hairline cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
                    currentView === 'profile' || profileDropdownOpen
                      ? 'bg-primary-container text-white border-primary-container shadow-xs'
                      : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface'
                  }`}
                >
                  {user.photoURL && user.photoType !== 'avatar' ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-7 h-7 rounded-full object-cover shadow-xs"
                    />
                  ) : user.avatarEmblem ? (
                    <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-xs overflow-hidden shadow-xs">
                      {user.avatarEmblem}
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container text-xs font-bold overflow-hidden shadow-xs">
                      {firstName.charAt(0)}
                    </div>
                  )}
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {firstName}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      profileDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}

          {/* Profile Dropdown Card */}
          <AnimatePresence>
            {user && profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-surface-container-lowest hairline shadow-2xl z-50 text-left"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-surface-container">
                  {user.photoURL && user.photoType !== 'avatar' ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-10 h-10 rounded-full object-cover shrink-0 shadow-xs"
                    />
                  ) : user.avatarEmblem ? (
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-lg flex items-center justify-center shrink-0 shadow-xs">
                      {user.avatarEmblem}
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary-container font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                      {firstName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">
                      {user.displayName || fullName}
                    </p>
                    <p className="text-[10px] text-outline truncate">
                      {user.email || 'Mindful habit sanctuary'}
                    </p>
                  </div>
                </div>

                <div className="py-2.5 space-y-1.5 text-xs text-outline border-b border-surface-container">
                  <div className="flex items-center justify-between">
                    <span>Streak</span>
                    <span className="font-bold text-amber-700">
                      {pluralize(metrics.streak, 'day')} 🔥
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Practice Score</span>
                    <span className="font-bold text-primary-container">
                      {metrics.totalPoints} pts
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Adherence</span>
                    <span className="font-bold text-teal-700">
                      {metrics.dailyAdherenceScore}%
                    </span>
                  </div>
                </div>

                <div className="pt-2 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setView('profile');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center justify-between cursor-pointer border-0 transition-colors"
                  >
                    <span>Sanctuary Settings</span>
                    <ExternalLink className="w-3.5 h-3.5 text-outline" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setView('privacy');
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-surface-container hover:bg-surface-container-high text-xs font-semibold text-on-surface flex items-center justify-between cursor-pointer border-0 transition-colors"
                  >
                    <span>Privacy Policy</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-outline" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-xl hover:bg-red-50 text-xs font-medium text-red-700 flex items-center justify-between cursor-pointer border-0 transition-colors"
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
      </div>
      </div>
    </motion.header>
  );
}
