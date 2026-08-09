'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { flushSync } from 'react-dom';
import { paperToneVars, parsePaperTone } from '@/lib/lawlib/paper-tone';

/**
 * Site theme (T10a: 4 modes — สว่าง/มืด/กระดาษ/ซีเปีย; the 5th, night,
 * REMOVED 2026-08-06 — user decision; the dock v2 theme picker offers
 * สว่าง/มืด/กระดาษ/ซีเปีย).
 * Exactly ONE of .light/.dark/.read/.sepia sits on <html>; sepia reuses the
 * `.read` paper-surface chain via the `read` custom variant (globals.css).
 * Stored 'night' migrates to 'dark' on read (see getInitialTheme).
 */
export type Theme = 'light' | 'dark' | 'read' | 'sepia';

/** Read-mode paper tone 0-100 (yellow slider — ADR-019 D8). Legacy enum
 *  strings ('soft'/'classic'/'warm') migrate to 30/50/80 on read. */
export type PaperTone = number;

const THEMES: readonly Theme[] = ['light', 'dark', 'read', 'sepia'];

/** Default paper tone = legacy 'classic'. */
const DEFAULT_PAPER_TONE = 50;

interface ThemeContextType {
  theme: Theme;
  setTheme: (next: Theme) => void;
  toggleTheme: () => void;
  paperTone: PaperTone;
  setPaperTone: (tone: PaperTone) => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
  toggleTheme: () => {},
  paperTone: DEFAULT_PAPER_TONE,
  setPaperTone: () => {},
  mounted: false,
});

/**
 * Initial theme: stored value ∈ {light,dark,read,sepia} wins; the removed
 * 'night' value MIGRATES to 'dark' (user decision 2026-08-06 — stored night
 * users land on dark, never on an unknown theme); any invalid/empty stored
 * value falls back to the OS scheme (dark → dark, else light).
 */
function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'night') return 'dark';
    if (
      savedTheme === 'light' ||
      savedTheme === 'dark' ||
      savedTheme === 'read' ||
      savedTheme === 'sepia'
    ) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Initial paper tone (read-mode preference): stored number 0-100 wins; the
 * legacy enum strings ('soft'/'classic'/'warm') migrate to 30/50/80; anything
 * else → 50 ('classic').
 */
function getInitialPaperTone(): PaperTone {
  if (typeof window === 'undefined') return DEFAULT_PAPER_TONE;
  return parsePaperTone(localStorage.getItem('lawlib:paperTone'));
}

/**
 * Apply EXACTLY ONE of .light/.dark/.read/.sepia on <html> — all
 * toggled explicitly so a stored site theme always beats the OS scheme
 * (FR-B: OS-dark + site-light must never render white text).
 */
function applyThemeClass(next: Theme): void {
  const html = document.documentElement;
  for (const t of THEMES) {
    html.classList.toggle(t, t === next);
  }
}

/** Write --read-bg/--read-card inline vars from the numeric tone (ADR-019 D8 —
 *  replaces the old html.read[data-paper-tone=…] class selectors). */
function applyPaperToneVars(tone: PaperTone): void {
  const { bg, card } = paperToneVars(tone);
  const html = document.documentElement;
  html.style.setProperty('--read-bg', bg);
  html.style.setProperty('--read-card', card);
}

/** T27c (AC-3) — VT direction by TARGET theme: globals.css keys the
 *  directional root keyframes on `html[style*='--vt-dir: to-…']`, and CSSOM
 *  serializes the inline style with a space after the colon — so the dir
 *  MUST be set via style.setProperty (never setAttribute) on
 *  document.documentElement BEFORE startViewTransition. read/sepia share
 *  the warm to-paper direction; every Theme maps to one of the three known
 *  dirs, and any unknown dir would match NO selector → the T27b plain
 *  400ms crossfade covers it (guaranteed fallback). */
const VT_DIR_BY_THEME: Record<Theme, string> = {
  light: 'to-light',
  dark: 'to-dark',
  read: 'to-paper',
  sepia: 'to-paper',
};

