'use client';

import { createContext, useContext, useEffect, useState } from 'react';
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
    setThemeState(next);
    localStorage.setItem('theme', next);
    applyThemeClass(next);
  };

  const toggleTheme = () => {
    // light↔dark only — never steps into/out of read/sepia from legacy
    // consumers (Header/AdminSidebar/phonics SettingsScreen); the 4-way
    // choice lives in SettingsMenu + the reading dock.
    if (theme === 'read' || theme === 'sepia') return;
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  const setPaperTone = (tone: PaperTone) => {
    const clamped = Math.min(100, Math.max(0, tone));
    setPaperToneState(clamped);
    localStorage.setItem('lawlib:paperTone', String(clamped));
    applyPaperToneVars(clamped);
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
