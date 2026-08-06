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
 * `(website)/lawlib/lib/reader-props.ts`. (ReadingSettings no longer mounts
 * here — it lives on for the site SettingsMenu only.)
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import LawTooltip from '@/components/LawTooltip';
import { SearchPanel } from '@/components/SearchPanel';
import { GlossaryPanel } from '@/components/GlossaryPanel';
import { EditionTimeline } from '@/components/EditionTimeline';
import { useReaderStorage } from '@/hooks/useReaderStorage';
import type { ReaderViewMode } from '@/hooks/useReaderStorage';
import { useTheme } from '@/components/ThemeProvider';
import LawlibDock from '@/components/LawlibDock';
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
}: {
  lines: RenderLine[];
  slug: string;
  onOpenRef: (key: string) => void;
  onSeeFull: (key: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
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
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:border-blue-300 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:text-blue-300"
      >
        <i aria-hidden="true" className="fi fi-sr-clock text-xs text-slate-400" />
        ประวัติการแก้ไข ({editionCount} ฉบับ)
        <i
          aria-hidden="true"
          className={`fi fi-sr-angle-small-down text-xs transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div id="lawlib-digest-history-list" className="mt-3 space-y-2">
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
                interactive={false}
              />
            ) : null,
          )}
        </div>
      )}
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
} as const;

type PanelKind = keyof typeof PANEL_LABELS;

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
    tooltipId,
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
   *  guard: a collapsed group makes offsetParent null → fall back to the
   *  card's FIRST member button (focus() on a hidden element is a no-op —
   *  acceptable). Compact-only; FULL never restores here. */
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
        if (el !== null && el.offsetParent !== null) target = el;
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
      setOpenPanel(null);
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
          el.classList.add('lawlib-dline-flash');
          flashLineTimerRef.current = window.setTimeout(() => {
            el.classList.remove('lawlib-dline-flash');
            flashLineTimerRef.current = null;
          }, 2000);
        }
      }, 50);
    },
    [lineGroupMap],
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
  } | null>(null);
  if (mountDataRef.current === null) {
    mountDataRef.current = {
      restoreKey: lastPosition,
      firstKey: flat[0] !== undefined ? articleKeyOf(flat[0].article) : null,
      viewAtMount: effectiveView,
    };
  }

  useEffect(() => {
    const { restoreKey, firstKey, viewAtMount } = mountDataRef.current as {
      restoreKey: string | null;
      firstKey: string | null;
      viewAtMount: ReaderViewMode;
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
        if (viewAtMount === 'compact') {
          // no card for the target → FULL + deferred real jump
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
        setOpenPanel(null);
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
  }, [openPanel, expandedKey, collapseCard, effectiveView, restoreMemberFocus]);

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
      setOpenPanel(null);
      navigateTo(key);
    },
    [navigateTo],
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
      setOpenPanel(null);
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
    [law, navigateTo, openTooltip],
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
    setOpenPanel('notes');
  }, []);

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
      setOpenPanel(openPanel === panel ? null : panel);
    },
    [openPanel],
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
   *  (user decision 2026-08-06 — 100% = the legacy 80ch reading measure). */
  const typographyVars = {
    '--lawlib-font-size': `${settings.fontSize}px`,
    '--lawlib-width': `calc(80ch * ${settings.width} / 100)`,
  } as React.CSSProperties;

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6" style={typographyVars}>
      {/* sr-only view-switch announcement — set ONLY in the toggle handler (loop-4 #2) */}
      <p role="status" className="sr-only">
        {statusText}
      </p>
      {/* law header */}
      <header className="border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/lawlib"
              className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300"
            >
              <span aria-hidden="true">←</span> กลับรายการกฎหมาย
            </Link>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
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
          />
        ) : (
          <EditionTimeline editions={law.editions} />
        )}
      </div>

      {/* FULL | COMPACT toggle — APG radio group, visible only when a digest
          exists (FR1). Contrast per loop-4 #8: selected bg-blue-700/white
          (dark bg-blue-600/white), unselected text-blue-800/blue-300. */}
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
          className="mt-4 inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1 dark:border-slate-700 dark:bg-slate-900"
        >
          <button
            type="button"
            role="radio"
            aria-checked={effectiveView === 'full'}
            tabIndex={effectiveView === 'full' ? 0 : -1}
            onClick={() => handleSetView('full')}
            className={`min-h-11 min-w-11 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              effectiveView === 'full'
                ? 'bg-blue-700 text-white dark:bg-blue-600'
                : 'text-blue-800 dark:text-blue-300'
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
            className={`min-h-11 min-w-11 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
              effectiveView === 'compact'
                ? 'bg-blue-700 text-white dark:bg-blue-600'
                : 'text-blue-800 dark:text-blue-300'
            }`}
          >
            เวอร์ชันย่อ
          </button>
        </div>
      )}

      <div id="lawlib-reader-content" className="mt-6">
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
          />
        ) : (
          <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
            <div className="mb-6 lg:mb-0">
              <TocSidebar
                law={law}
                activeKey={activeKey}
                onNavigate={navigateTo}
                onActiveChange={setActiveKey}
              />
            </div>

            <div
              className={`lawlib-article-card mx-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 ${WIDTH_CLASS}`}
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
        bookmarksCount={bookmarks.length}
        onToggleBookmark={handleBookmarkCurrent}
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
        onJump={handlePanelJump}
        onBookmarkRemove={(key) => toggleBookmark(key)}
        escBlocked={openPanel !== null || tooltip !== null || expandedKey !== null}
      />

      {/* panels (drawer + dimmed overlay — bg-black/10 only, no blur) */}
      {openPanel !== null && (
        <div ref={drawerRef} onKeyDown={handleDrawerKeyDown} className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-black/10"
            onClick={() => setOpenPanel(null)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={PANEL_LABELS[openPanel]}
            className="absolute right-0 top-0 flex h-full w-[min(92vw,26rem)] flex-col bg-white shadow-2xl dark:bg-slate-900"
          >
            <header className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {PANEL_LABELS[openPanel]}
              </h2>
              <button
                type="button"
                onClick={() => setOpenPanel(null)}
                aria-label="ปิด"
                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <i aria-hidden="true" className="fi fi-sr-cross text-[10px]" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-4">
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
        />
      )}
    </div>
  );
}
