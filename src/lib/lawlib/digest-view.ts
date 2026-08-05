/**
 * LawLib digest — render model (server-built, rendered by the reader client).
 *
 * Model + pure grouping helpers — no 'use client' directive: importable from
 * both the server page and the client shell (the builder is pure; it never
 * touches fs/network, so shipping it to the client is harmless).
 *
 * rev 5.5 (FULL/COMPACT merge): token model extended for the merged reader —
 *   - RenderToken gains `term` kind (tooltip spans) + `bold`/`strike` flags
 *     (markers `**`/`~~` are consumed at BUILD time, mirroring the legacy
 *     BoldText/InlineText balanced-pair semantics);
 *   - every line carries a stable `lawlib-dline-<n>` id (ONE global counter
 *     across the whole DigestView — per-section restart would collide);
 *   - buildView is parametrized by law slug/href (no hardcoded constants);
 *   - `digestHasCard` drives the compact-view jump rule.
 */

import type { DigestDoc, DigestLineToken, DigestRef } from '@/lib/lawlib/parser';
import { matchDigestArticleHeader, tokenizeDigestLine } from '@/lib/lawlib/parser';
import type { GlossaryTerm } from '@/lib/lawlib-reader';
import { splitByTerms } from '@/lib/lawlib-reader';

/** One inline segment of a rendered digest line. */
export type RenderToken =
  | { kind: 'text'; text: string; bold?: boolean; strike?: boolean }
  | {
      kind: 'term';
      term: string;
      definition: string;
      bold?: boolean;
      strike?: boolean;
    }
  | {
      kind: 'ref' | 'seefull';
      /** Link label (parseRef display, e.g. 'มาตรา 51/1'). */
      label: string;
      /** null → render as plain text (unresolved cross-law ref). */
      href: string | null;
    };

