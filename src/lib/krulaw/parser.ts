/**
 * KruLAW — markdown → LawDoc parser.
 *
 * Grammar (see .agents/plans/krulaw-parser-tdd-spec.md §3):
 *  - `---` frontmatter: slug, code, titleTh, subject, part, tags, verifiedAt,
 *    gazetteRef, editions (block YAML lists + flow `tags: [a, b]` + quotes)
 *  - `## ความหมาย`: `- **term** : definition` (term = bold segment only;
 *    definition continues — soft-wrapped lines AND blank-line paragraphs join
 *    with a single space — until the next `- **` or `##` heading)
 *  - `## หมวดที่ N title` → numbered chapter; `## บททั่วไป` / other plain
 *    `## X` → un-numbered chapter (no: null)
 *  - `### ส่วนที่ N title` → section entry of the CURRENT chapter
 *    (`sections[].no` = N or null when omitted; title optional); its articles
 *    go into that section until the next section or `##` heading
 *  - `**มาตรา N**` / `**มาตรา N ทวิ**` / `**มาตรา N/1**` (Thai digits OK)
 *  - วรรค = blank-line-separated blocks; soft-wrapped วรรค = ONE block;
 *    consecutive วรรค are joined by '\n' TEXT tokens (BETWEEN blocks only —
 *    never leading/trailing; metadata blocks skipped; a marker block between
 *    two วรรค still separates them, so they keep their '\n')
 *  - `> แก้ไขเพิ่มเติมโดยฉบับที่ N` / `> เพิ่มโดยฉบับที่ N` / `> เพิ่มเติมโดยฉบับที่ N`
 *    / `> วรรค<ordinal> เพิ่มโดยฉบับที่ N` → amendedBy (EVERY '>'-line of a
 *    block is scanned — multi-marker blocks produce multiple entries; note =
 *    'เพิ่มวรรค<ordinal>' when the prefix is present, else the trailing text
 *    after 'ฉบับที่ N')
 *  - `> ~~paras~~ ถูกยกเลิกโดย <instrument>` + `> `-indented verbatim lines
 *    → repealedParagraphs (verbatim lines joined with `\n`)
 *  - `[[มาตรา 10]]` same-law · `[[มาตรา 5|พ.ร.บ.… 2547]]` cross-law
 *    (แห่ง auto-inserted in display; lawSlug = authored 2nd segment verbatim)
 *
 * Throws Error on STRUCTURAL unparseables only:
 *  - unclosed `[[` (no matching `]]` in the same paragraph)
 *  - malformed article header (`**มาตรา ก**`)
 *  - missing required frontmatter key (slug/code/titleTh/subject/part/tags/
 *    verifiedAt/gazetteRef/editions) or an invalid `part` value
 * Content is otherwise permissive (unknown headings become un-numbered
 * chapters; closed-but-unrecognized `[[…]]` stays literal text and is caught
 * later by validate rule 8; stray `>` lines stay verbatim in วรรค text and
 * are caught by validate rule 10).
 */

import type { Article, ArticleToken, LawDoc } from '../../types/krulaw';
import { normalizeText, normalizeThaiDigits } from './normalize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REQUIRED_FM_KEYS = [
  'slug',
  'code',
  'titleTh',
  'subject',
  'part',
  'tags',
  'verifiedAt',
  'gazetteRef',
  'editions',
] as const;

/** Thai ordinal suffixes, in legal precedence order. */
const ARTICLE_SUFFIXES = 'ทวิ|ตรี|จัตวา|เบญจ|ฉ|สัตต|อัฏฐ|นว';

const ARTICLE_HEADER_RE = new RegExp(
  `^\\*\\*มาตรา\\s*([0-9๑-๙]+)(?:\\s*(${ARTICLE_SUFFIXES})|(/\\d+))?\\*\\*`,
);

/** Frozen ref regex — /N suffix is ASCII-only by design. */
const REF_RE = new RegExp(`มาตรา\\s*([0-9๑-๙]+)(?:\\s*(${ARTICLE_SUFFIXES})|(/\\d+))?`);

