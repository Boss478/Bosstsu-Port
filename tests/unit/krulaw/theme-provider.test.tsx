// @vitest-environment jsdom
/**
 * TDD-first (Wave 1, Lane A) — pins the PLANNED 3-mode theme API
 * (`.agents/plans/krulaw-reading-redesign.md` §4.1, P2) BEFORE implementation.
 *
 * RED NOW (expected): `getInitialTheme`, `setTheme`, `paperTone` and
 * `setPaperTone` do not exist in `src/components/ThemeProvider.tsx` today.
 * Lane A must implement them to turn these tests green:
 *
 *   export type Theme = 'light' | 'dark' | 'read'       (extended from binary)
 *   export type PaperTone = 'soft' | 'classic' | 'warm' (new)
 *   export function getInitialTheme(): Theme            (new module export)
 *   ThemeContextType += { setTheme, paperTone, setPaperTone }
 *   toggleTheme(): light↔dark only — NEVER steps into 'read'
 *   exactly ONE of .light/.dark/.read on <html> (all three toggled explicitly — FR-B)
 *   paperTone persisted at `krulaw:paperTone`, mirrored on <html data-paper-tone>
 *
 * jsdom has no matchMedia — stubbed per test via mockMatchMedia().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

type ThemeApi = typeof import('@/components/ThemeProvider');

let api: ThemeApi;

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
  api = await import('@/components/ThemeProvider');
  mockLocalStorage();
  document.documentElement.className = '';
  document.documentElement.removeAttribute('data-paper-tone');
  mockMatchMedia(false);
});

/** jsdom has no matchMedia — stub it; `matches` = OS dark-mode state. */
function mockMatchMedia(matches: boolean): MediaQueryList {
  const mql = {
    matches,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  } as unknown as MediaQueryList;
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return mql;
}

/** Exactly which of the three theme classes is on <html> right now. */
function themeClasses(): string[] {
  return ['light', 'dark', 'read'].filter((c) => document.documentElement.classList.contains(c));
}

function Probe() {
  const { theme, setTheme, toggleTheme, paperTone, setPaperTone } = api.useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <span data-testid="paper-tone">{paperTone}</span>
      <button onClick={() => setTheme('light')}>set-light</button>
      <button onClick={() => setTheme('dark')}>set-dark</button>
      <button onClick={() => setTheme('read')}>set-read</button>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setPaperTone('soft')}>set-tone-soft</button>
      <button onClick={() => setPaperTone('warm')}>set-tone-warm</button>
    </div>
  );
}

function ApiShapeProbe() {
  const { setTheme, toggleTheme, setPaperTone, mounted } = api.useTheme();
  return (
    <ul>
      <li data-testid="setTheme">{typeof setTheme}</li>
      <li data-testid="toggleTheme">{typeof toggleTheme}</li>
      <li data-testid="setPaperTone">{typeof setPaperTone}</li>
      <li data-testid="mounted">{String(mounted)}</li>
    </ul>
  );
}

function renderProvider(children: ReactNode = <Probe />) {
  const Provider = api.ThemeProvider;
  return render(<Provider>{children}</Provider>);
}

describe('getInitialTheme (P2 — new export)', () => {
  it('returns "read" when localStorage.theme is "read"', () => {
    localStorage.setItem('theme', 'read');
    expect(api.getInitialTheme()).toBe('read');
  });

  it('returns "dark" / "light" for stored "dark" / "light"', () => {
    localStorage.setItem('theme', 'dark');
    expect(api.getInitialTheme()).toBe('dark');
    localStorage.setItem('theme', 'light');
    expect(api.getInitialTheme()).toBe('light');
  });

  it('falls back to OS dark when the stored value is invalid ("blue")', () => {
    localStorage.setItem('theme', 'blue');
    mockMatchMedia(true);
    expect(api.getInitialTheme()).toBe('dark');
    mockMatchMedia(false);
    expect(api.getInitialTheme()).toBe('light');
  });

  it('falls back to OS dark for empty or case-mismatched stored values', () => {
    localStorage.setItem('theme', '');
    mockMatchMedia(true);
    expect(api.getInitialTheme()).toBe('dark');
    localStorage.setItem('theme', 'READ');
    expect(api.getInitialTheme()).toBe('dark');
  });

  it('uses the OS preference when nothing is stored', () => {
    mockMatchMedia(true);
    expect(api.getInitialTheme()).toBe('dark');
    mockMatchMedia(false);
    expect(api.getInitialTheme()).toBe('light');
  });
});

