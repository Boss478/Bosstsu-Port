'use client';

/**
 * LawLib — dock v2.3 COMPACT (T15, ADR-019 D11).
 *
 * 3-level hierarchy, ONE mechanism desktop + mobile:
 *   Level 0 · ยุบ:     single plain tools icon (no badge) at one of 8
 *                      positions (persisted `lawlib:dockPosition`).
 *   Level 1 · ขยาย:    OPEN BY DEFAULT on reader mount (T12 — desktop panel
 *                      or mobile bottom sheet; reversed D1's default-
 *                      collapsed). T15 v2.3 COMPACT (user-confirmed
 *                      2026-08-08): the L1 GLASS PANEL is kept (border + bg +
 *                      blur — `lawlib-glass lawlib-glass-xs
 *                      lawlib-glass-sheen`, NEVER removed) but shrunk to a
 *                      64px column (w-16) on side positions; the panel HEADER
 *                      is gone; the pickers keep their ICON + current-value
 *                      label-under look (they stretch to the ~52px content
 *                      column; ธีม = icon ONLY — the glyph mirrors the
 *                      theme state); actions (bookmark/search/notes/อ่านต่อ)
 *                      are icon-only 44px squares. favoriteToolKeys
 *                      (persisted in settings) + the per-slug อ่านต่อ (when a
 *                      position exists) fill the column.
 *   Level 2 · เพิ่มเติม: T15 v2.3 — a SEPARATE 112px glass panel (w-28) that
 *                      renders as a SIBLING of Level 1 (NOT inside the 416px
 *                      wrapper of T14): same uniform glass as L1, anchored by
 *                      the per-position flip (`more` in POSITION_CONFIG —
 *                      expands AWAY from the screen edge). Icon-only 2-col
 *                      grid (32×32 icons): row 1 = the Level-1 favorite set,
 *                      divider, row 2 = the rest (glossary · bookmarks-ALL ·
 *                      copy · copy-link · ⚙️ settings · โฟกัส · อ่านอัตโนมัติ
 *                      — T23). NO back button / NO
 *                      section titles / NO text rows / NO pin toggles (pin
 *                      management moved into the ⚙️ settings panel —
 *                      เครื่องมือแถวลัด). bookmarks-all opens the bookmarks
 *                      PANEL (converted from the old L2 section).
 *
 * Controls: the panel header (⚙️ ย่อ + title + ×) is REMOVED — instead a
 * 28×28 pair sits at the END of Level 1: ⋯ (fi-sr-menu-dots, aria-label
 * เพิ่มเติม) TOGGLES Level 2, × (fi-sr-cross, ปิดแถบเครื่องมือ) collapses the
 * dock to Level 0. The dock closes ONLY via Esc / the × button (D9 —
 * pointerdown-outside no longer closes the DOCK panel; the picker POPOVERS
 * keep their own Esc/outside close). A user collapse persists
 * `lawlib:dockCollapsed` → the next visit starts collapsed. Esc cascades:
 * picker → Level 2 (focus → เพิ่มเติม) → close dock (focus → icon). Anchor
 * flips per position: top → panel expands DOWN, bottom → UP, mid → SIDE;
 * Level 2 flips AWAY from the edge (right-side dock → L2 on the LEFT).
 * Mobile (≤639px) renders a full-width bottom sheet, open per default, with
 * Level 2 COLLAPSED (⋯ expands it). Expansion is direction-aware (T12): side
 * positions = vertical Level-1 column; middle positions = horizontal row.
 * T25 (ADR-023 D9): the L2 menu POPS from the ⋯ trigger (200ms spring
 * lawlib-pop-in, origin per the `more` flip) and exits with a 140ms
 * lawlib-pop-out + delay-unmount (L2_ANIM_MS); L1 expand MORPHS from the
 * dock icon (200ms lawlib-morph-in — replaces the old dock-in) on
 * USER-INITIATED expand only — the default-open page load renders without
 * the morph (T25-fix user decision). Both gated
 * by settings.animateDock + prefers-reduced-motion; the 150ms dock-out
 * collapse (DOCK_ANIM_MS) is unchanged.
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { safeGetString, safeSetString } from '@/lib/storage';
import { DEFAULT_READING_SETTINGS, DOCK_TOOL_KEYS } from '@/hooks/useReaderStorage';
import type { DockToolKey, ReadingSettingsValue } from '@/app/(website)/lawlib/lib/reader-props';
import type { LawDoc } from '@/types/lawlib';
import { articleLabel, findArticleByKey } from '@/lib/lawlib-reader';
import {
  DEFAULT_DOCK_POSITION,
  DOCK_POSITIONS,
  FontSizePickerContent,
  LineHeightPickerContent,
  PickerPopover,
  SettingsPanelContent,
  THEME_CHOICES,
  ThemePickerContent,
  TOOLBAR_SIZE_TOUCH_MIN,
  TOOL_ICONS,
  TOOL_LABELS,
  WidthPickerContent,
  type DockMoreToolKey,
  type DockPosition,
} from '@/components/LawlibPickers';
import { DEFAULT_PAPER_TONE, getInitialTheme, type Theme } from '@/components/ThemeProvider';

/**
 * Per-position layout: `root` = the fixed wrapper spot; `panel` = the
 * expanded Level-1 panel anchored to the icon with the flip (top→down,
 * bottom→up, mid→side); `more` = the Level-2 panel anchored to Level 1
 * expanding AWAY from the screen edge (right-side dock → L2 on the LEFT,
 * left-side → RIGHT, top-center → BELOW, bottom-center → ABOVE — T15 v2.3,
 * the same flip class set as the old panel); `layout` (T12 — ADR-019 D9,
 * direction-aware expansion): side positions (L/R × top/mid/bot) = VERTICAL
 * Level-1 column; middle positions (top-center/bottom-center) = HORIZONTAL
 * Level-1 row. Mobile (≤639px) always renders the bottom-sheet horizontal
 * layout, open by default.
 * Bottom offsets (T21, user decision 2026-08-09): bottom positions FLUSH at
 * the bottom — bottom-center/bottom-left always; bottom-right raises to the
 * BackToTop clearance (right corner — it never overlaps the others) ONLY
 * while BackToTop is visible (scrollY > 200, rAF-throttled listener). Top
 * rows clear the law header (24-231px, a11y fix #17): 14rem on mobile, 11rem
 * from md up. Safe areas: bottom/left/right insets via env().
 *
 * T10b toolbar-size parametrization (ADR-019 D4 — the slider is 24-56,
 * default 44): the ICON footprint (--lawlib-dock-size, set inline on the
 * dock root from settings.toolbarSize) enters the bottom-right clearance
 * calc — max(icon + 3.25rem, 5.25rem floor — BackToTop clearance, safe-area
 * inset). The `max()` floors keep small sizes from colliding with
 * BackToTop; the calcs use underscored arbitrary values (Tailwind converts
 * _ → space — calc REQUIRES spaces around -). All literals are static —
 * JIT-safe.
 */
type DockLayout = 'vertical' | 'horizontal';

const POSITION_CONFIG: Record<
  DockPosition,
  { root: string; panel: string; more: string; layout: DockLayout }
> = {
  'top-left': {
    root: 'top-[max(14rem,env(safe-area-inset-top))] left-[max(1.25rem,env(safe-area-inset-left))] md:top-[max(11rem,env(safe-area-inset-top))] md:left-6',
    panel: 'top-0 left-0',
    more: 'left-full top-0 ml-3',
    layout: 'vertical',
  },
  'top-center': {
    root: 'top-[max(14rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 md:top-[max(11rem,env(safe-area-inset-top))]',
    panel: 'top-0 left-1/2 -translate-x-1/2',
    more: 'top-full mt-3 left-1/2 -translate-x-1/2',
    layout: 'horizontal',
  },
  'top-right': {
    root: 'top-[max(14rem,env(safe-area-inset-top))] right-[max(1.25rem,env(safe-area-inset-right))] md:top-[max(11rem,env(safe-area-inset-top))] md:right-6',
    panel: 'top-0 right-0',
    more: 'right-full top-0 mr-3',
    layout: 'vertical',
  },
  'mid-left': {
    root: 'top-1/2 -translate-y-1/2 left-[max(1.25rem,env(safe-area-inset-left))] md:left-6',
    panel: 'top-1/2 -translate-y-1/2 left-0',
    more: 'left-full top-0 ml-3',
    layout: 'vertical',
  },
  'mid-right': {
    root: 'top-1/2 -translate-y-1/2 right-[max(1.25rem,env(safe-area-inset-right))] md:right-6',
    panel: 'top-1/2 -translate-y-1/2 right-0',
    more: 'right-full top-0 mr-3',
    layout: 'vertical',
  },
  'bottom-left': {
    // T21 — the bottom offset is position-aware (bottomOffsetClass below):
    // flush always for bottom-left (BackToTop is right-corner, never
    // overlaps). Insets only here — the bottom-* lives on the root render.
    root: 'left-[max(1.25rem,env(safe-area-inset-left))] md:left-6',
    panel: 'bottom-0 left-0',
    more: 'left-full bottom-0 ml-3',
    layout: 'vertical',
  },
  'bottom-center': {
    root: 'left-1/2 -translate-x-1/2',
    panel: 'bottom-0 left-1/2 -translate-x-1/2',
    more: 'bottom-full mb-3 left-1/2 -translate-x-1/2',
    layout: 'horizontal',
  },
  'bottom-right': {
    root: 'right-[max(1.25rem,env(safe-area-inset-right))] md:right-6',
    panel: 'bottom-0 right-0',
    more: 'right-full bottom-0 mr-3',
    layout: 'vertical',
  },
};