const CHAPTER_RE = /^##\s*หมวดที่\s*([0-9๑-๙]+)\s*(.*)$/;
const DEFINITIONS_HEADING_RE = /^##\s*ความหมาย\s*$/;
/**
 * ส่วนที่ N section heading (checked BEFORE the generic heading check so a
 * `### ส่วนที่ …` nests under the current chapter instead of becoming one).
 * Number and title are both optional; the line is Thai-digit-normalized
 * before matching, so the ๐-๙ class only matters for raw input.
 */
const SECTION_HEADING_RE = /^###\s*ส่วนที่\s*([0-9๐-๙]+)?\s*(.*)$/;
/** Any `##`+ heading not matched above (บททั่วไป, บทเฉพาะกาล, …) */
const GENERIC_HEADING_RE = /^#{2,}\s*(.+)$/;

const DEFINITION_BULLET_RE = /^-\s*\*\*(.+?)\*\*\s*:\s*(.*)$/;

/**
 * Amendment marker. Optional `วรรค<ordinal>` prefix, then the by-ฉบับ clause
 * (แก้ไขเพิ่มเติม / เพิ่มเติม / เพิ่ม variants — the regex accepts any mix).
 * Groups: 1 = ordinal (literary Thai numeral, e.g. 'ห้า') when present,
 * 2 = edition no, 3 = trailing text after 'ฉบับที่ N'.
 * NOTE: exported for validate.ts rule 10 (stray '>' drift detection).
 */
export const AMENDED_BY_RE =
  /^>\s*(?:วรรค\s*([^\s]+?)\s*)?(?:แก้ไข)?เพิ่ม(?:เติม)?โดยฉบับที่\s*([0-9๑-๙]+)\s*(.*)$/;
/** NOTE: exported for validate.ts rule 10. */
export const REPEALED_RE = /^>\s*~~(.+?)~~\s*ถูกยกเลิกโดย\s*(.+)$/;

// ---------------------------------------------------------------------------
// Frontmatter
// ---------------------------------------------------------------------------

interface Frontmatter {
  slug: string;
  code: string;
  titleTh: string;
  subject: string;
  part: 'ก' | 'ข';
  tags: string[];
  verifiedAt: string;
  gazetteRef: string;
  editions: LawDoc['editions'];
}

function stripQuotes(v: string): string {
  const t = v.trim();
  if (
    t.length >= 2 &&
    ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'")))
  ) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/** Minimal YAML subset: top-level scalars, block lists, flow lists, quotes. */
function parseFrontmatter(lines: string[]): Frontmatter {
  const fm: Record<string, unknown> = {};
  let listKey: string | null = null;
  let curItem: Record<string, string> | null = null;

  const pushItem = (): void => {
    if (curItem && listKey && Array.isArray(fm[listKey])) {
      (fm[listKey] as Array<Record<string, string>>).push(curItem);
    }
    curItem = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === '') continue;

    // `- field: value` → new object list item (editions)
    const objItem = /^-\s+([A-Za-z]+):\s*(.*)$/.exec(line.trimStart());
    if (objItem && line.trimStart().startsWith('-')) {
      pushItem();
      curItem = { [objItem[1]]: stripQuotes(objItem[2]) };
      if (listKey && !Array.isArray(fm[listKey])) fm[listKey] = [];
      continue;
    }
    // `- value` → string list item (tags)
    const strItem = /^-\s+(.+)$/.exec(line.trimStart());
    if (strItem && line.trimStart().startsWith('-')) {
      if (listKey && Array.isArray(fm[listKey])) {
        (fm[listKey] as string[]).push(stripQuotes(strItem[1]));
      }
      continue;
    }
    // indented `field: value` → current object item field
    const field = /^([A-Za-z]+):\s*(.*)$/.exec(line.trimStart());
    if (field && line.startsWith(' ')) {
      if (curItem) curItem[field[1]] = stripQuotes(field[2]);
      continue;
    }
    // top-level `key: value`
    const top = /^([A-Za-z]+):\s*(.*)$/.exec(line);
    if (top) {
      pushItem();
      const value = top[2].trim();
      const flow = /^\[(.*)\]$/.exec(value);
      if (flow) {
        fm[top[1]] = flow[1]
          .split(',')
          .map((s) => stripQuotes(s))
          .filter((s) => s !== '');
        listKey = null;
      } else if (value === '') {
        fm[top[1]] = [];
        listKey = top[1];
      } else {
        fm[top[1]] = stripQuotes(value);
        listKey = null;
      }
    }
    // anything else: ignored (permissive)
  }
  pushItem();

  for (const key of REQUIRED_FM_KEYS) {
    if (!(key in fm)) {
      throw new Error(`frontmatter: missing required key "${key}"`);
    }
  }

  if (fm.part !== 'ก' && fm.part !== 'ข') {
    throw new Error(`frontmatter: part ต้องเป็น "ก" หรือ "ข" (ได้ "${String(fm.part)}")`);
  }

  return {
    slug: fm.slug as string,
    code: fm.code as string,
    titleTh: fm.titleTh as string,
    subject: fm.subject as string,
    part: fm.part as 'ก' | 'ข',
    tags: (fm.tags as string[]) ?? [],
    verifiedAt: fm.verifiedAt as string,
    gazetteRef: fm.gazetteRef as string,
    editions: ((fm.editions as Array<Record<string, string>>) ?? []).map((e) => ({
      // Thai digits in authored edition numbers (no: ๑, ๒, …) → NaN if not
      // normalized first (SCRUTINY-L1).
      no: Number(normalizeThaiDigits(String(e.no))),
      gazetteDate: e.gazetteDate ?? '',
      effectiveDate: e.effectiveDate ?? '',
      note: e.note ?? '',
    })),
  };
}

