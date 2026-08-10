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
 * scales to its max at 100%: dock 8 · search 5 · content 8).
 * Dock/search alpha + dock blur: ADR-025 S1 FINAL lock 2026-08-10 (T48 —
 * 6th pass, user: "Dock Panel: default dot to 50% · opacity → 5–80% ·
 * blur 0.5–8px"): ONE slider, PURE LINEAR — alpha 0.05 + 0.0075·v
 * (5 → 42.5 → 80% at 0/50/100) · blur 0.5 + 0.075·v (0.5 → 4.25 → 8px).
 * Rejects the earlier piecewise passes (T38/T39). The 0.80 top still hides
 * the blur — user accepted. Content surfaces (tooltip + compact popover)
 * keep their own piecewise formula (T17): 0 → 0.55 · 35 → 0.7 · 100 → 0.95
 * (never below 0.55 so body text stays readable; at the new 50 default it
 * lands at 0.758 naturally — no code change).
 *
 * Consumed ONLY by chrome surfaces: `.lawlib-glass` (dock + reader search
 * drawer), `.lawlib-search-field` (list-page SearchInput — do-not-touch,
 * the fill rides the same vars), and `.lawlib-glass-content` (T17:
 * LawTooltip panel + compact ArticlePopover — their content keeps its own
 * solid surfaces for interactive contrast). 0% → the chrome keeps a
 * minimum fill (dock 0.05 — the T48 linear 5% floor · content 0.55), the
 * border + focus ring carry the boundary (D8).
 *
 * Mounted in the lawlib LAYOUT so both the list page and the reader pages
 * apply the vars; re-applies on the `lawlib:settings-changed` event
 * (dispatched by useReaderStorage.setSettings) so the slider takes effect
 * immediately everywhere. T12c (user 2026-08-06): the vars drive the chrome
 * in EVERY theme — the read/sepia paper overrides for dock/tooltip/search
 * were removed from globals.css (paper stays only on cards/TOC/panels).
 */
import { useEffect } from 'react';
import {
  effectiveMotionPreference,
  loadGlobalSettings,
  SETTINGS_CHANGED_EVENT,
} from '@/hooks/useReaderStorage';

export const GLASS_OPACITY_DEFAULT = 50;

/** Clamp the slider input into [0, 100] FIRST, then apply the formula. */
function clampOpacity(v: number): number {
  return Math.min(100, Math.max(0, v));
}

/**
 * T17 (ADR-021): content-surface (tooltip + popover) fill alpha — piecewise,
 * anchored at v = 35 (an old-default anchor kept verbatim — T48 moved the
 * slider default to 50, where this formula lands at 0.758 naturally;
 * user-locked UNCHANGED): 0 → 0.55 · 35 → 0.7 · 100 → 0.95.
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
 * ADR-025 S1 FINAL (T48 — 6th pass 2026-08-10, user: "Dock Panel: default
 * dot to 50% · opacity → 5–80%"): dock/search chrome alpha — PURE LINEAR
 * over the whole slider: 0.05 + 0.0075·v (0 → 0.05 · 50 → 0.425 · 100 →
 * 0.80 — the 50 default = 42.5% fill). Replaces the T39 piecewise pass
 * (was: 0 → 0.05 · 35 → 0.35 · 100 → 0.90, anchored at the old default
 * 35; before that T38's linear 28–48% — near-solid alpha hid the blur).
 * The 0.80 top still hides the blur — user accepted. Round 3 decimals so
 * float noise never leaks into the rgba strings.
 */
export function dockGlassAlpha(v: number): number {
  const c = clampOpacity(v);
  return Number((0.05 + 0.0075 * c).toFixed(3));
}

/**
 * ADR-025 S1 FINAL (T48 — 6th pass 2026-08-10, user: "blur 0.5–8px"):
 * dock blur radii (px) — PURE LINEAR over the whole slider:
 * 0.5 + 0.075·v (0 → 0.5 · 50 → 4.25 · 100 → 8). Round 2 decimals —
 * toFixed(2) preserves the user's exact 4.25px at the 50 default
 * (0.5 + 3.75). Replaces the T39 piecewise pass (0 → 1 · 35 → 6 · 100 →
 * 12; the 1–12px band was too subtle to see at the 5–80% alpha).
 */
export function dockBlur(v: number): number {
  const c = clampOpacity(v);
  return Number((0.5 + 0.075 * c).toFixed(2));
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

/**
 * T42 (ADR-025 D2) — 3-tier motion: re-set `data-motion` on <html> from the
 * stored preference + OS prefers-reduced-motion (quality downgrades to
 * 'fast' — user-locked D2c, same rule as the layout pre-paint script).
 * Runs on mount, on settings-changed, and on mid-session OS RM toggles —
 * the CSS tiers (--motion-factor 0.5 / the disable kill) react to the attr
 * with no JS re-read.
 */
function applyMotion(): void {
  const stored = loadGlobalSettings()?.motionPreference ?? 'quality';
  const effective = effectiveMotionPreference(
    stored,
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  document.documentElement.setAttribute('data-motion', effective);
}

export function LawlibGlassVars() {
  useEffect(() => {
    const applyAll = () => {
      applyGlassVars();
      applyMotion();
    };
    applyAll();
    window.addEventListener(SETTINGS_CHANGED_EVENT, applyAll);
    const rmQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    rmQuery.addEventListener('change', applyAll);
    return () => {
      window.removeEventListener(SETTINGS_CHANGED_EVENT, applyAll);
      rmQuery.removeEventListener('change', applyAll);
    };
  }, []);
  return null;
}