describe('ThemeProvider — 3-mode theme (P2)', () => {
  it('useTheme exposes setTheme / toggleTheme / setPaperTone and mounts', () => {
    renderProvider(<ApiShapeProbe />);
    expect(screen.getByTestId('setTheme').textContent).toBe('function');
    expect(screen.getByTestId('toggleTheme').textContent).toBe('function');
    expect(screen.getByTestId('setPaperTone').textContent).toBe('function');
    expect(screen.getByTestId('mounted').textContent).toBe('true');
  });

  it('boots into read mode from storage with exactly one theme class', () => {
    localStorage.setItem('theme', 'read');
    renderProvider();
    expect(screen.getByTestId('theme').textContent).toBe('read');
    expect(themeClasses()).toEqual(['read']);
  });

  it('FR-B: stored light wins over OS dark and leaves NO .dark class', () => {
    localStorage.setItem('theme', 'light');
    mockMatchMedia(true);
    renderProvider();
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(themeClasses()).toEqual(['light']);
  });

  it('setTheme persists and applies exactly one theme class on <html>', () => {
    renderProvider();
    fireEvent.click(screen.getByText('set-dark'));
    expect(localStorage.getItem('theme')).toBe('dark');
    expect(themeClasses()).toEqual(['dark']);
    expect(screen.getByTestId('theme').textContent).toBe('dark');

    fireEvent.click(screen.getByText('set-read'));
    expect(localStorage.getItem('theme')).toBe('read');
    expect(themeClasses()).toEqual(['read']);

    fireEvent.click(screen.getByText('set-light'));
    expect(localStorage.getItem('theme')).toBe('light');
    expect(themeClasses()).toEqual(['light']);
  });

  it('toggleTheme cycles light ↔ dark only', () => {
    renderProvider(); // OS light → initial light
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('toggleTheme never steps out of read mode', () => {
    localStorage.setItem('theme', 'read');
    renderProvider();
    fireEvent.click(screen.getByText('toggle'));
    expect(screen.getByTestId('theme').textContent).toBe('read');
    expect(localStorage.getItem('theme')).toBe('read');
    expect(themeClasses()).toEqual(['read']);
  });
});

describe('paperTone (P2 — new state)', () => {
  it('defaults to "classic" and sets data-paper-tone on <html>', () => {
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('classic');
    expect(document.documentElement.getAttribute('data-paper-tone')).toBe('classic');
  });

  it('setPaperTone persists to krulaw:paperTone and updates the attribute', () => {
    renderProvider();
    fireEvent.click(screen.getByText('set-tone-soft'));
    expect(screen.getByTestId('paper-tone').textContent).toBe('soft');
    expect(localStorage.getItem('krulaw:paperTone')).toBe('soft');
    expect(document.documentElement.getAttribute('data-paper-tone')).toBe('soft');

    fireEvent.click(screen.getByText('set-tone-warm'));
    expect(screen.getByTestId('paper-tone').textContent).toBe('warm');
    expect(localStorage.getItem('krulaw:paperTone')).toBe('warm');
    expect(document.documentElement.getAttribute('data-paper-tone')).toBe('warm');
  });

  it('boots from a stored tone ("warm")', () => {
    localStorage.setItem('krulaw:paperTone', 'warm');
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('warm');
    expect(document.documentElement.getAttribute('data-paper-tone')).toBe('warm');
  });

  it('falls back to "classic" on an invalid stored tone', () => {
    localStorage.setItem('krulaw:paperTone', 'blue');
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('classic');
    expect(document.documentElement.getAttribute('data-paper-tone')).toBe('classic');
  });
});
