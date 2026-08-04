/**
 * LawLib — highlight re-application helpers (FR14).
 *
 * Highlights are stored as char offsets into an article's PLAIN text
 * (see `articlePlainText` in `lib/copy-print.ts`). Content is static
 * (build-time normalized), so offsets stay stable across sessions.
 *
 * Both functions are PURE — no DOM, no storage — unit-testable.
 * `mergeHighlightRanges` is the shared clamp+merge core imported by ArticleView
 * (single source of truth — do not re-implement in components).
 */

/** Structural subset of the stored highlight the core passes in. */
export type HighlightRange = Pick<HighlightLike, 'start' | 'end'>;

interface HighlightLike {
  start: number;
  end: number;
}

/**
 * Clamp a highlight range to the plain-text length and normalize the order:
 * - NaN / negative / fractional offsets are coerced to valid integers
 * - start/end are clamped into [0, len]
 * - end is clamped down to >= start (zero-length range → no mark)
 */
export function sanitizeOffsets(
  plainText: string,
  highlight: HighlightRange,
): { start: number; end: number } {
  const len = plainText.length;
  const start = Math.min(Math.max(Math.trunc(highlight.start) || 0, 0), len);
  const end = Math.min(Math.max(Math.trunc(highlight.end) || 0, start), len);
  return { start, end };
}

export interface HighlightSegment {
  text: string;
  mark: boolean;
}

/**
 * Clamp + merge highlight ranges against the plain-text length — THE single
 * source of truth for range normalization. ArticleView imports this instead
 * of re-implementing clamp/merge internally.
 *
 * Returns sorted, non-overlapping ranges: sanitized via `sanitizeOffsets`,
 * zero-length dropped, overlaps/touches merged (a char is marked at most once).
 */
export function mergeHighlightRanges(
  plainText: string,
  highlights: ReadonlyArray<HighlightRange>,
): Array<{ start: number; end: number }> {
  const ranges = highlights
    .map((h) => sanitizeOffsets(plainText, h))
    .filter((r) => r.end > r.start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: Array<{ start: number; end: number }> = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last !== undefined && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end;
    } else {
      merged.push({ start: r.start, end: r.end });
    }
  }
  return merged;
}

/**
 * Split plain text into marked/unmarked segments for the given highlight
 * ranges. Overlapping (and touching) ranges are merged first (via
 * `mergeHighlightRanges`), so a segment is marked exactly once even with
 * duplicate highlights. Zero-length and out-of-bounds ranges are dropped;
 * empty segments are never emitted.
 */
export function applyHighlightsToPlainText(
  plainText: string,
  highlights: ReadonlyArray<HighlightRange>,
): HighlightSegment[] {
  const merged = mergeHighlightRanges(plainText, highlights);

  const segments: HighlightSegment[] = [];
  let cursor = 0;
  for (const r of merged) {
    if (r.start > cursor) segments.push({ text: plainText.slice(cursor, r.start), mark: false });
    if (r.end > r.start) segments.push({ text: plainText.slice(r.start, r.end), mark: true });
    cursor = r.end;
  }
  if (cursor < plainText.length) {
    segments.push({ text: plainText.slice(cursor), mark: false });
  }
  return segments;
}
