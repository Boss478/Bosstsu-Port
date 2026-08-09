// @vitest-environment jsdom
/**
 * ThemeProvider contract tests (T10a — ADR-019 D4/D8; night REMOVED
 * 2026-08-06 — user decision).
 *
 * Contract pinned here:
 * - THEMES = 4 modes: light/dark/read/sepia; getInitialTheme accepts the
 *   four, MIGRATES the removed 'night' → 'dark'; applyThemeClass keeps
 *   EXACTLY ONE class on <html>
 * - toggleTheme cycles light↔dark ONLY — never steps into read/sepia
 * - paperTone is a NUMBER 0-100 (yellow slider): default 50, persisted as a
 *   string at `lawlib:paperTone`; legacy enum strings migrate 'soft'→30 /
 *   'classic'→50 / 'warm'→80; the old `data-paper-tone` attribute is GONE —
 *   ThemeProvider writes --read-bg/--read-card INLINE CSS VARS instead
 * - paperToneVars passes through the legacy stop colors exactly (no visual
 *   change for existing users) and clamps out-of-range input
 *
 * jsdom has no matchMedia — stubbed per test via mockMatchMedia().
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { paperToneVars } from '@/lib/lawlib/paper-tone';

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
  document.documentElement.removeAttribute('style');
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

/** Exactly which of the four theme classes is on <html> right now. */
function themeClasses(): string[] {
  return ['light', 'dark', 'read', 'sepia'].filter((c) =>
    document.documentElement.classList.contains(c),
  );
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
      <button onClick={() => setTheme('sepia')}>set-sepia</button>
      <button onClick={toggleTheme}>toggle</button>
      <button onClick={() => setPaperTone(30)}>set-tone-30</button>
      <button onClick={() => setPaperTone(80)}>set-tone-80</button>
      <button onClick={() => setPaperTone(80, { animated: true })}>set-tone-80-anim</button>
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

describe('getInitialTheme (P2 — 4 modes, night removed)', () => {
  it('returns each of the four stored themes verbatim', () => {
    for (const stored of ['light', 'dark', 'read', 'sepia']) {
      localStorage.setItem('theme', stored);
      expect(api.getInitialTheme()).toBe(stored);
    }
  });

  it('MIGRATES the removed stored night → dark (user decision 2026-08-06)', () => {
    localStorage.setItem('theme', 'night');
    expect(api.getInitialTheme()).toBe('dark');
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
    localStorage.setItem('theme', 'SEPIA');
    expect(api.getInitialTheme()).toBe('dark');
  });

  it('uses the OS preference when nothing is stored', () => {
    mockMatchMedia(true);
    expect(api.getInitialTheme()).toBe('dark');
    mockMatchMedia(false);
    expect(api.getInitialTheme()).toBe('light');
  });
});

describe('ThemeProvider — 4-mode theme (night removed)', () => {
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

  it('boots into sepia from storage (paper theme) with exactly one theme class', () => {
    localStorage.setItem('theme', 'sepia');
    renderProvider();
    expect(screen.getByTestId('theme').textContent).toBe('sepia');
    expect(themeClasses()).toEqual(['sepia']);
  });

  it('boots a stored night into DARK (migration — no night class ever applies)', () => {
    localStorage.setItem('theme', 'night');
    renderProvider();
    expect(screen.getByTestId('theme').textContent).toBe('dark');
    expect(themeClasses()).toEqual(['dark']);
    expect(document.documentElement.classList.contains('night')).toBe(false);
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

    fireEvent.click(screen.getByText('set-sepia'));
    expect(localStorage.getItem('theme')).toBe('sepia');
    expect(themeClasses()).toEqual(['sepia']);

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

  it('toggleTheme never steps out of read/sepia', () => {
    for (const stored of ['read', 'sepia']) {
      localStorage.setItem('theme', stored);
      renderProvider();
      fireEvent.click(screen.getByText('toggle'));
      expect(screen.getByTestId('theme').textContent).toBe(stored);
      expect(localStorage.getItem('theme')).toBe(stored);
      expect(themeClasses()).toEqual([stored]);
      // unmount between iterations (renderProvider per loop round)
      document.body.innerHTML = '';
    }
  });
});

describe('paperTone (T10a — numeric 0-100 + inline CSS vars)', () => {
  it('defaults to 50 and writes --read-bg/--read-card vars on <html>', () => {
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('50');
    const style = document.documentElement.style;
    expect(style.getPropertyValue('--read-bg')).not.toBe('');
    expect(style.getPropertyValue('--read-card')).not.toBe('');
    // The old data-paper-tone attribute contract is GONE.
    expect(document.documentElement.hasAttribute('data-paper-tone')).toBe(false);
  });

  it('setPaperTone persists a number string and updates the vars', () => {
    renderProvider();
    fireEvent.click(screen.getByText('set-tone-30'));
    expect(screen.getByTestId('paper-tone').textContent).toBe('30');
    expect(localStorage.getItem('lawlib:paperTone')).toBe('30');
    expect(document.documentElement.style.getPropertyValue('--read-bg')).toBe('rgb(245, 236, 217)');

    fireEvent.click(screen.getByText('set-tone-80'));
    expect(screen.getByTestId('paper-tone').textContent).toBe('80');
    expect(localStorage.getItem('lawlib:paperTone')).toBe('80');
    expect(document.documentElement.style.getPropertyValue('--read-bg')).toBe('rgb(249, 236, 192)');
  });

  it('boots from a stored numeric tone ("70")', () => {
    localStorage.setItem('lawlib:paperTone', '70');
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('70');
  });

  it('MIGRATES legacy stored tones: soft→30, classic→50, warm→80', () => {
    localStorage.setItem('lawlib:paperTone', 'soft');
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('30');

    document.body.innerHTML = '';
    localStorage.setItem('lawlib:paperTone', 'classic');
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('50');

    document.body.innerHTML = '';
    localStorage.setItem('lawlib:paperTone', 'warm');
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('80');
  });

  it('falls back to 50 on an invalid stored tone; out-of-range numbers clamp', () => {
    localStorage.setItem('lawlib:paperTone', 'blue');
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('50');

    document.body.innerHTML = '';
    localStorage.setItem('lawlib:paperTone', '150');
    renderProvider();
    expect(screen.getByTestId('paper-tone').textContent).toBe('100');
  });

  it('setPaperTone persists and applies inline vars', () => {
    renderProvider();
    fireEvent.click(screen.getByText('set-tone-30'));
    expect(screen.getByTestId('paper-tone').textContent).toBe('30');
  });
});

describe('T27c — VT direction contract (AC-3/AC-5)', () => {
  /** jsdom has no startViewTransition — stub it with a spy that (a) records
   *  `--vt-dir` AT CALL TIME (proving the dir lands on <html> BEFORE the
   *  transition starts — AC-3 CSSOM ordering) and (b) runs the callback
   *  synchronously (the production path flushSyncs inside it). */
  function stubViewTransition(): {
    vt: ReturnType<typeof vi.fn>;
    dirAtCall: () => string;
  } {
    let dirAtCall = '';
    const vt = vi.fn((cb: () => void) => {
      dirAtCall = document.documentElement.style.getPropertyValue('--vt-dir');
      cb();
      return {
        finished: Promise.resolve(),
        ready: Promise.resolve(),
        updateCallbackDone: Promise.resolve(),
        skipTransition: () => {},
      };
    });
    document.startViewTransition = vt as unknown as typeof document.startViewTransition;
    return { vt, dirAtCall: () => dirAtCall };
  }

  function restoreViewTransitionStub(): void {
    document.startViewTransition = undefined as unknown as typeof document.startViewTransition;
    window.history.pushState({}, '', '/');
  }

  it('setTheme on a lawlib route sets --vt-dir BEFORE startViewTransition (AC-3)', () => {
    window.history.pushState({}, '', '/lawlib/test');
    const { vt, dirAtCall } = stubViewTransition();
    renderProvider();

    fireEvent.click(screen.getByText('set-dark'));
    expect(vt).toHaveBeenCalledTimes(1);
    expect(dirAtCall()).toBe('to-dark');
    expect(themeClasses()).toEqual(['dark']);

    fireEvent.click(screen.getByText('set-read'));
    expect(dirAtCall()).toBe('to-paper');
    expect(themeClasses()).toEqual(['read']);

    fireEvent.click(screen.getByText('set-sepia'));
    expect(dirAtCall()).toBe('to-paper');
    expect(themeClasses()).toEqual(['sepia']);

    fireEvent.click(screen.getByText('set-light'));
    expect(dirAtCall()).toBe('to-light');
    expect(themeClasses()).toEqual(['light']);

    restoreViewTransitionStub();
  });

  it('animated paper-tone commits VT with to-paper; plain calls stay instant (AC-5)', () => {
    window.history.pushState({}, '', '/lawlib/test');
    const { vt, dirAtCall } = stubViewTransition();
    renderProvider();

    // Slider path (no opts) — NEVER a View Transition (user decision).
    fireEvent.click(screen.getByText('set-tone-30'));
    expect(vt).not.toHaveBeenCalled();
    expect(screen.getByTestId('paper-tone').textContent).toBe('30');

    // Discrete commit (animated: true) — warm VT + dir before the call.
    fireEvent.click(screen.getByText('set-tone-80-anim'));
    expect(vt).toHaveBeenCalledTimes(1);
    expect(dirAtCall()).toBe('to-paper');
    expect(screen.getByTestId('paper-tone').textContent).toBe('80');

    restoreViewTransitionStub();
  });

  it('reduced-motion falls back to the instant swap — no VT, no dir change (AC-1)', () => {
    window.history.pushState({}, '', '/lawlib/test');
    mockMatchMedia(true); // OS dark + prefers-reduced-motion: reduce
    const { vt } = stubViewTransition();
    renderProvider();
    expect(screen.getByTestId('theme').textContent).toBe('dark');

    fireEvent.click(screen.getByText('set-light'));
    expect(vt).not.toHaveBeenCalled();
    expect(themeClasses()).toEqual(['light']);

    restoreViewTransitionStub();
  });

  it('non-lawlib routes fall back to the instant swap — no VT (route gate)', () => {
    window.history.pushState({}, '', '/games');
    const { vt } = stubViewTransition();
    renderProvider();

    fireEvent.click(screen.getByText('set-dark'));
    expect(vt).not.toHaveBeenCalled();
    expect(themeClasses()).toEqual(['dark']);

    restoreViewTransitionStub();
  });
});

describe('paperToneVars (ADR-019 D8 — inline var computation)', () => {
  it('passes through the legacy stop colors exactly', () => {
    expect(paperToneVars(30)).toEqual({ bg: 'rgb(245, 236, 217)', card: 'rgb(250, 243, 227)' });
    expect(paperToneVars(50)).toEqual({ bg: 'rgb(242, 232, 213)', card: 'rgb(247, 239, 220)' });
    expect(paperToneVars(80)).toEqual({ bg: 'rgb(249, 236, 192)', card: 'rgb(253, 245, 207)' });
  });

  it('clamps out-of-range input', () => {
    expect(paperToneVars(-5).bg).toBe(paperToneVars(0).bg);
    expect(paperToneVars(150).bg).toBe(paperToneVars(100).bg);
  });

  it('interpolates between stops', () => {
    // 40 is halfway between 30 (soft) and 50 (classic) — bg 245→242, g 236→232.
    expect(paperToneVars(40).bg).toBe('rgb(244, 234, 215)');
  });
});
