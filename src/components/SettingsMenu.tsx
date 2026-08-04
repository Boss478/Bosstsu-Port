'use client';

/**
 * Site settings menu (P4) — gear button + dropdown card.
 *
 * - Theme segmented (สว่าง/มืด/อ่าน) via ThemeProvider.setTheme — the 3-way
 *   choice lives here + the reading dock; Header's own toggle stays light↔dark.
 * - Paper-tone segmented (ครีม/คลาสสิก/เหลือง) via setPaperTone — read-mode
 *   preference; harmless to set in any theme (sticky per FR-A/D10).
 * - ReadingSettings (FR11) reused AS-IS (contract frozen in reader-props.ts) —
 *   reads/writes the device-wide `lawlib:settings` key via
 *   loadGlobalSettings/saveGlobalSettings; a null result (missing/unparseable)
 *   falls back to DEFAULT_READING_SETTINGS.
 *
 * Dropdown behavior mirrors the Header desktop-nav pattern: click-outside
 * closes, Escape closes + returns focus to the gear, focus moves to the first
 * control on open. Rendered in Header twice (desktop icon row + mobile row).
 * localStorage is only touched in the open handler (never during render), so
 * this component is safe in the SSR'd header tree.
 */
import { useEffect, useRef, useState } from 'react';
import { useTheme, THEMES, PAPER_TONES } from './ThemeProvider';
import type { Theme, PaperTone } from './ThemeProvider';
import { ReadingSettings, Segment } from './ReadingSettings';
import {
  DEFAULT_READING_SETTINGS,
  loadGlobalSettings,
  saveGlobalSettings,
} from '@/hooks/useReaderStorage';
import type { ReadingSettingsValue } from '@/app/(website)/lawlib/lib/reader-props';

const THEME_LABELS: Record<Theme, string> = { light: 'สว่าง', dark: 'มืด', read: 'อ่าน' };
const THEME_ARIAS: Record<Theme, string> = {
  light: 'ธีมสว่าง',
  dark: 'ธีมมืด',
  read: 'ธีมอ่าน',
};

const TONE_LABELS: Record<PaperTone, string> = {
  soft: 'ครีม',
  classic: 'คลาสสิก',
  warm: 'เหลือง',
};
const TONE_ARIAS: Record<PaperTone, string> = {
  soft: 'โทนกระดาษครีม',
  classic: 'โทนกระดาษคลาสสิก',
  warm: 'โทนกระดาษเหลือง',
};

// Options derived from the exported THEMES/PAPER_TONES consts (single source
// of truth — new modes automatically appear here).
const THEME_OPTIONS: ReadonlyArray<{ value: Theme; label: string; aria: string }> = THEMES.map(
  (value) => ({ value, label: THEME_LABELS[value], aria: THEME_ARIAS[value] }),
);
const TONE_OPTIONS: ReadonlyArray<{ value: PaperTone; label: string; aria: string }> =
  PAPER_TONES.map((value) => ({ value, label: TONE_LABELS[value], aria: TONE_ARIAS[value] }));

export default function SettingsMenu({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const { theme, setTheme, paperTone, setPaperTone, mounted } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ReadingSettingsValue>(DEFAULT_READING_SETTINGS);
  const rootRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const open = () => {
    // Refresh from storage each open — null (missing/unparseable) → defaults.
    setSettings(loadGlobalSettings() ?? DEFAULT_READING_SETTINGS);
    setIsOpen(true);
  };

  // Click-outside: close when the pointer lands outside the gear + card.
  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  // Escape: close + return focus to the gear button.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        setIsOpen(false);
        gearRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus the first control on open.
  useEffect(() => {
    if (!isOpen) return;
    const firstControl = dropdownRef.current?.querySelector<HTMLElement>('button, input');
    firstControl?.focus();
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={gearRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : open())}
        aria-label="ตั้งค่า"
        aria-haspopup="true"
        aria-expanded={isOpen}
        title="ตั้งค่า"
        className={`flex items-center justify-center ${
          variant === 'mobile'
            ? 'p-2 rounded-full bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 shadow-lg shadow-blue-100/40 dark:shadow-black/20 hover:bg-white/85 dark:hover:bg-slate-800/85 backdrop-blur-xs transition-transform duration-75 active:scale-95'
            : 'px-3 py-2 rounded-full hover:bg-amber-100/50 dark:hover:bg-slate-700/50 transition-transform duration-75 active:scale-95'
        }`}
      >
        <i
          aria-hidden="true"
          className="fi fi-sr-settings text-zinc-600 dark:text-zinc-300 text-md leading-none"
        />
      </button>

      {isOpen && mounted && (
        <div
          ref={dropdownRef}
          className="absolute top-full right-0 pt-2 z-50 w-80 max-w-[calc(100vw-2rem)]"
        >
          <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-xl shadow-blue-100/40 dark:shadow-black/20 flex flex-col gap-3 transition-colors duration-500">
            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">ธีม</p>
              <Segment label="ธีม" options={THEME_OPTIONS} value={theme} onSelect={setTheme} />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">โทนกระดาษ</p>
              <Segment
                label="โทนกระดาษ"
                options={TONE_OPTIONS}
                value={paperTone}
                onSelect={setPaperTone}
              />
            </div>

            <div className="border-t border-white/60 dark:border-slate-700/50 pt-3">
              <ReadingSettings
                settings={settings}
                onChange={(next) => {
                  setSettings(next);
                  saveGlobalSettings(next);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