// ---------------------------------------------------------------------------
// Refs
// ---------------------------------------------------------------------------

interface ParsedRef {
  lawSlug?: string;
  articleNo: number;
  articleSuffix?: string;
  display: string;
}

function suffixDisplay(suffix?: string): string {
  if (!suffix) return '';
  return suffix.startsWith('/') ? suffix : ` ${suffix}`;
}

/** Parse `[[…]]` inner content; null → not a ref (keep as literal text). */
function parseRef(innerRaw: string): ParsedRef | null {
  const parts = normalizeText(innerRaw)
    .split('|')
    .map((p) => p.trim());
  if (parts.length < 1 || parts.length > 2) return null;
  const [refPart, lawPart] = parts;
  const m = REF_RE.exec(refPart);
  if (!m) return null;

  const articleNo = Number(normalizeThaiDigits(m[1]));
  const suffix = m[2] ?? m[3];
  const lawSlug = lawPart !== undefined ? lawPart : undefined;

  const display = lawSlug
    ? `มาตรา ${articleNo}${suffixDisplay(suffix)} แห่ง${lawSlug}`
    : `มาตรา ${articleNo}${suffixDisplay(suffix)}`;

  return { lawSlug, articleNo, articleSuffix: suffix, display };
}

/** Structural check: every `[[` in the paragraph must have a matching `]]`. */
function assertNoUnclosedRefs(text: string): void {
  let open = text.indexOf('[[');
  while (open !== -1) {
    const close = text.indexOf(']]', open + 2);
    if (close === -1) {
      throw new Error(
        `parser: unclosed "[[" ในวรรค: "...${text.slice(Math.max(0, open - 10), open + 20)}..."`,
      );
    }
    open = text.indexOf('[[', close + 2);
  }
}

/** Split a วรรค text into text/ref tokens. Empty segments are omitted. */
function tokenizeParagraph(text: string): ArticleToken[] {
  assertNoUnclosedRefs(text); // every call path — else slice(open+2, -1) drops the last char
  const tokens: ArticleToken[] = [];
  let pos = 0;
  while (pos < text.length) {
    const open = text.indexOf('[[', pos);
    if (open === -1) {
      const rest = text.slice(pos).trim();
      if (rest !== '') tokens.push({ kind: 'text', t: rest });
      break;
    }
    if (open > pos) {
      const seg = text.slice(pos, open).trim();
      if (seg !== '') tokens.push({ kind: 'text', t: seg });
    }
    const close = text.indexOf(']]', open + 2);
    const inner = text.slice(open + 2, close);
    const parsed = parseRef(inner);
    if (parsed) {
      tokens.push({ kind: 'ref', ref: parsed });
    } else {
      const literal = `[[${inner}]]`;
      tokens.push({ kind: 'text', t: literal });
    }
    pos = close + 2;
  }
  return tokens;
}

// ---------------------------------------------------------------------------
// Article body blocks
// ---------------------------------------------------------------------------

