// ===========================================================================
// LawLib L1 — validation contract (cases 7/10/11 of the 11-case checklist).
// validateLawDoc returns one error string per violation ([] = valid); every
// message names the offending item (rules 1–11 per src/lib/lawlib/validate.ts
// header; rule 11 = definitions ⊆ the definitions-source article, pinned at
// the bottom of the first describe group). Cross-law codes are checked
// against planned-laws.json — the integration is pinned at the bottom
// (deterministic JSON import: no network, no DB).
// ===========================================================================

import { describe, it, expect } from 'vitest';
import { validateLawDoc, LawDocSchema, ArticleTokenSchema } from '@/lib/lawlib/validate';
import { LAW_CODE_ALIASES } from '@/lib/lawlib/terms';
import type { LawDoc, Article } from '@/types/lawlib';

// ---------------------------------------------------------------------------
// Fixture builders (inline only — no fixture files)
// ---------------------------------------------------------------------------

const art = (no: number, suffix?: string, extra: Partial<Article> = {}): Article => ({
  no,
  ...(suffix ? { suffix } : {}),
  text: [{ kind: 'text', t: `บทความ ${no}${suffix ?? ''}` }],
  ...extra,
});

const chapter = (articles: Article[]): LawDoc['chapters'][number] => ({
  no: null,
  title: 'บททั่วไป',
  articles,
});

const CROSS_REF_ARTICLE: Article = {
  no: 3,
  text: [
    {
      kind: 'ref',
      ref: {
        lawSlug: 'พ.ร.บ.ข้าราชการครูฯ 2547',
        articleNo: 5,
        display: 'มาตรา 5 แห่งพ.ร.บ.ข้าราชการครูฯ 2547',
      },
    },
  ],
};

const BASE_DOC: LawDoc = {
  slug: 'pra-kr-tum-pra',
  code: 'พ.ร.บ.ระเบียบข้าราชการพลเรือน 2551',
  titleTh: 'พระราชบัญญัติระเบียบข้าราชการพลเรือน พ.ศ. 2551',
  subject: 'ระเบียบข้าราชการพลเรือน',
  part: 'ก',
  tags: ['ข้าราชการ', 'พลเรือน'],
  verifiedAt: '2026-01-15',
  gazetteRef: 'ราชกิจจานุเบกษา เล่ม 125 ตอนที่ 27 ก',
  editions: [
    { no: 1, gazetteDate: '2551-02-06', effectiveDate: '2551-02-06', note: 'ฉบับแรก' },
    { no: 2, gazetteDate: '2553-03-15', effectiveDate: '2553-06-15', note: 'แก้ไขเพิ่มเติม' },
  ],
  definitions: [
    { term: 'ข้าราชการพลเรือน', definition: 'บุคคลซึ่งได้รับการบรรจุและแต่งตั้ง' },
    { term: 'ตำแหน่ง', definition: 'หน้าที่ความรับผิดชอบ' },
  ],
  chapters: [
    chapter([
      art(1),
      {
        no: 2,
        text: [
          { kind: 'text', t: 'ตาม ' },
          { kind: 'ref', ref: { articleNo: 1, display: 'มาตรา 1' } },
        ],
      },
    ]),
    chapter([
      art(10),
      art(10, 'ทวิ'),
      art(10, '/1'),
      art(11, undefined, {
        text: [{ kind: 'text', t: 'วรรคแรก' }],
        repealedParagraphs: [
          { paras: 'วรรคสอง–สี่', repealedBy: 'พ.ร.บ.ฉบับที่ 2', text: 'ข้อความที่ถูกยกเลิก' },
        ],
      }),
    ]),
  ],
};

const makeDoc = (overrides: Partial<LawDoc> = {}): LawDoc => ({
  ...structuredClone(BASE_DOC),
  ...overrides,
});

const omitKey = (key: keyof LawDoc): LawDoc => {
  const d = structuredClone(BASE_DOC) as Record<string, unknown>;
  delete d[key];
  return d as unknown as LawDoc;
};

