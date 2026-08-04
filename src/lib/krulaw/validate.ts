/**
 * KruLAW — LawDoc validation (rules 1–11) + zod schemas (zod v4).
 *
 * `validateLawDoc(doc, knownCodes?, opts?)` returns one error string per
 * violation; every message names the offending item. `[]` = valid.
 *
 * Rules:
 *  1. Same-law refs resolve exactly (no + suffix)
 *  2. Cross-law codes ∈ knownCodes (default [] → all cross-law refs flagged)
 *  3. Definitions: unique terms, NFC-normalized, min term length 4
 *     (SHORT_TERM_ALLOWLIST exempt)
 *  4. Editions numbered 1..n sequential
 *  5. amendedBy[].editionNo ∈ editions[]
 *  6. Articles ordered by (no, suffix) increasing — global across chapters
 *  7. verifiedAt (YYYY-MM-DD) + gazetteRef required
 *  8. No unparsed `[[` remnants in text tokens OR repealedParagraphs[].text
 *  9. Every ref token has a non-empty display
 * 10. No stray `>` body lines (marker-grammar drift): every '\n'-line of a
 *     text token that starts with '>' must match AMENDED_BY_RE/REPEALED_RE
 * 11. Definitions are VERBATIM substrings of the law's definitions-source
 *     article (opts.definitionsSourceArticleNo, default 4 — the statutory
 *     บทนิยาม); comparison is whitespace-insensitive (ALL whitespace
 *     stripped on both sides). Laws WITHOUT that article are skipped — there
 *     is no statutory text to verify against.
 *
 * `validatePlannedLaws` — planned-laws.json manifest integrity: codes and
 * slugs must each be unique (duplicate → error) and every slug must match
 * `/^[a-z0-9-]+$/i` (non-conforming → error).
 */

import { z } from 'zod';
import type { Article, LawDoc } from '../../types/krulaw';
import { normalizeNfc } from './normalize';
import { AMENDED_BY_RE, REPEALED_RE } from './parser';
import { SHORT_TERM_ALLOWLIST } from './terms';
// Re-export kept for the documented validate surface — but CLIENT code must
// import from './terms' (this module pulls in zod; terms.ts is zod-free).
export { SHORT_TERM_ALLOWLIST };

// ---------------------------------------------------------------------------
// Zod schemas (zod v4: strictObject + discriminatedUnion)
// ---------------------------------------------------------------------------

export const RefSchema = z.strictObject({
  lawSlug: z.string().optional(),
  articleNo: z.number(),
  articleSuffix: z.string().optional(),
  display: z.string(),
});

export const ArticleTokenSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('text'), t: z.string() }),
  z.strictObject({ kind: z.literal('ref'), ref: RefSchema }),
]);

export const EditionSchema = z.strictObject({
  no: z.number(),
  gazetteDate: z.string(),
  effectiveDate: z.string(),
  note: z.string(),
});

export const DefinitionSchema = z.strictObject({
  term: z.string(),
  definition: z.string(),
});

export const AmendedBySchema = z.strictObject({
  editionNo: z.number(),
  note: z.string(),
});

export const RepealedParagraphSchema = z.strictObject({
  paras: z.string(),
  repealedBy: z.string(),
  text: z.string(),
});

export const ArticleSchema = z.strictObject({
  no: z.number(),
  suffix: z.string().optional(),
  text: z.array(ArticleTokenSchema),
  amendedBy: z.array(AmendedBySchema).optional(),
  repealedParagraphs: z.array(RepealedParagraphSchema).optional(),
});

/** ส่วนที่ N nesting — same shape as the articles part of ChapterSchema. */
export const SectionSchema = z.strictObject({
  no: z.number().nullable(),
  title: z.string(),
  articles: z.array(ArticleSchema),
});

export const ChapterSchema = z.strictObject({
  no: z.number().nullable(),
  title: z.string(),
  articles: z.array(ArticleSchema),
  sections: z.array(SectionSchema).optional(),
});