/** T25 — L2 pop transform-origin per position (ADR-023 D5 — contextual
 *  linkage: menus grow from their trigger). Side docks flip to the
 *  L1-adjacent edge — the ⋯ control pair sits at the column's BOTTOM, so
 *  the vertical origin is bottom-aligned there; centered docks grow along
 *  their vertical axis (top-center → below the row, bottom-center → above).
 *  Mobile renders L2 as an in-flow block under the ⋯ row → top center. */
const MORE_POP_ORIGIN: Record<DockPosition, string> = {
  'top-left': 'left bottom',
  'top-center': 'top center',
  'top-right': 'right bottom',
  'mid-left': 'left bottom',
  'mid-right': 'right bottom',
  'bottom-left': 'left bottom',
  'bottom-center': 'bottom center',
  'bottom-right': 'right bottom',
};

/** T25 — L1 morph transform-origin per position: the panel grows FROM the
 *  dock icon — top positions scale from their top edge, bottom from bottom,
 *  mid from the icon-adjacent side; the mobile bottom sheet grows from its
 *  bottom edge. */
const MORPH_ORIGIN: Record<DockPosition, string> = {
  'top-left': 'top left',
  'top-center': 'top center',
  'top-right': 'top right',
  'mid-left': 'left center',
  'mid-right': 'right center',
  'bottom-left': 'bottom left',
  'bottom-center': 'bottom center',
  'bottom-right': 'bottom right',
};

function loadDockPosition(): DockPosition {
  const saved = safeGetString('lawlib:dockPosition');
  return saved !== null && (DOCK_POSITIONS as readonly string[]).includes(saved)
    ? (saved as DockPosition)
    : DEFAULT_DOCK_POSITION;
}

// ---------------------------------------------------------------------------
// Dock collapse memory (T12 — ADR-019 D9): a user who collapses the dock
// manually starts collapsed on the NEXT visit (desktop + mobile). Never
// collapsed (or key absent) → default OPEN. Written on every explicit
// user expand/collapse — programmatic closes (focus mode, resume, bookmark
// jump) do NOT persist.
// ---------------------------------------------------------------------------

const DOCK_COLLAPSED_KEY = 'lawlib:dockCollapsed';

function loadDockCollapsed(): boolean {
  return safeGetString(DOCK_COLLAPSED_KEY) === 'true';
}

/** T12 — expand/collapse animation duration (must match the CSS
 *  `150ms` in the lawlib-dock-anim-* classes, globals.css). */
const DOCK_ANIM_MS = 150;

/** T25 — L2 menu animation duration (must match the CSS `0.2s` in
 *  .lawlib-pop-in, globals.css). Also drives the close delay-unmount: the
 *  exit (lawlib-pop-out, 140ms) always finishes inside this hold. */
const L2_ANIM_MS = 200;

/** T27c — theme-icon swap animation duration (must match the CSS `0.3s`
 *  in .lawlib-icon-swap, globals.css). The swap class is dropped 50ms
 *  AFTER this (the timer in the swap effect) so the keyframe always
 *  finishes before the class goes away. */
const ICON_SWAP_MS = 300;

// ---------------------------------------------------------------------------
// Tool registry — labels + icons + panel map (single source: LawlibPickers —
// shared with the ⚙️ เครื่องมือแถวลัด favorites editor).
// ---------------------------------------------------------------------------

type PickerKind = 'theme' | 'fontSize' | 'lineHeight' | 'width' | 'settings';
type DockPanelKind = 'search' | 'glossary' | 'notes' | 'bookmarks';

const PICKER_KEYS: readonly DockToolKey[] = ['theme', 'fontSize', 'lineHeight', 'width'];
const ACTION_PANEL_MAP: Partial<Record<DockMoreToolKey, DockPanelKind>> = {
  search: 'search',
  glossary: 'glossary',
  notes: 'notes',
  // T14 — bookmarks-ALL opens the bookmarks PANEL (converted from the old
  // Level-2 section; the L1 bookmark button stays the in-place toggle).
  bookmarksAll: 'bookmarks',
};
/** T14 Level-2 row-2 order: the full tool set + the L2-only bookmarks-all
 *  (never pinnable — the L1 bookmark TOGGLE already carries the count).
 *  favoriteToolKeys are filtered OUT of row 2 (row 1 = the favorites).
 *  T23: focusMode + autoScroll flow in via DOCK_TOOL_KEYS (13 tools). */
const MORE_REST_KEYS: readonly DockMoreToolKey[] = [...DOCK_TOOL_KEYS, 'bookmarksAll'];

// ---------------------------------------------------------------------------
// Dock props + component
// ---------------------------------------------------------------------------

export interface LawlibDockProps {
  law: LawDoc;
  theme: Theme;
  setTheme: (next: Theme) => void;
  paperTone: number;
  setPaperTone: (next: number) => void;
  settings: ReadingSettingsValue;
  /** Full replacement or updater — functional updates keep rapid successive
   *  panel actions from clobbering each other (stale-snapshot overwrite). */
  setSettings: (
    next: ReadingSettingsValue | ((prev: ReadingSettingsValue) => ReadingSettingsValue),
  ) => void;
  /** Current article bookmarked (Level-1 bookmark toggle state). */
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  /** T23 — auto-scroll dock tool (L1/L2): toggles speed 0 ↔ last level.
   *  The level memory lives in the reader (session ref). */
  onToggleAutoScroll: () => void;
  activePanel: DockPanelKind | null;
  onOpenPanel: (panel: DockPanelKind) => void;
  notesCount: number;
  copiedFlash: 'article' | 'link' | null;
  onCopyArticle: () => void;
  onCopyLink: () => void;
  canCopy: boolean;
  /** Per-slug last position ("อ่านต่อ" button — Level 1, when present). */
  resumeKey: string | null;
  activeKey: string | null;
  onResume: () => void;
  /** Bookmark count badge on the Level-1 bookmark toggle (the bookmarks
   *  LIST itself lives in the reader's panel — opened from Level 2's
   *  bookmarks-all icon — so jump/remove are the reader's own handlers). */
  bookmarks: string[];
  /** Drawer/tooltip/popover open → the dock's Esc handler stands down. */
  escBlocked: boolean;
}

