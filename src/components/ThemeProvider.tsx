'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'read';

type PaperTone = 'soft' | 'classic' | 'warm';

const THEMES: readonly Theme[] = ['light', 'dark', 'read'];
const PAPER_TONES: readonly PaperTone[] = ['soft', 'classic', 'warm'];

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
  paperTone: 'classic',
  setPaperTone: () => {},
  mounted: false,
});

/**
 * Initial theme: stored value ∈ {light,dark,read} wins; any invalid/empty
 * stored value falls back to the OS scheme (dark → dark, else light).
 */
function getInitialTheme(): Theme {
  if (typeof window !== 'undefined') {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'read') {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return 'light';
}

/**
 * Initial paper tone (read-mode preference): stored value ∈ {soft,classic,warm}
 * wins; anything else → 'classic'.
 */
function getInitialPaperTone(): PaperTone {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('lawlib:paperTone');
    if (saved === 'soft' || saved === 'classic' || saved === 'warm') {
      return saved;
    }
  }
  return 'classic';
}

/**
 * Apply EXACTLY ONE of .light/.dark/.read on <html> — all three toggled
 * explicitly so a stored site theme always beats the OS scheme (FR-B:
 * OS-dark + site-light must never render white text).
 */
function applyThemeClass(next: Theme): void {
  const html = document.documentElement;
  for (const t of THEMES) {
    html.classList.toggle(t, t === next);
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [paperTone, setPaperToneState] = useState<PaperTone>('classic');
  const [mounted, setMounted] = useState(false);

  // Initialize theme + paper tone on mount (mirrors the layout.tsx pre-paint
  // script; the class/attribute are also applied here so tests + edge paths
  // stay consistent).
  useEffect(() => {
    const initialTheme = getInitialTheme();
    const initialTone = getInitialPaperTone();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional theme init from localStorage
    setThemeState(initialTheme);
    setPaperToneState(initialTone);
    applyThemeClass(initialTheme);
    document.documentElement.setAttribute('data-paper-tone', initialTone);
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
    // light↔dark only — never steps into/out of read mode from legacy consumers
    // (Header/AdminSidebar/phonics SettingsScreen); the 3-way choice lives in
    // SettingsMenu + the reading dock.
    if (theme === 'read') return;
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
  };

  const setPaperTone = (tone: PaperTone) => {
    setPaperToneState(tone);
    localStorage.setItem('lawlib:paperTone', tone);
    document.documentElement.setAttribute('data-paper-tone', tone);
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

export type { Theme, PaperTone };
export { getInitialTheme, getInitialPaperTone, PAPER_TONES, THEMES };