/**
 * Turn a finalized article's raw content lines into text tokens + metadata.
 * Blocks = blank-line-separated; each block is either an amendment marker
 * block, a repealed-paragraph block, or a soft-wrapped วรรค.
 *
 * วรรค contract (SCRUTINY-L1-1): consecutive วรรค emissions are joined by
 * '\n' TEXT tokens — BETWEEN blocks only, never leading/trailing. Metadata
 * blocks (amendment/repealed markers) contribute no text and do not break
 * the chain: a marker block between two วรรค still separates them in the
 * source, so they keep their '\n'.
 */
function buildArticle(no: number, suffix: string | undefined, content: string[]): Article {
  const article: Article = { no, ...(suffix ? { suffix } : {}), text: [] };

  const blocks: string[][] = [];
  let cur: string[] = [];
  for (const line of content) {
    if (line.trim() === '') {
      if (cur.length > 0) {
        blocks.push(cur);
        cur = [];
      }
    } else {
      cur.push(line);
    }
  }
  if (cur.length > 0) blocks.push(cur);

  /** วรรค texts in document order — emitted once, '\n'-separated, at the end. */
  const paragraphs: string[] = [];

  for (const block of blocks) {
    const first = block[0];

    // Repealed block: first line is the marker; the remaining lines are the
    // verbatim repealed text (whole block consumed — '>' stripped).
    const repealed = REPEALED_RE.exec(first);
    if (repealed) {
      const text = block
        .slice(1)
        .map((l) => normalizeText(l.replace(/^>\s?/, '')))
        .filter((l) => l !== '')
        .join('\n');
      (article.repealedParagraphs ??= []).push({
        paras: normalizeText(repealed[1]),
        repealedBy: normalizeText(repealed[2]),
        text,
      });
      continue;
    }

    // Amendment markers: scan EVERY '>' line of the block (multi-marker
    // blocks — e.g. `> แก้ไขเพิ่มเติมโดยฉบับที่ 2` + `> วรรคห้า เพิ่มโดย
    // ฉบับที่ 3` → TWO amendedBy entries). Lines that match no marker regex
    // stay verbatim ('>' included) — they become a วรรค that validate rule 10
    // flags as marker-grammar drift.
    let amendedCount = 0;
    const rest: string[] = [];
    for (const line of block) {
      const amended = AMENDED_BY_RE.exec(line);
      if (amended) {
        const editionNo = Number(normalizeThaiDigits(amended[2]));
        const note =
          amended[1] !== undefined
            ? normalizeText(`เพิ่มวรรค${amended[1]}`)
            : normalizeText(amended[3]);
        (article.amendedBy ??= []).push({ editionNo, note });
        amendedCount++;
      } else {
        rest.push(line);
      }
    }
    if (amendedCount > 0) {
      // marker-extra-line วรรค: remainder lines in the same block are a
      // วรรค (included in the '\n' chain like any other block)
      if (rest.length > 0) paragraphs.push(rest.map(normalizeText).join(' '));
      continue;
    }

    // ordinary วรรค: soft-wrapped lines join with a single space
    paragraphs.push(block.map(normalizeText).join(' '));
  }

  for (let i = 0; i < paragraphs.length; i++) {
    if (i > 0) article.text.push({ kind: 'text', t: '\n' });
    article.text.push(...tokenizeParagraph(paragraphs[i]));
  }

  return article;
}

// ---------------------------------------------------------------------------
// Main entry
// ---------------------------------------------------------------------------