export default function LawlibDock(props: LawlibDockProps) {
  const {
    law,
    theme,
    setTheme,
    paperTone,
    setPaperTone,
    settings,
    setSettings,
    isBookmarked,
    onToggleBookmark,
    onToggleAutoScroll,
    activePanel,
    onOpenPanel,
    notesCount,
    copiedFlash,
    onCopyArticle,
    onCopyLink,
    canCopy,
    resumeKey,
    activeKey,
    onResume,
    bookmarks,
    escBlocked,
  } = props;

  // T12 (ADR-019 D9): Level 1 is OPEN BY DEFAULT (desktop + mobile bottom
  // sheet) unless the user collapsed it manually on a previous visit
  // (dockCollapsed memory). The panel closes ONLY via Esc / the collapse
  // button / the X button — pointerdown-outside NO LONGER closes the dock
  // panel (reversed D1; the picker POPOVERS keep their own outside-close).
  const [expanded, setExpanded] = useState<boolean>(() => !loadDockCollapsed());
  /** T25-fix (user decision 2026-08-09): the L1 morph plays only after a
   *  USER-initiated expand (collapsed→expanded) — the default-open page
   *  load must not animate. Set in `expandByUser` (the ONLY expand path);
   *  the panel unmounts on every collapse, so each re-expand is a fresh
   *  mount and the sticky morph class replays the animation. */
  const [expandedByUser, setExpandedByUser] = useState(false);
  /** Exit-animation hold: while true the panel stays mounted (animating out)
   *  before the state flips to collapsed. */
  const [closing, setClosing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  /** T25 — L2 exit-animation hold: while true the menu stays mounted
   *  (animating out, lawlib-pop-out 140ms) before the state flips to
   *  closed. Mirrors the L1 `closing` pattern (DOCK_ANIM_MS above). */
  const [moreClosing, setMoreClosing] = useState(false);
  const [picker, setPicker] = useState<{ kind: PickerKind; anchor: HTMLElement } | null>(null);
  const [position, setPosition] = useState<DockPosition>(() => loadDockPosition());
  /** T12c — the THEME dot baselines on the RESOLVED initial theme (see
   *  pickerIsNonDefault below): stored preference wins, else OS scheme. */
  const [resolvedInitialTheme] = useState<Theme>(() =>
    typeof window !== 'undefined' ? getInitialTheme() : 'light',
  );
  /** Touch device (primary pointer coarse) — the toolbar slider floors at
   *  44px (WCAG 2.5.8) and stored sub-44 values are lifted at render. */
  const [coarsePointer] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches,
  );
  /** T12 — mobile (<640px) renders the expanded dock as a BOTTOM SHEET
   *  (full-width, horizontal Level 1, open per default). Captured at mount
   *  like coarsePointer; the sheet is the mobile pattern regardless of the
   *  chosen position (the position still places the collapsed icon). */
  const [isMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 639px)').matches,
  );
  /** T12 — prefers-reduced-motion: animation always off (plus the CSS
   *  media-query fallback in globals.css). */
  const [prefersReducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  /** T21 — BackToTop visibility (scrollY > 200, rAF-throttled scroll
   *  listener below): drives the bottom-right offset only — the other bottom
   *  positions flush always (BackToTop is right-corner, never overlaps). */
  const [backToTopVisible, setBackToTopVisible] = useState(false);

  const rootRef = useRef<HTMLDivElement | null>(null);
  /** T45 — the L1 panel div: the in-tree POSITIONED ANCESTOR of the L2
   *  surface. The desktop portal wrapper mirrors ITS rect (the L2's
   *  `absolute` `more` placement classes resolve against the panel's
   *  padding box — NOT the root, which is a 0×0 anchor when expanded). */
  const panelRef = useRef<HTMLDivElement | null>(null);
  /** T45 — the desktop L2 PORTAL wrapper (body-level, fixed, mirrors the
   *  panel's padding-box rect). Null while L2 is closed or on mobile (the
   *  in-flow branch renders no wrapper). */
  const l2PortalRef = useRef<HTMLDivElement | null>(null);
  /** T26 (AC-1) — the position-change ANIMATION target: an INNER wrapper
   *  inside the root (never the ref'd root — focus management stays
   *  untouched). The re-trigger effect restarts its enter keyframe on
   *  every position change via `animation: none` + reflow. */
  const posAnimRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  /** Level-1 "เพิ่มเติม" (⋯) button — focus target when Esc leaves Level 2. */
  const moreTriggerRef = useRef<HTMLButtonElement | null>(null);
  /** Open picker's trigger button — Esc from the picker restores focus here. */
  const pickerAnchorRef = useRef<HTMLElement | null>(null);
  /** T25 — the L2 exit-hold timer (delayed unmount, DOCK_ANIM_MS pattern).
   *  Tracked in a ref so a re-open (or an instant close) can CANCEL a
   *  pending exit — a stale timer must never unmount a re-opened menu
   *  (ADR-023 D4). */
  const moreExitTimerRef = useRef<number | null>(null);

  /** T12 — dock expand/collapse animation gate: settings.animateDock AND
   *  no system reduced-motion preference. */
  const animateDockNow = settings.animateDock && !prefersReducedMotion;

  /** Collapse → hand focus to the collapsed tools icon. Deferred: the icon is
   *  conditionally rendered — toggleRef only points at the collapsed icon
   *  (the old header button is gone), so the focus must wait for the
   *  re-render to land (or, with the exit animation, until the 150ms closing
   *  hold ends). Shared by the Esc path and the × close (focus parity). */
  const restoreFocusToOpener = useCallback(() => {
    window.setTimeout(() => {
      const opener = toggleRef.current;
      if (opener !== null && opener.isConnected) opener.focus();
    }, 0);
  }, []);

  /** T25 — cancel a pending L2 exit-hold timer (re-open / instant close). */
  const cancelMoreExit = useCallback(() => {
    if (moreExitTimerRef.current !== null) {
      window.clearTimeout(moreExitTimerRef.current);
      moreExitTimerRef.current = null;
    }
  }, []);

  /** Programmatic close (focus mode / resume / bookmark jump): INSTANT, no
   *  animation, no collapse-state persistence (the user did not collapse).
   *  T25: also cancels any pending L2 exit hold — an instant close must
   *  never leave a ghost `moreClosing` behind for the next expand. */
  const closeAllInstant = useCallback(() => {
    cancelMoreExit();
    setPicker(null);
    setMoreOpen(false);
    setMoreClosing(false);
    setExpanded(false);
    pickerAnchorRef.current = null;
  }, [cancelMoreExit]);

  /** T25 — close Level 2: gated exit (140ms pop-out + L2_ANIM_MS hold) or
   *  instant unmount. Every USER close routes here (⋯ toggle + Esc). The
   *  panel-level collapse (userClose) and programmatic closes
   *  (closeAllInstant) stay INSTANT for L2 — the panel exit owns that
   *  dismissal (a hold there would outlive the panel and ghost-render). */
  const closeMore = useCallback(() => {
    if (animateDockNow) {
      cancelMoreExit();
      setMoreClosing(true);
      setMoreOpen(false);
      moreExitTimerRef.current = window.setTimeout(() => {
        moreExitTimerRef.current = null;
        setMoreClosing(false);
      }, L2_ANIM_MS);
    } else {
      setMoreOpen(false);
    }
  }, [animateDockNow, cancelMoreExit]);

  /** T25 — ⋯ toggle: open (cancelling any pending exit) / gated close. */
  const toggleMore = useCallback(() => {
    if (moreOpen) {
      closeMore();
    } else {
      cancelMoreExit();
      setMoreClosing(false);
      setMoreOpen(true);
    }
  }, [moreOpen, closeMore, cancelMoreExit]);

  /** T23 — focus mode is SETTINGS state (persisted; the reader applies
   *  body.lawlib-focus / Esc-exit / the reading indicator). ONE dock-level
   *  handler for EVERY mount: the L1/L2 โฟกัส tool + the ⚙️ settings toggle.
   *  Activating also closes the dock — it is part of what focus mode hides
   *  (instant close, NOT a persisted user collapse). */
  const handleFocusModeChange = useCallback(
    (next: boolean) => {
      setSettings((prev) => ({ ...prev, focusMode: next }));
      if (next) closeAllInstant();
    },
    [setSettings, closeAllInstant],
  );

  /** USER-initiated collapse (Esc at Level 1 / × button): persists
   *  `lawlib:dockCollapsed` + plays the exit animation when enabled (150ms
   *  slide+fade — the panel stays mounted while `closing`). Focus restore is
   *  deferred past the re-render so the collapsed icon exists to receive it. */
  const collapseByUser = useCallback(
    (restoreFocus: boolean) => {
      if (closing) return;
      safeSetString(DOCK_COLLAPSED_KEY, 'true');
      if (animateDockNow) {
        setClosing(true);
        window.setTimeout(() => {
          setClosing(false);
          setExpanded(false);
          if (restoreFocus) restoreFocusToOpener();
        }, DOCK_ANIM_MS);
      } else {
        setExpanded(false);
        if (restoreFocus) restoreFocusToOpener();
      }
    },
    [closing, animateDockNow, restoreFocusToOpener],
  );

  /** User close from ANY level — resets picker/Level 2 first (the X button
   *  can close from Level 2 directly), then collapses with animation. T25:
   *  L2 closes INSTANT here (the panel exit owns the dismissal) and any
   *  pending exit hold is cancelled — no ghost L2 on a re-expand. */
  const userClose = useCallback(
    (restoreFocus: boolean) => {
      setPicker(null);
      setMoreOpen(false);
      setMoreClosing(false);
      pickerAnchorRef.current = null;
      collapseByUser(restoreFocus);
    },
    [collapseByUser],
  );

  /** User EXPAND — clears the collapse memory (next visit opens). */
  const expandByUser = useCallback(() => {
    safeSetString(DOCK_COLLAPSED_KEY, 'false');
    setExpandedByUser(true);
    setExpanded(true);
  }, []);

  const closePicker = useCallback(() => setPicker(null), []);

  // Stays open until explicitly closed — Esc / × only (T12 D9).
  // Esc cascades: picker first, then — when Level 2 is open — ONE press
  // closes Level 2 (focus → เพิ่มเติม ⋯), a second press closes the dock
  // (a11y fix #16). Stands down while a drawer / tooltip / compact popover
  // owns Escape (escBlocked) AND while focus mode hides the dock
  // (body.lawlib-focus display:none — its Esc must exit focus mode via the
  // READER's handler, never collapse/persist the hidden dock; the dock
  // starts OPEN now, so the old "unreachable handler" assumption no longer
  // holds). The final Esc collapses the whole dock (persisted).
  useEffect(() => {
    if (!expanded || escBlocked || settings.focusMode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (picker !== null) {
        // Close the picker, then hand focus back to its trigger button —
        // Esc must not drop focus to <body>.
        const anchor = pickerAnchorRef.current;
        setPicker(null);
        pickerAnchorRef.current = null;
        if (anchor !== null && anchor.isConnected) anchor.focus();
        return;
      }
      if (moreOpen) {
        // Level 2 → Level 1 (L1 stays mounted — เพิ่มเติม only needs its
        // focus restored, deferred until the re-render settles). T25: the
        // same gated pop-out exit as the ⋯ toggle (Esc parity).
        closeMore();
        window.setTimeout(() => {
          const trigger = moreTriggerRef.current;
          if (trigger !== null && trigger.isConnected) trigger.focus();
        }, 0);
        return;
      }
      userClose(true);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expanded, escBlocked, settings.focusMode, picker, moreOpen, userClose, closeMore]);

  // Move focus into the panel on expand (a11y — the old dock focused the
  // first action button on open, L4-1). SKIPPED on the initial mount (the
  // panel is open by default — it must not steal focus from the page on
  // load) and while the exit animation runs. `prevExpandedRef` tracks the
  // transition rather than the state so the guard survives StrictMode-style
  // effect re-runs.
  const prevExpandedRef = useRef(expanded);
  useEffect(() => {
    const wasOpen = prevExpandedRef.current;
    prevExpandedRef.current = expanded;
    if (!expanded || closing) return;
    if (wasOpen) return;
    const root = rootRef.current;
    if (root === null) return;
    const first = root.querySelector<HTMLElement>('button, input');
    if (first !== null && !first.hasAttribute('disabled')) first.focus();
  }, [expanded, closing]);

  // T21 — BackToTop visibility for the bottom-right dock offset (same
  // rAF-throttled pattern as BackToTop.tsx:8-22 — passive listener, one
  // state write per frame max). Only bottom-right ever collides with the
  // fixed back-to-top button; the listener runs always (cheap) so a position
  // switch needs no re-subscription.
  useEffect(() => {
    let rafId = 0;
    const handleScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setBackToTopVisible(window.scrollY > 200);
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  // T22 — the mobile bottom sheet (≤639px, `isMobile && expanded` — the
  // SAME condition the sheet panel renders under) covers the bottom-right
  // corner where BackToTop sits: dispatch a custom event so it stands down
  // while the sheet is up. The exit-animation hold keeps `expanded` true
  // while the panel is still on screen → BackToTop stays hidden until the
  // sheet is really gone. Desktop: isMobile=false → always { open: false }
  // → the T21 desktop behavior is untouched. The unmount cleanup
  // re-dispatches { open: false } so a dock close or page leave restores
  // the button.
  useEffect(() => {
    const sheetOpen = expanded && isMobile;
    window.dispatchEvent(new CustomEvent('lawlib:dock-sheet', { detail: { open: sheetOpen } }));
    return () => {
      window.dispatchEvent(new CustomEvent('lawlib:dock-sheet', { detail: { open: false } }));
    };
  }, [expanded, isMobile]);

  // T26 (AC-1) — position-change RE-TRIGGER: the dock no longer teleports
  // between the 8 spots. Restart the 100ms enter keyframe
  // (lawlib-dock-pos-in-*) on the inner wrapper. Target is the INNER
  // wrapper ref, NEVER the dock root. Gated by animateDockNow —
  // reduced-motion / animateDock off = instant class swap (AC-3).
  /** T26 — generation counter for the two-frame re-trigger: a newer
   *  position change supersedes a pending restore (rapid chip clicks). */
  const posAnimGenRef = useRef(0);
  useEffect(() => {
    const el = posAnimRef.current;
    if (!animateDockNow) {
      // Gate flipped off mid-dance: a previous run may have left the
      // two-frame inline hold (animation none + opacity 0) in place —
      // clear it so the wrapper can never be stuck invisible.
      if (el !== null) {
        el.style.animation = '';
        el.style.opacity = '';
      }
      return;
    }
    if (el === null) return;
    // Two-frame re-trigger (root-caused live in Chromium, 2026-08-09): the
    // engine only processes animation-name changes during a FRAME's style
    // recalc — not during forced recalcs (getComputedStyle/offsetWidth) —
    // and only when the name survives until that recalc. Phase 1 sets
    // `animation: none`; frame N's recalc cancels the finished fill-mode
    // animation. Phase 2 restores the class-driven animation in frame
    // N+1's rAF; that recalc RE-CREATES it → the enter keyframe restarts.
    // A single-task dance (none → reflow → restore) collapses both states
    // into one recalc and is silently skipped.
    const gen = ++posAnimGenRef.current;
    el.style.animation = 'none';
    // One-frame flash guard (senior review 2026-08-09): with `animation:
    // none` ALONE, the frame between the cancellation and the rAF2 restore
    // renders the wrapper at its natural state (opacity 1) — a full-opacity
    // teleport frame at the NEW spot (cross-family moves; also the page-
    // load mount). Hold opacity 0 across the two-frame window; rAF2
    // restores it and the restarted keyframe owns opacity from its 0%.
    el.style.opacity = '0';
    let raf2 = 0;
    const raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        if (posAnimGenRef.current !== gen) return; // superseded
        if (posAnimRef.current !== el) return;
        el.style.animation = '';
        el.style.opacity = '';
      });
    });
    return () => {
      window.cancelAnimationFrame(raf1);
      if (raf2 !== 0) window.cancelAnimationFrame(raf2);
    };
  }, [position, animateDockNow]);

  // T15 (v2.3): opening Level 2 moves focus to its FIRST icon button (the
  // old back-button target is gone — the level swap must not drop focus to
  // <body>, a11y fix #1). Deferred: the L2 panel mounts on the re-render.
  const prevMoreOpenRef = useRef(moreOpen);
  useEffect(() => {
    const wasOpen = prevMoreOpenRef.current;
    prevMoreOpenRef.current = moreOpen;
    if (!moreOpen || wasOpen) return;
    window.setTimeout(() => {
      const panel = document.getElementById('lawlib-more-panel');
      const first = panel?.querySelector<HTMLButtonElement>('button');
      if (first !== undefined && first !== null && !first.hasAttribute('disabled')) {
        first.focus();
      }
    }, 0);
  }, [moreOpen]);

  const togglePicker = (kind: PickerKind, anchor: HTMLElement) => {
    if (picker !== null && picker.kind === kind) {
      // Re-click toggle-off — focus is already on the anchor.
      pickerAnchorRef.current = null;
      setPicker(null);
      return;
    }
    pickerAnchorRef.current = anchor;
    setPicker({ kind, anchor });
  };

  const activateTool = (key: DockMoreToolKey, anchor?: HTMLElement) => {
    if (key === 'settings') {
      if (anchor !== undefined) togglePicker('settings', anchor);
      return;
    }
    if (key !== 'bookmarksAll' && PICKER_KEYS.includes(key)) {
      if (anchor !== undefined) togglePicker(key as PickerKind, anchor);
      return;
    }
    switch (key) {
      case 'bookmark':
        onToggleBookmark();
        return;
      case 'copy':
        if (canCopy) onCopyArticle();
        return;
      case 'copyLink':
        if (canCopy) onCopyLink();
        return;
      // T23 — explicit cases: the default branch maps to ACTION_PANEL_MAP[key]
      // = undefined, which would leave these two buttons DEAD no-ops.
      case 'focusMode':
        // The dock closes itself when focus activates (shared handler —
        // same semantics as the ⚙️ settings toggle).
        handleFocusModeChange(true);
        return;
      case 'autoScroll':
        onToggleAutoScroll();
        return;
      default: {
        const panel = ACTION_PANEL_MAP[key];
        if (panel !== undefined) onOpenPanel(panel);
      }
    }
  };

  const setDockPosition = (next: DockPosition) => {
    setPosition(next);
    safeSetString('lawlib:dockPosition', next);
  };

  /** คืนค่าเริ่มต้น (D7): ALL reading settings + favorites (part of the
   *  settings object) + the dock position + the paper tone. Theme stays
   *  untouched (site-wide preference, ThemeProvider — out of the reading
   *  settings contract). Bookmarks/notes/highlights are USER DATA, not
   *  settings — never wiped. */
  const handleReset = () => {
    setSettings(DEFAULT_READING_SETTINGS);
    setPosition(DEFAULT_DOCK_POSITION);
    safeSetString('lawlib:dockPosition', DEFAULT_DOCK_POSITION);
    setPaperTone(DEFAULT_PAPER_TONE);
  };

  const cfg = POSITION_CONFIG[position];
  /** Effective toolbar size — touch devices never go below 44 (WCAG 2.5.8).
   *  Drives --lawlib-dock-size (icon footprint + geometry calcs). */
  const effectiveToolbarSize = coarsePointer
    ? Math.max(TOOLBAR_SIZE_TOUCH_MIN, settings.toolbarSize)
    : settings.toolbarSize;

  // ─── T12 direction-aware layout (ADR-019 D9) ─────────────────────────────
  // Side positions (L/R × top/mid/bot) → vertical Level-1 column + 2-col
  // Level-2 grid; middle positions (top/bottom-center) → horizontal Level-1
  // row + horizontal Level-2 grid; mobile (≤639px) is ALWAYS the bottom
  // sheet with the horizontal layout.
  const effectiveLayout: DockLayout = isMobile ? 'horizontal' : cfg.layout;
  /** Animation slide direction by anchor (T12): top positions slide down
   *  from the icon, bottom/sheet slide up, mid slides sideways (the panel
   *  sits beside the icon — --lawlib-dock-slide flips per side). */
  const animDir = isMobile
    ? 'up'
    : position.startsWith('top')
      ? 'down'
      : position.startsWith('mid')
        ? 'side'
        : 'up';
  /** T25 — the L1 panel animates in with the 200ms icon→panel MORPH
   *  (lawlib-morph-in, spring overshoot) replacing the old directional
   *  dock-in; the 150ms directional dock-out stays for collapse (the sheet
   *  path — DOCK_ANIM_MS is untouched). T25-fix (user decision 2026-08-09):
   *  the morph plays ONLY on a USER-initiated expand (collapsed→expanded) —
   *  the default-open page load must not animate. `expandedByUser` is set
   *  in `expandByUser` (the ONLY expand path); the panel unmounts on every
   *  collapse, so each re-expand is a fresh mount and the sticky class
   *  replays the animation. */
  const animClass = animateDockNow
    ? closing
      ? `lawlib-dock-anim-out-${animDir}`
      : expandedByUser
        ? 'lawlib-morph-in'
        : ''
    : '';
  /** T26 (AC-1) — position-change ENTER class on the INNER wrapper: 100ms
   *  fade + directional slide (lawlib-dock-pos-in-*, same lawlib-dock-in-*
   *  keyframes as the T12 family, on the locked var(--ease-ios-expo)
   *  curve). The re-trigger effect above restarts it on every position
   *  change. Gated by animateDockNow → reduced-motion/off = instant class
   *  swap (AC-3). The class sits on the wrapper only — the dock root
   *  (AC-5) and the panel's own T25 morph/dock-out classes are untouched. */
  const posAnimClass = animateDockNow ? `lawlib-dock-pos-in-${animDir}` : '';
  /** T25 — L1 morph origin at the dock icon (mobile = the bottom sheet,
   *  grows from its bottom edge). Applied only while the morph runs. */
  const panelMorphOrigin = isMobile ? 'bottom center' : MORPH_ORIGIN[position];
  /** T25 — L2 pop origin per the `more` flip (mobile = in-flow block under
   *  the ⋯ row, grows downward). */
  const morePopOrigin = isMobile ? 'top center' : MORE_POP_ORIGIN[position];
  /** T15 (v2.3): UNIFORM glass for Level 1 + Level 2 + collapsed icon
   *  (transparent glass-2 override: slider alpha + blur-xs + sheen). The
   *  old `lawlib-glass-strong` Level-2 distinction is GONE — L2 is a
   *  sibling panel with the SAME glass surface. */
  const panelSurfaceClass = 'lawlib-glass lawlib-glass-xs lawlib-glass-sheen';
  /** T15 (v2.3): the L1 panel is a COMPACT 64px column on side positions
   *  (user: "Still large → L1 = 64px"); middle positions keep a content-
   *  width row (the horizontal layout needs width to lay out). The old
   *  shared 416px panel width (w-[min(92vw,26rem)]) is gone — Level 2 no
   *  longer lives inside this panel. `overflow`/`max-h` moved to the L1
   *  TOOLS wrapper (below) so the absolutely-anchored L2 sibling is never
   *  clipped by the scroll container. Mobile bottom sheet: full-width,
   *  safe-area bottom inset, keeps its own scroll. */
  const panelPlacementClass = isMobile
    ? 'fixed inset-x-0 bottom-0 max-h-[min(65vh,34rem)] overflow-y-auto rounded-t-2xl border-t border-slate-200/80 dark:border-slate-700/70 p-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-2xl'
    : `absolute ${cfg.panel} rounded-full border border-slate-200/80 dark:border-slate-700/70 p-2 md:p-2.5 shadow-2xl shadow-slate-900/15 dark:shadow-black/50 ${
        effectiveLayout === 'vertical'
          ? 'w-16 py-2 px-1.5 md:py-2.5'
          : 'max-w-[calc(100vw-2rem)] w-max px-3 py-2 md:px-4 md:py-2.5'
      }`;
  /** T20 (user decision 2026-08-09): the desktop L1 tools column NO LONGER
   *  scrolls — the viewport caps + overflow-y-auto are gone, the panel grows
   *  with its content ("I don't need inside the dock to be scrollable"). The
   *  panel wrapper stays overflow-visible so the L2 sibling is never
   *  clipped. */
  const toolsPlacementClass =
    isMobile || effectiveLayout === 'vertical' ? '' : 'flex-row flex-nowrap';
  /** T15 (v2.3): Level 2 = a SEPARATE 112px glass panel (w-28), anchored to
   *  Level 1 with the per-position flip (`more` — away from the screen
   *  edge). Mobile: an in-flow full-width block inside the sheet (dots ⋯
   *  expands it). T20: the desktop 70vh cap + scroll are gone too — the
   *  panel grows with its content (only the mobile SHEET keeps its own
   *  max-h + scroll — safety, L2 collapsed by default there). */
  const morePanelPlacementClass = isMobile
    ? 'mt-2 w-full rounded-2xl border border-slate-200/80 dark:border-slate-700/70 p-2'
    : `absolute ${cfg.more} w-28 md:w-32 rounded-3xl border border-slate-200/80 dark:border-slate-700/70 p-2.5 md:p-3 shadow-2xl shadow-slate-900/15 dark:shadow-black/50`;
  /** T45 — L2 surface (user-locked 2026-08-10): FIXED glass, same as the L1
   *  round buttons — `bg-white/60` / `dark:bg-slate-800/70` (60% alpha) +
   *  `backdrop-blur-sm` (8px). The old `lawlib-glass lawlib-glass-xs`
   *  (slider-driven vars) is GONE from L2: the portaled panel's blur must
   *  sample the REAL page behind it, and the slider no longer drives L2.
   *  `lawlib-glass-sheen` kept — it is border-top-color ONLY, no
   *  backdrop-filter (verified in globals.css:2065). */
  const morePanelSurfaceClass =
    'bg-white/60 dark:bg-slate-800/70 backdrop-blur-sm lawlib-glass-sheen';

  /** T21 matrix (user decision 2026-08-09) — position-aware bottom offset,
   *  T26 (AC-2/AC-4) — FLUSH-ONLY now: this class list is the FIXED
   *  `bottom`; the BackToTop-clearance RAISE moved to a compositor-only
   *  transform (`.lawlib-dock-raised` — the old transition-[bottom]
   *  animated a layout property). Selection semantics unchanged:
   *  bottom-center/bottom-left always flush (BackToTop is right-corner,
   *  never overlaps); bottom-right raises only while BackToTop is visible
   *  (scrollY > 200, rAF-throttled listener). Mobile (<640px): 4.75rem
   *  always — navbar 64px + 12px gap (also clears BackToTop's mobile
   *  68px). Every branch is a FULL static string (JIT-safe — no dynamic
   *  construction). */
  const isBottomPosition =
    position === 'bottom-left' || position === 'bottom-center' || position === 'bottom-right';
  const bottomOffsetClass = isMobile
    ? 'bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)_+_1.25rem))]'
    : 'bottom-[max(1.25rem,env(safe-area-inset-bottom))] md:bottom-6';
  /** T26 (AC-2) — the RAISE itself: `bottom` stays fixed at the flush
   *  value above; the raised state lifts the whole dock with
   *  translateY(calc(-1 * (var(--lawlib-dock-size) + 3.25rem))) = −96px at
   *  the default 44px toolbar size (the historical size + 3.25rem
   *  clearance calc); mobile = −(size + 0.75rem) = −56px. The 150ms spring
   *  transform transition lives on the root class list
   *  (transition-[transform] duration-150 ease-ios-spring). Only bottom-right ever raises
   *  (the T21 matrix). */
  const dockRaised = position === 'bottom-right' && backToTopVisible;

  /** T45 — desktop L2 portal sync (LawTooltip/PickerPopover pattern): the
   *  wrapper mirrors the PANEL's PADDING-box rect — the box the L2's
   *  `absolute` `more` placement classes resolve against in-tree — so the
   *  portaled L2 lands at IDENTICAL viewport geometry, but with NO
   *  backdrop-filter ancestor (the Chromium nested-bf quirk: a bf
   *  descendant outside the bf ancestor's border box samples nothing →
   *  computed blur, no visual blur). The root is NOT the reference: when
   *  expanded it is a 0×0 fixed anchor (the panel is absolutely
   *  positioned), so mirroring it would shift L2 by the panel's whole
   *  size. Padding-box math (border-box rect − computed borders/paddings)
   *  keeps the alignment exact across every layout variant (w-16 column /
   *  w-max row). Direct style writes (no setState) → the compiler
   *  set-state-in-effect rule stays untouched; visibility flips after the
   *  first sync → no flash at the origin corner. Re-syncs on open
   *  (`moreOpen`), window resize, and every geometry change of the dock
   *  root (position / BackToTop raise / toolbar size). The wrapper itself
   *  carries NO transform/filter/backdrop-filter — a transform would make
   *  it a containing block and a bf would re-create the very bug. */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const wrapper = l2PortalRef.current;
    if (panel === null || wrapper === null) return;
    const sync = () => {
      const p = panelRef.current;
      const w = l2PortalRef.current;
      if (p === null || w === null) return;
      const r = p.getBoundingClientRect();
      const cs = window.getComputedStyle(p);
      const padL = parseFloat(cs.paddingLeft) || 0;
      const padR = parseFloat(cs.paddingRight) || 0;
      const padT = parseFloat(cs.paddingTop) || 0;
      const padB = parseFloat(cs.paddingBottom) || 0;
      const bL = parseFloat(cs.borderLeftWidth) || 0;
      const bR = parseFloat(cs.borderRightWidth) || 0;
      const bT = parseFloat(cs.borderTopWidth) || 0;
      const bB = parseFloat(cs.borderBottomWidth) || 0;
      w.style.left = `${r.left + bL + padL}px`;
      w.style.top = `${r.top + bT + padT}px`;
      w.style.width = `${r.width - bL - bR - padL - padR}px`;
      w.style.height = `${r.height - bT - bB - padT - padB}px`;
      w.style.visibility = 'visible';
    };
    sync();
    // T45-fix (live 2026-08-10): the first sync runs in the layout phase —
    // BEFORE the dock's own motion (the 100ms position-change slide, the
    // expand morph, the BackToTop raise transition) starts at paint, so it
    // captures the panel's PRE-motion rect. A trailing re-sync after the
    // longest dock motion (250ms) pins the wrapper to the SETTLED rect —
    // without it the wrapper stays offset by the animation's travel
    // (±8px slide, −96px raise) until the next open/resize/position change.
    const settleTimer = window.setTimeout(sync, 250);
    window.addEventListener('resize', sync);
    return () => {
      window.clearTimeout(settleTimer);
      window.removeEventListener('resize', sync);
    };
  }, [position, dockRaised, effectiveToolbarSize, moreOpen]);

  const pickerValue: Record<PickerKind, string> = {
    theme: THEME_CHOICES.find((c) => c.value === theme)?.label ?? theme,
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight.toFixed(1),
    // Width slider is a percentage of the 80ch baseline (user decision
    // 2026-08-06): 80-120%, default 100%.
    width: `${settings.width}%`,
    settings: '',
  };

  /** T12 (ADR-019 D9): non-default value dots — a picker whose CURRENT value
   *  differs from its baseline shows a small blue dot (always on, no toggle).
   *  T12c: the THEME baseline is the RESOLVED initial theme (resolvedInitialTheme
   *  above — stored preference wins, else OS scheme) rather than a hard-coded
   *  'light': an OS-dark fallback user would otherwise see a FALSE dot on
   *  first visit (theme resolves to dark with nothing stored). The other
   *  pickers baseline on the reading-settings defaults (never OS-dependent). */
  const pickerIsNonDefault: Record<PickerKind, boolean> = {
    theme: theme !== resolvedInitialTheme,
    fontSize: settings.fontSize !== DEFAULT_READING_SETTINGS.fontSize,
    lineHeight: settings.lineHeight !== DEFAULT_READING_SETTINGS.lineHeight,
    width: settings.width !== DEFAULT_READING_SETTINGS.width,
    settings: false,
  };

  // Bookmark count used by the Level-1 badge + Level-2 heading — RESOLVED
  // keys only (stale keys the BookmarksPanel skips must not be counted, fix
  // #24). Derived here — the bookmarksCount prop was removed 2026-08-06.
  const resolvedBookmarkCount = bookmarks.filter(
    (k) => findArticleByKey(law, k) !== undefined,
  ).length;

  const resumeVisible =
    resumeKey !== null &&
    resumeKey !== activeKey &&
    // Stale stored position (the article left this law's data) → the button
    // would dead-end in "ไม่พบมาตรานี้" — hide it.
    findArticleByKey(law, resumeKey) !== undefined;
  const resumeLabel =
    resumeKey !== null
      ? (() => {
          const hit = findArticleByKey(law, resumeKey);
          return hit !== undefined ? articleLabel(hit.article.no, hit.article.suffix) : resumeKey;
        })()
      : '';

  // --- Level 1 tool button (T14 — ADR-019 D10) -------------------------------
  // Pickers = ICON + the current value as a tiny label BENEATH the icon (the
  // 44px button includes the label zone — WCAG 2.5.8). ธีม = icon ONLY (its
  // glyph mirrors the theme state: ☀️/🌙/📖/🎨). Actions = icon-only 44px.
  // The T12 non-default dots stay on the pickers.

  // T27c (senior 2026-08-09) — the theme-icon swap animation must fire ONLY
  // on a real theme change: `swapTheme` initializes to the MOUNT-TIME theme,
  // so a fresh mount (page load, collapse→expand remount) sees theme ===
  // swapTheme → no swap class; a real theme change sees them differ → the
  // class lands on the keyed glyph remount and the 300ms swap plays. The
  // sync is deferred PAST the animation via a timer (the 100% keyframe
  // equals the natural state — rotate(0) scale(1) opacity 1 — so dropping
  // the class after the swap is invisible); a render-time ref read trips
  // the react-compiler rule and a synchronous effect sync would cut the
  // animation short (set-state-in-effect).
  const [swapTheme, setSwapTheme] = useState(theme);
  useEffect(() => {
    if (theme === swapTheme) return;
    const t = window.setTimeout(() => setSwapTheme(theme), ICON_SWAP_MS + 50);
    return () => window.clearTimeout(t);
  }, [theme, swapTheme]);

  const renderToolButton = (key: DockToolKey) => {
    if (PICKER_KEYS.includes(key) || key === 'settings') {
      const kind = key === 'settings' ? 'settings' : (key as PickerKind);
      const icon =
        key === 'theme'
          ? (THEME_CHOICES.find((c) => c.value === theme)?.icon ?? 'fi-sr-sun')
          : TOOL_ICONS[key];
      // The accessible name carries the tool + CURRENT value (the value is
      // also visible under the icon — except theme/settings, icon-only).
      // Settings has no value (pickerValue.settings = '') — no empty suffix.
      const accessibleName =
        kind === 'settings' ? TOOL_LABELS[key] : `${TOOL_LABELS[key]} ${pickerValue[kind]}`;
      return (
        <button
          key={key}
          type="button"
          aria-label={accessibleName}
          title={TOOL_LABELS[key]}
          aria-haspopup="true"
          aria-expanded={picker?.kind === kind}
          onClick={(e) => togglePicker(kind, e.currentTarget)}
          className={`relative flex h-11 w-11 md:h-12 md:w-12 min-h-11 min-w-11 shrink-0 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-full border shadow-xs backdrop-blur-sm transition-[transform,background-color,border-color] duration-150 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            picker?.kind === kind
              ? 'border-blue-500/80 bg-blue-50/90 text-blue-600 shadow-xs ring-2 ring-blue-500/20 dark:border-blue-400/80 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-400/20'
              : 'border-slate-200/90 bg-white/60 text-slate-600 hover:border-blue-400/80 hover:bg-white hover:text-blue-600 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:bg-slate-700/90 dark:hover:text-blue-300'
          }`}
        >
          {/* T27c (AC-4) — theme icon morph: keyed by the theme value so a
              theme change REMOUNTS the glyph and replays lawlib-icon-swap
              (300ms rotate-fade + spring pop). The swap class applies ONLY
              when the theme differs from the mount-synced swap state
              (senior 2026-08-09) — a fresh mount on the SAME theme (page
              load, collapse→expand remount) must NOT replay the animation.
              ONE animation on this <i> (D10) — the button's own hover
              transition stays on the button. Non-theme pickers keep the
              stable icon (no key, no swap class). */}
          <i
            key={key === 'theme' ? theme : undefined}
            aria-hidden="true"
            className={`fi ${icon} ${
              key === 'theme' && theme !== swapTheme ? 'lawlib-icon-swap' : ''
            } text-sm md:text-[15px] leading-none`}
          />
          {key !== 'theme' && key !== 'settings' && (
            <span className="text-[9.5px] md:text-[10px] font-bold leading-none tabular-nums tracking-tight">
              {pickerValue[kind]}
            </span>
          )}
          {/* T12: non-default value dot (always on — a tiny blue dot in the
              top-right corner; the button itself stays the boundary). */}
          {key !== 'settings' && pickerIsNonDefault[kind] && (
            <span
              aria-hidden="true"
              className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-blue-500 ring-1.5 ring-white dark:ring-slate-900"
            />
          )}
        </button>
      );
    }

    return renderActionIconButton(key, true);
  };

  // Shared action-state helpers (used by the Level-1 + Level-2 icon buttons):
  // active panel/toggle highlight + the check-circle glyph swap (never
  // color-only — WCAG 1.4.1, a11y fix #9).
  const toolActive = (key: DockMoreToolKey): boolean => {
    if (key === 'bookmark') return isBookmarked;
    if (key === 'search') return activePanel === 'search';
    if (key === 'notes') return activePanel === 'notes';
    if (key === 'glossary') return activePanel === 'glossary';
    if (key === 'bookmarksAll') return activePanel === 'bookmarks';
    // T23 — both live in SETTINGS: focusMode is the persisted boolean;
    // autoScroll is ON whenever a speed is stored (level 1-5).
    if (key === 'focusMode') return settings.focusMode;
    if (key === 'autoScroll') return settings.autoScrollSpeed > 0;
    return false;
  };
  /** True ONLY for the real toggle buttons (bookmark/search/notes/glossary/
   *  bookmarksAll + T23 focusMode/autoScroll). copy/copyLink act directly
   *  and pickers open popovers — they must NOT carry aria-pressed, or SR
   *  announces a toggle that isn't one (T14 a11y findings). */
  const isToolToggle = (key: DockMoreToolKey): boolean =>
    key === 'bookmark' ||
    key === 'search' ||
    key === 'notes' ||
    key === 'glossary' ||
    key === 'bookmarksAll' ||
    key === 'focusMode' ||
    key === 'autoScroll';
  const toolGlyph = (key: DockMoreToolKey, active: boolean): string => {
    const flash = key === 'copy' && copiedFlash === 'article';
    const linkFlash = key === 'copyLink' && copiedFlash === 'link';
    if (flash || linkFlash || (key === 'bookmark' && active)) {
      return 'fi-sr-check-circle';
    }
    // T23 — active autoScroll swaps play → pause (the chip's own glyph
    // language; never color-only, WCAG 1.4.1).
    if (key === 'autoScroll' && active) return 'fi-sr-pause';
    return TOOL_ICONS[key];
  };

  /** Action icon button — Level 1 (badges: bookmark count + notes count). */
  const renderActionIconButton = (key: DockToolKey, withBadge: boolean) => {
    let badge: number | undefined;
    if (withBadge && key === 'bookmark') badge = resolvedBookmarkCount;
    if (withBadge && key === 'notes') badge = notesCount;
    const active = toolActive(key);
    const icon = toolGlyph(key, active);

    return (
      <button
        key={key}
        type="button"
        aria-label={
          badge !== undefined && badge > 0 ? `${TOOL_LABELS[key]} (${badge})` : TOOL_LABELS[key]
        }
        title={TOOL_LABELS[key]}
        // aria-pressed ONLY on the real toggles (bookmark/search/notes/
        // glossary/bookmarksAll) — copy/copyLink act directly, so no
        // aria-pressed (a `false` would fake a toggle for SR).
        aria-pressed={isToolToggle(key) ? active : undefined}
        disabled={(key === 'copy' || key === 'copyLink') && !canCopy}
        onClick={() => activateTool(key)}
        className={`relative flex h-11 w-11 md:h-12 md:w-12 min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border shadow-xs backdrop-blur-sm transition-[transform,background-color,border-color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${
          badge !== undefined && badge > 0 ? 'z-10' : ''
        } ${
          active
            ? 'border-blue-500/80 bg-blue-50/90 text-blue-600 shadow-xs ring-2 ring-blue-500/20 dark:border-blue-400/80 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-400/20'
            : 'border-slate-200/90 bg-white/60 text-slate-600 hover:scale-105 hover:border-blue-400/80 hover:bg-white hover:text-blue-600 hover:shadow-sm active:scale-95 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:bg-slate-700/90 dark:hover:text-blue-300'
        }`}
      >
        <i aria-hidden="true" className={`fi ${icon} text-xs md:text-sm leading-none`} />
        {badge !== undefined && badge > 0 && (
          <span className="pointer-events-none absolute -right-0.5 -top-0.5 z-20 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs ring-1.5 ring-white dark:ring-slate-900">
            {badge}
          </span>
        )}
      </button>
    );
  };

  /** Action icon button — Level 2 (icon-only, matching size). */
  const renderMoreIconButton = (key: DockMoreToolKey) => {
    const isPicker = (key !== 'bookmarksAll' && PICKER_KEYS.includes(key)) || key === 'settings';
    const kind = key === 'settings' ? 'settings' : (key as PickerKind);
    const pickerOpen = isPicker && picker?.kind === kind;
    const active = toolActive(key);
    const icon = toolGlyph(key, active);

    return (
      <button
        key={key}
        type="button"
        aria-label={TOOL_LABELS[key]}
        title={TOOL_LABELS[key]}
        aria-pressed={isToolToggle(key) ? active : undefined}
        aria-haspopup={isPicker ? 'true' : undefined}
        aria-expanded={isPicker ? pickerOpen : undefined}
        disabled={(key === 'copy' || key === 'copyLink') && !canCopy}
        onClick={(e) => activateTool(key, e.currentTarget)}
        className={`flex h-8.5 w-8.5 md:h-9.5 md:w-9.5 shrink-0 cursor-pointer items-center justify-center rounded-full border shadow-xs backdrop-blur-sm transition-[transform,background-color,border-color] duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100 ${
          pickerOpen || active
            ? 'border-blue-500/80 bg-blue-50/90 text-blue-600 shadow-xs ring-2 ring-blue-500/20 dark:border-blue-400/80 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-400/20'
            : 'border-slate-200/90 bg-white/60 text-slate-600 hover:scale-110 hover:border-blue-400/80 hover:bg-white hover:text-blue-600 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:bg-slate-700/90 dark:hover:text-blue-300'
        }`}
      >
        <i aria-hidden="true" className={`fi ${icon} text-xs md:text-sm leading-none`} />
      </button>
    );
  };

  /** T45 — the L2 inner content (favorites grid + divider + rest grid),
   *  shared by BOTH surfaces: the mobile in-flow panel and the desktop
   *  body-portaled panel. Defined after renderMoreIconButton (closure). */
  const morePanelContent = (
    <div className="flex flex-col gap-1.5 md:gap-2">
      {settings.favoriteToolKeys.length > 0 && (
        <>
          <ul className="grid grid-cols-2 justify-items-center gap-0.5">
            {settings.favoriteToolKeys.map((key) => (
              <li key={key}>{renderMoreIconButton(key)}</li>
            ))}
          </ul>
          <div aria-hidden="true" className="h-px w-full shrink-0 bg-slate-200 dark:bg-slate-700" />
        </>
      )}
      <ul className="grid grid-cols-2 justify-items-center gap-0.5">
        {MORE_REST_KEYS.filter((key) => !settings.favoriteToolKeys.some((k) => k === key)).map(
          (key) => (
            <li key={key}>{renderMoreIconButton(key)}</li>
          ),
        )}
      </ul>
    </div>
  );

  // T44 — portal to document.body: the reader shell wraps this tree in
  // next/dynamic(ssr:false) (LawlibReaderShell), so the server NEVER renders
  // the dock and this guard is belt-and-braces, not the hydration fix (same
  // pattern as LawlibPickers:224). It returns null instead of calling
  // createPortal when document is missing — if the dock is ever imported
  // into an SSR'd tree, the mounted-gate (null until useEffect) is required.
  if (typeof document === 'undefined') return null;

  return createPortal(
    // T34 (ADR-024 D2): NO view-transition-name on the dock — the root's
    // subtree carries backdrop-filter (`.lawlib-glass-xs` blur), and Chrome
    // captures a BLANK snapshot for backdrop-filter + view-transition-name
    // (dock vanished mid-VT). The dock crossfades with the root snapshot
    // instead — it never moves on theme change, so there is no jump.
    <div
      ref={rootRef}
      style={
        {
          '--lawlib-dock-size': `${effectiveToolbarSize}px`,
          // T12 mid-position slide direction (animating transform only — the
          // Tailwind translate utilities use the independent `translate`
          // property, so centering is untouched).
          ...(animDir === 'side'
            ? { '--lawlib-dock-slide': position === 'mid-left' ? '-8px' : '8px' }
            : {}),
        } as React.CSSProperties
      }
      className={`lawlib-dock fixed z-50 ${cfg.root} ${
        isBottomPosition ? bottomOffsetClass : ''
      } ${dockRaised ? 'lawlib-dock-raised' : ''} transition-[transform] duration-150 ease-ios-spring`}
    >
      {/* T26 (AC-1) — the position-change ANIMATION wrapper: keyed target of
          the re-trigger effect (animation:none + reflow), carries the
          directional enter class. Deliberately NOT positioned (no relative)
          — the panel/L2 absolute anchors keep resolving to the fixed ROOT.
          The root and the portaled pickers stay outside. */}
      <div ref={posAnimRef} data-lawlib-pos className={posAnimClass}>
        {!expanded && !closing ? (
          <button
            ref={toggleRef}
            type="button"
            onClick={expandByUser}
            aria-label="เครื่องมืออ่าน"
            aria-expanded={false}
            aria-haspopup="dialog"
            aria-controls="lawlib-dock-panel"
            title="เครื่องมืออ่าน"
            className="lawlib-dock lawlib-glass lawlib-glass-xs lawlib-glass-sheen flex h-[var(--lawlib-dock-size)] w-[var(--lawlib-dock-size)] cursor-pointer items-center justify-center rounded-full border border-slate-200/90 text-slate-600 shadow-xl shadow-slate-900/10 transition-[transform,background-color,border-color] duration-150 hover:scale-105 hover:border-blue-400/80 hover:text-blue-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/80 dark:text-slate-300 dark:shadow-black/40 dark:hover:border-blue-400/60 dark:hover:text-white"
          >
            <i aria-hidden="true" className="fi fi-sr-sliders-h text-sm leading-none" />
          </button>
        ) : (
          <div
            id="lawlib-dock-panel"
            ref={panelRef}
            role="dialog"
            aria-modal="false"
            aria-label="เครื่องมืออ่าน"
            style={{ ...(animateDockNow && !closing ? { transformOrigin: panelMorphOrigin } : {}) }}
            className={`lawlib-dock ${panelSurfaceClass} ${panelPlacementClass} border-slate-200 dark:border-slate-700 ${animClass}`}
          >
            {/* ─── Level 1 (T15 v2.3 COMPACT): ALWAYS visible while expanded —
              the tools column/row + the ⋯/× control pair at its end. The
              panel header is gone; Level 2 is a SIBLING panel, not a swap.
              Side positions = vertical column (pickers stretch to the
              ~52px content width; actions stay 44px squares); middle +
              mobile = horizontal row. ──────────────────────────────────── */}
            <div
              data-lawlib-l1
              className={`flex items-center gap-1.5 md:gap-2 ${effectiveLayout === 'vertical' ? 'flex-col' : 'flex-wrap'}`}
            >
              {/* Tools — desktop side positions (T20: NO internal scroll — the
                panel grows with its content; the wrapper stays
                overflow-visible so the absolutely anchored L2 sibling is
                never clipped). */}
              <div
                data-lawlib-l1-tools
                className={`flex items-center gap-1.5 md:gap-2 ${effectiveLayout === 'vertical' ? 'flex-col' : 'flex-nowrap shrink-0'} ${toolsPlacementClass}`}
              >
                {resumeVisible && (
                  <button
                    type="button"
                    onClick={() => {
                      closeAllInstant();
                      onResume();
                    }}
                    aria-label={`อ่านต่อ: ${resumeLabel}`}
                    title={`อ่านต่อ: ${resumeLabel}`}
                    className="flex h-11 w-11 md:h-12 md:w-12 min-h-11 min-w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-amber-300/90 bg-amber-50/90 text-amber-800 shadow-xs backdrop-blur-xs transition-[transform,background-color,border-color] duration-150 hover:scale-105 hover:border-amber-400 hover:bg-amber-100/90 hover:shadow-sm active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-amber-500/50 dark:bg-amber-950/60 dark:text-amber-200 dark:hover:border-amber-400 dark:hover:bg-amber-900/60"
                  >
                    <i
                      aria-hidden="true"
                      className="fi fi-sr-time-past text-sm md:text-[15px] leading-none"
                    />
                  </button>
                )}
                {settings.favoriteToolKeys.map((key) => renderToolButton(key))}
              </div>

              {/* Divider between tools and control pair */}
              {effectiveLayout === 'vertical' ? (
                <div
                  aria-hidden="true"
                  className="my-1 h-px w-6 md:w-7 shrink-0 bg-slate-200/80 dark:bg-slate-700/80"
                />
              ) : (
                <div
                  aria-hidden="true"
                  className="mx-1 my-auto h-7 md:h-8 w-px shrink-0 bg-slate-200/80 dark:bg-slate-700/80"
                />
              )}

              {/* Control pair (replaces the removed panel header): ⋯ toggles
                Level 2, × collapses the dock to the icon. Side positions =
                full-bleed row at the column's bottom; middle/mobile = at
                the end of the row flow. */}
              <div
                className={`flex items-center gap-1.5 md:gap-2 shrink-0 ${
                  effectiveLayout === 'vertical' ? 'flex-col justify-center' : 'flex-nowrap'
                }`}
              >
                <button
                  ref={moreTriggerRef}
                  type="button"
                  onClick={toggleMore}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  aria-controls="lawlib-more-panel"
                  aria-label="เพิ่มเติม"
                  title="เพิ่มเติม"
                  className={`flex h-7 w-7 md:h-8 md:w-8 cursor-pointer items-center justify-center rounded-full border shadow-xs transition-[transform,background-color,border-color] duration-150 hover:scale-110 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    moreOpen
                      ? 'border-blue-500/80 bg-blue-50/90 text-blue-600 ring-1.5 ring-blue-500/20 dark:border-blue-400/80 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-400/20'
                      : 'border-slate-200/90 bg-white/60 text-slate-600 hover:border-blue-400/80 hover:bg-white hover:text-blue-600 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:bg-slate-700/90 dark:hover:text-blue-300'
                  }`}
                >
                  <i
                    aria-hidden="true"
                    className="fi fi-sr-menu-dots text-xs md:text-[13px] leading-none"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => userClose(true)}
                  aria-label="ปิดแถบเครื่องมือ"
                  title="ปิดแถบเครื่องมือ"
                  className="flex h-7 w-7 md:h-8 md:w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200/90 bg-white/60 text-slate-500 shadow-xs transition-[transform,background-color,border-color] duration-150 hover:scale-110 hover:border-rose-400/80 hover:bg-white hover:text-rose-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-400 dark:hover:border-rose-400/60 dark:hover:text-rose-300"
                >
                  <i
                    aria-hidden="true"
                    className="fi fi-sr-cross text-[10px] md:text-xs leading-none"
                  />
                </button>
              </div>
            </div>

            {/* ─── Level 2 (T15 v2.3): SIBLING glass panel — a SEPARATE 112px glass panel (w-28), anchored to
              Level 1 with the per-position flip (`more` — away from the screen
              edge). Mobile: an in-flow full-width block inside the sheet (dots ⋯
              expands it). T25: mounts while OPEN or mid-exit (`moreClosing`) —
              pop-in 200ms spring from the ⋯ side (transform-origin per
              position) on open; pop-out 140ms + delay-unmount on close; gate
              off (animateDock off / reduced motion) → instant, no class.
              T45: the SURFACE is fixed (user-locked — bg-white/60 +
              backdrop-blur-sm, same as the L1 round buttons; the slider no
              longer drives L2), and DESKTOP L2 portals to document.body —
              the in-tree spot sits under the L1 panel's backdrop-filter,
              and Chromium's nested-bf quirk makes a bf descendant outside
              the bf ancestor's border box sample nothing (computed blur,
              no visual blur). The body-level wrapper mirrors the panel's
              padding-box rect (sync effect above) → identical geometry,
              no bf ancestor. Mobile stays in-flow inside the sheet (its
              blur works — inside the box). ──── */}
            {(moreOpen || moreClosing) &&
              (isMobile ? (
                <div
                  id="lawlib-more-panel"
                  data-lawlib-l2
                  style={{ transformOrigin: morePopOrigin }}
                  className={`${morePanelSurfaceClass} ${morePanelPlacementClass} border-slate-200 dark:border-slate-700 ${
                    moreClosing ? 'lawlib-pop-out' : animateDockNow ? 'lawlib-pop-in' : ''
                  }`}
                >
                  {morePanelContent}
                </div>
              ) : (
                createPortal(
                  <div
                    ref={l2PortalRef}
                    data-lawlib-l2-portal
                    // No transform/filter/backdrop-filter on the wrapper
                    // itself (a transform would make it a containing block;
                    // a bf would re-create the nested quirk). pointer-events-
                    // none so the overlay never intercepts the dock's own
                    // clicks — the L2 panel opts back in (pointer-events-
                    // auto, its box is fully interactive).
                    style={{ left: 0, top: 0, visibility: 'hidden' }}
                    className="pointer-events-none fixed z-50"
                  >
                    <div
                      id="lawlib-more-panel"
                      data-lawlib-l2
                      style={{ transformOrigin: morePopOrigin }}
                      className={`pointer-events-auto ${morePanelSurfaceClass} ${morePanelPlacementClass} border-slate-200 dark:border-slate-700 ${
                        moreClosing ? 'lawlib-pop-out' : animateDockNow ? 'lawlib-pop-in' : ''
                      }`}
                    >
                      {morePanelContent}
                    </div>
                  </div>,
                  document.body,
                )
              ))}
          </div>
        )}
      </div>

      {/* Pickers — anchored popovers (portal; Esc/outside close, aria-expanded) */}
      {picker !== null && (
        <PickerPopover
          anchorEl={picker.anchor}
          widthClass={
            picker.kind === 'settings'
              ? 'w-72'
              : picker.kind === 'theme'
                ? 'w-64'
                : picker.kind === 'fontSize'
                  ? 'w-60'
                  : 'w-56'
          }
          label={TOOL_LABELS[picker.kind]}
          onClose={closePicker}
        >
          {picker.kind === 'theme' && (
            <ThemePickerContent
              theme={theme}
              onSelectTheme={setTheme}
              paperTone={paperTone}
              onSetPaperTone={setPaperTone}
            />
          )}
          {picker.kind === 'fontSize' && (
            <FontSizePickerContent
              value={settings.fontSize}
              onChange={(fontSize) => setSettings((prev) => ({ ...prev, fontSize }))}
            />
          )}
          {picker.kind === 'lineHeight' && (
            <LineHeightPickerContent
              value={settings.lineHeight}
              onChange={(lineHeight) => setSettings((prev) => ({ ...prev, lineHeight }))}
            />
          )}
          {picker.kind === 'width' && (
            <WidthPickerContent
              value={settings.width}
              onChange={(width) => setSettings((prev) => ({ ...prev, width }))}
            />
          )}
          {picker.kind === 'settings' && (
            <div className="max-h-[min(60vh,30rem)] overflow-y-auto pr-0.5">
              <SettingsPanelContent
                settings={settings}
                onChange={setSettings}
                coarsePointer={coarsePointer}
                reducedMotion={
                  typeof window !== 'undefined' &&
                  window.matchMedia('(prefers-reduced-motion: reduce)').matches
                }
                onFocusModeChange={handleFocusModeChange}
                onReset={handleReset}
                dockPosition={position}
                onDockPositionChange={setDockPosition}
                theme={theme}
                setTheme={setTheme}
                paperTone={paperTone}
                setPaperTone={setPaperTone}
              />
            </div>
          )}
        </PickerPopover>
      )}
    </div>,
    document.body,
  );
}
