/**
 * Momentum — Aria Conversation State Machine
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-turn conversational controller supporting:
 * • AWAITING_SLOT (interactive slot filling)
 * • COLLECT_ITEMS (multi-item loop list for To-Dos)
 * • CLARIFYING (spoken clarifying questions on ambiguous commands)
 * • Graceful timeouts (8-10s silence prompt) & clean cancellation
 */

import {
  matchIntent,
  normalizeTranscript,
  parseDateTime,
  parseQuantity,
  parseEnum,
  parseBooleanYesNo,
  INTENT_DEFINITIONS
} from './intent-registry.js';
import { getTodayDateString, createTodoItem, addTodo } from '../state.js';

export const CONVERSATION_MODES = {
  IDLE: 'IDLE',
  AWAITING_SLOT: 'AWAITING_SLOT',
  COLLECT_ITEMS: 'COLLECT_ITEMS',
  CLARIFYING: 'CLARIFYING',
  SPEAKING: 'SPEAKING'
};

export class ConversationStateMachine {
  constructor(options = {}) {
    this.mode = CONVERSATION_MODES.IDLE;
    this.currentIntent = null;
    this.slots = {};
    this.currentSlotName = null;
    this.turnCount = 0;
    this.clarificationCandidate = null;
    this.clarificationFailures = 0;
    this.itemsCollected = [];
    this.targetDate = getTodayDateString();
    this.timeoutTimer = null;
    this.silenceWarningGiven = false;

    // Callbacks provided by VoiceAgentEngine
    this.onSpeak = options.onSpeak || ((text, onEnd) => { if (onEnd) onEnd(); });
    this.onPromptListen = options.onPromptListen || (() => {});
    this.onUndoTrigger = options.onUndoTrigger || (() => {});
  }

  /**
   * Resets machine back to IDLE state
   */
  reset() {
    this.clearTimeoutTimer();
    this.mode = CONVERSATION_MODES.IDLE;
    this.currentIntent = null;
    this.slots = {};
    this.currentSlotName = null;
    this.turnCount = 0;
    this.clarificationCandidate = null;
    this.clarificationFailures = 0;
    this.itemsCollected = [];
    this.silenceWarningGiven = false;
  }

  /**
   * Aborts active conversation with calm spoken confirmation
   */
  cancel(reason = "Cancelled. Let me know whenever you'd like to continue.") {
    this.reset();
    this.speak(reason, false);
  }

  /**
   * Main speech transcript entry point
   */
  async processUtterance(rawText) {
    this.clearTimeoutTimer();
    const cleanText = (rawText || '').trim();
    if (!cleanText) return;

    const norm = normalizeTranscript(cleanText);

    // 1. Check for universal cancellation command
    if (/^(cancel|never mind|nevermind|stop|abort|quit|dismiss)$/i.test(norm)) {
      this.cancel();
      return;
    }

    this.turnCount++;

    // 2. Dispatch based on current conversational mode
    switch (this.mode) {
      case CONVERSATION_MODES.COLLECT_ITEMS:
        await this._handleCollectItemsUtterance(cleanText);
        break;

      case CONVERSATION_MODES.AWAITING_SLOT:
        await this._handleAwaitingSlotUtterance(cleanText);
        break;

      case CONVERSATION_MODES.CLARIFYING:
        await this._handleClarifyingUtterance(cleanText);
        break;

      case CONVERSATION_MODES.IDLE:
      default:
        await this._handleIdleUtterance(cleanText);
        break;
    }
  }

  // ── Mode Handlers ─────────────────────────────────────────────────────────