export function parseLawMarkdown(md: string): LawDoc {
  const lines = md.split(/\r?\n/);

  // --- frontmatter delimiters ----------------------------------------------
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i >= lines.length || lines[i].trim() !== '---') {
    throw new Error('frontmatter: ไม่พบ --- เปิด');
  }
  let fmEnd = -1;
  for (let j = i + 1; j < lines.length; j++) {
    if (lines[j].trim() === '---') {
      fmEnd = j;
      break;
    }
  }
  if (fmEnd === -1) throw new Error('frontmatter: ไม่พบ --- ปิด');

  const fm = parseFrontmatter(lines.slice(i + 1, fmEnd));

  // --- body walk ------------------------------------------------------------
  const definitions: LawDoc['definitions'] = [];
  const chapters: LawDoc['chapters'] = [];

  let section: 'definitions' | 'chapter' = 'chapter';
  let curDef: { term: string; parts: string[] } | null = null;
  let curChapter: LawDoc['chapters'][number] | null = null;
  let curSection: NonNullable<LawDoc['chapters'][number]['sections']>[number] | null = null;
  let curArticle: Article | null = null;
  let curContent: string[] = [];

  const finalizeDefinition = (): void => {
    if (curDef) {
      definitions.push({ term: curDef.term, definition: curDef.parts.join(' ') });
      curDef = null;
    }
  };

  const finalizeArticle = (): void => {
    if (curArticle) {
      curArticle = buildArticle(curArticle.no, curArticle.suffix, curContent);
      if (curSection) curSection.articles.push(curArticle);
      else curChapter?.articles.push(curArticle);
      curArticle = null;
      curContent = [];
    }
  };

  /** Close the open section (its pending article is finalized first). */
  const finalizeSection = (): void => {
    if (curSection) {
      finalizeArticle();
      curSection = null;
    }
  };

  const startChapter = (no: number | null, title: string): void => {
    finalizeDefinition();
    finalizeArticle();
    finalizeSection(); // `##` headings also close the open section
    curChapter = { no, title, articles: [] };
    chapters.push(curChapter);
    section = 'chapter';
  };

  const startSection = (no: number | null, title: string): void => {
    if (!curChapter) startChapter(null, ''); // permissive: implicit chapter
    finalizeDefinition();
    finalizeArticle();
    const chapter = curChapter as LawDoc['chapters'][number]; // ensured non-null above
    curSection = { no, title, articles: [] };
    chapter.sections ??= [];
    chapter.sections.push(curSection);
    section = 'chapter';
  };

  const startArticle = (line: string): void => {
    const m = ARTICLE_HEADER_RE.exec(line);
    if (!m) {
      // header-like but not parseable → structural error
      throw new Error(`parser: มาตรา header ไม่ถูกต้อง: "${line.trim()}"`);
    }
    finalizeArticle();
    curArticle = { no: Number(normalizeThaiDigits(m[1])), text: [] };
    if (m[2] ?? m[3]) curArticle.suffix = (m[2] ?? m[3]) as string;
    if (!curChapter) startChapter(null, '');
    const rest = line.slice(m[0].length);
    curContent = rest.trim() !== '' ? [rest] : [];
  };

  for (let k = fmEnd + 1; k < lines.length; k++) {
    // Normalize Thai digits on the raw line BEFORE any pattern matching:
    // the frozen regexes use the class [0-9๑-๙] which excludes ๐ (U+0E50),
    // so มาตรา ๑๐ / หมวดที่ ๑๐ / ฉบับที่ ๑๐ would otherwise fail to match.
    const line = normalizeThaiDigits(lines[k]);

    if (ARTICLE_HEADER_RE.test(line) || /^\*\*มาตรา/.test(line.trim())) {
      // header (or malformed header) — trim start so leading blanks are safe
      if (curDef) finalizeDefinition();
      startArticle(line.trimStart());
      continue;
    }

    const chapter = CHAPTER_RE.exec(line.trimStart());
    if (chapter && line.trimStart().startsWith('##')) {
      startChapter(Number(normalizeThaiDigits(chapter[1])), normalizeText(chapter[2]));
      continue;
    }
    // `### ส่วนที่ …` BEFORE the generic `##`+ check so it nests in the
    // current chapter instead of becoming an un-numbered chapter
    const sectionHeading = SECTION_HEADING_RE.exec(line.trimStart());
    if (sectionHeading) {
      startSection(
        sectionHeading[1] ? Number(normalizeThaiDigits(sectionHeading[1])) : null,
        normalizeText(sectionHeading[2]),
      );
      continue;
    }
    if (DEFINITIONS_HEADING_RE.test(line.trimStart())) {
      finalizeArticle();
      finalizeSection();
      finalizeDefinition();
      curChapter = null;
      section = 'definitions';
      continue;
    }
    const generic = GENERIC_HEADING_RE.exec(line.trimStart());
    if (generic && line.trimStart().startsWith('##')) {
      startChapter(null, normalizeText(generic[1]));
      continue;
    }

    if (section === 'definitions') {
      const bullet = DEFINITION_BULLET_RE.exec(line.trimStart());
      if (bullet && line.trimStart().startsWith('-')) {
        finalizeDefinition();
        curDef = { term: normalizeText(bullet[1]), parts: [normalizeText(bullet[2])] };
      } else if (curDef && line.trim() !== '') {
        // continuation (soft-wrapped line OR blank-line paragraph) → single space join
        curDef.parts.push(normalizeText(line));
      }
      // preamble before the first `- **` is ignored; blank lines are no-ops
      continue;
    }

    // chapter section — push EVERY line (blank lines included): buildArticle
    // splits วรรค blocks on blank lines, so they must survive accumulation
    if (curArticle) {
      curContent.push(line);
    } else if (line.trim() !== '') {
      // stray content before the first มาตรา of a chapter — ignored
    }
  }

  finalizeDefinition();
  finalizeArticle();

  return {
    slug: fm.slug,
    code: fm.code,
    titleTh: fm.titleTh,
    subject: fm.subject,
    part: fm.part,
    tags: fm.tags,
    verifiedAt: fm.verifiedAt,
    gazetteRef: fm.gazetteRef,
    editions: fm.editions,
    definitions,
    chapters,
  };
}

