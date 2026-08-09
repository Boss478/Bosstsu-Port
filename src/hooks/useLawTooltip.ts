'use client';

/**
 * LawLib — tooltip state + trigger semantics (FR3/FR4/FR5, the signature
 * feature). ONE instance per reader (single portal — LawTooltip renders it).
 *
 * Trigger semantics (pointerType-gated — pin-test critical):
 *  - mouse:   hover = PREVIEW with a union-zone guard (pointerleave defers
 *             the close 150ms; a pointermove inside trigger ∪ tooltip ∪
 *             12px corridor cancels it; the deferred close is content-gated
 *             so a trigger→trigger move can't kill the new tooltip). Click
 *             = PIN (separate `pinned` state — sticky until Esc /
 *             pointerdown-outside / X (closeTooltip) / toggle re-click /
 *             scrollend / resize; NO focus side effects). The old
 *             relatedTarget containment bridge is GONE (broken under React
 *             19 synthesized pointerleave — relatedTarget=window).
 *  - touch:   tap opens (pointerup, movement <10px, no intervening scroll —
 *             pointercancel marks the browser taking over for scroll);
 *             closes on tap-elsewhere + scrollend. Tap stays a plain open
 *             (its synthesized click must not toggle — click carries no
 *             pointerType, so the pointer branch keys off the type recorded
 *             at pointerdown).
 *  - pen:     treated like touch (no hover-open)
 *  - keyboard: Enter/Space opens in KEYBOARD mode (tooltip takes focus, Tab
 *             cycles its actions). Keyboard mode is entered on keydown-Enter
 *             OR a click while document.activeElement === the trigger (AT /
 *             synthesized activation); it is cleared ONLY in closeTooltip
 *             (a later pointer-open keeps it — see onClick). Keyboard-opened
 *             tooltips close on Esc + pointerdown-elsewhere ONLY — NOT on
 *             scrollend/resize, so arrow-key page scrolling cannot kill them
 *             (L1-8 semantics). Enter re-click re-opens — NO toggle.
 *  - drag guard: pointerup with ≥10px movement marks the tap state — the
 *             click then skips open ENTIRELY (mouse AND touch; touch's
 *             pointerup open is skipped by the same flag).
 *  - Esc-suppression window (real UX bug, W3-4): a tall tooltip (full-text
 *             fallback) that cannot fit beside its trigger clamps OVER the
 *             trigger, so a mouse parked on the trigger ends up under the
 *             tooltip. Esc closes it, but the browser then re-fires
 *             pointerenter on the trigger underneath → INSTANT reopen → Esc
 *             looks broken. Esc-initiated closes arm a 200ms pointerenter
 *             gate (suppressPointerEnterUntilRef); ONLY Esc arms it —
 *             outside-click / toggle / scrollend / resize closes never do.
 *             Keyboard/touch opens never go through pointerenter, so they
 *             are unaffected.
 * Content is announced on OPEN (LawTooltip uses aria-live) — never on focus.
 */

import { useCallback, useEffect, useId, useRef, useState } from 'react';

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

/** Drag/tap movement limit: ≥10px pointer travel between down and up = drag. */
const MOVE_LIMIT = 10;
/** Union-zone corridor width around trigger/tooltip rects (pointermove cancels). */
const CORRIDOR_PX = 12;
/** Pointerleave grace window before a hover-preview close fires. */
const GRACE_MS = 150;
/**
 * Post-Esc pointerenter suppression window (W3-4). Esc closes a tooltip whose
 * clamp pushed it OVER its trigger (tall full-text tooltips); the browser
 * then re-fires pointerenter on the trigger underneath → instant reopen.
 * Only ESC-initiated closes arm the suppression (outside-click/toggle/
 * scrollend/resize closes cannot loop this way and never set it).
 */
const ESC_SUPPRESS_MS = 200;

/**
 * Per-trigger pointer bookkeeping — module map keyed by trigger element
 * (mouse shares the drag guard with touch: pointerdown records the origin,
 * pointerup computes `moved`, the click reads it to skip the open).
 */
interface PointerTapState {
  x: number;
  y: number;
  canceled: boolean;
  pointerType: string;
  moved?: boolean;
}
const pointerTapState = new WeakMap<Element, PointerTapState>();

/**
 * Pointer-interaction marker per trigger. A pointerdown on the trigger is
 * followed (eventually) by a click; mousedown ALSO focuses tabbable
 * triggers, so `document.activeElement === trigger` alone cannot tell a
 * mouse click from a keyboard-synthesized one — this flag disambiguates
 * (read+cleared in onClick; cleared on pointerleave/pointercancel so a
 * pointer sequence that never clicks cannot poison the next keydown).
 */
