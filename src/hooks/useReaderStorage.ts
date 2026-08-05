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
import type { ReadingSettingsValue } from '@/app/(website)/lawlib/lib/reader-props';

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

/** FR11 defaults — also the reset value for a future "restore defaults" action. */
export const DEFAULT_READING_SETTINGS: ReadingSettingsValue = {
  fontSize: 'm',
  lineHeight: 1.8,
  width: 'normal',
};

/**
 * Shared FR11 validator (P3) — sanitizes ANY parsed value into a valid
 * `ReadingSettingsValue`: valid enum members pass through unchanged, unknown
 * values fall back to defaults ('xs'/'L' → 'm', 'huge' → 'normal'), missing
 * fields are filled from DEFAULT_READING_SETTINGS, and lineHeight is clamped
 * into [1.5, 2.2] (non-finite or non-number → 1.8). Non-object input (null,
 * string, number, …) returns the defaults. Single source of truth — used by
 * the hook's read path AND by SettingsMenu via loadGlobalSettings, so stored
 * values are always sanitized, never returned raw.
 */
export function validateReadingSettings(input: unknown): ReadingSettingsValue {
  if (typeof input !== 'object' || input === null) return DEFAULT_READING_SETTINGS;
  const o = input as Record<string, unknown>;
  const fontSize =
    o.fontSize === 's' || o.fontSize === 'm' || o.fontSize === 'l' || o.fontSize === 'xl'
      ? o.fontSize
      : DEFAULT_READING_SETTINGS.fontSize;
  const width =
    o.width === 'narrow' || o.width === 'normal' || o.width === 'wide'
      ? o.width
      : DEFAULT_READING_SETTINGS.width;
  const lineHeight =
    typeof o.lineHeight === 'number' && Number.isFinite(o.lineHeight)
      ? Math.min(2.2, Math.max(1.5, o.lineHeight))
      : DEFAULT_READING_SETTINGS.lineHeight;
  return { fontSize, lineHeight, width };
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
  setSettings: (next: ReadingSettingsValue) => void;
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
    (next: ReadingSettingsValue) => {
      setSettingsState(next);
      safeSetJSON(keys.settings, next);
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