  /**
   * IDLE: Match against intent registry
   */
  async _handleIdleUtterance(rawText) {
    const match = matchIntent(rawText);

    if (match.intentDef) {
      this.clarificationFailures = 0;
      this.currentIntent = match.intentDef;
      this.slots = match.initialSlots || {};

      // Check if required slots are missing
      const required = this.currentIntent.requiredSlots || [];
      const missing = required.filter(slot => this.slots[slot] === undefined || this.slots[slot] === null || this.slots[slot] === '');

      if (missing.length > 0) {
        // Enter slot filling mode
        this.currentSlotName = missing[0];
        this.mode = CONVERSATION_MODES.AWAITING_SLOT;
        const prompt = this.currentIntent.slotPrompts?.[this.currentSlotName] || `Please provide the ${this.currentSlotName}.`;
        this.speak(prompt, true);
        this.startTimeoutTimer();
      } else {
        // Execute immediately
        await this._executeCurrentIntent(rawText);
      }
    } else if (match.candidateGuess) {
      // Ambiguous match -> Ask clarifying question
      this.mode = CONVERSATION_MODES.CLARIFYING;
      this.clarificationCandidate = match.candidateGuess;
      const question = `I heard '${rawText}' — did you mean ${match.candidateGuess.description}, or something else?`;
      this.speak(question, true);
      this.startTimeoutTimer();
    } else {
      // Completely unrecognized
      this.clarificationFailures++;
      if (this.clarificationFailures >= 2) {
        this.reset();
        this.speak("Sorry, I didn't quite get that — you can also type it in the assistant chat or say 'help'.", false);
      } else {
        this.mode = CONVERSATION_MODES.CLARIFYING;
        this.clarificationCandidate = null;
        this.speak(`I heard '${rawText}' — did you mean start a focus session, or something else?`, true);
        this.startTimeoutTimer();
      }
    }
  }

  /**
   * COLLECT_ITEMS: Multi-item To-Do creation loop
   */
  async _handleCollectItemsUtterance(rawText) {
    const norm = normalizeTranscript(rawText);

    // Check loop termination signals ("that's it", "done", "no that's all", "finish")
    if (/^(that's it|thats it|done|finished|that's all|thats all|no that's all|no thats all|nothing else|close out the list|we're done|were done|no)$/i.test(norm)) {
      const count = this.itemsCollected.length;
      this.reset();
      if (count === 0) {
        this.speak("Closed out your to-do list without adding any tasks.", false);
      } else {
        this.speak(`Done — you have ${count} to-do${count > 1 ? 's' : ''} for today.`, false);
      }
      return;
    }

    // Clean item text (remove leading "yes", "and", "also", "add", "add a to-do to")
    let itemTitle = rawText
      .replace(/^(?:yes|yeah|sure|and|also|please|add (?:a )?(?:to-?do )?(?:to )?)[,\s]*/i, '')
      .trim();

    if (!itemTitle) {
      this.speak("What task would you like to add next, or should I close out the list?", true);
      this.startTimeoutTimer();
      return;
    }

    // Add item to todos
    const prevTodos = JSON.parse(JSON.stringify(window.userState?.todos || []));
    const item = createTodoItem({
      title: itemTitle,
      date: this.targetDate || getTodayDateString(),
      createdVia: 'voice'
    });
    addTodo(item);
    this.itemsCollected.push(item);

    this.triggerUndo(`Added to-do "${item.title}"`, { type: 'todos', prev: prevTodos });

    // Loop continuation prompt
    const prompt = this.itemsCollected.length === 1
      ? `Got it, '${item.title}' added for today. Anything else?`
      : `Added. Anything else, or should I close out the list?`;

    this.speak(prompt, true);
    this.startTimeoutTimer();
  }

  /**
   * AWAITING_SLOT: Parsing slot values from user utterance
   */
  async _handleAwaitingSlotUtterance(rawText) {
    if (!this.currentIntent || !this.currentSlotName) {
      this.reset();
      return;
    }

    const slotName = this.currentSlotName;
    const slotType = this.currentIntent.slotTypes?.[slotName] || 'text';
    const norm = normalizeTranscript(rawText);

    let parsedVal = null;

    if (slotType === 'boolean') {
      parsedVal = parseBooleanYesNo(rawText);
    } else if (slotType === 'time') {
      if (/untimed|no time|none/i.test(norm)) {
        parsedVal = 'untimed';
      } else {
        const dt = parseDateTime(rawText);
        parsedVal = dt.hasTime ? dt.time : (dt.hasDate ? dt.date : rawText);
      }
    } else if (slotType === 'date') {
      const dt = parseDateTime(rawText);
      parsedVal = dt.hasDate ? dt.date : getTodayDateString();
    } else if (slotType === 'quantity') {
      if (slotName === 'setsCount') parsedVal = parseQuantity(rawText, 'sets');
      else if (slotName === 'reps') parsedVal = parseQuantity(rawText, 'reps');
      else if (slotName === 'weightKg') parsedVal = parseQuantity(rawText, 'weight');
      else if (slotName === 'duration') parsedVal = parseQuantity(rawText, 'duration');
      else parsedVal = parseQuantity(rawText, 'water');
    } else if (slotType === 'enum') {
      parsedVal = parseEnum(rawText, slotName);
    } else {
      parsedVal = rawText.trim();
    }

    // Natural correction support ("actually make it 6am instead")
    const correctionMatch = rawText.match(/actually (?:make it )?(.+)/i);
    if (correctionMatch) {
      parsedVal = correctionMatch[1].trim();
    }

    // Save filled slot
    this.slots[slotName] = parsedVal;

    // Check if more required slots are missing
    const required = this.currentIntent.requiredSlots || [];
    const missing = required.filter(s => this.slots[s] === undefined || this.slots[s] === null || this.slots[s] === '');

    if (missing.length > 0) {
      this.currentSlotName = missing[0];
      const nextPrompt = this.currentIntent.slotPrompts?.[this.currentSlotName] || `What about the ${this.currentSlotName}?`;
      this.speak(nextPrompt, true);
      this.startTimeoutTimer();
    } else {
      // All required slots filled -> Execute!
      await this._executeCurrentIntent(rawText);
    }
  }

