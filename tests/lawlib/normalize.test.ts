// ===========================================================================
// LawLib L1 — normalization contract (case 8 of the 11-case TDD checklist).
// Thai digits ๐-๙ → Arabic, NFC (SARA AM composition pinned), whitespace
// collapse. normalizeText MUST preserve '\n' — วรรค separators are the
// parser's block grammar. Deterministic — pure functions only.
// ===========================================================================

import { describe, it, expect } from 'vitest';
import { normalizeThaiDigits, normalizeNfc, normalizeText } from '@/lib/lawlib/normalize';

describe('normalizeThaiDigits', () => {
  it('maps every Thai digit to its Arabic counterpart', () => {
    expect(normalizeThaiDigits('๐๑๒๓๔๕๖๗๘๙')).toBe('0123456789');
  });

  it('converts Thai digits mixed with Arabic digits', () => {
    expect(normalizeThaiDigits('มาตรา ๑๐/1')).toBe('มาตรา 10/1');
  });

  it('converts Thai digits embedded mid-sentence', () => {
    expect(normalizeThaiDigits('วรรคที่ ๒ ของมาตรา ๑๒')).toBe('วรรคที่ 2 ของมาตรา 12');
  });

  it('leaves strings without Thai digits untouched', () => {
    expect(normalizeThaiDigits('มาตรา 10 ทวิ')).toBe('มาตรา 10 ทวิ');
  });

  it('converts Thai digits in a มาตรา ref with /N suffix (๕๑/๑ → 51/1)', () => {
    expect(normalizeThaiDigits('มาตรา ๕๑/๑')).toBe('มาตรา 51/1');
  });

  it('handles the empty string', () => {
    expect(normalizeThaiDigits('')).toBe('');
  });
});

describe('normalizeNfc', () => {
  // SARA AM (U+0E33) is the one Thai character with a canonical decomposition:
  // NIKHAHIT (U+0E4D) + SARA AA (U+0E32). NFC must compose it.
  it('composes a decomposed SARA AM sequence (NIKHAHIT + SARA AA)', () => {
    expect(normalizeNfc('\u0E4D\u0E32')).toBe('\u0E33');
  });

  it('leaves precomposed Thai text unchanged (คูณ)', () => {
    expect(normalizeNfc('คูณ')).toBe('คูณ');
  });

  // สระเอ (U+0E40) + ไม้เอก (U+0E48) + พ has no composed form — NFC must be identity.
  it('does not corrupt Thai combining sequences (สระเอ + ไม้เอก)', () => {
    expect(normalizeNfc('\u0E40\u0E48\u0E1E')).toBe('\u0E40\u0E48\u0E1E');
  });

  it('is idempotent', () => {
    const s = '\u0E4D\u0E32แหน่ง';
    expect(normalizeNfc(normalizeNfc(s))).toBe(normalizeNfc(s));
  });
});

describe('normalizeText', () => {
  it('converts Thai digits', () => {
    expect(normalizeText('มาตรา ๑๐')).toBe('มาตรา 10');
  });

  it('collapses tabs to a single space', () => {
    expect(normalizeText('ก\tข')).toBe('ก ข');
  });

  it('collapses runs of spaces to a single space', () => {
    expect(normalizeText('ก   ข')).toBe('ก ข');
  });

  it('collapses mixed tabs and spaces', () => {
    expect(normalizeText('ก \t ข')).toBe('ก ข');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeText('  มาตรา ๑๐  ')).toBe('มาตรา 10');
  });

  it('applies NFC normalization', () => {
    // NIKHAHIT + SARA AA (0E4D+0E32) composes to SARA AM (U+0E33): ขำ, not ข้ (MAI THO).
    expect(normalizeText('ข\u0E4D\u0E32ราชการ')).toBe('ขำราชการ');
  });

  // วรรค separators are blank lines — normalizeText must NOT collapse newlines,
  // otherwise the parser grammar (blank line = separator) breaks.
  it('preserves newlines (วรรค separators are significant)', () => {
    expect(normalizeText('บรรทัดแรก\nบรรทัดสอง')).toBe('บรรทัดแรก\nบรรทัดสอง');
  });

  it('is idempotent', () => {
    const s = '  มาตรา ๑๐ ทวิ \t กับ ข\u0E4D\u0E32ราชการ  ';
    expect(normalizeText(normalizeText(s))).toBe(normalizeText(s));
  });
});
