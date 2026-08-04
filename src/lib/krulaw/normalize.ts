/**
 * KruLAW — text normalization primitives.
 *
 * All authored Thai text is normalized at build time (NFR8):
 *  1. Thai digits ๐-๙ → Arabic 0-9
 *  2. Unicode NFC (composes NIKHAHIT + SARA AA → SARA AM)
 *  3. Whitespace: tabs/runs of spaces → single space, trim ends
 *
 * GOTCHA: `normalizeText` MUST preserve `\n` — the วรรค grammar in
 * `parser.ts` treats blank lines as paragraph separators, so only `[ \t]+`
 * runs are collapsed (never `\s+`).
 */

const THAI_DIGIT_MAP: Record<string, string> = {
  '๐': '0',
  '๑': '1',
  '๒': '2',
  '๓': '3',
  '๔': '4',
  '๕': '5',
  '๖': '6',
  '๗': '7',
  '๘': '8',
  '๙': '9',
};

/** ๐-๙ → 0-9; everything else untouched. */
export function normalizeThaiDigits(s: string): string {
  return s.replace(/[๐-๙]/g, (d) => THAI_DIGIT_MAP[d] ?? d);
}

/**
 * Unicode NFC (idempotent).
 *
 * COMPAT SHIM (ICU 78 / Unicode 17): U+0E33 SARA AM's decomposition was
 * demoted from canonical to *compat* in Unicode 17.0, so platform NFC no
 * longer composes the sequence <U+0E4D NIKHAHIT, U+0E32 SARA AA> → ำ on
 * Node ≥ 26. The frozen KruLAW contract (parser spec §3 + NFR8) pins the
 * composed form as canonical (glossary matching depends on it), so we
 * re-apply that single composition explicitly. This pass is a no-op on
 * Node <26; required on Node ≥26 (Unicode 17 demoted SARA-AM composition
 * to compat). Behavior is identical and idempotent on both.
 */
const THAI_SARA_AM_COMPOSE_RE = /\u0E4D\u0E32/g;

export function normalizeNfc(s: string): string {
  return s.normalize('NFC').replace(THAI_SARA_AM_COMPOSE_RE, '\u0E33');
}

/**
 * Thai digits + NFC + `[ \t]+` → single space + trim.
 * Preserves `\n` (วรรค separators are significant). Idempotent.
 */
export function normalizeText(s: string): string {
  return normalizeThaiDigits(normalizeNfc(s))
    .replace(/[ \t]+/g, ' ')
    .trim();
}