  /**
   * CLARIFYING: User answers clarification question
   */
  async _handleClarifyingUtterance(rawText) {
    const isAffirmative = parseBooleanYesNo(rawText);

    if (isAffirmative === true && this.clarificationCandidate?.intentDef) {
      // User confirmed candidate intent
      const def = this.clarificationCandidate.intentDef;
      this.reset();
      this.currentIntent = def;
      await this._executeCurrentIntent(rawText);
    } else if (isAffirmative === false) {
      this.clarificationFailures++;
      if (this.clarificationFailures >= 2) {
        this.reset();
        this.speak("Sorry, I didn't quite get that — you can also type it in the assistant chat or say 'help'.", false);
      } else {
        this.speak("Understood. What would you like to do instead?", true);
        this.mode = CONVERSATION_MODES.IDLE;
        this.startTimeoutTimer();
      }
    } else {
      // Re-evaluate user utterance in IDLE mode
      this.mode = CONVERSATION_MODES.IDLE;
      await this._handleIdleUtterance(rawText);
    }
  }

  // ── Execution & Helpers ───────────────────────────────────────────────────

  async _executeCurrentIntent(rawText) {
    if (!this.currentIntent) return;
    const def = this.currentIntent;

    try {
      const response = await def.execute(this.slots, this, rawText);
      if (response) {
        this.speak(response, false);
      }
    } catch (err) {
      console.warn('[Aria] Execution error:', err);
      this.speak("I encountered an issue executing that command. Please try again.", false);
    }

    // If still in AWAITING_SLOT or COLLECT_ITEMS (set by execute), keep state; otherwise reset
    if (this.mode !== CONVERSATION_MODES.AWAITING_SLOT && this.mode !== CONVERSATION_MODES.COLLECT_ITEMS) {
      this.reset();
    }
  }

  enterCollectItemsLoop(date = 'today', prompt = "Sure — what's the first thing you'd like to add?") {
    this.mode = CONVERSATION_MODES.COLLECT_ITEMS;
    this.targetDate = date === 'today' ? getTodayDateString() : date;
    this.itemsCollected = [];
    this.speak(prompt, true);
    this.startTimeoutTimer();
  }

  enterAwaitingSlot(slotName, prompt) {
    this.mode = CONVERSATION_MODES.AWAITING_SLOT;
    this.currentSlotName = slotName;
    this.speak(prompt, true);
    this.startTimeoutTimer();
  }

  speak(text, expectAnswer = false) {
    this.mode = expectAnswer ? this.mode : CONVERSATION_MODES.SPEAKING;
    this.onSpeak(text, () => {
      if (expectAnswer) {
        this.onPromptListen();
        this.startTimeoutTimer();
      } else {
        this.reset();
      }
    });
  }

  triggerUndo(message, snapshot) {
    this.onUndoTrigger(message, snapshot);
  }

  startTimeoutTimer() {
    this.clearTimeoutTimer();
    this.timeoutTimer = setTimeout(() => {
      if (this.mode !== CONVERSATION_MODES.IDLE) {
        if (!this.silenceWarningGiven) {
          this.silenceWarningGiven = true;
          this.speak("Still there? Say 'cancel' to stop.", true);
          this.startTimeoutTimer();
        } else {
          this.cancel("Session timed out. Settle in and return whenever you are ready.");
        }
      }
    }, 9000); // 9-second silence threshold
  }

  clearTimeoutTimer() {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
  }
}