// ---------------------------------------------------------------------------
// Digest — minimal parse (L5 study lane; contract pinned by the "DIGEST"
// block of tests/krulaw/parser.test.ts). Cut-line: H1 title + '## N. title'
// section headings + [[มาตรา N]] / [ดูเต็ม [[มาตรา N]]] ref extraction ONLY —
// no วรรค blocks, no amendedBy/repealed logic. Everything else stays plain
// text (section.body = verbatim lines, rendered as-is by the digest page).
// ---------------------------------------------------------------------------

export interface DigestRef {
  articleNo: number;
  articleSuffix?: string;
  /** present → cross-law ref; holds the authored law CODE verbatim (mirrors LawDoc refs) */
  lawSlug?: string;
}

/** One render-ready segment of a digest body line. */
export type DigestLineToken =
  | { kind: 'text'; t: string }
  | { kind: 'ref'; ref: DigestRef & { display: string } }
  | { kind: 'seefull'; ref: DigestRef & { display: string } };

export interface DigestSection {
  /** '## N. title' → content after '## ' (trimmed, e.g. '1. ข้อมูลกฎหมาย') */
  heading: string;
  /** Verbatim section content (heading line excluded), lines joined '\n'. */
  body: string;
  /** Every [[มาตรา N]] ref of the section — see-full refs included. */
  refs: DigestRef[];
  /** Any '[ดูเต็ม' marker in the section. */
  hasSeeFull: boolean;
}

export interface DigestDoc {
  /** `# …` H1 content (trimmed); '' when absent. */
  title: string;
  sections: DigestSection[];
}

const DIGEST_H1_RE = /^#\s+(.+)$/;
/** `## ` sections only — `###`/`####` stay in the section body (e.g. บทเฉพาะกาล). */
const DIGEST_SECTION_RE = /^##\s+(.+)$/;
const SEE_FULL_MARKER = '[ดูเต็ม';
/**
 * Digest article-line detector grammar ('**มาตรา N** : …' | '**มาตรา N : …**').
 * Number/suffix grammar mirrors ARTICLE_HEADER_RE (Thai digits pre-normalized
 * by the caller — same class convention as the frozen law regexes).
 */
const DIGEST_ARTICLE_HEADER_RE = new RegExp(
  `^\\*\\*มาตรา\\s*([0-9๑-๙]+)(?:\\s*(${ARTICLE_SUFFIXES})|(/\\d+))?(?:\\*\\*|\\s*:)`,
);

/**
 * Permissive per-line tokenizer for digest bodies — same ref semantics as the
 * law parser (parseRef): `[[มาตรา N]]` → ref token; `[ดูเต็ม [[มาตรา N]]]` →
 * seefull token (wrapper consumed); unclosed or non-ref `[[…]]` stays literal
 * text — NEVER throws (digest = minimal/permissive parse).
 */