export const LawDocSchema = z.strictObject({
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, 'slug ต้องเป็น a-z, 0-9, หรือ - เท่านั้น (ความปลอดภัยของ path)'),
  code: z.string(),
  titleTh: z.string(),
  subject: z.string(),
  part: z.enum(['ก', 'ข']),
  tags: z.array(z.string()),
  verifiedAt: z.string(),
  gazetteRef: z.string(),
  editions: z.array(EditionSchema),
  definitions: z.array(DefinitionSchema),
  chapters: z.array(ChapterSchema),
});

// ---------------------------------------------------------------------------
// validateLawDoc
// ---------------------------------------------------------------------------

const SUFFIX_RANK: Record<string, number> = {
  '': 0,
  ทวิ: 1,
  ตรี: 2,
  จัตวา: 3,
  เบญจ: 4,
  ฉ: 5,
  สัตต: 6,
  อัฏฐ: 7,
  นว: 8,
};

/** Sort key: Thai suffixes 1–8, then all `/N` suffixes (1000 + N). */
function articleKey(a: { no: number; suffix?: string }): [number, number] {
  const s = a.suffix ?? '';
  if (s.startsWith('/')) return [a.no, 1000 + Number(s.slice(1))];
  return [a.no, SUFFIX_RANK[s] ?? 0];
}

