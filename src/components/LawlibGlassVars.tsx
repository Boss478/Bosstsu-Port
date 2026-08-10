'use client';

/**
 * T10b glass slider (ADR-019 D4/D8) — applies the device-wide reading
 * settings' `glassOpacity` as CSS custom properties on <html>:
 *   --lawlib-glass-bg-light / --lawlib-glass-bg-dark
 *                                 (dock + search chrome rgba fills)
 *   --lawlib-glass-content-bg-light / --lawlib-glass-content-bg-dark
 *                                 (content-surface rgba fills — T17)
 *   --lawlib-glass-blur           (search blur(Xpx) — T17 dynamic)
 *   --lawlib-glass-blur-xs        (dock blur(Xpx) — T17 dynamic)
 *   --lawlib-glass-blur-content   (content blur(Xpx) — T17 new)
 *
 * T17 (ADR-021): opacity AND blur are DYNAMIC per-surface (was: static
 * blur(12px)/blur(4px); the 100% → 'none' GPU-kill rule is REMOVED — blur
 * scales to its max at 100%: dock 12 (T38: piecewise 2–12, user-locked
 * 2026-08-10 — the T33 4–8px band was too subtle) · search 5 · content 8.
 * Dock/search alpha: T38 linear 28–48% (was T17's 8–95% capped at 0.95 —
 * near-solid alpha hid the blur entirely; user-locked 2026-08-10, max 0.48
 * keeps the glass visible). Content surfaces (tooltip + compact popover)
 * follow their own piecewise formula: 0 → 0.55 · 35 → 0.7 · 100 → 0.95
 * (never below 0.55 so body text stays readable).
 *
 * Consumed ONLY by chrome surfaces: `.lawlib-glass` (dock + reader search
 * drawer), `.lawlib-search-field` (list-page SearchInput — do-not-touch,
 * the fill rides the same vars), and `.lawlib-glass-content` (T17:
 * LawTooltip panel + compact ArticlePopover — their content keeps its own
 * solid surfaces for interactive contrast). 0% → the chrome keeps a
 * minimum fill (dock 0.28 / content 0.55), the border + focus ring carry
 * the boundary (D8).
 *
 * Mounted in the lawlib LAYOUT so both the list page and the reader pages
 * apply the vars; re-applies on the `lawlib:settings-changed` event
 * (dispatched by useReaderStorage.setSettings) so the slider takes effect
 * immediately everywhere. T12c (user 2026-08-06): the vars drive the chrome
 * in EVERY theme — the read/sepia paper overrides for dock/tooltip/search
 * were removed from globals.css (paper stays only on cards/TOC/panels).
 */
import { useEffect } from 'react';
import { loadGlobalSettings, SETTINGS_CHANGED_EVENT } from '@/hooks/useReaderStorage';

export const GLASS_OPACITY_DEFAULT = 35;

/** Clamp the slider input into [0, 100] FIRST, then apply the formula. */
function clampOpacity(v: number): number {
  return Math.min(100, Math.max(0, v));
}

/**
 * T17 (ADR-021): content-surface (tooltip + popover) fill alpha — piecewise,
 * anchored at the slider default 35: 0 → 0.55 · 35 → 0.7 · 100 → 0.95.
 * Monotonic; content surfaces never drop below 0.55 (readability) and never
 * go fully opaque (max 0.95 — stays glass). Round 3 decimals so float noise
 * (e.g. 0.7000000000000001) never leaks into the rgba strings.
 */
export function contentGlassAlpha(v: number): number {
  const c = clampOpacity(v);
  const a = c <= 35 ? 0.55 + (c / 35) * 0.15 : 0.7 + ((c - 35) / 65) * 0.25;
  return Number(a.toFixed(3));
}

/**
 * T38 (user-locked 2026-08-10): dock/search chrome alpha — linear 28–48%
 * over the slider range: 0 → 0.28 · 35 → 0.35 (default) · 100 → 0.48.
 * Was T17's `min(v/100, 0.95)` — the near-solid 0.95 cap (8–95% band) made
 * the panel opaque and hid the blur, so the band was narrowed and the cap
 * removed (0.48 max is unreachable by any old input path). Round 3 decimals
 * so float noise never leaks into the rgba strings.
 */
export function dockGlassAlpha(v: number): number {
  return Number((0.28 + 0.002 * clampOpacity(v)).toFixed(3));
}

/**
 * T38 (user-locked 2026-08-10): dock blur radii (px, 1 decimal) — piecewise,
 * anchored at the slider default 35 (GLASS_OPACITY_DEFAULT): 0 → 2 · 35 → 6
 * · 100 → 12, continuous at the seam (both branches → 6 at v=35).
 *   v ≤ 35: 2 + (4/35)·v · v > 35: 6 + (6/65)·(v−35)
 * (T33 was 4/6/8 — too subtle to see, and the near-solid alpha hid it; the
 * 2–12px band keeps the blur VISIBLE across the whole single-slider range.)
 */
export function dockBlur(v: number): number {
  const c = clampOpacity(v);
  const b = c <= 35 ? 2 + (4 / 35) * c : 6 + (6 / 65) * (c - 35);
  return Number(b.toFixed(1));
}
export function searchBlur(v: number): number {
  return Number((3 + 0.02 * clampOpacity(v)).toFixed(1));
}
export function contentBlur(v: number): number {
  return Number((6 + 0.02 * clampOpacity(v)).toFixed(1));
}

function applyGlassVars(): void {
  const settings = loadGlobalSettings();
  const opacity = clampOpacity(settings?.glassOpacity ?? GLASS_OPACITY_DEFAULT);
  const html = document.documentElement;
  html.style.setProperty(
    '--lawlib-glass-bg-light',
    `rgba(255, 255, 255, ${dockGlassAlpha(opacity)})`,
  );
  html.style.setProperty('--lawlib-glass-bg-dark', `rgba(30, 41, 59, ${dockGlassAlpha(opacity)})`);
  html.style.setProperty(
    '--lawlib-glass-content-bg-light',
    `rgba(255, 255, 255, ${contentGlassAlpha(opacity)})`,
  );
  html.style.setProperty(
    '--lawlib-glass-content-bg-dark',
    `rgba(30, 41, 59, ${contentGlassAlpha(opacity)})`,
  );
  html.style.setProperty('--lawlib-glass-blur', `blur(${searchBlur(opacity)}px)`);
  html.style.setProperty('--lawlib-glass-blur-xs', `blur(${dockBlur(opacity)}px)`);
  html.style.setProperty('--lawlib-glass-blur-content', `blur(${contentBlur(opacity)}px)`);
}

export function LawlibGlassVars() {
  useEffect(() => {
    applyGlassVars();
    window.addEventListener(SETTINGS_CHANGED_EVENT, applyGlassVars);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, applyGlassVars);
  }, []);
  return null;
}
