import { describe, it, expect } from 'vitest';
import {
  sanitizeOffsets,
  mergeHighlightRanges,
  applyHighlightsToPlainText,
} from '@/lib/highlight-store';

// ---------------------------------------------------------------------------
// Pure helpers (FR14) — offsets are char offsets into an article's PLAIN text.
// Contract (see lib/highlight-store.ts doc comments):
//   - sanitizeOffsets: clamp into [0, len], coerce NaN/negative/fractional,
//     end never below start
//   - mergeHighlightRanges: sanitize → drop zero-length → sort → merge
//     overlaps AND touches (a char is marked at most once)
//   - applyHighlightsToPlainText: split into marked/unmarked segments,
//     never emits empty segments, never loses text
// ---------------------------------------------------------------------------

describe('sanitizeOffsets', () => {
  const T = 'abcdef'; // len 6

  it('clamps a negative start up to 0', () => {
    expect(sanitizeOffsets(T, { start: -3, end: 4 })).toEqual({ start: 0, end: 4 });
  });

  it('clamps an end beyond the text length down to len', () => {
    expect(sanitizeOffsets(T, { start: 2, end: 99 })).toEqual({ start: 2, end: 6 });
  });

  it('clamps a range fully beyond the length to {len, len}', () => {
    expect(sanitizeOffsets(T, { start: 10, end: 12 })).toEqual({ start: 6, end: 6 });
  });

  it('coerces NaN offsets to 0 (trunc(NaN) || 0)', () => {
    expect(sanitizeOffsets(T, { start: Number.NaN, end: 3 })).toEqual({ start: 0, end: 3 });
    expect(sanitizeOffsets(T, { start: 1, end: Number.NaN })).toEqual({ start: 1, end: 1 });
  });

  it('truncates fractional offsets (no rounding)', () => {
    expect(sanitizeOffsets(T, { start: 2.9, end: 5.7 })).toEqual({ start: 2, end: 5 });
  });

  it('clamps end up to start when end < start (incl. negative end)', () => {
    expect(sanitizeOffsets(T, { start: 4, end: 2 })).toEqual({ start: 4, end: 4 });
    expect(sanitizeOffsets(T, { start: 1, end: -2 })).toEqual({ start: 1, end: 1 });
  });

  it('passes a zero-length range through as {n, n}', () => {
    expect(sanitizeOffsets(T, { start: 3, end: 3 })).toEqual({ start: 3, end: 3 });
  });
});

describe('mergeHighlightRanges', () => {
  const T = 'abcdefghij'; // len 10

  it('returns [] for no highlights', () => {
    expect(mergeHighlightRanges(T, [])).toEqual([]);
  });

  it('drops zero-length ranges after sanitizing', () => {
    expect(
      mergeHighlightRanges(T, [
        { start: 1, end: 1 },
        { start: 3, end: 5 },
      ]),
    ).toEqual([{ start: 3, end: 5 }]);
  });

  it('sorts unsorted input by start (then end)', () => {
    expect(
      mergeHighlightRanges(T, [
        { start: 6, end: 8 },
        { start: 1, end: 3 },
      ]),
    ).toEqual([
      { start: 1, end: 3 },
      { start: 6, end: 8 },
    ]);
  });

  it('merges overlapping ranges into one', () => {
    expect(
      mergeHighlightRanges(T, [
        { start: 1, end: 5 },
        { start: 3, end: 7 },
      ]),
    ).toEqual([{ start: 1, end: 7 }]);
  });

  it('merges TOUCHING ranges (r.start <= last.end) — a char is marked once', () => {
    expect(
      mergeHighlightRanges(T, [
        { start: 1, end: 4 },
        { start: 4, end: 7 },
      ]),
    ).toEqual([{ start: 1, end: 7 }]);
  });

  it('merges containment + duplicate ranges down to the widest', () => {
    expect(
      mergeHighlightRanges(T, [
        { start: 1, end: 8 },
        { start: 2, end: 4 },
        { start: 1, end: 8 },
      ]),
    ).toEqual([{ start: 1, end: 8 }]);
  });

  it('clamps OOB ranges first, then merges (full-cover result)', () => {
    expect(
      mergeHighlightRanges(T, [
        { start: 0, end: 50 },
        { start: 8, end: 9 },
      ]),
    ).toEqual([{ start: 0, end: 10 }]);
  });

  it('keeps non-touching adjacent ranges separate (gap of 1+ char)', () => {
    expect(
      mergeHighlightRanges(T, [
        { start: 1, end: 3 },
        { start: 4, end: 6 },
      ]),
    ).toEqual([
      { start: 1, end: 3 },
      { start: 4, end: 6 },
    ]);
  });
});

