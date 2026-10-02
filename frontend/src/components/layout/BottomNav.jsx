import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext.jsx';
import { api } from '../../services/apiClient.js';
import { getSocket } from '../../services/socketService.js';
import {
  Sparkles,
  Calendar,
  Activity,
  Trophy,
  MoreHorizontal,
  X,
  CheckSquare,
  Mic,
  Flame,
  TrendingUp,
  Award,
  Home,
  User
} from 'lucide-react';

export default function BottomNav({ currentView, setView }) {
  const { user } = useAuth();
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    const fetchUnread = async () => {
      try {
        const res = await api.get('/chat/unread-count');
        if (isMounted && typeof res.unreadCount === 'number') {
          setUnreadCount(res.unreadCount);
        }
      } catch {
        // ignore
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    const socket = getSocket(user.id);
    const handleAlert = () => fetchUnread();
    socket.on('chat_notification', handleAlert);
    socket.on('new_message', handleAlert);

    return () => {
      isMounted = false;
      clearInterval(interval);
      socket.off('chat_notification', handleAlert);
      socket.off('new_message', handleAlert);
    };
  }, [user]);

  // 5 Primary Mobile Tabs
  const primaryTabs = [
    { id: 'today', label: 'Today', icon: Sparkles },
    { id: 'rituals', label: 'Rituals', icon: Calendar },
    { id: 'focus', label: 'Focus', icon: Activity },
    { id: 'challenge', label: 'Challenge', icon: Trophy },
    { id: 'more', label: 'More', icon: MoreHorizontal, isAction: true }
  ];

  // Secondary pages accessible via the "More" bottom sheet (Home hidden when logged in)
  const allSecondaryPages = [
    { id: 'todos', label: 'To-Dos', icon: CheckSquare, desc: 'Mindful task checklists' },
    { id: 'voice', label: 'Voice Sanctuary', icon: Mic, desc: 'Aria assistant & audio log' },
    { id: 'movement', label: 'Movement', icon: Flame, desc: 'Strength & physical practice' },
    { id: 'insights', label: 'Insights', icon: TrendingUp, desc: 'Consistency & rhythm curves' },
    { id: 'milestones', label: 'Milestones', icon: Award, desc: '3D specular medals' },
    { id: 'profile', label: 'Profile & Settings', icon: User, desc: 'Personal sanctuary cadence' },
    { id: 'home', label: 'Home Sanctuary', icon: Home, desc: 'Overview & philosophy', publicOnly: true }
  ];

  const secondaryPages = user ? allSecondaryPages.filter(p => !p.publicOnly) : allSecondaryPages;

  const handleTabClick = (tab) => {
    if (tab.isAction) {
      setMoreSheetOpen(true);
    } else {
      setView(tab.id);
      setMoreSheetOpen(false);
    }
  };

  const handleNavigateFromSheet = (id) => {
    setView(id);
    setMoreSheetOpen(false);
  };

  const isCurrentViewInMore = secondaryPages.some(p => p.id === currentView);

  return (
    <>
      {/* ── Fixed Bottom Tab Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#FAF7F0]/95 backdrop-blur-lg border-t border-[#E6E6E3] select-none"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 8px)' }}
        role="navigation"
        aria-label="Mobile Navigation Bar"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {primaryTabs.map((tab) => {
            const isActive = tab.isAction ? isCurrentViewInMore : currentView === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => handleTabClick(tab)}
                className={`relative flex flex-col items-center justify-center flex-1 py-1 cursor-pointer border-0 bg-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary-container ${
                  isActive
                    ? 'text-[#0F6E56] font-bold'
                    : 'text-outline hover:text-on-surface'
                }`}
                aria-label={tab.label}
                aria-current={isActive && !tab.isAction ? 'page' : undefined}
              >
                <div className="relative">
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                  {tab.id === 'challenge' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#FAF7F0] animate-pulse" />
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavDot"
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0F6E56] shadow-[0_0_8px_rgba(15,110,86,0.6)]"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-[10px] tracking-tight mt-1">
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      {/* ── "More" Smooth Bottom Sheet ── */}
      <AnimatePresence>
        {moreSheetOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMoreSheetOpen(false)}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              aria-hidden="true"
            />

            {/* Bottom Sheet Drawer */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-h-[80vh] overflow-y-auto rounded-t-3xl bg-[#FAF7F0] hairline-t shadow-2xl p-5 select-none"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 24px)' }}
              role="dialog"
              aria-modal="true"
              aria-label="More Sanctuary Pages"
            >
              {/* Drag handle */}
              <div className="w-12 h-1.5 rounded-full bg-[#E6E6E3] mx-auto mb-4" />

              <div className="flex items-center justify-between pb-3 border-b border-[#E6E6E3] mb-4">
                <div>
                  <h3 className="font-editorial text-xl font-normal text-on-surface">
                    Sanctuary Pages
                  </h3>
                  <p className="text-xs text-outline">
                    Explore all practices & reflections.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMoreSheetOpen(false)}
                  className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0"
                  aria-label="Close navigation sheet"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of secondary pages */}
              <div className="grid grid-cols-1 gap-2.5">
                {secondaryPages.map((page) => {
                  const Icon = page.icon;
                  const isCurrent = currentView === page.id;

                  return (
                    <button
                      key={page.id}
                      type="button"
                      onClick={() => handleNavigateFromSheet(page.id)}
                      className={`w-full p-3.5 rounded-2xl hairline flex items-center justify-between transition-all cursor-pointer border text-left ${
                        isCurrent
                          ? 'bg-[#0F6E56]/10 border-[#0F6E56]/40 text-[#0F6E56]'
                          : 'bg-surface-container-lowest border-[#E6E6E3] hover:bg-surface-container text-on-surface'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isCurrent
                              ? 'bg-[#0F6E56] text-white'
                              : 'bg-surface-container text-outline'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold block">
                            {page.label}
                          </span>
                          <span className="text-[11px] text-outline">
                            {page.desc}
                          </span>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#0F6E56] text-white">
                          Current
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
