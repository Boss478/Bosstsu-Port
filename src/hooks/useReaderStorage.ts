'use client';

/**
 * LawLib — reader persistence (FR10 bookmarks, FR11 settings, FR14 notes +
 * highlights), one hook over localStorage under `lawlib:*` keys.
 *
 * SAFETY: lazy `useState` init reads localStorage directly, so this hook may
 * ONLY be used inside the `ssr: false` Shell boundary (LawlibReaderShell →
 * LawlibReaderClient). Using it in an SSR'd tree would cause hydration
 * mismatch. All reads are defensive: null / parse-failure / wrong shape
 * fall back to defaults.
 *
 * Scoping: pass `scope` (e.g. the law slug) to namespace every key as
 * `lawlib:<scope>:*`. With no/empty scope the legacy `lawlib:*` keys are used
 * (backward-compatible). Article keys are law-local (`${no}${suffix}`), so a
 * scope keeps bookmarks/notes/highlights/lastPosition per law. SETTINGS are
 * the exception — FR11 is device-wide: one unscoped `lawlib:settings` key
 * shared by every law, so reading preferences survive law switches.
 *
 * Exports (P3, shared with SettingsMenu): `validateReadingSettings` is the ONE
 * sanitizer for every settings read; `loadGlobalSettings`/`saveGlobalSettings`
 * read/write the device-wide `lawlib:settings` key directly.
 */
import { useCallback, useMemo, useState } from 'react';
import { safeGetJSON, safeGetString, safeSetJSON, safeSetString } from '@/lib/storage';
import type {
  DockToolKey,
  ParagraphSpacing,
  ReaderFontFamily,
  ReaderFontWeight,
  ReadingSettingsValue,
} from '@/app/(website)/lawlib/lib/reader-props';

const KEY_BASES = {
  bookmarks: 'bookmarks',
  lastPosition: 'last-position',
  notes: 'notes',
  highlights: 'highlights',
  view: 'view',
} as const;

/** FR11 settings — device-wide (NOT per-law scoped): one key for every law. */
const SETTINGS_KEY = 'lawlib:settings';

/** FR14 — user note attached to an article. */
export interface Note {
  id: string;
  articleKey: string;
  text: string;
  createdAt: string; // ISO 8601
}

/** FR14 — selection highlight; start/end = char offsets into the article's PLAIN text. */
export interface Highlight {
  id: string;
  articleKey: string;
  start: number;
  end: number;
  createdAt: string; // ISO 8601
}

/**
 * FR11 defaults — also the reset value for a future "restore defaults" action.
 * T10a contract change (ADR-019 D4/D5): fontSize 16px (was 'm'), width 100%
 * of the 80ch baseline (was 60ch/'normal'; user decision 2026-08-06 widens
 * the slider to 80-120%), lineHeight 1.8 stays (clamp floor 1.0).
 * T10b (ADR-019 D4): fontFamily sarabun · toolbarSize 44 ·
 * paragraphSpacing 0 · fontWeight normal · hideRepealed/
 * hideAmendmentNotes/focusMode off · autoScrollSpeed 0 (off).
 * T12 (ADR-019 D9 — dock v2.1): glassOpacity default 75→35 (real glass —
 * 30-40% see-through; the L1 panel + collapsed icon blur-xs via
 * --lawlib-glass-blur-xs) · + animateDock true (expand/collapse animation,
 * respects prefers-reduced-motion).
 */
export const DEFAULT_READING_SETTINGS: ReadingSettingsValue = {
  fontSize: 16,
  lineHeight: 1.8,
  width: 100,
  favoriteToolKeys: ['theme', 'fontSize', 'lineHeight', 'width', 'bookmark', 'search', 'notes'],
  fontFamily: 'sarabun',
  glassOpacity: 35,
  toolbarSize: 44,
  paragraphSpacing: 0,
  fontWeight: 'normal',
  hideRepealed: false,
  hideAmendmentNotes: false,
  focusMode: false,
  autoScrollSpeed: 0,
  animateDock: true,
};

/** All dock tools (runtime list for validation + the dock's Level-2 rows).
 *  The TYPE lives in reader-props.ts (frozen contract stays type-only). */
export const DOCK_TOOL_KEYS: readonly DockToolKey[] = [
  'theme',
  'fontSize',
  'lineHeight',
  'width',
  'bookmark',
  'search',
  'notes',
  'glossary',
  'copy',
  'copyLink',
  'settings',
];