const pointerPressedOnTrigger = new WeakSet<Element>();

/**
 * True when the rect carries NO real geometry (jsdom's getBoundingClientRect
 * returns zeros everywhere). The union-zone guard has nothing to protect →
 * the pre-T1 instant close applies. NaN rects are NOT empty here (NaN === 0
 * is false): they still run the grace timer — the pointermove checks simply
 * fail, so the grace expires and closes.
 */
function rectIsEmpty(r: DOMRect | null | undefined): boolean {
  return r === null || r === undefined || (r.width === 0 && r.height === 0);
}

/** (x, y) inside the rect expanded by the 12px corridor — NaN coords → false. */
function pointInCorridor(x: number, y: number, r: DOMRect): boolean {
  if (r.width === 0 && r.height === 0) return false;
  return (
    x >= r.left - CORRIDOR_PX &&
    x <= r.right + CORRIDOR_PX &&
    y >= r.top - CORRIDOR_PX &&
    y <= r.bottom + CORRIDOR_PX
  );
}

export function useLawTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tooltipElRef = useRef<HTMLElement | null>(null);
  /** True when the open came from keyboard activation (Enter/Space/AT click).
   *  Set ONLY on keyboard-mode opens; cleared ONLY in closeTooltip (L1-8). */
  const [openedByKeyboard, setOpenedByKeyboard] = useState(false);
  /**
   * True when the open came from a mouse POINTER-CLICK (pin). Separate from
   * openedByKeyboard on purpose: pinned tooltips DO close on scrollend/resize
   * (anchor rect captured at open — wheel-scroll would float them detached)
   * and never trigger focus side effects. Cleared in closeTooltip and on any
   * non-pin open (a new open replaces the pinned one).
   */
  const [pinned, setPinned] = useState(false);
  const triggerElRef = useRef<HTMLElement | null>(null);
  /**
   * Stable tooltip root id (a11y wiring — plan commit 3): one id per hook
   * instance, unchanged across open/close cycles. LawTooltip renders it on
   * the portal root; triggers reference it via aria-describedby while open.
   */
  const tooltipId = useId();
  /** Current open content (ref mirror) — read by the deferred close's
   *  fire-time content gate (a timer callback can't see fresh state). */
  const openContentRef = useRef<TooltipContent | null>(null);
  /** Pending pointerleave grace timer (union-zone guard). */
  const graceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * Wall-clock deadline (Date.now()) until which mouse pointerenter is
   * ignored. Armed ONLY by an Esc-initiated close (see the global-close
   * effect); 0 = no suppression. Read-only gate — no other close path sets
   * it, and opens never clear it (it just expires).
   */
  const suppressPointerEnterUntilRef = useRef(0);

  const cancelGrace = useCallback(() => {
    if (graceTimerRef.current !== null) {
      clearTimeout(graceTimerRef.current);
      graceTimerRef.current = null;
    }
  }, []);

  const openTooltip = useCallback(
    (
      content: TooltipContent,
      anchor: HTMLElement,
      opts?: { keyboard?: boolean; pin?: boolean },
    ) => {
      const sheet =
        typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches;
      triggerElRef.current = anchor;
      openContentRef.current = content;
      // A new open supersedes any pending deferred close (trigger→trigger).
      cancelGrace();
      // Keyboard mode is sticky until closeTooltip — never cleared here.
      if (opts?.keyboard === true) setOpenedByKeyboard(true);
      // Only mouse pointer-clicks pin; hover/touch/keyboard opens never do.
      setPinned(opts?.pin === true);
      setTooltip({ content, anchorRect: anchor.getBoundingClientRect(), sheet });
    },
    [cancelGrace],
  );

  const closeTooltip = useCallback(() => {
    setTooltip(null);
    setPinned(false);
    cancelGrace();
    if (openedByKeyboard) {
      // Keyboard-opened → the trigger lost focus to the tooltip; give it back
      // (Esc / close button / เปิดมาตรานี้). Mouse/touch opens never moved
      // focus, so nothing to restore.
      const trigger = triggerElRef.current;
      if (trigger !== null && trigger.isConnected) trigger.focus();
    }
    setOpenedByKeyboard(false);
    triggerElRef.current = null;
    openContentRef.current = null;
  }, [openedByKeyboard, cancelGrace]);

  /**
   * Union-zone deferred close: 150ms grace, cancelled by an in-zone
   * pointermove, and content-gated at fire time (A's deferred close must not
   * kill B's fresh tooltip on a trigger→trigger transition).
   */
  const scheduleGraceClose = useCallback(
    (content: TooltipContent) => {
      cancelGrace();
      graceTimerRef.current = setTimeout(() => {
        graceTimerRef.current = null;
        const open = openContentRef.current;
        if (open !== null && sameContent(open, content)) closeTooltip();
      }, GRACE_MS);
    },
    [cancelGrace, closeTooltip],
  );

  /** Value-based (glossary: term; ref: no+suffix+law) — handles fresh content objects. */
  const isOpen = useCallback(
    (content: TooltipContent) => tooltip !== null && sameContent(tooltip.content, content),
    [tooltip],
  );

  const getTriggerProps = useCallback(
    (content: TooltipContent): TooltipTriggerHandlers => ({
      onPointerEnter: (e) => {
        if (e.pointerType !== 'mouse') return;
        // W3-4 Esc-suppression window: Esc closed a tooltip whose clamp had
        // pushed it OVER this trigger — the browser re-fires pointerenter on
        // the trigger underneath, and without this gate the reopen is
        // instant (Esc looks broken for mouse users on tall tooltips). The
        // 200ms window also covers a scroll passing a NEW trigger under the
        // parked cursor. Keyboard/touch opens never come through
        // pointerenter, so they are unaffected; a deliberate re-hover after
        // the window (or a click — the pin path) opens normally.
        if (Date.now() < suppressPointerEnterUntilRef.current) return;
        openTooltip(content, e.currentTarget);
      },
      onPointerLeave: (e) => {
        if (e.pointerType !== 'mouse') return;
        pointerPressedOnTrigger.delete(e.currentTarget);
        // Pinned → sticky (close paths: Esc / outside / X / toggle / scrollend /
        // resize). No grace timer — the pin must survive the exit indefinitely.
        if (pinned) return;
        // Guarded close, NOT a bare setTooltip(null): the close must clear
        // openedByKeyboard (closeTooltip's only job besides closing) — a bare
        // setTooltip would leave the stale keyboard flag set, and the NEXT
        // mouse-opened tooltip would inherit sticky keyboard semantics (never
        // closed by onScrollEnd/onResize → floats detached on scroll). The
        // sameContent guard: only close when THIS trigger's content is the one
        // open (a trigger→trigger move fires pointerleave before the new
        // trigger's pointerenter re-opens with its own content).
        if (tooltip === null || !sameContent(tooltip.content, content)) return;
        // jsdom zero-rects (no real geometry) → nothing to protect → keep the
        // pre-T1 instant close (regression pins assert synchronous close).
        if (
          rectIsEmpty(e.currentTarget.getBoundingClientRect()) &&
          rectIsEmpty(tooltipElRef.current?.getBoundingClientRect())
        ) {
          closeTooltip();
          return;
        }
        scheduleGraceClose(content);
      },
      onPointerDown: (e) => {
        pointerPressedOnTrigger.add(e.currentTarget);
        // Movement bookkeeping for ALL pointer types — mouse shares the
        // ≥10px drag guard with touch (pointerup computes `moved`; the click
        // reads it to skip the open entirely).
        pointerTapState.set(e.currentTarget, {
          x: e.clientX,
          y: e.clientY,
          canceled: false,
          pointerType: e.pointerType,
        });
      },
      onPointerCancel: (e) => {
        pointerPressedOnTrigger.delete(e.currentTarget);
        const st = pointerTapState.get(e.currentTarget);
        if (st) st.canceled = true; // browser took over → scroll
      },
      onPointerUp: (e) => {
        const st = pointerTapState.get(e.currentTarget);
        if (st) {
          st.moved = Math.hypot(e.clientX - st.x, e.clientY - st.y) >= MOVE_LIMIT;
          if (st.canceled) return;
        }
        if (e.pointerType !== 'touch' && e.pointerType !== 'pen') return;
        if (!st || st.moved) return;
        openTooltip(content, e.currentTarget);
      },
      onClick: (e) => {
        // Mouse click parity with hover: click = PIN (pointer branch only —
        // keyboard Enter re-click re-opens, NO toggle). Touch: the pointerup
        // open re-fires here as a plain open — same content, same rect →
        // harmless no-op, and it must NOT toggle (tap = open, never close).
        // Keyboard activation also fires click AFTER keydown (or standalone,
        // via assistive tech): mousedown focuses the trigger too, so
        // activeElement alone can't distinguish a pointer click from a
        // keyboard-synthesized one — pointerPressedOnTrigger disambiguates.
        const pointerClick = pointerPressedOnTrigger.has(e.currentTarget);
        pointerPressedOnTrigger.delete(e.currentTarget);
        if (pointerClick) {
          const st = pointerTapState.get(e.currentTarget);
          // Drag guard: ≥10px movement between down and up → skip open ENTIRELY
          // (mouse AND touch — the click still fires after a drag).
          if (st?.moved) return;
          // Toggle re-click: only the MOUSE pointer branch (click carries no
          // pointerType — the type recorded at pointerdown disambiguates).
          if (st?.pointerType === 'mouse') {
            if (pinned && tooltip !== null && sameContent(tooltip.content, content)) {
              closeTooltip();
              return;
            }
            openTooltip(content, e.currentTarget, { pin: true });
            return;
          }
          openTooltip(content, e.currentTarget);
          return;
        }
        const keyboardClick = document.activeElement === e.currentTarget;
        if (keyboardClick) openTooltip(content, e.currentTarget, { keyboard: true });
        else openTooltip(content, e.currentTarget);
      },
      onKeyDown: (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        openTooltip(content, e.currentTarget, { keyboard: true });
      },
    }),
    [openTooltip, closeTooltip, tooltip, pinned, scheduleGraceClose],
  );

  // Union-zone guard listener: while a grace timer is pending, a mouse
  // pointermove inside (trigger rect ∪ tooltip rect ∪ 12px corridor) cancels
  // the deferred close. Always attached — a no-op when no timer is pending.
  useEffect(() => {
    const onDocPointerMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (graceTimerRef.current === null) return;
      const trigger = triggerElRef.current;
      const tooltipEl = tooltipElRef.current;
      const x = e.clientX;
      const y = e.clientY;
      if (
        (trigger !== null && pointInCorridor(x, y, trigger.getBoundingClientRect())) ||
        (tooltipEl !== null && pointInCorridor(x, y, tooltipEl.getBoundingClientRect()))
      ) {
        cancelGrace();
      }
    };
    document.addEventListener('pointermove', onDocPointerMove, true);
    return () => {
      document.removeEventListener('pointermove', onDocPointerMove, true);
      cancelGrace();
    };
  }, [cancelGrace]);

  // Global close paths while a tooltip is open: tap-elsewhere, Esc,
  // scrollend (except inside the tooltip's own scroller), resize.
  // Keyboard-opened tooltips close on Esc + pointerdown-elsewhere ONLY —
  // NOT scrollend/resize (arrow-key page scroll must not kill them; L1-8).
  // Pinned tooltips DO close on scrollend/resize (anchor rect captured at
  // open — a wheel-scroll would leave the tooltip floating detached).
  useEffect(() => {
    if (tooltip === null) return;
    const onDocPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target === null) return;
      if (tooltipElRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest('[data-lawlib-trigger]') !== null) return;
      closeTooltip();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // W3-4: arm the pointerenter suppression BEFORE closing — a mouse
        // parked on the trigger (the tooltip's clamp pushed it OVER the
        // trigger) would otherwise get a re-fired pointerenter the instant
        // the tooltip unmounts and reopen the tooltip. ONLY this path arms
        // it: outside-click/toggle/scrollend/resize closes are not followed
        // by a synthetic pointerenter and must reopen on hover immediately.
        suppressPointerEnterUntilRef.current = Date.now() + ESC_SUPPRESS_MS;
        closeTooltip();
      }
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

  /**
   * Tooltip-root pointerleave: pinned → sticky; hover-preview → the same
   * content-gated union-zone deferral as the trigger side (a pointer heading
   * back to the trigger is cancelled by the in-zone pointermove; heading out
   * closes after the grace).
   */
  const handleTooltipPointerLeave = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType !== 'mouse') return;
      if (pinned) return;
      const open = openContentRef.current;
      if (open === null) return;
      scheduleGraceClose(open);
    },
    [pinned, scheduleGraceClose],
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
    /**
     * True when the open came from a mouse pointer-click (pin). T19: the
     * reader wires `preview={!pinned && !openedByKeyboard}` into LawTooltip —
     * hover-open → 5-row preview + ดูเพิ่มเติม, click-pin → full text directly
     * (user decision 2026-08-09). Touch opens are not pins → preview (the
     * mobile sheet shows the same preview behavior).
     */
    pinned,
    /** Stable id for the tooltip root (aria-describedby target — plan commit 3). */
    tooltipId,
  };
}
