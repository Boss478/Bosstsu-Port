// @vitest-environment jsdom
/**
 * T17 (ADR-021) — glass-formula pure functions from LawlibGlassVars.
 *
 * Anchors (user-locked 2026-08-10 — T38: blur VISIBLE on the single slider):
 *  - contentGlassAlpha: 0 → 0.55 · 35 → 0.7 · 100 → 0.95 (piecewise,
 *    monotonic — content surfaces never below 0.55, never fully opaque)
 *  - dockGlassAlpha: linear 28–48% (0 → 0.28 · 35 → 0.35 · 100 → 0.48;
 *    was 8–95% capped at 0.95 — near-solid alpha hid the blur; cap removed)
 *  - dynamic blur, 1 decimal:
 *    dockBlur [2, 12] (T38 piecewise: 0 → 2 · 35 → 6 · 100 → 12; the T33
 *    4–8px band was too subtle) · searchBlur [3, 5] · contentBlur [6, 8]
 *    (the 100% → 'none' GPU-kill rule is REMOVED)
 *
 * Clamp input into [0, 100] FIRST, then round (3 decimals alpha,
 * 1 decimal blur) — float noise must never leak into rgba()/blur() strings.
 */
import { describe, expect, it } from 'vitest';
import {
  contentGlassAlpha,
  dockGlassAlpha,
  dockBlur,
  searchBlur,
  contentBlur,
} from '@/components/LawlibGlassVars';

describe('contentGlassAlpha (T17 content-surface fill)', () => {
  it('anchors: 0 → 0.55 · 35 → 0.7 · 100 → 0.95', () => {
    expect(contentGlassAlpha(0)).toBe(0.55);
    expect(contentGlassAlpha(35)).toBe(0.7);
    expect(contentGlassAlpha(100)).toBe(0.95);
  });

  it('is monotonic across the range (10 < 50 < 80)', () => {
    const a = contentGlassAlpha(10);
    const b = contentGlassAlpha(50);
    const c = contentGlassAlpha(80);
    expect(a).toBeLessThan(b);
    expect(b).toBeLessThan(c);
  });

  it('sample: 10 → 0.593 (0.55 + (10/35)*0.15, round 3)', () => {
    expect(contentGlassAlpha(10)).toBe(0.593);
  });

  it('clamps out-of-range input into [0, 100] first', () => {
    expect(contentGlassAlpha(-10)).toBe(0.55);
    expect(contentGlassAlpha(200)).toBe(0.95);
  });

  it('rounds to 3 decimals (no float noise in rgba strings)', () => {
    expect(contentGlassAlpha(35).toString()).toBe('0.7');
    expect(contentGlassAlpha(100).toString()).toBe('0.95');
  });
});

describe('dockGlassAlpha (T38 dock/search chrome fill)', () => {
  it('anchors: 0 → 0.28 · 35 → 0.35 · 100 → 0.48', () => {
    expect(dockGlassAlpha(0)).toBe(0.28);
    expect(dockGlassAlpha(35)).toBe(0.35);
    expect(dockGlassAlpha(100)).toBe(0.48);
  });

  it('linear band sample: 95 → 0.47 (0.28 + 0.002·95, round 3)', () => {
    expect(dockGlassAlpha(95)).toBe(0.47);
  });

  it('clamps out-of-range input into [0, 100] first (0.95 cap removed)', () => {
    expect(dockGlassAlpha(-10)).toBe(0.28);
    expect(dockGlassAlpha(150)).toBe(0.48);
    expect(dockGlassAlpha(200)).toBe(0.48);
  });
});

describe('dynamic blur radii (T17 — never none)', () => {
  it('dockBlur: 0 → 2 · 35 → 6.0 · 100 → 12 (T38 piecewise, default 35 → 6)', () => {
    expect(dockBlur(0)).toBe(2);
    expect(dockBlur(35)).toBe(6);
    expect(dockBlur(100)).toBe(12);
  });

  it('dockBlur sample: 10 → 3.1 (2 + (4/35)·10, round 1) · 50 → 7.4 (6 + (6/65)·15)', () => {
    expect(dockBlur(10)).toBe(3.1);
    expect(dockBlur(50)).toBe(7.4);
  });

  it('dockBlur is continuous at the seam: 34 → 5.9 · 35 → 6 · 36 → 6.1', () => {
    expect(dockBlur(34)).toBe(5.9);
    expect(dockBlur(35)).toBe(6);
    expect(dockBlur(36)).toBe(6.1);
  });

  it('searchBlur: 0 → 3 · 50 → 4 · 100 → 5', () => {
    expect(searchBlur(0)).toBe(3);
    expect(searchBlur(50)).toBe(4);
    expect(searchBlur(100)).toBe(5);
  });

  it('contentBlur: 0 → 6 · 50 → 7 · 100 → 8', () => {
    expect(contentBlur(0)).toBe(6);
    expect(contentBlur(50)).toBe(7);
    expect(contentBlur(100)).toBe(8);
  });

  it('clamps input (blur never exceeds its max)', () => {
    expect(dockBlur(150)).toBe(12);
    expect(searchBlur(-5)).toBe(3);
    expect(contentBlur(500)).toBe(8);
  });
});
