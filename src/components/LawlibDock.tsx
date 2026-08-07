'use client';

/**
 * LawLib — dock v2.2 (T14, ADR-019 D1/D2/D3/D6/D9/D10).
 *
 * 3-level hierarchy, ONE mechanism desktop + mobile:
 *   Level 0 · ยุบ:     single plain tools icon (no badge) at one of 8
 *                      positions (persisted `lawlib:dockPosition`).
 *   Level 1 · ขยาย:    OPEN BY DEFAULT on reader mount (T12 — desktop panel
 *                      or mobile bottom sheet; reversed D1's default-
 *                      collapsed). T14 layout: the 4 pickers show their ICON
 *                      with the CURRENT VALUE as a tiny label beneath
 *                      (ธีม = icon ONLY — sun/moon/book/palette glyphs
 *                      reflect the state); actions (bookmark/search/notes/
 *                      อ่านต่อ/เพิ่มเติม) are icon-only 44px buttons.
 *                      favoriteToolKeys (persisted in settings) + the
 *                      per-slug อ่านต่อ (when a position exists) + เพิ่มเติม
 *                      (Level 2).
 *   Level 2 · เพิ่มเติม: T14 icon-only 2-row grid — row 1 = the Level-1
 *                      favorite set, row 2 = the rest (glossary · bookmarks-
 *                      ALL · copy · copy-link · ⚙️ settings) + ย้อนกลับ.
 *                      NO section titles / text rows / pin toggles (pin
 *                      management moved into the ⚙️ settings panel —
 *                      เครื่องมือแถวลัด). bookmarks-all opens the bookmarks
 *                      PANEL (converted from the old L2 section).
 *
 * The panel closes ONLY via Esc / the ย่อ collapse button / the X button
 * (D9 — pointerdown-outside no longer closes the DOCK panel; the picker
 * POPOVERS keep their own Esc/outside close). A user collapse persists
 * `lawlib:dockCollapsed` → the next visit starts collapsed. Anchor flips per
 * position: top → panel expands DOWN, bottom → UP, mid → SIDE. Mobile
 * (≤639px) renders a full-width bottom sheet, open per default. Expansion
 * is direction-aware (T12): side positions = vertical Level-1 column +
 * 2-col Level-2 grid; middle positions = horizontal row + horizontal grid.
 * Expand/collapse animates (150ms slide+fade, settings.animateDock +
 * prefers-reduced-motion gate).
 */
