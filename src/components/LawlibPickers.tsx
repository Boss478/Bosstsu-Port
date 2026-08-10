'use client';

/**
 * LawLib — dock v2 pickers (T10a, ADR-019 D4): click-to-expand popovers for
 * ธีม / ตัวอักษร / บรรทัด / กว้าง. Each trigger button shows its CURRENT
 * value; the popover closes on Esc / outside click / re-click (aria-expanded
 * + focus moves into the popover on open — same portal + measure pattern as
 * LawTooltip/ArticlePopover).
 */
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { DEFAULT_READING_SETTINGS, DOCK_TOOL_KEYS } from '@/hooks/useReaderStorage';
import { DEFAULT_PAPER_TONE, type Theme } from '@/components/ThemeProvider';
import type {
  DockToolKey,
  MotionPreference,
  ParagraphSpacing,
  ReaderFontFamily,
  ReaderFontWeight,
  ReadingSettingsValue,
} from '@/app/(website)/lawlib/lib/reader-props';

// ---------------------------------------------------------------------------
// Tool registry — SINGLE source for every dock surface (Level 1 favorites,
// Level 2 grid, the ⚙️ "เครื่องมือแถวลัด" favorites editor — T14, ADR-019
// D10). `bookmarksAll` (opens the bookmarks PANEL) is a Level-2-ONLY tool:
// it is NOT part of the frozen DockToolKey contract and can never be pinned
// to Level 1 (the L1 bookmark TOGGLE already carries the count badge).
// ---------------------------------------------------------------------------

export type DockMoreToolKey = DockToolKey | 'bookmarksAll';

export const TOOL_LABELS: Record<DockMoreToolKey, string> = {
  theme: 'ธีม',
  fontSize: 'ตัวอักษร',
  lineHeight: 'บรรทัด',
  width: 'กว้าง',
  bookmark: 'ที่คั่นหน้า',
  search: 'ค้นหามาตรา',
  notes: 'บันทึกของฉัน',
  glossary: 'บทนิยาม',
  copy: 'คัดลอกมาตรานี้',
  copyLink: 'คัดลอกลิงก์มาตรานี้',
  settings: 'ตั้งค่า',
  bookmarksAll: 'ที่คั่นหน้าทั้งหมด',
  // T23 — focus mode + auto scroll as dock tools (L2 + pin-able L1).
  focusMode: 'โฟกัส',
  autoScroll: 'อ่านอัตโนมัติ',
};

export const TOOL_ICONS: Record<DockMoreToolKey, string> = {
  theme: 'fi-sr-sun',
  fontSize: 'fi-sr-italic',
  lineHeight: 'fi-sr-align-justify',
  width: 'fi-sr-expand',
  bookmark: 'fi-sr-bookmark',
  search: 'fi-sr-search',
  notes: 'fi-sr-note-sticky',
  glossary: 'fi-sr-book-bookmark',
  copy: 'fi-sr-copy',
  copyLink: 'fi-sr-link',
  settings: 'fi-sr-settings',
  bookmarksAll: 'fi-sr-books',
  // T23 — glyphs already in the flaticon subset (no font regeneration).
  // autoScroll swaps to fi-sr-pause while active (bookmark pattern).
  focusMode: 'fi-sr-eye',
  autoScroll: 'fi-sr-play',
};

/**
 * T23 — seconds per line for the auto-scroll speed display (⚙️ slider):
 * the scroll rate is 48 px/s per level (= 0.8 px/frame × 60 — dt-normalized,
 * 120Hz-safe), so one line of `fontSize × lineHeight` px takes
 * (fontSize × lineHeight) / (speed × 48) seconds. `null` when OFF.
 */
export function secondsPerLine(speed: number, fontSize: number, lineHeight: number): number | null {
  if (speed <= 0) return null;
  return Number(((fontSize * lineHeight) / (speed * 48)).toFixed(1));
}

// ---------------------------------------------------------------------------
// Shared picker popover infra
// ---------------------------------------------------------------------------

const POPOVER_GAP = 6;

/** T29 — picker popover exit hold (ADR-023 D9: pop-out 200ms in-curve —
 *  the 60–75% rule mirror of the 300ms entry). The delay-unmount keeps the
 *  popover mounted exactly this long while lawlib-pop-out plays. */
const PICKER_EXIT_MS = 200;