/** Font size clamp (px). */
const FONT_SIZE_MIN = 8;
const FONT_SIZE_MAX = 32;
/** Content width clamp — PERCENT of the 80ch baseline (80-120%, user
 *  decision 2026-08-06; was 40-80ch). */
const WIDTH_MIN = 80;
const WIDTH_MAX = 120;
/** Line height clamp (was [1.5, 2.2] — T10a widens to [1.0, 2.0]). */
const LINE_HEIGHT_MIN = 1.0;
const LINE_HEIGHT_MAX = 2.0;
/** T10b clamps (ADR-019 D4): glass 0-100% · toolbar 24-56px · auto-scroll
 *  0-5 (int). The toolbar floor stays 24 HERE — the 44px touch floor is a
 *  DOCK policy (WCAG 2.5.8), not a storage rule (a 24px desktop choice must
 *  survive a reload on the same device). */
const GLASS_OPACITY_MIN = 0;
const GLASS_OPACITY_MAX = 100;
const TOOLBAR_SIZE_MIN = 24;
const TOOLBAR_SIZE_MAX = 56;
const AUTO_SCROLL_MIN = 0;
const AUTO_SCROLL_MAX = 5;
/** T10b whitelists — unknown stored values fall back to the defaults. */
const FONT_FAMILIES: readonly ReaderFontFamily[] = [
  'sarabun',
  'noto-sans-thai',
  'mali',
  'bai-jamjuree',
  'itim',
];
const FONT_WEIGHTS: readonly ReaderFontWeight[] = ['normal', 'bold'];
const PARAGRAPH_SPACINGS: readonly number[] = [0, 0.5, 1];
/** Legacy enum → number migrations (ADR-019 D4/D5 — MUST NOT drop stored
 *  values: a user on 'l' must keep 18px, not silently reset to 16). Width
 *  map moved to the PERCENT scale 2026-08-06 (was 40/60/80ch). */
const LEGACY_FONT_SIZE: Record<string, number> = { s: 14, m: 16, l: 18, xl: 24 };
const LEGACY_WIDTH: Record<string, number> = { narrow: 80, normal: 100, wide: 120 };

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** T10b: round a stored paragraphSpacing to the nearest allowed step {0,.5,1}
 *  (idempotent on valid values). */
function sanitizeParagraphSpacing(value: unknown): ParagraphSpacing {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const snapped = PARAGRAPH_SPACINGS.reduce((best, s) =>
    Math.abs(s - value) < Math.abs(best - value) ? s : best,
  );
  return snapped as ParagraphSpacing;
}

/** T10b: settings change notification — LawlibGlassVars (lawlib layout)
 *  listens so the dock+search glass vars track the slider on every page. */
export const SETTINGS_CHANGED_EVENT = 'lawlib:settings-changed';

function notifySettingsChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
  }
}

/**
 * Shared FR11 validator (P3) — sanitizes ANY parsed value into a valid
 * `ReadingSettingsValue` (T10a contract: numeric fontSize/width with legacy
 * enum migration, lineHeight clamped [1.0, 2.0], favoriteToolKeys filtered
 * to known dock tools). Non-object input (null, string, number, …) returns
 * the defaults. Single source of truth — used by the hook's read path AND by
 * SettingsMenu via loadGlobalSettings, so stored values are always
 * sanitized, never returned raw.
 */