// ---------------------------------------------------------------------------
// validateLawDoc — rules 1–9
// ---------------------------------------------------------------------------

describe('validateLawDoc', () => {
  it('returns [] for a valid doc (knownCodes defaults to [])', () => {
    expect(validateLawDoc(makeDoc())).toEqual([]);
  });

  it('accepts cross-law refs whose code is in knownCodes (not resolved locally)', () => {
    const doc = makeDoc({
      chapters: [chapter([art(1), art(2), CROSS_REF_ARTICLE]), BASE_DOC.chapters[1]],
    });
    expect(validateLawDoc(doc, ['พ.ร.บ.ข้าราชการครูฯ 2547'])).toEqual([]);
  });

  it('flags same-law refs that resolve to no article', () => {
    const doc = makeDoc({
      chapters: [
        chapter([
          art(1),
          {
            no: 2,
            text: [
              { kind: 'text', t: 'x' },
              { kind: 'ref', ref: { articleNo: 99, display: 'มาตรา 99' } },
            ],
          },
        ]),
        BASE_DOC.chapters[1],
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('99');
  });

  it('flags same-law refs whose suffix does not exist', () => {
    const doc = makeDoc({
      chapters: [
        chapter([
          art(10),
          art(10, 'ทวิ'),
          {
            no: 11,
            text: [
              {
                kind: 'ref',
                ref: { articleNo: 10, articleSuffix: 'ตรี', display: 'มาตรา 10 ตรี' },
              },
            ],
          },
        ]),
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('ตรี');
  });

  it('flags cross-law refs with codes not in knownCodes', () => {
    const doc = makeDoc({
      chapters: [
        chapter([
          {
            no: 1,
            text: [
              {
                kind: 'ref',
                ref: {
                  lawSlug: 'พ.ร.บ.อื่น 2543',
                  articleNo: 5,
                  display: 'มาตรา 5 แห่งพ.ร.บ.อื่น 2543',
                },
              },
            ],
          },
        ]),
      ],
    });
    const errors = validateLawDoc(doc, ['พ.ร.บ.ข้าราชการครูฯ 2547']);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('พ.ร.บ.อื่น 2543');
  });

  it('flags cross-law refs when knownCodes is empty (default)', () => {
    const doc = makeDoc({ chapters: [chapter([CROSS_REF_ARTICLE])] });
    expect(validateLawDoc(doc)).not.toEqual([]);
  });

  it('flags duplicate definition terms', () => {
    const doc = makeDoc({
      definitions: [
        { term: 'ตำแหน่ง', definition: 'หนึ่ง' },
        { term: 'ตำแหน่ง', definition: 'สอง' },
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('ตำแหน่ง');
  });

  it('flags definition terms shorter than 4 characters', () => {
    const doc = makeDoc({ definitions: [{ term: 'กข', definition: 'สั้นเกินไป' }] });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('กข');
  });

  it('accepts definition terms of exactly 4 characters (boundary)', () => {
    const doc = makeDoc({ definitions: [{ term: 'กขคง', definition: 'พอดี' }] });
    expect(validateLawDoc(doc)).toEqual([]);
  });

  it('flags non-NFC definition terms', () => {
    const doc = makeDoc({
      definitions: [{ term: 'ข\u0E4D\u0E32ราชการ', definition: 'ไม่ใช่ NFC' }],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.some((e) => e.includes('ข') && e.includes('ราชการ'))).toBe(true);
  });

  it('flags edition numbering gaps (1, 3)', () => {
    const doc = makeDoc({
      editions: [
        { no: 1, gazetteDate: '2551-02-06', effectiveDate: '2551-02-06', note: 'หนึ่ง' },
        { no: 3, gazetteDate: '2553-03-15', effectiveDate: '2553-06-15', note: 'สาม' },
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toMatch(/[23]/);
  });

  it('flags duplicate edition numbers', () => {
    const doc = makeDoc({
      editions: [
        { no: 1, gazetteDate: '2551-02-06', effectiveDate: '2551-02-06', note: 'หนึ่ง' },
        { no: 1, gazetteDate: '2553-03-15', effectiveDate: '2553-06-15', note: 'หนึ่งซ้ำ' },
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('1');
  });

  it('flags a law with zero editions (rule 4 must not no-op on an empty list)', () => {
    const doc = makeDoc({ editions: [] });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('editions');
  });

  it('flags an implicit empty-title chapter (articles before the first ## — rule 12)', () => {
    const doc = makeDoc({
      chapters: [
        // what the parser produces for a มาตรา authored before any `##` heading
        { no: null, title: '', articles: [art(1), art(2)] },
        chapter([art(10)]),
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('บทโดยนัย');
  });

  it('accepts an un-numbered chapter WITH a title (บททั่วไป — rule 12 boundary)', () => {
    const doc = makeDoc({ chapters: [chapter([art(1), art(2)]), BASE_DOC.chapters[1]] });
    expect(validateLawDoc(doc)).toEqual([]);
  });

  it('flags amendedBy editionNo not present in editions', () => {
    const doc = makeDoc({
      chapters: [
        chapter([art(1, undefined, { amendedBy: [{ editionNo: 5, note: 'ฉบับที่ 5' }] })]),
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('5');
  });

  it('flags articles out of order (10/1 before 10)', () => {
    const doc = makeDoc({ chapters: [chapter([art(10, '/1'), art(10), art(11)])] });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('10/1');
  });

  it('flags articles out of order (11 before 10 ทวิ)', () => {
    const doc = makeDoc({ chapters: [chapter([art(10), art(11), art(10, 'ทวิ')])] });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toMatch(/ทวิ|11/);
  });

  it('flags duplicate (no, suffix) article pairs', () => {
    const doc = makeDoc({ chapters: [chapter([art(10), art(10), art(11)])] });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('10');
  });

  it('flags missing verifiedAt', () => {
    const errors = validateLawDoc(omitKey('verifiedAt'));
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('verifiedAt');
  });

  it('flags missing gazetteRef', () => {
    const errors = validateLawDoc(omitKey('gazetteRef'));
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('gazetteRef');
  });

  it('flags unparsed [[ remnants in text tokens', () => {
    const doc = makeDoc({
      chapters: [chapter([{ no: 1, text: [{ kind: 'text', t: 'ยังมี [[มาตรา 1' }] }])],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('[[');
  });

  it('flags ref tokens with an empty display', () => {
    const doc = makeDoc({
      chapters: [
        chapter([{ no: 1, text: [{ kind: 'ref', ref: { articleNo: 10, display: '' } }] }]),
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toMatch(/display|มาตรา/);
  });

  // --- SCRUTINY-L2: rule 10 + rule-8 extension (see lawlib-scrutiny-log.md
  // L1-2 / tdd-spec §4). EXPECTED-RED until the fix lane lands them. ---------

  it('flags a stray blockquote line as a body remnant (rule 10 — error mentions ">")', () => {
    const doc = makeDoc({
      chapters: [chapter([{ no: 1, text: [{ kind: 'text', t: '> บางอย่าง' }] }])],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('>');
  });

  it('flags [[ remnants inside repealedParagraphs text (rule 8 extension)', () => {
    const doc = makeDoc({
      chapters: [
        chapter([
          art(1, undefined, {
            text: [{ kind: 'text', t: 'วรรคแรก' }],
            repealedParagraphs: [
              { paras: 'วรรคสอง', repealedBy: 'พ.ร.บ.ฉบับที่ 2', text: 'ยังมี [[มาตรา 2' },
            ],
          }),
        ]),
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('[[');
  });
});

// ---------------------------------------------------------------------------
// Rule 11 (L5-3): definitions ⊆ the statutory definitions-source article
// (opts.definitionsSourceArticleNo, default มาตรา 4 — บทนิยาม). Comparison is
// NFC + ALL-whitespace-stripped substring: verbatim statutory content can
// differ only in whitespace (space runs vs วรรค line breaks), so equal keys
// ⇔ verbatim-identical content. A law WITHOUT the source article is SKIPPED
// (documented in validate.ts) — there is no statutory text to verify against.
// ---------------------------------------------------------------------------

const sourceArt4 = (t: string): Article => art(4, undefined, { text: [{ kind: 'text', t }] });

describe('validateLawDoc — rule 11 (definitions ⊆ มาตรา 4)', () => {
  it('accepts definitions that are verbatim substrings of มาตรา 4', () => {
    const doc = makeDoc({
      chapters: [
        chapter([
          art(1),
          sourceArt4(
            'ในพระราชบัญญัตินี้ "ข้าราชการพลเรือน" หมายความว่า บุคคลซึ่งได้รับการบรรจุและแต่งตั้ง และ "ตำแหน่ง" หมายความว่า หน้าที่ความรับผิดชอบ',
          ),
        ]),
        BASE_DOC.chapters[1],
      ],
    });
    expect(validateLawDoc(doc)).toEqual([]);
  });

  it('flags a paraphrased definition (error names the term)', () => {
    const doc = makeDoc({
      definitions: [
        { term: 'ข้าราชการพลเรือน', definition: 'บุคคลซึ่งได้รับการบรรจุและแต่งตั้ง' },
        { term: 'ตำแหน่ง', definition: 'หน้าที่และความรับผิดชอบในงาน' },
      ],
      chapters: [
        chapter([
          art(1),
          sourceArt4(
            'ในพระราชบัญญัตินี้ "ข้าราชการพลเรือน" หมายความว่า บุคคลซึ่งได้รับการบรรจุและแต่งตั้ง และ "ตำแหน่ง" หมายความว่า หน้าที่ความรับผิดชอบ',
          ),
        ]),
        BASE_DOC.chapters[1],
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('ตำแหน่ง');
  });

  it('is whitespace-insensitive (extra spaces / newlines on either side)', () => {
    const doc = makeDoc({
      definitions: [
        { term: 'ข้าราชการพลเรือน', definition: 'บุคคลซึ่งได้รับการบรรจุ  และแต่งตั้ง' },
        { term: 'ตำแหน่ง', definition: 'หน้าที่ความรับผิดชอบ' },
      ],
      chapters: [
        chapter([
          art(1),
          sourceArt4(
            'ในพระราชบัญญัตินี้ "ข้าราชการพลเรือน" หมายความว่า\nบุคคลซึ่งได้รับการบรรจุและแต่งตั้ง\nและ "ตำแหน่ง" หมายความว่า\nหน้าที่ความรับผิดชอบ',
          ),
        ]),
        BASE_DOC.chapters[1],
      ],
    });
    expect(validateLawDoc(doc)).toEqual([]);
  });

  it('opts.definitionsSourceArticleNo overrides the default มาตรา 4 source', () => {
    const doc = makeDoc({
      definitions: [{ term: 'ตำแหน่ง', definition: 'หน้าที่ความรับผิดชอบ' }],
      chapters: [
        chapter([
          art(1),
          sourceArt4('"ข้าราชการพลเรือน" หมายความว่า บุคคลซึ่งได้รับการบรรจุและแต่งตั้ง'),
          {
            no: 5,
            text: [{ kind: 'text', t: '"ตำแหน่ง" หมายความว่า หน้าที่ความรับผิดชอบ' }],
          },
        ]),
        BASE_DOC.chapters[1],
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('ตำแหน่ง');
    expect(validateLawDoc(doc, [], { definitionsSourceArticleNo: 5 })).toEqual([]);
  });

  it('skips rule 11 when the law has no มาตรา 4 (no statutory source to verify)', () => {
    // BASE_DOC has no article 4 — the definitions are never compared against
    // a missing source; the doc must still validate clean (documented skip).
    const doc = makeDoc({
      definitions: [{ term: 'ข้าราชการพลเรือน', definition: 'ข้อความที่ไม่ใช่คำนิยามตามกฎหมาย' }],
    });
    expect(validateLawDoc(doc)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GATE-1 follow-up: ordering across section boundaries + SHORT_TERM_ALLOWLIST
//
// `Chapter.sections` is a GATE-1 follow-up extension (types/lawlib.ts FROZEN).
// These tests are EXPECTED-RED until the extension lands — they pin that
// validate's rule 6 sequence INCLUDES section articles (in document order)
// and that the zod ChapterSchema accepts an optional `sections` key.
// ---------------------------------------------------------------------------

interface SectionLike {
  no: number | null;
  title: string;
  articles: Article[];
}

const sectionedChapter = (sections: SectionLike[]): LawDoc['chapters'][number] =>
  ({ no: 5, title: 'หมวดที่ 5', articles: [], sections }) as LawDoc['chapters'][number];

describe('validateLawDoc — ordering across section boundaries (GATE-1 follow-up)', () => {
  it('flags articles out of order ACROSS sections (ส่วนที่ 1 ends มาตรา 33, ส่วนที่ 2 starts มาตรา 32)', () => {
    const doc = makeDoc({
      chapters: [
        sectionedChapter([
          { no: 1, title: 'ส่วนที่ 1', articles: [art(33)] },
          { no: 2, title: 'ส่วนที่ 2', articles: [art(32)] },
        ]),
      ],
    });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('32');
  });

  it('accepts articles in increasing order across section boundaries', () => {
    const doc = makeDoc({
      chapters: [
        sectionedChapter([
          { no: 1, title: 'ส่วนที่ 1', articles: [art(33)] },
          { no: 2, title: 'ส่วนที่ 2', articles: [art(34)] },
        ]),
      ],
    });
    expect(validateLawDoc(doc)).toEqual([]);
  });
});

describe('validateLawDoc — SHORT_TERM_ALLOWLIST (GATE-1 follow-up)', () => {
  it('accepts the allowlisted statutory 3-char term ครู', () => {
    const doc = makeDoc({
      definitions: [{ term: 'ครู', definition: 'ผู้ประกอบวิชาชีพทางการศึกษา' }],
    });
    expect(validateLawDoc(doc)).toEqual([]);
  });

  it('flags a 3-char term NOT on the allowlist (error mentions the term)', () => {
    const doc = makeDoc({ definitions: [{ term: 'หมอ', definition: 'ผู้รักษาโรค' }] });
    const errors = validateLawDoc(doc);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('หมอ');
  });

  it('accepts a 4-char term (min-length boundary, allowlist irrelevant)', () => {
    const doc = makeDoc({ definitions: [{ term: 'ครูบา', definition: 'อาจารย์ใหญ่' }] });
    expect(validateLawDoc(doc)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// LawDocSchema (zod v4)
// ---------------------------------------------------------------------------

describe('LawDocSchema', () => {
  it('accepts a valid LawDoc', () => {
    expect(LawDocSchema.safeParse(BASE_DOC).success).toBe(true);
  });

  it('rejects a doc missing a required key', () => {
    const result = LawDocSchema.safeParse(omitKey('slug'));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
    }
  });

  it('rejects unknown keys (strictObject)', () => {
    expect(LawDocSchema.safeParse({ ...BASE_DOC, bogus: 1 }).success).toBe(false);
  });

  it('rejects an invalid part value', () => {
    expect(LawDocSchema.safeParse({ ...BASE_DOC, part: 'ค' }).success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// ArticleTokenSchema (zod v4 discriminated union)
// ---------------------------------------------------------------------------

describe('ArticleTokenSchema', () => {
  it('accepts a text token', () => {
    expect(ArticleTokenSchema.safeParse({ kind: 'text', t: 'ข้อความ' }).success).toBe(true);
  });

  it('accepts a ref token (with and without suffix)', () => {
    expect(
      ArticleTokenSchema.safeParse({ kind: 'ref', ref: { articleNo: 10, display: 'มาตรา 10' } })
        .success,
    ).toBe(true);
    expect(
      ArticleTokenSchema.safeParse({
        kind: 'ref',
        ref: { articleNo: 10, articleSuffix: 'ทวิ', display: 'มาตรา 10 ทวิ' },
      }).success,
    ).toBe(true);
  });

  it('rejects a token without kind', () => {
    expect(ArticleTokenSchema.safeParse({ t: 'ข้อความ' }).success).toBe(false);
  });

  it('rejects an unknown kind (discriminated union)', () => {
    expect(ArticleTokenSchema.safeParse({ kind: 'note', t: 'x' }).success).toBe(false);
  });

  it('rejects unknown keys on a text token (strictObject)', () => {
    expect(ArticleTokenSchema.safeParse({ kind: 'text', t: 'x', extra: 1 }).success).toBe(false);
  });

  it('rejects a ref token missing display', () => {
    expect(ArticleTokenSchema.safeParse({ kind: 'ref', ref: { articleNo: 10 } }).success).toBe(
      false,
    );
  });

  it('rejects a ref token with a non-numeric articleNo', () => {
    expect(
      ArticleTokenSchema.safeParse({ kind: 'ref', ref: { articleNo: '10', display: 'มาตรา 10' } })
        .success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Case 10 (integration): cross-law refs vs the REAL planned-laws.json manifest
// (content/lawlib/planned-laws.json — deterministic JSON import, no network).
// build.ts wires knownCodes = planned codes + LAW_CODE_ALIASES keys (shared
// from src/lib/lawlib/terms.ts, the zod-free home — the validate CLI uses the
// SAME map, so both CLIs agree) — these pins document that contract.
// ---------------------------------------------------------------------------

import plannedLaws from '../../content/lawlib/planned-laws.json';

describe('validateLawDoc — planned-laws.json integration (case 10)', () => {
  const PLANNED_CODES: string[] = plannedLaws.map((p) => p.code);
  const ALIAS_KEYS: string[] = Object.keys(LAW_CODE_ALIASES);

  it('accepts a cross-law ref whose code is in the real planned-laws.json', () => {
    const doc = makeDoc({
      chapters: [
        chapter([
          {
            no: 3,
            text: [
              {
                kind: 'ref',
                ref: {
                  lawSlug: 'พ.ร.บ.ระเบียบข้าราชการครูและบุคลากรทางการศึกษา 2547',
                  articleNo: 5,
                  display: 'มาตรา 5 แห่งพ.ร.บ.ระเบียบข้าราชการครูและบุคลากรทางการศึกษา 2547',
                },
              },
            ],
          },
        ]),
      ],
    });
    expect(validateLawDoc(doc, PLANNED_CODES)).toEqual([]);
  });

  it('accepts the authored alias form (LAW_CODE_ALIASES in terms.ts)', () => {
    const doc = makeDoc({ chapters: [chapter([CROSS_REF_ARTICLE])] });
    expect(validateLawDoc(doc, [...PLANNED_CODES, ...ALIAS_KEYS])).toEqual([]);
  });

  it('rejects a code absent from both planned-laws.json and the alias map', () => {
    const doc = makeDoc({
      chapters: [
        chapter([
          {
            no: 3,
            text: [
              {
                kind: 'ref',
                ref: {
                  lawSlug: 'พ.ร.บ.ไม่มีอยู่จริง 2599',
                  articleNo: 1,
                  display: 'มาตรา 1 แห่งพ.ร.บ.ไม่มีอยู่จริง 2599',
                },
              },
            ],
          },
        ]),
      ],
    });
    const errors = validateLawDoc(doc, [...PLANNED_CODES, ...ALIAS_KEYS]);
    expect(errors).not.toEqual([]);
    expect(errors.join('\n')).toContain('พ.ร.บ.ไม่มีอยู่จริง 2599');
  });

  it('the alias map keys exactly the planned-alias contract (shared with build.ts)', () => {
    expect(ALIAS_KEYS).toEqual(['พ.ร.บ.ข้าราชการครูฯ 2547']);
    expect(LAW_CODE_ALIASES['พ.ร.บ.ข้าราชการครูฯ 2547']).toBe(
      'teachers-educational-personnel-civil-service-act-2547',
    );
  });
});
