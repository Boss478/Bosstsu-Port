/**
 * LawLib — snippet windowing (SearchPanel in-law search + LawlibListClient
 * full-text search; SCRUTINY-L2).
 *
 * The ±before/after char window around a match is clamped to วรรค
 * boundaries: plain text contains '\n' at วรรค separators (parser contract,
 * L1-1), so a snippet never starts or ends mid-วรรค. Render the slices with
 * `whitespace-pre-line` so the embedded '\n' shows as line breaks.
 */
export interface SnippetWindow {
  /** Window start (start of the วรรค containing the -before cut). */
  start: number;
  /** Window end (end of the วรรค containing the +after cut — '\n' excluded). */
  end: number;
  /** True when text precedes the window (render '…'). */
  ellipsisBefore: boolean;
  /** True when text follows the window (render '…'). */
  ellipsisAfter: boolean;
}

export function snippetWindow(
  plain: string,
  matchStart: number,
  matchLen: number,
  before = 30,
  after = 80,
): SnippetWindow {
  let start = Math.max(0, matchStart - before);
  const nlBefore = plain.lastIndexOf('\n', start - 1);
  if (nlBefore !== -1) start = nlBefore + 1;

  let end = Math.min(plain.length, matchStart + matchLen + after);
  const nlAfter = plain.indexOf('\n', end);
  if (nlAfter !== -1) end = nlAfter;

  return { start, end, ellipsisBefore: start > 0, ellipsisAfter: end < plain.length };
}