export function validateReadingSettings(input: unknown): ReadingSettingsValue {
  if (typeof input !== 'object' || input === null) return DEFAULT_READING_SETTINGS;
  const o = input as Record<string, unknown>;

  const rawFontSize = o.fontSize;
  let fontSize = DEFAULT_READING_SETTINGS.fontSize;
  if (typeof rawFontSize === 'number' && Number.isFinite(rawFontSize)) {
    fontSize = clamp(rawFontSize, FONT_SIZE_MIN, FONT_SIZE_MAX);
  } else if (typeof rawFontSize === 'string') {
    const legacy = LEGACY_FONT_SIZE[rawFontSize];
    if (legacy !== undefined) fontSize = legacy;
  }

  const rawWidth = o.width;
  let width = DEFAULT_READING_SETTINGS.width;
  if (typeof rawWidth === 'number' && Number.isFinite(rawWidth)) {
    // Legacy numeric widths (T10a dock, pre-2026-08-06) were ch in [40,80]:
    // rescale linearly onto the PERCENT scale (40→80%, 60→100%, 79→119%).
    // The overlap value 80 is left as-is — it is ALSO the new 80% minimum,
    // and remapping it would corrupt a fresh 80% choice on the next reload
    // (the validator runs on every load; it must be idempotent). Anything
    // outside the legacy range clamps into [80,120].
    width = rawWidth >= 40 && rawWidth < 80 ? rawWidth + 40 : clamp(rawWidth, WIDTH_MIN, WIDTH_MAX);
  } else if (typeof rawWidth === 'string') {
    const legacy = LEGACY_WIDTH[rawWidth];
    if (legacy !== undefined) width = legacy;
  }

  const lineHeight =
    typeof o.lineHeight === 'number' && Number.isFinite(o.lineHeight)
      ? clamp(o.lineHeight, LINE_HEIGHT_MIN, LINE_HEIGHT_MAX)
      : DEFAULT_READING_SETTINGS.lineHeight;

  // --- T10b fields (ADR-019 D4): whitelists + clamps, defaults on garbage.
  //     Every migration is IDEMPOTENT — the validator runs on every load, so
  //     a stored valid value must pass through unchanged.
  const fontFamily = FONT_FAMILIES.includes(o.fontFamily as ReaderFontFamily)
    ? (o.fontFamily as ReaderFontFamily)
    : DEFAULT_READING_SETTINGS.fontFamily;
  let glassOpacity =
    typeof o.glassOpacity === 'number' && Number.isFinite(o.glassOpacity)
      ? clamp(o.glassOpacity, GLASS_OPACITY_MIN, GLASS_OPACITY_MAX)
      : DEFAULT_READING_SETTINGS.glassOpacity;
  // T12c (ADR-019 D9): 75 was the v1.11.1 SHIPPED DEFAULT — a stored 75 means
  // the user never touched the slider (or reset it), so it MIGRATES to the
  // new default 35 ("settings-sacred EXCEPT the old default"). Every other
  // stored value — including the deliberate extremes 0 and 100 — passes
  // through untouched. Behaviorally idempotent: 75 is treated as 35 on every
  // load, and the next settings write persists 35.
  if (glassOpacity === 75) glassOpacity = DEFAULT_READING_SETTINGS.glassOpacity;
  const toolbarSize =
    typeof o.toolbarSize === 'number' && Number.isFinite(o.toolbarSize)
      ? clamp(Math.round(o.toolbarSize), TOOLBAR_SIZE_MIN, TOOLBAR_SIZE_MAX)
      : DEFAULT_READING_SETTINGS.toolbarSize;
  const paragraphSpacing = sanitizeParagraphSpacing(o.paragraphSpacing);
  const fontWeight = FONT_WEIGHTS.includes(o.fontWeight as ReaderFontWeight)
    ? (o.fontWeight as ReaderFontWeight)
    : DEFAULT_READING_SETTINGS.fontWeight;
  const hideRepealed =
    typeof o.hideRepealed === 'boolean' ? o.hideRepealed : DEFAULT_READING_SETTINGS.hideRepealed;
  const hideAmendmentNotes =
    typeof o.hideAmendmentNotes === 'boolean'
      ? o.hideAmendmentNotes
      : DEFAULT_READING_SETTINGS.hideAmendmentNotes;
  const focusMode =
    typeof o.focusMode === 'boolean' ? o.focusMode : DEFAULT_READING_SETTINGS.focusMode;
  const autoScrollSpeed =
    typeof o.autoScrollSpeed === 'number' && Number.isFinite(o.autoScrollSpeed)
      ? clamp(Math.round(o.autoScrollSpeed), AUTO_SCROLL_MIN, AUTO_SCROLL_MAX)
      : DEFAULT_READING_SETTINGS.autoScrollSpeed;
  const animateDock =
    typeof o.animateDock === 'boolean' ? o.animateDock : DEFAULT_READING_SETTINGS.animateDock;

  let favoriteToolKeys = DEFAULT_READING_SETTINGS.favoriteToolKeys;
  if (Array.isArray(o.favoriteToolKeys)) {
    const seen = new Set<DockToolKey>();
    const filtered: DockToolKey[] = [];
    for (const k of o.favoriteToolKeys) {
      if (typeof k !== 'string') continue;
      const key = k as DockToolKey;
      if (!DOCK_TOOL_KEYS.includes(key) || seen.has(key)) continue;
      seen.add(key);
      filtered.push(key);
    }
    // An explicitly stored array WINS even when empty (the user unpinned
    // everything — Level 1 degrades to เพิ่มเติม only, an honest state).
    favoriteToolKeys = filtered;
  }

  return {
    fontSize,
    lineHeight,
    width,
    favoriteToolKeys,
    fontFamily,
    glassOpacity,
    toolbarSize,
    paragraphSpacing,
    fontWeight,
    hideRepealed,
    hideAmendmentNotes,
    focusMode,
    autoScrollSpeed,
    animateDock,
  };
}

