'use client';

/**
 * KruLAW — reader persistence (FR10 bookmarks, FR11 settings, FR14 notes +
 * highlights), one hook over localStorage under `krulaw:*` keys.
 *
 * SAFETY: lazy `useState` init reads localStorage directly, so this hook may
 * ONLY be used inside the `ssr: false` Shell boundary (KrulawReaderShell →
 * KrulawReaderClient). Using it in an SSR'd tree would cause hydration
 * mismatch. All reads are defensive: null / parse-failure / wrong shape
 * fall back to defaults.
 *
 * Scoping: pass `scope` (e.g. the law slug) to namespace every key as
 * `krulaw:<scope>:*`. With no/empty scope the legacy `krulaw:*` keys are used
 * (backward-compatible). Article keys are law-local (`${no}${suffix}`), so a
 * scope keeps bookmarks/notes/highlights/lastPosition per law. SETTINGS are
 * the exception — FR11 is device-wide: one unscoped `krulaw:settings` key
 * shared by every law, so reading preferences survive law switches.
 */
import { useCallback, useMemo, useState } from 'react';
import { safeGetJSON, safeGetString, safeSetJSON, safeSetString } from '@/lib/storage';
import type { ReadingSettingsValue } from '@/app/(website)/krulaw/lib/reader-props';

const KEY_BASES = {
  bookmarks: 'bookmarks',
  lastPosition: 'last-position',
  notes: 'notes',
  highlights: 'highlights',
} as const;

/** FR11 settings — device-wide (NOT per-law scoped): one key for every law. */
const SETTINGS_KEY = 'krulaw:settings';

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

function isReadingSettingsValue(v: unknown): v is ReadingSettingsValue {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    (o.fontSize === 's' || o.fontSize === 'm' || o.fontSize === 'l' || o.fontSize === 'xl') &&
    typeof o.lineHeight === 'number' &&
    Number.isFinite(o.lineHeight) &&
    (o.width === 'narrow' || o.width === 'normal' || o.width === 'wide')
  );
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
 * Reader persistence over localStorage under `krulaw:*` (or `krulaw:<scope>:*`
 * when `scope` is provided) — EXCEPT settings, which are always the single
 * device-wide `krulaw:settings` key (FR11). Scope is captured once at mount —
 * the hook is mounted per reader page, so a changing scope never needs
 * re-syncing.
 */
export function useReaderStorage(scope?: string): ReaderStorage {
  const keys = useMemo(() => {
    const prefix = scope !== undefined && scope !== '' ? `krulaw:${scope}:` : 'krulaw:';
    return {
      settings: SETTINGS_KEY,
      bookmarks: `${prefix}${KEY_BASES.bookmarks}`,
      lastPosition: `${prefix}${KEY_BASES.lastPosition}`,
      notes: `${prefix}${KEY_BASES.notes}`,
      highlights: `${prefix}${KEY_BASES.highlights}`,
    };
  }, [scope]);

  const [settings, setSettingsState] = useState<ReadingSettingsValue>(() => {
    const raw = safeGetJSON<unknown>(keys.settings);
    return isReadingSettingsValue(raw) ? raw : DEFAULT_READING_SETTINGS;
  });
  const [bookmarks, setBookmarks] = useState<string[]>(() =>
    readArray(keys.bookmarks, (v): v is string => typeof v === 'string'),
  );
  const [lastPosition, setLastPosition] = useState<string | null>(() => {
    const raw = safeGetString(keys.lastPosition);
    return raw && raw.length > 0 ? raw : null;
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