export function tokenizeDigestLine(line: string): DigestLineToken[] {
  const tokens: DigestLineToken[] = [];
  let pos = 0;

  const pushText = (t: string): void => {
    if (t !== '') tokens.push({ kind: 'text', t });
  };

  while (pos < line.length) {
    const open = line.indexOf('[[', pos);
    if (open === -1) {
      pushText(line.slice(pos));
      break;
    }
    const close = line.indexOf(']]', open + 2);
    if (close === -1) {
      pushText(line.slice(pos)); // unclosed → literal
      break;
    }
    const parsed = parseRef(line.slice(open + 2, close));
    if (!parsed) {
      pushText(line.slice(pos, close + 2)); // closed but not a ref → literal
      pos = close + 2;
      continue;
    }

    const prefix = line.slice(pos, open);
    const after = line.slice(close + 2);
    // '[ดูเต็ม [[…]]]' — wrapper consumed; anything else stays literal text.
    const isSeeFull = prefix.trimEnd().endsWith(SEE_FULL_MARKER) && after.startsWith(']');
    const ref: DigestRef & { display: string } = {
      articleNo: parsed.articleNo,
      ...(parsed.articleSuffix !== undefined ? { articleSuffix: parsed.articleSuffix } : {}),
      ...(parsed.lawSlug !== undefined ? { lawSlug: parsed.lawSlug } : {}),
      display: parsed.display,
    };

    if (isSeeFull) {
      pushText(prefix.slice(0, prefix.lastIndexOf(SEE_FULL_MARKER)));
      tokens.push({ kind: 'seefull', ref });
      pos = close + 3; // consume the ']' closing '[ดูเต็ม …]'
    } else {
      pushText(prefix);
      tokens.push({ kind: 'ref', ref });
      pos = close + 2;
    }
  }
  return tokens;
}

export function parseDigestMd(md: string): DigestDoc {
  const sections: DigestSection[] = [];
  let title = '';
  let cur: {
    heading: string;
    bodyLines: string[];
    refs: DigestRef[];
    hasSeeFull: boolean;
  } | null = null;

  const pushSection = (): void => {
    if (cur === null) return;
    sections.push({
      heading: cur.heading,
      body: cur.bodyLines.join('\n'),
      refs: cur.refs,
      hasSeeFull: cur.hasSeeFull,
    });
    cur = null;
  };

  for (const raw of md.split(/\r?\n/)) {
    const line = raw.trimEnd();
    const sectionHeading = DIGEST_SECTION_RE.exec(line.trimStart());
    if (sectionHeading) {
      pushSection();
      cur = {
        heading: normalizeText(sectionHeading[1]),
        bodyLines: [],
        refs: [],
        hasSeeFull: false,
      };
      continue;
    }
    if (cur === null) {
      // preamble — before the first '## ' section: only the H1 is captured
      const h1 = DIGEST_H1_RE.exec(line.trimStart());
      if (h1 && title === '') title = normalizeText(h1[1]);
      continue;
    }
    cur.bodyLines.push(line);
    if (line.includes(SEE_FULL_MARKER)) cur.hasSeeFull = true;
    for (const tok of tokenizeDigestLine(line)) {
      if (tok.kind === 'text') continue;
      cur.refs.push({
        articleNo: tok.ref.articleNo,
        ...(tok.ref.articleSuffix !== undefined ? { articleSuffix: tok.ref.articleSuffix } : {}),
        ...(tok.ref.lawSlug !== undefined ? { lawSlug: tok.ref.lawSlug } : {}),
      });
    }
  }
  pushSection();

  return { title, sections };
}

/**
 * Digest article-line detector: '**มาตรา N** : …' or '**มาตรา N : …**' →
 * { no, suffix?, rest } (both bold shapes occur in digests). `rest` = content
 * after the header with a leading colon and a shape-2 trailing '**' stripped.
 */
export function matchDigestArticleHeader(
  line: string,
): { no: number; suffix?: string; rest: string } | null {
  const trimmed = line.trimStart();
  const m = DIGEST_ARTICLE_HEADER_RE.exec(normalizeThaiDigits(trimmed));
  if (!m) return null;
  const suffix = m[2] ?? m[3];
  return {
    no: Number(m[1]),
    ...(suffix !== undefined ? { suffix } : {}),
    rest: trimmed
      .slice(m[0].length)
      .replace(/^\s*:?\s*/, '')
      .replace(/\*\*$/, ''),
  };
}
