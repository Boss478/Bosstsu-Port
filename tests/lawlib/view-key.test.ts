// ===========================================================================
// @vitest-environment jsdom
// LawLib FULL/COMPACT merge — per-slug view key (T2).
//
// loadPerSlugView / savePerSlugView over `lawlib:<scope>:view`. Whitelist-only
// read (loop-3 #1): stored value returned ONLY when 'compact' | 'full';
// missing/corrupt/junk → null (caller applies the default). Per-slug scoping:
// law A's choice never affects law B. In-memory localStorage stub (repo
// pattern: tests/unit/lawlib/reading-dock.test.tsx).
// ===========================================================================

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPerSlugView, savePerSlugView } from '@/hooks/useReaderStorage';

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

beforeEach(() => {
  mockLocalStorage();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('loadPerSlugView / savePerSlugView — per-slug view key', () => {
  it('round-trips a saved mode under lawlib:<scope>:view', () => {
    savePerSlugView('national-education-act-2542', 'compact');
    expect(loadPerSlugView('national-education-act-2542')).toBe('compact');

    savePerSlugView('national-education-act-2542', 'full');
    expect(loadPerSlugView('national-education-act-2542')).toBe('full');
  });

  it('scopes per slug — law A does NOT affect law B', () => {
    savePerSlugView('law-a', 'compact');
    expect(loadPerSlugView('law-b')).toBeNull();
    expect(loadPerSlugView('law-a')).toBe('compact');

    savePerSlugView('law-b', 'full');
    expect(loadPerSlugView('law-a')).toBe('compact');
    expect(loadPerSlugView('law-b')).toBe('full');
  });

  it('returns null when the key is missing (caller applies the default)', () => {
    expect(loadPerSlugView('never-saved')).toBeNull();
  });

  it('rejects junk/corrupt/foreign stored values → null (whitelist-only read)', () => {
    // savePerSlugView does NOT whitelist writes (read-side defense only, per
    // loop-3 #1) — junk values written through the module's own path emulate a
    // corrupt store / foreign app exactly as the reader would see them.
    savePerSlugView('law-x', 'evil' as ReaderViewMode);
    expect(loadPerSlugView('law-x')).toBeNull();

    savePerSlugView('law-x', 'COMPACT' as ReaderViewMode); // wrong case
    expect(loadPerSlugView('law-x')).toBeNull();

    savePerSlugView('law-x', '42' as ReaderViewMode);
    expect(loadPerSlugView('law-x')).toBeNull();

    savePerSlugView('law-x', JSON.stringify({ view: 'compact' }) as ReaderViewMode);
    expect(loadPerSlugView('law-x')).toBeNull();

    // a legit value round-trips (same write path as the app)
    savePerSlugView('law-x', 'compact');
    expect(loadPerSlugView('law-x')).toBe('compact');
  });
});
