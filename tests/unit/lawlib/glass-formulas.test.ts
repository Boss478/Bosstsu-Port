// @vitest-environment jsdom
/**
 * T17 (ADR-021) — glass-formula pure functions from LawlibGlassVars.
 *
 * Anchors (user-locked 2026-08-10 — ADR-025 S1 FINAL, T48 6th pass):
 *  - contentGlassAlpha: 0 → 0.55 · 35 → 0.7 · 100 → 0.95 (piecewise,
 *    monotonic — content surfaces never below 0.55, never fully opaque;
 *    UNCHANGED by T48 — at the new 50 default it lands at 0.758 naturally)
 *  - dockGlassAlpha: PURE LINEAR 5–80% (0 → 0.05 · 50 → 0.425 · 100 →
 *    0.80, round 3; replaces the T39 piecewise 5–90% anchored at 35)
 *  - dynamic blur:
 *    dockBlur [0.5, 8] PURE LINEAR, round 2 (0 → 0.5 · 50 → 4.25 · 100 →
 *    8 — toFixed(2) keeps the user's exact 4.25 at the default) ·
 *    searchBlur [3, 5] · contentBlur [6, 8] (search/content UNCHANGED)
 *  - the 100% → 'none' GPU-kill rule is REMOVED
 *
 * Clamp input into [0, 100] FIRST, then round (alpha 3 decimals,
 * dock blur 2 decimals, search/content blur 1 decimal) — float noise
 * must never leak into rgba()/blur() strings.
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

describe('dockGlassAlpha (ADR-025 S1 — dock/search chrome fill, linear)', () => {
  it('anchors: 0 → 0.05 · 50 → 0.425 · 100 → 0.80 (linear 5–80%, default 50)', () => {
    expect(dockGlassAlpha(0)).toBe(0.05);
    expect(dockGlassAlpha(50)).toBe(0.425);
    expect(dockGlassAlpha(100)).toBe(0.8);
  });

  it('samples: 10 → 0.125 · 75 → 0.613 (0.05 + 0.0075·v, round 3)', () => {
    expect(dockGlassAlpha(10)).toBe(0.125);
    expect(dockGlassAlpha(75)).toBe(0.613);
  });

  it('clamps out-of-range input into [0, 100] first', () => {
    expect(dockGlassAlpha(-10)).toBe(0.05);
    expect(dockGlassAlpha(150)).toBe(0.8);
  });
});

describe('dynamic blur radii (T17 — never none)', () => {
  it('dockBlur: 0 → 0.5 · 50 → 4.25 · 100 → 8 (linear 0.5–8px, round 2)', () => {
    expect(dockBlur(0)).toBe(0.5);
    expect(dockBlur(50)).toBe(4.25);
    expect(dockBlur(100)).toBe(8);
  });

  it('dockBlur samples: 10 → 1.25 · 75 → 6.13 (0.5 + 0.075·v, round 2)', () => {
    expect(dockBlur(10)).toBe(1.25);
    expect(dockBlur(75)).toBe(6.13);
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
    expect(dockBlur(150)).toBe(8);
    expect(searchBlur(-5)).toBe(3);
    expect(contentBlur(500)).toBe(8);
  });
});