/** One rendered body line of a digest section. */
export type RenderLine =
  | {
      kind: 'h3' | 'quote' | 'bullet' | 'numbered' | 'text';
      /** 'lawlib-dline-<n>' — stable DOM id (search jumps/flash), never a URL hash. */
      id: string;
      tokens: RenderToken[];
    }
  | {
      kind: 'article';
      id: string;
      /** Primary article key ('11' | '51/1') — chapter-boundary lookup + React keys. */
      key: string;
      /**
       * ALL member keys of a MERGED card (['11','12']) — present ONLY on
       * merged headers ('มาตรา 11 - มาตรา 12', user 2026-08-05); absent on
       * single-article cards (existing callers keep working unchanged).
       */
      keys?: string[];
      label: string;
      href: string;
      /** Header content first, then continuation lines until the next article header (or `### `). */
      parts: Array<{
        kind: 'quote' | 'bullet' | 'numbered' | 'text';
        tokens: RenderToken[];
      }>;
      /**
       * Per-มาตรา concise history (user 2026-08-05): `- ประวัติ: …` bullets
       * inside a มาตรา card are collected here (NOT rendered in the card
       * summary) and surfaced in the hover popover only.
       */
      history?: string[];
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
          .filter(
            (t): t is Extract<RenderToken, { kind: 'text' | 'term' }> =>
              t.kind === 'text' || t.kind === 'term',
          )
          .map((t) => (t.kind === 'text' ? t.text : t.term))
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

// ---------------------------------------------------------------------------
// Token building (marker-aware + term segmentation)
// ---------------------------------------------------------------------------

/** One run of text with marker flags ('**' bold, '~~' strike). */
export interface MarkerRun {
  text: string;
  bold: boolean;
  strike: boolean;
}

/**
 * Split raw text into marker runs. Balanced `**…**` / `~~…~~` pairs are
 * consumed (mirrors the legacy BoldText/InlineText semantics); unmatched
 * markers stay literal text.
 */
export function splitMarkerRuns(text: string): MarkerRun[] {
  const runs: MarkerRun[] = [];
  const re = /\*\*(.+?)\*\*|~~(.+?)~~/g;
  let last = 0;
  for (let m = re.exec(text); m !== null; m = re.exec(text)) {
    if (m.index > last) runs.push({ text: text.slice(last, m.index), bold: false, strike: false });
    if (m[1] !== undefined) runs.push({ text: m[1], bold: true, strike: false });
    else runs.push({ text: m[2], bold: false, strike: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), bold: false, strike: false });
  return runs;
}

/** Term-aware tokenization of ONE plain (marker-free) run. */
function tokenizeRun(run: MarkerRun, terms: GlossaryTerm[]): RenderToken[] {
  const out: RenderToken[] = [];
  if (run.text === '') return out;
  if (terms.length === 0) {
    out.push({
      kind: 'text',
      text: run.text,
      ...(run.bold ? { bold: true } : {}),
      ...(run.strike ? { strike: true } : {}),
    });
    return out;
  }
  for (const seg of splitByTerms(run.text, terms)) {
    if (seg.term !== undefined) {
      out.push({
        kind: 'term',
        term: seg.term.term,
        definition: seg.term.definition,
        ...(run.bold ? { bold: true } : {}),
        ...(run.strike ? { strike: true } : {}),
      });
    } else {
      out.push({
        kind: 'text',
        text: seg.text,
        ...(run.bold ? { bold: true } : {}),
        ...(run.strike ? { strike: true } : {}),
      });
    }
  }
  return out;
}

/**
 * Full digest-line tokenization: marker-split FIRST (`**`/`~~` runs), then
 * term segmentation via splitByTerms on each plain run (longest-match-first,
 * same as ArticleView). Ref tokens pass through untouched; order preserved.
 */
export function tokenizeRenderText(text: string, terms: GlossaryTerm[]): RenderToken[] {
  const out: RenderToken[] = [];
  for (const run of splitMarkerRuns(text)) {
    out.push(...tokenizeRun(run, terms));
  }
  return out;
}

// ---------------------------------------------------------------------------
// View builder (parametrized by law slug/href)
// ---------------------------------------------------------------------------

/** 'มาตรา 10' | 'มาตรา 10 ทวิ' | 'มาตรา 10/1' — article display label. */
export function articleLabel(no: number, suffix?: string): string {
  return `มาตรา ${no}${suffix ? (suffix.startsWith('/') ? suffix : ` ${suffix}`) : ''}`;
}

/**
 * Deep link for a ref: same-law → `defaultSlug`; cross-law → the planned-laws
 * alias of the authored code. null → unresolved (plain text).
 *
 * Defense in depth: build.ts already rejects non-conforming planned-law
 * slugs (validatePlannedLaws), but a hand-edited manifest must never emit a
 * junk href — non `/^[a-z0-9-]+$/i` slugs resolve to null (plain text).
 */
export function refHref(
  ref: DigestRef,
  aliases: Map<string, string>,
  defaultSlug: string,
): string | null {
  const key = `${ref.articleNo}${ref.articleSuffix ?? ''}`;
  const base = ref.lawSlug !== undefined ? aliases.get(ref.lawSlug) : defaultSlug;
  if (base === undefined || !/^[a-z0-9-]+$/i.test(base)) return null;
  return `/lawlib/${base}#มาตรา-${key}`;
}

/** DigestLineToken[] → RenderToken[] (text runs term/marker-aware; refs via refHref). */
function refTokens(
  tokens: DigestLineToken[],
  aliases: Map<string, string>,
  defaultSlug: string,
  terms: GlossaryTerm[],
): RenderToken[] {
  const out: RenderToken[] = [];
  for (const tok of tokens) {
    if (tok.kind === 'text') {
      out.push(...tokenizeRenderText(tok.t, terms));
    } else {
      out.push({
        kind: tok.kind,
        label: tok.ref.display,
        href: refHref(tok.ref, aliases, defaultSlug),
      });
    }
  }
  return out;
}

function classifyLine(line: string): 'h3' | 'quote' | 'bullet' | 'numbered' | 'text' {
  if (line.startsWith('### ')) return 'h3';
  if (line.startsWith('> ')) return 'quote';
  if (line.startsWith('- ')) return 'bullet';
  if (/^\(\d+\)/.test(line)) return 'numbered';
  return 'text';
}

/** buildView options — law slug/href (no hardcoded constants). */
export interface BuildViewOptions {
  /** The digest's target law slug (same-law ref base). */
  slug: string;
  /** Deep-link base for article cards: `/lawlib/<slug>`. */
  href: string;
}

/**
 * Build the render model: line kinds + article jump chips per section.
 * Line ids (`lawlib-dline-<n>`) use ONE global counter across the whole
 * DigestView — per-section restarting would duplicate ids (loop-1 #2).
 */
export function buildView(
  doc: DigestDoc,
  aliases: Map<string, string>,
  chapterTable: DigestChapterInfo[] | null,
  terms: GlossaryTerm[],
  opts: BuildViewOptions,
): DigestView {
  let dline = 0;
  const nextId = (): string => `lawlib-dline-${++dline}`;

  const sections: RenderSection[] = doc.sections.map((section) => {
    const lines: RenderLine[] = [];
    const seen = new Set<string>();
    const articles: RenderSection['articles'] = [];
    // Continuation lines (วรรค, bullets, amendment quotes) group into the open
    // article card until the next article header — or a `### ` sub-heading.
    let openArticle: Extract<RenderLine, { kind: 'article' }> | null = null;

    const closeArticle = (): void => {
      if (openArticle !== null) {
        lines.push(openArticle);
        openArticle = null;
      }
    };

    for (const rawLine of section.body.split('\n')) {
      const line = rawLine.trimEnd();
      if (line === '') continue; // blank lines → spacing handled by the shell

      const header = matchDigestArticleHeader(line);
      if (header) {
        closeArticle();
        // Merged header ('**มาตรา 11 - มาตรา 12** : …', user 2026-08-05) →
        // ONE card: key/href = FIRST member; `keys` = every member; one jump
        // chip per member (own label, merged anchor) so digestHasCard('12')
        // is true and both chips render.
        const members: Array<{ no: number; suffix?: string }> = [
          { no: header.no, suffix: header.suffix },
          ...(header.no2 !== undefined ? [{ no: header.no2, suffix: header.suffix2 }] : []),
        ];
        const keys = members.map((m) => `${m.no}${m.suffix ?? ''}`);
        const key = keys[0];
        const label = members.map((m) => articleLabel(m.no, m.suffix)).join(' - ');
        const href = `${opts.href}#มาตรา-${key}`;
        for (let i = 0; i < members.length; i++) {
          const k = keys[i];
          if (seen.has(k)) continue;
          seen.add(k);
          articles.push({ key: k, label: articleLabel(members[i].no, members[i].suffix), href });
        }
        openArticle = {
          kind: 'article',
          id: nextId(),
          key,
          ...(keys.length > 1 ? { keys } : {}),
          label,
          href,
          parts: [
            {
              kind: 'text',
              tokens: refTokens(tokenizeDigestLine(header.rest), aliases, opts.slug, terms),
            },
          ],
        };
        continue;
      }

      const kind = classifyLine(line);
      // The line-prefix markers are replaced by the shell's styling — only the
      // content after them is tokenized ('### ' included: the prefix must never
      // leak into the rendered heading text).
      const content =
        kind === 'quote'
          ? line.replace(/^>\s?/, '')
          : kind === 'bullet'
            ? line.slice(2)
            : kind === 'h3'
              ? line.slice(4)
              : line;
      const tokens = refTokens(tokenizeDigestLine(content), aliases, opts.slug, terms);
      if (kind === 'h3') closeArticle(); // `### ` starts a new block context
      if (openArticle !== null && kind !== 'h3') {
        // Per-มาตรา concise history (user 2026-08-05): `- ประวัติ: …` bullets
        // inside a มาตรา card → collected into `history`, NOT rendered in the
        // card summary (surfaced in the hover popover only).
        if (kind === 'bullet') {
          const plain = tokens
            .filter(
              (t): t is Extract<RenderToken, { kind: 'text' | 'term' }> =>
                t.kind === 'text' || t.kind === 'term',
            )
            .map((t) => (t.kind === 'text' ? t.text : t.term))
            .join('');
          if (plain.startsWith('ประวัติ:')) {
            const note = plain.slice('ประวัติ:'.length).trim();
            if (note !== '') {
              openArticle.history = [...(openArticle.history ?? []), note];
              continue;
            }
          }
        }
        openArticle.parts.push({ kind, tokens });
      } else {
        lines.push({ kind, id: nextId(), tokens });
      }
    }
    closeArticle();

    // Chapter-group split (มาตราสำคัญ): flat when the law JSON is missing or
    // the section has no article cards (ข้อมูลกฎหมาย / เหตุผล / คำนิยาม).
    let grouped: ReturnType<typeof buildChapterGroups> | null = null;
    if (chapterTable !== null) grouped = buildChapterGroups(lines, chapterTable);

    return {
      heading: section.heading,
      articles,
      lines: grouped !== null ? grouped.preamble : lines,
      ...(grouped !== null && grouped.groups.length > 0 ? { groups: grouped.groups } : {}),
    };
  });

  return { title: doc.title, sections };
}

/**
 * Jump-rule helper (compact view): does the digest render a card for this
 * article key? Cards = the section jump-chip sets (deduped, document order).
 */
export function digestHasCard(view: DigestView, key: string): boolean {
  return view.sections.some((s) => s.articles.some((a) => a.key === key));
}
