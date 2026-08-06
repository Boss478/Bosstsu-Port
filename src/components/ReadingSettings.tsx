'use client';

/**
 * LawLib — reading preferences (FR11): font size, line height, content width.
 *
 * Fully CONTROLLED (props in / onChange out) — no persistence here; the
 * storage layer (`hooks/useReaderStorage`) owns state, and the reader core
 * (B2) applies the values to the article rendering. `onChange` always
 * receives a complete settings object.
 *
 * T10a contract change (ADR-019 D4/D5): fontSize + width are NUMBERS
 * (sliders 8-32px / 40-80ch — legacy s/m/l/xl + narrow/normal/wide enums
 * migrated in validateReadingSettings); lineHeight slider 1.0-2.0.
 */
import type {
  ReadingSettingsProps,
  ReadingSettingsValue,
} from '@/app/(website)/lawlib/lib/reader-props';

const FONT_SIZE_MIN = 8;
const FONT_SIZE_MAX = 32;
const LINE_HEIGHT_MIN = 1.0;
const LINE_HEIGHT_MAX = 2.0;
const LINE_HEIGHT_STEP = 0.1;
const WIDTH_MIN = 40;
const WIDTH_MAX = 80;

export interface SegmentProps<T extends string> {
  label: string;
  options: ReadonlyArray<{ value: T; label: string; aria: string }>;
  value: T;
  onSelect: (value: T) => void;
}

export function Segment<T extends string>({ label, options, value, onSelect }: SegmentProps<T>) {
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

function RangeRow({
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
    <div className="flex items-center justify-between gap-4">
      <label htmlFor={id} className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={display}
          className="w-32 accent-blue-500"
        />
        <span className="w-12 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
          {display}
        </span>
      </div>
    </div>
  );
}

export function ReadingSettings({ settings, onChange }: ReadingSettingsProps) {
  return (
    <section className="lawlib-panel space-y-4" aria-label="ตั้งค่าการอ่าน">
      <RangeRow
        id="lawlib-font-size"
        label="ขนาดตัวอักษร"
        min={FONT_SIZE_MIN}
        max={FONT_SIZE_MAX}
        step={1}
        value={settings.fontSize}
        display={`${settings.fontSize}px`}
        onChange={(fontSize) => onChange({ ...settings, fontSize })}
      />

      <RangeRow
        id="lawlib-line-height"
        label="ความสูงบรรทัด"
        min={LINE_HEIGHT_MIN}
        max={LINE_HEIGHT_MAX}
        step={LINE_HEIGHT_STEP}
        value={settings.lineHeight}
        display={`${settings.lineHeight.toFixed(1)}`}
        onChange={(lineHeight) => onChange({ ...settings, lineHeight })}
      />

      <RangeRow
        id="lawlib-width"
        label="ความกว้างเนื้อหา"
        min={WIDTH_MIN}
        max={WIDTH_MAX}
        step={1}
        value={settings.width}
        display={`${settings.width}ch`}
        onChange={(width) => onChange({ ...settings, width })}
      />
    </section>
  );
}

export type { ReadingSettingsValue };
