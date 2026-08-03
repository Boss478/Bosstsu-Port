'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getStudentToken } from '@/lib/client-token';
import { toolKeys } from '@/lib/query/keys';

export type ConnectionStatus = 'connected' | 'polling' | 'disconnected';

interface UseSSEOptions {
  tierConfig?: {
    pollIntervalMs?: number;
  };
  onStepChange?: (currentStep: number) => void;
  onKicked?: () => void;
}

interface UseSSEResult {
  currentStep: number;
  kicked: boolean;
  connected: ConnectionStatus;
  broadcastMessage: {
    message: string;
    messageType: 'message' | 'timer' | 'sticky';
    duration?: number;
  } | null;
  clearBroadcast: () => void;
}

const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 15000, 20000];
const MAX_RECONNECT_FAILS = 3;
const POLL_SUCCESS_THRESHOLD = 3;
const TAB_HIDE_TIMEOUT_MS = 2 * 60 * 1000;
const DEFAULT_POLL_INTERVAL = 10000;
// SSE responses events are broadcast to every client on every vote; coalesce
// invalidations so a vote storm triggers at most one refetch per window per
// client (avoids the O(n²) refetch storm in 50-100 student classrooms).
const INVALIDATE_COALESCE_MS = 2000;

export function useSSE(sessionId: string, options: UseSSEOptions = {}): UseSSEResult {
  const [currentStep, setCurrentStep] = useState(-1);
  const [kicked, setKicked] = useState(false);
  const [connected, setConnected] = useState<ConnectionStatus>('disconnected');
  const [broadcastMessage, setBroadcastMessage] = useState<UseSSEResult['broadcastMessage']>(null);

  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);
  const backoffIndexRef = useRef(0);
  const backoffTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectFailsRef = useRef(0);
  const pollSuccessCountRef = useRef(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollIntervalMsRef = useRef(DEFAULT_POLL_INTERVAL);
  const tabTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabHiddenRef = useRef(false);
  const mountedRef = useRef(true);
  const optionsRef = useRef(options);
  const lastInvalidateRef = useRef(0);
  const connectSSERef = useRef<() => void>(() => {});
  const startPollingRef = useRef<() => void>(() => {});
  const clearPollingRef = useRef<() => void>(() => {});

  useEffect(() => {
    optionsRef.current = options;
    pollIntervalMsRef.current = options.tierConfig?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL;
  });

  const connectSSE = useCallback(() => {
    if (!mountedRef.current) return;

    if (backoffTimerRef.current) {
      clearTimeout(backoffTimerRef.current);
      backoffTimerRef.current = null;
    }

    if (esRef.current) {
      esRef.current.close();
    }

    const studentToken = getStudentToken();
    const url = `/api/tools/step/sse?sessionId=${encodeURIComponent(sessionId)}&studentToken=${encodeURIComponent(studentToken)}`;

    try {
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('step', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'step') {
            setCurrentStep(data.currentStep);
            if (
              data.kicked ||
              (Array.isArray(data.kickedTokens) && data.kickedTokens.includes(getStudentToken()))
            ) {
              setKicked(true);
              optionsRef.current.onKicked?.();
            }
            optionsRef.current.onStepChange?.(data.currentStep);
          }
        } catch {
          /* ignore malformed */
        }
      });

      es.addEventListener('broadcast', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'broadcast') {
            setBroadcastMessage({
              message: data.message,
              messageType: data.messageType,
              duration: data.duration,
            });
          }
        } catch {
          /* ignore */
        }
      });

      // Response-list changes (new votes, edits, deletes) → invalidate poll
      // queries so connected clients refetch once instead of polling every 10s.
      // Gated to at most one invalidate per INVALIDATE_COALESCE_MS per client;
      // once the vote storm settles, the next event after the window passes
      // refetches again (staleness stays bounded by the window).
      es.addEventListener('responses', (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          if (data.type === 'responses') {
            const now = Date.now();
            if (now - lastInvalidateRef.current >= INVALIDATE_COALESCE_MS) {
              lastInvalidateRef.current = now;
              queryClient.invalidateQueries({ queryKey: toolKeys.pollPrefix(sessionId) });
            }
          }
        } catch {
          /* ignore malformed */
        }
      });

      es.onopen = () => {
        if (!mountedRef.current) {
          es.close();
          if (esRef.current === es) esRef.current = null;
          return;
        }
        setConnected('connected');
        backoffIndexRef.current = 0;
        reconnectFailsRef.current = 0;
        pollSuccessCountRef.current = 0;
        clearPollingRef.current();
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;

        if (!mountedRef.current) return;

        reconnectFailsRef.current++;

        if (reconnectFailsRef.current >= MAX_RECONNECT_FAILS) {
          setConnected('disconnected');
          startPollingRef.current();
          return;
        }

        setConnected('polling');

        const delay = BACKOFF_DELAYS[Math.min(backoffIndexRef.current, BACKOFF_DELAYS.length - 1)];
        backoffIndexRef.current++;

        if (backoffTimerRef.current) {
          clearTimeout(backoffTimerRef.current);
        }
        backoffTimerRef.current = setTimeout(() => {
          backoffTimerRef.current = null;
          if (mountedRef.current) connectSSERef.current();
        }, delay);
      };
    } catch {
      setTimeout(() => {
        if (!mountedRef.current) return;
        setConnected('disconnected');
        startPollingRef.current();
      }, 0);
    }
  }, [sessionId, queryClient]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const studentToken = getStudentToken();
        const res = await fetch(`/api/tools/step?sessionId=${encodeURIComponent(sessionId)}`, {
          headers: { 'student-token': studentToken },
        });
        if (!res.ok) return;

        const data = await res.json();
        setCurrentStep(data.currentStep ?? -1);
        if (data.kicked) {
          setKicked(true);
          optionsRef.current.onKicked?.();
        }

        pollSuccessCountRef.current++;
        setConnected('polling');

        if (pollSuccessCountRef.current >= POLL_SUCCESS_THRESHOLD) {
          clearPollingRef.current();
          connectSSERef.current();
        }
      } catch {
        pollSuccessCountRef.current = 0;
      }
    };

    pollIntervalRef.current = setInterval(poll, pollIntervalMsRef.current);
    poll();
  }, [sessionId]);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    connectSSERef.current = connectSSE;
    startPollingRef.current = startPolling;
    clearPollingRef.current = clearPolling;
  });

  useEffect(() => {
    mountedRef.current = true;

    connectSSE();

    const handleVisibility = () => {
      if (document.hidden) {
        tabHiddenRef.current = true;
        tabTimerRef.current = setTimeout(() => {
          if (esRef.current) {
            esRef.current.close();
            esRef.current = null;
          }
        }, TAB_HIDE_TIMEOUT_MS);
      } else {
        tabHiddenRef.current = false;
        if (tabTimerRef.current) {
          clearTimeout(tabTimerRef.current);
          tabTimerRef.current = null;
        }
        if (!esRef.current && mountedRef.current) {
          connectSSE();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      mountedRef.current = false;
      if (esRef.current) esRef.current.close();
      clearPolling();
      if (tabTimerRef.current) clearTimeout(tabTimerRef.current);
      if (backoffTimerRef.current) {
        clearTimeout(backoffTimerRef.current);
        backoffTimerRef.current = null;
      }
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [connectSSE, clearPolling]);

  return {
    currentStep,
    kicked,
    connected,
    broadcastMessage,
    clearBroadcast: () => setBroadcastMessage(null),
  };
}
