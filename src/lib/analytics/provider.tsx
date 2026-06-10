'use client';

import { createContext, useContext, useEffect, useRef, useCallback, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { hasConsent } from './consent';
import { analyticsQueue } from './queue';
import { getSessionId } from './session';

interface RUMData {
  lcp?: number;
  cls?: number;
  inp?: number;
}

interface AnalyticsContextValue {
  trackCustomEvent: (eventName: string, metadata?: Record<string, unknown>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextValue | null>(null);

function getDeviceType(): 'desktop' | 'tablet' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  const ua = navigator.userAgent;
  if (/mobile|android|iphone/i.test(ua) && !/ipad/i.test(ua)) return 'mobile';
  if (/tablet|ipad/i.test(ua)) return 'tablet';
  return 'desktop';
}

function observeRUM(onData: (data: RUMData) => void): () => void {
  const data: RUMData = {};
  const cleanups: (() => void)[] = [];

  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      data.lcp = last.startTime;
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
    cleanups.push(() => lcpObserver.disconnect());
  } catch {
    // LCP not supported
  }

  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as unknown as { hadRecentInput: boolean }).hadRecentInput) {
          clsValue += (entry as unknown as { value: number }).value;
        }
      }
      data.cls = clsValue;
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });
    cleanups.push(() => clsObserver.disconnect());
  } catch {
    // CLS not supported
  }

  try {
    const inpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      data.inp = last.duration;
    });
    inpObserver.observe({ type: 'first-input', buffered: true });
    cleanups.push(() => inpObserver.disconnect());
  } catch {
    // INP not supported
  }

  const timer = setTimeout(() => {
    onData(data);
  }, 5000);

  cleanups.push(() => clearTimeout(timer));

  return () => cleanups.forEach((fn) => fn());
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const rumSent = useRef(false);

  const trackCustomEvent: AnalyticsContextValue['trackCustomEvent'] = useCallback(
    (eventName: string, metadata?: Record<string, unknown>) => {
      if (!hasConsent()) return;
      analyticsQueue.push({
        type: 'custom',
        path: pathname,
        sessionId: getSessionId(),
        eventName,
        metadata,
        deviceType: getDeviceType(),
      });
    },
    [pathname],
  );

  useEffect(() => {
    if (!hasConsent()) return;
    const sessionId = getSessionId();
    const currentPath = pathname;
    if (prevPath.current === currentPath) return;
    prevPath.current = currentPath;

    analyticsQueue.push({
      type: 'pageview',
      path: currentPath,
      sessionId,
      deviceType: getDeviceType(),
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent.slice(0, 200),
    });
  }, [pathname]);

  useEffect(() => {
    if (!hasConsent() || rumSent.current) return;
    rumSent.current = true;

    const cleanup = observeRUM((data) => {
      if (!hasConsent()) return;
      if (data.lcp || data.cls || data.inp !== undefined) {
        analyticsQueue.push({
          type: 'custom',
          path: pathname,
          sessionId: getSessionId(),
          eventName: 'web_vitals',
          metadata: data as Record<string, unknown>,
          deviceType: getDeviceType(),
        });
      }
    });

    return cleanup;
  }, [pathname]);

  useEffect(() => {
    return () => analyticsQueue.destroy();
  }, []);

  return (
    <AnalyticsContext.Provider value={{ trackCustomEvent }}>{children}</AnalyticsContext.Provider>
  );
}

export function useAnalytics(): AnalyticsContextValue {
  const ctx = useContext(AnalyticsContext);
  if (!ctx) {
    return { trackCustomEvent: () => {} };
  }
  return ctx;
}
