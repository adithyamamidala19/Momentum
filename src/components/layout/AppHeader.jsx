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
  FlameKindling
} from 'lucide-react';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { EASE } from '../../motionConfig';
import { titleCaseName, pluralize } from '../../utils/formatters.js';

export default function AppHeader({ currentView, setView, loaderDone = true }) {
  const { state, metrics } = useMomentum();
  const prefersReduced = useReducedMotion();
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [routeProgress, setRouteProgress] = useState(100);
  const profileRef = useRef(null);

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

  // 10 Tabs (including Challenge)
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
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

  // Extract first name for desktop profile pill
  const fullName = titleCaseName(state.name || 'Adithya Mamidala');
  const firstName = fullName.split(' ')[0] || 'Adithya';

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
            setView('home');
            setProfileDropdownOpen(false);
          }}
          className="flex items-center gap-2.5 cursor-pointer border-0 bg-transparent p-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container rounded-full"
          aria-label="Momentum Home"
        >
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-[#A0F3D4]" />
          </div>
          <span className="font-editorial text-xl font-bold tracking-tight text-on-surface hidden sm:inline">
            Momentum
          </span>
        </button>

        {/* ── Desktop Navigation Links ── */}
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

        {/* ── Profile Chip with Dropdown ── */}
        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setProfileDropdownOpen(prev => !prev)}
            aria-expanded={profileDropdownOpen}
            aria-haspopup="true"
            className={`flex items-center gap-2 pl-1.5 pr-3 py-1 rounded-full hairline cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-container ${
              currentView === 'profile' || profileDropdownOpen
                ? 'bg-primary-container text-white border-primary-container shadow-xs'
                : 'bg-surface-container-lowest hover:bg-surface-container text-on-surface'
            }`}
          >
            <div className="w-7 h-7 rounded-full bg-primary-fixed flex items-center justify-center text-primary-container text-xs font-bold overflow-hidden shadow-xs">
              {firstName.charAt(0)}
            </div>
            <span className="text-xs font-semibold whitespace-nowrap">
              {firstName}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                profileDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Profile Dropdown Card */}
          <AnimatePresence>
            {profileDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute right-0 mt-2 w-64 p-4 rounded-2xl bg-surface-container-lowest hairline shadow-2xl z-50 text-left"
              >
                <div className="flex items-center gap-3 pb-3 border-b border-surface-container">
                  <div className="w-10 h-10 rounded-full bg-primary-fixed text-primary-container font-bold text-sm flex items-center justify-center shrink-0">
                    {firstName.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-on-surface truncate">
                      {fullName}
                    </p>
                    <p className="text-[10px] text-outline truncate">
                      {state.email || 'Mindful habit sanctuary'}
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

                <div className="pt-2">
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
