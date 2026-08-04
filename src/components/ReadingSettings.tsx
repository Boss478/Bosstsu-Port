'use client';

/**
 * LawLib — reading preferences (FR11): font size, line height, content width.
 *
 * Fully CONTROLLED (props in / onChange out) — no persistence here; the
 * storage layer (`hooks/useReaderStorage`) owns state, and the reader core
 * (B2) applies the values to the article rendering. `onChange` always
 * receives a complete settings object.
 */
import type {
  ReadingSettingsProps,
  ReadingSettingsValue,
} from '@/app/(website)/lawlib/lib/reader-props';

const FONT_SIZES: ReadonlyArray<{
  value: ReadingSettingsValue['fontSize'];
  label: string;
  aria: string;
}> = [
  { value: 's', label: 'S', aria: 'ตัวอักษรขนาดเล็ก' },
  { value: 'm', label: 'M', aria: 'ตัวอักษรขนาดกลาง' },
  { value: 'l', label: 'L', aria: 'ตัวอักษรขนาดใหญ่' },
  { value: 'xl', label: 'XL', aria: 'ตัวอักษรขนาดใหญ่พิเศษ' },
];

const WIDTHS: ReadonlyArray<{ value: ReadingSettingsValue['width']; label: string; aria: string }> =
  [
    { value: 'narrow', label: 'แคบ', aria: 'ความกว้างเนื้อหาแคบ' },
    { value: 'normal', label: 'ปกติ', aria: 'ความกว้างเนื้อหาปกติ' },
    { value: 'wide', label: 'กว้าง', aria: 'ความกว้างเนื้อหากว้าง' },
  ];

const LINE_HEIGHT_MIN = 1.5;
const LINE_HEIGHT_MAX = 2.2;
const LINE_HEIGHT_STEP = 0.1;

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

export function ReadingSettings({ settings, onChange }: ReadingSettingsProps) {
  return (
    <section className="lawlib-panel space-y-4" aria-label="ตั้งค่าการอ่าน">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">ขนาดตัวอักษร</p>
        <Segment
          label="ขนาดตัวอักษร"
          options={FONT_SIZES}
          value={settings.fontSize}
          onSelect={(fontSize) => onChange({ ...settings, fontSize })}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label
          htmlFor="lawlib-line-height"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-100"
        >
          ความสูงบรรทัด
        </label>
        <div className="flex items-center gap-2">
          <input
            id="lawlib-line-height"
            type="range"
            min={LINE_HEIGHT_MIN}
            max={LINE_HEIGHT_MAX}
            step={LINE_HEIGHT_STEP}
            value={settings.lineHeight}
            onChange={(e) => onChange({ ...settings, lineHeight: Number(e.target.value) })}
            aria-valuetext={`${settings.lineHeight.toFixed(1)} เท่า`}
            className="w-32 accent-blue-500"
          />
          <span className="w-10 text-right text-xs tabular-nums text-zinc-600 dark:text-zinc-300">
            {settings.lineHeight.toFixed(1)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">ความกว้างเนื้อหา</p>
        <Segment
          label="ความกว้างเนื้อหา"
          options={WIDTHS}
          value={settings.width}
          onSelect={(width) => onChange({ ...settings, width })}
        />
      </div>
    </section>
  );
}
