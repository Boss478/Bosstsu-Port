'use client';

/**
 * Site settings menu (P4) — gear button + dropdown card.
 *
 * - Theme segmented (สว่าง/มืด/กระดาษ/ซีเปีย) via ThemeProvider.setTheme —
 *   the 4-way choice lives here + the reading dock (night REMOVED 2026-08-06,
 *   user decision).
 * - T10a dedupe (ADR-019 D8): paper-tone + ReadingSettings REMOVED from the
 *   header — reading settings moved into the dock v2 (theme picker with the
 *   paper-yellow slider + ตัวอักษร/บรรทัด/กว้าง pickers). Header keeps
 *   site-wide settings only.
 *
 * Dropdown behavior mirrors the Header desktop-nav pattern: click-outside
 * closes, Escape closes + returns focus to the gear, focus moves to the first
 * control on open. Rendered in Header twice (desktop icon row + mobile row).
 * localStorage is only touched in the open handler (never during render), so
 * this component is safe in the SSR'd header tree.
 */
import { useEffect, useRef, useState } from 'react';
import { useTheme, THEMES } from './ThemeProvider';
import type { Theme } from './ThemeProvider';

/** Segmented control — moved here from the deleted ReadingSettings.tsx
 *  (2026-08-06, senior review of 28d6bae): that component was dead code
 *  with a stale ch-scale width contract; only this theme picker used it. */
interface SegmentProps<T extends string> {
  label: string;
  options: ReadonlyArray<{ value: T; label: string; aria: string }>;
  value: T;
  onSelect: (value: T) => void;
}

function Segment<T extends string>({ label, options, value, onSelect }: SegmentProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      className="flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800/40"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          aria-pressed={value === opt.value}
          aria-label={opt.aria}
          title={opt.aria}
          onClick={() => onSelect(opt.value)}
          className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            value === opt.value
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-zinc-600 hover:bg-blue-100/60 dark:text-zinc-300 dark:hover:bg-slate-700/60'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const THEME_LABELS: Record<Theme, string> = {
  light: 'สว่าง',
  dark: 'มืด',
  read: 'กระดาษ',
  sepia: 'ซีเปีย',
};
const THEME_ARIAS: Record<Theme, string> = {
  light: 'ธีมสว่าง',
  dark: 'ธีมมืด',
  read: 'ธีมกระดาษ',
  sepia: 'ธีมซีเปีย',
};

// Options derived from the exported THEMES const (single source of truth —
// new modes automatically appear here).
const THEME_OPTIONS: ReadonlyArray<{ value: Theme; label: string; aria: string }> = THEMES.map(
  (value) => ({ value, label: THEME_LABELS[value], aria: THEME_ARIAS[value] }),
);

export default function SettingsMenu({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  const { theme, setTheme, mounted } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const open = () => {
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
            ? 'p-2 rounded-full bg-white/60 dark:bg-slate-900/60 border border-white/60 dark:border-slate-700/50 shadow-lg shadow-blue-100/40 dark:shadow-black/20 hover:bg-white/85 dark:hover:bg-slate-800/85 backdrop-blur-xs transition-transform duration-press active:scale-95'
            : 'px-3 py-2 rounded-full hover:bg-amber-100/50 dark:hover:bg-slate-700/50 transition-transform duration-press active:scale-95'
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
          </div>
        </div>
      )}
    </div>
  );
}
