/**
 * LawLib — paper-tone color model (ADR-019 D8).
 *
 * paperTone is a NUMBER 0-100 (yellow slider: น้อย→มาก) persisted at
 * `lawlib:paperTone`. ThemeProvider computes the read-mode surfaces
 * (`--read-bg` / `--read-card`) as INLINE CSS VARS on <html> from this value,
 * replacing the old `html.read[data-paper-tone=…]` class selectors.
 *
 * Legacy enum values (v1.10.x storage) migrate: 'soft'→30, 'classic'→50,
 * 'warm'→80 — the stops below pass through those exact colors, so existing
 * users see no visual change.
 *
 * The layout.tsx pre-paint script embeds PAPER_TONE_STOPS (via JSON at build
 * time) + a compact lerp so read/sepia mode has correct paper before first
 * paint — keep this module's stops in sync with that script's embedded copy.
 */
export type PaperToneStop = readonly [
  tone: number,
  bgR: number,
  bgG: number,
  bgB: number,
  cardR: number,
  cardG: number,
  cardB: number,
];

/** Keyframes: [tone, bg rgb, card rgb]. 30/50/80 = legacy soft/classic/warm. */
export const PAPER_TONE_STOPS: ReadonlyArray<PaperToneStop> = [
  [0, 247, 243, 232, 251, 249, 240],
  [30, 245, 236, 217, 250, 243, 227],
  [50, 242, 232, 213, 247, 239, 220],
  [80, 249, 236, 192, 253, 245, 207],
  [100, 253, 234, 156, 253, 240, 184],
];

/** Legacy enum → numeric tone (migration). Unknown strings → null. */
export function legacyPaperToneToNumber(value: string): number | null {
  if (value === 'soft') return 30;
  if (value === 'classic') return 50;
  if (value === 'warm') return 80;
  return null;
}

/** Parse a stored `lawlib:paperTone` value (string) into a 0-100 tone. */
export function parsePaperTone(stored: string | null): number {
  if (stored === null) return 50;
  const legacy = legacyPaperToneToNumber(stored);
  if (legacy !== null) return legacy;
  const n = Number(stored);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 50;
}

/** Clamp a numeric tone into [0, 100]. */
export function clampPaperTone(tone: number): number {
  return Math.min(100, Math.max(0, tone));
}

function lerp(a: number, b: number, f: number): number {
  return Math.round(a + (b - a) * f);
}

/**
 * Piecewise-linear interpolation through PAPER_TONE_STOPS → the read-mode
 * surface colors. Out-of-range input is clamped (defensive — callers should
 * clamp first).
 */
export function paperToneVars(tone: number): { bg: string; card: string } {
  const x = clampPaperTone(tone);
  let i = 0;
  while (i < PAPER_TONE_STOPS.length - 2 && x > PAPER_TONE_STOPS[i + 1][0]) i++;
  const a = PAPER_TONE_STOPS[i];
  const b = PAPER_TONE_STOPS[i + 1];
  const span = b[0] - a[0];
  const f = span === 0 ? 0 : (x - a[0]) / span;
  return {
    bg: `rgb(${lerp(a[1], b[1], f)}, ${lerp(a[2], b[2], f)}, ${lerp(a[3], b[3], f)})`,
    card: `rgb(${lerp(a[4], b[4], f)}, ${lerp(a[5], b[5], f)}, ${lerp(a[6], b[6], f)})`,
  };
}
