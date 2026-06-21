'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../context';
import { COMPANIONS } from '../constants';
import MascotCanvas from './MascotCanvas';
import {
  GREETINGS, ENCOURAGEMENTS, RANDOM_MSGS, TAB_MESSAGES,
  STREAK_MESSAGES, MILESTONE_MESSAGES, CHALLENGE_TAB_MESSAGES,
} from '../companion-messages';
import type { GameRound } from '../types';

const COMPANION_SIZE = 96;
const DRAG_KEY = 'phonics-companion-pos';
const HINT_THINK_DELAY = 800;

const STREAK_THRESHOLDS = [5, 10, 15, 20, 30];

function getHintForRound(companionId: string, round: GameRound | null, level: number): string {
  if (!round) return '';
  const cat = round.config.category;
  return COMPANIONS[companionId]?.hints?.[cat]?.[level] ?? '';
}

export default function CompanionBubble() {
  const { companion, round, tab, save, persistSave } = useGame();
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [companionAnim, setCompanionAnim] = useState<'idle' | 'think' | 'celebrate' | 'shake'>('idle');
  const dragRef = useRef<{ startX: number; startY: number; elX: number; elY: number } | null>(null);
  const clickSuppressed = useRef(false);
  const elRef = useRef<HTMLDivElement>(null);
  const cycleCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hintLevelRef = useRef(0);
  const prevQuestionKeyRef = useRef('');
  const prevStreakRef = useRef(0);
  const prevInteractionCountRef = useRef(0);
  const thinkingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAG_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          requestAnimationFrame(() => {
            setPos(parsed);
          });
        }
      }
    } catch { /* ignore */ }
  }, []);

  const showBubble = useCallback((msg: string, duration = 6500) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), duration);
  }, []);

  const trackInteraction = useCallback((hintLvl: number) => {
    if (!save || !persistSave) return;
    persistSave({
      ...save,
      companionInteractions: save.companionInteractions + 1,
      lastCompanionHintLevel: hintLvl,
      lastCompanionHintTime: Date.now(),
    });
  }, [save, persistSave]);

  const pickMessage = useCallback(() => {
    cycleCount.current = (cycleCount.current + 1) % 3;
    const tabMsgs = tab === 'challenges'
      ? (CHALLENGE_TAB_MESSAGES[companion] ?? [])
      : (TAB_MESSAGES[companion]?.[tab] ?? []);
    if (cycleCount.current === 0 && tabMsgs.length > 0 && Math.random() > 0.3) {
      showBubble(tabMsgs[Math.floor(Math.random() * tabMsgs.length)]);
    } else if (cycleCount.current === 1) {
      const hint = getHintForRound(companion, round, 1);
      if (hint) showBubble(hint);
      else { const msgs = ENCOURAGEMENTS[companion] ?? ENCOURAGEMENTS.nox; showBubble(msgs[Math.floor(Math.random() * msgs.length)]); }
    } else {
      const msgs = RANDOM_MSGS[companion] ?? RANDOM_MSGS.nox;
      showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }, [companion, round, tab, showBubble]);

  const showStreakMessage = useCallback((streak: number) => {
    const idx = STREAK_THRESHOLDS.indexOf(streak);
    if (idx === -1) return false;
    const msgs = STREAK_MESSAGES[companion] ?? STREAK_MESSAGES.nox;
    if (msgs[idx]) {
      showBubble(msgs[idx], 5000);
      return true;
    }
    return false;
  }, [companion, showBubble]);

  const showMilestoneMessage = useCallback((count: number) => {
    if (count === 10) {
      const msgs = MILESTONE_MESSAGES[companion] ?? MILESTONE_MESSAGES.nox;
      showBubble(msgs[0], 5000);
      return true;
    }
    if (count === 50) {
      const msgs = MILESTONE_MESSAGES[companion] ?? MILESTONE_MESSAGES.nox;
      showBubble(msgs[1], 5000);
      return true;
    }
    if (count >= 100 && prevInteractionCountRef.current < 100) {
      const msgs = MILESTONE_MESSAGES[companion] ?? MILESTONE_MESSAGES.nox;
      showBubble(msgs[2], 5000);
      return true;
    }
    return false;
  }, [companion, showBubble]);

  const showThinkingHint = useCallback((level: number) => {
    thinkingRef.current = true;
    setCompanionAnim('think');
    setMessage('...');
    setVisible(true);
    timeoutRef.current = setTimeout(() => {
      const hint = getHintForRound(companion, round, level);
      setMessage(hint || "I'm thinking... try clicking me again!");
      setCompanionAnim('idle');
      thinkingRef.current = false;
      timeoutRef.current = setTimeout(() => setVisible(false), 5000);
    }, HINT_THINK_DELAY);
  }, [companion, round]);

  const handleClick = useCallback(() => {
    if (clickSuppressed.current) return;

    const currentCount = (save?.companionInteractions ?? 0) + 1;
    prevInteractionCountRef.current = save?.companionInteractions ?? 0;

    if (round && round.currentIndex < round.questions.length) {
      const questionKey = `${round.currentIndex}`;
      if (questionKey !== prevQuestionKeyRef.current) {
        hintLevelRef.current = 0;
        prevQuestionKeyRef.current = questionKey;
      }
      hintLevelRef.current = ((hintLevelRef.current % 3) + 1) as 1 | 2 | 3;
      trackInteraction(hintLevelRef.current);
      if (currentCount <= 100) {
        showMilestoneMessage(currentCount);
      } else {
        showThinkingHint(hintLevelRef.current);
      }
    } else if (round && round.currentIndex >= round.questions.length) {
      trackInteraction(0);
      showBubble("Round complete! Great effort!");
    } else {
      trackInteraction(0);
      pickMessage();
    }
  }, [round, save, trackInteraction, showMilestoneMessage, showThinkingHint, pickMessage, showBubble]);

  useEffect(() => {
    if (save && save.currentStreak > prevStreakRef.current && STREAK_THRESHOLDS.includes(save.currentStreak)) {
      showStreakMessage(save.currentStreak);
    }
    if (save) {
      prevStreakRef.current = save.currentStreak;
    }
  }, [save?.currentStreak, showStreakMessage, save]);

  useEffect(() => {
    const greet = GREETINGS[companion] ?? GREETINGS.nox;
    const timer = setTimeout(() => showBubble(greet, 6000), 50);
    return () => { clearTimeout(timer); if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [companion, showBubble]);

  useEffect(() => {
    const timer = setInterval(() => { if (!visible && !thinkingRef.current) pickMessage(); }, 28000);
    return () => clearInterval(timer);
  }, [visible, pickMessage]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const el = elRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, elX: rect.left, elY: rect.top };
    clickSuppressed.current = false;
    setDragging(true);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) clickSuppressed.current = true;
    const newX = Math.max(0, Math.min(window.innerWidth - COMPANION_SIZE, dragRef.current.elX + dx));
    const newY = Math.max(0, Math.min(window.innerHeight - COMPANION_SIZE, dragRef.current.elY + dy));
    setPos({ x: newX, y: newY });
  }, []);

  const onPointerUp = useCallback(() => {
    if (dragRef.current && pos) {
      try { localStorage.setItem(DRAG_KEY, JSON.stringify(pos)); } catch { /* ignore */ }
    }
    setDragging(false);
    dragRef.current = null;
  }, [pos]);

  return (
    <div
      ref={elRef}
      className={`fixed z-40 select-none touch-none ${
        dragging ? 'z-[60]' : ''
      }`}
      style={
        pos
          ? { left: pos.x, top: pos.y }
          : { bottom: 24, right: 24 }
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
    >
      {visible && message && (
        <div className="absolute bottom-full right-0 mb-3 w-[230px] glass-heavy rounded-2xl p-4 border border-white/60 dark:border-slate-800 shadow-xl text-xs font-bold leading-relaxed text-slate-800 dark:text-slate-100 animate-slide-up-drawer pointer-events-none" style={{ fontFamily: "var(--font-mali)" }}>
          <div className="absolute bottom-[-5px] right-14 w-2.5 h-2.5 rotate-45 bg-white/95 dark:bg-slate-900 border-r border-b border-white/60 dark:border-slate-800" />
          <p>{message === '...' && thinkingRef.current ? (
            <span className="inline-flex gap-1">
              <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
              <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
            </span>
          ) : message}</p>
        </div>
      )}
      <button
        type="button"
        onClick={handleClick}
        className={`w-28 h-28 rounded-full glass-heavy border-2 border-white/60 dark:border-slate-700/50 shadow-lg hover:bg-white/95 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center relative overflow-hidden group cursor-grab active:cursor-grabbing ${
          dragging
            ? 'pointer-events-none opacity-80 scale-105 shadow-2xl'
            : 'hover:scale-[1.06] cursor-pointer'
        }`}
        aria-label="Companion"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/10 to-teal-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        <MascotCanvas
          companionId={companion}
          variant="full"
          size={COMPANION_SIZE}
          animationState={companionAnim}
          className="relative z-10 pointer-events-none"
        />
      </button>
    </div>
  );
}
