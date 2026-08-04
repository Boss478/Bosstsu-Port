// @vitest-environment jsdom
/**
 * TDD-first (Wave 1, Lane B) — pins the PLANNED P3 settings validator +
 * global helpers (`.agents/plans/krulaw-reading-redesign.md` §4.5) BEFORE
 * implementation. RED NOW: the three helpers do not exist yet — Lane B must
 * export them from `src/hooks/useReaderStorage.ts`:
 *
 *   export function validateReadingSettings(input: unknown): ReadingSettingsValue
 *   export function loadGlobalSettings(): ReadingSettingsValue | null
 *   export function saveGlobalSettings(v: ReadingSettingsValue): void
 *
 * Contract pinned here:
 * - validator sanitizes per-field (valid values kept, invalid → defaults),
 *   clamps lineHeight into [1.5, 2.2], non-finite lineHeight → 1.8,
 *   non-object input → DEFAULT_READING_SETTINGS
 * - loadGlobalSettings reads `krulaw:settings`; returns null when the key is
 *   missing OR JSON.parse fails; any successfully parsed value is passed
 *   through the SHARED validator (so invalid stored values are sanitized,
 *   never returned raw)
 * - saveGlobalSettings writes JSON under `krulaw:settings` (round-trips)
 *
 * jsdom env: load/save may use the window-guarded safeGetJSON/safeSetJSON
 * helpers from `@/lib/storage` (as the hook does today) — jsdom provides
 * window + localStorage, so the round-trip works.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_READING_SETTINGS } from '@/hooks/useReaderStorage';

type StorageApi = typeof import('@/hooks/useReaderStorage');

const SETTINGS_KEY = 'krulaw:settings';

let api: StorageApi;

/** In-memory localStorage stub (repo pattern: tests/unit/phonics/save.test.ts). */
function mockLocalStorage(): void {
  const store = new Map<string, string>();
  const stub = {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((i: number) => [...store.keys()][i] ?? null),
    get length() {
      return store.size;
    },
  };
  vi.stubGlobal('localStorage', stub);
}

beforeEach(async () => {
  api = await import('@/hooks/useReaderStorage');
  mockLocalStorage();
});