/**
 * Reads the device-wide settings key `lawlib:settings` (FR11 — one key shared
 * by every law). Returns null when the key is missing or the stored JSON is
 * unparseable; anything that parses is passed through the SHARED validator
 * (invalid values sanitized, never returned raw).
 */
export function loadGlobalSettings(): ReadingSettingsValue | null {
  const raw = safeGetJSON<unknown>(SETTINGS_KEY);
  return raw === null ? null : validateReadingSettings(raw);
}

/** Writes settings JSON under the device-wide `lawlib:settings` key (FR11). */
export function saveGlobalSettings(value: ReadingSettingsValue): void {
  safeSetJSON(SETTINGS_KEY, value);
}

/** Per-slug view mode — the FULL/COMPACT merge toggle (rev 5.5). */
export type ReaderViewMode = 'compact' | 'full';

/**
 * Reads the per-slug view key `lawlib:<scope>:view` (NOT device-wide — the
 * FULL/COMPACT choice is per law, unlike settings). Whitelist-only: the stored
 * value is returned ONLY when `=== 'compact' || === 'full'`; anything else
 * (corrupt/foreign/junk — loop-3 #1) → null, and the caller applies its
 * default ('compact' when a digest exists, else 'full').
 *
 * TRUST CHAIN (loop-3 #4): `scope` is the law slug, constrained at build by
 * the z-schema in validate.ts:107-109 (build fails otherwise), at the route by
 * the page regex (page.tsx:41) + index.json membership + dynamicParams=false
 * (unknown slugs are real 404s). A hostile slug cannot reach this key, and
 * localStorage keys are inert strings regardless — do not weaken these guards
 * in the name of "hardening".
 */
export function loadPerSlugView(scope: string): ReaderViewMode | null {
  const raw = safeGetString(`lawlib:${scope}:${KEY_BASES.view}`);
  return raw === 'compact' || raw === 'full' ? raw : null;
}

/** Writes the per-slug view mode under `lawlib:<scope>:view` (whitelisted). */
export function savePerSlugView(scope: string, mode: ReaderViewMode): void {
  safeSetString(`lawlib:${scope}:${KEY_BASES.view}`, mode);
}

function isNote(v: unknown): v is Note {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.articleKey === 'string' &&
    typeof o.text === 'string' &&
    typeof o.createdAt === 'string'
  );
}

function isHighlight(v: unknown): v is Highlight {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.articleKey === 'string' &&
    typeof o.start === 'number' &&
    Number.isFinite(o.start) &&
    typeof o.end === 'number' &&
    Number.isFinite(o.end) &&
    typeof o.createdAt === 'string'
  );
}

