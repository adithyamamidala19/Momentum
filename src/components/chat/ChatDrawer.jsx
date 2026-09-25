import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  ShieldAlert,
  RotateCcw,
  Check,
  CheckCheck,
  Circle,
  AlertTriangle,
  Lock,
  MoreVertical,
  Flag,
  Ban,
  ShieldCheck,
  HeartHandshake
} from 'lucide-react';
import { api } from '../../services/apiClient.js';
import { getSocket } from '../../services/socketService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useMomentum } from '../../context/MomentumContext.jsx';
import { validateSafeContent, SAFETY_WARNING } from '../../utils/moderationFilter.js';
import ChatSafetyModal from './ChatSafetyModal.jsx';
import ReportModal from '../moderation/ReportModal.jsx';

export default function ChatDrawer({
  isOpen,
  onClose,
  friend, // { id, nickname, avatar, conversationId, showOnlineStatus }
  onOpenPrivacy,
  onUserBlocked
}) {
  const { user } = useAuth();
  const { showToast } = useMomentum();

  const [conversationId, setConversationId] = useState(friend?.conversationId || null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [safetyWarning, setSafetyWarning] = useState(null);

  // Safety interstitial check
  const [safetyModalOpen, setSafetyModalOpen] = useState(false);

  // Online status
  const [isFriendOnline, setIsFriendOnline] = useState(false);

  // Typing indicator
  const [isFriendTyping, setIsFriendTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Report modal
  const [reportTarget, setReportTarget] = useState(null); // { type, id, text }
  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Options menu
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);

  // Auto-scroll ref
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Retract countdown ticker
  const [nowTime, setNowTime] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 1. Fetch or create conversation and load messages
  useEffect(() => {
    if (!isOpen || !friend?.id) return;

    let isMounted = true;
    async function initChat() {
      setLoadingMessages(true);
      setSafetyWarning(null);

      try {
        let convId = friend.conversationId;

        // If no conversationId passed, find or create from /api/chat/conversations
        if (!convId) {
          const res = await api.get('/chat/conversations');
          const found = res.conversations?.find((c) => c.otherUser?.id === friend.id);
          if (found) {
            convId = found.id;
          }
        }

        if (convId && isMounted) {
          setConversationId(convId);
          const msgRes = await api.get(`/chat/conversation/${convId}/messages`);
          if (isMounted) {
            setMessages(msgRes.messages || []);
          }
        }
      } catch (err) {
        console.warn('[Chat] Failed to load messages:', err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    }

    initChat();
    return () => {
      isMounted = false;
    };
  }, [isOpen, friend]);

  // 2. Setup Socket.io real-time listeners and polling fallback
  useEffect(() => {
    if (!isOpen || !conversationId) return;

    const socket = getSocket(user?.id);
    socket.emit('join_conversation', conversationId.toString());

    // Listen for incoming messages
    const handleNewMessage = (msg) => {
      if (!msg) return;
      const msgConvId = (msg.conversationId || msg.conversation_id)?.toString();
      const currentConvId = conversationId.toString();

      if (msgConvId === currentConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id || m._id === msg.id)) return prev;
          return [...prev, msg];
        });

        // Emit read receipt if friend's message
        if (msg.senderId !== user?.id) {
          socket.emit('message_read', { conversationId: currentConvId, messageId: msg.id });
        }
      }
    };

    // Also listen for personal chat notifications
    const handleChatNotification = (data) => {
      if (data?.message && data.conversationId?.toString() === conversationId.toString()) {
        handleNewMessage(data.message);
      }
    };

    // Listen for typing events
    const handleTyping = ({ conversationId: cId, userId, isTyping }) => {
      if (cId?.toString() === conversationId.toString() && userId === friend?.id) {
        setIsFriendTyping(isTyping);
      }
    };

    // Listen for online status
    const handleUserOnline = ({ userId }) => {
      if (userId === friend?.id && friend?.showOnlineStatus !== false) {
        setIsFriendOnline(true);
      }
    };

    const handleUserOffline = ({ userId }) => {
      if (userId === friend?.id) {
        setIsFriendOnline(false);
      }
    };

    // Listen for read receipts
    const handleReadReceipt = ({ conversationId: cId, messageId, readAt }) => {
      if (cId?.toString() === conversationId.toString()) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, readAt } : m))
        );
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('chat_notification', handleChatNotification);
    socket.on('user_typing', handleTyping);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);
    socket.on('message_read_receipt', handleReadReceipt);

    // High-reliability live polling interval: checks for new messages every 3.5s while open
    const pollTimer = setInterval(async () => {
      try {
        const msgRes = await api.get(`/chat/conversation/${conversationId}/messages`);
        if (msgRes.messages && Array.isArray(msgRes.messages)) {
          setMessages((prev) => {
            if (msgRes.messages.length !== prev.length) {
              return msgRes.messages;
            }
            return prev;
          });
        }
      } catch (e) {
        // quiet error suppression on polling
      }
    }, 3500);

    return () => {
      clearInterval(pollTimer);
      socket.emit('leave_conversation', conversationId.toString());
      socket.off('new_message', handleNewMessage);
      socket.off('chat_notification', handleChatNotification);
      socket.off('user_typing', handleTyping);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
      socket.off('message_read_receipt', handleReadReceipt);
    };
  }, [isOpen, conversationId, friend, user]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isFriendTyping]);

  if (!isOpen || !friend) return null;

  // Handle typing change
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputText(val);

    // Live safety pre-check
    const check = validateSafeContent(val);
    if (!check.passed) {
      setSafetyWarning(check.warning);
    } else {
      setSafetyWarning(null);
    }

    // Emit socket typing indicator
    if (conversationId) {
      const socket = getSocket(user?.id);
      socket.emit('typing', { conversationId, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { conversationId, isTyping: false });
      }, 1500);
    }
  };

  // Send message implementation
  const executeSendMessage = async (textToSend) => {
    const cleanText = textToSend?.trim();
    if (!cleanText || sending) return;

    // Safety validation
    const check = validateSafeContent(cleanText);
    if (!check.passed) {
      setSafetyWarning(check.warning);
      return;
    }

    setSending(true);
    setSafetyWarning(null);

    try {
      let activeConvId = conversationId;

      // If conversation doesn't exist yet, wait or find it
      if (!activeConvId) {
        const convRes = await api.get('/chat/conversations');
        const found = convRes.conversations?.find((c) => c.otherUser?.id === friend.id);
        if (found) {
          activeConvId = found.id;
          setConversationId(found.id);
        } else {
          showToast('Mutual friendship required to message.');
          setSending(false);
          return;
        }
      }

      const res = await api.post('/chat/message', {
        conversationId: activeConvId,
        text: cleanText
      });

      if (res.message) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === res.message.id)) return prev;
          return [...prev, res.message];
        });
        setInputText('');
      }
    } catch (err) {
      if (err.code === 'SAFETY_PII_BLOCKED' || err.message?.includes('contact details')) {
        setSafetyWarning(err.message || SAFETY_WARNING);
      } else {
        showToast(err.message || 'Failed to send message.');
      }
    } finally {
      setSending(false);
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || sending) return;

    // Check safety interstitial first-time requirement
    if (user && !user.chatSafetyAcknowledged) {
      setSafetyModalOpen(true);
      return;
    }

    await executeSendMessage(inputText);
  };

  // Undo / retract message within 10 seconds
  const handleRetractMessage = async (messageId) => {
    try {
      await api.post('/chat/message/undo-delete', { messageId });
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      showToast('Message retracted.');
    } catch (err) {
      showToast(err.message || 'Undo window expired (10s max).');
    }
  };

  // Block friend handler
  const handleBlockFriend = async () => {
    try {
      await api.post('/moderation/block', { targetUserId: friend.id });
      showToast(`${friend.nickname} has been blocked.`);
      onUserBlocked?.(friend.id);
      onClose();
    } catch (err) {
      showToast('Failed to block user.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/50 backdrop-blur-xs">
        <motion.div
          initial={{ x: '100%', opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0.8 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-md h-full bg-[#FAF7F0] text-on-surface shadow-2xl flex flex-col border-l border-surface-container overflow-hidden"
          role="dialog"
          aria-modal="true"
          aria-label={`Chat with ${friend.nickname}`}
        >
          {/* ── Top Header ── */}
          <div className="px-5 py-4 bg-[#FAF7F0] border-b border-surface-container flex items-center justify-between z-10 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-surface-container-lowest border border-surface-container flex items-center justify-center text-xl shadow-2xs">
                  <span>{friend.avatar || '🌱'}</span>
                </div>
                {friend.showOnlineStatus !== false && (
                  <span
                    className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#FAF7F0] ${
                      isFriendOnline ? 'bg-emerald-500' : 'bg-stone-300'
                    }`}
                    title={isFriendOnline ? 'Online' : 'Resting'}
                  />
                )}
              </div>

              <div className="min-w-0">
                <h3 className="font-editorial text-base text-on-surface font-semibold truncate leading-tight">
                  {friend.nickname}
                </h3>
                <span className="text-[11px] text-outline flex items-center gap-1">
                  {isFriendTyping ? (
                    <span className="text-[#0F6E56] font-semibold animate-pulse">writing...</span>
                  ) : isFriendOnline ? (
                    'Active now'
                  ) : (
                    'Mindful habit partner'
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOptionsMenuOpen((prev) => !prev)}
                  className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0 bg-transparent"
                  aria-label="Chat options"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {optionsMenuOpen && (
                  <div className="absolute right-0 mt-2 w-44 rounded-2xl bg-surface-container-lowest border border-surface-container shadow-xl p-1.5 z-20 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        setSafetyModalOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-[#0F6E56]/10 text-on-surface flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0F6E56]" />
                      <span>Sanctuary Guidelines</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        setReportTarget({ type: 'profile', id: friend.id, name: friend.nickname });
                        setReportModalOpen(true);
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-rose-500/10 text-rose-700 flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      <span>Report User</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOptionsMenuOpen(false);
                        handleBlockFriend();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left hover:bg-rose-500/10 text-rose-700 flex items-center gap-2 cursor-pointer border-0 bg-transparent"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Block User</span>
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface cursor-pointer border-0 bg-transparent"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ── Messages Container ── */}
          <div
            ref={scrollContainerRef}
            className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#FAF7F0]"
          >
            {/* Mindful Circle Banner */}
            <div className="p-3.5 rounded-2xl bg-surface-container-lowest border border-surface-container/60 text-center space-y-1.5 my-2">
              <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0F6E56]">
                <Lock className="w-3 h-3" />
                <span>Private & Mindful Sanctuary</span>
              </div>
              <p className="text-[10px] text-outline leading-relaxed max-w-xs mx-auto">
                Messages are end-to-end moderated for safety. Never share personal contact numbers, handles, or addresses.
              </p>
              <button
                type="button"
                onClick={() => setSafetyModalOpen(true)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0F6E56] hover:underline cursor-pointer border-0 bg-transparent pt-0.5"
              >
                <HeartHandshake className="w-3 h-3" />
                <span>Safe Sanctuary Circle Guidelines</span>
              </button>
            </div>

            {loadingMessages ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-8 h-8 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin mx-auto" />
                <span className="text-xs text-outline italic">Opening conversation...</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="text-3xl">🌿</div>
                <h4 className="font-editorial text-lg text-on-surface">Begin with a gentle hello</h4>
                <p className="text-xs text-outline max-w-xs mx-auto">
                  Encourage each other along your daily rhythms. Consistency grows together.
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === user?.id || msg.isMine;
                const createdAt = new Date(msg.createdAt).getTime();
                const ageSec = Math.floor((nowTime - createdAt) / 1000);
                const canUndo = isMine && ageSec < 10;

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} group`}
                  >
                    <div className="flex items-end gap-1.5 max-w-[82%]">
                      {/* Message Bubble */}
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-2xs break-words ${
                          isMine
                            ? 'bg-[#0F6E56] text-white rounded-br-xs'
                            : 'bg-[#E8EFEA] text-[#1A2E26] rounded-bl-xs border border-surface-container'
                        }`}
                      >
                        {msg.text}
                      </div>

                      {/* Undo / Retract within 10 seconds button */}
                      {canUndo && (
                        <button
                          type="button"
                          onClick={() => handleRetractMessage(msg.id)}
                          className="p-1 rounded-full bg-surface-container-high/80 hover:bg-rose-500/20 text-outline hover:text-rose-700 text-[10px] font-mono flex items-center gap-0.5 cursor-pointer border-0 transition-colors"
                          title="Undo within 10s"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{10 - ageSec}s</span>
                        </button>
                      )}

                      {/* Report button on friend's message */}
                      {!isMine && (
                        <button
                          type="button"
                          onClick={() => {
                            setReportTarget({ type: 'message', id: msg.id, name: friend.nickname });
                            setReportModalOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-surface-container text-outline hover:text-rose-700 cursor-pointer border-0 bg-transparent transition-opacity"
                          title="Report message"
                        >
                          <Flag className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Metadata: Timestamp & Read Receipts */}
                    <div className="flex items-center gap-1 mt-1 px-1 text-[10px] text-outline font-mono">
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      {isMine && (
                        <span>
                          {msg.readAt ? (
                            <CheckCheck className="w-3 h-3 text-[#0F6E56] inline" />
                          ) : (
                            <Check className="w-3 h-3 text-outline inline" />
                          )}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}

            {/* Friend Typing Indicator Bubble */}
            {isFriendTyping && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-xs text-outline pl-1"
              >
                <div className="px-3.5 py-2 rounded-2xl bg-[#E8EFEA] text-on-surface rounded-bl-xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E56] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E56] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F6E56] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── Inline Safety Warning (Phase D3) ── */}
          {safetyWarning && (
            <div className="mx-4 mb-2 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 text-xs flex items-start gap-2 animate-shake">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-tight">
                <span className="font-semibold block">Safety Shield Notice:</span>
                <span>{safetyWarning}</span>
              </div>
            </div>
          )}

          {/* ── Input Bar ── */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 bg-[#FAF7F0] border-t border-surface-container flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={handleInputChange}
              placeholder="Send mindful encouragement..."
              maxLength={1000}
              className="flex-1 px-4 py-2.5 rounded-full bg-surface-container-lowest border border-surface-container text-xs text-on-surface focus:outline-none focus:ring-1 focus:ring-[#0F6E56]"
            />
            <button
              type="submit"
              disabled={sending || !inputText.trim() || Boolean(safetyWarning)}
              className="w-9 h-9 rounded-full bg-[#0F6E56] hover:bg-[#168A6D] text-white flex items-center justify-center cursor-pointer border-0 transition-all shadow-xs disabled:opacity-40"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </motion.div>
      </div>

      {/* First-time Chat Safety Interstitial Modal (Phase D4) */}
      {safetyModalOpen && (
        <ChatSafetyModal
          isOpen={safetyModalOpen}
          onClose={() => setSafetyModalOpen(false)}
          onAcknowledge={async () => {
            setSafetyModalOpen(false);
            if (inputText.trim()) {
              await executeSendMessage(inputText);
            }
          }}
          onOpenPrivacy={() => {
            setSafetyModalOpen(false);
            onOpenPrivacy?.();
          }}
        />
      )}

      {/* Trust & Safety Report Modal */}
      {reportModalOpen && (
        <ReportModal
          isOpen={reportModalOpen}
          onClose={() => {
            setReportModalOpen(false);
            setReportTarget(null);
          }}
          targetType={reportTarget?.type || 'message'}
          targetId={reportTarget?.id}
          targetUserId={friend.id}
          targetNickname={friend.nickname}
        />
      )}
    </>
  );
}
