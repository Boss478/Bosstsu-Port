'use client';

/**
 * LawLib — dock v2 (T10a, ADR-019 D1/D2/D3/D6).
 *
 * 3-level hierarchy, ONE mechanism desktop + mobile:
 *   Level 0 · ยุบ:     single plain tools icon (no badge) at one of 8
 *                      positions (persisted `lawlib:dockPosition`).
 *   Level 1 · ขยาย:    favorite/pinned tools (favoriteToolKeys, persisted in
 *                      settings) — 4 value-showing pickers + bookmark/search/
 *                      notes + "อ่านต่อ" (when a per-slug position exists) +
 *                      "เพิ่มเติม" (Level 2).
 *   Level 2 · เพิ่มเติม: ALL tools with per-tool pin toggles + the grouped
 *                      bookmarks list + the 8-position selector.
 *
 * The panel STAYS OPEN until explicitly closed — Esc / pointerdown-outside /
 * re-click the tools icon. No auto-collapse after any action (D1). Anchor
 * flips per position: top → panel expands DOWN, bottom → UP, mid → SIDE.
 * Mobile follows the same positions with safe-area insets.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { safeGetString, safeSetString } from '@/lib/storage';
import { DOCK_TOOL_KEYS } from '@/hooks/useReaderStorage';
import type { DockToolKey, ReadingSettingsValue } from '@/app/(website)/lawlib/lib/reader-props';
import type { LawDoc } from '@/types/lawlib';
import { articleLabel, findArticleByKey } from '@/lib/lawlib-reader';
import { BookmarksPanel } from '@/components/BookmarksPanel';
import {
  FontSizePickerContent,
  LineHeightPickerContent,
  PickerPopover,
  THEME_CHOICES,
  ThemePickerContent,
  WidthPickerContent,
} from '@/components/LawlibPickers';
import type { Theme } from '@/components/ThemeProvider';

// ---------------------------------------------------------------------------
// Dock position — 8 spots (3×3 minus center), persisted `lawlib:dockPosition`
// ---------------------------------------------------------------------------

export type DockPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'mid-left'
  | 'mid-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export const DOCK_POSITIONS: readonly DockPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'mid-left',
  'mid-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const DEFAULT_DOCK_POSITION: DockPosition = 'bottom-right';

const POSITION_LABELS: Record<DockPosition, string> = {
  'top-left': 'บนซ้าย',
  'top-center': 'บนกลาง',
  'top-right': 'บนขวา',
  'mid-left': 'กลางซ้าย',
  'mid-right': 'กลางขวา',
  'bottom-left': 'ล่างซ้าย',
  'bottom-center': 'ล่างกลาง',
  'bottom-right': 'ล่างขวา',
};

/**
 * Per-position layout: `root` = the fixed wrapper spot; `panel` = the
 * expanded panel anchored to the icon with the flip (top→down, bottom→up,
 * mid→side); `panelMaxH` = viewport-safe cap (the panel scrolls past it);
 * `panelWidth` = optional per-position width override (mid-left AND mid-right
 * clamp to 100vw − icon footprint so the side-anchored panel fits 375px).
 * Bottom offsets clear BackToTop (bottom-6/10 + ~44px ≈ 84px). Top rows clear
 * the law header (24-231px, a11y fix #17): 14rem on mobile, 11rem from md up;
 * the matching panelMaxH keeps the panel fully in-viewport. Safe areas:
 * bottom/left/right insets via env(). Tailwind arbitrary values are static
 * literals here — JIT-safe.
 */
const POSITION_CONFIG: Record<
  DockPosition,
  { root: string; panel: string; panelMaxH: string; panelWidth?: string }