/**
 * T27 gate (adr-023 D3) — startViewTransition ONLY for discrete theme
 * commits on lawlib routes: SSR-safe feature-detect, JS reduced-motion
 * check (the CSS kill does NOT cover ::view-transition-* pseudo-elements),
 * and the lawlib pathname gate (games/admin/elsewhere keep the instant
 * swap + body-fade fallback). The `next !== current` equality guard lives
 * at the call sites (part of the same gate, per AC-1).
 */
function canUseViewTransition(): boolean {
  if (typeof document === 'undefined') return false;
  if (typeof document.startViewTransition !== 'function') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  return window.location.pathname.startsWith('/lawlib');
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [paperTone, setPaperToneState] = useState<PaperTone>(DEFAULT_PAPER_TONE);
  const [mounted, setMounted] = useState(false);

  // Initialize theme + paper tone on mount (mirrors the layout.tsx pre-paint
  // script; the class/vars are also applied here so tests + edge paths stay
  // consistent).
  useEffect(() => {
    const initialTheme = getInitialTheme();
    const initialTone = getInitialPaperTone();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional theme init from localStorage
    setThemeState(initialTheme);
    setPaperToneState(initialTone);
    applyThemeClass(initialTheme);
    applyPaperToneVars(initialTone);
    setMounted(true);

    // Listen for system theme changes (only when no localStorage preference).
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        const newTheme: Theme = e.matches ? 'dark' : 'light';
        setThemeState(newTheme);
        applyThemeClass(newTheme);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const setTheme = (next: Theme) => {
    // T27 (adr-023 D3): discrete commits on lawlib routes get a 400ms View
    // Transition (flushSync so React paints inside the callback — the
    // documented pattern); every other path keeps the exact same synchronous
    // swap. Fire-and-forget (no await); try/catch → fallback synchronous swap
    // so a thrown startViewTransition never breaks the app.
    const commit = () => {
      setThemeState(next);
      localStorage.setItem('theme', next);
      applyThemeClass(next);
    };

    if (canUseViewTransition() && next !== theme) {
      try {
        // T27c (AC-3): the direction MUST land on <html> before the
        // transition starts — the keyframes are keyed on the serialized
        // inline style (setProperty, never setAttribute).
        document.documentElement.style.setProperty('--vt-dir', VT_DIR_BY_THEME[next]);
        document.startViewTransition(() => {
          flushSync(() => setThemeState(next));
          applyThemeClass(next);
          localStorage.setItem('theme', next);
        });
      } catch {
        commit();
      }
      return;
    }
    commit();
  };

  const toggleTheme = () => {
    // light↔dark only — never steps into/out of read/sepia from legacy
    // consumers (Header/AdminSidebar/phonics SettingsScreen); the 4-way
    // choice lives in SettingsMenu + the reading dock.
    if (theme === 'read' || theme === 'sepia') return;
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  /**
   * `opts.animated` (T27): discrete tone chips pass `{ animated: true }` to
   * get the 400ms warm View Transition; the slider stays VT-free (snapshot-
   * per-tick storm — never passes the flag), and the default keeps the
   * current instant var swap.
   */
  const setPaperTone = (tone: PaperTone, opts?: { animated?: boolean }) => {
    const clamped = Math.min(100, Math.max(0, tone));
    const commit = () => {
      setPaperToneState(clamped);
      localStorage.setItem('lawlib:paperTone', String(clamped));
      applyPaperToneVars(clamped);
    };

    if (opts?.animated && canUseViewTransition() && clamped !== paperTone) {
      try {
        // T27c (AC-5): tone commits always crossfade warm (to-paper) — set
        // BEFORE the transition starts (same CSSOM rule as setTheme).
        document.documentElement.style.setProperty('--vt-dir', 'to-paper');
        document.startViewTransition(() => {
          flushSync(() => setPaperToneState(clamped));
          applyPaperToneVars(clamped);
          localStorage.setItem('lawlib:paperTone', String(clamped));
        });
      } catch {
        commit();
      }
      return;
    }
    commit();
  };

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, toggleTheme, paperTone, setPaperTone, mounted }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export { getInitialTheme, getInitialPaperTone, THEMES, DEFAULT_PAPER_TONE };
