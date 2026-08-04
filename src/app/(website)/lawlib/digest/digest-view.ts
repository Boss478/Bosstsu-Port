/**
 * LawLib digest page — render model (server-built in digest/page.tsx, rendered
 * by DigestStudyClient through the DigestShell boundary).
 *
 * Model + pure grouping helpers — no 'use client' directive: importable from
 * both the server page and the client shell (the builder is pure; it never
 * touches fs/network, so shipping it to the client is harmless).
 */

/** One inline segment of a rendered digest line. */
export type RenderToken =
  | { kind: 'text'; text: string }
  | {
      kind: 'ref' | 'seefull';
      /** Link label (parseRef display, e.g. 'มาตรา 51/1'). */
      label: string;
      /** null → render as plain text (unresolved cross-law ref). */
      href: string | null;
    };

/** One rendered body line of a digest section. */
export type RenderLine =
  | { kind: 'h3' | 'quote' | 'bullet' | 'numbered' | 'text'; tokens: RenderToken[] }
  | {
      kind: 'article';
      /** Article key ('10' | '51/1') — chapter-boundary lookup + React keys. */
      key: string;
      label: string;
      href: string;
      /** Header content first, then continuation lines until the next article header (or `### `). */
      parts: Array<{ kind: 'quote' | 'bullet' | 'numbered' | 'text'; tokens: RenderToken[] }>;
    };

/** One chapter group of a digest section (e.g. หมวดที่ 4 … (9 มาตรา)). */
export interface RenderChapterGroup {
  /** Stable id for collapse state + DOM ids ('ch-1', 'ch-x-1'). */
  id: string;
  /** Header label: 'หมวดที่ N <title>' for numbered chapters, title for unnumbered. */
  label: string;
  /** Number of article cards in this group. */
  articleCount: number;
  lines: RenderLine[];
}

export interface RenderSection {
  heading: string;
  /** Article jump chips — deduped, in document order. */
  articles: Array<{ key: string; label: string; href: string }>;
  /**
   * Grouped sections (groups !== undefined): preamble lines BEFORE the first
   * chapter group. Flat sections: every line of the section.
   */
  lines: RenderLine[];
  /** Chapter groups (มาตราสำคัญ → หมวดที่ 1–9 + บทเฉพาะกาล); absent → flat render. */
  groups?: RenderChapterGroup[];
}

export interface DigestView {
  title: string;
  sections: RenderSection[];
}

/**
 * Chapter boundary table — built server-side from the target law JSON
 * (src/data/lawlib/laws/<slug>.json), consumed by buildChapterGroups.
 */
export interface DigestChapterInfo {
  /** null → un-numbered chapter (บททั่วไป / บทเฉพาะกาล). */
  no: number | null;
  title: string;
  /** Article keys ('10', '51/1') that belong to this chapter. */
  articleKeys: string[];
}

/** Group-header label for a table chapter ('หมวดที่ 1 บททั่วไป ความมุ่งหมายและหลักการ'). */
function chapterLabel(no: number | null, title: string): string {
  return no !== null ? `หมวดที่ ${no} ${title}`.trim() : title.trim();
}

/** Whitespace-normalize for h3 ↔ chapter-title matching. */
function norm(s: string): string {
  return s.replace(/\s+/g, ' ').trim();
}

/**
 * Split flat section lines into chapter groups, using the target law's
 * chapter table:
 *  - an article line whose chapter differs from the open group's chapter
 *    starts a new group (label 'หมวดที่ N <title>', or the title alone for
 *    un-numbered chapters);
 *  - an h3 line whose text matches an UN-numbered chapter title (e.g.
 *    '### บทเฉพาะกาล') is CONSUMED as that group's header — it never renders
 *    as a body line;
 *  - lines before the first group boundary become the section preamble;
 *  - articles/`### `s that match nothing stay visible: open group if one is
 *    open, else preamble (never dropped).
 *
 * Returns null when the chapter table is empty (caller keeps the flat model);
 * otherwise { preamble, groups } — groups is [] when no boundary was found
 * (sections without article cards).
 */
export function buildChapterGroups(
  lines: RenderLine[],
  chapters: DigestChapterInfo[],
): { preamble: RenderLine[]; groups: RenderChapterGroup[] } | null {
  if (chapters.length === 0) return null;

  const byKey = new Map<string, DigestChapterInfo>();
  for (const ch of chapters) {
    for (const key of ch.articleKeys) byKey.set(key, ch);
  }
  // h3 boundaries only bind to un-numbered chapters (บทเฉพาะกาล …)
  const byH3 = new Map<string, DigestChapterInfo>();
  for (const ch of chapters) {
    if (ch.no === null) byH3.set(norm(ch.title), ch);
  }

  const preamble: RenderLine[] = [];
  const groups: RenderChapterGroup[] = [];
  let current: RenderChapterGroup | null = null;
  let currentChapter: DigestChapterInfo | null = null;
  let unnumbered = 0;

  for (const line of lines) {
    if (line.kind === 'h3') {
      // '### บทเฉพาะกาล' → the group header itself (h3 content, '### ' already
      // stripped by buildView). Non-matching h3s fall through to the lines.
      const text = norm(
        line.tokens
          .filter((t): t is Extract<RenderToken, { kind: 'text' }> => t.kind === 'text')
          .map((t) => t.text)
          .join(''),
      );
      const ch = byH3.get(text);
      if (ch !== undefined) {
        if (current !== null) groups.push(current);
        currentChapter = ch;
        current = {
          id: ch.no !== null ? `ch-${ch.no}` : `ch-x-${++unnumbered}`,
          label: text,
          articleCount: 0,
          lines: [],
        };
        continue;
      }
    } else if (line.kind === 'article') {
      const ch = byKey.get(line.key) ?? null;
      if (ch !== currentChapter) {
        if (current !== null) groups.push(current);
        currentChapter = ch;
        // unknown article → no group to open; it stays visible in the preamble
        current =
          ch !== null
            ? {
                id: ch.no !== null ? `ch-${ch.no}` : `ch-x-${++unnumbered}`,
                label: chapterLabel(ch.no, ch.title),
                articleCount: 0,
                lines: [],
              }
            : null;
      }
      if (current !== null) {
        current.articleCount++;
        current.lines.push(line);
      } else {
        preamble.push(line);
      }
      continue;
    }

    // plain body line → open group if one is open, else preamble
    if (current !== null) current.lines.push(line);
    else preamble.push(line);
  }
  if (current !== null) groups.push(current);

  return { preamble, groups };
}