function articleLabel(no: number, suffix?: string): string {
  return `มาตรา ${no}${suffix ? (suffix.startsWith('/') ? suffix : ` ${suffix}`) : ''}`;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Rule 11 options (all optional — defaults keep the contract stable). */
export interface ValidateLawDocOpts {
  /**
   * Article no whose statutory text is the verbatim source of the
   * definitions (default 4 — the บทนิยาม of a Thai act). An amended
   * บทนิยาม is fine: the law file's article text IS the current text.
   */
  definitionsSourceArticleNo?: number;
}

/**
 * Rule 11 compare key: NFC + ALL whitespace stripped (spaces, tabs, '\n').
 * Verbatim statutory content may differ only in whitespace (space runs vs
 * วรรค line breaks), so equal keys ⇔ verbatim-identical content. NFC keeps
 * the compare stable against composed/decomposed spelling on either side.
 */
function verbatimKey(s: string): string {
  return normalizeNfc(s).replace(/\s+/g, '');
}

export function validateLawDoc(
  doc: LawDoc,
  knownCodes: string[] = [],
  opts: ValidateLawDocOpts = {},
): string[] {
  const errors: string[] = [];
  const who = doc.slug;

  // --- schema (structural) ---------------------------------------------------
  const parsed = LawDocSchema.safeParse(doc);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      errors.push(`schema: ${issue.path.join('.') || '(root)'}: ${issue.message}`);
    }
  }

  // Chapter articles AND section articles — rules 1/2/5/6/8/9 all resolve
  // against every article of the law; ordering is global across sections.
  const articles: Article[] = doc.chapters.flatMap((c) => [
    ...c.articles,
    ...(c.sections?.flatMap((s) => s.articles) ?? []),
  ]);

  // --- rule 1: same-law refs resolve exactly (no + suffix) -------------------
  for (const a of articles) {
    for (const tok of a.text) {
      if (tok.kind !== 'ref' || tok.ref.lawSlug) continue;
      const r = tok.ref;
      const found = articles.some(
        (x) => x.no === r.articleNo && (x.suffix ?? undefined) === r.articleSuffix,
      );
      if (!found) {
        errors.push(
          `${articleLabel(r.articleNo, r.articleSuffix)}: อ้างอิงมาตราไม่พบใน ${who} (ใน ${articleLabel(a.no, a.suffix)})`,
        );
      }
    }
  }

  // --- rule 2: cross-law codes ∈ knownCodes ----------------------------------
  for (const a of articles) {
    for (const tok of a.text) {
      if (tok.kind !== 'ref' || !tok.ref.lawSlug) continue;
      if (!knownCodes.includes(tok.ref.lawSlug)) {
        errors.push(`กฎหมายอ้างอิง "${tok.ref.lawSlug}" ไม่มีใน planned-laws (${who})`);
      }
    }
  }

  // --- rule 3: definitions unique + NFC + min term length 4 ------------------
  const seenTerms = new Set<string>();
  for (const d of doc.definitions) {
    if (seenTerms.has(d.term)) {
      errors.push(`นิยามซ้ำ: "${d.term}" (${who})`);
    }
    seenTerms.add(d.term);
    if (d.term.length < 4 && !SHORT_TERM_ALLOWLIST.some((t) => t === d.term)) {
      errors.push(`นิยามสั้นเกินไป (${d.term.length} ตัวอักษร < 4): "${d.term}" (${who})`);
    }
    if (d.term !== normalizeNfc(d.term)) {
      errors.push(`นิยามไม่ใช่ NFC: "${d.term}" (${who})`);
    }
  }

  // --- rule 4: editions numbered 1..n sequential -----------------------------
  doc.editions.forEach((e, i) => {
    const expected = i + 1;
    if (e.no !== expected) {
      errors.push(
        `ฉบับที่ ${e.no}: หมายเลขฉบับต้องเรียงจาก 1 ตามลำดับ (คาดหวังฉบับที่ ${expected}) (${who})`,
      );
    }
  });

  // --- rule 5: amendedBy[].editionNo ∈ editions[] ----------------------------
  const editionNos = new Set((doc.editions ?? []).map((e) => e.no));
  for (const a of articles) {
    for (const am of a.amendedBy ?? []) {
      if (!editionNos.has(am.editionNo)) {
        errors.push(
          `${articleLabel(a.no, a.suffix)}: แก้ไขเพิ่มเติมโดยฉบับที่ ${am.editionNo} ไม่มีในรายการฉบับ (${who})`,
        );
      }
    }
  }

  // --- rule 6: articles ordered (no, suffix) increasing (global) -------------
  for (let i = 1; i < articles.length; i++) {
    const prev = articleKey(articles[i - 1]);
    const cur = articleKey(articles[i]);
    if (cur[0] < prev[0] || (cur[0] === prev[0] && cur[1] <= prev[1])) {
      errors.push(
        `${articleLabel(articles[i].no, articles[i].suffix)}: ลำดับมาตราไม่เพิ่มขึ้น (อยู่หลัง ${articleLabel(articles[i - 1].no, articles[i - 1].suffix)}) (${who})`,
      );
    }
  }

  // --- rule 7: verifiedAt (YYYY-MM-DD) + gazetteRef required -----------------
  if (!doc.verifiedAt || !DATE_RE.test(doc.verifiedAt)) {
    errors.push(`verifiedAt ต้องเป็นวันที่ YYYY-MM-DD (ได้ "${doc.verifiedAt ?? ''}") (${who})`);
  }
  if (!doc.gazetteRef) {
    errors.push(`gazetteRef ต้องไม่ว่าง (${who})`);
  }

  // --- rule 8: no unparsed [[ remnants in text tokens ------------------------
  for (const a of articles) {
    for (const tok of a.text) {
      if (tok.kind === 'text' && (tok.t.includes('[[') || tok.t.includes(']]'))) {
        errors.push(`ข้อความมี "[[": "...${tok.t.slice(0, 40)}..." (${who})`);
      }
    }
    // SCRUTINY-L1 extension: repealed verbatim text is body text too — an
    // unparsed [[ there would silently render as a literal bracket.
    for (const rp of a.repealedParagraphs ?? []) {
      if (rp.text.includes('[[') || rp.text.includes(']]')) {
        errors.push(`ข้อความที่ถูกยกเลิกมี "[[": "...${rp.text.slice(0, 40)}..." (${who})`);
      }
    }
  }

  // --- rule 9: every ref token has a non-empty display -----------------------
  for (const a of articles) {
    for (const tok of a.text) {
      if (tok.kind === 'ref' && tok.ref.display.trim() === '') {
        errors.push(
          `อ้างอิงมี display ว่างเปล่า (articleNo ${tok.ref.articleNo} ใน ${articleLabel(a.no, a.suffix)}) (${who})`,
        );
      }
    }
  }

  // --- rule 10: no stray '>' body lines (marker-grammar drift) ---------------
  // The parser preserves '>' lines that match NEITHER marker regex verbatim
  // in วรรค text tokens (and joins soft-wrapped วรรค lines with a space), so
  // a '>' at the start of any '\n'-line of a text token is drift unless it
  // matches one of the marker forms. Repealed-block verbatim lines never
  // reach text tokens (they live in repealedParagraphs[].text, '>' stripped).
  for (const a of articles) {
    for (const tok of a.text) {
      if (tok.kind !== 'text') continue;
      for (const line of tok.t.split('\n')) {
        const t = line.trimStart();
        if (!t.startsWith('>')) continue;
        if (AMENDED_BY_RE.test(t) || REPEALED_RE.test(t)) continue;
        errors.push(
          `บรรทัด ">" ที่ไม่ใช่เครื่องหมายแก้ไข/ยกเลิก: "...${t.slice(0, 40)}..." (${who})`,
        );
      }
    }
  }

  // --- rule 11: definitions ⊆ definitions-source article (verbatim) --------
  // Definitions are sourced VERBATIM from the statutory บทนิยาม (default
  // มาตรา 4) — post-edit drift must be machine-detectable. Both sides are
  // NFC'd with ALL whitespace stripped: verbatim content can differ only in
  // whitespace (space runs / วรรค line breaks). An amended บทนิยาม is fine —
  // the law file's article text IS the current text. A law WITHOUT the
  // source article is SKIPPED (documented): there is no statutory text to
  // verify against (e.g. the eval fixture — definitions but no มาตรา 4).
  const sourceNo = opts.definitionsSourceArticleNo ?? 4;
  const sourceArticle = articles.find((a) => a.no === sourceNo);
  if (sourceArticle !== undefined) {
    const sourceKey = verbatimKey(
      sourceArticle.text.map((tok) => (tok.kind === 'text' ? tok.t : '')).join(''),
    );
    for (const d of doc.definitions) {
      if (!sourceKey.includes(verbatimKey(d.definition))) {
        errors.push(
          `นิยาม "${d.term}": ข้อความไม่ตรงตาม ${articleLabel(sourceNo)} แบบคำต่อคำ (${who})`,
        );
      }
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// planned-laws.json manifest integrity (SCRUTINY-L2)
// ---------------------------------------------------------------------------

/** planned-laws.json entry shape (shared with scripts/krulaw/build.ts). */
export interface PlannedLawEntry {
  code: string;
  slug: string;
  built: boolean;
}

/**
 * Codes and slugs must each be unique — a duplicate would silently alias two
 * different laws in codeToSlug (last-wins) or produce two registry files
 * under one slug. Slugs must also match /^[a-z0-9-]+$/i — non-conforming
 * slugs would surface in /krulaw/ paths and hrefs (the digest page emits
 * hrefs from this manifest). Called by build.ts pass 1 in BOTH modes; a
 * violation blocks the whole build (no partial emission).
 */
export function validatePlannedLaws(planned: PlannedLawEntry[]): string[] {
  const errors: string[] = [];
  const codeOwner = new Map<string, number>();
  const slugOwner = new Map<string, number>();
  planned.forEach((p, i) => {
    if (p.code.trim() === '' || p.slug.trim() === '') {
      errors.push(`planned-laws[${i}]: code และ slug ต้องไม่ว่าง`);
    }
    if (!/^[a-z0-9-]+$/i.test(p.slug)) {
      errors.push(
        `planned-laws[${i}]: slug "${p.slug}" ต้องเป็น a-z, 0-9, หรือ - เท่านั้น (ความปลอดภัยของ path)`,
      );
    }
    const co = codeOwner.get(p.code);
    if (co !== undefined) {
      errors.push(`planned-laws: code ซ้ำ "${p.code}" (entry ${co} และ ${i})`);
    } else {
      codeOwner.set(p.code, i);
    }
    const so = slugOwner.get(p.slug);
    if (so !== undefined) {
      errors.push(`planned-laws: slug ซ้ำ "${p.slug}" (entry ${so} และ ${i})`);
    } else {
      slugOwner.set(p.slug, i);
    }
  });
  return errors;
}
