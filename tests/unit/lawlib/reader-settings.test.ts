// @vitest-environment jsdom
/**
 * P3 settings validator + global helpers (T10a contract — ADR-019 D4/D5;
 * width slider 2026-08-06 — user decision).
 *
 * Contract pinned here (numeric fontSize/width + legacy migration):
 * - fontSize: number 8-32 (clamped); legacy 's'/'m'/'l'/'xl' → 14/16/18/24;
 *   non-number/unknown string → default 16
 * - width: PERCENT of the 80ch baseline, number 80-120 (clamped); legacy
 *   'narrow'/'normal'/'wide' → 80/100/120 (was 40/60/80ch); legacy NUMERIC
 *   ch values [40,80) rescale +40 (60→100 — the old default keeps its
 *   position); 80 is the overlap value and passes through untouched
 *   (idempotent on every load); non-number/unknown string → default 100
 * - lineHeight: clamped into [1.0, 2.0] (was [1.5, 2.2]); non-finite → 1.8
 * - favoriteToolKeys: filtered to known dock tools + deduped; missing /
 *   non-array / empty-after-filter → default curated row
 * - non-object input → DEFAULT_READING_SETTINGS
 * - loadGlobalSettings reads `lawlib:settings`; returns null when the key is
 *   missing OR JSON.parse fails; any successfully parsed value is passed
 *   through the SHARED validator (so invalid stored values are sanitized,
 *   never returned raw)
 * - saveGlobalSettings writes JSON under `lawlib:settings` (round-trips)
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DEFAULT_READING_SETTINGS } from '@/hooks/useReaderStorage';

type StorageApi = typeof import('@/hooks/useReaderStorage');

const SETTINGS_KEY = 'lawlib:settings';

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

describe('validateReadingSettings (P3 — T10a numeric contract)', () => {
  it('passes every valid numeric combination through unchanged', () => {
    for (const fontSize of [8, 14, 16, 18, 24, 32]) {
      for (const width of [80, 100, 120]) {
        const input = {
          fontSize,
          lineHeight: 1.8,
          width,
          favoriteToolKeys: ['theme', 'width'],
        };
        expect(api.validateReadingSettings(input)).toEqual(input);
      }
    }
    expect(
      api.validateReadingSettings({
        fontSize: 16,
        lineHeight: 1.0,
        width: 100,
        favoriteToolKeys: [],
      }),
    ).toEqual({ fontSize: 16, lineHeight: 1.0, width: 100, favoriteToolKeys: [] });
    expect(
      api.validateReadingSettings({
        fontSize: 16,
        lineHeight: 2.0,
        width: 100,
        favoriteToolKeys: [],
      }),
    ).toEqual({ fontSize: 16, lineHeight: 2.0, width: 100, favoriteToolKeys: [] });
  });

  it('MIGRATES legacy enum font sizes: s/m/l/xl → 14/16/18/24 (values never silently reset)', () => {
    expect(
      api.validateReadingSettings({ fontSize: 's', lineHeight: 1.8, width: 60 }).fontSize,
    ).toBe(14);
    expect(
      api.validateReadingSettings({ fontSize: 'm', lineHeight: 1.8, width: 60 }).fontSize,
    ).toBe(16);
    expect(
      api.validateReadingSettings({ fontSize: 'l', lineHeight: 1.8, width: 60 }).fontSize,
    ).toBe(18);
    expect(
      api.validateReadingSettings({ fontSize: 'xl', lineHeight: 1.8, width: 60 }).fontSize,
    ).toBe(24);
  });

  it('MIGRATES legacy enum widths: narrow/normal/wide → 80/100/120% (was 40/60/80ch)', () => {
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 'narrow' }).width,
    ).toBe(80);
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 'normal' }).width,
    ).toBe(100);
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 'wide' }).width,
    ).toBe(120);
  });

  it('MIGRATES legacy NUMERIC ch widths [40,80) onto the percent scale (+40; idempotent)', () => {
    // The old dock stored numbers 40-80ch — rescale linearly so the old
    // default 60ch keeps its position (→100%), and the map stays IDEMPOTENT
    // on the new range (80 passes through — it is also the new 80% minimum).
    expect(api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 40 }).width).toBe(
      80,
    );
    expect(api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 60 }).width).toBe(
      100,
    );
    expect(api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 79 }).width).toBe(
      119,
    );
    expect(api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 80 }).width).toBe(
      80,
    );
    // A fresh new-scale value must survive a reload unchanged (idempotency).
    expect(api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 100 }).width).toBe(
      100,
    );
    expect(api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 120 }).width).toBe(
      120,
    );
  });

  it('falls back to the default fontSize for unknown values', () => {
    expect(
      api.validateReadingSettings({ fontSize: 'xs', lineHeight: 1.8, width: 60 }).fontSize,
    ).toBe(16);
    expect(
      api.validateReadingSettings({ fontSize: 'L', lineHeight: 1.8, width: 60 }).fontSize,
    ).toBe(16);
    expect(
      api.validateReadingSettings({ fontSize: 'huge', lineHeight: 1.8, width: 60 }).fontSize,
    ).toBe(16);
    expect(
      api.validateReadingSettings({ fontSize: true, lineHeight: 1.8, width: 60 }).fontSize,
    ).toBe(16);
  });

  it('clamps numeric fontSize into [8, 32] and width into [80, 120]', () => {
    expect(api.validateReadingSettings({ fontSize: 4, lineHeight: 1.8, width: 100 }).fontSize).toBe(
      8,
    );
    expect(
      api.validateReadingSettings({ fontSize: 48, lineHeight: 1.8, width: 100 }).fontSize,
    ).toBe(32);
    // 20 is below even the legacy ch range — clamp to the new minimum.
    expect(api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 20 }).width).toBe(
      80,
    );
    expect(api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 200 }).width).toBe(
      120,
    );
  });

  it('fills missing fields with defaults', () => {
    expect(api.validateReadingSettings({})).toEqual(DEFAULT_READING_SETTINGS);
    expect(api.validateReadingSettings({ fontSize: 18 })).toEqual({
      fontSize: 18,
      lineHeight: 1.8,
      width: 100,
      favoriteToolKeys: DEFAULT_READING_SETTINGS.favoriteToolKeys,
    });
    expect(api.validateReadingSettings({ width: 90 })).toEqual({
      fontSize: 16,
      lineHeight: 1.8,
      width: 90,
      favoriteToolKeys: DEFAULT_READING_SETTINGS.favoriteToolKeys,
    });
  });

  it('returns defaults for null, undefined and non-object input', () => {
    expect(api.validateReadingSettings(null)).toEqual(DEFAULT_READING_SETTINGS);
    expect(api.validateReadingSettings(undefined)).toEqual(DEFAULT_READING_SETTINGS);
    expect(api.validateReadingSettings('garbage')).toEqual(DEFAULT_READING_SETTINGS);
    expect(api.validateReadingSettings(42)).toEqual(DEFAULT_READING_SETTINGS);
  });

  it('clamps lineHeight into [1.0, 2.0]', () => {
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: 0.5, width: 60 }).lineHeight,
    ).toBe(1.0);
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: 5.0, width: 60 }).lineHeight,
    ).toBe(2.0);
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: 1.2, width: 60 }).lineHeight,
    ).toBe(1.2);
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: 1.5, width: 60 }).lineHeight,
    ).toBe(1.5);
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: 2.2, width: 60 }).lineHeight,
    ).toBe(2.0);
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: 1.8, width: 60 }).lineHeight,
    ).toBe(1.8);
  });

  it('falls back to the default lineHeight for non-finite values', () => {
    expect(
      api.validateReadingSettings({ fontSize: 16, lineHeight: Number.NaN, width: 60 }).lineHeight,
    ).toBe(1.8);
    expect(
      api.validateReadingSettings({
        fontSize: 16,
        lineHeight: Number.POSITIVE_INFINITY,
        width: 60,
      }).lineHeight,
    ).toBe(1.8);
    expect(
      api.validateReadingSettings({
        fontSize: 16,
        lineHeight: '1.8' as unknown as number,
        width: 60,
      }).lineHeight,
    ).toBe(1.8);
  });

  it('keeps favoriteToolKeys as-is when all keys are known (order preserved)', () => {
    const keys = ['width', 'bookmark', 'theme', 'search'];
    expect(
      api.validateReadingSettings({
        fontSize: 16,
        lineHeight: 1.8,
        width: 60,
        favoriteToolKeys: keys,
      }).favoriteToolKeys,
    ).toEqual(keys);
  });

  it('drops unknown favoriteToolKeys and dedupes', () => {
    expect(
      api.validateReadingSettings({
        fontSize: 16,
        lineHeight: 1.8,
        width: 60,
        favoriteToolKeys: ['nope', 'theme', 'theme', 42, 'copy'],
      }).favoriteToolKeys,
    ).toEqual(['theme', 'copy']);
  });

  it('an explicit array wins even when empty or all-unknown (unpin-all state)', () => {
    expect(api.validateReadingSettings({ favoriteToolKeys: [] }).favoriteToolKeys).toEqual([]);
    expect(api.validateReadingSettings({ favoriteToolKeys: ['bogus'] }).favoriteToolKeys).toEqual(
      [],
    );
  });

  it('falls back to the default favorites for missing/non-array values', () => {
    expect(api.validateReadingSettings({ fontSize: 16 }).favoriteToolKeys).toEqual(
      DEFAULT_READING_SETTINGS.favoriteToolKeys,
    );
    expect(api.validateReadingSettings({ favoriteToolKeys: 'theme' }).favoriteToolKeys).toEqual(
      DEFAULT_READING_SETTINGS.favoriteToolKeys,
    );
  });
});

describe('loadGlobalSettings (P3 — shared validator path)', () => {
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
      JSON.stringify({ fontSize: 24, lineHeight: 2.0, width: 80, favoriteToolKeys: ['theme'] }),
    );
    expect(api.loadGlobalSettings()).toEqual({
      fontSize: 24,
      lineHeight: 2.0,
      width: 80,
      favoriteToolKeys: ['theme'],
    });
  });

  it('sanitizes invalid values through the shared validator (clamps too)', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ fontSize: 'xs', lineHeight: 9, width: 'huge' }),
    );
    expect(api.loadGlobalSettings()).toEqual({
      fontSize: 16,
      lineHeight: 2.0,
      width: 100,
      favoriteToolKeys: DEFAULT_READING_SETTINGS.favoriteToolKeys,
    });
  });

  it('MIGRATES a legacy v1.10.x stored object through the shared validator', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ fontSize: 'l', lineHeight: 2.1, width: 'wide' }),
    );
    expect(api.loadGlobalSettings()).toEqual({
      fontSize: 18,
      lineHeight: 2.0,
      width: 120,
      favoriteToolKeys: DEFAULT_READING_SETTINGS.favoriteToolKeys,
    });
  });

  it('returns defaults for parseable but non-object values', () => {
    localStorage.setItem(SETTINGS_KEY, '42');
    expect(api.loadGlobalSettings()).toEqual(DEFAULT_READING_SETTINGS);
  });
});

describe('saveGlobalSettings (P3 — new export)', () => {
  it('writes the settings to lawlib:settings as JSON', () => {
    api.saveGlobalSettings({ fontSize: 24, lineHeight: 2.0, width: 80, favoriteToolKeys: [] });
    expect(JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? 'null')).toEqual({
      fontSize: 24,
      lineHeight: 2.0,
      width: 80,
      favoriteToolKeys: [],
    });
  });

  it('round-trips through loadGlobalSettings', () => {
    const value = {
      fontSize: 14,
      lineHeight: 1.7,
      width: 100,
      favoriteToolKeys: ['bookmark', 'copy'],
    };
    api.saveGlobalSettings(value);
    expect(api.loadGlobalSettings()).toEqual(value);
  });

  it('last write wins', () => {
    api.saveGlobalSettings(DEFAULT_READING_SETTINGS);
    api.saveGlobalSettings({ fontSize: 24, lineHeight: 2.2, width: 80, favoriteToolKeys: [] });
    expect(api.loadGlobalSettings()).toEqual({
      fontSize: 24,
      lineHeight: 2.0,
      width: 80,
      favoriteToolKeys: [],
    });
  });
});
