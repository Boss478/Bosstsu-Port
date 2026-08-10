// @vitest-environment jsdom
/**
 * T42 — 3-tier motion preference (ADR-025 D2) contract tests.
 *
 * Pinned here:
 * - validator whitelist: 'quality'/'fast'/'disable' pass through; invalid /
 *   missing → 'quality' (the shared validator runs in the pre-paint script's
 *   storage read path, GlassVars, and the ThemeProvider VT gate)
 * - effectiveMotionPreference: OS prefers-reduced-motion downgrades quality
 *   → fast (user-locked D2c); fast/disable pass through untouched
 * - LawlibGlassVars applies data-motion on <html>: on mount, on the
 *   lawlib:settings-changed event, and on a mid-session OS
 *   prefers-reduced-motion change
 * - globals.css tier contract (fs pin — jsdom cannot compute calc(), so the
 *   CSS TEXT is the contract; computed values verified live on :3300):
 *   factor vars, the disable/RM kill blocks, the @theme duration overrides,
 *   and ZERO unwrapped animation/transition durations
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';
import { LawlibGlassVars } from '@/components/LawlibGlassVars';
import {
  DEFAULT_READING_SETTINGS,
  effectiveMotionPreference,
  loadGlobalSettings,
  SETTINGS_CHANGED_EVENT,
  validateReadingSettings,
} from '@/hooks/useReaderStorage';
import type { MotionPreference } from '@/app/(website)/lawlib/lib/reader-props';

const SETTINGS_KEY = 'lawlib:settings';

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

/** matchMedia stub that records the RM change listener so tests can fire a
 *  mid-session OS toggle. `fireChange` updates `matches` BEFORE invoking the
 *  listener — GlassVars re-queries matchMedia inside applyMotion. */
function mockMatchMediaRM(initial: boolean): {
  fireChange: (matches: boolean) => void;
} {
  let listener: ((e: MediaQueryListEvent) => void) | null = null;
  const mql = {
    matches: initial,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn((_type: string, cb: (e: MediaQueryListEvent) => void) => {
      listener = cb;
    }),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
  window.matchMedia = vi.fn(() => mql) as unknown as typeof window.matchMedia;
  return {
    fireChange: (matches: boolean) => {
      mql.matches = matches;
      listener?.({ matches } as MediaQueryListEvent);
    },
  };
}

function storeSettings(over: Record<string, unknown>): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(over));
}

const htmlMotion = () => document.documentElement.getAttribute('data-motion');

