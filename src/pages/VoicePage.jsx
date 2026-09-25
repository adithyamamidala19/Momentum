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
  MessageSquare,
  Info
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

  // Check speech recognition capability
  const isSpeechSupported = typeof window !== 'undefined' && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const canvasRef = useRef(null);
  const recognitionRef = useRef(null);
  const orbStateRef = useRef('idle');
  const transcriptAccumulatorRef = useRef('');
  const animationFrameRef = useRef(null);
  const historyBottomRef = useRef(null);

  // Audio analyser references for live mic reactivity
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const audioStreamRef = useRef(null);
  const audioSourceRef = useRef(null);

  // Suggested prompt chips
  const suggestedPrompts = [
    'Log 2 glasses of water',
    'Add buy groceries to my to-dos',
    'What is my streak?',
    'Skip breathing ritual for today'
  ];

  // Keep orbStateRef in sync with state
  useEffect(() => {
    orbStateRef.current = orbState;
  }, [orbState]);

  // Clean up all audio and speech engines on component unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) {}
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      cleanupAudioStream();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Setup Web Audio Analyser for live visual feedback
  const setupAudioAnalyser = (stream) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume().catch(() => {});
      }

      const source = audioCtxRef.current.createMediaStreamSource(stream);
      const analyser = audioCtxRef.current.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      analyserRef.current = analyser;
      audioSourceRef.current = source;
    } catch (e) {
      console.warn('[Aria] Audio visualizer setup notice:', e);
    }
  };

  const cleanupAudioStream = () => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        try { track.stop(); } catch (e) {}
      });
      audioStreamRef.current = null;
    }
    if (audioSourceRef.current) {
      try { audioSourceRef.current.disconnect(); } catch (e) {}
      audioSourceRef.current = null;
    }
    analyserRef.current = null;
  };

  // Audio-reactive sine wave rendering in Brand Forest (#0F6E56) & Sage
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

      const currentState = orbStateRef.current;
      const isListening = currentState === 'listening';
      const isSpeaking = currentState === 'speaking';
      const isProcessing = currentState === 'processing';

      // Measure live mic volume if available during listening
      let micLevel = 0;
      if (isListening && analyserRef.current) {
        try {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          micLevel = (sum / dataArray.length) / 255; // 0.0 to 1.0
        } catch (e) {}
      }

      const baseAmp = isListening ? 14 + (micLevel * 32) : isSpeaking ? 18 : isProcessing ? 14 : 7;

      // Layer 1: Forest Green Sine Wave
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(15, 110, 86, 0.85)';
      ctx.lineWidth = 2.5;
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.025 + phase) * baseAmp;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Layer 2: Calm Sage Wave (offset and counter-flowing)
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(163, 198, 177, 0.7)';
      ctx.lineWidth = 2;
      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * 0.035 - phase * 1.3) * (baseAmp * 0.75);
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      phase += isListening ? 0.08 + (micLevel * 0.05) : 0.04;
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const machineRef = useRef(null);

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
        orbStateRef.current = 'speaking';

        if (window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(replyText);
          utterance.rate = 1.0;
          utterance.pitch = 1.05;

          // Pick a natural English voice if available
          const voices = window.speechSynthesis.getVoices();
          const preferredVoice = voices.find(v =>
            v.lang.startsWith('en') &&
            (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Female'))
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.onend = () => {
            if (expectResponse) {
              startListening();
            } else {
              setOrbState('success');
              orbStateRef.current = 'success';
              setTimeout(() => {
                setOrbState('idle');
                orbStateRef.current = 'idle';
              }, 2500);
            }
          };

          utterance.onerror = () => {
            setOrbState('idle');
            orbStateRef.current = 'idle';
          };

          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => {
            if (expectResponse) {
              startListening();
            } else {
              setOrbState('idle');
              orbStateRef.current = 'idle';
            }
          }, 2200);
        }
      },
      onUndoTrigger: (actionName) => {
        triggerUndoableAction(actionName, () => {});
      }
    });
  }, [triggerUndoableAction]);

  // Handle Command Processing (Voice or Text)
  const handleProcessCommand = async (text) => {
    if (!text || !text.trim()) {
      setOrbState('idle');
      orbStateRef.current = 'idle';
      return;
    }

    const trimmed = text.trim();
    setOrbState('processing');
    orbStateRef.current = 'processing';

    // Add user message to conversation history
    setHistory(prev => [
      ...prev,
      {
        role: 'user',
        text: trimmed,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      }
    ]);

    try {
      // 1. Process with client-side conversation state machine
      if (machineRef.current) {
        await machineRef.current.processUtterance(trimmed);
      }

      // 2. Persist message to backend /api/aria/message for isolated user storage
      try {
        await fetch('/api/aria/message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ text: trimmed })
        });
      } catch (apiErr) {
        console.log('[Aria] Backend sync notice:', apiErr);
      }

      // 3. Update local Momentum UI state
      syncState(prev => ({
        ...prev,
        todos: JSON.parse(JSON.stringify(userState.todos || [])),
        customHabits: JSON.parse(JSON.stringify(userState.customHabits || [])),
        waterGlasses: userState.waterGlasses,
        waterMl: (userState.waterGlasses || 6) * 250,
        movementLogs: JSON.parse(JSON.stringify(userState.movementLogs || []))
      }));
    } catch (err) {
      console.error('[Aria] Error processing voice utterance:', err);
      setAriaResponse("I encountered a gentle pause processing that. Please feel free to try again.");
      setOrbState('error');
      orbStateRef.current = 'error';
      setTimeout(() => {
        setOrbState('idle');
        orbStateRef.current = 'idle';
      }, 2500);
    }
  };

  // Start active speech listening
  const startListening = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (showToast) {
        showToast('Speech recognition is not supported in this browser. You can type any command below.');
      }
      return;
    }

    // Stop any existing recognition instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch (e) {}
      recognitionRef.current = null;
    }

    // 1. Acquire microphone stream for permission and visualizer
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioStreamRef.current = stream;
        setupAudioAnalyser(stream);
      }
    } catch (micErr) {
      console.warn('[Aria] Microphone permission blocked:', micErr);
      setOrbState('permission-denied');
      orbStateRef.current = 'permission-denied';
      return;
    }

    // 2. Initialize SpeechRecognition
    try {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;
      rec.lang = 'en-US';

      transcriptAccumulatorRef.current = '';
      setTranscript('');

      rec.onstart = () => {
        setOrbState('listening');
        orbStateRef.current = 'listening';
      };

      rec.onresult = (e) => {
        let interim = '';
        let final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const result = e.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        const current = final || interim;
        if (current) {
          transcriptAccumulatorRef.current = current;
          setTranscript(current);
        }
      };

      rec.onend = () => {
        cleanupAudioStream();
        const heard = transcriptAccumulatorRef.current.trim();
        if (heard && orbStateRef.current === 'listening') {
          handleProcessCommand(heard);
        } else if (orbStateRef.current === 'listening') {
          setOrbState('idle');
          orbStateRef.current = 'idle';
        }
      };

      rec.onerror = (e) => {
        console.warn('[Aria Speech Error]', e.error);
        cleanupAudioStream();
        if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
          setOrbState('permission-denied');
          orbStateRef.current = 'permission-denied';
        } else if (e.error === 'no-speech') {
          const heard = transcriptAccumulatorRef.current.trim();
          if (heard) {
            handleProcessCommand(heard);
          } else {
            setOrbState('idle');
            orbStateRef.current = 'idle';
            if (showToast) {
              showToast("Aria didn't catch that. Tap the mic and speak when you're ready.");
            }
          }
        } else if (e.error === 'aborted') {
          if (orbStateRef.current === 'listening') {
            setOrbState('idle');
            orbStateRef.current = 'idle';
          }
        } else {
          setOrbState('error');
          orbStateRef.current = 'error';
          setTimeout(() => {
            setOrbState('idle');
            orbStateRef.current = 'idle';
          }, 2500);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (startErr) {
      console.error('[Aria] Failed to start recognition:', startErr);
      cleanupAudioStream();
      setOrbState('idle');
      orbStateRef.current = 'idle';
    }
  };

  // Toggle Microphone Button
  const handleToggleMic = () => {
    if (orbState === 'listening') {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      cleanupAudioStream();
      const heard = transcriptAccumulatorRef.current.trim();
      if (heard) {
        handleProcessCommand(heard);
      } else {
        setOrbState('idle');
        orbStateRef.current = 'idle';
      }
    } else {
      startListening();
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

  // Auto-scroll chat history
  useEffect(() => {
    if (historyBottomRef.current) {
      historyBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history]);

  return (
    <PageShell centered>
      {/* ── Page Header with Brand Green Eyebrow ── */}
      <PageHeader
        eyebrow="CONVERSATIONAL SANCTUARY"
        title="Aria Voice Sanctuary"
        subtitle="Hands-free ritual logging, mindful task capture, and daily reflections with a 10-second undo guarantee."
        centered
      />

      {/* Browser Speech Compatibility Notice */}
      {!isSpeechSupported && (
        <div className="w-full max-w-md p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-start gap-2 mb-4">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            Microphone speech recognition is optimized for Chrome, Edge, and Safari. You can use the text command input below on any browser!
          </span>
        </div>
      )}

      {/* ── Central Living Orb & Smooth Radial Glow ── */}
      <div className="relative my-8 sm:my-10 w-72 h-72 flex flex-col items-center justify-center">
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

      {/* Live Speech Recognition Transcript Pill */}
      {orbState === 'listening' && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 px-4 py-2 rounded-full bg-surface-container-lowest hairline shadow-xs text-xs font-medium text-[#0F6E56] max-w-sm text-center flex items-center gap-2"
        >
          <span className="w-2 h-2 rounded-full bg-[#0F6E56] animate-ping" />
          <span className="truncate">
            {transcript ? `"${transcript}"` : 'Aria is listening... Speak freely'}
          </span>
        </motion.div>
      )}

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
