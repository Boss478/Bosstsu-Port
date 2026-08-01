'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';

interface ScrollState {
  hasMore: boolean;
  atBottom: boolean;
}

export function useScrollHint<T extends HTMLElement>(
  scrollRef: RefObject<T | null>,
  contentDep?: unknown,
) {
  const [state, setState] = useState<ScrollState>({ hasMore: false, atBottom: true });

  const update = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const hasMore = el.scrollHeight > el.clientHeight + 4;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 24;
    setState((prev) =>
      prev.hasMore === hasMore && prev.atBottom === atBottom ? prev : { hasMore, atBottom },
    );
  }, [scrollRef]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const raf = requestAnimationFrame(update);
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    void contentDep;
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [scrollRef, update, contentDep]);

  const scrollDown = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ top: el.clientHeight * 0.8, behavior: 'smooth' });
  }, [scrollRef]);

  return { hasMore: state.hasMore, atBottom: state.atBottom, scrollDown };
}