beforeEach(() => {
  mockLocalStorage();
  mockMatchMediaRM(false);
  document.documentElement.removeAttribute('data-motion');
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('validator whitelist (T42 — ADR-025 D2)', () => {
  it('passes every valid tier through unchanged (idempotent)', () => {
    for (const tier of ['quality', 'fast', 'disable'] as const) {
      const input = { motionPreference: tier };
      expect(validateReadingSettings(input).motionPreference).toBe(tier);
      // A second pass is byte-identical (the validator runs on every load).
      expect(validateReadingSettings(validateReadingSettings(input)).motionPreference).toBe(tier);
    }
  });

  it('falls back to quality for missing / invalid stored values', () => {
    expect(validateReadingSettings({}).motionPreference).toBe('quality');
    expect(validateReadingSettings({ motionPreference: 'ultra' }).motionPreference).toBe('quality');
    expect(validateReadingSettings({ motionPreference: '' }).motionPreference).toBe('quality');
    expect(validateReadingSettings({ motionPreference: 42 }).motionPreference).toBe('quality');
    expect(validateReadingSettings({ motionPreference: null }).motionPreference).toBe('quality');
    expect(DEFAULT_READING_SETTINGS.motionPreference).toBe('quality');
  });

  it('loadGlobalSettings sanitizes a stored invalid tier (shared path)', () => {
    storeSettings({ motionPreference: 'banana' });
    expect(loadGlobalSettings()?.motionPreference).toBe('quality');
    storeSettings({ motionPreference: 'fast' });
    expect(loadGlobalSettings()?.motionPreference).toBe('fast');
  });
});

describe('effectiveMotionPreference (D2c downgrade)', () => {
  it('OS reduced-motion downgrades ONLY quality → fast', () => {
    expect(effectiveMotionPreference('quality', true)).toBe('fast');
    expect(effectiveMotionPreference('quality', false)).toBe('quality');
    expect(effectiveMotionPreference('fast', true)).toBe('fast');
    expect(effectiveMotionPreference('fast', false)).toBe('fast');
    expect(effectiveMotionPreference('disable', true)).toBe('disable');
    expect(effectiveMotionPreference('disable', false)).toBe('disable');
  });
});

describe('LawlibGlassVars — data-motion on <html>', () => {
  it('default (no storage): quality attr on mount', async () => {
    render(<LawlibGlassVars />);
    await act(async () => {});
    expect(htmlMotion()).toBe('quality');
  });

  it('stored fast → attr fast; stored disable → attr disable', async () => {
    storeSettings({ motionPreference: 'fast' });
    render(<LawlibGlassVars />);
    await act(async () => {});
    expect(htmlMotion()).toBe('fast');

    storeSettings({ motionPreference: 'disable' });
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
    await act(async () => {});
    expect(htmlMotion()).toBe('disable');
  });

  it('stored quality + OS reduced-motion → attr fast (user-locked downgrade)', async () => {
    storeSettings({ motionPreference: 'quality' });
    mockMatchMediaRM(true);
    render(<LawlibGlassVars />);
    await act(async () => {});
    expect(htmlMotion()).toBe('fast');
  });

  it('re-applies on the settings-changed event (picker → attr)', async () => {
    render(<LawlibGlassVars />);
    await act(async () => {});
    expect(htmlMotion()).toBe('quality');

    storeSettings({ motionPreference: 'fast' });
    window.dispatchEvent(new Event(SETTINGS_CHANGED_EVENT));
    await act(async () => {});
    expect(htmlMotion()).toBe('fast');
  });

  it('re-applies on a mid-session OS reduced-motion change (quality → fast)', async () => {
    storeSettings({ motionPreference: 'quality' });
    const { fireChange } = mockMatchMediaRM(false);
    render(<LawlibGlassVars />);
    await act(async () => {});
    expect(htmlMotion()).toBe('quality');

    fireChange(true);
    await act(async () => {});
    expect(htmlMotion()).toBe('fast');

    fireChange(false);
    await act(async () => {});
    expect(htmlMotion()).toBe('quality');
  });
});

describe('globals.css tier contract (fs pin — jsdom cannot compute calc)', () => {
  const css = fs.readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf8');

  it('factor vars: :root 1 + [data-motion="fast"] 0.5', () => {
    expect(css).toContain('--motion-factor: 1;');
    expect(css).toMatch(/\[data-motion='fast'\]\s*\{[^}]*--motion-factor: 0\.5/s);
  });

  it('disable tier + pre-hydration RM kill blocks (root element included)', () => {
    expect(css).toMatch(/\[data-motion='disable'\]\s*,/);
    expect(css).toContain('animation-duration: 0.01ms !important;');
    expect(css).toContain('animation-delay: 0ms !important;');
    expect(css).toContain('transition-duration: 0.01ms !important;');
    expect(css).toContain('scroll-behavior: auto !important;');
    expect(css).toMatch(/html:not\(\[data-motion\]\)\s*,/);
  });

  it('@theme duration overrides ride --motion-factor (Tailwind 4.3.1 --transition-duration-* keys)', () => {
    expect(css).toContain('--transition-duration-150: calc(150ms * var(--motion-factor, 1));');
    expect(css).toContain('--transition-duration-500: calc(500ms * var(--motion-factor, 1));');
    expect(css).toContain('--transition-duration-press: calc(100ms * var(--motion-factor, 1));');
  });

  it('ZERO unwrapped durations remain (every animation/transition duration is calc-wrapped)', () => {
    const bare = css
      .split('\n')
      .filter((line) =>
        /(animation|transition)(-duration|:|-delay):[^;]*\d+(\.\d+)?(ms|s)/.test(line),
      )
      .filter((line) => !line.includes('var(--motion-factor') && !line.includes('!important'));
    expect(bare).toEqual([]);
  });
});
