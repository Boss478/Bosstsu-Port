'use client';

import { useEffect, useState } from 'react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  /** T22 — the mobile lawlib dock sheet (`lawlib:dock-sheet`, dispatched by
   *  LawlibDock when `expanded && isMobile`) covers this button's corner —
   *  hide while it's open. Desktop / closed sheet → `open: false`. */
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    let rafId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setIsVisible(window.scrollY > 200);
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // T22 — listen for the dock sheet's open state (unmount cleanup: the
  // listener dies with the component — the dock's own cleanup re-dispatches
  // { open: false } when IT unmounts, so page leave restores the button).
  useEffect(() => {
    const onSheet = (e: Event) => {
      const open = (e as CustomEvent<{ open: boolean }>).detail?.open === true;
      setSheetOpen(open);
    };
    window.addEventListener('lawlib:dock-sheet', onSheet);
    return () => window.removeEventListener('lawlib:dock-sheet', onSheet);
  }, []);

  const scrollToPageTop = () => {
    const start = window.scrollY;
    if (start < 10) return;
    const startTime = performance.now();
    const duration = Math.min(start * 0.5, 800);

    function easeInOutCubic(t: number): number {
      return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    }

    const raf = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeInOutCubic(progress);
      window.scrollTo(0, start * (1 - eased));

      if (progress < 1) {
        requestAnimationFrame(raf);
      }
    };
    requestAnimationFrame(raf);
  };

  return (
    <button
      onClick={scrollToPageTop}
      tabIndex={isVisible && !sheetOpen ? 0 : -1}
      className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 p-3 rounded-full bg-white/50 dark:bg-slate-900/50 backdrop-blur-xs border border-white/60 text-blue-600 dark:text-blue-400 shadow-lg shadow-blue-100/40 dark:shadow-black/20 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-[transform,background-color,border-color] duration-300 ${
        isVisible && !sheetOpen
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'invisible opacity-0 translate-y-4 pointer-events-none'
      }`}
      aria-label="กลับขึ้นบน"
    >
      <i
        aria-hidden="true"
        className="fi fi-sr-arrow-small-up text-xl leading-none flex items-center justify-center"
      ></i>
    </button>
  );
}