describe('applyHighlightsToPlainText', () => {
  it('returns [] for an empty text (even with highlights)', () => {
    expect(applyHighlightsToPlainText('', [{ start: 0, end: 5 }])).toEqual([]);
  });

  it('returns the whole text unmarked when there are no highlights', () => {
    expect(applyHighlightsToPlainText('abcdef', [])).toEqual([{ text: 'abcdef', mark: false }]);
  });

  it('splits into unmarked / marked / unmarked for a mid-range highlight', () => {
    expect(applyHighlightsToPlainText('abcdef', [{ start: 2, end: 4 }])).toEqual([
      { text: 'ab', mark: false },
      { text: 'cd', mark: true },
      { text: 'ef', mark: false },
    ]);
  });

  it('handles a highlight at the very start', () => {
    expect(applyHighlightsToPlainText('abcdef', [{ start: 0, end: 2 }])).toEqual([
      { text: 'ab', mark: true },
      { text: 'cdef', mark: false },
    ]);
  });

  it('handles a highlight at the very end', () => {
    expect(applyHighlightsToPlainText('abcdef', [{ start: 4, end: 6 }])).toEqual([
      { text: 'abcd', mark: false },
      { text: 'ef', mark: true },
    ]);
  });

  it('marks the entire text for a full-cover range', () => {
    expect(applyHighlightsToPlainText('abcdef', [{ start: 0, end: 6 }])).toEqual([
      { text: 'abcdef', mark: true },
    ]);
  });

  it('marks each char exactly once with overlapping + duplicate highlights', () => {
    const segments = applyHighlightsToPlainText('abcdef', [
      { start: 1, end: 4 },
      { start: 2, end: 5 },
      { start: 1, end: 4 },
    ]);
    expect(segments).toEqual([
      { text: 'a', mark: false },
      { text: 'bcde', mark: true },
      { text: 'f', mark: false },
    ]);
    expect(segments.map((s) => s.text).join('')).toBe('abcdef'); // no text lost
  });

  it('drops OOB + zero-length ranges and never emits empty segments (touching merge)', () => {
    expect(
      applyHighlightsToPlainText('abcdef', [
        { start: 1, end: 3 },
        { start: 3, end: 5 },
        { start: 9, end: 9 },
        { start: 0, end: 99 },
      ]),
    ).toEqual([{ text: 'abcdef', mark: true }]);
  });

  it('never loses or duplicates text across many disjoint ranges', () => {
    const text = 'กขคงจฉชซฌญฎฏ';
    const highlights = [
      { start: 0, end: 3 },
      { start: 5, end: 7 },
      { start: 9, end: 12 },
    ];
    const segments = applyHighlightsToPlainText(text, highlights);
    expect(segments.map((s) => s.text).join('')).toBe(text);
    const marked = segments.filter((s) => s.mark).map((s) => s.text);
    expect(marked).toEqual(['กขค', 'ฉช', 'ญฎฏ']);
  });

  // SCRUTINY-L1: multi-วรรค plain text now contains '\n' (see parser pins).
  // Offsets are plain-text char offsets — the '\n' IS counted: 'วรรคแรก' =
  // chars 0..6, index 7 = '\n', 'วรรคสอง' = chars 8..14 (len 15).
  it('marks a range spanning the วรรค newline (the \\n char itself is marked)', () => {
    const text = 'วรรคแรก\nวรรคสอง';
    const segments = applyHighlightsToPlainText(text, [{ start: 6, end: 13 }]);
    expect(segments).toEqual([
      { text: 'วรรคแร', mark: false },
      { text: 'ก\nวรรคส', mark: true },
      { text: 'อง', mark: false },
    ]);
    expect(segments.map((s) => s.text).join('')).toBe(text); // no text lost
  });

  it('counts the newline when clamping (start 8 = first char of วรรคสอง; end clamps to len)', () => {
    // 'วรรคแรก\n' = 8 chars; the unmarked head includes the newline at 7, so
    // a second-วรรค highlight must start at 8 — proving '\n' occupies a slot.
    expect(applyHighlightsToPlainText('วรรคแรก\nวรรคสอง', [{ start: 8, end: 99 }])).toEqual([
      { text: 'วรรคแรก\n', mark: false },
      { text: 'วรรคสอง', mark: true },
    ]);
  });
});
