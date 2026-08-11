'use client';

/**
 * LawLib — reader state hub (Wave 2, lane B2 — sole owner).
 *
 * Receives `law: LawDoc` from the server page (via LawlibReaderShell, the
 * ssr:false boundary). Owns: active article, tooltip (useLawTooltip), open
 * panel, settings/bookmarks/notes/highlights (useReaderStorage — D1 lane),
 * deep-link hash handling (FR2), last-position restore (FR10), jump wiring.
 *
 * Leaf panels (SearchPanel/GlossaryPanel/EditionTimeline + useReaderStorage)
 * are built by the D1 lane against the frozen props contract in
 * `(website)/lawlib/lib/reader-props.ts`. Reading settings live in the dock
 * (LawlibDock + LawlibPickers) — the old ReadingSettings.tsx was deleted
 * 2026-08-06 (senior review of 28d6bae: dead code, stale ch-scale contract).
 */

import {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import type { LawDoc } from '@/types/lawlib';
import type { DigestView, RenderLine } from '@/lib/lawlib/digest-view';
import { digestHasCard } from '@/lib/lawlib/digest-view';
import { normalizeNfc, normalizeThaiDigits } from '@/lib/lawlib/normalize';
import {
  articleKeyOf,
  articleLabel,
  articlePlainText,
  findArticleByKey,
  firstTermArticleKey,
  flattenArticles,
  formatVerifiedAt,
} from '@/lib/lawlib-reader';
import { copyArticle, copyText } from '@/lib/copy-print';
import {
  useLawTooltip,
  type TooltipContent,
  type TooltipTriggerHandlers,
} from '@/hooks/useLawTooltip';
import type { Note } from '@/hooks/useReaderStorage';
import ArticleView from '@/components/ArticleView';
import TocSidebar from '@/components/TocSidebar';
import LawTooltip, { type LawTooltipHub } from '@/components/LawTooltip';
import { SearchPanel } from '@/components/SearchPanel';
import { GlossaryPanel } from '@/components/GlossaryPanel';
import { EditionTimeline } from '@/components/EditionTimeline';
import { BookmarksPanel } from '@/components/BookmarksPanel';
import {
  useReaderStorage,
  SETTINGS_CHANGED_EVENT,
  loadGlobalSettings,
} from '@/hooks/useReaderStorage';
import type { ReaderViewMode } from '@/hooks/useReaderStorage';
import type { ReaderFontFamily } from '@/app/(website)/lawlib/lib/reader-props';
import { useTheme } from '@/components/ThemeProvider';
import LawlibDock from '@/components/LawlibDock';
import { motionExitHoldMs, paraSpacingFromLineHeight } from '@/components/LawlibPickers';
import type { DigestSearchLine } from '@/app/(website)/lawlib/lib/reader-props';
import CompactView, { BodyLineView } from './CompactView';

// ---------------------------------------------------------------------------
// DigestHistoryBlock — merged per-edition history (user 2026-08-05): the
// digest's "ประวัติการแก้ไข" section renders in the law HEADER (both FULL and
// COMPACT views, no mode switch needed), replacing the JSON EditionTimeline
// on digest pages. Data = the md's merged section 2 (ฉบับที่ N: ประกาศ/มีผล/
// ผู้รับสนองฯ/เหตุผล/แก้ไข). Collapsed by default like the timeline.
// ---------------------------------------------------------------------------

function DigestHistoryBlock({
  lines,
  slug,
  onOpenRef,
  onSeeFull,
  getTriggerProps,
  isTooltipOpen,
  tooltipId,
}: {
  lines: RenderLine[];
  slug: string;
  onOpenRef: (key: string) => void;
  onSeeFull: (key: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
  tooltipId: string;
}) {
  const [open, setOpen] = useState(false);
  const editionCount = lines.filter(
    (l) =>
      l.kind === 'text' && l.tokens.some((t) => t.kind === 'text' && /^ฉบับที่ \d+/.test(t.text)),
  ).length;

  return (
    <div className="lawlib-timeline">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="lawlib-digest-history-list"
        className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-blue-300"
      >
        <i aria-hidden="true" className="fi fi-sr-clock text-xs text-slate-400" />
        ประวัติการแก้ไข ({editionCount} ฉบับ)
        <i
          aria-hidden="true"
          className={`fi fi-sr-angle-small-down text-xs transition-transform duration-200 ease-ios-spring ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {/* T36 (ADR-024 D3 — user-approved D2 exception): expand/collapse
          animates height BOTH directions via grid-template-rows 0fr ↔ 1fr
          400ms --ease-ios-out on the ALWAYS-RENDERED wrapper (mirrors the
          T35 group pattern in CompactView). `aria-controls` now points at an
          always-present node (a11y improvement — no dead reference while
          collapsed). The inner overflow-hidden min-h-0 div owns the
          content: lawlib-fade-rise 150ms (class present ONLY while open —
          a class re-add restarts the animation on the SAME node) and
          `inert` while collapsed (a11y/focus removal — inert does not
          block the grid animation, hidden would). Collapse animates too
          (1fr→0fr, no instant hidden). RM: the reduced-motion kill zeroes
          transition-duration → instant. */}
      <div
        className="grid"
        style={{
          gridTemplateRows: open ? '1fr' : '0fr',
          // T42 (ADR-025 D2): inline durations ride --motion-factor.
          transition:
            'grid-template-rows calc(400ms * var(--motion-factor, 1)) var(--ease-ios-out)',
        }}
      >
        <div id="lawlib-digest-history-list" inert={!open} className="min-h-0 overflow-hidden">
          <div
            // T50 (ADR-026 W2): BodyLineView's own leading-relaxed was
            // STRIPPED so digest-body p's inherit the compact wrapper's
            // inline lineHeight. This header block is OUTSIDE that wrapper
            // — the wrapper class carries the old 1.625 so the history
            // look is byte-identical (p's inherit it, as before).
            className={`mt-3 space-y-2 leading-relaxed ${open ? 'lawlib-fade-rise' : ''}`}
            style={
              open ? { animationDuration: 'calc(150ms * var(--motion-factor, 1))' } : undefined
            }
          >
            {lines.map((line) =>
              line.kind !== 'article' ? (
                <BodyLineView
                  key={line.id}
                  line={line}
                  slug={slug}
                  onOpenRef={onOpenRef}
                  onSeeFull={onSeeFull}
                  getTriggerProps={getTriggerProps}
                  isTooltipOpen={isTooltipOpen}
                  tooltipId={tooltipId}
                  interactive={false}
                />
              ) : null,
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Local panel components (notes list / bookmarks list — reader-core
// territory; the four leaf panels above are D1's)
// ---------------------------------------------------------------------------

const PANEL_LABELS = {
  search: 'ค้นหามาตรา',
  glossary: 'บทนิยาม',
  notes: 'บันทึกของฉัน',
  // T14 (ADR-019 D10): bookmarks-ALL is a PANEL like search/notes (converted
  // from the dock's old Level-2 section — the L1 bookmark button stays the
  // in-place toggle + count badge).
  bookmarks: 'ที่คั่นหน้าทั้งหมด',
} as const;

type PanelKind = keyof typeof PANEL_LABELS;

/** T30 (ADR-023 D9 row 4): drawer slide + overlay — 400ms. Doubles as the
 *  exit-hold window (closing state → delay-unmount). */
const DRAWER_ANIM_MS = 400;
/** T30 (AC-2): the search-results stagger completes at 420ms (last of the
 *  cap-8 delays) + 300ms (lawlib-fade-rise) — the session-gate class is
 *  stripped 800ms after the first results batch so later keystroke
 *  re-mounts (clear-and-retype) never re-animate (flicker trap). A
 *  post-staging re-filter strips the class EARLIER still — immediately,
 *  in the observer microtask (wave-2 fix) — this timer is the fallback
 *  when no further mutation follows. */
const SEARCH_STAGGER_STRIP_MS = 800;
/** T30 (ADR-023 D9 row 19): auto-scroll chip fade-rise 150ms — also the
 *  exit-hold window (closing state → delay-unmount). */
const CHIP_ANIM_MS = 150;

/**
 * T10a numeric typography (ADR-019 D4): fontSize 8-32px / width 80-120% of
 * the 80ch baseline (user decision 2026-08-06) are applied via CSS CUSTOM
 * PROPERTIES (--lawlib-font-size / --lawlib-width) set on the reader root +
 * the static arbitrary-value classes below — the compact view (CompactView —
 * frozen, do-not-touch) receives them as class strings, and Tailwind JIT can
 * only generate complete literal classes.
 */
const FONT_SIZE_CLASS = 'text-[length:var(--lawlib-font-size)]';
const WIDTH_CLASS = 'max-w-[length:var(--lawlib-width)]';

/** T10b font family CSS values (ADR-019 D4). Sarabun/Mali resolve through
 *  the EXISTING next/font/local vars (hashed families — re-@font-face would
 *  double-download, senior MAJOR #4); the 3 new families are raw @font-face
 *  names (globals.css) that download ONLY when selected. */
const FONT_FAMILY_CSS: Record<ReaderFontFamily, string> = {
  sarabun: 'var(--font-sarabun)',
  'noto-sans-thai': "'Noto Sans Thai'",
  mali: 'var(--font-mali)',
  'bai-jamjuree': "'Bai Jamjuree'",
  itim: "'Itim'",
};

/**
 * '#มาตรา-10' | '#มาตรา-10ทวิ' | '#มาตรา-10/1' → article key ('10'…).
 *
 * Browsers percent-encode the hash (#%E0%B8%A1...-10), so matching the raw
 * string against '#มาตรา-' always fails — DECODE first (try/catch → null),
 * then match, then normalize the remainder (Thai digits + NFC).
 */
function parseHashToKey(hash: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(hash);
  } catch {
    return null;
  }
  const PREFIX = '#มาตรา-';
  if (!decoded.startsWith(PREFIX)) return null;
  const norm = normalizeThaiDigits(normalizeNfc(decoded.slice(PREFIX.length)));
  return norm !== '' ? norm : null;
}

function NotesPanel({
  notes,
  currentKey,
  labelOf,
  onAdd,
  onUpdate,
  onDelete,
  onClearHighlights,
  hasHighlights,
}: {
  notes: Note[];
  currentKey: string | null;
  labelOf: (key: string) => string;
  onAdd: (articleKey: string, text: string) => void;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onClearHighlights: (articleKey: string) => void;
  hasHighlights: (articleKey: string) => boolean;
}) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  const add = () => {
    const text = draft.trim();
    if (currentKey === null || text === '') return;
    onAdd(currentKey, text);
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 p-3 dark:border-slate-700">
        <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
          บันทึกสำหรับมาตรา:
          <span className="ml-1 font-semibold text-slate-700 dark:text-slate-200">
            {currentKey !== null ? labelOf(currentKey) : '—'}
          </span>
        </p>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          aria-label="จดบันทึกสำหรับมาตรานี้"
          placeholder="จดโน้ตสำหรับมาตรานี้…"
          className="w-full resize-y rounded-lg border border-slate-200 bg-white p-2 text-sm leading-relaxed text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        />
        <button
          type="button"
          onClick={add}
          disabled={currentKey === null || draft.trim() === ''}
          className="mt-2 cursor-pointer rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          เพิ่มบันทึก
        </button>
      </div>

      {notes.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
          ยังไม่มีบันทึก — เลือกมาตราแล้วจดบันทึกไว้ทบทวนได้
        </p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => {
            const editing = editingId === note.id;
            return (
              <li
                key={note.id}
                className="rounded-xl border border-slate-200 p-3 dark:border-slate-700"
              >
                <p className="mb-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                  {labelOf(note.articleKey)}
                </p>
                {editing ? (
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    aria-label="จดบันทึกสำหรับมาตรานี้"
                    className="w-full rounded-lg border border-slate-200 bg-white p-2 text-sm leading-relaxed text-slate-700 focus:border-blue-400 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  />
                ) : (
                  <p className="text-sm leading-relaxed whitespace-pre-line text-slate-700 dark:text-slate-200">
                    {note.text}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-1.5">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          if (editText.trim() !== '') onUpdate(note.id, editText.trim());
                          setEditingId(null);
                        }}
                        className="cursor-pointer rounded-md bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
                      >
                        บันทึก
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="cursor-pointer rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      >
                        ยกเลิก
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(note.id);
                          setEditText(note.text);
                        }}
                        className="cursor-pointer rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(note.id)}
                        className="cursor-pointer rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-300"
                      >
                        ลบ
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
        <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
          ไฮไลต์ข้อความ (เก็บในเครื่องนี้เท่านั้น)
        </p>
        {currentKey !== null && hasHighlights(currentKey) && (
          <button
            type="button"
            onClick={() => onClearHighlights(currentKey)}
            className="cursor-pointer rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
          >
            ล้างไฮไลต์ของ {labelOf(currentKey)}
          </button>
        )}
        <p className="mt-1.5 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
          เลือกข้อความในมาตราเพื่อไฮไลต์ — ข้อมูลเก็บในเครื่องเท่านั้น
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reader client
// ---------------------------------------------------------------------------

export default function LawlibReaderClient({
  law,
  digestView,
}: {
  law: LawDoc;
  digestView: DigestView | null;
}) {
  const { theme, setTheme, paperTone, setPaperTone } = useTheme();
  const {
    settings,
    setSettings,
    view: storedView,
    setView: persistView,
    bookmarks,
    toggleBookmark,
    lastPosition,
    savePosition,
    notes,
    addNote,
    updateNote,
    deleteNote,
    highlights,
    addHighlight,
    removeHighlight,
  } = useReaderStorage(law.slug);

  // --- FULL/COMPACT view state (rev 5.5) ------------------------------------
  // Chain: URL `?view=` param (mount) wins → per-slug stored key → default
  // 'compact' when a digest exists, else 'full' (FR2, D11). Client-only tree.
  const [viewMode, setViewMode] = useState<ReaderViewMode>(() => {
    if (typeof window === 'undefined') return digestView !== null ? 'compact' : 'full';
    const param = new URLSearchParams(window.location.search).get('view');
    if (param === 'compact' || param === 'full') return param;
    return storedView ?? (digestView !== null ? 'compact' : 'full');
  });
  /** Derived at render — no-digest laws force FULL (FR3, mid-session safe). */
  const effectiveView: ReaderViewMode = digestView == null ? 'full' : viewMode;
  /** Expanded compact card article key + how it started (Track E: the hover
   *  source is gone — clicks/interaction only; the type is kept as the honest
   *  open-mode record for CompactView/ArticlePopover). */
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [expandedSource, setExpandedSource] = useState<'interaction' | null>(null);
  /** openCardPopover 50ms token (Track E NIT): ANY close (Esc / X / toggle)
   *  bumps it, so a pending open that fires after the close is a no-op — Esc
   *  within the 50ms window can never re-open the popover. */
  const openCardPopoverTokenRef = useRef(0);
  /** Collapsed chapter groups (first group starts expanded — legacy behavior). */
  const [collapsedGroups, setCollapsedGroups] = useState<ReadonlySet<string>>(() => {
    const all: string[] = [];
    for (const s of digestView?.sections ?? []) {
      for (const g of s.groups ?? []) all.push(g.id);
    }
    const collapsed = new Set(all.slice(1)); // first group expanded
    return collapsed;
  });
  /** sr-only view-switch announcement (loop-4 #2) — set in the toggle handler only. */
  const [statusText, setStatusText] = useState('');
  /** Digest-search line flash target — applied DIRECTLY to the DOM element
   *  by handleDigestLineJump (transient visual; no state threading). */
  const flashLineTimerRef = useRef<number | null>(null);
  /** Last-interacted compact card member key (data-lawlib-member) — Esc / X
   *  popover close restores focus to its button (plan v6; hidden-guard
   *  fallback → first member). Set in member onClick + openCardPopover. */
  const lastMemberKeyRef = useRef<string | null>(null);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<PanelKind | null>(null);
  /** T30 (ADR-023 D9) — exit-animation hold (T29 moreClosing pattern): while
   *  true the drawer stays mounted playing the mirrored slide-out + overlay
   *  fade (400ms) before unmounting. Esc closes INSTANT (keyboard skip —
   *  T28/T29 parity); reduced-motion → instant (AC-4, JS gate). */
  const [panelClosing, setPanelClosing] = useState(false);
  /** T30 — the exit-hold timer. Tracked in a ref so a re-open can CANCEL a
   *  pending exit — a stale timer must never unmount a re-opened drawer
   *  (ADR-023 D4, T29 pattern). */
  const panelCloseTimerRef = useRef<number | null>(null);
  /** T30 (AC-3) — auto-scroll chip exit-hold (same pattern as panelClosing:
   *  stays mounted playing the reversed fade while speed is already 0,
   *  unmounts after CHIP_ANIM_MS). Reduced-motion → instant (AC-4). */
  const [chipClosing, setChipClosing] = useState(false);
  const chipCloseTimerRef = useRef<number | null>(null);
  /** T30 (AC-3) — chip level-pop trigger: a speed value CHANGE while the
   *  chip is live re-adds lawlib-chip-pop. Cleared by a TIMER (CHIP_ANIM_MS)
   *  rather than onAnimationEnd — browsers can skip the event (background-
   *  tab animation throttling) and a stale class would silently kill every
   *  later re-pop (the class must leave for the next re-add to replay). */
  const [chipPop, setChipPop] = useState(false);
  const chipPopTimerRef = useRef<number | null>(null);
  /** Skip the pop on the chip's FIRST mount (entry = fade-rise only); pop
   *  fires on subsequent speed changes (ระดับ pop — AC-3). Doubles as the
   *  "chip was live at least once" gate for the exit-hold. */
  const chipPoppedOnceRef = useRef(false);
  const flashTimerRef = useRef<number | null>(null);
  const [copiedFlash, setCopiedFlash] = useState<'article' | 'link' | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  // --- drawer focus management (modal dialog): the opening toolbar button
  //     (focus restore target) + the drawer root (first-focus + Tab trap).
  const openPanelButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const {
    tooltip,
    openTooltip,
    closeTooltip,
    isTooltipOpen,
    getTriggerProps,
    registerTooltipEl,
    handleTooltipPointerLeave,
    openedByKeyboard,
    pinned,
    tooltipId,
    closing,
  } = useLawTooltip();

  const flat = useMemo(() => flattenArticles(law), [law]);
  const articles = useMemo(() => flat.map((f) => f.article), [flat]);
  const noteKeySet = useMemo(() => new Set(notes.map((n) => n.articleKey)), [notes]);
  const bookmarkKeySet = useMemo(() => new Set(bookmarks), [bookmarks]);

  /** Terms defined but absent from every article text → glossary rows disabled. */
  const missingTerms = useMemo(() => {
    const missing = new Set<string>();
    for (const d of law.definitions) {
      if (firstTermArticleKey(law, d.term) === null) missing.add(d.term);
    }
    return missing;
  }, [law]);

  const labelOf = useCallback(
    (key: string) => {
      const hit = findArticleByKey(law, key);
      return hit !== undefined ? articleLabel(hit.article.no, hit.article.suffix) : key;
    },
    [law],
  );

  // --- digest search index (rev 5.5): lines + line→group maps --------------
  const digestLines = useMemo<DigestSearchLine[] | undefined>(() => {
    if (digestView == null) return undefined;
    const out: DigestSearchLine[] = [];
    // Section 0 (ข้อมูลกฎหมาย) is header-only — never rendered in the body —
    // so its lines are not searchable (no dead jumps); the merged history
    // section 1 IS rendered (header block) and stays searchable.
    for (const [si, s] of digestView.sections.entries()) {
      if (si === 0) continue;
      const lines = [...s.lines, ...(s.groups ?? []).flatMap((g) => g.lines)];
      for (const l of lines) {
        const toks = l.kind === 'article' ? l.parts.flatMap((p) => p.tokens) : l.tokens;
        const text = toks
          .filter((t) => t.kind === 'text' || t.kind === 'term')
          .map((t) => (t.kind === 'text' ? t.text : t.term))
          .join('');
        if (text.trim() === '') continue;
        out.push({ id: l.id, section: s.heading, text });
      }
    }
    return out;
  }, [digestView]);

  /** line id → chapter group id (digest-search jump auto-expands — loop-4 #6). */
  const lineGroupMap = useMemo(() => {
    const m = new Map<string, string>();
    if (digestView == null) return m;
    for (const s of digestView.sections) {
      for (const g of s.groups ?? []) {
        for (const l of g.lines) m.set(l.id, g.id);
      }
    }
    return m;
  }, [digestView]);

  /** article key → chapter group id (jump-to-card expands a collapsed group).
   *  Merged cards map EVERY member key → the card's group (user 2026-08-05). */
  const cardGroupMap = useMemo(() => {
    const m = new Map<string, string>();
    if (digestView == null) return m;
    for (const s of digestView.sections) {
      for (const g of s.groups ?? []) {
        for (const l of g.lines) {
          if (l.kind !== 'article') continue;
          for (const k of l.keys ?? [l.key]) m.set(k, g.id);
        }
      }
    }
    return m;
  }, [digestView]);

  /** member key → card key (plan v6): EVERY member of a merged card maps to
   *  the card's key (first member); single cards map to themselves. Covers
   *  flat sections AND chapter groups. Drives openCardPopover — a tooltip or
   *  body-ref for member '12' of a "มาตรา 11 - มาตรา 12" card resolves to
   *  card '11'. */
  const memberToCardMap = useMemo(() => {
    const m = new Map<string, string>();
    if (digestView == null) return m;
    for (const s of digestView.sections) {
      for (const l of s.lines) {
        if (l.kind !== 'article') continue;
        for (const k of l.keys ?? [l.key]) m.set(k, l.key);
      }
      for (const g of s.groups ?? []) {
        for (const l of g.lines) {
          if (l.kind !== 'article') continue;
          for (const k of l.keys ?? [l.key]) m.set(k, l.key);
        }
      }
    }
    return m;
  }, [digestView]);

  // --- FULL/COMPACT view helpers (rev 5.5) ----------------------------------
  const reducedMotionNow = () =>
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- T30 drawer open/close helpers (ADR-023 D9 row 4) --------------------
  // Animated close = mirrored slide-out + overlay fade + delay-unmount
  // (closing state). Pointer closes animate; Esc closes INSTANT (keyboard
  // skip — T28/T29 parity) and reduced-motion skips the hold (AC-4).
  // T42 — the hold also scales with the motion tier (disable instant / fast
  // halved — motionExitHoldMs, shared with the picker + chip).
  const closePanel = useCallback(
    (instant = false) => {
      if (openPanel === null || panelClosing) return;
      const holdMs = motionExitHoldMs(DRAWER_ANIM_MS);
      if (instant || reducedMotionNow() || holdMs <= 0) {
        setOpenPanel(null);
        return;
      }
      setPanelClosing(true);
      panelCloseTimerRef.current = window.setTimeout(() => {
        panelCloseTimerRef.current = null;
        setPanelClosing(false);
        setOpenPanel(null);
      }, holdMs);
    },
    [openPanel, panelClosing],
  );

  /** Open a drawer panel. The pending-exit cancel lives in the openPanel
   *  layout effect below (fires pre-paint) — the close timer ref is NEVER
   *  read inside a render-time callback (react-hooks/refs: tooltipHub
   *  passes these through a render-time IIFE). */
  const openPanelSafe = useCallback((panel: PanelKind) => {
    setOpenPanel(panel);
  }, []);

  // Cancel a pending exit the moment a panel (re)opens. LAYOUT (pre-paint):
  // the flip to `panelClosing=false` must land before the browser paints
  // the re-opened drawer, or the reversed slide-out would flash for a
  // frame. Invariant: panelClosing ⟺ a close timer is pending, so the
  // ref guard alone covers the reset (T29 re-open pattern).
  useLayoutEffect(() => {
    if (openPanel === null) return;
    if (panelCloseTimerRef.current !== null) {
      window.clearTimeout(panelCloseTimerRef.current);
      panelCloseTimerRef.current = null;
      setPanelClosing(false);
    }
  }, [openPanel]);

  // Unmount — a pending exit timer must never outlive the reader.
  useEffect(() => {
    return () => {
      if (panelCloseTimerRef.current !== null) {
        window.clearTimeout(panelCloseTimerRef.current);
        panelCloseTimerRef.current = null;
      }
    };
  }, []);

  const updateViewUrl = (mode: ReaderViewMode) => {
    const url =
      mode === 'compact'
        ? `${window.location.pathname}?view=compact${window.location.hash}`
        : `${window.location.pathname}?view=full${window.location.hash}`;
    window.history.replaceState(null, '', url);
  };

  /** Switch view: state + per-slug storage + URL (+ scroll/announce opts). */
  const switchView = useCallback(
    (mode: ReaderViewMode, opts?: { scrollTop?: boolean; announce?: boolean }) => {
      setViewMode(mode);
      persistView(mode);
      updateViewUrl(mode);
      if (opts?.scrollTop === true) {
        window.scrollTo({ top: 0, behavior: reducedMotionNow() ? 'auto' : 'smooth' });
      }
      if (opts?.announce === true) {
        setStatusText(mode === 'compact' ? 'สลับเป็นเวอร์ชันย่อ' : 'สลับเป็นฉบับเต็ม');
      }
    },
    [persistView],
  );

  /** Explicit toggle (radio group). Entering compact resets the active article. */
  /** Programmatic close (X / Esc / view switch / seefull): clear the popover
   *  + active article (no popover = no dock copy target, D6). Click-pinned
   *  semantics (plan v6): the popover stays open until X / Esc / toggling
   *  another card — no hover auto-close. Bumps the openCardPopover token so a
   *  pending 50ms open never re-opens a just-closed popover (Track E NIT). */
  const collapseCard = useCallback(() => {
    openCardPopoverTokenRef.current++;
    setExpandedKey(null);
    setExpandedSource(null);
    setActiveKey(null);
  }, []);

  const handleSetView = useCallback(
    (mode: ReaderViewMode) => {
      if (mode === effectiveView) return;
      if (mode === 'compact') {
        setActiveKey(null);
        collapseCard();
      }
      switchView(mode, { scrollTop: true, announce: true });
    },
    [effectiveView, switchView, collapseCard],
  );

  /** Click-pinned toggle (Track E — the 'hover' source is dead, plan v6):
   *  every call is an interaction. Closes any open tooltip FIRST (loop-1
   *  BLOCKER: no tooltip/popover overlap, no touch bottom-sheet flash) and
   *  remembers the clicked member for Esc/X focus restore. activeKey = the
   *  MEMBER key when available (parity with openCardPopover, Track E #3).
   *  Toggling CLOSED also bumps the openCardPopover token (a click on the
   *  same card within the 50ms window must not re-open the popover). */
  const handleToggleCard = useCallback(
    (key: string, memberKey?: string) => {
      closeTooltip();
      if (memberKey !== undefined) lastMemberKeyRef.current = memberKey;
      setExpandedKey((prev) => (prev === key ? null : key));
      setExpandedSource((prev) => (prev === key ? null : 'interaction'));
      setActiveKey((prev) => (prev === key ? null : (memberKey ?? key)));
      if (expandedKey === key) openCardPopoverTokenRef.current++;
    },
    [closeTooltip, expandedKey],
  );

  // --- jump target: scroll + temporary highlight + hash + position ----------
  const realNavigateTo = useCallback((key: string, opts?: { instant?: boolean }) => {
    const el = document.getElementById(`มาตรา-${key}`);
    if (el === null) return;
    const behavior = opts?.instant === true || reducedMotionNow() ? 'auto' : 'smooth';
    el.scrollIntoView({ behavior, block: 'start' });
    setActiveKey(key);
    if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
    setFlashKey(key);
    flashTimerRef.current = window.setTimeout(() => {
      setFlashKey((k) => (k === key ? null : k));
      flashTimerRef.current = null;
    }, 2200);
    const hash = `#มาตรา-${key}`;
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash);
  }, []);

  /** Compact jump-to-card: auto-expand a collapsed group, scroll + flash. */
  const scrollToCard = useCallback(
    (key: string) => {
      const groupId = cardGroupMap.get(key);
      if (groupId !== undefined) {
        setCollapsedGroups((prev) => {
          if (!prev.has(groupId)) return prev;
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });
      }
      window.setTimeout(
        () => {
          // Merged cards: `data-lawlib-card` = the FIRST member key;
          // `data-lawlib-card-members` = ALL member keys (space-separated →
          // the `~=` attribute selector matches any member).
          const el = document.querySelector<HTMLElement>(
            `[data-lawlib-card="${CSS.escape(key)}"], [data-lawlib-card-members~="${CSS.escape(key)}"]`,
          );
          if (el === null) return;
          el.scrollIntoView({ behavior: reducedMotionNow() ? 'auto' : 'smooth', block: 'start' });
          setActiveKey(key);
          if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
          setFlashKey(key);
          flashTimerRef.current = window.setTimeout(() => {
            setFlashKey((k) => (k === key ? null : k));
            flashTimerRef.current = null;
          }, 2200);
        },
        // 50ms: the group-expand render must commit BEFORE the scroll — at 0ms
        // the card is still `hidden` (display:none) and scrollIntoView no-ops
        // (deep-link fresh-load QA, 2026-08-05).
        50,
      );
    },
    [cardGroupMap],
  );

  /** View-aware jump (FR7/D5): compact + card → scroll card (no hash write);
   *  compact + no card → switch FULL then DEFERRED real jump (DOM commit). */
  const navigateTo = useCallback(
    (key: string, opts?: { instant?: boolean }) => {
      if (effectiveView === 'compact' && digestView !== null && digestHasCard(digestView, key)) {
        scrollToCard(key);
        return;
      }
      if (effectiveView === 'compact') {
        switchView('full');
        window.setTimeout(() => realNavigateTo(key, opts), 0);
        return;
      }
      realNavigateTo(key, opts);
    },
    [effectiveView, digestView, scrollToCard, switchView, realNavigateTo],
  );

  /** Unified compact popover-open router (plan v6): member key → card key →
   *  auto-expand a collapsed group (mirroring scrollToCard) → 50ms (the
   *  expand render must commit) → scroll the card into view → open its
   *  popover + remember the member for Esc/X focus restore. NO flash — the
   *  popover IS the feedback. `scrollToCard` stays scroll-only (chips /
   *  bookmarks / mount-restore — v4#5 preserved). */
  const openCardPopover = useCallback(
    (memberKey: string) => {
      const cardKey = memberToCardMap.get(memberKey) ?? memberKey;
      const groupId = cardGroupMap.get(cardKey);
      if (groupId !== undefined) {
        setCollapsedGroups((prev) => {
          if (!prev.has(groupId)) return prev;
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });
      }
      // Track E NIT (50ms race): the token is bumped by EVERY close path
      // (collapseCard / toggle-close / unmount) — if Esc or X lands inside
      // the 50ms window, the pending timeout becomes a no-op and the popover
      // stays closed.
      const token = ++openCardPopoverTokenRef.current;
      window.setTimeout(() => {
        if (openCardPopoverTokenRef.current !== token) return;
        // Merged cards: `data-lawlib-card` = the FIRST member key;
        // `data-lawlib-card-members` = ALL member keys (space-separated →
        // the `~=` attribute selector matches any member).
        const el = document.querySelector<HTMLElement>(
          `[data-lawlib-card="${CSS.escape(cardKey)}"], [data-lawlib-card-members~="${CSS.escape(cardKey)}"]`,
        );
        if (el === null) return;
        el.scrollIntoView({ behavior: reducedMotionNow() ? 'auto' : 'smooth', block: 'start' });
        setExpandedKey(cardKey);
        setExpandedSource('interaction');
        lastMemberKeyRef.current = memberKey;
        setActiveKey(memberKey);
      }, 50);
    },
    [memberToCardMap, cardGroupMap],
  );

  /** Esc / X focus restore (plan v6): return focus to the last-interacted
   *  member button (data-lawlib-member) inside the just-closed card. Hidden
   *  guard (T36, senior MAJOR-2): a collapsed group is `inert` + grid 0fr —
   *  its members KEEP a non-null offsetParent (the grid retains layout
   *  boxes), so the old `offsetParent !== null` test could not see the
   *  collapse and would focus an inert member (no-op). Test focus-tree
   *  membership instead: a member inside an `[inert]` subtree is skipped →
   *  fall back to the card's FIRST member button (focus() on an inert
   *  element is a no-op — acceptable). Compact-only; FULL never restores
   *  here. */
  const restoreMemberFocus = useCallback((cardKey: string) => {
    window.setTimeout(() => {
      const card = document.querySelector<HTMLElement>(
        `[data-lawlib-card="${CSS.escape(cardKey)}"]`,
      );
      if (card === null) return;
      const memberKey = lastMemberKeyRef.current;
      let target: HTMLElement | null = null;
      if (memberKey !== null) {
        const el = card.querySelector<HTMLElement>(
          `[data-lawlib-member="${CSS.escape(memberKey)}"]`,
        );
        if (el !== null && el.closest('[inert]') === null) target = el;
      }
      if (target === null) target = card.querySelector<HTMLElement>('[data-lawlib-member]');
      target?.focus();
    }, 0);
  }, []);

  /** X-close path: close the popover then restore focus to the last member
   *  (Esc has its own handler — same restore helper). */
  const handleCollapseCard = useCallback(() => {
    const cardKey = expandedKey;
    collapseCard();
    if (effectiveView !== 'compact' || cardKey === null) return;
    restoreMemberFocus(cardKey);
  }, [expandedKey, collapseCard, effectiveView, restoreMemberFocus]);

  /** Body-ref unified routing (plan v6 + Track E BLOCKER): compact + card →
   *  popover; else the jump rule (navigateTo: FULL jump / compact-no-card →
   *  FULL switch). The memberToCardMap check (NOT digestHasCard) is the
   *  card-presence test — a merged member ('12' of "มาตรา 11 - มาตรา 12")
   *  routes to ITS card's popover instead of falling to FULL. */
  const handleOpenRef = useCallback(
    (key: string) => {
      if (effectiveView === 'compact' && memberToCardMap.has(key)) {
        openCardPopover(key);
        return;
      }
      navigateTo(key);
    },
    [effectiveView, memberToCardMap, openCardPopover, navigateTo],
  );

  /** ดูฉบับเต็ม / seefull: switch to FULL + jump at that มาตรา. */
  const handleSeeFull = useCallback(
    (key: string) => {
      collapseCard();
      switchView('full');
      window.setTimeout(() => realNavigateTo(key), 0);
    },
    [collapseCard, switchView, realNavigateTo],
  );

  /** Digest-search line jump: close panel → defer → auto-expand group → scroll
   *  center → focus (non-visual cue) → flash (loop-4 #6). */
  const handleDigestLineJump = useCallback(
    (id: string) => {
      closePanel();
      const groupId = lineGroupMap.get(id);
      if (groupId !== undefined) {
        setCollapsedGroups((prev) => {
          if (!prev.has(groupId)) return prev;
          const next = new Set(prev);
          next.delete(groupId);
          return next;
        });
      }
      if (flashLineTimerRef.current !== null) window.clearTimeout(flashLineTimerRef.current);
      // Direct-DOM line flash: a transient visual, applied straight to the
      // target element (no prop-threading through the nested card tree — the
      // state-driven approach was observed to never reach the card DOM in dev,
      // QA 2026-08-05). Focus/scroll stay deferred until the group expands.
      // 50ms: the group-expand render must commit before the scroll (same
      // display:none race as scrollToCard, QA 2026-08-05).
      window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el === null) return;
        el.scrollIntoView({ block: 'center', behavior: reducedMotionNow() ? 'auto' : 'smooth' });
        el.focus({ preventScroll: true });
        if (!reducedMotionNow()) {
          // T31 (AC-4) — ring pulse alongside the flash: 1 iteration. A
          // re-jump inside the 2s window restarts it (a class re-add alone
          // won't re-run a finished animation — T26 reflow pattern).
          const wasPulsing = el.classList.contains('lawlib-flash-pulse');
          el.classList.add('lawlib-dline-flash');
          if (wasPulsing) {
            el.classList.remove('lawlib-flash-pulse');
            void el.offsetWidth;
          }
          el.classList.add('lawlib-flash-pulse');
          flashLineTimerRef.current = window.setTimeout(() => {
            el.classList.remove('lawlib-dline-flash', 'lawlib-flash-pulse');
            flashLineTimerRef.current = null;
          }, 2000);
        }
      }, 50);
    },
    [lineGroupMap, closePanel],
  );

  // --- post-hydration: hash deep link (FR2) / last position (FR10) ----------
  // Mount-time values are captured once via lazy ref init (client-only tree,
  // ssr:false) so the effect itself stays dependency-free — no rule disables.
  // rev 5.5 (loop-1 #1): `viewAtMount` is captured too — on a fresh COMPACT
  // load, `getElementById('มาตรา-…')` is null (no article rendered yet), so
  // restore/deep links resolve through the JUMP RULE instead (card → scroll
  // card; no card → FULL + deferred jump); the firstKey default is suppressed
  // in compact (activeKey stays null — D6). The HASH is deliberately NOT
  // captured here: on a full load with `#มาตรา-N` the router may still be
  // applying it, and a stale mount-time read would let the last-position
  // restore scroll elsewhere AND clobber the deep link via replaceState. It
  // is read fresh inside the setTimeout(0) callback instead, when the router
  // has settled.
  const mountDataRef = useRef<{
    restoreKey: string | null;
    firstKey: string | null;
    viewAtMount: ReaderViewMode;
    /** The URL carried an explicit `?view=` param at mount (T9 — the
     *  compact→FULL auto-switch below must NOT override an explicit user
     *  choice: `?view=compact#มาตรา-N` with no digest card stays compact). */
    explicitViewParam: boolean;
  } | null>(null);
  if (mountDataRef.current === null) {
    mountDataRef.current = {
      restoreKey: lastPosition,
      firstKey: flat[0] !== undefined ? articleKeyOf(flat[0].article) : null,
      viewAtMount: effectiveView,
      explicitViewParam:
        typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('view'),
    };
  }

  useEffect(() => {
    const { restoreKey, firstKey, viewAtMount, explicitViewParam } = mountDataRef.current as {
      restoreKey: string | null;
      firstKey: string | null;
      viewAtMount: ReaderViewMode;
      explicitViewParam: boolean;
    };
    // State writes are deferred out of the effect body (compiler rule).
    const timer = window.setTimeout(() => {
      // Deep-link hash read HERE — by now the router has applied it, so a
      // full load with #มาตรา-N beats the stored last position.
      const hashKey = parseHashToKey(window.location.hash);
      const target = hashKey ?? restoreKey;

      if (target !== null) {
        if (viewAtMount === 'compact' && digestView !== null && digestHasCard(digestView, target)) {
          // card-first jump: scroll to the digest card (no hash write)
          scrollToCard(target);
          return;
        }
        if (viewAtMount === 'compact' && !explicitViewParam) {
          // No digest card for the target + NO explicit `?view=` in the URL
          // → the stored view default (compact) gives way to the jump rule:
          // FULL + deferred real jump. With an explicit `?view=compact` the
          // user's choice is RESPECTED — no auto-switch (T9; the target is
          // simply unreachable as a card, and the hash is left unclobbered).
          switchView('full');
          window.setTimeout(() => realNavigateTo(target), 0);
          return;
        }
        if (document.getElementById(`มาตรา-${target}`) !== null) {
          const el = document.getElementById(`มาตรา-${target}`);
          el?.scrollIntoView({ behavior: 'auto', block: 'start' });
          setActiveKey(target);
          setFlashKey(target);
          flashTimerRef.current = window.setTimeout(() => {
            setFlashKey((k) => (k === target ? null : k));
            flashTimerRef.current = null;
          }, 2200);
          // The hash is written ONLY for a genuine last-position restore (the
          // URL is STILL hash-less at this point) — never clobber a deep-link
          // hash with a stale restore.
          if (hashKey === null && window.location.hash === '') {
            window.history.replaceState(null, '', `#มาตรา-${target}`);
          }
        }
      } else if (firstKey !== null && viewAtMount !== 'compact') {
        // No deep link / nothing to restore — default to the first article so
        // prev/next + bookmark-current are usable immediately (FULL only —
        // compact keeps activeKey null until a card is expanded, D6).
        setActiveKey(firstKey);
      }
    }, 0);
    return () => window.clearTimeout(timer);
    // All referenced callbacks/props are mount-stable (the shell keys the
    // reader by law.slug — remount per law) — the effect still runs once.
  }, [digestView, realNavigateTo, scrollToCard, switchView]);

  // Deep links clicked while reading (#มาตรา-N) — hashchange.
  useEffect(() => {
    const onHashChange = () => {
      const k = parseHashToKey(window.location.hash);
      if (k === null) return;
      window.setTimeout(() => navigateTo(k), 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [navigateTo]);

  // Cleanup the flash timers on unmount.
  useEffect(
    () => () => {
      if (flashTimerRef.current !== null) window.clearTimeout(flashTimerRef.current);
      if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
      if (flashLineTimerRef.current !== null) window.clearTimeout(flashLineTimerRef.current);
      // Track E NIT: any pending openCardPopover 50ms open dies with the reader.
      openCardPopoverTokenRef.current++;
    },
    [],
  );

  // --- lawlib-immersive body hook (P6): navbar hidden on reader pages; the
  //     class is set post-hydration (client-only tree) and cleaned up on
  //     unmount (applies to both FULL and COMPACT views).
  useEffect(() => {
    document.body.classList.add('lawlib-immersive');
    return () => document.body.classList.remove('lawlib-immersive');
  }, []);

  // --- drawer (modal) focus management ---------------------------------------
  // Open → focus the first focusable inside the dialog (fallback: the dialog
  // itself); Esc → close; close → restore focus to the opening toolbar button.
  useEffect(() => {
    if (openPanel === null) return;
    const root = drawerRef.current;
    if (root === null) return;
    // T9 (a11y #10): the search panel's whole purpose is the query field —
    // land focus THERE, not on the close button (the drawer header is first
    // in DOM order).
    if (openPanel === 'search') {
      const input = root.querySelector<HTMLInputElement>('#lawlib-search-input');
      if (input !== null && !input.hasAttribute('disabled')) {
        input.focus();
        return;
      }
    }
    const first = root.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (first !== null && !first.hasAttribute('disabled')) first.focus();
    else root.querySelector<HTMLElement>('[role="dialog"]')?.focus();
  }, [openPanel]);

  useEffect(() => {
    if (openPanel !== null) return;
    const opener = openPanelButtonRef.current;
    // preventScroll: the drawer close must NOT cancel the in-flight smooth
    // scroll (a plain focus() would yank the viewport back to the opener).
    if (opener !== null && opener.isConnected) opener.focus({ preventScroll: true });
    openPanelButtonRef.current = null;
  }, [openPanel]);

  useEffect(() => {
    if (openPanel === null && expandedKey === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Precedence (loop-4 #4): panel drawer > expanded card.
      if (openPanel !== null) {
        // T30 — keyboard closes are INSTANT (T28/T29 parity: no exit hold).
        closePanel(true);
        return;
      }
      if (expandedKey !== null) {
        collapseCard();
        // Restore focus to the last-clicked member button (hidden-guard →
        // first-member fallback) — deferred until the collapsed state
        // commits (plan v6). Compact-only; FULL has no expanded card.
        if (effectiveView === 'compact') restoreMemberFocus(expandedKey);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [openPanel, expandedKey, collapseCard, effectiveView, restoreMemberFocus, closePanel]);

  // --- T30 (AC-2): search-results stagger (60ms cap 8) — session-gated ----
  // The results <ul> lives inside SearchPanel (out of scope) and
  // `lawlib-stagger` targets DIRECT children, so a MutationObserver adds
  // the class to the FIRST results <ul>(s) of each search session (panel
  // open). The class is stripped once the stagger has played
  // (SEARCH_STAGGER_STRIP_MS) — and IMMEDIATELY on the first post-staging
  // mutation (wave-2 fix: the debounced keystroke re-filter committing new
  // result nodes within the window must NOT re-animate). The strip lands
  // in the observer microtask, BEFORE the browser paints, so freshly
  // inserted nodes never show a stagger. Either way the observer
  // disconnects — the session gate is spent (even clear-and-retype never
  // re-adds, flicker trap). Per-session by construction: panel close
  // unmounts the uls and the cleanup clears the observer; the next open
  // re-arms it. RM: the global kill zeroes duration+delay — the strip
  // stays harmless.
  useEffect(() => {
    if (openPanel !== 'search') return;
    const root = drawerRef.current;
    if (root === null) return;
    let stripTimer: number | null = null;
    const observer = new MutationObserver(() => {
      const lists = root.querySelectorAll<HTMLUListElement>('ul');
      if (stripTimer !== null) {
        // Already staged → this mutation is a keystroke re-filter
        // committing new nodes: strip NOW (same tick, pre-paint) and
        // end the session gate.
        window.clearTimeout(stripTimer);
        stripTimer = null;
        for (const ul of lists) ul.classList.remove('lawlib-stagger');
        observer.disconnect();
        return;
      }
      let staged = false;
      for (const ul of lists) {
        if (ul.children.length === 0 || ul.classList.contains('lawlib-stagger')) continue;
        ul.classList.add('lawlib-stagger');
        staged = true;
      }
      if (!staged) return;
      stripTimer = window.setTimeout(() => {
        stripTimer = null;
        for (const ul of lists) ul.classList.remove('lawlib-stagger');
        observer.disconnect();
      }, SEARCH_STAGGER_STRIP_MS);
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      if (stripTimer !== null) window.clearTimeout(stripTimer);
    };
  }, [openPanel]);

  // --- persist last-read position (FR10) on article change ------------------
  useEffect(() => {
    if (activeKey === null) return;
    savePosition(activeKey);
  }, [activeKey, savePosition]);

  // --- text selection → highlight (FR14 render + storage wiring) ------------
  const handleArticleMouseUp = useCallback(() => {
    const sel = window.getSelection();
    if (sel === null || sel.isCollapsed || sel.rangeCount === 0) return;
    const text = sel.toString();
    if (text.trim() === '') return;
    const range = sel.getRangeAt(0);
    const startNode = range.startContainer;
    // Offsets are into the article's PLAIN text — measure from the body div
    // (the header label มาตรา N would otherwise shift every offset).
    const bodyEl =
      startNode.nodeType === Node.ELEMENT_NODE
        ? (startNode as Element).closest('[data-lawlib-body]')
        : startNode.parentElement?.closest('[data-lawlib-body]');
    if (bodyEl === null || bodyEl === undefined) return;
    const key = bodyEl.getAttribute('data-lawlib-article') ?? '';
    if (key === '') return;
    const startRange = document.createRange();
    startRange.selectNodeContents(bodyEl);
    startRange.setEnd(range.startContainer, range.startOffset);
    const start = startRange.toString().length;
    const hit = findArticleByKey(law, key);
    if (hit === undefined) return;
    const clampedEnd = Math.min(start + text.length, articlePlainText(hit.article).length);
    if (clampedEnd <= start) return;
    addHighlight({ articleKey: key, start, end: clampedEnd });
    sel.removeAllRanges();
  }, [law, addHighlight]);

  // --- panel actions ---------------------------------------------------------
  const handlePanelJump = useCallback(
    (key: string) => {
      closePanel();
      navigateTo(key);
    },
    [closePanel, navigateTo],
  );

  /** Tab trap: wrap first↔last focusable inside the dialog (modal). */
  const handleDrawerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;
    const root = drawerRef.current;
    if (root === null) return;
    const focusables = Array.from(
      root.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      ),
    ).filter((el) => !el.hasAttribute('disabled'));
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    const active = document.activeElement;
    if (e.shiftKey) {
      if (active === first || active === root || !focusables.includes(active as HTMLElement)) {
        e.preventDefault();
        last.focus();
      }
    } else if (active === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleTermJump = useCallback(
    (term: string) => {
      closePanel();
      const def = law.definitions.find((d) => d.term === term);
      if (def === undefined) return;
      const key = firstTermArticleKey(law, term);
      if (key === null) return;
      navigateTo(key, { instant: true });
      // Open the term tooltip once the instant scroll SETTLES: a fixed
      // timer + instant scroll can fire scrollend AFTER the timeout, which
      // would close the just-opened tooltip (race). Listen for the NEXT
      // scrollend one-shot; if no scrollend fires (the target was already
      // in view — no scroll occurred), a fallback timer opens it anyway.
      let settled = false;
      const open = () => {
        if (settled) return;
        settled = true;
        window.removeEventListener('scrollend', onSettled);
        // Scoped anchor (loop-4 #8/finding): query the jump target card FIRST
        // (compact), fall back to the whole document — never open the tooltip
        // on a distant section-3 line while the jump landed elsewhere.
        const card = document.querySelector<HTMLElement>(`[data-lawlib-card="${CSS.escape(key)}"]`);
        const q = `[data-lawlib-term="${CSS.escape(def.term)}"]`;
        const el =
          card?.querySelector<HTMLElement>(q) ?? document.querySelector<HTMLElement>(q) ?? null;
        if (el !== null) {
          openTooltip({ kind: 'glossary', term: def.term, definition: def.definition }, el);
        }
      };
      const onSettled = () => open();
      window.addEventListener('scrollend', onSettled);
      window.setTimeout(open, 300);
    },
    [law, navigateTo, openTooltip, closePanel],
  );

  /** Tooltip "เปิดมาตรานี้" (plan v6, loop-6 risk 3 + Track E BLOCKER):
   *  compact + digest card → open its popover (member-aware — the
   *  memberToCardMap check covers MERGED members, which digestHasCard's
   *  chip-presence test does not); else the EXISTING jump rule — FULL
   *  view / compact-no-card → navigateTo (FULL unchanged). */
  const handleTooltipOpenArticle = useCallback(
    (key: string) => {
      closeTooltip();
      if (effectiveView === 'compact' && memberToCardMap.has(key)) {
        openCardPopover(key);
        return;
      }
      navigateTo(key, { instant: true });
    },
    [closeTooltip, effectiveView, memberToCardMap, openCardPopover, navigateTo],
  );

  const handleBookmarkCurrent = useCallback(() => {
    if (activeKey !== null) toggleBookmark(activeKey);
  }, [activeKey, toggleBookmark]);

  // --- Tooltip hub (ADR-019 D3/D7): quick-note upsert on the LATEST note of
  //     the tooltip's article ('' + none → no-op; '' + existing → delete).
  const handleQuickNoteSave = useCallback(
    (articleKey: string, text: string) => {
      const existing = notes.filter((n) => n.articleKey === articleKey);
      const latest = existing[existing.length - 1];
      if (latest === undefined) {
        if (text.trim() !== '') addNote({ articleKey, text: text.trim() });
        return;
      }
      if (text.trim() === '') deleteNote(latest.id);
      else updateNote(latest.id, text);
    },
    [notes, addNote, updateNote, deleteNote],
  );

  /** Tooltip "เปิดโน้ตทั้งแผง": close the tooltip (sanctioned path) then open
   *  the notes drawer. */
  const handleOpenNotesFromTooltip = useCallback(() => {
    openPanelSafe('notes');
  }, [openPanelSafe]);

  /** Tooltip copy-link — deep link for an ARBITRARY article (the tooltip may
   *  be open on a ref while activeKey points elsewhere). */
  const handleCopyLinkFor = useCallback(
    async (articleKey: string) => {
      const url = `${window.location.origin}${window.location.pathname}?view=${effectiveView}#มาตรา-${articleKey}`;
      return copyText(url);
    },
    [effectiveView],
  );

  /** อ่านต่อ (D7): the stored per-slug position (lastPosition) — mount
   *  restore already landed there unless a deep-link hash beat it. */
  const handleResume = useCallback(() => {
    if (lastPosition !== null) navigateTo(lastPosition);
  }, [lastPosition, navigateTo]);

  /** The dock opens drawers by kind (no opener element — the dock stays
   *  mounted under the drawer; focus restore falls back to no-op). */
  const handleOpenPanelFromDock = useCallback(
    (panel: PanelKind) => {
      if (openPanel === panel) closePanel();
      else openPanelSafe(panel);
    },
    [openPanel, closePanel, openPanelSafe],
  );

  const handleClearHighlights = useCallback(
    (articleKey: string) => {
      for (const h of highlights) {
        if (h.articleKey === articleKey) removeHighlight(h.id);
      }
    },
    [highlights, removeHighlight],
  );

  // --- FR12/FR13 toolbar actions: copy article / copy deep link ------------
  const flashCopied = useCallback((kind: 'article' | 'link') => {
    setCopiedFlash(kind);
    if (copiedTimerRef.current !== null) window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => {
      setCopiedFlash((k) => (k === kind ? null : k));
      copiedTimerRef.current = null;
    }, 2000);
  }, []);

  const handleCopyArticle = useCallback(async () => {
    if (activeKey === null) return;
    const hit = findArticleByKey(law, activeKey);
    if (hit === undefined) return;
    const ok = await copyArticle(hit.article, law);
    if (ok) flashCopied('article');
  }, [activeKey, law, flashCopied]);

  /** Deep link — explicit view param (compact is the default: a FULL share
   *  must carry `?view=full`, D11) + hash. */
  const handleShareLink = useCallback(async () => {
    const hash = activeKey !== null ? `#มาตรา-${activeKey}` : '';
    const url = `${window.location.origin}${window.location.pathname}?view=${effectiveView}${hash}`;
    const ok = await copyText(url);
    if (ok) flashCopied('link');
  }, [activeKey, effectiveView, flashCopied]);

  const isBookmarked = activeKey !== null && bookmarkKeySet.has(activeKey);

  const highlightCountFor = useCallback(
    (key: string) => highlights.some((h) => h.articleKey === key),
    [highlights],
  );

  const mainClass = `${FONT_SIZE_CLASS} leading-relaxed`;

  /** T10a numeric typography via CSS custom properties (see FONT_SIZE_CLASS/
   *  WIDTH_CLASS above) — set on the reader root so both views inherit.
   *  Width is a PERCENT of the 80ch baseline: max-width: calc(80ch * pct/100)
   *  (user decision 2026-08-06 — 100% = the legacy 80ch reading measure).
   *  T10b (ADR-019 D4): fontFamily (single application point — the root's
   *  inline font-family consumes the var; Sarabun/Mali resolve through the
   *  existing next/font vars, the 3 new families through the raw @font-face
   *  declarations), fontWeight (ปกติ/หนา). T50 (ADR-026 W2): paragraph
   *  spacing is DERIVED from lineHeight (paraSpacingFromLineHeight —
   *  1.2 → 0 · 1.8 → 0.5 · 2.4 → 1.0 rem). */
  const typographyVars = {
    '--lawlib-font-size': `${settings.fontSize}px`,
    '--lawlib-width': `calc(80ch * ${settings.width} / 100)`,
    '--lawlib-font-family': FONT_FAMILY_CSS[settings.fontFamily],
    '--lawlib-font-weight': settings.fontWeight === 'bold' ? '700' : '400',
    '--lawlib-para-spacing': `${paraSpacingFromLineHeight(settings.lineHeight)}rem`,
  } as React.CSSProperties;

  /** Reading-root font/weight — the chosen family applies to the whole
   *  reading surface (article text + compact cards). The tooltip PORTAL
   *  renders into document.body (outside this root) — the body-class
   *  effect below mirrors --lawlib-font-family at body level so tooltips
   *  on lawlib reader pages resolve the same family (user decision
   *  2026-08-06); elsewhere the var is unset and the tooltip falls back
   *  to Sarabun. */
  const readerSurfaceStyle: React.CSSProperties = {
    ...typographyVars,
    fontFamily: 'var(--lawlib-font-family)',
    fontWeight: 'var(--lawlib-font-weight)',
    // W1 (ADR-026): the wrapper's max-w-6xl (72rem) caps the article
    // column at ~832px, so width >~120% had no visible effect. Grow the
    // wrapper WITH the measure: 20.5rem = TOC 16rem + grid gap 2rem +
    // px-4 2rem + 0.5rem slack. max() keeps 80–~120% looking identical.
    maxWidth: 'max(72rem, calc(var(--lawlib-width) + 20.5rem))',
  };

  // --- T10b body classes: hide repealed + hide amendment notes (CSS in
  //     globals.css — FULL and COMPACT both render through ArticleView /
  //     the article tooltip, so the class hooks cover both). T31 (AC-2):
  //     body.lawlib-focus moved OUT of this effect — the focus two-step
  //     effect below owns it (toggle at t=0 → surface fade-in on enter;
  //     surface fade-out → toggle on exit).
  useEffect(() => {
    const body = document.body;
    body.classList.toggle('lawlib-hide-repealed', settings.hideRepealed);
    body.classList.toggle('lawlib-hide-amendment-notes', settings.hideAmendmentNotes);
    // Tooltip PORTAL renders into document.body (outside the reader root),
    // so the root-scoped --lawlib-font-family never reaches it. Mirror the
    // var at body level — the tooltip's `var(--lawlib-font-family), ...`
    // prepend then resolves to the reader's chosen family (user decision
    // 2026-08-06). Removed on cleanup / when the font setting changes, and
    // never set outside lawlib reader pages (this effect only runs there).
    body.style.setProperty('--lawlib-font-family', FONT_FAMILY_CSS[settings.fontFamily]);
    return () => {
      body.classList.remove('lawlib-focus', 'lawlib-hide-repealed', 'lawlib-hide-amendment-notes');
      body.style.removeProperty('--lawlib-font-family');
    };
  }, [settings.hideRepealed, settings.hideAmendmentNotes, settings.fontFamily]);

  // --- T31 (AC-2) focus mode two-step (wave-2 fix — the reading surface
  //     MUST stay: globals.css:2430-2435 + ADR-019 D7): ENTER hides the
  //     chrome INSTANTLY (body.lawlib-focus = display:none — out of the
  //     a11y tree, Esc exits) and the surface fades IN over 500ms
  //     (lawlib-focus-fade played REVERSED — 0→1, scale 0.995→1); EXIT
  //     mirrors: the surface fades OUT (forward 1→0), THEN the chrome
  //     returns. The inline animation is cleared at 500ms in BOTH
  //     directions — the `both` fill must not persist a scale on the
  //     surface (fixed popover containing block). Reduced-motion = instant
  //     toggle (JS gate — reducedMotionNow() pattern; the CSS RM kill can't
  //     defer the body class for us).
  const focusSurfaceRef = useRef<HTMLDivElement | null>(null);
  const focusWasOnRef = useRef(false);
  useEffect(() => {
    const body = document.body;
    const el = focusSurfaceRef.current;
    const wasOn = focusWasOnRef.current;
    focusWasOnRef.current = settings.focusMode;
    const setFocusClass = (on: boolean) => body.classList.toggle('lawlib-focus', on);
    if (reducedMotionNow()) {
      setFocusClass(settings.focusMode);
      if (el !== null) el.style.animation = '';
      return;
    }
    if (settings.focusMode) {
      // ENTER: chrome hidden at t=0 (class set NOW), surface fades IN
      // (reverse — from 0 to 1) over 500ms, then the animation is cleared.
      setFocusClass(true);
      if (el === null) return;
      el.style.animation = 'lawlib-focus-fade 0.5s var(--ease-ios-in) reverse both';
      const t = window.setTimeout(() => {
        el.style.animation = '';
      }, 500);
      return () => window.clearTimeout(t);
    }
    // Mount with focus off — nothing to fade.
    if (!wasOn) return;
    // EXIT: surface fades OUT (forward 1→0) over 500ms, THEN the chrome
    // returns (class removed) + the inline animation is cleared.
    if (el === null) {
      setFocusClass(false);
      return;
    }
    el.style.animation = 'lawlib-focus-fade 0.5s var(--ease-ios-in) both';
    const t = window.setTimeout(() => {
      setFocusClass(false);
      el.style.animation = '';
    }, 500);
    return () => window.clearTimeout(t);
  }, [settings.focusMode]);

  // --- T10b focus mode: easy exit via Esc. Stands down while a drawer /
  //     tooltip / compact popover owns Escape (the dock's escBlocked
  //     contract — the dock itself is hidden by CSS while in focus mode,
  //     so its own Esc handler is unreachable). */
  const escBlockedForFocus = openPanel !== null || tooltip !== null || expandedKey !== null;
  useEffect(() => {
    if (!settings.focusMode || escBlockedForFocus) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSettings((prev) => ({ ...prev, focusMode: false }));
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [settings.focusMode, escBlockedForFocus, setSettings]);

  // --- T10b auto-scroll (D7): speed 0-5 (0=off), rAF over the window
  //     scroll, pause on ANY user wheel/touch/pointer/key interaction,
  //     stops at the document end. prefers-reduced-motion → never starts
  //     (the stored value is preserved — turning the OS setting off later
  //     restores the user's choice). The pause state drives the floating
  //     chip's resume button; the loop reads the REF so the chip can toggle
  //     it without restarting the rAF chain.
  //     T23 — the dock's อ่านอัตโนมัติ tool toggles speed 0 ↔ the LAST
  //     level (session memory; default 3 when there is no history yet).
  const lastAutoScrollLevelRef = useRef(3);
  const handleToggleAutoScroll = useCallback(() => {
    if (settings.autoScrollSpeed > 0) {
      lastAutoScrollLevelRef.current = settings.autoScrollSpeed;
      setSettings((prev) => ({ ...prev, autoScrollSpeed: 0 }));
    } else {
      setSettings((prev) => ({
        ...prev,
        autoScrollSpeed: lastAutoScrollLevelRef.current || 3,
      }));
    }
  }, [settings.autoScrollSpeed, setSettings]);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const autoScrollPausedRef = useRef(false);
  useEffect(() => {
    autoScrollPausedRef.current = autoScrollPaused;
  }, [autoScrollPaused]);
  // A fresh speed choice (settings slider — the only other writer besides
  // the chip's stop/end-of-document) restarts a paused auto-scroll. The
  // closure captures the pre-change speed: unrelated settings changes
  // compare equal and must NOT unpause (the user paused to read/edit).
  useEffect(() => {
    const onSettingsChanged = () => {
      const fresh = loadGlobalSettings();
      if (fresh !== null && fresh.autoScrollSpeed !== settings.autoScrollSpeed) {
        setAutoScrollPaused(false);
      }
    };
    window.addEventListener(SETTINGS_CHANGED_EVENT, onSettingsChanged);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, onSettingsChanged);
  }, [settings]);
  useEffect(() => {
    const speed = settings.autoScrollSpeed;
    if (speed <= 0 || reducedMotionNow()) {
      return;
    }
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      const dt = Math.min(now - last, 100);
      last = now;
      if (!autoScrollPausedRef.current) {
        const px = speed * 0.8 * (dt / 16.667);
        const maxY = document.documentElement.scrollHeight - window.innerHeight;
        const nextY = window.scrollY + px;
        if (maxY <= 0 || nextY >= maxY - 2) {
          // Natural end — stop (a paused-at-bottom resume would be a dead
          // loop). Speed 0 = the setting's "off".
          window.scrollTo(0, Math.max(0, maxY));
          setSettings((prev) =>
            prev.autoScrollSpeed === speed ? { ...prev, autoScrollSpeed: 0 } : prev,
          );
          return;
        }
        window.scrollTo(0, nextY);
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    // User interaction pauses — EXCEPT clicks inside the control chip itself
    // (its own pause/resume/stop buttons must not double-toggle).
    const pause = (e: Event) => {
      if (e.target instanceof Element && e.target.closest('.lawlib-autoscroll-chip') !== null) {
        return;
      }
      setAutoScrollPaused(true);
    };
    window.addEventListener('wheel', pause, { passive: true });
    window.addEventListener('touchstart', pause, { passive: true });
    window.addEventListener('pointerdown', pause);
    window.addEventListener('keydown', pause);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('wheel', pause);
      window.removeEventListener('touchstart', pause);
      window.removeEventListener('pointerdown', pause);
      window.removeEventListener('keydown', pause);
    };
  }, [settings.autoScrollSpeed, setSettings]);

  // --- T30 (AC-3): chip exit-hold + level-pop ------------------------------
  // Speed → 0 from ANY writer (dock toggle, chip stop, natural end) holds
  // the chip mounted for the 150ms reversed fade (closing state); a resume
  // inside the window cancels the hold. A speed CHANGE while live re-triggers
  // lawlib-chip-pop (ระดับ pop). RM → no hold (AC-4). T42 — the hold scales
  // with the motion tier (motionExitHoldMs: disable → instant, fast → 75ms).
  // The hold is gated on chipPoppedOnceRef — the chip was live at least
  // once — so the INITIAL mount with autoscroll off can never flash a ghost
  // chip.
  useEffect(() => {
    if (settings.autoScrollSpeed > 0) {
      if (chipCloseTimerRef.current !== null) {
        window.clearTimeout(chipCloseTimerRef.current);
        chipCloseTimerRef.current = null;
      }
      startTransition(() => {
        setChipClosing(false);
        if (chipPoppedOnceRef.current) setChipPop(true);
      });
      chipPoppedOnceRef.current = true;
      // Pop clear: timer-based (see chipPop — onAnimationEnd is unreliable
      // in throttled/background tabs and jsdom cannot synthesize it).
      if (chipPopTimerRef.current !== null) window.clearTimeout(chipPopTimerRef.current);
      chipPopTimerRef.current = window.setTimeout(() => {
        chipPopTimerRef.current = null;
        setChipPop(false);
      }, CHIP_ANIM_MS);
      return;
    }
    const holdMs = motionExitHoldMs(CHIP_ANIM_MS);
    if (chipPoppedOnceRef.current && !reducedMotionNow() && holdMs > 0) {
      startTransition(() => setChipClosing(true));
      chipCloseTimerRef.current = window.setTimeout(() => {
        chipCloseTimerRef.current = null;
        setChipClosing(false);
      }, holdMs);
      return;
    }
    startTransition(() => setChipClosing(false));
  }, [settings.autoScrollSpeed, setSettings]);

  // Unmount — pending chip timers (exit hold + pop clear) must never outlive
  // the reader.
  useEffect(() => {
    return () => {
      if (chipCloseTimerRef.current !== null) {
        window.clearTimeout(chipCloseTimerRef.current);
        chipCloseTimerRef.current = null;
      }
      if (chipPopTimerRef.current !== null) {
        window.clearTimeout(chipPopTimerRef.current);
        chipPopTimerRef.current = null;
      }
    };
  }, []);

  // --- T10b focus-mode reading indicator (D7 — "กำลังอ่าน: มาตรา X"):
  //     IntersectionObserver over the article/card elements; shown ONLY in
  //     focus mode (that is when the user has no nav/TOC to orient by).
  //     Falls back to activeKey until the observer reports.
  const [focusArticleLabel, setFocusArticleLabel] = useState('');
  useEffect(() => {
    if (!settings.focusMode) return;
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('[data-lawlib-article], [data-lawlib-card]'),
    );
    const labelOfEl = (el: HTMLElement): string | null => {
      const key = el.getAttribute('data-lawlib-article') ?? el.getAttribute('data-lawlib-card');
      if (key === null || key === '') return null;
      const hit = findArticleByKey(law, key);
      return hit !== undefined ? articleLabel(hit.article.no, hit.article.suffix) : `มาตรา ${key}`;
    };
    // Seed with the FIRST article/card (DOM order) — the bar must never read
    // "—" before the observer's initial callback lands. Deferred into a
    // timeout (compiler rule: no synchronous setState in the effect body —
    // same pattern as the mount restore effect) and gated on the state still
    // being empty so a faster IO update wins.
    const first = els[0];
    const seedTimer =
      first !== undefined
        ? window.setTimeout(() => {
            const label = labelOfEl(first);
            if (label !== null) setFocusArticleLabel((prev) => (prev === '' ? label : prev));
          }, 0)
        : null;
    const io = new IntersectionObserver(
      (entries) => {
        const hits = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const target = hits[0]?.target as HTMLElement | undefined;
        if (target === undefined) return;
        const label = labelOfEl(target);
        if (label !== null) setFocusArticleLabel(label);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      if (seedTimer !== null) window.clearTimeout(seedTimer);
    };
  }, [settings.focusMode, effectiveView, law]);
  const focusLabel =
    focusArticleLabel !== '' ? focusArticleLabel : activeKey !== null ? labelOf(activeKey) : '—';

  /** Tooltip article-actions hub (T10a) — same-law ref content only. All
   *  callbacks are keyed to the TOOLTIP's article (a ref tooltip can be open
   *  while activeKey points elsewhere). */
  const tooltipHub =
    tooltip !== null && tooltip.content.kind === 'ref' && tooltip.content.lawSlug === undefined
      ? (() => {
          const key = articleKeyOf({
            no: tooltip.content.articleNo,
            suffix: tooltip.content.articleSuffix,
          });
          const articleNotes = notes.filter((n) => n.articleKey === key);
          return {
            isBookmarked: bookmarkKeySet.has(key),
            onToggleBookmark: () => toggleBookmark(key),
            noteText: articleNotes[articleNotes.length - 1]?.text ?? '',
            onNoteSave: (text: string) => handleQuickNoteSave(key, text),
            onOpenNotes: handleOpenNotesFromTooltip,
            onCopyLink: () => {
              void handleCopyLinkFor(key);
            },
          };
        })()
      : undefined;

  /** ArticlePopover article-actions hub (T46) — SAME sources as the tooltip
   *  hub, keyed to the POPOVER's card key (expandedKey = the card's primary
   *  key). The popover is always same-law in-page content → the full hub
   *  applies (bookmark ± · note quick-write + open full notes · copy ·
   *  copy-link). Null when no popover is open. */
  const popoverHub: LawTooltipHub | null =
    expandedKey !== null
      ? (() => {
          const key = expandedKey;
          const articleNotes = notes.filter((n) => n.articleKey === key);
          return {
            isBookmarked: bookmarkKeySet.has(key),
            onToggleBookmark: () => toggleBookmark(key),
            noteText: articleNotes[articleNotes.length - 1]?.text ?? '',
            onNoteSave: (text: string) => handleQuickNoteSave(key, text),
            onOpenNotes: handleOpenNotesFromTooltip,
            onCopyLink: () => {
              void handleCopyLinkFor(key);
            },
          };
        })()
      : null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6" style={readerSurfaceStyle}>
      {/* sr-only view-switch announcement — set ONLY in the toggle handler (loop-4 #2) */}
      <p role="status" className="sr-only">
        {statusText}
      </p>
      {/* T31 (AC-3) — page entrance wrapper: lawlib-fade-rise 400ms (D10:
          animation-duration override AFTER the shorthand — inline). Fill
          BACKWARDS (not the class's `both`): a held translateY would become
          a containing block for the fixed ArticlePopover / tooltips for the
          page's lifetime. Fixed chrome (dock / indicator / chip / drawers)
          stays OUTSIDE this wrapper. */}
      <div
        className="lawlib-fade-rise"
        style={{
          // T42 (ADR-025 D2): 500ms quality → 250ms fast via the factor.
          animationDuration: 'calc(500ms * var(--motion-factor, 1))',
          animationFillMode: 'backwards',
        }}
      >
        {/* law header */}
        <header className="border-b border-slate-100 pb-5 dark:border-slate-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <Link
                href="/lawlib"
                className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition-colors hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300"
              >
                <span aria-hidden="true">←</span> กลับรายการกฎหมาย
              </Link>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                <span className="rounded-full bg-blue-50 px-2 py-0.5 font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
                  ภาค {law.part}
                </span>
                <span>{law.code}</span>
              </div>
              <h1 className="mt-1.5 text-2xl font-bold leading-relaxed text-slate-900 dark:text-white">
                {law.titleTh}
              </h1>
              <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {law.gazetteRef} — ตรวจสอบล่าสุด {formatVerifiedAt(law.verifiedAt)}
              </p>
            </div>
          </div>
        </header>

        <div className="mt-4">
          {/* History: digest pages → the merged per-edition block (md-driven,
            shows in BOTH views — user 2026-08-05); other laws → JSON timeline. */}
          {digestView !== null && digestView.sections[1] !== undefined ? (
            <DigestHistoryBlock
              lines={digestView.sections[1].lines}
              slug={law.slug}
              onOpenRef={handleOpenRef}
              onSeeFull={handleSeeFull}
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
              tooltipId={tooltipId}
            />
          ) : (
            <EditionTimeline editions={law.editions} />
          )}
        </div>

        {/* FULL | COMPACT toggle — APG radio group, visible only when a digest
          exists (FR1). T37 (ADR-024 D4, user-locked 2026-08-10): the selected
          SURFACE moved to the sliding knob — transform-only (D10),
          `translate-x-0 ↔ translate-x-full` 200ms --ease-ios-out; buttons
          keep the text colors (selected white / unselected blue-800 or dark
          blue-300) and transition color only. flex-1 on BOTH buttons (senior
          MINOR-5 — the labels differ in width; the knob math 50%−4px + full
          translation lands flush only on equal halves). NO gap on the
          container (scrutinize F2: a gap would offset the knob landing by
          the gap width). Knob sits behind the buttons (z-10) so the
          focus-visible ring stays visible; aria/arrow keys unchanged. RM:
          the reduced-motion kill zeroes transition-duration → instant. */}
        {digestView !== null && (
          <div
            role="radiogroup"
            aria-label="มุมมองการอ่าน"
            aria-controls="lawlib-reader-content"
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                handleSetView(effectiveView === 'compact' ? 'full' : 'compact');
              }
            }}
            className="relative mt-4 inline-flex items-center rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
          >
            <div
              aria-hidden="true"
              className={`absolute inset-y-1 left-1 w-[calc(50%_-_4px)] rounded-full bg-blue-700 transition-transform duration-300 ease-ios-out dark:bg-blue-600 ${
                effectiveView === 'compact' ? 'translate-x-full' : 'translate-x-0'
              }`}
            />
            <button
              type="button"
              role="radio"
              aria-checked={effectiveView === 'full'}
              tabIndex={effectiveView === 'full' ? 0 : -1}
              onClick={() => handleSetView('full')}
              className={`relative z-10 min-h-11 min-w-11 flex-1 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                effectiveView === 'full' ? 'text-white' : 'text-blue-800 dark:text-blue-300'
              }`}
            >
              ฉบับเต็ม
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={effectiveView === 'compact'}
              tabIndex={effectiveView === 'compact' ? 0 : -1}
              onClick={() => handleSetView('compact')}
              className={`relative z-10 min-h-11 min-w-11 flex-1 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                effectiveView === 'compact' ? 'text-white' : 'text-blue-800 dark:text-blue-300'
              }`}
            >
              เวอร์ชันย่อ
            </button>
          </div>
        )}

        <div id="lawlib-reader-content" ref={focusSurfaceRef} className="mt-6">
          {effectiveView === 'compact' && digestView !== null ? (
            <CompactView
              view={digestView}
              law={law}
              fontSizeClass={FONT_SIZE_CLASS}
              widthClass={WIDTH_CLASS}
              lineHeight={settings.lineHeight}
              expandedKey={expandedKey}
              expandedSource={expandedSource}
              tooltipId={tooltipId}
              onToggleCard={handleToggleCard}
              onCollapseCard={handleCollapseCard}
              onNavigate={navigateTo}
              onOpenRef={handleOpenRef}
              onSeeFull={handleSeeFull}
              onExpandGroup={(groupId) =>
                setCollapsedGroups((prev) => {
                  if (!prev.has(groupId)) return prev;
                  const next = new Set(prev);
                  next.delete(groupId);
                  return next;
                })
              }
              activeArticleKey={activeKey}
              highlights={highlights}
              noteKeys={noteKeySet}
              flashKey={flashKey}
              collapsedGroups={collapsedGroups}
              onToggleGroup={(id) =>
                setCollapsedGroups((prev) => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                })
              }
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
              hub={popoverHub}
            />
          ) : (
            <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
              {/* T31 (AC-3): main sections stagger 60ms on mount (inline
                animation-delay, fill backwards — see page wrapper above). */}
              <div
                className="lawlib-fade-rise mb-6 lg:mb-0"
                style={{
                  animationDelay: 'calc(60ms * var(--motion-factor, 1))',
                  animationFillMode: 'backwards',
                }}
              >
                <TocSidebar
                  law={law}
                  activeKey={activeKey}
                  onNavigate={navigateTo}
                  onActiveChange={setActiveKey}
                />
              </div>

              <div
                className={`lawlib-fade-rise lawlib-article-card mx-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 ${WIDTH_CLASS}`}
                style={{
                  animationDelay: 'calc(120ms * var(--motion-factor, 1))',
                  animationFillMode: 'backwards',
                }}
              >
                <section
                  aria-label="เนื้อหากฎหมาย"
                  onMouseUp={handleArticleMouseUp}
                  style={{ lineHeight: settings.lineHeight }}
                  className={`min-w-0 pb-16 ${mainClass}`}
                >
                  <ArticleView
                    law={law}
                    highlights={highlights}
                    noteKeys={noteKeySet}
                    flashKey={flashKey}
                    getTriggerProps={getTriggerProps}
                    isTooltipOpen={isTooltipOpen}
                    tooltipId={tooltipId}
                  />
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* end T31 page-entrance wrapper — fixed chrome below stays outside */}

      {/* dock v2 (T10a — ADR-019 D1/D2/D3/D6): 1-icon collapsed → Level 1
          favorites → Level 2 ALL tools; stays open until Esc/outside/re-click */}
      <LawlibDock
        law={law}
        theme={theme}
        setTheme={setTheme}
        paperTone={paperTone}
        setPaperTone={setPaperTone}
        settings={settings}
        setSettings={setSettings}
        isBookmarked={isBookmarked}
        onToggleBookmark={handleBookmarkCurrent}
        onToggleAutoScroll={handleToggleAutoScroll}
        activePanel={openPanel}
        onOpenPanel={handleOpenPanelFromDock}
        notesCount={notes.length}
        copiedFlash={copiedFlash}
        onCopyArticle={handleCopyArticle}
        onCopyLink={handleShareLink}
        canCopy={activeKey !== null}
        resumeKey={lastPosition}
        activeKey={activeKey}
        onResume={handleResume}
        bookmarks={bookmarks}
        escBlocked={openPanel !== null || tooltip !== null || expandedKey !== null}
      />

      {/* T10b focus-mode reading indicator (D7) — sticky bar, visible ONLY
          in focus mode; the IntersectionObserver label falls back to the
          active article. Esc exits focus mode (reader handler above). */}
      {settings.focusMode && (
        <div className="lawlib-reading-indicator fixed inset-x-0 top-[max(0px,env(safe-area-inset-top))] z-40 flex items-center justify-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-1.5 shadow-sm dark:border-slate-700 dark:bg-slate-900/95">
          <i
            aria-hidden="true"
            className="fi fi-sr-book-open-reader text-[10px] text-blue-600 dark:text-blue-300"
          />
          <span className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">
            กำลังอ่าน: {focusLabel}
          </span>
          <button
            type="button"
            onClick={() => setSettings({ ...settings, focusMode: false })}
            aria-label="ออกจากโหมดโฟกัส"
            title="ออกจากโหมดโฟกัส (Esc)"
            className="flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-blue-300 bg-blue-50 px-2 text-[11px] font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-500/50 dark:bg-blue-950/50 dark:text-blue-300"
          >
            ออก
            <i aria-hidden="true" className="fi fi-sr-cross text-[8px]" />
          </button>
        </div>
      )}

      {/* T10b auto-scroll control chip — visible while auto-scroll runs;
          pause/resume + stop (speed 0). Pauses on ANY user interaction via
          the reader effect (wheel/touch/pointer/key). T30 (AC-3/AC-5): the
          outer wrapper owns the position + 150ms fade-rise (reversed while
          closing) + `vt-chip`; the pill inside owns lawlib-chip-pop (level
          change) — two animation classes would fight on ONE element. */}
      {(settings.autoScrollSpeed > 0 || chipClosing) && !reducedMotionNow() && (
        <div
          className="lawlib-autoscroll-chip lawlib-fade-rise vt-chip fixed bottom-24 left-1/2 z-40 -translate-x-1/2"
          style={{
            // T42 (ADR-025 D2): 150ms quality → 75ms fast.
            animationDuration: 'calc(150ms * var(--motion-factor, 1))',
            animationDirection: chipClosing ? 'reverse' : 'normal',
          }}
        >
          <div
            className={`flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/95 py-1 pl-3 pr-1 shadow-lg dark:border-slate-700 dark:bg-slate-900/95 ${chipPop ? 'lawlib-chip-pop' : ''}`}
          >
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <i
                aria-hidden="true"
                className="fi fi-sr-arrow-small-down text-[10px] text-blue-600 dark:text-blue-300"
              />
              เลื่อนอัตโนมัติ
            </span>
            <button
              type="button"
              aria-pressed={!autoScrollPaused}
              onClick={() => setAutoScrollPaused((p) => !p)}
              className="flex h-9 cursor-pointer items-center gap-1 rounded-full bg-blue-600 px-3 text-[11px] font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <i
                aria-hidden="true"
                className={`fi text-[9px] ${autoScrollPaused ? 'fi-sr-play' : 'fi-sr-pause'}`}
              />
              {autoScrollPaused ? 'เล่นต่อ' : 'หยุดชั่วคราว'}
            </button>
            <button
              type="button"
              onClick={() => setSettings({ ...settings, autoScrollSpeed: 0 })}
              aria-label="ปิดเลื่อนอัตโนมัติ"
              title="ปิดเลื่อนอัตโนมัติ"
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-400 dark:hover:text-white"
            >
              <i aria-hidden="true" className="fi fi-sr-cross text-[9px]" />
            </button>
          </div>
        </div>
      )}

      {/* panels (drawer + dimmed overlay — bg-black/10 only, no blur) */}
      {openPanel !== null && (
        <div
          ref={drawerRef}
          onKeyDown={handleDrawerKeyDown}
          className="vt-drawer fixed inset-0 z-[60]"
        >
          {/* T30 (ADR-023 D9): overlay fade 400ms; closing reverses the
              keyframe (opacity 1→0) — `both` fill makes the swap seamless
              (current state == the reverse from-frame). */}
          <div
            className="lawlib-overlay-fade absolute inset-0 bg-black/10"
            style={{ animationDirection: panelClosing ? 'reverse' : 'normal' }}
            onClick={() => closePanel()}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={PANEL_LABELS[openPanel]}
            className="lawlib-slide-left absolute right-0 top-0 flex h-full w-[min(92vw,26rem)] flex-col bg-white/75 shadow-2xl backdrop-blur-xl dark:bg-slate-900/75"
            style={{ animationDirection: panelClosing ? 'reverse' : 'normal' }}
          >
            <header className="lawlib-fade-rise flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {PANEL_LABELS[openPanel]}
              </h2>
              <button
                type="button"
                onClick={() => closePanel()}
                aria-label="ปิด"
                className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <i aria-hidden="true" className="fi fi-sr-cross text-[10px]" />
              </button>
            </header>
            {/* T9 safe-area: the last drawer row must clear the home
                indicator (p-4 replaced with explicit sides so the bottom
                padding rides env(safe-area-inset-bottom)). T30: content
                rows stagger 40ms (header 0ms → content 40ms, T29 pattern). */}
            <div
              className="lawlib-fade-rise flex-1 overflow-y-auto px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
              style={{ animationDelay: 'calc(40ms * var(--motion-factor, 1))' }}
            >
              {openPanel === 'search' && (
                <SearchPanel
                  articles={articles}
                  onJump={handlePanelJump}
                  digestLines={effectiveView === 'compact' ? digestLines : undefined}
                  onDigestLineJump={handleDigestLineJump}
                />
              )}
              {openPanel === 'glossary' && (
                <GlossaryPanel
                  definitions={law.definitions}
                  missingTerms={missingTerms}
                  onTerm={handleTermJump}
                />
              )}
              {openPanel === 'notes' && (
                <NotesPanel
                  notes={notes}
                  currentKey={activeKey}
                  labelOf={labelOf}
                  onAdd={(articleKey, text) => addNote({ articleKey, text })}
                  onUpdate={(id, text) => updateNote(id, text)}
                  onDelete={(id) => deleteNote(id)}
                  onClearHighlights={handleClearHighlights}
                  hasHighlights={highlightCountFor}
                />
              )}
              {openPanel === 'bookmarks' && (
                <BookmarksPanel
                  law={law}
                  keys={bookmarks}
                  onNavigate={handlePanelJump}
                  onRemove={(key) => toggleBookmark(key)}
                />
              )}
            </div>
          </aside>
        </div>
      )}

      {/* single tooltip portal */}
      {tooltip !== null && (
        <LawTooltip
          content={tooltip.content}
          anchorRect={tooltip.anchorRect}
          sheet={tooltip.sheet}
          law={law}
          onClose={closeTooltip}
          onOpenArticle={handleTooltipOpenArticle}
          registerTooltipEl={registerTooltipEl}
          onPointerLeave={handleTooltipPointerLeave}
          focusOnOpen={openedByKeyboard}
          tooltipId={tooltipId}
          hub={tooltipHub}
          // T19 — hover preview (user decision): hover-open → 5-row clamp +
          // ดูเพิ่มเติม; click-pin AND keyboard open → full text directly
          // (both are "intent to read"; the keyboard Tab-cycle contract
          // starts at the copy button, not the expand button). Touch opens
          // are not pins → preview (mobile sheet shows the same preview).
          preview={!pinned && !openedByKeyboard}
          // T28 — hook-owned EXIT state: renders lawlib-tooltip-out during
          // the 120ms exit window (keyboard/Esc/reduced-motion never enter).
          closing={closing}
        />
      )}
    </div>
  );
}
