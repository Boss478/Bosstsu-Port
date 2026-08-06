'use client';

/**
 * LawLib — dock v2 pickers (T10a, ADR-019 D4): click-to-expand popovers for
 * ธีม / ตัวอักษร / บรรทัด / กว้าง. Each trigger button shows its CURRENT
 * value; the popover closes on Esc / outside click / re-click (aria-expanded
 * + focus moves into the popover on open — same portal + measure pattern as
 * LawTooltip/ArticlePopover).
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Theme } from '@/components/ThemeProvider';
import type {
  ParagraphSpacing,
  ReaderFontFamily,
  ReaderFontWeight,
  ReadingSettingsValue,
} from '@/app/(website)/lawlib/lib/reader-props';

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

// ---------------------------------------------------------------------------
// Settings panel (T10b — ⚙️ Level 2, ADR-019 D4/D7/D8): font family ×5,
// glass opacity (dock+search chrome only), toolbar size (touch floor 44),
// paragraph spacing, font weight, hide repealed + hide amendment notes,
// focus mode (with the will-hide disclosure), auto-scroll speed, reset.
// Stays inside the PickerPopover infra (role="group" — NO nested dialog).
// The paper slider lives ONLY in the theme picker (single source:
// lawlib:paperTone + ThemeProvider.setPaperTone — not duplicated here).
// ---------------------------------------------------------------------------

export const FONT_FAMILY_OPTIONS: ReadonlyArray<{ value: ReaderFontFamily; label: string }> = [
  { value: 'sarabun', label: 'Sarabun' },
  { value: 'noto-sans-thai', label: 'Noto Sans Thai' },
  { value: 'mali', label: 'Mali' },
  { value: 'bai-jamjuree', label: 'Bai Jamjuree' },
  { value: 'itim', label: 'Itim' },
];

export const GLASS_OPACITY_DEFAULT = 75;
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

/** h2 section heading — the a11y pattern from fix2 (settings sections). */
function SettingsSectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="border-t border-slate-100 pt-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 first:border-t-0 first:pt-0 dark:border-slate-800 dark:text-slate-400">
      {children}
    </h2>
  );
}

/** Switch row (role="switch" — native switch semantics). */
function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
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
  );
}

export function SettingsPanelContent({
  settings,
  onChange,
  coarsePointer,
  reducedMotion,
  onFocusModeChange,
  onReset,
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
}) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-3">
      {/* ─── Font family ───────────────────────────────────────────────── */}
      <SettingsSectionTitle>ฟอนต์ตัวบท</SettingsSectionTitle>
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

      {/* ─── Glass + toolbar size ──────────────────────────────────────── */}
      <SettingsSectionTitle>ความโปร่งใสของแถบเครื่องมือ</SettingsSectionTitle>
      <SliderRow
        id="lawlib-glass-opacity"
        label="ความทึบ (เฉพาะ dock + ค้นหา)"
        min={0}
        max={100}
        step={1}
        value={settings.glassOpacity}
        display={`${settings.glassOpacity}%`}
        onChange={(glassOpacity) => onChange((prev) => ({ ...prev, glassOpacity }))}
      />
      <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
        100% = ทึบและไม่เบลอ (ประหยัดพลังงาน) — กระดาษ/ซีเปียไม่กระทบ
      </p>

      <SettingsSectionTitle>ขนาดแถบเครื่องมือ</SettingsSectionTitle>
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

      {/* ─── Paragraph spacing + weight ────────────────────────────────── */}
      <SettingsSectionTitle>ย่อหน้าและตัวอักษร</SettingsSectionTitle>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          ระยะห่างย่อหน้า
        </span>
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
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
          ความหนาตัวอักษร
        </span>
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
      />
      <ToggleRow
        id="lawlib-hide-amendment-notes"
        label="ซ่อนโน้ตการแก้ไข"
        hint="ซ่อน 'แก้ไขโดยฉบับที่ N' ในป๊อปอัปมาตรา"
        checked={settings.hideAmendmentNotes}
        onChange={(hideAmendmentNotes) => onChange((prev) => ({ ...prev, hideAmendmentNotes }))}
      />

      {/* ─── Focus mode (disclosure BEFORE activating) ─────────────────── */}
      <SettingsSectionTitle>โหมดโฟกัส</SettingsSectionTitle>
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

      {/* ─── Auto-scroll ───────────────────────────────────────────────── */}
      <SettingsSectionTitle>เลื่อนอัตโนมัติ</SettingsSectionTitle>
      <SliderRow
        id="lawlib-auto-scroll"
        label="ความเร็ว"
        min={AUTO_SCROLL_MIN}
        max={AUTO_SCROLL_MAX}
        step={1}
        value={reducedMotion ? 0 : settings.autoScrollSpeed}
        display={
          settings.autoScrollSpeed === 0 || reducedMotion ? 'ปิด' : `${settings.autoScrollSpeed}`
        }
        onChange={(autoScrollSpeed) => onChange((prev) => ({ ...prev, autoScrollSpeed }))}
      />
      <p className="text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">
        หยุดเมื่อคุณเลื่อนหรือแตะหน้าจอ
        {reducedMotion && ' — ปิดชั่วคราวเพราะตั้งค่าลดการเคลื่อนไหวของระบบ'}
      </p>

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
