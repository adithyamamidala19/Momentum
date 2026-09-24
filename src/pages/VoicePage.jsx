import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMomentum } from '../context/MomentumContext.jsx';
import PageShell from '../components/layout/PageShell.jsx';
import PageHeader from '../components/layout/PageHeader.jsx';
import { ConversationStateMachine } from '../../js/services/conversation-state-machine.js';
import { userState } from '../../js/state.js';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

export default function VoicePage() {
  const {
    state,
    addTodoTask,
    toggleHabit,
    skipHabitForToday,
    incrementWater,
    showToast,
    triggerUndoableAction,
    syncState
  } = useMomentum();

  // State: 'idle' | 'listening' | 'processing' | 'speaking' | 'success' | 'error' | 'permission-denied'
  const [orbState, setOrbState] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [ariaResponse, setAriaResponse] = useState("Hey! I'm Aria, your mindful sanctuary assistant. How can I support your rhythm today?");
  const [history, setHistory] = useState([
    {
      role: 'aria',
      text: "Hey! I'm Aria, your mindful sanctuary assistant. How can I support your rhythm today?",
      time: 'Just now'
    }
  ]);
  const [textInput, setTextInput] = useState('');

  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const animationFrameRef = useRef(null);
  const historyBottomRef = useRef(null);

  // Suggested prompt chips
  const suggestedPrompts = [
    'Log 2 glasses of water',
    'Add buy groceries to my to-dos',
    'What is my streak?',
    'Skip breathing ritual for today'
  ];

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setOrbState('listening');
      };

      rec.onresult = (e) => {
        const current = Array.from(e.results)
          .map(r => r[0].transcript)
          .join('');
        setTranscript(current);
      };

      rec.onend = () => {
        if (orbState === 'listening') {
          setOrbState('processing');
        }
      };

      rec.onerror = (e) => {
        if (e.error === 'not-allowed') {
          setOrbState('permission-denied');
        } else {
          setOrbState('error');
        }
      };

      recognitionRef.current = rec;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [orbState]);

  // Audio Reactive Sine Wave Canvas in Brand Forest & Sage
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      const isListening = orbState === 'listening';
      const isSpeaking = orbState === 'speaking';
      const isProcessing = orbState === 'processing';
      const amp = isListening ? 26 : isSpeaking ? 18 : isProcessing ? 14 : 7;

      // Layer 1: Forest Green Sine Wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(15, 110, 86, 0.85)';
      ctx.lineWidth = 2.5;
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.025 + phase) * amp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Layer 2: Calm Sage Wave (offset and counter-flowing)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(163, 198, 177, 0.7)';
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.035 - phase * 1.3) * (amp * 0.75);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += isListening ? 0.08 : 0.04;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [orbState]);

  const machineRef = useRef(null);
  const pendingInputRef = useRef('');

  // Initialize ConversationStateMachine
  useEffect(() => {
    machineRef.current = new ConversationStateMachine({
      onSpeak: (replyText, expectResponse) => {
        setAriaResponse(replyText);
        setHistory(prev => [
          ...prev,
          {
            role: 'aria',
            text: replyText,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
          }
        ]);
        setOrbState('speaking');

        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(replyText);
          utterance.rate = 1.0;
          utterance.pitch = 1.05;
          utterance.onend = () => {
            setOrbState(expectResponse ? 'listening' : 'success');
            setTimeout(() => {
              setOrbState('idle');
            }, 3000);
          };
          utterance.onerror = () => {
            setOrbState('idle');
          };
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => {
            setOrbState(expectResponse ? 'listening' : 'idle');
          }, 2400);
        }
      },
      onUndoTrigger: (actionName) => {
        triggerUndoableAction(actionName, () => {});
      }
    });
  }, [triggerUndoableAction]);

  // Handle Command Processing
  const handleProcessCommand = async (text) => {
    if (!text.trim()) {
      setOrbState('idle');
      return;
    }

    pendingInputRef.current = text;
    setOrbState('processing');

    // Add user message to history
    setHistory(prev => [
      ...prev,
      {
        role: 'user',
        text: text.trim(),
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }
    ]);

    try {
      if (machineRef.current) {
        await machineRef.current.processUtterance(text);
        syncState(prev => ({
          ...prev,
          todos: JSON.parse(JSON.stringify(userState.todos || [])),
          customHabits: JSON.parse(JSON.stringify(userState.customHabits || [])),
          waterGlasses: userState.waterGlasses,
          waterMl: (userState.waterGlasses || 6) * 250,
          movementLogs: JSON.parse(JSON.stringify(userState.movementLogs || []))
        }));
      }
    } catch (err) {
      console.error('Error processing voice utterance:', err);
      setAriaResponse("I encountered a gentle pause processing that. Please feel free to try again.");
      setOrbState('error');
    }
  };

  const handleToggleMic = () => {
    if (orbState === 'listening') {
      if (recognitionRef.current) recognitionRef.current.stop();
      handleProcessCommand(transcript);
    } else {
      setTranscript('');
      try {
        if (recognitionRef.current) {
          recognitionRef.current.start();
          setOrbState('listening');
        } else {
          showToast('Speech recognition not available on this browser.');
        }
      } catch (e) {
        setOrbState('idle');
      }
    }
  };

  const handlePromptClick = (prompt) => {
    setTextInput(prompt);
    setTranscript(prompt);
    handleProcessCommand(prompt);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    const txt = textInput.trim();
    setTextInput('');
    setTranscript(txt);
    handleProcessCommand(txt);
  };

  return (
    <PageShell centered>
      {/* ── Page Header with Brand Green Eyebrow (No Cyan!) ── */}
      <PageHeader
        eyebrow="CONVERSATIONAL SANCTUARY"
        title="Aria Voice Sanctuary"
        subtitle="Hands-free ritual logging, mindful task capture, and daily reflections with a 10-second undo guarantee."
        centered
      />

      {/* ── Central Living Orb & Smooth Radial Glow ── */}
      <div className="relative my-8 sm:my-10 w-72 h-72 flex items-center justify-center">
        {/*
          Smooth Radial Gradient Aura:
          Fades fully to transparent from center outward (0% to 70%), eliminating any hard clipping edges
        */}
        <motion.div
          animate={
            orbState === 'listening'
              ? { scale: [1, 1.25, 1], opacity: [0.5, 0.85, 0.5] }
              : orbState === 'speaking'
              ? { scale: [1, 1.15, 1], opacity: [0.35, 0.65, 0.35] }
              : orbState === 'processing'
              ? { rotate: 360, opacity: 0.6 }
              : { scale: [1, 1.05, 1], opacity: [0.2, 0.4, 0.2] }
          }
          transition={
            orbState === 'processing'
              ? { repeat: Infinity, duration: 2, ease: 'linear' }
              : { repeat: Infinity, duration: orbState === 'listening' ? 1.6 : 4, ease: 'easeInOut' }
          }
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background:
              orbState === 'permission-denied'
                ? 'radial-gradient(circle at center, rgba(186, 26, 26, 0.35) 0%, rgba(186, 26, 26, 0.15) 45%, transparent 70%)'
                : 'radial-gradient(circle at center, rgba(15, 110, 86, 0.38) 0%, rgba(160, 243, 212, 0.2) 45%, transparent 70%)'
          }}
        />

        {/* Outer Ripple Rings when Listening */}
        {orbState === 'listening' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-52 h-52 rounded-full border border-[#0F6E56]/40 animate-ping opacity-60" />
            <div className="w-60 h-60 rounded-full border border-[#0F6E56]/20 animate-pulse" />
          </div>
        )}

        {/* Center Interactive Microphone Button */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={handleToggleMic}
          className={`relative z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center cursor-pointer border-0 shadow-2xl transition-all duration-300 ${
            orbState === 'listening'
              ? 'bg-[#0F6E56] text-white scale-105 shadow-[0_0_36px_rgba(15,110,86,0.5)]'
              : orbState === 'speaking'
              ? 'bg-[#0F6E56] text-white shadow-xl'
              : orbState === 'processing'
              ? 'bg-surface-container-low text-[#0F6E56] hairline'
              : orbState === 'permission-denied'
              ? 'bg-error text-white'
              : 'bg-surface-container-lowest text-[#0F6E56] hairline hover:bg-surface-container-low shadow-lg'
          }`}
          aria-label={orbState === 'listening' ? 'Stop listening' : 'Start listening to Aria'}
        >
          {orbState === 'listening' ? (
            <>
              <Mic className="w-9 h-9 animate-bounce" />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-[#A0F3D4]">Listening</span>
            </>
          ) : orbState === 'speaking' ? (
            <>
              <Volume2 className="w-9 h-9 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-[#A0F3D4]">Speaking</span>
            </>
          ) : orbState === 'processing' ? (
            <>
              <div className="w-8 h-8 rounded-full border-2 border-[#0F6E56] border-t-transparent animate-spin mb-1" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Reflecting</span>
            </>
          ) : orbState === 'success' ? (
            <>
              <CheckCircle2 className="w-9 h-9 text-[#0F6E56]" />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-[#0F6E56]">Noted</span>
            </>
          ) : orbState === 'permission-denied' ? (
            <>
              <MicOff className="w-9 h-9 text-white" />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-white">Denied</span>
            </>
          ) : (
            <>
              <Mic className="w-9 h-9 text-[#0F6E56]" />
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1 text-outline">Tap to Speak</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Permission Denied Friendly Banner */}
      {orbState === 'permission-denied' && (
        <div className="w-full max-w-md p-4 rounded-2xl bg-error-container/40 border border-error/30 text-left mb-6 text-xs text-on-error-container space-y-1">
          <div className="flex items-center gap-2 font-bold text-error">
            <AlertCircle className="w-4 h-4" />
            <span>Microphone access blocked</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Please tap the lock or camera icon in your browser address bar and toggle microphone to "Allow" to speak with Aria. You can also use the text input below anytime.
          </p>
        </div>
      )}

      {/* Audio Reactive Continuous Waveform */}
      <div className="w-full max-w-md h-16 rounded-2xl bg-surface-container-lowest hairline overflow-hidden mb-6 flex items-center justify-center shadow-2xs">
        <canvas ref={canvasRef} width="448" height="64" className="w-full h-full" />
      </div>

      {/* ── Suggested Prompt Chips ── */}
      <div className="w-full max-w-md mb-6">
        <span className="text-[10px] uppercase font-bold tracking-wider text-outline block mb-2">
          Suggested Intentions
        </span>
        <div className="flex flex-wrap gap-2 justify-center">
          {suggestedPrompts.map(prompt => (
            <button
              key={prompt}
              type="button"
              onClick={() => handlePromptClick(prompt)}
              className="px-3 py-1.5 rounded-full bg-surface-container-lowest hover:bg-[#E8F5F1] hover:text-[#0F6E56] border border-[#E6E6E3] hover:border-[#0F6E56]/30 text-xs font-medium text-on-surface cursor-pointer transition-colors shadow-2xs"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* ── Conversation History ── */}
      <div className="w-full max-w-md p-4 rounded-3xl bg-surface-container-lowest hairline shadow-xs text-left mb-6 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-surface-container">
          <span className="text-[10px] uppercase font-bold tracking-wider text-outline flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#0F6E56]" />
            <span>Conversation Dialogue</span>
          </span>
          <span className="text-[10px] text-outline">10s undo safety net</span>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
          {history.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 rounded-2xl text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-surface-container ml-6 text-on-surface'
                  : 'bg-[#E8F5F1] mr-6 text-[#0A4839] border border-[#0F6E56]/15'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-[10px] text-outline mb-0.5">
                <span>{msg.role === 'user' ? 'You' : 'Aria'}</span>
                <span>{msg.time}</span>
              </div>
              <p>{msg.text}</p>
            </motion.div>
          ))}
          <div ref={historyBottomRef} />
        </div>
      </div>

      {/* ── Text Command Fallback ── */}
      <form onSubmit={handleTextSubmit} className="w-full max-w-md flex items-center gap-2">
        <input
          type="text"
          placeholder='e.g., "Log 2 glasses of water" or "What is my streak?"'
          value={textInput}
          onChange={e => setTextInput(e.target.value)}
          className="flex-1 px-4 py-3 rounded-full bg-surface-container-lowest hairline text-xs sm:text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary-container shadow-xs"
        />
        <button
          type="submit"
          className="w-11 h-11 rounded-full bg-primary-container text-white flex items-center justify-center hover:bg-primary-container-hover transition-colors cursor-pointer border-0 shrink-0 shadow-xs active:scale-95"
          aria-label="Send message to Aria"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </PageShell>
  );
}
