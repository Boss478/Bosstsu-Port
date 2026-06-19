'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ALL_MASCOT_MAP, getMascotStorageKey, getRandomMascot } from './mascot-data';
import MascotAvatar from './MascotAvatar';

export type MascotEvent = 'celebrate' | 'correct' | 'wrong';

interface MascotCompanionProps {
  sessionId: string;
  isWaiting?: boolean;
  eventType?: MascotEvent | null;
  eventCount?: number;
}

type AnimState = 'idle' | 'thinking' | 'celebrate' | 'correct' | 'wrong';

export default function MascotCompanion({ sessionId, isWaiting, eventType, eventCount }: MascotCompanionProps) {
  const [mascotId, setMascotId] = useState<string>('');
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [activeTimer, setActiveTimer] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCountRef = useRef<number>(-1);

  useEffect(() => {
    const key = getMascotStorageKey(sessionId);
    let id = localStorage.getItem(key);
    if (!id || !ALL_MASCOT_MAP.has(id)) {
      id = getRandomMascot().id;
      localStorage.setItem(key, id);
    }
    requestAnimationFrame(() => {
      setMascotId(id);
    });
  }, [sessionId]);

  const trigger = useCallback((event: MascotEvent) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setAnimState(event);
    setActiveTimer(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setActiveTimer(false);
    }, 1200);
  }, []);

  useEffect(() => {
    if (eventType && eventCount !== undefined && eventCount !== lastCountRef.current) {
      lastCountRef.current = eventCount;
      requestAnimationFrame(() => {
        trigger(eventType);
      });
    }
  }, [eventCount, eventType, trigger]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  const currentAnimState = activeTimer ? animState : (isWaiting ? 'thinking' : 'idle');

  if (!mascotId) return null;

  const animClass = () => {
    switch (currentAnimState) {
      case 'thinking': return 'animate-think';
      case 'celebrate': return 'animate-celebrate';
      case 'correct': return 'animate-celebrate';
      case 'wrong': return 'animate-shake';
      default: return 'animate-breathe';
    }
  };

  const glowClass = () => {
    switch (currentAnimState) {
      case 'correct': return 'ring-2 ring-green-400 shadow-lg shadow-green-400/30';
      case 'wrong': return 'ring-2 ring-red-400 shadow-lg shadow-red-400/30';
      default: return '';
    }
  };

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        rounded-2xl p-2
        bg-white/60 dark:bg-slate-800/60
        backdrop-blur-sm border border-white/60 dark:border-slate-700/50
        shadow-lg
        transition-shadow duration-300
        ${animClass()}
        ${glowClass()}
      `}
      role="img"
      aria-label={`Mascot: ${ALL_MASCOT_MAP.get(mascotId)?.name ?? mascotId}`}
    >
      <MascotAvatar mascotId={mascotId} size={96} />
    </div>
  );
}
