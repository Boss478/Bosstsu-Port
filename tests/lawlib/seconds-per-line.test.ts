// @vitest-environment node
/**
 * T55 (ADR-027) — `secondsPerLine` (LawlibPickers): the auto-scroll speed
 * display turns the speed level into a FIXED seconds-per-line figure,
 * INDEPENDENT of typography — 1 = 1.0 s/l · 2 = 0.8 · 3 = 0.5 · 4 = 0.25 ·
 * 5 = 0.1. The engine inverts (px/s = fontSize × lineHeight ÷ s) so one
 * rendered line takes exactly the mapped seconds at ANY typography.
 * Speed 0 (or negative) → null ("ปิด").
 */
import { describe, it, expect } from 'vitest';
import { secondsPerLine } from '@/components/LawlibPickers';

describe('secondsPerLine (T55 — fixed seconds-per-line map, ADR-027)', () => {
  it('returns null when the speed is 0 (off) or negative', () => {
    expect(secondsPerLine(0)).toBeNull();
    expect(secondsPerLine(-1)).toBeNull();
    expect(secondsPerLine(-5)).toBeNull();
  });

  it('spec vectors: 1→1, 2→0.8, 3→0.5, 4→0.25, 5→0.1', () => {
    expect(secondsPerLine(1)).toBe(1);
    expect(secondsPerLine(2)).toBe(0.8);
    expect(secondsPerLine(3)).toBe(0.5);
    expect(secondsPerLine(4)).toBe(0.25);
    expect(secondsPerLine(5)).toBe(0.1);
  });

  it('is typography-independent — the signature takes only the speed', () => {
    // ADR-027: the map is fixed; the ENGINE inverts against the current
    // typography (fontSize × lineHeight ÷ s) instead of the display
    // deriving s/l from typography. Arity 1 pins the dropped args.
    expect(secondsPerLine.length).toBe(1);
  });

  it('String(v) formatting pins — the display renders the exact decimals', () => {
    // The template slot is `ระดับ {n} · {s} วิ/บรรทัด` with `{s}` = the raw
    // number stringified: '1' (integer), '0.8' (one decimal), '0.5',
    // '0.25' (two decimals), '0.1' — NO toFixed rounding.
    expect(String(secondsPerLine(1))).toBe('1');
    expect(String(secondsPerLine(2))).toBe('0.8');
    expect(String(secondsPerLine(3))).toBe('0.5');
    expect(String(secondsPerLine(4))).toBe('0.25');
    expect(String(secondsPerLine(5))).toBe('0.1');
  });
});