> = {
  'top-left': {
    root: 'top-[max(14rem,env(safe-area-inset-top))] left-[max(1rem,env(safe-area-inset-left))] md:top-[max(11rem,env(safe-area-inset-top))]',
    panel: 'top-full left-0',
    panelMaxH: 'max-h-[calc(100vh-15.5rem)] md:max-h-[calc(100vh-12.5rem)]',
  },
  'top-center': {
    root: 'top-[max(14rem,env(safe-area-inset-top))] left-1/2 -translate-x-1/2 md:top-[max(11rem,env(safe-area-inset-top))]',
    panel: 'top-full left-1/2 -translate-x-1/2',
    panelMaxH: 'max-h-[calc(100vh-15.5rem)] md:max-h-[calc(100vh-12.5rem)]',
  },
  'top-right': {
    root: 'top-[max(14rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] md:top-[max(11rem,env(safe-area-inset-top))]',
    panel: 'top-full right-0',
    panelMaxH: 'max-h-[calc(100vh-15.5rem)] md:max-h-[calc(100vh-12.5rem)]',
  },
  'mid-left': {
    root: 'top-1/2 -translate-y-1/2 left-[max(1rem,env(safe-area-inset-left))]',
    panel: 'left-full top-1/2 -translate-y-1/2',
    panelMaxH: 'max-h-[70vh]',
    // Side-anchored at the icon's right edge (1rem + 44px icon = 3.75rem):
    // the shared 92vw cap would push the panel past the viewport at 375px.
    panelWidth: 'w-[min(calc(100vw-3.75rem),26rem)]',
  },
  'mid-right': {
    root: 'top-1/2 -translate-y-1/2 right-[max(1rem,env(safe-area-inset-right))]',
    panel: 'right-full top-1/2 -translate-y-1/2',
    panelMaxH: 'max-h-[70vh]',
    // Symmetric clamp (fix #27): the expanded panel anchors 1rem from the
    // right edge (the 60px icon footprint only applies while collapsed), so
    // the shared 92vw cap at 375px portrait leaves ~14px clearance — it only
    // goes negative (~14px past the LEFT edge) in landscape with a large
    // env(safe-area-inset-right). The clamp covers both.
    panelWidth: 'w-[min(calc(100vw-3.75rem),26rem)]',
  },
  'bottom-left': {
    root: 'bottom-[max(6rem,calc(env(safe-area-inset-bottom)+1rem))] left-[max(1rem,env(safe-area-inset-left))]',
    panel: 'bottom-full left-0',
    panelMaxH: 'max-h-[calc(100vh-7.5rem)]',
  },
  'bottom-center': {
    root: 'bottom-[max(6rem,calc(env(safe-area-inset-bottom)+1rem))] left-1/2 -translate-x-1/2',
    panel: 'bottom-full left-1/2 -translate-x-1/2',
    panelMaxH: 'max-h-[calc(100vh-7.5rem)]',
  },
  'bottom-right': {
    root: 'bottom-[max(6rem,calc(env(safe-area-inset-bottom)+1rem))] right-[max(1rem,env(safe-area-inset-right))]',
    panel: 'bottom-full right-0',
    panelMaxH: 'max-h-[calc(100vh-7.5rem)]',
  },
};

function loadDockPosition(): DockPosition {
  const saved = safeGetString('lawlib:dockPosition');
  return saved !== null && (DOCK_POSITIONS as readonly string[]).includes(saved)
    ? (saved as DockPosition)
    : DEFAULT_DOCK_POSITION;
}

// ---------------------------------------------------------------------------
// Tool registry (shared by Level 1 favorites + Level 2 ALL tools)
// ---------------------------------------------------------------------------

type PickerKind = 'theme' | 'fontSize' | 'lineHeight' | 'width';
type DockPanelKind = 'search' | 'glossary' | 'notes';

const TOOL_LABELS: Record<DockToolKey, string> = {
  theme: 'ธีม',
  fontSize: 'ตัวอักษร',
  lineHeight: 'บรรทัด',
  width: 'กว้าง',
  bookmark: 'ที่คั่นหน้า',
  search: 'ค้นหามาตรา',
  notes: 'บันทึกของฉัน',
  glossary: 'บทนิยาม',
  copy: 'คัดลอกมาตรานี้',
  copyLink: 'คัดลอกลิงก์มาตรานี้',
  settings: 'ตั้งค่า',
};

