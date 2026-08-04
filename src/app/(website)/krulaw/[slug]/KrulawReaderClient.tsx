'use client';

/**
 * KruLAW — reader state hub (Wave 2, lane B2 — sole owner).
 *
 * Receives `law: LawDoc` from the server page (via KrulawReaderShell, the
 * ssr:false boundary). Owns: active article, tooltip (useLawTooltip), open
 * panel, settings/bookmarks/notes/highlights (useReaderStorage — D1 lane),
 * deep-link hash handling (FR2), last-position restore (FR10), jump wiring.
 *
 * Leaf panels (SearchPanel/GlossaryPanel/EditionTimeline/ReadingSettings +
 * useReaderStorage) are built by the D1 lane against the frozen props
 * contract in `(website)/krulaw/lib/reader-props.ts`.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import type { LawDoc } from '@/types/krulaw';
import { normalizeNfc, normalizeThaiDigits } from '@/lib/krulaw/normalize';
import {
  articleKeyOf,
  articleLabel,
  articlePlainText,
  findArticleByKey,
  firstTermArticleKey,
  flattenArticles,
  formatVerifiedAt,
} from '@/lib/krulaw-reader';
import { copyArticle, copyText, printArticle, printLaw } from '@/lib/copy-print';
import { useLawTooltip } from '@/hooks/useLawTooltip';
import type { Note } from '@/hooks/useReaderStorage';
import ArticleView from '@/components/ArticleView';
import TocSidebar from '@/components/TocSidebar';
import LawTooltip from '@/components/LawTooltip';
import { SearchPanel } from '@/components/SearchPanel';
import { GlossaryPanel } from '@/components/GlossaryPanel';
import { EditionTimeline } from '@/components/EditionTimeline';
import { useReaderStorage } from '@/hooks/useReaderStorage';
import { useTheme } from '@/components/ThemeProvider';
import type { PaperTone, Theme } from '@/components/ThemeProvider';
import type { ReadingSettingsValue } from '@/app/(website)/krulaw/lib/reader-props';

// ---------------------------------------------------------------------------
// Local panel components (notes list / bookmarks list — reader-core
// territory; the four leaf panels above are D1's)
// ---------------------------------------------------------------------------

const PANEL_LABELS = {
  search: 'ค้นหามาตรา',
  glossary: 'บทนิยาม',
  notes: 'บันทึกของฉัน',
  bookmarks: 'ที่คั่นหน้า',
} as const;

type PanelKind = keyof typeof PANEL_LABELS;

const FONT_SIZE_CLASS: Record<'s' | 'm' | 'l' | 'xl', string> = {
  s: 'text-base',
  m: 'text-lg',
  l: 'text-xl',
  xl: 'text-2xl',
};

const WIDTH_CLASS: Record<'narrow' | 'normal' | 'wide', string> = {
  narrow: 'max-w-2xl',
  normal: 'max-w-3xl',
  wide: 'max-w-4xl',
};

// --- ReadingDock cycle helpers (FR-C/D10): theme, paper tone, width, lh -----

const THEME_CYCLE: Record<Theme, { label: string; icon: string; next: Theme }> = {
  light: { label: 'สว่าง', icon: 'fi-sr-sun', next: 'dark' },
  dark: { label: 'มืด', icon: 'fi-sr-moon', next: 'read' },
  read: { label: 'อ่าน', icon: 'fi-sr-book', next: 'light' },
};

const TONE_ORDER: readonly PaperTone[] = ['soft', 'classic', 'warm'];
const TONE_LABELS: Record<PaperTone, string> = {
  soft: 'ครีม',
  classic: 'คลาสสิก',
  warm: 'เหลือง',
};

const WIDTH_ORDER: readonly ReadingSettingsValue['width'][] = ['narrow', 'normal', 'wide'];
const WIDTH_LABELS: Record<ReadingSettingsValue['width'], string> = {
  narrow: 'แคบ',
  normal: 'ปกติ',
  wide: 'กว้าง',
};
/** Icon shows what the NEXT press does (cycle semantics). */
const WIDTH_ICON: Record<ReadingSettingsValue['width'], string> = {
  narrow: 'fi-sr-expand',
  normal: 'fi-sr-expand',
  wide: 'fi-sr-compress',
};

const FONT_SIZE_ORDER: readonly ReadingSettingsValue['fontSize'][] = ['s', 'm', 'l', 'xl'];

const LINE_HEIGHT_MIN = 1.5;
const LINE_HEIGHT_MAX = 2.2;
const LINE_HEIGHT_STEP = 0.2;