/** Defensive array read — drops malformed items, returns [] on any failure. */
function readArray<T>(key: string, guard: (v: unknown) => v is T): T[] {
  const raw = safeGetJSON<unknown>(key);
  return Array.isArray(raw) ? raw.filter(guard) : [];
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export interface ReaderStorage {
  settings: ReadingSettingsValue;
  /** Full replacement or updater — the settings never mutate partial state.
   *  Persists + dispatches `lawlib:settings-changed` (LawlibGlassVars). */
  setSettings: (
    next: ReadingSettingsValue | ((prev: ReadingSettingsValue) => ReadingSettingsValue),
  ) => void;
  /** Per-slug view mode (`lawlib:<scope>:view`); null when unset — caller applies the default. */
  view: ReaderViewMode | null;
  setView: (mode: ReaderViewMode) => void;
  bookmarks: string[];
  toggleBookmark: (articleKey: string) => void;
  lastPosition: string | null;
  savePosition: (articleKey: string) => void;
  notes: Note[];
  addNote: (note: Omit<Note, 'id' | 'createdAt'>) => void;
  updateNote: (id: string, text: string) => void;
  deleteNote: (id: string) => void;
  highlights: Highlight[];
  addHighlight: (highlight: Omit<Highlight, 'id' | 'createdAt'>) => void;
  removeHighlight: (id: string) => void;
}

/**
 * Reader persistence over localStorage under `lawlib:*` (or `lawlib:<scope>:*`
 * when `scope` is provided) — EXCEPT settings, which are always the single
 * device-wide `lawlib:settings` key (FR11). Scope is captured once at mount —
 * the hook is mounted per reader page, so a changing scope never needs
 * re-syncing.
 */
export function useReaderStorage(scope?: string): ReaderStorage {
  const keys = useMemo(() => {
    const prefix = scope !== undefined && scope !== '' ? `lawlib:${scope}:` : 'lawlib:';
    return {
      settings: SETTINGS_KEY,
      bookmarks: `${prefix}${KEY_BASES.bookmarks}`,
      lastPosition: `${prefix}${KEY_BASES.lastPosition}`,
      notes: `${prefix}${KEY_BASES.notes}`,
      highlights: `${prefix}${KEY_BASES.highlights}`,
      view: `${prefix}${KEY_BASES.view}`,
    };
  }, [scope]);

  const [settings, setSettingsState] = useState<ReadingSettingsValue>(() =>
    validateReadingSettings(safeGetJSON<unknown>(keys.settings)),
  );
  const [bookmarks, setBookmarks] = useState<string[]>(() =>
    readArray(keys.bookmarks, (v): v is string => typeof v === 'string'),
  );
  const [lastPosition, setLastPosition] = useState<string | null>(() => {
    const raw = safeGetString(keys.lastPosition);
    return raw && raw.length > 0 ? raw : null;
  });
  const [view, setViewState] = useState<ReaderViewMode | null>(() => {
    if (scope === undefined || scope === '') return null;
    return loadPerSlugView(scope);
  });
  const [notes, setNotes] = useState<Note[]>(() => readArray(keys.notes, isNote));
  const [highlights, setHighlights] = useState<Highlight[]>(() =>
    readArray(keys.highlights, isHighlight),
  );

  const setSettings = useCallback(
    (next: ReadingSettingsValue | ((prev: ReadingSettingsValue) => ReadingSettingsValue)) => {
      setSettingsState((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        safeSetJSON(keys.settings, resolved);
        return resolved;
      });
      notifySettingsChanged();
    },
    [keys],
  );

  const toggleBookmark = useCallback(
    (articleKey: string) => {
      setBookmarks((prev) => {
        const next = prev.includes(articleKey)
          ? prev.filter((k) => k !== articleKey)
          : [...prev, articleKey];
        safeSetJSON(keys.bookmarks, next);
        return next;
      });
    },
    [keys],
  );

  const savePosition = useCallback(
    (articleKey: string) => {
      setLastPosition(articleKey);
      safeSetString(keys.lastPosition, articleKey);
    },
    [keys],
  );

  const setView = useCallback(
    (mode: ReaderViewMode) => {
      setViewState(mode);
      if (scope !== undefined && scope !== '') savePerSlugView(scope, mode);
    },
    [scope],
  );

  const addNote = useCallback(
    (note: Omit<Note, 'id' | 'createdAt'>) => {
      setNotes((prev) => {
        const next: Note = { ...note, id: makeId(), createdAt: new Date().toISOString() };
        const updated = [...prev, next];
        safeSetJSON(keys.notes, updated);
        return updated;
      });
    },
    [keys],
  );

  const updateNote = useCallback(
    (id: string, text: string) => {
      setNotes((prev) => {
        const updated = prev.map((n) => (n.id === id ? { ...n, text } : n));
        safeSetJSON(keys.notes, updated);
        return updated;
      });
    },
    [keys],
  );

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => {
        const updated = prev.filter((n) => n.id !== id);
        safeSetJSON(keys.notes, updated);
        return updated;
      });
    },
    [keys],
  );

  const addHighlight = useCallback(
    (highlight: Omit<Highlight, 'id' | 'createdAt'>) => {
      setHighlights((prev) => {
        const next: Highlight = { ...highlight, id: makeId(), createdAt: new Date().toISOString() };
        const updated = [...prev, next];
        safeSetJSON(keys.highlights, updated);
        return updated;
      });
    },
    [keys],
  );

  const removeHighlight = useCallback(
    (id: string) => {
      setHighlights((prev) => {
        const updated = prev.filter((h) => h.id !== id);
        safeSetJSON(keys.highlights, updated);
        return updated;
      });
    },
    [keys],
  );

  return {
    settings,
    setSettings,
    view,
    setView,
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
  };
}