const TOOL_ICONS: Record<DockToolKey, string> = {
  theme: 'fi-sr-sun',
  fontSize: 'fi-sr-italic',
  lineHeight: 'fi-sr-align-justify',
  width: 'fi-sr-expand',
  bookmark: 'fi-sr-bookmark',
  search: 'fi-sr-search',
  notes: 'fi-sr-note-sticky',
  glossary: 'fi-sr-book-bookmark',
  copy: 'fi-sr-copy',
  copyLink: 'fi-sr-link',
  settings: 'fi-sr-settings',
};

const PICKER_KEYS: readonly DockToolKey[] = ['theme', 'fontSize', 'lineHeight', 'width'];
const ACTION_PANEL_MAP: Partial<Record<DockToolKey, DockPanelKind>> = {
  search: 'search',
  glossary: 'glossary',
  notes: 'notes',
};

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
  setSettings: (next: ReadingSettingsValue) => void;
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
  /** Bookmark list in Level 2 — jump (closes the dock) / delete. */
  bookmarks: string[];
  onJump: (key: string) => void;
  onBookmarkRemove: (key: string) => void;
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
    onJump,
    onBookmarkRemove,
    bookmarks,
    escBlocked,
  } = props;

  const [expanded, setExpanded] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [picker, setPicker] = useState<{ kind: PickerKind; anchor: HTMLElement } | null>(null);
  const [position, setPosition] = useState<DockPosition>(() => loadDockPosition());

  const rootRef = useRef<HTMLDivElement | null>(null);
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  /** Level-2 "ย้อนกลับ" button — focus target when Level 2 opens (fix #1). */
  const moreBackRef = useRef<HTMLButtonElement | null>(null);
  /** Level-1 "เพิ่มเติม" button — focus target when Esc leaves Level 2. */
  const moreTriggerRef = useRef<HTMLButtonElement | null>(null);
  const pickerPortalRef = useRef<HTMLDivElement | null>(null);
  /** Open picker's trigger button — Esc from the picker restores focus here. */
  const pickerAnchorRef = useRef<HTMLElement | null>(null);

  const closeAll = useCallback(() => {
    setPicker(null);
    setMoreOpen(false);
    setExpanded(false);
    pickerAnchorRef.current = null;
  }, []);

  const closePicker = useCallback(() => setPicker(null), []);

  /** Collapse → hand focus to the collapsed tools icon. Deferred: the icon is
   *  conditionally rendered — toggleRef still points at the just-unmounted
   *  header button until the re-render lands. Shared by the Esc path and the
   *  panel X-close (focus parity). */
  const restoreFocusToOpener = useCallback(() => {
    window.setTimeout(() => {
      const opener = toggleRef.current;
      if (opener !== null && opener.isConnected) opener.focus();
    }, 0);
  }, []);

  // Stays open until explicitly closed — Esc / pointerdown-outside / re-click.
  // Esc cascades: picker first, then — when Level 2 is open — ONE press back
  // to Level 1 (focus → เพิ่มเติม), a second press closes the dock (a11y fix
  // #16). Stands down while a drawer / tooltip / compact popover owns Escape
  // (escBlocked).
  useEffect(() => {
    if (!expanded || escBlocked) return;
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
      setExpanded(false);
      restoreFocusToOpener();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expanded, escBlocked, picker, moreOpen, restoreFocusToOpener]);

  // Pointerdown-outside closes the dock — EXCEPT inside the dock root and the
  // open picker portal (both are parts of the same interaction surface).
  useEffect(() => {
    if (!expanded) return;
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target === null) return;
      if (rootRef.current?.contains(target)) return;
      if (pickerPortalRef.current?.contains(target)) return;
      closeAll();
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [expanded, closeAll]);

  // Move focus into the panel on expand (a11y — the old dock focused the
  // first action button on open, L4-1).
  useEffect(() => {
    if (!expanded) return;
    const root = rootRef.current;
    if (root === null) return;
    const first = root.querySelector<HTMLElement>('button, input');
    if (first !== null && !first.hasAttribute('disabled')) first.focus();
  }, [expanded]);

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

  const activateTool = (key: DockToolKey, anchor?: HTMLElement) => {
    if (PICKER_KEYS.includes(key)) {
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
      case 'settings':
        return; // T10b placeholder — the row renders disabled.
      default: {
        const panel = ACTION_PANEL_MAP[key];
        if (panel !== undefined) onOpenPanel(panel);
      }
    }
  };

  const toggleFavorite = (key: DockToolKey) => {
    const current = settings.favoriteToolKeys;
    const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
    setSettings({ ...settings, favoriteToolKeys: next });
  };

  const setDockPosition = (next: DockPosition) => {
    setPosition(next);
    safeSetString('lawlib:dockPosition', next);
  };

  const cfg = POSITION_CONFIG[position];
  const pickerValue: Record<PickerKind, string> = {
    theme: THEME_CHOICES.find((c) => c.value === theme)?.label ?? theme,
    fontSize: `${settings.fontSize}px`,
    lineHeight: settings.lineHeight.toFixed(1),
    // Width slider is a percentage of the 80ch baseline (user decision
    // 2026-08-06): 80-120%, default 100%.
    width: `${settings.width}%`,
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

  // --- Level 1 tool button ---------------------------------------------------

  const renderToolButton = (key: DockToolKey) => {
    const tool = TOOL_ICONS[key];
    if (PICKER_KEYS.includes(key)) {
      const kind = key as PickerKind;
      return (
        <button
          key={key}
          type="button"
          aria-haspopup="true"
          aria-expanded={picker?.kind === kind}
          onClick={(e) => togglePicker(kind, e.currentTarget)}
          className="flex min-h-11 min-w-[4.5rem] flex-1 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1.5 text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300"
        >
          <span className="flex max-w-full items-center gap-1 text-[10px] font-medium">
            <i aria-hidden="true" className={`fi ${tool} text-[9px]`} />
            <span className="truncate">{TOOL_LABELS[key]}</span>
          </span>
          <span className="flex items-center gap-0.5 text-xs font-bold tabular-nums">
            {pickerValue[kind]}
            <i aria-hidden="true" className="fi fi-sr-angle-small-down text-[8px]" />
          </span>
        </button>
      );
    }

    // Action buttons (icon-only 44px, badge where relevant).
    let badge: number | undefined;
    if (key === 'bookmark') badge = resolvedBookmarkCount;
    if (key === 'notes') badge = notesCount;
    let active = false;
    if (key === 'bookmark') active = isBookmarked;
    if (key === 'search') active = activePanel === 'search';
    if (key === 'notes') active = activePanel === 'notes';
    if (key === 'glossary') active = activePanel === 'glossary';
    const flash = key === 'copy' && copiedFlash === 'article';
    const linkFlash = key === 'copyLink' && copiedFlash === 'link';
    // Active bookmark swaps the ribbon for a check-circle — the state is
    // never color-only (WCAG 1.4.1, a11y fix #9; aria-pressed stays).
    const icon = flash || linkFlash || (key === 'bookmark' && active) ? 'fi-sr-check-circle' : tool;

    return (
      <button
        key={key}
        type="button"
        aria-label={
          badge !== undefined && badge > 0 ? `${TOOL_LABELS[key]} (${badge})` : TOOL_LABELS[key]
        }
        title={TOOL_LABELS[key]}
        aria-pressed={active}
        disabled={key === 'settings' || ((key === 'copy' || key === 'copyLink') && !canCopy)}
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

  // --- Level 2 row -----------------------------------------------------------

  const renderToolRow = (key: DockToolKey) => {
    const pinned = settings.favoriteToolKeys.includes(key);
    const isPicker = PICKER_KEYS.includes(key);
    const settingsDisabled = key === 'settings';
    const rowValue = isPicker ? pickerValue[key as PickerKind] : undefined;
    const disabled =
      settingsDisabled || (key === 'copy' && !canCopy) || (key === 'copyLink' && !canCopy);
    return (
      <li key={key} className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={(e) => activateTool(key, e.currentTarget)}
          className={`flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-lg border px-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
            isPicker && picker?.kind === key
              ? 'border-blue-400 bg-blue-50 dark:border-blue-500/60 dark:bg-blue-950/50'
              : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800/60'
          }`}
        >
          <i
            aria-hidden="true"
            className={`fi ${TOOL_ICONS[key]} text-xs ${
              settingsDisabled
                ? 'text-slate-500 dark:text-slate-500'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          />
          <span className="flex-1 truncate text-xs font-medium text-slate-700 dark:text-slate-200">
            {TOOL_LABELS[key]}
            {settingsDisabled && (
              <span className="ml-1 text-[10px] text-slate-400">(เร็วๆ นี้)</span>
            )}
          </span>
          {rowValue !== undefined && (
            <span className="text-xs font-bold tabular-nums text-slate-500 dark:text-slate-400">
              {rowValue}
            </span>
          )}
          {isPicker && (
            <i
              aria-hidden="true"
              className={`fi fi-sr-angle-small-down text-[9px] text-slate-500 ${picker?.kind === key ? 'rotate-180' : ''}`}
            />
          )}
        </button>
        <button
          type="button"
          onClick={() => toggleFavorite(key)}
          aria-pressed={pinned}
          aria-label={`${pinned ? 'ถอด' : 'ปักหมุด'} ${TOOL_LABELS[key]}${pinned ? ' (อยู่แถวหลัก)' : ' ไปแถวหลัก'}`}
          title={pinned ? 'ถอดออกจากแถวหลัก' : 'ปักหมุดไปแถวหลัก'}
          // Disabled rows (settings/copy-without-target) get a disabled pin —
          // a live toggle on a dead row is a dead end (fix #21).
          disabled={disabled}
          className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
            pinned
              ? 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500/60 dark:bg-blue-950/50 dark:text-blue-300'
              : 'border-slate-200 bg-white text-slate-500 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:text-blue-300'
          }`}
        >
          <i aria-hidden="true" className="fi fi-sr-pin text-xs leading-none" />
        </button>
      </li>
    );
  };

  return (
    <div ref={rootRef} className={`lawlib-dock fixed z-50 ${cfg.root}`}>
      {!expanded ? (
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setExpanded(true)}
          aria-label="เครื่องมืออ่าน"
          aria-expanded={false}
          aria-haspopup="dialog"
          aria-controls="lawlib-dock-panel"
          title="เครื่องมืออ่าน"
          className="lawlib-dock flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white/75 text-slate-600 shadow-lg backdrop-blur-md transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/75 dark:text-slate-300 dark:hover:text-white"
        >
          <i aria-hidden="true" className="fi fi-sr-sliders-h text-sm leading-none" />
        </button>
      ) : (
        <div
          id="lawlib-dock-panel"
          role="dialog"
          aria-modal="false"
          aria-label="เครื่องมืออ่าน"
          className={`lawlib-dock absolute ${cfg.panel} ${cfg.panelMaxH} ${cfg.panelWidth ?? 'w-[min(92vw,26rem)]'} overflow-y-auto rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-2xl backdrop-blur-lg dark:border-slate-700 dark:bg-slate-900/90`}
        >
          {/* Panel header — the tools icon re-click collapses (D1) */}
          <div className="mb-1.5 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5 dark:border-slate-800">
            <button
              type="button"
              ref={toggleRef}
              onClick={() => closeAll()}
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
              onClick={() => {
                closeAll();
                restoreFocusToOpener();
              }}
              aria-label="ปิดแถบเครื่องมือ"
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:text-white"
            >
              <i aria-hidden="true" className="fi fi-sr-cross text-[10px]" />
            </button>
          </div>

          {!moreOpen ? (
            // ─── Level 1 — favorites + เพิ่มเติม ───────────────────────────
            <div className="flex flex-col gap-1.5">
              {resumeVisible && (
                <button
                  type="button"
                  onClick={() => {
                    closeAll();
                    onResume();
                  }}
                  className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-2 text-xs font-semibold text-amber-800 transition-colors hover:border-amber-400 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-amber-500/50 dark:bg-amber-950/40 dark:text-amber-200"
                >
                  <i aria-hidden="true" className="fi fi-sr-time-past text-xs" />
                  อ่านต่อ: {resumeLabel}
                </button>
              )}
              <div className="flex flex-wrap gap-1.5">
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
                  className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300"
                >
                  <i aria-hidden="true" className="fi fi-sr-apps text-xs" />
                  เพิ่มเติม
                  <i aria-hidden="true" className="fi fi-sr-angle-small-right text-[9px]" />
                </button>
              </div>
            </div>
          ) : (
            // ─── Level 2 — ALL tools + pins + bookmarks + position ─────────
            <div id="lawlib-more-panel" className="flex flex-col gap-2">
              <button
                ref={moreBackRef}
                data-more-back
                type="button"
                onClick={() => setMoreOpen(false)}
                className="flex min-h-11 w-fit cursor-pointer items-center gap-1 rounded-lg px-1 text-xs font-medium text-slate-500 transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:text-blue-300"
              >
                <i aria-hidden="true" className="fi fi-sr-angle-left text-[10px]" />
                ย้อนกลับ
              </button>
              <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                เครื่องมือทั้งหมด
              </h2>
              <ul className="space-y-1">{DOCK_TOOL_KEYS.map((key) => renderToolRow(key))}</ul>

              <div
                aria-hidden="true"
                className="h-px w-full shrink-0 bg-slate-200 dark:bg-slate-700"
              />
              <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                ที่คั่นหน้า ({resolvedBookmarkCount})
              </h2>
              <BookmarksPanel
                law={law}
                keys={bookmarks}
                onNavigate={(key) => {
                  closeAll();
                  onJump(key);
                }}
                onRemove={onBookmarkRemove}
              />

              <div
                aria-hidden="true"
                className="h-px w-full shrink-0 bg-slate-200 dark:bg-slate-700"
              />
              <h2 className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                ตำแหน่งปุ่มเครื่องมือ
              </h2>
              <div
                role="group"
                aria-label="ตำแหน่งปุ่มเครื่องมือ"
                className="grid grid-cols-3 gap-1"
              >
                {DOCK_POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    type="button"
                    aria-pressed={position === pos}
                    aria-label={`ตำแหน่ง${POSITION_LABELS[pos]}`}
                    title={POSITION_LABELS[pos]}
                    onClick={() => setDockPosition(pos)}
                    className={`flex h-11 cursor-pointer items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      position === pos
                        ? 'border-blue-400 bg-blue-50 text-blue-600 dark:border-blue-500/60 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:text-blue-300'
                    }`}
                  >
                    <i aria-hidden="true" className="fi fi-sr-circle-small text-[10px]" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pickers — anchored popovers (portal; Esc/outside close, aria-expanded) */}
      {picker !== null && (
        <PickerPopover
          anchorEl={picker.anchor}
          widthClass={
            picker.kind === 'theme' ? 'w-64' : picker.kind === 'fontSize' ? 'w-60' : 'w-56'
          }
          label={TOOL_LABELS[picker.kind]}
          onClose={closePicker}
          registerPortalEl={(el) => {
            pickerPortalRef.current = el;
          }}
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
              onChange={(fontSize) => setSettings({ ...settings, fontSize })}
            />
          )}
          {picker.kind === 'lineHeight' && (
            <LineHeightPickerContent
              value={settings.lineHeight}
              onChange={(lineHeight) => setSettings({ ...settings, lineHeight })}
            />
          )}
          {picker.kind === 'width' && (
            <WidthPickerContent
              value={settings.width}
              onChange={(width) => setSettings({ ...settings, width })}
            />
          )}
        </PickerPopover>
      )}
    </div>
  );
}
