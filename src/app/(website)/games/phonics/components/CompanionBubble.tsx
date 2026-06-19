'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useGame } from '../context';
import { COMPANIONS } from '../constants';
import MascotCanvas from './MascotCanvas';
import { GREETINGS, ENCOURAGEMENTS, RANDOM_MSGS, TAB_MESSAGES } from '../companion-messages';

const COMPANION_SIZE = 96;
const DRAG_KEY = 'phonics-companion-pos';

export default function CompanionBubble() {
  const { companion, round, tab } = useGame();
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; elX: number; elY: number } | null>(null);
  const clickSuppressed = useRef(false);
  const elRef = useRef<HTMLDivElement>(null);
  const cycleCount = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const getHint = useCallback(() => {
    if (!round) return '';
    const cat = round.config.category;
    const level = round.results.length > 0 ? 3 : 1;
    return COMPANIONS[companion]?.hints?.[cat]?.[level] ?? '';
  }, [round, companion]);

  const showBubble = useCallback((msg: string, duration = 6500) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setMessage(msg);
    setVisible(true);
    timeoutRef.current = setTimeout(() => setVisible(false), duration);
  }, []);

  const pickMessage = useCallback(() => {
    cycleCount.current = (cycleCount.current + 1) % 3;
    const tabMsgs = TAB_MESSAGES[companion]?.[tab] ?? [];
    if (cycleCount.current === 0 && tabMsgs.length > 0 && Math.random() > 0.3) {
      showBubble(tabMsgs[Math.floor(Math.random() * tabMsgs.length)]);
    } else if (cycleCount.current === 1) {
      const hint = getHint();
      if (hint) showBubble(hint);
      else { const msgs = ENCOURAGEMENTS[companion] ?? ENCOURAGEMENTS.nox; showBubble(msgs[Math.floor(Math.random() * msgs.length)]); }
    } else {
      const msgs = RANDOM_MSGS[companion] ?? RANDOM_MSGS.nox;
      showBubble(msgs[Math.floor(Math.random() * msgs.length)]);
    }
  }, [companion, getHint, tab, showBubble]);

  useEffect(() => {
    const greet = GREETINGS[companion] ?? GREETINGS.nox;
    const timer = setTimeout(() => showBubble(greet, 6000), 50);
    return () => { clearTimeout(timer); if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [companion, showBubble]);

  useEffect(() => {
    const timer = setInterval(() => { if (!visible) pickMessage(); }, 28000);
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

  const handleClick = useCallback(() => {
    if (!clickSuppressed.current) pickMessage();
  }, [pickMessage]);

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
          <p>{message}</p>
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
          className="relative z-10 pointer-events-none"
        />
      </button>
    </div>
  );
}
