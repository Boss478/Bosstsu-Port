'use client';

/**
 * LawLib — dock v2 pickers (T10a, ADR-019 D4): click-to-expand popovers for
 * ธีม / ตัวอักษร / บรรทัด / กว้าง. Each trigger button shows its CURRENT
 * value; the popover closes on Esc / outside click / re-click (aria-expanded
 * + focus moves into the popover on open — same portal + measure pattern as
 * LawTooltip/ArticlePopover).
 */
import { useEffect, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Theme } from '@/components/ThemeProvider';

// ---------------------------------------------------------------------------
// Shared picker popover infra
// ---------------------------------------------------------------------------

const POPOVER_GAP = 6;

export function PickerPopover({
  anchorEl,
  widthClass,
  label,
  onClose,
  registerPortalEl,
  children,
}: {
  anchorEl: HTMLElement | null;
  /** Tailwind width class (e.g. 'w-56') — static literal so JIT keeps it. */
  widthClass: string;
  /** a11y: the popover's aria-label. */
  label: string;
  onClose: () => void;
  /** Optional portal-root registration — lets the DOCK's pointerdown-outside
   *  handler treat the picker as part of its interaction surface. */
  registerPortalEl?: (el: HTMLDivElement | null) => void;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Position once, at open (captured anchor rect — transient popover, like
  // LawTooltip/ArticlePopover). Below the button, flipped above when the
  // viewport is too short; horizontal clamped to the viewport.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (el === null || anchorEl === null) return;
    const rect = el.getBoundingClientRect();
    const anchor = anchorEl.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const below = anchor.bottom + POPOVER_GAP;
    const top =
      below + rect.height <= vh - POPOVER_GAP
        ? below
        : Math.max(anchor.top - rect.height - POPOVER_GAP, POPOVER_GAP);
    const left = Math.min(
      Math.max(anchor.left, POPOVER_GAP),
      Math.max(vw - rect.width - POPOVER_GAP, POPOVER_GAP),
    );
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    el.style.visibility = 'visible';
  }, [anchorEl]);

  // Esc + outside-close (the anchor button is excluded — its click toggles).
  useEffect(() => {
    if (anchorEl === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (target === null) return;
      if (rootRef.current?.contains(target)) return;
      if (anchorEl.contains(target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [anchorEl, onClose]);

  // Focus the first control (option button / slider) on open.
  useEffect(() => {
    const el = rootRef.current;
    if (el === null) return;
    const first = el.querySelector<HTMLElement>('button, input[type="range"]');
    if (first !== null && !first.hasAttribute('disabled')) first.focus();
  }, []);

  if (typeof document === 'undefined' || anchorEl === null) return null;

  return createPortal(
    <div
      ref={(el) => {
        rootRef.current = el;
        registerPortalEl?.(el);
      }}
      // NOT role="dialog": the picker portals INSIDE the dock's dialog —
      // a nested dialog is an APG violation (a11y fix #8). A labelled group
      // keeps Esc/outside close + focus-first intact.
      role="group"
      aria-label={label}
      style={{ left: 0, top: 0, visibility: 'hidden' }}
      className={`lawlib-picker fixed z-[65] rounded-xl border border-slate-200 bg-white p-3 shadow-xl outline-none dark:border-slate-700 dark:bg-slate-900 ${widthClass}`}
    >
      {children}
    </div>,
    document.body,
  );
}

/** A single option button in a picker (aria-pressed toggle row). */
function OptionButton({
  pressed,
  onClick,
  label,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
        pressed
          ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/50 dark:text-blue-300'
          : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300'
      }`}
    >
      {children}
    </button>
  );
}

function SliderRow({
  id,
  label,
  min,
  max,
  step,
  value,
  display,
  onChange,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (next: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {label}
        </label>
        <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={display}
        // h-6: the native range input defaults to ~16px tall — a 24px
        // hit-target satisfies WCAG 2.5.8 (a11y fix #13).
        className="h-6 w-full accent-blue-500"
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Theme picker — สว่าง / มืด / กระดาษ / ซีเปีย + paper-yellow slider
// (night REMOVED 2026-08-06 — user decision; stored 'night' migrates to
// 'dark' in ThemeProvider.getInitialTheme + the layout pre-paint script)
// ---------------------------------------------------------------------------

export const THEME_CHOICES: ReadonlyArray<{ value: Theme; label: string; icon: string }> = [
  { value: 'light', label: 'สว่าง', icon: 'fi-sr-sun' },
  { value: 'dark', label: 'มืด', icon: 'fi-sr-moon' },
  { value: 'read', label: 'กระดาษ', icon: 'fi-sr-book' },
  { value: 'sepia', label: 'ซีเปีย', icon: 'fi-sr-palette' },
];

/** Show the paper slider when the current theme IS paper-based. */
export function themeUsesPaper(theme: Theme): boolean {
  return theme === 'read' || theme === 'sepia';
}

export function ThemePickerContent({
  theme,
  onSelectTheme,
  paperTone,
  onSetPaperTone,
}: {
  theme: Theme;
  onSelectTheme: (next: Theme) => void;
  paperTone: number;
  onSetPaperTone: (next: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1.5">
        {THEME_CHOICES.map((choice) => (
          <OptionButton
            key={choice.value}
            pressed={theme === choice.value}
            onClick={() => onSelectTheme(choice.value)}
            label={`ธีม${choice.label}`}
          >
            <i aria-hidden="true" className={`fi ${choice.icon} text-[10px]`} />
            {choice.label}
          </OptionButton>
        ))}
      </div>
      {themeUsesPaper(theme) && (
        <SliderRow
          id="lawlib-paper-tone"
          label="ความเหลืองของกระดาษ"
          min={0}
          max={100}
          step={1}
          value={paperTone}
          display={`${paperTone}`}
          onChange={onSetPaperTone}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Font size picker — numeric 8-32 (default 16), −/+ steppers + presets
// ---------------------------------------------------------------------------

export const FONT_SIZE_MIN = 8;
export const FONT_SIZE_MAX = 32;
/** Preset chips = the legacy s/m/l/xl sizes (migration continuity). */
export const FONT_SIZE_PRESETS: readonly number[] = [14, 16, 18, 24];

export function FontSizePickerContent({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  const step = (dir: -1 | 1) => {
    const next = value + dir;
    if (next < FONT_SIZE_MIN || next > FONT_SIZE_MAX) return;
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => step(-1)}
          disabled={value <= FONT_SIZE_MIN}
          aria-label="ตัวอักษรเล็กลง"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300"
        >
          <i aria-hidden="true" className="fi fi-sr-minus text-xs" />
        </button>
        <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-100">
          {value}
          <span className="ml-0.5 text-xs font-medium text-slate-500 dark:text-slate-400">px</span>
        </p>
        <button
          type="button"
          onClick={() => step(1)}
          disabled={value >= FONT_SIZE_MAX}
          aria-label="ตัวอักษรใหญ่ขึ้น"
          className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300 dark:hover:text-blue-300"
        >
          <i aria-hidden="true" className="fi fi-sr-plus text-xs" />
        </button>
      </div>
      <div className="flex items-center justify-between gap-1.5">
        {FONT_SIZE_PRESETS.map((preset) => (
          <OptionButton
            key={preset}
            pressed={value === preset}
            onClick={() => onChange(preset)}
            label={`ขนาดตัวอักษร ${preset}px`}
          >
            {preset}
          </OptionButton>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Line height + width sliders
// ---------------------------------------------------------------------------

export const LINE_HEIGHT_MIN = 1.0;
export const LINE_HEIGHT_MAX = 2.0;

export function LineHeightPickerContent({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <SliderRow
      id="lawlib-line-height-picker"
      label="ความสูงบรรทัด"
      min={LINE_HEIGHT_MIN}
      max={LINE_HEIGHT_MAX}
      step={0.1}
      value={value}
      display={value.toFixed(1)}
      onChange={onChange}
    />
  );
}

/** Width as a PERCENTAGE of the 80ch baseline (user decision 2026-08-06):
 *  80-120%, step 1, default 100% → max-width calc(80ch * pct/100). */
export const WIDTH_MIN = 80;
export const WIDTH_MAX = 120;

export function WidthPickerContent({
  value,
  onChange,
}: {
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <SliderRow
      id="lawlib-width-picker"
      label="ความกว้างเนื้อหา"
      min={WIDTH_MIN}
      max={WIDTH_MAX}
      step={1}
      value={value}
      display={`${value}%`}
      onChange={onChange}
    />
  );
}
