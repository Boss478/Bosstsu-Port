'use client';

import { useEffect, useRef, useCallback } from 'react';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap(active: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const previousRef = useRef<Element | null>(null);

  const getFocusable = useCallback(() => {
    if (!ref.current) return [];
    return Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE));
  }, []);

  useEffect(() => {
    if (!active) return;

    previousRef.current = document.activeElement;

    const timer = requestAnimationFrame(() => {
      const focusable = getFocusable();
      if (focusable.length > 0) focusable[0].focus();
    });

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const focusable = getFocusable();
      if (focusable.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handler);
    return () => {
      cancelAnimationFrame(timer);
      document.removeEventListener('keydown', handler);
      if (previousRef.current instanceof HTMLElement) {
        previousRef.current.focus();
      }
    };
  }, [active, getFocusable]);

  return ref;
}
