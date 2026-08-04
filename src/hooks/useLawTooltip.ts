'use client';

/**
 * KruLAW — tooltip state + trigger semantics (FR3/FR4/FR5, the signature
 * feature). ONE instance per reader (single portal — LawTooltip renders it).
 *
 * Trigger semantics (pointerType-gated — pin-test critical):
 *  - mouse:   pointerenter opens / pointerleave closes (moving into the
 *             tooltip portal or onto another trigger keeps it open)
 *  - touch:   tap opens (pointerup, movement <10px, no intervening scroll —
 *             pointercancel marks the browser taking over for scroll);
 *             closes on tap-elsewhere + scrollend
 *  - pen:     treated like touch (no hover-open)
 *  - keyboard: Enter/Space opens in KEYBOARD mode (tooltip takes focus, Tab
 *             cycles its actions). Keyboard mode is entered on keydown-Enter
 *             OR a click while document.activeElement === the trigger (AT /
 *             synthesized activation); it is cleared ONLY in closeTooltip
 *             (a later pointer-open keeps it — see onClick). Keyboard-opened
 *             tooltips close on Esc + pointerdown-elsewhere ONLY — NOT on
 *             scrollend/resize, so arrow-key page scrolling cannot kill them
 *             (L1-8 semantics).
 * Content is announced on OPEN (LawTooltip uses aria-live) — never on focus.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type TooltipContent =
  | { kind: 'glossary'; term: string; definition: string }
  | {
      kind: 'ref';
      /** absent → same-law ref; present → cross-law (law CODE verbatim) */
      lawSlug?: string;
      articleNo: number;
      articleSuffix?: string;
      display: string;
    };

export interface TooltipTriggerHandlers {
  onPointerEnter: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerDown: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerUp: (e: React.PointerEvent<HTMLElement>) => void;
  onPointerCancel: (e: React.PointerEvent<HTMLElement>) => void;
  onClick: (e: React.MouseEvent<HTMLElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => void;
}

interface TooltipState {
  content: TooltipContent;
  anchorRect: DOMRect;
  /** <640px viewport → bottom-sheet layout (LawTooltip). */
  sheet: boolean;
}

export function sameContent(a: TooltipContent, b: TooltipContent): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'glossary') return b.kind === 'glossary' && a.term === b.term;
  return (
    b.kind === 'ref' &&
    a.lawSlug === b.lawSlug &&
    a.articleNo === b.articleNo &&
    a.articleSuffix === b.articleSuffix
  );
}

const TOUCH_MOVE_LIMIT = 10;

/** Per-trigger touch bookkeeping — module map keyed by trigger element. */
interface TouchTapState {
  x: number;
  y: number;
  canceled: boolean;
}
const touchTapState = new WeakMap<Element, TouchTapState>();

/**
 * Pointer-interaction marker per trigger. A pointerdown on the trigger is
 * followed (eventually) by a click; mousedown ALSO focuses tabbable
 * triggers, so `document.activeElement === trigger` alone cannot tell a
 * mouse click from a keyboard-synthesized one — this flag disambiguates
 * (read+cleared in onClick; cleared on pointerleave/pointercancel so a
 * pointer sequence that never clicks cannot poison the next keydown).
 */
const pointerPressedOnTrigger = new WeakSet<Element>();