function stepFontSize(
  current: ReadingSettingsValue['fontSize'],
  dir: -1 | 1,
): ReadingSettingsValue['fontSize'] | null {
  const i = FONT_SIZE_ORDER.indexOf(current);
  const next = i + dir;
  return next >= 0 && next < FONT_SIZE_ORDER.length ? FONT_SIZE_ORDER[next] : null;
}

function nextLineHeight(current: number): number {
  if (current >= LINE_HEIGHT_MAX) return LINE_HEIGHT_MIN;
  return Math.min(LINE_HEIGHT_MAX, Math.round((current + LINE_HEIGHT_STEP) * 10) / 10);
}

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

function ToolbarButton({
  icon,
  label,
  active = false,
  badge,
  disabled = false,
  onClick,
  children,
}: {
  icon?: string;
  label: string;
  active?: boolean;
  badge?: number;
  disabled?: boolean;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={active}
      disabled={disabled}
      className={`relative flex h-11 w-11 cursor-pointer items-center justify-center rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        active
          ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/50 dark:text-blue-300'
          : 'border-slate-200 bg-white text-slate-500 hover:text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-white'
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children !== undefined ? (
        children
      ) : (
        <i aria-hidden="true" className={`fi ${icon} text-sm leading-none`} />
      )}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// ReadingDock — floating right-edge tool stack (FR-C).
//
// Module-level (NOT defined inline inside the reader) so its identity stays
// stable across reader re-renders: inline definitions would remount the dock
// on every activeKey/settings change, dropping the expander state and
// detaching the panel-openers the drawer's focus-restore relies on
// (opener.isConnected guard). Same precedent as NotesPanel/BookmarksPanel.
// ---------------------------------------------------------------------------

interface ReadingDockProps {
  theme: Theme;
  onCycleTheme: () => void;
  paperTone: PaperTone;
  onCyclePaperTone: () => void;
  settings: ReadingSettingsValue;
  onFontSizeStep: (dir: -1 | 1) => void;
  onCycleWidth: () => void;
  onCycleLineHeight: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  activePanel: PanelKind | null;
  onTogglePanel: (panel: PanelKind) => (e: React.MouseEvent<HTMLButtonElement>) => void;
  notesCount: number;
  bookmarksCount: number;
  copiedFlash: 'article' | 'link' | null;
  onCopyArticle: () => void;
  onShareLink: () => void;
  onPrintArticle: () => void;
  onPrintLaw: () => void;
  canCopy: boolean;
}

function ReadingDock({
  theme,
  onCycleTheme,
  paperTone,
  onCyclePaperTone,
  settings,
  onFontSizeStep,
  onCycleWidth,
  onCycleLineHeight,
  isBookmarked,
  onToggleBookmark,
  activePanel,
  onTogglePanel,
  notesCount,
  bookmarksCount,
  copiedFlash,
  onCopyArticle,
  onShareLink,
  onPrintArticle,
  onPrintLaw,
  canCopy,
}: ReadingDockProps) {
  const [expanded, setExpanded] = useState(false);
  const group2Ref = useRef<HTMLDivElement | null>(null);
  const chevronRef = useRef<HTMLButtonElement | null>(null);

  const themeNow = THEME_CYCLE[theme];
  const themeNext = THEME_CYCLE[themeNow.next];
  const widthNext = WIDTH_ORDER[(WIDTH_ORDER.indexOf(settings.width) + 1) % WIDTH_ORDER.length];
  const lhNext = nextLineHeight(settings.lineHeight);

  // On open, move focus to the first action button (a11y — L4-1).
  useEffect(() => {
    if (!expanded) return;
    const first = group2Ref.current?.querySelector<HTMLButtonElement>('button');
    if (first !== undefined && first !== null && !first.hasAttribute('disabled')) first.focus();
  }, [expanded]);

  // Escape closes the expander + returns focus to the chevron. While a panel
  // drawer is open the drawer owns Escape (openPanel !== null → no-op here).
  useEffect(() => {
    if (activePanel !== null || !expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setExpanded(false);
      const opener = chevronRef.current;
      if (opener !== null && opener.isConnected) opener.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [expanded, activePanel]);

  return (
    <div
      className="krulaw-dock fixed bottom-32 right-6 z-50 flex max-h-[60vh] flex-col items-center gap-1.5 overflow-y-auto rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-lg backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90 md:right-10 lg:max-h-[calc(100vh-14rem)]"
      role="group"
      aria-label="เครื่องมืออ่าน"
    >
      {/* Group 1 — reading tools (always visible) */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <p className="max-w-11 truncate text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          เครื่องมืออ่าน
        </p>
        <ToolbarButton
          icon={themeNow.icon}
          label={`โหมดปัจจุบัน: ${themeNow.label} — สลับเป็น ${themeNext.label}`}
          onClick={onCycleTheme}
        />
        <ToolbarButton
          icon="fi-sr-minus"
          label="ตัวอักษรเล็กลง"
          disabled={settings.fontSize === 's'}
          onClick={() => onFontSizeStep(-1)}
        />
        <ToolbarButton
          icon="fi-sr-plus"
          label="ตัวอักษรใหญ่ขึ้น"
          disabled={settings.fontSize === 'xl'}
          onClick={() => onFontSizeStep(1)}
        />
        <ToolbarButton
          icon={WIDTH_ICON[settings.width]}
          label={`ความกว้างเนื้อหา: ${WIDTH_LABELS[settings.width]} — สลับเป็น ${WIDTH_LABELS[widthNext]}`}
          onClick={onCycleWidth}
        />
        <ToolbarButton
          label={`ความสูงบรรทัด: ${settings.lineHeight.toFixed(1)} เท่า — สลับเป็น ${lhNext.toFixed(1)} เท่า`}
          onClick={onCycleLineHeight}
        >
          <span className="flex flex-col items-center leading-none">
            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">lh</span>
            <span className="mt-0.5 text-[10px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              {settings.lineHeight.toFixed(1)}
            </span>
          </span>
        </ToolbarButton>
        <ToolbarButton
          icon="fi-sr-palette"
          label={`โทนกระดาษ: ${TONE_LABELS[paperTone]} — สลับเป็น ${TONE_LABELS[TONE_ORDER[(TONE_ORDER.indexOf(paperTone) + 1) % TONE_ORDER.length]]}`}
          onClick={onCyclePaperTone}
        />
      </div>

      <div aria-hidden="true" className="h-px w-8 shrink-0 bg-slate-200 dark:bg-slate-700" />

      {/* Group 2 — actions (behind the chevron disclosure; STAYS MOUNTED so
          the drawer's opener.isConnected focus-restore keeps working). */}
      <div
        id="krulaw-dock-actions"
        ref={group2Ref}
        className={
          expanded ? 'flex min-h-0 flex-1 flex-col items-center gap-1.5 overflow-y-auto' : 'hidden'
        }
      >
        <p className="max-w-11 truncate text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
          การกระทำ
        </p>
        <ToolbarButton
          icon="fi-sr-bookmark"
          label="ที่คั่นมาตรานี้"
          active={isBookmarked}
          onClick={onToggleBookmark}
        />
        <ToolbarButton
          icon="fi-sr-search"
          label={PANEL_LABELS.search}
          active={activePanel === 'search'}
          onClick={onTogglePanel('search')}
        />
        <ToolbarButton
          icon="fi-sr-book"
          label={PANEL_LABELS.glossary}
          active={activePanel === 'glossary'}
          onClick={onTogglePanel('glossary')}
        />
        <ToolbarButton
          icon="fi-sr-note-sticky"
          label={PANEL_LABELS.notes}
          badge={notesCount}
          active={activePanel === 'notes'}
          onClick={onTogglePanel('notes')}
        />
        <ToolbarButton
          icon="fi-sr-book-bookmark"
          label={PANEL_LABELS.bookmarks}
          badge={bookmarksCount}
          active={activePanel === 'bookmarks'}
          onClick={onTogglePanel('bookmarks')}
        />
        <ToolbarButton
          icon={copiedFlash === 'article' ? 'fi-sr-check-circle' : 'fi-sr-copy'}
          label={copiedFlash === 'article' ? 'คัดลอกแล้ว' : 'คัดลอกมาตรานี้'}
          active={copiedFlash === 'article'}
          disabled={!canCopy}
          onClick={onCopyArticle}
        />
        <ToolbarButton
          icon={copiedFlash === 'link' ? 'fi-sr-check-circle' : 'fi-sr-link'}
          label={copiedFlash === 'link' ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์มาตรานี้'}
          active={copiedFlash === 'link'}
          onClick={onShareLink}
        />
        <ToolbarButton
          icon="fi-sr-file"
          label="พิมพ์มาตรานี้"
          disabled={!canCopy}
          onClick={onPrintArticle}
        />
        <ToolbarButton icon="fi-sr-books" label="พิมพ์กฎหมายทั้งฉบับ" onClick={onPrintLaw} />
      </div>

      <button
        ref={chevronRef}
        type="button"
        aria-expanded={expanded}
        aria-controls="krulaw-dock-actions"
        aria-label={expanded ? 'ซ่อนการกระทำ' : 'แสดงการกระทำ'}
        title={expanded ? 'ซ่อนการกระทำ' : 'แสดงการกระทำ'}
        onClick={() => setExpanded((o) => !o)}
        className="flex h-8 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-slate-500 dark:hover:text-white"
      >
        <i
          aria-hidden="true"
          className={`fi fi-sr-angle-small-down text-xs transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
    </div>
  );
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

function BookmarksPanel({
  keys,
  labelOf,
  onNavigate,
  onRemove,
}: {
  keys: string[];
  labelOf: (key: string) => string;
  onNavigate: (key: string) => void;
  onRemove: (key: string) => void;
}) {
  if (keys.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">
        ยังไม่มีที่คั่นหน้า — กดปุ่มที่คั่นหน้าในแถบเครื่องมือเพื่อบันทึกมาตราที่กำลังอ่าน
      </p>
    );
  }
  return (
    <ul className="space-y-1.5">
      {keys.map((key) => (
        <li
          key={key}
          className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
        >
          <button
            type="button"
            onClick={() => onNavigate(key)}
            className="min-w-0 flex-1 cursor-pointer text-left text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
          >
            {labelOf(key)}
          </button>
          <button
            type="button"
            onClick={() => onRemove(key)}
            aria-label={`ลบที่คั่นหน้า ${labelOf(key)}`}
            className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-slate-800"
          >
            <i aria-hidden="true" className="fi fi-sr-trash text-xs" />
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---------------------------------------------------------------------------
// Reader client
// ---------------------------------------------------------------------------

export default function KrulawReaderClient({ law }: { law: LawDoc }) {
  const { theme, setTheme, paperTone, setPaperTone } = useTheme();
  const {
    settings,
    setSettings,
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

  // --- jump target: scroll + temporary highlight + hash + position ----------
  const navigateTo = useCallback((key: string, opts?: { instant?: boolean }) => {
    const el = document.getElementById(`มาตรา-${key}`);
    if (el === null) return;
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior = opts?.instant === true || reducedMotion ? 'auto' : 'smooth';
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

  // --- post-hydration: hash deep link (FR2) / last position (FR10) ----------
  // Mount-time values are captured once via lazy ref init (client-only tree,
  // ssr:false) so the effect itself stays dependency-free — no rule disables.
  // The HASH is deliberately NOT captured here: on a full load with
  // `#มาตรา-N` the router may still be applying it, and a stale mount-time
  // read would let the last-position restore scroll elsewhere AND clobber the
  // deep link via replaceState. It is read fresh inside the setTimeout(0)
  // callback instead, when the router has settled.
  const mountDataRef = useRef<{
    restoreKey: string | null;
    firstKey: string | null;
  } | null>(null);
  if (mountDataRef.current === null) {
    mountDataRef.current = {
      restoreKey: lastPosition,
      firstKey: flat[0] !== undefined ? articleKeyOf(flat[0].article) : null,
    };
  }

  useEffect(() => {
    const { restoreKey, firstKey } = mountDataRef.current as {
      restoreKey: string | null;
      firstKey: string | null;
    };
    // State writes are deferred out of the effect body (compiler rule).
    const timer = window.setTimeout(() => {
      // Deep-link hash read HERE — by now the router has applied it, so a
      // full load with #มาตรา-N beats the stored last position.
      const hashKey = parseHashToKey(window.location.hash);
      const target = hashKey ?? restoreKey;
      if (target !== null && document.getElementById(`มาตรา-${target}`) !== null) {
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
      } else if (firstKey !== null) {
        // No deep link / nothing to restore — default to the first article so
        // prev/next + bookmark-current are usable immediately.
        setActiveKey(firstKey);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

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
    },
    [],
  );

  // --- krulaw-immersive body hook (P6): navbar hidden on reader pages; the
  //     class is set post-hydration (client-only tree) and cleaned up on
  //     unmount. DigestStudyClient owns its own hook on the digest page.
  useEffect(() => {
    document.body.classList.add('krulaw-immersive');
    return () => document.body.classList.remove('krulaw-immersive');
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
    if (openPanel === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenPanel(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
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
        ? (startNode as Element).closest('[data-krulaw-body]')
        : startNode.parentElement?.closest('[data-krulaw-body]');
    if (bodyEl === null || bodyEl === undefined) return;
    const key = bodyEl.getAttribute('data-krulaw-article') ?? '';
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
        const el = document.querySelector(
          `[data-krulaw-term="${CSS.escape(def.term)}"]`,
        ) as HTMLElement | null;
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

  const handleTooltipOpenArticle = useCallback(
    (key: string) => {
      closeTooltip();
      navigateTo(key, { instant: true });
    },
    [closeTooltip, navigateTo],
  );

  const handleBookmarkCurrent = useCallback(() => {
    if (activeKey !== null) toggleBookmark(activeKey);
  }, [activeKey, toggleBookmark]);

  // --- ReadingDock handlers (FR-C): theme / tone / typography cycles ------
  const handleCycleTheme = useCallback(() => {
    setTheme(THEME_CYCLE[theme].next);
  }, [theme, setTheme]);

  const handleCyclePaperTone = useCallback(() => {
    const next = TONE_ORDER[(TONE_ORDER.indexOf(paperTone) + 1) % TONE_ORDER.length];
    setPaperTone(next);
  }, [paperTone, setPaperTone]);

  const handleFontSizeStep = useCallback(
    (dir: -1 | 1) => {
      const next = stepFontSize(settings.fontSize, dir);
      if (next !== null) setSettings({ ...settings, fontSize: next });
    },
    [settings, setSettings],
  );

  const handleCycleWidth = useCallback(() => {
    const next = WIDTH_ORDER[(WIDTH_ORDER.indexOf(settings.width) + 1) % WIDTH_ORDER.length];
    setSettings({ ...settings, width: next });
  }, [settings, setSettings]);

  const handleCycleLineHeight = useCallback(() => {
    setSettings({ ...settings, lineHeight: nextLineHeight(settings.lineHeight) });
  }, [settings, setSettings]);

  /** Dock panel buttons: remember the opener for drawer focus restore. */
  const handleTogglePanel = useCallback(
    (panel: PanelKind) => (e: React.MouseEvent<HTMLButtonElement>) => {
      openPanelButtonRef.current = e.currentTarget;
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

  // --- FR12/FR13 toolbar actions: copy article / copy deep link / print -----
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

  /** Deep link — pathname (hash may already be set via history.replaceState). */
  const handleShareLink = useCallback(async () => {
    const hash = activeKey !== null ? `#มาตรา-${activeKey}` : '';
    const url = `${window.location.origin}${window.location.pathname}${hash}`;
    const ok = await copyText(url);
    if (ok) flashCopied('link');
  }, [activeKey, flashCopied]);

  const handlePrintArticle = useCallback(() => {
    if (activeKey === null) return;
    const hit = findArticleByKey(law, activeKey);
    if (hit === undefined) return;
    printArticle(hit.article, law);
  }, [activeKey, law]);

  const handlePrintLaw = useCallback(() => printLaw(law), [law]);

  const isBookmarked = activeKey !== null && bookmarkKeySet.has(activeKey);

  const highlightCountFor = useCallback(
    (key: string) => highlights.some((h) => h.articleKey === key),
    [highlights],
  );

  const mainClass = `${FONT_SIZE_CLASS[settings.fontSize]} leading-relaxed`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* law header */}
      <header className="border-b border-slate-100 pb-5 dark:border-slate-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <Link
              href="/krulaw"
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
        <EditionTimeline editions={law.editions} />
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <div className="mb-6 lg:mb-0">
          <TocSidebar
            law={law}
            activeKey={activeKey}
            onNavigate={navigateTo}
            onActiveChange={setActiveKey}
          />
        </div>

        <div
          className={`krulaw-article-card mx-auto rounded-2xl border border-slate-200 bg-white p-4 pr-14 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 md:pr-24 ${WIDTH_CLASS[settings.width]}`}
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
            />
          </section>
        </div>
      </div>

      {/* floating reading-tool dock (FR-C) — above BackToTop, right edge */}
      <ReadingDock
        theme={theme}
        onCycleTheme={handleCycleTheme}
        paperTone={paperTone}
        onCyclePaperTone={handleCyclePaperTone}
        settings={settings}
        onFontSizeStep={handleFontSizeStep}
        onCycleWidth={handleCycleWidth}
        onCycleLineHeight={handleCycleLineHeight}
        isBookmarked={isBookmarked}
        onToggleBookmark={handleBookmarkCurrent}
        activePanel={openPanel}
        onTogglePanel={handleTogglePanel}
        notesCount={notes.length}
        bookmarksCount={bookmarks.length}
        copiedFlash={copiedFlash}
        onCopyArticle={handleCopyArticle}
        onShareLink={handleShareLink}
        onPrintArticle={handlePrintArticle}
        onPrintLaw={handlePrintLaw}
        canCopy={activeKey !== null}
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
                <SearchPanel articles={articles} onJump={handlePanelJump} />
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
                  keys={bookmarks}
                  labelOf={labelOf}
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
        />
      )}
    </div>
  );
}
