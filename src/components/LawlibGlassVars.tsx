'use client';

/**
 * T10b glass slider (ADR-019 D4/D8) — applies the device-wide reading
 * settings' `glassOpacity` as CSS custom properties on <html>:
 *   --lawlib-glass-bg-light / --lawlib-glass-bg-dark  (rgba fills)
 *   --lawlib-glass-blur                                (blur(12px) | none)
 *
 * Consumed ONLY by chrome surfaces: `.lawlib-glass` (dock + reader search
 * drawer) and `.lawlib-search-field` (list-page SearchInput — do-not-touch,
 * the fill rides the same vars). 100% → 'none' (solid + no backdrop-filter
 * = GPU saving); 0% → transparent, the border + focus ring carry the
 * boundary (D8).
 *
 * Mounted in the lawlib LAYOUT so both the list page and the reader pages
 * apply the vars; re-applies on the `lawlib:settings-changed` event
 * (dispatched by useReaderStorage.setSettings) so the slider takes effect
 * immediately everywhere. Read/sepia paper overrides live in globals.css
 * with higher specificity — they win over these vars on paper surfaces.
 */
import { useEffect } from 'react';
import { loadGlobalSettings, SETTINGS_CHANGED_EVENT } from '@/hooks/useReaderStorage';

export const GLASS_OPACITY_DEFAULT = 75;

function applyGlassVars(): void {
  const settings = loadGlobalSettings();
  const opacity = Math.min(100, Math.max(0, settings?.glassOpacity ?? GLASS_OPACITY_DEFAULT));
  const alpha = (opacity / 100).toFixed(3);
  const html = document.documentElement;
  html.style.setProperty('--lawlib-glass-bg-light', `rgba(255, 255, 255, ${alpha})`);
  html.style.setProperty('--lawlib-glass-bg-dark', `rgba(30, 41, 59, ${alpha})`);
  html.style.setProperty('--lawlib-glass-blur', opacity >= 100 ? 'none' : 'blur(12px)');
}

export function LawlibGlassVars() {
  useEffect(() => {
    applyGlassVars();
    window.addEventListener(SETTINGS_CHANGED_EVENT, applyGlassVars);
    return () => window.removeEventListener(SETTINGS_CHANGED_EVENT, applyGlassVars);
  }, []);
  return null;
}