export function PickerPopover({
  anchorEl,
  widthClass,
  label,
  onClose,
  children,
}: {
  anchorEl: HTMLElement | null;
  /** Tailwind width class (e.g. 'w-56') — static literal so JIT keeps it. */
  widthClass: string;
  /** a11y: the popover's aria-label. */
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  /** T29 — exit-animation hold (ADR-023 D4, T25 moreClosing pattern): while
   *  true the popover stays mounted playing lawlib-pop-out (200ms) before
   *  onClose unmounts it. OUTSIDE-click closes only — Esc stays INSTANT
   *  (the dock's Esc handler unmounts before this listener runs; keyboard-
   *  instant is T28 parity) and the anchor toggle / programmatic closes
   *  unmount through the dock's own state. */
  const [closing, setClosing] = useState(false);
  /** T29 — the exit-hold timer. Tracked in a ref so a re-open (anchor
   *  change) can CANCEL a pending exit — a stale timer must never unmount
   *  a re-opened popover (ADR-023 D4). */
  const exitTimerRef = useRef<number | null>(null);
  /** T29 (ADR-023 D8): prefers-reduced-motion → close is INSTANT, no exit
   *  hold (the CSS kill already zeroes the entry/stagger animations). */
  const [reducedMotion] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  /** T29 — animated close (outside-click): pop-out 200ms + delay-unmount;
   *  reduced-motion → instant (AC-5). */
  const requestClose = useCallback(() => {
    if (closing) return;
    if (reducedMotion) {
      onClose();
      return;
    }
    setClosing(true);
    exitTimerRef.current = window.setTimeout(() => {
      exitTimerRef.current = null;
      onClose();
    }, PICKER_EXIT_MS);
  }, [closing, reducedMotion, onClose]);

  // Position once, at open (captured anchor rect — transient popover, like
  // LawTooltip/ArticlePopover). Below the button, flipped above when the
  // viewport is too short; horizontal clamped to the viewport. T29: also
  // sets the pop's transform-origin AT THE TRIGGER (ADR-023 D10 — origin
  // per placement): horizontal = the anchor's center clamped into the
  // popover; vertical = the edge the popover grew from (top when opening
  // below, bottom when flipped above).
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (el === null || anchorEl === null) return;
    // Re-open while closing (new anchor — the dock reuses this instance):
    // cancel the pending exit hold and reset closing BEFORE paint so the
    // fresh popover pops IN instead of finishing the old exit.
    if (exitTimerRef.current !== null) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setClosing(false);
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
    const anchorCx = anchor.left + anchor.width / 2;
    const originX = Math.min(Math.max(anchorCx - left, 0), rect.width);
    const originY = top === below ? 0 : rect.height;
    el.style.transformOrigin = `${originX}px ${originY}px`;
    el.style.visibility = 'visible';
  }, [anchorEl]);

  // Esc + outside-close (the anchor button is excluded — its click toggles).
  // T29: outside → requestClose (animated, closing state); Esc stays
  // INSTANT onClose (keyboard skip — T28 parity; the dock's own Esc handler
  // unmounts first anyway, this is the fallback).
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
      requestClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [anchorEl, onClose, requestClose]);

  // Unmount — a pending exit timer must never outlive the popover (a stale
  // unmount would also kill a RE-opened picker that reused this instance).
  useEffect(() => {
    return () => {
      if (exitTimerRef.current !== null) {
        window.clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
    };
  }, []);

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
      }}
      // NOT role="dialog": the picker portals INSIDE the dock's dialog —
      // a nested dialog is an APG violation (a11y fix #8). A labelled group
      // keeps Esc/outside close + focus-first intact.
      role="group"
      aria-label={label}
      style={{
        left: 0,
        top: 0,
        visibility: 'hidden',
        // T29 (ADR-023 D9): pop-in 300ms spring / pop-out 200ms in-curve —
        // the class defaults are 200/140ms; the inline duration is the
        // locked override (D10 "animation-duration after the shorthand").
        // T42 (ADR-025 D2): both ride --motion-factor (fast = 150/100ms;
        // the disable/RM kill zeroes it → instant).
        animationDuration: closing
          ? 'calc(200ms * var(--motion-factor, 1))'
          : 'calc(300ms * var(--motion-factor, 1))',
      }}
      // T29 — AC-4: `vt-picker` = the UNIQUE view-transition-name for this
      // fixed surface (theme-change inventory, globals.css). The SURFACE
      // (rounded/border/shadow/width) moved to the inner wrapper — D10 (one
      // animation per element): the OUTER pops (scale + fade), the INNER
      // rises (lawlib-fade-rise, 8px) — the locked "pop + rise" pair.
      // Closing swaps the pop keyframes (class change restarts the
      // animation from the pop-out from-frame — no jump: both start at
      // opacity 1 / scale 1).
      className={`lawlib-picker vt-picker fixed z-[65] outline-none ${
        closing ? 'lawlib-pop-out' : 'lawlib-pop-in'
      }`}
    >
      <div
        className={`rounded-xl border border-slate-200 bg-white p-3 shadow-xl lawlib-fade-rise dark:border-slate-700 dark:bg-slate-900 ${widthClass}`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** A single option button in a picker (aria-pressed toggle row). T42:
 *  `disabled` greys the option (visible, not selectable — the motion
 *  picker's quality tier under OS reduced-motion). */
function OptionButton({
  pressed,
  onClick,
  label,
  disabled,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border px-2 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 ${
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
  onReset,
  resetLabel,
  resetDisabled,
}: {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  display: string;
  onChange: (next: number) => void;
  /** T12 (ADR-019 D9): per-setting คืนค่า — resets ONLY this slider. */
  onReset?: () => void;
  /** Accessible name for the reset button (defaults to the slider label). */
  resetLabel?: string;
  /** Disable the reset when the value is already the default. */
  resetDisabled?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-1">
        <label htmlFor={id} className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          {label}
        </label>
        <span className="flex items-center gap-1.5">
          <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
            {display}
          </span>
          {onReset !== undefined && (
            <ResetButton
              label={resetLabel ?? label}
              disabled={resetDisabled ?? false}
              onClick={onReset}
            />
          )}
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
/** Preset chips (T40 S2 — ADR-025): quick sizes 8/12/16/24/32. */
export const FONT_SIZE_PRESETS: readonly number[] = [8, 12, 16, 24, 32];

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

// T39 flag (ADR-025 S3): 1.2–2.4 — MUST match useReaderStorage's clamps
// (the UI must not offer values the storage validator rejects).
export const LINE_HEIGHT_MIN = 1.2;
export const LINE_HEIGHT_MAX = 2.4;

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
 *  80-160%, step 1, default 120% → max-width calc(80ch * pct/100).
 *  T39 flag (ADR-025 S4): 160 — MUST match useReaderStorage's clamp. */
export const WIDTH_MIN = 80;
export const WIDTH_MAX = 160;

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

// ---------------------------------------------------------------------------
// Dock position (T12c — MOVED here from the dock's Level 2, ADR-019 D9:
// "ตั้งค่าทั้งหมดอยู่ที่เดียว"): the 8-spot grid (3×3 minus center) now lives
// in the ⚙️ settings panel; the dock imports the type + constants from here
// (one-way dependency — LawlibPickers never imports LawlibDock).
// ---------------------------------------------------------------------------

export type DockPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'mid-left'
  | 'mid-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

export const DOCK_POSITIONS: readonly DockPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'mid-left',
  'mid-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

/** 3×3 grid layout with the center slot spaced/empty for spatial parity with screen edges. */
export const POSITION_GRID_SLOTS: readonly (DockPosition | null)[] = [
  'top-left',
  'top-center',
  'top-right',
  'mid-left',
  null,
  'mid-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

export const DEFAULT_DOCK_POSITION: DockPosition = 'bottom-right';

const POSITION_LABELS: Record<DockPosition, string> = {
  'top-left': 'บนซ้าย',
  'top-center': 'บนกลาง',
  'top-right': 'บนขวา',
  'mid-left': 'กลางซ้าย',
  'mid-right': 'กลางขวา',
  'bottom-left': 'ล่างซ้าย',
  'bottom-center': 'ล่างกลาง',
  'bottom-right': 'ล่างขวา',
};

// ---------------------------------------------------------------------------
// Settings panel (T10b — ⚙️ Level 2, ADR-019 D4/D7/D8): font family ×5,
// glass opacity (chrome only: dock + search + tooltip), toolbar size (touch
// floor 44), dock POSITION (T12c), paragraph spacing, font weight, hide
// repealed + hide amendment notes, focus mode (with the will-hide
// disclosure), auto-scroll speed, reset. Stays inside the PickerPopover
// infra (role="group" — NO nested dialog).
// T23 (user decision 2026-08-09 — "both side settings"): the 5 reading
// surface controls ALSO live here (Theme / paper tone / text size / line
// spacing / width — the SAME L1 picker components, second mount point).
// The paper slider is therefore NOT single-source anymore: it lives in the
// L1 theme picker AND the ⚙️ Paper tone section — both mounts write the
// same `lawlib:paperTone` key through the same ThemeProvider.setPaperTone,
// so the state stays consistent (the old "lives ONLY in the theme picker"
// single-source comment is obsolete).
// ---------------------------------------------------------------------------

export const FONT_FAMILY_OPTIONS: ReadonlyArray<{ value: ReaderFontFamily; label: string }> = [
  { value: 'sarabun', label: 'Sarabun' },
  { value: 'noto-sans-thai', label: 'Noto Sans Thai' },
  { value: 'mali', label: 'Mali' },
  { value: 'bai-jamjuree', label: 'Bai Jamjuree' },
  { value: 'itim', label: 'Itim' },
];

export const GLASS_OPACITY_DEFAULT = 35;
export const TOOLBAR_SIZE_MIN = 24;
export const TOOLBAR_SIZE_MAX = 56;
/** Touch devices floor the toolbar at 44px (WCAG 2.5.8). */
export const TOOLBAR_SIZE_TOUCH_MIN = 44;
export const AUTO_SCROLL_MIN = 0;
export const AUTO_SCROLL_MAX = 5;
export const PARAGRAPH_SPACING_OPTIONS: readonly number[] = [0, 0.5, 1];
export const FONT_WEIGHT_OPTIONS: ReadonlyArray<{ value: ReaderFontWeight; label: string }> = [
  { value: 'normal', label: 'ปกติ' },
  { value: 'bold', label: 'หนา' },
];
/** T27c (AC-5) — paper-tone chip pop duration: must match the inline
 *  animationDuration override on the คืนค่า button (200ms spring). */
const TONE_CHIP_POP_MS = 200;

/** T12 (ADR-019 D9): per-setting "คืนค่า" — resets ONE setting only.
 *  Disabled at the default value (the button exists for every control; it is
 *  a no-op — and visibly so — when there is nothing to restore).
 *  T12c (a11y re-check): min-h-7 → min-h-11 — the 44px touch floor (WCAG
 *  2.5.8) applies to these reset buttons too.
 *  T27c (AC-5): `pop` adds the tone-chip spring pop (lawlib-chip-pop
 *  keyframe + 200ms duration override — the D10 duration-override pattern)
 *  to the paper-tone คืนค่า button on discrete commits. */
function ResetButton({
  label,
  disabled,
  onClick,
  pop,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  /** T27c — replay the 200ms spring pop on the next discrete commit. */
  pop?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`คืนค่า${label}`}
      title="คืนค่าเริ่มต้นของรายการนี้"
      className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-0.5 rounded-md px-1.5 text-[10px] font-semibold text-blue-600 transition-colors hover:bg-blue-50 hover:text-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent disabled:hover:text-slate-300 dark:text-blue-300 dark:hover:bg-blue-950/40 dark:hover:text-blue-200 dark:disabled:text-slate-600 ${
        pop ? 'lawlib-chip-pop' : ''
      }`}
      style={pop ? { animationDuration: 'calc(200ms * var(--motion-factor, 1))' } : undefined}
    >
      <i aria-hidden="true" className="fi fi-sr-rotate-left text-[8px]" />
      คืนค่า
    </button>
  );
}

/** h2 section heading — the a11y pattern from fix2 (settings sections).
 *  T12: single-setting sections may pass `action` (the per-setting reset) —
 *  rendered right-aligned in the heading row. */
function SettingsSectionTitle({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3 first:border-t-0 first:pt-0 dark:border-slate-800">
      <h2 className="text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {children}
      </h2>
      {action !== undefined && <div className="flex shrink-0 items-center">{action}</div>}
    </div>
  );
}

/** Switch row (role="switch" — native switch semantics). T12: optional
 *  per-setting reset button between the label and the switch. */
function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
  onReset,
  resetLabel,
  resetDisabled,
}: {
  id: string;
  label: React.ReactNode;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  onReset?: () => void;
  resetLabel?: string;
  /** Reset disabled when the value already IS the default (defaults to
   *  `!checked` — toggles are default-OFF). */
  resetDisabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          {label}
        </label>
        {hint !== undefined && (
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
            {hint}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {onReset !== undefined && (
          <ResetButton
            label={typeof label === 'string' ? (resetLabel ?? label) : (resetLabel ?? '')}
            disabled={resetDisabled ?? !checked}
            onClick={onReset}
          />
        )}
        <button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => onChange(!checked)}
          className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            checked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
          }`}
        >
          <span
            aria-hidden="true"
            className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-5' : ''
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export function SettingsPanelContent({
  settings,
  onChange,
  coarsePointer,
  reducedMotion,
  onFocusModeChange,
  onReset,
  dockPosition,
  onDockPositionChange,
  theme,
  setTheme,
  paperTone,
  setPaperTone,
}: {
  settings: ReadingSettingsValue;
  /** Full replacement or updater — the dock's setSettings supports both;
   *  functional updates keep rapid successive clicks from clobbering each
   *  other (stale-snapshot overwrite). */
  onChange: (
    next: ReadingSettingsValue | ((prev: ReadingSettingsValue) => ReadingSettingsValue),
  ) => void;
  /** Touch device → the toolbar slider floors at 44 (WCAG 2.5.8). */
  coarsePointer: boolean;
  /** prefers-reduced-motion → auto-scroll renders OFF (stored value kept —
   *  turning motion reduction off later restores the choice). */
  reducedMotion: boolean;
  /** Focus-mode toggle — the dock closes itself when focus activates. */
  onFocusModeChange: (next: boolean) => void;
  /** Reset EVERYTHING (settings + favorites + dock position + paper tone). */
  onReset: () => void;
  /** T12c — dock position (persisted `lawlib:dockPosition` by the dock). */
  dockPosition: DockPosition;
  onDockPositionChange: (next: DockPosition) => void;
  /** T23 — theme + paper tone (ThemeProvider state, owned by the dock —
   *  passed down so the 5 reading-surface sections share the L1 state).
   *  T27c: setPaperTone accepts the `animated` opt — discrete commits
   *  (the paper-tone คืนค่า button) pass `{ animated: true }` for the warm
   *  View Transition; the slider never does (AC-5 — user decision). */
  theme: Theme;
  setTheme: (next: Theme) => void;
  paperTone: number;
  setPaperTone: (next: number, opts?: { animated?: boolean }) => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);
  /** T27c (AC-5) — tone-chip pop re-trigger: the paper-tone คืนค่า button
   *  pops (200ms spring) on every discrete tone commit. Cleared by a TIMER
   *  (T30 chip pattern — onAnimationEnd is unreliable in throttled tabs)
   *  so the class leaves before the next re-add can replay it. */
  const [tonePop, setTonePop] = useState(false);
  const tonePopTimerRef = useRef<number | null>(null);

  // T27c — a pending tone-pop timer must never outlive the panel (T30
  // pattern: stale timers firing on an unmounted panel).
  useEffect(() => {
    return () => {
      if (tonePopTimerRef.current !== null) {
        window.clearTimeout(tonePopTimerRef.current);
        tonePopTimerRef.current = null;
      }
    };
  }, []);

  /** T27c (AC-5) — the paper-tone คืนค่า BUTTON is a discrete commit: warm
   *  VT (400ms, provider-side `animated` opt) + the button's spring pop.
   *  Reduced-motion → no pop (the provider also falls back to the instant
   *  swap via its own RM gate). */
  const handleToneReset = () => {
    setPaperTone(DEFAULT_PAPER_TONE, { animated: true });
    if (reducedMotion) return;
    if (tonePopTimerRef.current !== null) {
      window.clearTimeout(tonePopTimerRef.current);
      tonePopTimerRef.current = null;
    }
    setTonePop(true);
    tonePopTimerRef.current = window.setTimeout(() => {
      tonePopTimerRef.current = null;
      setTonePop(false);
    }, TONE_CHIP_POP_MS);
  };
  // T12 (ADR-019 D9): per-setting คืนค่า — resets ONLY that one setting.
  // The reset button renders for every control and disables at its default.
  const d = DEFAULT_READING_SETTINGS;
  /** T42 (ADR-025 D2) — the picker's SELECTED tier = the EFFECTIVE one:
   *  OS reduced-motion downgrades a stored 'quality' to 'fast' (D2c), so
   *  the ปกติ option shows unpressed and the ปกติ button is disabled. */
  const motionEffective: MotionPreference =
    reducedMotion && settings.motionPreference === 'quality' ? 'fast' : settings.motionPreference;
  /** T14 (ADR-019 D10): the เครื่องมือแถวลัด per-setting reset is disabled
   *  when the favorite keys equal the curated default (order matters). */
  const favoritesEqualDefault =
    settings.favoriteToolKeys.length === d.favoriteToolKeys.length &&
    settings.favoriteToolKeys.every((k, i) => k === d.favoriteToolKeys[i]);

  return (
    <div className="space-y-3">
      {/* ─── T47: QUICK section (user decision 2026-08-10 — quick path to
          the important settings = TOP of the ⚙️ panel, no new dock buttons,
          no long-press). The 3 most-used settings in one glance, in this
          order: กระจก (ทึบ/เบลอ) → การเคลื่อนไหว (ปิด/เร็ว/ปกติ) →
          เลื่อนอัตโนมัติ speed. Blocks moved here INTACT from their old
          spots (single source of truth — NO duplication); the T29 stagger
          below starts AFTER this group. ──────────────────────────────── */}
      <div className="space-y-3">
        <SettingsSectionTitle>สำคัญ</SettingsSectionTitle>

        {/* ─── Glass (T47 quick section) ────────────────────────────────── */}
        <SettingsSectionTitle
          action={
            <ResetButton
              label="ความทึบ"
              disabled={settings.glassOpacity === d.glassOpacity}
              onClick={() => onChange((prev) => ({ ...prev, glassOpacity: d.glassOpacity }))}
            />
          }
        >
          ความโปร่งใสของแถบเครื่องมือ
        </SettingsSectionTitle>
        <SliderRow
          id="lawlib-glass-opacity"
          label="กระจก (ความทึบ + ความเบลอ)"
          min={0}
          max={100}
          step={1}
          value={settings.glassOpacity}
          display={`${settings.glassOpacity}%`}
          onChange={(glassOpacity) => onChange((prev) => ({ ...prev, glassOpacity }))}
        />

        {/* ─── Motion preference (T42 — ADR-025 D2): ปิด / เร็ว / ปกติ.
            Selected = the EFFECTIVE tier: under OS reduced-motion a stored
            'quality' shows as เร็ว (the D2c user-locked downgrade) and the
            ปกติ option is DISABLED (visible + greyed — the user must pick
            เร็ว or ปิด; the hint explains why). The stored value stays
            'quality' until the user acts. */}
        <SettingsSectionTitle
          action={
            <ResetButton
              label="การเคลื่อนไหว"
              disabled={settings.motionPreference === d.motionPreference}
              onClick={() =>
                onChange((prev) => ({ ...prev, motionPreference: d.motionPreference }))
              }
            />
          }
        >
          การเคลื่อนไหว
        </SettingsSectionTitle>
        <div className="grid grid-cols-3 gap-1.5">
          <OptionButton
            pressed={motionEffective === 'disable'}
            onClick={() => onChange((prev) => ({ ...prev, motionPreference: 'disable' }))}
            label="การเคลื่อนไหวปิด"
          >
            ปิด
          </OptionButton>
          <OptionButton
            pressed={motionEffective === 'fast'}
            onClick={() => onChange((prev) => ({ ...prev, motionPreference: 'fast' }))}
            label="การเคลื่อนไหวเร็ว"
          >
            เร็ว
          </OptionButton>
          <OptionButton
            pressed={motionEffective === 'quality'}
            onClick={() => onChange((prev) => ({ ...prev, motionPreference: 'quality' }))}
            label="การเคลื่อนไหวปกติ"
            disabled={reducedMotion}
          >
            ปกติ
          </OptionButton>
        </div>
        {reducedMotion && (
          <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
            ระบบลดการเคลื่อนไหวเปิดอยู่ — เลือกได้ เร็ว หรือ ปิด
          </p>
        )}

        {/* ─── Auto-scroll (T47 quick section) ──────────────────────────── */}
        <SettingsSectionTitle
          action={
            <ResetButton
              label="ความเร็วเลื่อนอัตโนมัติ"
              disabled={settings.autoScrollSpeed === d.autoScrollSpeed}
              onClick={() => onChange((prev) => ({ ...prev, autoScrollSpeed: d.autoScrollSpeed }))}
            />
          }
        >
          เลื่อนอัตโนมัติ
        </SettingsSectionTitle>
        <SliderRow
          id="lawlib-auto-scroll"
          label="ความเร็ว"
          min={AUTO_SCROLL_MIN}
          max={AUTO_SCROLL_MAX}
          step={1}
          value={reducedMotion ? 0 : settings.autoScrollSpeed}
          // T23 — level + seconds per line (48 px/s per level; null when OFF).
          // 'ปิด' when speed 0 OR reduced-motion (matches the forced value).
          display={
            settings.autoScrollSpeed === 0 || reducedMotion
              ? 'ปิด'
              : `ระดับ ${settings.autoScrollSpeed} · ${secondsPerLine(
                  settings.autoScrollSpeed,
                  settings.fontSize,
                  settings.lineHeight,
                )} วิ/บรรทัด`
          }
          onChange={(autoScrollSpeed) => onChange((prev) => ({ ...prev, autoScrollSpeed }))}
        />
        <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
          หยุดเมื่อคุณเลื่อนหรือแตะหน้าจอ
          {reducedMotion && ' — ปิดชั่วคราวเพราะตั้งค่าลดการเคลื่อนไหวของระบบ'}
        </p>
      </div>

      {/* ─── T23: reading-surface controls (user decision 2026-08-09 — the
          L1 pickers' components, second mount point; L1 pickers stay).
          T29: the 5 sections stagger in 40ms steps on open (ADR-023 D9 —
          เนื้อหา stagger 40ms; T24 .lawlib-stagger is 60ms, its contract
          untouched). Each wrapper owns ONE animation (D10): lawlib-fade-rise
          with the locked step as inline animation-delay — mount-only, live
          re-renders don't re-stagger; the RM kill zeroes delay+duration. ── */}
      <div className="lawlib-fade-rise space-y-3" style={{ animationDelay: '0ms' }}>
        <SettingsSectionTitle>ธีม</SettingsSectionTitle>
        <div className="grid grid-cols-2 gap-1.5">
          {THEME_CHOICES.map((choice) => (
            <OptionButton
              key={choice.value}
              pressed={theme === choice.value}
              onClick={() => setTheme(choice.value)}
              label={`ธีม${choice.label}`}
            >
              <i aria-hidden="true" className={`fi ${choice.icon} text-[10px]`} />
              {choice.label}
            </OptionButton>
          ))}
        </div>
      </div>

      <div
        className="lawlib-fade-rise space-y-3"
        style={{ animationDelay: 'calc(40ms * var(--motion-factor, 1))' }}
      >
        <SettingsSectionTitle
          action={
            <ResetButton
              label="ความเหลืองของกระดาษ"
              disabled={paperTone === DEFAULT_PAPER_TONE}
              onClick={handleToneReset}
              pop={tonePop}
            />
          }
        >
          ความเหลืองของกระดาษ
        </SettingsSectionTitle>
        <SliderRow
          id="lawlib-paper-tone-settings"
          label="ความเหลืองของกระดาษ"
          min={0}
          max={100}
          step={1}
          value={paperTone}
          display={`${paperTone}`}
          onChange={setPaperTone}
        />
      </div>

      <div
        className="lawlib-fade-rise space-y-3"
        style={{ animationDelay: 'calc(80ms * var(--motion-factor, 1))' }}
      >
        <SettingsSectionTitle
          action={
            <ResetButton
              label="ขนาดตัวอักษร"
              disabled={settings.fontSize === d.fontSize}
              onClick={() => onChange((prev) => ({ ...prev, fontSize: d.fontSize }))}
            />
          }
        >
          ขนาดตัวอักษร
        </SettingsSectionTitle>
        <FontSizePickerContent
          value={settings.fontSize}
          onChange={(fontSize) => onChange((prev) => ({ ...prev, fontSize }))}
        />
      </div>

      <div
        className="lawlib-fade-rise space-y-3"
        style={{ animationDelay: 'calc(120ms * var(--motion-factor, 1))' }}
      >
        <SettingsSectionTitle
          action={
            <ResetButton
              label="ความสูงบรรทัด"
              disabled={settings.lineHeight === d.lineHeight}
              onClick={() => onChange((prev) => ({ ...prev, lineHeight: d.lineHeight }))}
            />
          }
        >
          ความสูงบรรทัด
        </SettingsSectionTitle>
        <LineHeightPickerContent
          value={settings.lineHeight}
          onChange={(lineHeight) => onChange((prev) => ({ ...prev, lineHeight }))}
        />
      </div>

      <div
        className="lawlib-fade-rise space-y-3"
        style={{ animationDelay: 'calc(160ms * var(--motion-factor, 1))' }}
      >
        <SettingsSectionTitle
          action={
            <ResetButton
              label="ความกว้างเนื้อหา"
              disabled={settings.width === d.width}
              onClick={() => onChange((prev) => ({ ...prev, width: d.width }))}
            />
          }
        >
          ความกว้างเนื้อหา
        </SettingsSectionTitle>
        <WidthPickerContent
          value={settings.width}
          onChange={(width) => onChange((prev) => ({ ...prev, width }))}
        />
      </div>

      {/* ─── Font family ───────────────────────────────────────────────── */}
      <SettingsSectionTitle
        action={
          <ResetButton
            label="ฟอนต์ตัวบท"
            disabled={settings.fontFamily === d.fontFamily}
            onClick={() => onChange((prev) => ({ ...prev, fontFamily: d.fontFamily }))}
          />
        }
      >
        ฟอนต์ตัวบท
      </SettingsSectionTitle>
      <div className="grid grid-cols-2 gap-1.5">
        {FONT_FAMILY_OPTIONS.map((family) => (
          <OptionButton
            key={family.value}
            pressed={settings.fontFamily === family.value}
            onClick={() => onChange((prev) => ({ ...prev, fontFamily: family.value }))}
            label={`ฟอนต์ ${family.label}`}
          >
            {/* Preview MUST NOT force-load the family — names render in the
                default font; the face applies only on selection (senior
                MAJOR #4). */}
            {family.label}
          </OptionButton>
        ))}
      </div>

      {/* ─── Toolbar size (T47: the glass slider moved up to the quick
          section at the top of the panel — single source of truth). ── */}
      <SettingsSectionTitle
        action={
          <ResetButton
            label="ขนาดปุ่ม"
            disabled={settings.toolbarSize === d.toolbarSize}
            onClick={() => onChange((prev) => ({ ...prev, toolbarSize: d.toolbarSize }))}
          />
        }
      >
        ขนาดแถบเครื่องมือ
      </SettingsSectionTitle>
      <SliderRow
        id="lawlib-toolbar-size"
        label="ขนาดปุ่มเครื่องมือ"
        min={coarsePointer ? TOOLBAR_SIZE_TOUCH_MIN : TOOLBAR_SIZE_MIN}
        max={TOOLBAR_SIZE_MAX}
        step={1}
        value={Math.max(
          settings.toolbarSize,
          coarsePointer ? TOOLBAR_SIZE_TOUCH_MIN : TOOLBAR_SIZE_MIN,
        )}
        display={`${Math.max(settings.toolbarSize, coarsePointer ? TOOLBAR_SIZE_TOUCH_MIN : 0)}px`}
        onChange={(toolbarSize) => onChange((prev) => ({ ...prev, toolbarSize }))}
      />

      {/* ─── เครื่องมือแถวลัด (T14 — ADR-019 D10: pin management MOVED here
          from Level 2; the L2 icons carry no pin toggles anymore). One
          switch per tool — checked = shown on Level 1, order = array order
          (unpin → re-pin appends at the end). */}
      <SettingsSectionTitle
        action={
          <ResetButton
            label="เครื่องมือแถวลัด"
            disabled={favoritesEqualDefault}
            onClick={() => onChange((prev) => ({ ...prev, favoriteToolKeys: d.favoriteToolKeys }))}
          />
        }
      >
        เครื่องมือแถวลัด
      </SettingsSectionTitle>
      <div className="space-y-1.5">
        {DOCK_TOOL_KEYS.map((key) => (
          <ToggleRow
            key={key}
            id={`lawlib-fav-${key}`}
            label={
              <span className="flex items-center gap-1.5">
                <i aria-hidden="true" className={`fi ${TOOL_ICONS[key]} text-[10px]`} />
                {TOOL_LABELS[key]}
              </span>
            }
            checked={settings.favoriteToolKeys.includes(key)}
            onChange={(on) =>
              onChange((prev) => ({
                ...prev,
                favoriteToolKeys: on
                  ? [...prev.favoriteToolKeys, key]
                  : prev.favoriteToolKeys.filter((k) => k !== key),
              }))
            }
          />
        ))}
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
        เลือกเครื่องมือที่แสดงในแถวหลักของแถบเครื่องมือ
      </p>

      {/* ─── Dock position (T12c — moved from Level 2, ADR-019 D9: all
          settings in one place). 8 spots in a 3×3 grid with the center spaced,
          per-setting คืนค่า like every other section. */}
      <SettingsSectionTitle
        action={
          <ResetButton
            label="ตำแหน่งปุ่มเครื่องมือ"
            disabled={dockPosition === DEFAULT_DOCK_POSITION}
            onClick={() => onDockPositionChange(DEFAULT_DOCK_POSITION)}
          />
        }
      >
        ตำแหน่งปุ่มเครื่องมือ
      </SettingsSectionTitle>
      <div role="group" aria-label="ตำแหน่งปุ่มเครื่องมือ" className="grid grid-cols-3 gap-1.5">
        {POSITION_GRID_SLOTS.map((pos) => {
          if (pos === null) {
            return (
              <div
                key="center-spacer"
                aria-hidden="true"
                className="flex h-11 items-center justify-center rounded-xl border border-dashed border-slate-200/80 bg-slate-50/40 dark:border-slate-700/60 dark:bg-slate-800/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
              </div>
            );
          }
          return (
            <button
              key={pos}
              type="button"
              aria-pressed={dockPosition === pos}
              aria-label={`ตำแหน่ง${POSITION_LABELS[pos]}`}
              title={POSITION_LABELS[pos]}
              onClick={() => onDockPositionChange(pos)}
              className={`flex h-11 cursor-pointer items-center justify-center rounded-xl border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 active:scale-95 ${
                dockPosition === pos
                  ? 'border-blue-500/80 bg-blue-50/90 text-blue-600 shadow-xs ring-2 ring-blue-500/20 dark:border-blue-400/80 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-400/20'
                  : 'border-slate-200/90 bg-white/90 text-slate-400 shadow-xs hover:scale-105 hover:border-blue-400/80 hover:bg-white hover:text-blue-600 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:border-blue-400/60 dark:hover:bg-slate-700 dark:hover:text-blue-300'
              }`}
            >
              <i
                aria-hidden="true"
                className={`fi fi-sr-circle-small ${
                  dockPosition === pos ? 'text-xs text-blue-600 dark:text-blue-300' : 'text-[10px]'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* ─── Paragraph spacing + weight ────────────────────────────────── */}
      <SettingsSectionTitle>ย่อหน้าและตัวอักษร</SettingsSectionTitle>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div className="flex min-w-0 items-center gap-1">
          <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300">
            ระยะห่างย่อหน้า
          </span>
          <ResetButton
            label="ระยะห่างย่อหน้า"
            disabled={settings.paragraphSpacing === d.paragraphSpacing}
            onClick={() => onChange((prev) => ({ ...prev, paragraphSpacing: d.paragraphSpacing }))}
          />
        </div>
        <div className="flex gap-1.5">
          {PARAGRAPH_SPACING_OPTIONS.map((v) => (
            <OptionButton
              key={v}
              pressed={settings.paragraphSpacing === v}
              onClick={() =>
                onChange((prev) => ({ ...prev, paragraphSpacing: v as ParagraphSpacing }))
              }
              label={`ระยะห่างย่อหน้า ${v}`}
            >
              {v === 0 ? 'ปกติ' : v === 0.5 ? 'ปานกลาง' : 'กว้าง'}
            </OptionButton>
          ))}
        </div>
      </div>
      <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
        เฉพาะเวอร์ชันย่อ
      </p>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5">
        <div className="flex min-w-0 items-center gap-1">
          <span className="shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300">
            ความหนาตัวอักษร
          </span>
          <ResetButton
            label="ความหนาตัวอักษร"
            disabled={settings.fontWeight === d.fontWeight}
            onClick={() => onChange((prev) => ({ ...prev, fontWeight: d.fontWeight }))}
          />
        </div>
        <div className="flex gap-1.5">
          {FONT_WEIGHT_OPTIONS.map((w) => (
            <OptionButton
              key={w.value}
              pressed={settings.fontWeight === w.value}
              onClick={() => onChange((prev) => ({ ...prev, fontWeight: w.value }))}
              label={`ความหนาตัวอักษร${w.label}`}
            >
              {w.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* ─── Content toggles ───────────────────────────────────────────── */}
      <SettingsSectionTitle>เนื้อหา</SettingsSectionTitle>
      <ToggleRow
        id="lawlib-hide-repealed"
        label="ซ่อนมาตรา/วรรคที่ถูกยกเลิก"
        hint="ใช้ได้ทั้งฉบับเต็มและเวอร์ชันย่อ"
        checked={settings.hideRepealed}
        onChange={(hideRepealed) => onChange((prev) => ({ ...prev, hideRepealed }))}
        onReset={() => onChange((prev) => ({ ...prev, hideRepealed: d.hideRepealed }))}
        resetLabel="ซ่อนมาตรา"
      />
      <ToggleRow
        id="lawlib-hide-amendment-notes"
        label="ซ่อนโน้ตการแก้ไข"
        hint="ซ่อน 'แก้ไขโดยฉบับที่ N' ในป๊อปอัปมาตรา"
        checked={settings.hideAmendmentNotes}
        onChange={(hideAmendmentNotes) => onChange((prev) => ({ ...prev, hideAmendmentNotes }))}
        onReset={() => onChange((prev) => ({ ...prev, hideAmendmentNotes: d.hideAmendmentNotes }))}
        resetLabel="ซ่อนโน้ต"
      />

      {/* ─── Focus mode (disclosure BEFORE activating) ─────────────────── */}
      <SettingsSectionTitle
        action={
          <ResetButton
            label="โหมดโฟกัส"
            disabled={settings.focusMode === d.focusMode}
            onClick={() => onChange((prev) => ({ ...prev, focusMode: d.focusMode }))}
          />
        }
      >
        โหมดโฟกัส
      </SettingsSectionTitle>
      <div className="rounded-lg border border-amber-300/70 bg-amber-50 px-3 py-2 text-[10px] leading-relaxed text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
        จะซ่อน: เมนูนำทาง, สารบัญ, แถบเครื่องมือ, footer — เหลือเฉพาะเนื้อหาและ ตัวบอกมาตรา (กด Esc
        เพื่อออก)
      </div>
      <ToggleRow
        id="lawlib-focus-mode"
        label="เปิดโหมดโฟกัส"
        checked={settings.focusMode}
        onChange={onFocusModeChange}
      />

      {/* ─── Dock animation (T12 — ADR-019 D9) ─────────────────────────── */}
      <SettingsSectionTitle
        action={
          <ResetButton
            label="แอนิเมชัน"
            disabled={settings.animateDock === d.animateDock}
            onClick={() => onChange((prev) => ({ ...prev, animateDock: d.animateDock }))}
          />
        }
      >
        แอนิเมชัน
      </SettingsSectionTitle>
      <ToggleRow
        id="lawlib-animate-dock"
        label="แอนิเมชันแถบเครื่องมือ"
        hint="ขยาย/ย่อแบบเลื่อน+จาง — ปิดอัตโนมัติเมื่อระบบตั้งค่าลดการเคลื่อนไหว"
        checked={settings.animateDock}
        onChange={(animateDock) => onChange((prev) => ({ ...prev, animateDock }))}
        resetLabel="แอนิเมชันแถบเครื่องมือ"
        resetDisabled={settings.animateDock}
      />

      {/* ─── Reset (inline confirm — no nested dialog in the popover) ──── */}
      <SettingsSectionTitle>รีเซ็ต</SettingsSectionTitle>
      {!confirmReset ? (
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 text-xs font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300"
        >
          <i aria-hidden="true" className="fi fi-sr-rotate-left text-[10px]" />
          คืนค่าเริ่มต้น
        </button>
      ) : (
        <div className="space-y-1.5 rounded-lg border border-red-200 bg-red-50 p-2 dark:border-red-500/40 dark:bg-red-950/40">
          <p role="status" className="text-[10px] leading-relaxed text-red-800 dark:text-red-200">
            คืนค่าทั้งหมด รวมถึงรายการปักหมุด ตำแหน่งปุ่ม และความเหลืองของกระดาษ?
          </p>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => {
                setConfirmReset(false);
                onReset();
              }}
              className="flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-lg bg-red-600 px-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              ยืนยัน
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="flex min-h-9 flex-1 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              ยกเลิก
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
