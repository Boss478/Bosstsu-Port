// @vitest-environment node
/**
 * T23 — `secondsPerLine` (LawlibPickers): the auto-scroll speed display
 * turns the speed level into a human "seconds per line" figure.
 *
 * Formula (ADR-019 D14): the scroll rate is 48 px/s per level
 * (= 0.8 px/frame × 60, dt-normalized 120Hz-safe), so one line of
 * `fontSize × lineHeight` px takes (fontSize × lineHeight) / (speed × 48)
 * seconds, rounded to 1 decimal. Speed 0 (or negative) → null ("ปิด").
 */
import { describe, it, expect } from 'vitest';
import { secondsPerLine } from '@/components/LawlibPickers';

describe('secondsPerLine (T23 — speed → seconds per line)', () => {
  it('returns null when the speed is 0 (off) or negative', () => {
    expect(secondsPerLine(0, 16, 1.8)).toBeNull();
    expect(secondsPerLine(-1, 16, 1.8)).toBeNull();
    expect(secondsPerLine(-5, 32, 2)).toBeNull();
  });

  it('spec vectors: 1@16×1.8→0.6, 3@16×1.8→0.2, 5@32×2→0.3', () => {
    expect(secondsPerLine(1, 16, 1.8)).toBe(0.6);
    expect(secondsPerLine(3, 16, 1.8)).toBe(0.2);
    expect(secondsPerLine(5, 32, 2)).toBe(0.3);
  });

  it('scales linearly with the level (same typography)', () => {
    // 28.8 px/line ÷ (1×48) = 0.6; ÷ (2×48) = 0.3; ÷ (4×48) = 0.15 → 0.1.
    expect(secondsPerLine(1, 16, 1.8)).toBe(0.6);
    expect(secondsPerLine(2, 16, 1.8)).toBe(0.3);
    expect(secondsPerLine(4, 16, 1.8)).toBe(0.1);
    expect(secondsPerLine(5, 16, 1.8)).toBe(0.1);
  });

  it('scales linearly with fontSize × lineHeight (same level)', () => {
    // Level 2: 28.8/96 = 0.3 · 64/96 = 0.7 (64×2 → 64px line) · 16×1.0 → 16px.
    expect(secondsPerLine(2, 16, 1.8)).toBe(0.3);
    expect(secondsPerLine(2, 32, 2)).toBe(0.7);
    expect(secondsPerLine(2, 16, 1.0)).toBe(0.2);
  });

  it('returns a NUMBER rounded to 1 decimal (never a raw float)', () => {
    const v = secondsPerLine(5, 32, 2);
    expect(v).toBe(0.3); // 0.2666… → 0.3
    expect(Number.isInteger(v)).toBe(false);
    // The template slot renders "0.3" — the display format is
    // `ระดับ {n} · {x.x} วิ/บรรทัด`.
    expect(`${v}`).toBe('0.3');
  });
});