export function useLawTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipElRef = useRef<HTMLElement | null>(null);
  /** True when the open came from keyboard activation (Enter/Space/AT click).
   *  Set ONLY on keyboard-mode opens; cleared ONLY in closeTooltip (L1-8). */
  const [openedByKeyboard, setOpenedByKeyboard] = useState(false);
  const triggerElRef = useRef<HTMLElement | null>(null);

  const openTooltip = useCallback(
    (content: TooltipContent, anchor: HTMLElement, opts?: { keyboard?: boolean }) => {
      const sheet =
        typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
      triggerElRef.current = anchor;
      // Keyboard mode is sticky until closeTooltip — never cleared here.
      if (opts?.keyboard === true) setOpenedByKeyboard(true);
      setTooltip({ content, anchorRect: anchor.getBoundingClientRect(), sheet });
    },
    [],
  );

  const closeTooltip = useCallback(() => {
    setTooltip(null);
    if (openedByKeyboard) {
      // Keyboard-opened → the trigger lost focus to the tooltip; give it back
      // (Esc / close button / เปิดมาตรานี้). Mouse/touch opens never moved
      // focus, so nothing to restore.
      const trigger = triggerElRef.current;
      if (trigger !== null && trigger.isConnected) trigger.focus();
    }
    setOpenedByKeyboard(false);
    triggerElRef.current = null;
  }, [openedByKeyboard]);

  /** Value-based (glossary: term; ref: no+suffix+law) — handles fresh content objects. */
  const isOpen = useCallback(
    (content: TooltipContent) => tooltip !== null && sameContent(tooltip.content, content),
    [tooltip],
  );

  const getTriggerProps = useCallback(
    (content: TooltipContent): TooltipTriggerHandlers => ({
      onPointerEnter: (e) => {
        if (e.pointerType !== 'mouse') return;
        openTooltip(content, e.currentTarget);
      },
      onPointerLeave: (e) => {
        if (e.pointerType !== 'mouse') return;
        // Keep open while the pointer moves into the tooltip portal or onto
        // another trigger (the new trigger re-opens with its own content).
        const rt = e.relatedTarget as Node | null;
        if (
          rt &&
          (tooltipElRef.current?.contains(rt) ||
            (rt instanceof Element && rt.closest('[data-krulaw-trigger]') !== null))
        ) {
          return;
        }
        pointerPressedOnTrigger.delete(e.currentTarget);
        setTooltip((prev) => (prev !== null && sameContent(prev.content, content) ? null : prev));
      },
      onPointerDown: (e) => {
        pointerPressedOnTrigger.add(e.currentTarget);
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        touchTapState.set(e.currentTarget, { x: e.clientX, y: e.clientY, canceled: false });
      },
      onPointerCancel: (e) => {
        pointerPressedOnTrigger.delete(e.currentTarget);
        const st = touchTapState.get(e.currentTarget);
        if (st) st.canceled = true; // browser took over → scroll
      },
      onPointerUp: (e) => {
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        const st = touchTapState.get(e.currentTarget);
        if (!st || st.canceled) return;
        const dx = e.clientX - st.x;
        const dy = e.clientY - st.y;
        if (Math.hypot(dx, dy) >= TOUCH_MOVE_LIMIT) return;
        openTooltip(content, e.currentTarget);
      },
      onClick: (e) => {
        // Mouse click parity with hover. On touch this re-fires right after
        // the pointerup open — same content, same rect → harmless no-op.
        // Keyboard activation also fires click AFTER keydown (or standalone,
        // via assistive tech): mousedown focuses the trigger too, so
        // activeElement alone can't distinguish a pointer click from a
        // keyboard-synthesized one — pointerPressedOnTrigger disambiguates.
        // A keyboard-synthesized click RE-OPENS in keyboard mode (sticky
        // until closeTooltip — L1-8; pointer opens never enter it).
        const pointerClick = pointerPressedOnTrigger.has(e.currentTarget);
        pointerPressedOnTrigger.delete(e.currentTarget);
        const keyboardClick = !pointerClick && document.activeElement === e.currentTarget;
        if (keyboardClick) openTooltip(content, e.currentTarget, { keyboard: true });
        else openTooltip(content, e.currentTarget);
      },
      onKeyDown: (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openTooltip(content, e.currentTarget, { keyboard: true });
      },
    }),
    [openTooltip],
  );

  // Global close paths while a tooltip is open: tap-elsewhere, Esc,
  // scrollend (except inside the tooltip's own scroller), resize.
  // Keyboard-opened tooltips close on Esc + pointerdown-elsewhere ONLY —
  // NOT scrollend/resize (arrow-key page scroll must not kill them; L1-8).
  useEffect(() => {
    if (tooltip === null) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target === null) return;
      if (tooltipElRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-krulaw-trigger]') !== null) return;
      closeTooltip();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeTooltip();
    };
    const onScrollEnd = (e: Event) => {
      if (openedByKeyboard) return;
      const target = e.target as Node | null;
      if (target !== null && tooltipElRef.current?.contains(target)) return;
      closeTooltip();
    };
    const onResize = () => {
      if (!openedByKeyboard) closeTooltip();
    };
    document.addEventListener('pointerdown', onDocPointerDown, true);
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('scrollend', onScrollEnd);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('pointerdown', onDocPointerDown, true);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('scrollend', onScrollEnd);
      window.removeEventListener('resize', onResize);
    };
  }, [tooltip, closeTooltip, openedByKeyboard]);

  const registerTooltipEl = useCallback((el: HTMLElement | null) => {
    tooltipElRef.current = el;
  }, []);

  const handleTooltipPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return;
      const rt = e.relatedTarget as Node | null;
      if (rt instanceof Element && rt.closest('[data-krulaw-trigger]') !== null) return;
      closeTooltip();
    },
    [closeTooltip],
  );

  return {
    tooltip,
    openTooltip,
    closeTooltip,
    isTooltipOpen: isOpen,
    getTriggerProps,
    registerTooltipEl,
    handleTooltipPointerLeave,
    /** Keyboard-opened → LawTooltip takes focus on mount (Tab cycles its actions). */
    openedByKeyboard,
  };
}