import { useCallback, useEffect, useRef, useState } from 'react';
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
 * expanded panel anchored to the icon with the flip (top→down, bottom→up,
 * mid→side); `panelMaxH` = viewport-safe cap (the panel scrolls past it);
 * `panelWidth` = optional per-position width override (mid-left AND mid-right
 * clamp to 100vw − icon footprint so the side-anchored panel fits 375px).
 * `layout` (T12 — ADR-019 D9, direction-aware expansion): side positions
 * (L/R × top/mid/bot) = VERTICAL Level-1 column + Level-2 two-column grid;
 * middle positions (top-center/bottom-center) = HORIZONTAL Level-1 row +
 * Level-2 horizontal grid. Mobile (≤639px) always renders the bottom-sheet
 * horizontal layout, open by default.
 * Bottom offsets clear BackToTop (bottom-6/10 + ~44px ≈ 84px). Top rows clear
 * the law header (24-231px, a11y fix #17): 14rem on mobile, 11rem from md up;
 * the matching panelMaxH keeps the panel fully in-viewport. Safe areas:
 * bottom/left/right insets via env().
 *
 * T10b toolbar-size parametrization (ADR-019 D4 — the slider is 24-56,
 * default 44): the ICON footprint (--lawlib-dock-size, set inline on the
 * dock root from settings.toolbarSize) enters every calc:
 *   - panelWidth mid-*: 100vw − icon − 1rem side gutter
 *   - panelMaxH top-*:  100vh − icon − anchor offset − bottom margin
 *   - panelMaxH bottom-*: 100vh − (icon + 3.25rem bottom offset) − top margin
 *   - bottom roots: max(icon + 3.25rem, 5.25rem floor — BackToTop clearance)
 * The `max()` floors keep small sizes from colliding with BackToTop/header;
 * the calcs use underscored arbitrary values (Tailwind converts _ → space —
 * calc REQUIRES spaces around -). All literals are static — JIT-safe.
 */
type DockLayout = 'vertical' | 'horizontal';

const POSITION_CONFIG: Record<
  DockPosition,
  { root: string; panel: string; panelMaxH: string; panelWidth?: string; layout: DockLayout }
> = {
  'top-left': {
    root: 'top-[max(14rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] md:top-[max(11rem,env(safe-area-inset-top))]',
    panel: 'top-full left-0',
    panelMaxH:
      'max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_15rem)] md:max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_12rem)]',
    layout: 'vertical',
  },
  'top-center': {
    root: 'top-[max(14rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 md:top-[max(11rem,env(safe-area-inset-top))]',
    panel: 'top-full left-1/2 -translate-x-1/2',
    panelMaxH:
      'max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_15rem)] md:max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_12rem)]',
    layout: 'horizontal',
  },
  'top-right': {
    root: 'top-[max(14rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] md:top-[max(11rem,env(safe-area-inset-top))]',
    panel: 'top-full right-0',
    panelMaxH:
      'max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_15rem)] md:max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_12rem)]',
    layout: 'vertical',
  },
  'mid-left': {
    root: 'top-1/2 -translate-y-1/2 left-[max(1rem,env(safe-area-inset-left))]',
    panel: 'left-full top-1/2 -translate-y-1/2',
    panelMaxH: 'max-h-[70vh]',
    // Side-anchored at the icon's right edge (1rem + icon footprint): the
    // shared 92vw cap would push the panel past the viewport at 375px.
    panelWidth: 'w-[min(calc(100vw_-_var(--lawlib-dock-size)_-_1rem),26rem)]',
    layout: 'vertical',
  },
  'mid-right': {
    root: 'top-1/2 -translate-y-1/2 right-[max(1rem,env(safe-area-inset-right))]',
    panel: 'right-full top-1/2 -translate-y-1/2',
    panelMaxH: 'max-h-[70vh]',
    // Symmetric clamp (fix #27): the expanded panel anchors 1rem from the
    // right edge (the icon footprint only applies while collapsed), so the
    // shared 92vw cap at 375px portrait leaves ~14px clearance — it only
    // goes negative (~14px past the LEFT edge) in landscape with a large
    // env(safe-area-inset-right). The clamp covers both.
    panelWidth: 'w-[min(calc(100vw_-_var(--lawlib-dock-size)_-_1rem),26rem)]',
    layout: 'vertical',
  },
  'bottom-left': {
    root: 'bottom-[max(calc(var(--lawlib-dock-size)_+_3.25rem),5.25rem,calc(env(safe-area-inset-bottom)_+_1rem))] left-[max(1rem,env(safe-area-inset-left))]',
    panel: 'bottom-full left-0',
    panelMaxH: 'max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_4.75rem)]',
    layout: 'vertical',
  },
  'bottom-center': {
    root: 'bottom-[max(calc(var(--lawlib-dock-size)_+_3.25rem),5.25rem,calc(env(safe-area-inset-bottom)_+_1rem))] left-1/2 -translate-x-1/2',
    panel: 'bottom-full left-1/2 -translate-x-1/2',
    panelMaxH: 'max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_4.75rem)]',
    layout: 'horizontal',
  },
  'bottom-right': {
    root: 'bottom-[max(calc(var(--lawlib-dock-size)_+_3.25rem),5.25rem,calc(env(safe-area-inset-bottom)_+_1rem))] right-[max(1rem,env(safe-area-inset-right))]',
    panel: 'bottom-full right-0',
    panelMaxH: 'max-h-[calc(100vh_-_var(--lawlib-dock-size)_-_4.75rem)]',
    layout: 'vertical',
  },
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
 *  favoriteToolKeys are filtered OUT of row 2 (row 1 = the favorites). */
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
  /** Exit-animation hold: while true the panel stays mounted (animating out)
   *  before the state flips to collapsed. */
  const [closing, setClosing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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

  const rootRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  /** Level-2 "ย้อนกลับ" button — focus target when Level 2 opens (fix #1). */
  const moreBackRef = useRef<HTMLButtonElement | null>(null);
  /** Level-1 "เพิ่มเติม" button — focus target when Esc leaves Level 2. */
  const moreTriggerRef = useRef<HTMLButtonElement | null>(null);
  /** Open picker's trigger button — Esc from the picker restores focus here. */
  const pickerAnchorRef = useRef<HTMLElement | null>(null);

  /** T12 — dock expand/collapse animation gate: settings.animateDock AND
   *  no system reduced-motion preference. */
  const animateDockNow = settings.animateDock && !prefersReducedMotion;

  /** Collapse → hand focus to the collapsed tools icon. Deferred: the icon is
   *  conditionally rendered — toggleRef still points at the just-unmounted
   *  header button until the re-render lands (or, with the exit animation,
   *  until the 150ms closing hold ends). Shared by the Esc path and the
   *  panel X/ย่อ close (focus parity). */
  const restoreFocusToOpener = useCallback(() => {
    window.setTimeout(() => {
      const opener = toggleRef.current;
      if (opener !== null && opener.isConnected) opener.focus();
    }, 0);
  }, []);

  /** Programmatic close (focus mode / resume / bookmark jump): INSTANT, no
   *  animation, no collapse-state persistence (the user did not collapse). */
  const closeAllInstant = useCallback(() => {
    setPicker(null);
    setMoreOpen(false);
    setExpanded(false);
    pickerAnchorRef.current = null;
  }, []);

  /** USER-initiated collapse (Esc at Level 1 / ย่อ button / X button):
   *  persists `lawlib:dockCollapsed` + plays the exit animation when
   *  enabled (150ms slide+fade — the panel stays mounted while `closing`).
   *  Focus restore is deferred past the re-render so the collapsed icon
   *  exists to receive it. */
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
   *  can close from Level 2 directly), then collapses with animation. */
  const userClose = useCallback(
    (restoreFocus: boolean) => {
      setPicker(null);
      setMoreOpen(false);
      pickerAnchorRef.current = null;
      collapseByUser(restoreFocus);
    },
    [collapseByUser],
  );

  /** User EXPAND — clears the collapse memory (next visit opens). */
  const expandByUser = useCallback(() => {
    safeSetString(DOCK_COLLAPSED_KEY, 'false');
    setExpanded(true);
  }, []);

  const closePicker = useCallback(() => setPicker(null), []);

  // Stays open until explicitly closed — Esc / ย่อ / X only (T12 D9).
  // Esc cascades: picker first, then — when Level 2 is open — ONE press back
  // to Level 1 (focus → เพิ่มเติม), a second press closes the dock (a11y fix
  // #16). Stands down while a drawer / tooltip / compact popover owns Escape
  // (escBlocked) AND while focus mode hides the dock (body.lawlib-focus
  // display:none — its Esc must exit focus mode via the READER's handler,
  // never collapse/persist the hidden dock; the dock starts OPEN now, so the
  // old "unreachable handler" assumption no longer holds). The final Esc
  // collapses the whole dock (persisted).
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
        // Level 2 → Level 1. Deferred: เพิ่มเติม remounts on the re-render.
        setMoreOpen(false);
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
  }, [expanded, escBlocked, settings.focusMode, picker, moreOpen, userClose]);

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
  const animClass = animateDockNow
    ? closing
      ? `lawlib-dock-anim-out-${animDir}`
      : `lawlib-dock-anim-in-${animDir}`
    : '';
  /** T12 glass: Level 1 + collapsed icon = transparent glass-2 override
   *  (slider alpha + blur-xs + sheen); Level 2 = glass-3 (opaque-ish). */
  const panelSurfaceClass = moreOpen
    ? 'lawlib-glass-strong lawlib-glass-sheen'
    : 'lawlib-glass lawlib-glass-xs lawlib-glass-sheen';
  /** T12 mobile bottom sheet (full-width, safe-area bottom inset) vs the
   *  anchored desktop panel (per-position flip + width cap). */
  const panelPlacementClass = isMobile
    ? 'fixed inset-x-0 bottom-0 max-h-[min(65vh,34rem)] overflow-y-auto rounded-t-2xl border-t p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl'
    : `absolute ${cfg.panel} ${cfg.panelMaxH} overflow-y-auto rounded-2xl border p-2 shadow-2xl ${cfg.panelWidth ?? 'w-[min(92vw,26rem)]'}`;

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

  const renderToolButton = (key: DockToolKey) => {
    if (PICKER_KEYS.includes(key) || key === 'settings') {
      const kind = key === 'settings' ? 'settings' : (key as PickerKind);
      const icon =
        key === 'theme'
          ? (THEME_CHOICES.find((c) => c.value === theme)?.icon ?? 'fi-sr-sun')
          : TOOL_ICONS[key];
      // The accessible name carries the tool + CURRENT value (the value is
      // also visible under the icon — except theme/settings, icon-only).
      const accessibleName = `${TOOL_LABELS[key]} ${pickerValue[kind]}`;
      return (
        <button
          key={key}
          type="button"
          aria-label={accessibleName}
          title={TOOL_LABELS[key]}
          aria-haspopup="true"
          aria-expanded={picker?.kind === kind}
          onClick={(e) => togglePicker(kind, e.currentTarget)}
          className="relative flex min-h-11 min-w-11 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300"
        >
          <i aria-hidden="true" className={`fi ${icon} text-sm leading-none`} />
          {key !== 'theme' && key !== 'settings' && (
            <span className="text-[10px] font-bold leading-none tabular-nums">
              {pickerValue[kind]}
            </span>
          )}
          {/* T12: non-default value dot (always on — a tiny blue dot in the
              top-right corner; the button itself stays the boundary). */}
          {key !== 'settings' && pickerIsNonDefault[kind] && (
            <span
              aria-hidden="true"
              className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-500"
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
    return false;
  };
  const toolGlyph = (key: DockMoreToolKey, active: boolean): string => {
    const flash = key === 'copy' && copiedFlash === 'article';
    const linkFlash = key === 'copyLink' && copiedFlash === 'link';
    return flash || linkFlash || (key === 'bookmark' && active)
      ? 'fi-sr-check-circle'
      : TOOL_ICONS[key];
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
        aria-pressed={active}
        disabled={(key === 'copy' || key === 'copyLink') && !canCopy}
        onClick={() => activateTool(key)}
        className={`relative flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
          active
            ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/50 dark:text-blue-300'
            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300'
        }`}
      >
        <i aria-hidden="true" className={`fi ${icon} text-xs leading-none`} />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </button>
    );
  };

  // --- Level 2 icon-only grid button (T14 — ADR-019 D10) ---------------------
  // PURE icon 44px squares: no text rows, no pin toggles. Pickers open their
  // popover (anchor = the icon); actions act directly; copy/copy-link disable
  // without a target article. Active states mirror Level 1.

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
        aria-pressed={active}
        aria-haspopup={isPicker ? 'true' : undefined}
        aria-expanded={isPicker ? pickerOpen : undefined}
        disabled={(key === 'copy' || key === 'copyLink') && !canCopy}
        onClick={(e) => activateTool(key, e.currentTarget)}
        className={`relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
          pickerOpen || active
            ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/50 dark:text-blue-300'
            : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300'
        }`}
      >
        <i aria-hidden="true" className={`fi ${icon} text-xs leading-none`} />
      </button>
    );
  };

  return (
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
      className={`lawlib-dock fixed z-50 ${cfg.root}`}
    >
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
          className="lawlib-dock lawlib-glass lawlib-glass-xs lawlib-glass-sheen flex h-[var(--lawlib-dock-size)] w-[var(--lawlib-dock-size)] cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-600 shadow-lg transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white"
        >
          <i aria-hidden="true" className="fi fi-sr-sliders-h text-sm leading-none" />
        </button>
      ) : (
        <div
          id="lawlib-dock-panel"
          role="dialog"
          aria-modal="false"
          aria-label="เครื่องมืออ่าน"
          className={`lawlib-dock ${panelSurfaceClass} ${panelPlacementClass} border-slate-200 dark:border-slate-700 ${animClass}`}
        >
          {/* Panel header — the ย่อ/X close controls are VISIBLE on Level 1
              (T12 scrutiny fix; the shared header renders for both levels). */}
          <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
            <button
              type="button"
              ref={toggleRef}
              onClick={() => userClose(true)}
              aria-label="ย่อแถบเครื่องมือ"
              aria-expanded={true}
              title="ย่อแถบเครื่องมือ"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-blue-400 bg-blue-50 text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-500/60 dark:bg-blue-950/50 dark:text-blue-300"
            >
              <i aria-hidden="true" className="fi fi-sr-sliders-h text-xs leading-none" />
            </button>
            <p className="min-w-0 flex-1 text-xs font-bold text-slate-700 dark:text-slate-200">
              เครื่องมืออ่าน
            </p>
            <button
              type="button"
              onClick={() => userClose(true)}
              aria-label="ปิดแถบเครื่องมือ"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:text-white"
            >
              <i aria-hidden="true" className="fi fi-sr-cross text-[10px]" />
            </button>
          </div>

          {!moreOpen ? (
            // ─── Level 1 (T14 — ADR-019 D10): icon+value pickers, icon-only
            // actions, อ่านต่อ + เพิ่มเติม (direction-aware: side positions =
            // vertical column, middle/mobile = horizontal row) ──────────────
            <div className="flex flex-col gap-1.5">
              <div
                className={`flex gap-1.5 ${
                  effectiveLayout === 'vertical' ? 'flex-col' : 'flex-wrap'
                }`}
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
                    className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-amber-300 bg-amber-50 text-amber-800 transition-colors hover:border-amber-400 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200"
                  >
                    <i aria-hidden="true" className="fi fi-sr-time-past text-sm leading-none" />
                  </button>
                )}
                {settings.favoriteToolKeys.map((key) => renderToolButton(key))}
                <button
                  ref={moreTriggerRef}
                  type="button"
                  onClick={() => {
                    setMoreOpen(true);
                    // Focus moves to ย้อนกลับ — the Level swap must not drop
                    // focus to <body> (deferred: the button mounts on the
                    // re-render, a11y fix #1).
                    window.setTimeout(() => {
                      const back = moreBackRef.current;
                      if (back !== null && back.isConnected) back.focus();
                    }, 0);
                  }}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                  aria-controls="lawlib-more-panel"
                  aria-label="เพิ่มเติม"
                  title="เพิ่มเติม"
                  className="flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300"
                >
                  <i aria-hidden="true" className="fi fi-sr-apps text-sm leading-none" />
                </button>
              </div>
            </div>
          ) : (
            // ─── Level 2 (T14 — ADR-019 D10): icon-only 2-row grid —
            // row 1 = the Level-1 favorite set, row 2 = the rest (glossary ·
            // bookmarks-ALL · copy · copy-link · ⚙️ settings) + ย้อนกลับ.
            // NO section titles / text rows / pin toggles (the favorites
            // editor lives in the ⚙️ settings picker; the position selector
            // too — T12c). Direction-aware: vertical layout = 2-col grid per
            // row; horizontal = 3-col from sm up (mobile sheet = 2 cols). ──
            <div id="lawlib-more-panel" className="flex flex-col gap-1.5">
              {settings.favoriteToolKeys.length > 0 && (
                <>
                  <ul
                    className={
                      effectiveLayout === 'vertical'
                        ? 'grid grid-cols-2 gap-1'
                        : 'grid grid-cols-2 gap-1 sm:grid-cols-3'
                    }
                  >
                    {settings.favoriteToolKeys.map((key) => (
                      <li key={key}>{renderMoreIconButton(key)}</li>
                    ))}
                  </ul>
                  <div
                    aria-hidden="true"
                    className="h-px w-full shrink-0 bg-slate-200 dark:bg-slate-700"
                  />
                </>
              )}
              <ul
                className={
                  effectiveLayout === 'vertical'
                    ? 'grid grid-cols-2 gap-1'
                    : 'grid grid-cols-2 gap-1 sm:grid-cols-3'
                }
              >
                {MORE_REST_KEYS.filter(
                  (key) => !settings.favoriteToolKeys.some((k) => k === key),
                ).map((key) => (
                  <li key={key}>{renderMoreIconButton(key)}</li>
                ))}
                <li>
                  <button
                    ref={moreBackRef}
                    data-more-back
                    type="button"
                    onClick={() => setMoreOpen(false)}
                    aria-label="ย้อนกลับ"
                    title="ย้อนกลับ"
                    className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:border-blue-300 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:text-blue-300"
                  >
                    <i aria-hidden="true" className="fi fi-sr-angle-left text-xs leading-none" />
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      )}

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
                onFocusModeChange={(focusMode) => {
                  setSettings((prev) => ({ ...prev, focusMode }));
                  if (focusMode) {
                    // The dock is part of what focus mode hides — close it
                    // so the panel/picker don't float alone (instant — a
                    // programmatic close must NOT persist dockCollapsed).
                    closeAllInstant();
                  }
                }}
                onReset={handleReset}
                dockPosition={position}
                onDockPositionChange={setDockPosition}
              />
            </div>
          )}
        </PickerPopover>
      )}
    </div>
  );
}
