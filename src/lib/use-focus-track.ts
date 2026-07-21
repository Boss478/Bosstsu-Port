'use client';

import { useEffect, useRef } from 'react';

interface FocusEntry {
  timestamp: number;
  type: 'visible' | 'hidden';
}

export function useFocusTrack(sessionId: string, active: boolean) {
  const entriesRef = useRef<FocusEntry[]>([]);
  const visibleRef = useRef(typeof document !== 'undefined' && !document.hidden);

  useEffect(() => {
    if (!active) return;

    const handleVisibility = () => {
      const entry: FocusEntry = {
        timestamp: Date.now(),
        type: document.hidden ? 'hidden' : 'visible',
      };
      entriesRef.current.push(entry);
      visibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (entriesRef.current.length > 0) {
        navigator.sendBeacon(
          '/api/tools/focus',
          JSON.stringify({
            sessionId,
            entries: entriesRef.current,
            totalMs: Date.now() - (entriesRef.current[0]?.timestamp ?? Date.now()),
          }),
        );
      }
    };
  }, [sessionId, active]);
}
