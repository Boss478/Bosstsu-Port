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
  onSettingsClick?: () => void;
}

type AnimState = 'idle' | 'thinking' | 'celebrate' | 'correct' | 'wrong';

export default function MascotCompanion({ sessionId, isWaiting, eventType, eventCount, onSettingsClick }: MascotCompanionProps) {
  const [mascotId] = useState<string>(() => {
    const key = getMascotStorageKey(sessionId);
    let id = localStorage.getItem(key);
    if (!id || !ALL_MASCOT_MAP.has(id)) {
      id = getRandomMascot().id;
      localStorage.setItem(key, id);
    }
    return id;
  });
  const [animState, setAnimState] = useState<AnimState>('idle');
  const [activeTimer, setActiveTimer] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastCountRef = useRef<number>(-1);

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

  const mascotData = ALL_MASCOT_MAP.get(mascotId);
  const accentColor = mascotData?.accentColor ?? '#6366f1';

  const glowClass = () => {
    switch (currentAnimState) {
      case 'correct': return `ring-2 shadow-lg`;
      case 'wrong': return `ring-2 shadow-lg`;
      default: return '';
    }
  };

  return (
    <div
      onClick={onSettingsClick}
      onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && onSettingsClick) { e.preventDefault(); onSettingsClick(); } }}
      role="button"
      tabIndex={0}
      className={`
        fixed bottom-4 right-4 z-50
        rounded-2xl p-2
        bg-white/60 dark:bg-slate-800/60
        backdrop-blur-sm border border-white/60 dark:border-slate-700/50
        shadow-lg
        transition-shadow duration-300
        ${onSettingsClick ? 'cursor-pointer hover:bg-white/80 dark:hover:bg-slate-700/60' : ''}
        ${animClass()}
        ${glowClass()}
      `}
      style={{
        ...(currentAnimState === 'correct' ? { boxShadow: `0 0 20px ${accentColor}40`, borderColor: accentColor } : {}),
        ...(currentAnimState === 'wrong' ? { boxShadow: `0 0 20px #ef444440`, borderColor: '#ef4444' } : {}),
      }}
    >
      <MascotAvatar mascotId={mascotId} size={96} variant="full" animate />
    </div>
  );
}