describe('validateReadingSettings (P3 — new export)', () => {
  it('passes every valid combination through unchanged', () => {
    const fontSizes = ['s', 'm', 'l', 'xl'] as const;
    const widths = ['narrow', 'normal', 'wide'] as const;
    for (const fontSize of fontSizes) {
      for (const width of widths) {
        const input = { fontSize, lineHeight: 1.8, width };
        expect(api.validateReadingSettings(input)).toEqual(input);
      }
    }
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 1.5, width: 'narrow' }),
    ).toEqual({ fontSize: 'm', lineHeight: 1.5, width: 'narrow' });
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 2.2, width: 'narrow' }),
    ).toEqual({ fontSize: 'm', lineHeight: 2.2, width: 'narrow' });
  });

  it('falls back to "m" for unknown fontSize values', () => {
    expect(
      api.validateReadingSettings({ fontSize: 'xs', lineHeight: 1.8, width: 'normal' }).fontSize,
    ).toBe('m');
    expect(
      api.validateReadingSettings({ fontSize: 'L', lineHeight: 1.8, width: 'normal' }).fontSize,
    ).toBe('m');
  });

  it('falls back to "normal" for unknown width values', () => {
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 1.8, width: 'huge' }).width,
    ).toBe('normal');
  });

  it('fills missing fields with defaults', () => {
    expect(api.validateReadingSettings({})).toEqual(DEFAULT_READING_SETTINGS);
    expect(api.validateReadingSettings({ fontSize: 'l' })).toEqual({
      fontSize: 'l',
      lineHeight: 1.8,
      width: 'normal',
    });
    expect(api.validateReadingSettings({ width: 'wide' })).toEqual({
      fontSize: 'm',
      lineHeight: 1.8,
      width: 'wide',
    });
  });

  it('returns defaults for null, undefined and non-object input', () => {
    expect(api.validateReadingSettings(null)).toEqual(DEFAULT_READING_SETTINGS);
    expect(api.validateReadingSettings(undefined)).toEqual(DEFAULT_READING_SETTINGS);
    expect(api.validateReadingSettings('garbage')).toEqual(DEFAULT_READING_SETTINGS);
    expect(api.validateReadingSettings(42)).toEqual(DEFAULT_READING_SETTINGS);
  });

  it('clamps lineHeight into [1.5, 2.2]', () => {
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 0.5, width: 'normal' }).lineHeight,
    ).toBe(1.5);
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 5.0, width: 'normal' }).lineHeight,
    ).toBe(2.2);
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 1.2, width: 'normal' }).lineHeight,
    ).toBe(1.5);
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 2.5, width: 'normal' }).lineHeight,
    ).toBe(2.2);
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 1.8, width: 'normal' }).lineHeight,
    ).toBe(1.8);
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 1.5, width: 'normal' }).lineHeight,
    ).toBe(1.5);
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 2.2, width: 'normal' }).lineHeight,
    ).toBe(2.2);
  });

  it('falls back to the default lineHeight for non-finite values', () => {
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: Number.NaN, width: 'normal' })
        .lineHeight,
    ).toBe(1.8);
    expect(
      api.validateReadingSettings({
        fontSize: 'm',
        lineHeight: Number.POSITIVE_INFINITY,
        width: 'normal',
      }).lineHeight,
    ).toBe(1.8);
    expect(
      api.validateReadingSettings({
        fontSize: 'm',
        lineHeight: '1.8' as unknown as number,
        width: 'normal',
      }).lineHeight,
    ).toBe(1.8);
  });
});

describe('loadGlobalSettings (P3 — new export)', () => {
  it('returns null when the key is missing', () => {
    expect(api.loadGlobalSettings()).toBeNull();
  });

  it('returns null on unparseable JSON', () => {
    localStorage.setItem(SETTINGS_KEY, '{not json');
    expect(api.loadGlobalSettings()).toBeNull();
  });

  it('returns the parsed settings for a valid stored object', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ fontSize: 'xl', lineHeight: 2.0, width: 'wide' }),
    );
    expect(api.loadGlobalSettings()).toEqual({ fontSize: 'xl', lineHeight: 2.0, width: 'wide' });
  });

  it('sanitizes invalid values through the shared validator (clamps too)', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ fontSize: 'xs', lineHeight: 9, width: 'huge' }),
    );
    expect(api.loadGlobalSettings()).toEqual({ fontSize: 'm', lineHeight: 2.2, width: 'normal' });
  });

  it('returns defaults for parseable but non-object values', () => {
    localStorage.setItem(SETTINGS_KEY, '42');
    expect(api.loadGlobalSettings()).toEqual(DEFAULT_READING_SETTINGS);
  });
});

describe('saveGlobalSettings (P3 — new export)', () => {
  it('writes the settings to krulaw:settings as JSON', () => {
    api.saveGlobalSettings({ fontSize: 'xl', lineHeight: 2.0, width: 'wide' });
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')).toEqual({
      fontSize: 'xl',
      lineHeight: 2.0,
      width: 'wide',
    });
  });

  it('round-trips through loadGlobalSettings', () => {
    const value = { fontSize: 's', lineHeight: 1.7, width: 'narrow' };
    api.saveGlobalSettings(value);
    expect(api.loadGlobalSettings()).toEqual(value);
  });

  it('last write wins', () => {
    api.saveGlobalSettings({ fontSize: 'm', lineHeight: 1.8, width: 'normal' });
    api.saveGlobalSettings({ fontSize: 'xl', lineHeight: 2.2, width: 'wide' });
    expect(api.loadGlobalSettings()).toEqual({ fontSize: 'xl', lineHeight: 2.2, width: 'wide' });
  });
});
