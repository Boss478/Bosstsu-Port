'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getStudentToken } from '@/lib/client-token';

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

export function useSSE(
  sessionId: string,
  options: UseSSEOptions = {},
): UseSSEResult {
  const [currentStep, setCurrentStep] = useState(-1);
  const [kicked, setKicked] = useState(false);
  const [connected, setConnected] = useState<ConnectionStatus>('disconnected');
  const [broadcastMessage, setBroadcastMessage] = useState<UseSSEResult['broadcastMessage']>(null);

  const esRef = useRef<EventSource | null>(null);
  const backoffIndexRef = useRef(0);
  const reconnectFailsRef = useRef(0);
  const pollSuccessCountRef = useRef(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tabTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tabHiddenRef = useRef(false);
  const mountedRef = useRef(true);
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const pollInterval = options.tierConfig?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL;

  const connectSSE = useCallback(() => {
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
            if (data.kicked) {
              setKicked(true);
              optionsRef.current.onKicked?.();
            }
            optionsRef.current.onStepChange?.(data.currentStep);
          }
        } catch { /* ignore malformed */ }
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
        } catch { /* ignore */ }
      });

      es.onopen = () => {
        if (!mountedRef.current) return;
        setConnected('connected');
        backoffIndexRef.current = 0;
        reconnectFailsRef.current = 0;
        pollSuccessCountRef.current = 0;
        clearPolling();
      };

      es.onerror = () => {
        es.close();
        esRef.current = null;

        if (!mountedRef.current) return;

        reconnectFailsRef.current++;

        if (reconnectFailsRef.current >= MAX_RECONNECT_FAILS) {
          setConnected('disconnected');
          startPolling();
          return;
        }

        setConnected('polling');

        const delay = BACKOFF_DELAYS[Math.min(backoffIndexRef.current, BACKOFF_DELAYS.length - 1)];
        backoffIndexRef.current++;

        setTimeout(() => {
          if (mountedRef.current) connectSSE();
        }, delay);
      };
    } catch {
      setConnected('disconnected');
      startPolling();
    }
  }, [sessionId]);

  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) return;

    const poll = async () => {
      if (!mountedRef.current) return;
      try {
        const studentToken = getStudentToken();
        const res = await fetch(
          `/api/tools/step?sessionId=${encodeURIComponent(sessionId)}&studentToken=${encodeURIComponent(studentToken)}`,
        );
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
          clearPolling();
          connectSSE();
        }
      } catch {
        pollSuccessCountRef.current = 0;
      }
    };

    pollIntervalRef.current = setInterval(poll, pollInterval);
    poll();
  }, [sessionId, pollInterval, connectSSE]);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

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
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [connectSSE, clearPolling]);

  return { currentStep, kicked, connected, broadcastMessage, clearBroadcast: () => setBroadcastMessage(null) };
}
