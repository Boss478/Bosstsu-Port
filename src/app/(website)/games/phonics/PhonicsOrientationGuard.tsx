'use client';

import { useEffect, useRef, useState } from 'react';

const PORTRAIT_QUERY = '(max-width: 1024px) and (orientation: portrait)';

export default function PhonicsOrientationGuard({ children }: { children: React.ReactNode }) {
  const [blocked, setBlocked] = useState(false);
  const promptRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const media = window.matchMedia(PORTRAIT_QUERY);
    const update = () => setBlocked(media.matches);

    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (blocked) {
      previousFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      requestAnimationFrame(() => promptRef.current?.focus());
      return;
    }

    if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus();
      previousFocusRef.current = null;
    }
  }, [blocked]);

  return (
    <div data-testid="phonics-guard-host" className="h-full min-h-0 w-full">
      <div
        aria-hidden={blocked || undefined}
        className="h-full min-h-0 w-full"
        inert={blocked || undefined}
      >
        {children}
      </div>
      {blocked && (
        <div
          ref={promptRef}
          data-testid="phonics-orientation-prompt"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phonics-orientation-title"
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex h-[100dvh] w-full items-center justify-center bg-[#A2D2FF] px-6 text-center dark:bg-[#0A1128]"
        >
          <div className="max-w-sm space-y-3">
            <div className="text-5xl" aria-hidden="true">
              ↻
            </div>
            <h1
              id="phonics-orientation-title"
              className="text-2xl font-black text-slate-800 dark:text-white"
            >
              Rotate your device
            </h1>
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Phonics Island is designed for landscape mode.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
