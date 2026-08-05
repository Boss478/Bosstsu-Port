// ===========================================================================
// LawLib L1 — parser TDD spec (QA-first; contract per
// .agents/plans/kruexam-lawlib.md §4 + .agents/tasks/lawlib-execution.md,
// 11-case checklist).
//
// PARSER = LINE-STATE MACHINE (NOT pure regex): the body walk tracks
// definitions → chapters → sections → articles, and วรรค = blank-line-
// separated blocks (soft-wrap inside a วรรค joins with a single space;
// consecutive วรรค are joined by '\n' TEXT tokens BETWEEN blocks only).
// Regexes cover only leaf patterns (article/section headers, [[ref]],
// amendment/repeal markers).
//
// DIGEST = MINIMAL PARSE (cut-line): headings + [[ref]]/[ดูเต็ม] extraction
// only — no วรรค/amendedBy/repealed logic. Contract pinned at the bottom of
// this file (EXPECTED-RED until the digest lane lands).
//
// Deterministic: inline fixtures only — no network, no DB, no clock.
// ===========================================================================

import { describe, it, expect } from 'vitest';
import { matchDigestArticleHeader, parseLawMarkdown } from '@/lib/lawlib/parser';
import type { LawDoc } from '@/types/lawlib';

// ---------------------------------------------------------------------------
// Fixture helpers (inline only — no fixture files)
// ---------------------------------------------------------------------------

const FRONTMATTER = `---
slug: pra-kr-tum-pra
code: พ.ร.บ.ระเบียบข้าราชการพลเรือน 2551
titleTh: พระราชบัญญัติระเบียบข้าราชการพลเรือน พ.ศ. 2551
subject: ระเบียบข้าราชการพลเรือน
part: ก
tags:
  - ข้าราชการ
  - พลเรือน
verifiedAt: 2026-01-15
gazetteRef: ราชกิจจานุเบกษา เล่ม 125 ตอนที่ 27 ก วันที่ 6 กุมภาพันธ์ 2551
editions:
  - no: 1
    gazetteDate: 2551-02-06
    effectiveDate: 2551-02-06
    note: ฉบับแรก
  - no: 2
    gazetteDate: 2553-03-15
    effectiveDate: 2553-06-15
    note: แก้ไขเพิ่มเติม
---`;

const wrap = (body: string): string => `${FRONTMATTER}\n\n${body}`;

// ---------------------------------------------------------------------------
// Full-law fixture: definitions (1 multi-line) + un-numbered chapter +
// numbered chapter + ทวิ + 10/1 + same-law ref + cross-law ref +
// amendment marker + repealed paragraph block
// ---------------------------------------------------------------------------

const FULL_LAW_MD = `---
slug: pra-kr-tum-pra
code: พ.ร.บ.ระเบียบข้าราชการพลเรือน 2551
titleTh: พระราชบัญญัติระเบียบข้าราชการพลเรือน พ.ศ. 2551
subject: ระเบียบข้าราชการพลเรือน
part: ก
tags:
  - ข้าราชการ
  - พลเรือน
verifiedAt: 2026-01-15
gazetteRef: ราชกิจจานุเบกษา เล่ม 125 ตอนที่ 27 ก วันที่ 6 กุมภาพันธ์ 2551
editions:
  - no: 1
    gazetteDate: 2551-02-06
    effectiveDate: 2551-02-06
    note: ฉบับแรก
  - no: 2
    gazetteDate: 2553-03-15
    effectiveDate: 2553-06-15
    note: แก้ไขเพิ่มเติม
---

## ความหมาย

- **ข้าราชการพลเรือน** : บุคคลซึ่งได้รับการบรรจุและแต่งตั้งให้รับราชการ
โดยได้รับเงินเดือนจากเงินงบประมาณรายจ่ายหมวดเงินเดือน
- **ตำแหน่ง** : หน้าที่ความรับผิดชอบ
- **การสอบแข่งขัน** : วิธีการคัดเลือกบุคคลเพื่อบรรจุเข้ารับราชการ

## บททั่วไป

**มาตรา 1** พระราชบัญญัตินี้เรียกว่า “พระราชบัญญัติระเบียบข้าราชการพลเรือน
พ.ศ. 2551”

> แก้ไขเพิ่มเติมโดยฉบับที่ 2

**มาตรา 2** ให้รัฐมนตรีว่าการกระทรวงการคลังรักษาการตามพระราชบัญญัตินี้
และให้มีอำนาจออกกฎกระทรวงกำหนดหลักเกณฑ์ตาม [[มาตรา 10]]

**มาตรา 3** ผู้ใดฝ่าฝืน [[มาตรา 5|พ.ร.บ.ข้าราชการครูฯ 2547]] ต้องระวางโทษ

## หมวดที่ 1 การบรรจุ

**มาตรา 10** การบรรจุบุคคลเข้ารับราชการต้องเป็นไปตามหลักเกณฑ์

**มาตรา 10 ทวิ** ให้ถือว่าผู้ที่สอบผ่านเป็นการบรรจุชั่วคราว

**มาตรา 10/1** ให้มีการทดลองปฏิบัติหน้าที่ราชการตามระยะเวลาที่กำหนด

**มาตรา 11** วรรคแรกของมาตรานี้

> ~~วรรคสอง–สี่~~ ถูกยกเลิกโดย พ.ร.บ.ข้าราชการพลเรือน (ฉบับที่ 2) พ.ศ. 2553
> ข้อความที่ถูกยกเลิกวรรคสอง
> ข้อความที่ถูกยกเลิกวรรคสาม

**มาตรา 12** วรรคแรกของมาตรานี้

วรรคสองของมาตรานี้

**มาตรา 13** บทความสุดท้าย ข\u0E4D\u0E32ราชการ
`;

const doc: LawDoc = parseLawMarkdown(FULL_LAW_MD);

describe('parseLawMarkdown — full law', () => {
  it('parses frontmatter into a complete LawDoc', () => {
    expect(doc).toMatchObject({
      slug: 'pra-kr-tum-pra',
      code: 'พ.ร.บ.ระเบียบข้าราชการพลเรือน 2551',
      titleTh: 'พระราชบัญญัติระเบียบข้าราชการพลเรือน พ.ศ. 2551',
      subject: 'ระเบียบข้าราชการพลเรือน',
      part: 'ก',
      tags: ['ข้าราชการ', 'พลเรือน'],
      verifiedAt: '2026-01-15',
      gazetteRef: 'ราชกิจจานุเบกษา เล่ม 125 ตอนที่ 27 ก วันที่ 6 กุมภาพันธ์ 2551',
      editions: [
        { no: 1, gazetteDate: '2551-02-06', effectiveDate: '2551-02-06', note: 'ฉบับแรก' },
        { no: 2, gazetteDate: '2553-03-15', effectiveDate: '2553-06-15', note: 'แก้ไขเพิ่มเติม' },
      ],
    });
  });

  it('parses multi-line definition continuation (joined with a single space)', () => {
    expect(doc.definitions).toEqual([
      {
        term: 'ข้าราชการพลเรือน',
        definition:
          'บุคคลซึ่งได้รับการบรรจุและแต่งตั้งให้รับราชการ โดยได้รับเงินเดือนจากเงินงบประมาณรายจ่ายหมวดเงินเดือน',
      },
      { term: 'ตำแหน่ง', definition: 'หน้าที่ความรับผิดชอบ' },
      { term: 'การสอบแข่งขัน', definition: 'วิธีการคัดเลือกบุคคลเพื่อบรรจุเข้ารับราชการ' },
    ]);
  });

  it('keeps chapters in document order; บททั่วไป has no: null', () => {
    expect(doc.chapters).toHaveLength(2);
    expect(doc.chapters[0]).toMatchObject({ no: null, title: 'บททั่วไป' });
    expect(doc.chapters[1]).toMatchObject({ no: 1, title: 'การบรรจุ' });
  });

  it('parses articles in increasing order with suffixes (ทวิ, /1)', () => {
    const arts = doc.chapters[1].articles;
    expect(arts.map((a) => a.no)).toEqual([10, 10, 10, 11, 12, 13]);
    expect(arts[0].suffix).toBeUndefined();
    expect(arts[1].suffix).toBe('ทวิ');
    expect(arts[2].suffix).toBe('/1');
    expect(arts[3].suffix).toBeUndefined();
  });

  it('soft-wraps one วรรค into a single text token (amendment marker excluded)', () => {
    const a1 = doc.chapters[0].articles[0];
    expect(a1.text).toEqual([
      {
        kind: 'text',
        t: 'พระราชบัญญัตินี้เรียกว่า “พระราชบัญญัติระเบียบข้าราชการพลเรือน พ.ศ. 2551”',
      },
    ]);
    expect(a1.amendedBy).toEqual([{ editionNo: 2, note: '' }]); // SCRUTINY-L2: no duplicated marker wording
  });

  it('splits tokens at a same-law ref mid-วรรค', () => {
    const a2 = doc.chapters[0].articles[1];
    expect(a2.text).toHaveLength(2);
    expect(a2.text[0]).toEqual({ kind: 'text', t: expect.stringContaining('กำหนดหลักเกณฑ์ตาม') });
    const ref = (a2.text[1] as { kind: 'ref'; ref: { lawSlug?: string } }).ref;
    expect(ref).toEqual({ articleNo: 10, display: 'มาตรา 10' });
    expect(ref.lawSlug).toBeUndefined();
    expect(a2.amendedBy).toBeUndefined();
  });

  it('parses cross-law refs with แห่ง auto-inserted in display', () => {
    const a3 = doc.chapters[0].articles[2];
    expect(a3.text[0]).toEqual({ kind: 'text', t: expect.stringContaining('ผู้ใดฝ่าฝืน') });
    expect(a3.text[1]).toEqual({
      kind: 'ref',
      ref: {
        lawSlug: 'พ.ร.บ.ข้าราชการครูฯ 2547',
        articleNo: 5,
        display: 'มาตรา 5 แห่งพ.ร.บ.ข้าราชการครูฯ 2547',
      },
    });
    expect(a3.text[2]).toEqual({ kind: 'text', t: expect.stringContaining('ต้องระวางโทษ') });
  });

  it('parses repealed paragraph blocks as metadata (not body text)', () => {
    const a11 = doc.chapters[1].articles[3];
    expect(a11.text).toEqual([{ kind: 'text', t: 'วรรคแรกของมาตรานี้' }]);
    expect(a11.repealedParagraphs).toEqual([
      {
        paras: 'วรรคสอง–สี่',
        repealedBy: 'พ.ร.บ.ข้าราชการพลเรือน (ฉบับที่ 2) พ.ศ. 2553',
        text: 'ข้อความที่ถูกยกเลิกวรรคสอง\nข้อความที่ถูกยกเลิกวรรคสาม',
      },
    ]);
  });

  it("emits a '\\n' separator text-token between วรรค blocks (SCRUTINY-L1)", () => {
    const a12 = doc.chapters[1].articles[4];
    expect(a12.text).toEqual([
      { kind: 'text', t: 'วรรคแรกของมาตรานี้' },
      { kind: 'text', t: '\n' },
      { kind: 'text', t: 'วรรคสองของมาตรานี้' },
    ]);
  });

  it('NFC-normalizes article text tokens', () => {
    const a13 = doc.chapters[1].articles[5];
    // Fixture input is decomposed NIKHAHIT + SARA AA (0E4D+0E32) → composes to
    // SARA AM (U+0E33): ขำราชการ, not ข้าราชการ (MAI THO).
    expect(a13.text).toEqual([{ kind: 'text', t: 'บทความสุดท้าย ขำราชการ' }]);
  });
});

// ---------------------------------------------------------------------------
// Ref regex edges
// ---------------------------------------------------------------------------

const REF_EDGE_MD = wrap(`## หมวดที่ 1 อ้างอิง

**มาตรา 20** อ้างถึง [[มาตรา 10 ทวิ]] กลางประโยค

**มาตรา 21** [[มาตรา 10/1]] ขึ้นต้นวรรค

**มาตรา 22** อ้างเลขไทย [[มาตรา ๑๐]] ท้ายประโยค

**มาตรา 23** อ้างเลขไทยกับทวิ [[มาตรา ๑๐ ทวิ]]`);

describe('parseLawMarkdown — ref edges', () => {
  it('resolves a ref with ทวิ suffix (mid-sentence)', () => {
    const d = parseLawMarkdown(REF_EDGE_MD);
    const a20 = d.chapters[0].articles[0];
    expect(a20.text[0]).toEqual({ kind: 'text', t: expect.stringContaining('อ้างถึง') });
    expect(a20.text[1]).toEqual({
      kind: 'ref',
      ref: { articleNo: 10, articleSuffix: 'ทวิ', display: 'มาตรา 10 ทวิ' },
    });
  });

  it('resolves a ref with /1 suffix at line start (first token)', () => {
    const d = parseLawMarkdown(REF_EDGE_MD);
    const a21 = d.chapters[0].articles[1];
    expect(a21.text[0]).toEqual({
      kind: 'ref',
      ref: { articleNo: 10, articleSuffix: '/1', display: 'มาตรา 10/1' },
    });
  });

  it('normalizes Thai digits inside a ref', () => {
    const d = parseLawMarkdown(REF_EDGE_MD);
    const a22 = d.chapters[0].articles[2];
    expect(a22.text[1]).toEqual({ kind: 'ref', ref: { articleNo: 10, display: 'มาตรา 10' } });
  });

  it('normalizes Thai digits inside a ref with suffix', () => {
    const d = parseLawMarkdown(REF_EDGE_MD);
    const a23 = d.chapters[0].articles[3];
    expect(a23.text[1]).toEqual({
      kind: 'ref',
      ref: { articleNo: 10, articleSuffix: 'ทวิ', display: 'มาตรา 10 ทวิ' },
    });
  });
});

// ---------------------------------------------------------------------------
// Thai numerals in article numbers
// ---------------------------------------------------------------------------

const THAI_NUM_MD = wrap(`## หมวดที่ 1 เลขไทย

**มาตรา ๑๐** บทความแรก

**มาตรา ๑๑** บทความที่สอง`);

describe('parseLawMarkdown — Thai numerals in article numbers', () => {
  it('normalizes Thai digits in article headers', () => {
    const d = parseLawMarkdown(THAI_NUM_MD);
    expect(d.chapters[0].articles.map((a) => a.no)).toEqual([10, 11]);
  });

  it('pins Thai digit ZERO (U+0E50) in an article header', () => {
    // The frozen spec regex class [0-9๑-๙] omits ๐ (U+0E50); the parser must
    // pre-normalize digits before the header regex runs. Pin so nobody regresses it.
    const d = parseLawMarkdown(wrap('## หมวดที่ 1 เลขไทย\n\n**มาตรา ๑๐** บทความ'));
    expect(d.chapters[0].articles).toEqual([expect.objectContaining({ no: 10 })]);
  });
});

// ---------------------------------------------------------------------------
// Structural errors (throws Error)
// ---------------------------------------------------------------------------

describe('parseLawMarkdown — structural errors', () => {
  it('throws on an unclosed [[', () => {
    const md = wrap('## หมวดที่ 1 ทดสอบ\n\n**มาตรา 1** อ้างอิง [[มาตรา 10');
    expect(() => parseLawMarkdown(md)).toThrow(Error);
  });

  it('throws on a malformed article header (non-numeric มาตรา)', () => {
    const md = wrap('## หมวดที่ 1 ทดสอบ\n\n**มาตรา ก** บทความ');
    expect(() => parseLawMarkdown(md)).toThrow(Error);
  });

  it('throws when a required frontmatter key (code) is missing', () => {
    const md =
      FRONTMATTER.replace('code: พ.ร.บ.ระเบียบข้าราชการพลเรือน 2551\n', '') +
      '\n\n## หมวดที่ 1 ทดสอบ\n\n**มาตรา 1** บทความ';
    expect(() => parseLawMarkdown(md)).toThrow(Error);
  });

  it('throws when a required frontmatter key (slug) is missing', () => {
    const md =
      FRONTMATTER.replace('slug: pra-kr-tum-pra\n', '') +
      '\n\n## หมวดที่ 1 ทดสอบ\n\n**มาตรา 1** บทความ';
    expect(() => parseLawMarkdown(md)).toThrow(Error);
  });
});

// ---------------------------------------------------------------------------
// GATE-1 follow-up: section nesting (### ส่วนที่ N inside ## หมวดที่ N)
//
// NOTE: `Chapter.sections` is a GATE-1 follow-up extension (types/lawlib.ts is
// FROZEN at GATE 1). These tests are EXPECTED-RED until the extension lands —
// they pin the intended contract (see .agents/plans/lawlib-parser-tdd-spec.md
// §3). Section shape pinned: { no, title, articles }; chapters without any
// `### ส่วนที่` heading have NO `sections` key at all.
// ---------------------------------------------------------------------------

interface SectionLike {
  no: number | null;
  title: string;
  articles: Article[];
}

const SECTIONED_MD = wrap(`## หมวดที่ 5 การแต่งตั้ง

### ส่วนที่ 1 การบรรจุ

**มาตรา 31** บทความแรกของส่วนที่หนึ่ง

**มาตรา 32** บทความที่สองของส่วนที่หนึ่ง

### ส่วนที่ 2 การโอนย้าย

**มาตรา 33** บทความของส่วนที่สอง

## หมวดที่ 6 การเลื่อนตำแหน่ง

**มาตรา 40** บทความของหมวดใหม่`);

describe('parseLawMarkdown — section nesting (GATE-1 follow-up)', () => {
  it('parses numbered ### ส่วนที่ headings into Chapter.sections', () => {
    const d = parseLawMarkdown(SECTIONED_MD);
    expect(d.chapters).toHaveLength(2);
    expect(d.chapters[0]).toMatchObject({ no: 5, title: 'การแต่งตั้ง' });

    const ch5 = d.chapters[0] as LawDoc['chapters'][number] & { sections: SectionLike[] };
    expect(ch5.sections).toHaveLength(2);
    expect(ch5.sections[0]).toMatchObject({ no: 1, title: 'การบรรจุ' });
    expect(ch5.sections[1]).toMatchObject({ no: 2, title: 'การโอนย้าย' });
  });

  it('places articles in the section that contains them', () => {
    const d = parseLawMarkdown(SECTIONED_MD);
    const ch5 = d.chapters[0] as LawDoc['chapters'][number] & { sections: SectionLike[] };
    expect(ch5.sections[0].articles.map((a) => a.no)).toEqual([31, 32]);
    expect(ch5.sections[1].articles.map((a) => a.no)).toEqual([33]);
  });

  it('a new ## หมวดที่ heading closes the open section', () => {
    const d = parseLawMarkdown(SECTIONED_MD);
    const ch6 = d.chapters[1] as LawDoc['chapters'][number] & { sections?: SectionLike[] };
    expect(ch6).toMatchObject({ no: 6, title: 'การเลื่อนตำแหน่ง' });
    expect(ch6.articles.map((a) => a.no)).toEqual([40]);
    expect(ch6.sections).toBeUndefined();
  });

  it('parses an un-numbered ### ส่วนที่ heading as a section with no: null', () => {
    // Decision point: the grammar allows `### ส่วนที่ <title>` with no number →
    // `{ no: null, title }` (mirrors `## บททั่วไป` → chapter no: null). If the
    // implementer prefers to reject un-numbered sections, this pin must change.
    const d = parseLawMarkdown(
      wrap(`## หมวดที่ 7 บทเฉพาะกาล

### ส่วนที่ บทเฉพาะกาล

**มาตรา 50** บทความของส่วนที่ไม่มีเลข`),
    );
    const ch7 = d.chapters[0] as LawDoc['chapters'][number] & { sections: SectionLike[] };
    expect(ch7).toMatchObject({ no: 7, title: 'บทเฉพาะกาล' });
    expect(ch7.sections).toEqual([
      { no: null, title: 'บทเฉพาะกาล', articles: [expect.objectContaining({ no: 50 })] },
    ]);
  });
});

// ---------------------------------------------------------------------------
// SCRUTINY-L1/L2 pins (fix lane pending — EXPECTED-RED until the parser lands):
//   L1-1  '\n' separator text-tokens BETWEEN วรรค blocks only (never
//         leading/trailing; metadata blocks emit nothing but the วรรค blocks
//         on either side still get a separator)
//   L1-2  every `>`-line scanned: multi-marker blocks → multiple amendedBy
//         (real มาตรา 38 case); `> วรรคห้า เพิ่มโดยฉบับที่ 3` → note
//         'เพิ่มวรรคห้า'; markers never leak into body text
//   L1-7  marker note = trailing text after "ฉบับที่ N" only → '' here
//   L2    frontmatter edition `no` accepts Thai digits (normalized)
// See .agents/plans/lawlib-parser-tdd-spec.md §3 (updated 2026-08-04).
// ---------------------------------------------------------------------------

describe('parseLawMarkdown — SCRUTINY-L1/L2 วรรค \\n + marker semantics', () => {
  it("emits '\\n' separator text-tokens between วรรค blocks only (3-วรรค article)", () => {
    const d = parseLawMarkdown(
      wrap(`## หมวดที่ 1 ทดสอบ

**มาตรา 60** วรรคหนึ่งของมาตรานี้

วรรคสองของมาตรานี้

วรรคสามของมาตรานี้`),
    );
    expect(d.chapters[0].articles[0].text).toEqual([
      { kind: 'text', t: 'วรรคหนึ่งของมาตรานี้' },
      { kind: 'text', t: '\n' },
      { kind: 'text', t: 'วรรคสองของมาตรานี้' },
      { kind: 'text', t: '\n' },
      { kind: 'text', t: 'วรรคสามของมาตรานี้' },
    ]);
  });

  it("never emits a leading/trailing '\\n' (single-วรรค article has no separator)", () => {
    const d = parseLawMarkdown(wrap('## หมวดที่ 1 ทดสอบ\n\n**มาตรา 61** วรรคเดียวของมาตรานี้'));
    expect(d.chapters[0].articles[0].text).toEqual([{ kind: 'text', t: 'วรรคเดียวของมาตรานี้' }]);
  });

  it('parses the real มาตรา 38 multi-marker block into TWO amendedBy entries (markers not in body)', () => {
    // Verbatim structure of content/lawlib/laws/national-education-act-2542.md
    // มาตรา 38: วรรคหนึ่ง → repealed วรรคสอง–สี่ (คสช. 10/2559) → วรรค
    // ในการดำเนินการ… → marker block `> แก้ไขเพิ่มเติมโดยฉบับที่ 2` +
    // `> วรรคห้า เพิ่มโดยฉบับที่ 3` (ฉ.3 added วรรคห้า).
    const d = parseLawMarkdown(
      wrap(`## หมวดที่ 3 เขตพื้นที่การศึกษา

**มาตรา 38** ในแต่ละเขตพื้นที่การศึกษา ให้มีคณะกรรมการและ
สำนักงานเขตพื้นที่การศึกษามีอำนาจหน้าที่ในการกำกับดูแล จัดตั้ง ยุบ รวม หรือเลิก
สถานศึกษาขั้นพื้นฐานในเขตพื้นที่การศึกษา

> ~~วรรคสอง–สี่~~ ถูกยกเลิกโดยผลของคำสั่งหัวหน้าคณะรักษาความสงบแห่งชาติ ที่ 10/2559 เรื่อง การขับเคลื่อนการปฏิรูปการศึกษาของกระทรวงศึกษาธิการในภูมิภาค
>
> คณะกรรมการเขตพื้นที่การศึกษาประกอบด้วย ผู้แทนองค์กรชุมชน ผู้แทนองค์กรเอกชน
> จำนวนกรรมการ คุณสมบัติ หลักเกณฑ์ วิธีการสรรหา ให้เป็นไปตามที่กำหนดในกฎกระทรวง

ในการดำเนินการตามวรรคหนึ่งในส่วนที่เกี่ยวกับสถานศึกษาเอกชนและ
องค์กรปกครองส่วนท้องถิ่นว่าจะอยู่ในอำนาจหน้าที่ของเขตพื้นที่การศึกษาใด ให้เป็นไป
ตามที่รัฐมนตรีประกาศกำหนดโดยคำแนะนำของคณะกรรมการการศึกษาขั้นพื้นฐาน

> แก้ไขเพิ่มเติมโดยฉบับที่ 2
> วรรคห้า เพิ่มโดยฉบับที่ 3`),
    );
    const a38 = d.chapters[0].articles[0];
    expect(a38.amendedBy).toEqual([
      { editionNo: 2, note: '' }, // L1-7: no duplicated marker wording
      { editionNo: 3, note: 'เพิ่มวรรคห้า' }, // L1-2: วรรค-prefixed marker
    ]);
    // marker lines never leak into the body text
    const allText = a38.text.map((t) => (t.kind === 'text' ? t.t : t.ref.display)).join('');
    expect(allText).not.toContain('ฉบับที่ 2');
    expect(allText).not.toContain('วรรคห้า');
    expect(a38.repealedParagraphs).toEqual([
      {
        paras: 'วรรคสอง–สี่',
        repealedBy:
          'ผลของคำสั่งหัวหน้าคณะรักษาความสงบแห่งชาติ ที่ 10/2559 เรื่อง การขับเคลื่อนการปฏิรูปการศึกษาของกระทรวงศึกษาธิการในภูมิภาค',
        text:
          'คณะกรรมการเขตพื้นที่การศึกษาประกอบด้วย ผู้แทนองค์กรชุมชน ผู้แทนองค์กรเอกชน\n' +
          'จำนวนกรรมการ คุณสมบัติ หลักเกณฑ์ วิธีการสรรหา ให้เป็นไปตามที่กำหนดในกฎกระทรวง',
      },
    ]);
  });

  it('skips metadata blocks but keeps the separator between their neighboring วรรค (มาตรา 38)', () => {
    const d = parseLawMarkdown(
      wrap(`## หมวดที่ 3 เขตพื้นที่การศึกษา

**มาตรา 38** ในแต่ละเขตพื้นที่การศึกษา ให้มีคณะกรรมการและ
สำนักงานเขตพื้นที่การศึกษามีอำนาจหน้าที่ในการกำกับดูแล

> ~~วรรคสอง–สี่~~ ถูกยกเลิกโดยผลของคำสั่งหัวหน้าคณะรักษาความสงบแห่งชาติ ที่ 10/2559
> ข้อความที่ถูกยกเลิก

ในการดำเนินการตามวรรคหนึ่งในส่วนที่เกี่ยวกับสถานศึกษาเอกชนและ
องค์กรปกครองส่วนท้องถิ่น

> แก้ไขเพิ่มเติมโดยฉบับที่ 2
> วรรคห้า เพิ่มโดยฉบับที่ 3`),
    );
    // วรรคหนึ่ง → '\n' → วรรคในการดำเนินการ (repealed + marker blocks skipped)
    expect(d.chapters[0].articles[0].text).toEqual([
      {
        kind: 'text',
        t: 'ในแต่ละเขตพื้นที่การศึกษา ให้มีคณะกรรมการและ สำนักงานเขตพื้นที่การศึกษามีอำนาจหน้าที่ในการกำกับดูแล',
      },
      { kind: 'text', t: '\n' },
      {
        kind: 'text',
        t: 'ในการดำเนินการตามวรรคหนึ่งในส่วนที่เกี่ยวกับสถานศึกษาเอกชนและ องค์กรปกครองส่วนท้องถิ่น',
      },
    ]);
  });

  it('includes marker-extra lines in the วรรค chain VERBATIM (">" kept — rule 10 flags as drift)', () => {
    // SCRUTINY-L2-B1 contract as implemented: non-marker lines of a marker
    // block become a วรรค (included in the '\n' chain) but keep the '>'
    // prefix; validate rule 10 then flags them as marker-grammar drift.
    const d = parseLawMarkdown(
      wrap(`## หมวดที่ 1 ทดสอบ

**มาตรา 62** บทความแรกของมาตรานี้

> แก้ไขเพิ่มเติมโดยฉบับที่ 2
> ข้อความเพิ่มเติมของวรรคที่เพิ่ม`),
    );
    const a62 = d.chapters[0].articles[0];
    expect(a62.amendedBy).toEqual([{ editionNo: 2, note: '' }]);
    expect(a62.text).toEqual([
      { kind: 'text', t: 'บทความแรกของมาตรานี้' },
      { kind: 'text', t: '\n' },
      { kind: 'text', t: '> ข้อความเพิ่มเติมของวรรคที่เพิ่ม' },
    ]);
  });

  it('normalizes Thai digits in frontmatter edition numbers (no: "๒" → 2)', () => {
    const md = `---
slug: edition-thai-digit
code: พ.ร.บ.ทดสอบเลขไทย 2569
titleTh: พระราชบัญญัติทดสอบเลขไทย พ.ศ. 2569
subject: ทดสอบเลขไทย
part: ก
tags:
  - ทดสอบ
verifiedAt: 2026-08-04
gazetteRef: ราชกิจจานุเบกษา ทดสอบ
editions:
  - no: "๒"
    gazetteDate: 2569-01-01
    effectiveDate: 2569-01-01
    note: ฉบับที่สอง
---

## หมวดที่ 1 ทดสอบ

**มาตรา 1** บทความ
`;
    expect(parseLawMarkdown(md).editions).toEqual([
      { no: 2, gazetteDate: '2569-01-01', effectiveDate: '2569-01-01', note: 'ฉบับที่สอง' },
    ]);
  });
});

// ---------------------------------------------------------------------------
// 11-case checklist — REAL-TEXT pins (cases 2/3/7/8), grounded on
// content/lawlib/laws/national-education-act-2542.md verbatim shapes:
//   2  marker BETWEEN วรรค blocks (มาตรา 45: 3-วรรค chain must survive)
//   3  plain `> เพิ่มโดยฉบับที่ N` marker (มาตรา 32/1, 32/2, 51/1 shape)
//   7  Thai-digit header with /N suffix + the full 8-suffix vocabulary
//   8  Thai digits → Arabic inside a ref WITH /N suffix (๕๑/๑ → 51/1)
// ---------------------------------------------------------------------------

describe('parseLawMarkdown — real-text pins (cases 2/3/7/8)', () => {
  it('case 2: marker BETWEEN วรรค 2 and 3 keeps the 3-วรรค \\n chain (มาตรา 45 verbatim)', () => {
    const d = parseLawMarkdown(
      wrap(`## หมวดที่ 5 การบริหารและการจัดการศึกษา

**มาตรา 45** ให้สถานศึกษาเอกชนจัดการศึกษาได้ทุกระดับและทุกประเภท การศึกษาตามที่กฎหมาย
กำหนด โดยรัฐต้องกำหนดนโยบายและมาตรการที่ชัดเจนเกี่ยวกับการมีส่วนร่วมของเอกชนในด้าน
การศึกษา

การกำหนดนโยบายและแผนการจัดการศึกษาของรัฐของเขตพื้นที่การศึกษาหรือขององค์กรปกครอง
ส่วนท้องถิ่น ให้คำนึงถึงผลกระทบต่อการจัดการศึกษาของเอกชน โดยให้รัฐมนตรีหรือคณะกรรมการ
เขตพื้นที่การศึกษา หรือองค์กรปกครองส่วนท้องถิ่นรับฟังความคิดเห็นของเอกชนและประชาชน
ประกอบการพิจารณาด้วย

> แก้ไขเพิ่มเติมโดยฉบับที่ 2

ให้สถานศึกษาของเอกชนที่จัดการศึกษาระดับปริญญาดำเนินกิจการได้โดยอิสระ สามารถพัฒนาระบบ
บริหารและการจัดการที่เป็นของตนเอง มีความคล่องตัว มีเสรีภาพทางวิชาการ และอยู่ภายใต้การ
กำกับดูแลของสภาสถานศึกษา ตามกฎหมายว่าด้วยสถาบันอุดมศึกษาเอกชน`),
    );
    const a45 = d.chapters[0].articles[0];
    // The marker block contributes no text and does NOT merge วรรค 2 + 3:
    // the '\n' chain stays intact between all three วรรค.
    expect(a45.text).toEqual([
      { kind: 'text', t: expect.stringContaining('ให้สถานศึกษาเอกชนจัดการศึกษาได้ทุกระดับ') },
      { kind: 'text', t: '\n' },
      { kind: 'text', t: expect.stringContaining('การกำหนดนโยบายและแผนการจัดการศึกษาของรัฐ') },
      { kind: 'text', t: '\n' },
      { kind: 'text', t: expect.stringContaining('ให้สถานศึกษาของเอกชนที่จัดการศึกษาระดับปริญญา') },
    ]);
    expect(a45.amendedBy).toEqual([{ editionNo: 2, note: '' }]);
  });

  it('case 3: plain "> เพิ่มโดยฉบับที่ N" marker (no วรรค prefix) → amendedBy note "" (มาตรา 32/1 shape)', () => {
    const d = parseLawMarkdown(
      wrap(`## หมวดที่ 5 การบริหารและการจัดการศึกษา

**มาตรา 32/1** กระทรวงการอุดมศึกษา วิทยาศาสตร์ วิจัยและ
นวัตกรรม มีอำนาจหน้าที่เกี่ยวกับการส่งเสริม สนับสนุน และกำกับการอุดมศึกษา

> เพิ่มโดยฉบับที่ 4`),
    );
    const a321 = d.chapters[0].articles[0];
    expect(a321.no).toBe(32);
    expect(a321.suffix).toBe('/1');
    expect(a321.amendedBy).toEqual([{ editionNo: 4, note: '' }]);
  });

  it('case 7: Thai-digit article header with /N suffix (มาตรา ๕๑/๑ → no 51, suffix /1)', () => {
    const d = parseLawMarkdown(
      wrap(`## หมวดที่ 7 บุคลากรทางการศึกษา

**มาตรา ๕๑/๑** คำว่า “คณาจารย์” ในหมวดนี้ ให้หมายความว่า บุคลากรซึ่งทำหน้าที่หลัก`),
    );
    expect(d.chapters[0].articles[0]).toMatchObject({ no: 51, suffix: '/1' });
  });

  it('case 8: ref with Thai digits AND /N suffix ([[มาตรา ๕๑/๑]] → 51/1)', () => {
    const d = parseLawMarkdown(
      wrap(`## หมวดที่ 7 บุคลากรทางการศึกษา

**มาตรา 52** อ้างอิง [[มาตรา ๕๑/๑]] กลางวรรค`),
    );
    const a52 = d.chapters[0].articles[0];
    expect(a52.text[1]).toEqual({
      kind: 'ref',
      ref: { articleNo: 51, articleSuffix: '/1', display: 'มาตรา 51/1' },
    });
  });

  it('case 7: all 8 Thai legal suffixes parse (ทวิ ตรี จัตวา เบญจ ฉ สัตต อัฏฐ นว)', () => {
    const suffixes = ['ทวิ', 'ตรี', 'จัตวา', 'เบญจ', 'ฉ', 'สัตต', 'อัฏฐ', 'นว'];
    const body = suffixes.map((s, i) => `**มาตรา 10 ${s}** บทความ ${i}`).join('\n\n');
    const d = parseLawMarkdown(wrap(`## หมวดที่ 1 ทดสอบ\n\n${body}`));
    expect(d.chapters[0].articles.map((a) => a.suffix)).toEqual(suffixes);
  });
});

// ---------------------------------------------------------------------------
// Case 11: parser-side frontmatter guards (validate.ts owns the rule checks;
// these pin that the parser REJECTS structurally invalid frontmatter too).
// ---------------------------------------------------------------------------

describe('parseLawMarkdown — frontmatter guards (case 11)', () => {
  it('throws when part is not ก/ข', () => {
    const md =
      FRONTMATTER.replace('part: ก', 'part: ค') + '\n\n## หมวดที่ 1 ทดสอบ\n\n**มาตรา 1** บทความ';
    expect(() => parseLawMarkdown(md)).toThrow(/part/);
  });

  it('throws when verifiedAt is missing', () => {
    const md =
      FRONTMATTER.replace('verifiedAt: 2026-01-15\n', '') +
      '\n\n## หมวดที่ 1 ทดสอบ\n\n**มาตรา 1** บทความ';
    expect(() => parseLawMarkdown(md)).toThrow(/verifiedAt/);
  });

  it('throws when gazetteRef is missing', () => {
    const md =
      FRONTMATTER.replace(
        'gazetteRef: ราชกิจจานุเบกษา เล่ม 125 ตอนที่ 27 ก วันที่ 6 กุมภาพันธ์ 2551\n',
        '',
      ) + '\n\n## หมวดที่ 1 ทดสอบ\n\n**มาตรา 1** บทความ';
    expect(() => parseLawMarkdown(md)).toThrow(/gazetteRef/);
  });
});

// ---------------------------------------------------------------------------
// DIGEST — minimal parse (L1 cut-line; .agents/tasks/lawlib-execution.md §Phase 1)
//
// Digest sources (content/lawlib/digests/*.md) get headings + [[ref]]/
// [ดูเต็ม] extraction ONLY — no วรรค blocks, no amendedBy/repealed logic.
// QA-defined contract (2026-08-04):
//   parseDigestMd(md: string): {
//     title: string;                        // `# …` H1, or '' when absent
//     sections: Array<{
//       heading: string;                    // '## N. title' → verbatim after '## '
//       refs: Array<{ articleNo: number; articleSuffix?: string }>;  // every [[มาตรา N]]
//       hasSeeFull: boolean;                // any '[ดูเต็ม' marker in the section
//     }>;
//   }
// LANDED by the digest lane (2026-08-04): parseDigestMd implemented in
// src/lib/lawlib/parser.ts; the pins below are un-skipped and part of the
// green gate (143/143).
// ---------------------------------------------------------------------------

const DIGEST_MD = `# พจนานุกรมกฎหมายการศึกษา — พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542

> Study digest — important parts only.

## 1. ข้อมูลกฎหมาย

- **ชื่อ:** พระราชบัญญัติการศึกษาแห่งชาติ พ.ศ. 2542

## 4. มาตราสำคัญ

**มาตรา 7** : ในกระบวนการเรียนรู้ต้องมุ่งปลูกฝังจิตสำนึกที่ถูกต้อง ...

**มาตรา 51/1** : คำว่า “คณาจารย์” ... · เพิ่มโดยฉบับที่ 4 · [ดูเต็ม [[มาตรา 51/1]]]
`;

describe('parseDigestMd — minimal digest parse', () => {
  const getFn = async (): Promise<unknown> => {
    const mod = await import('@/lib/lawlib/parser');
    return (mod as Record<string, unknown>).parseDigestMd;
  };

  it('exports parseDigestMd', async () => {
    expect(await getFn()).toBeTypeOf('function');
  });

  it('extracts the H1 title and ## section headings', async () => {
    const fn = (await getFn()) as (md: string) => {
      title: string;
      sections: Array<{ heading: string }>;
    };
    const d = fn(DIGEST_MD);
    expect(d.title).toBe('พจนานุกรมกฎหมายการศึกษา — พ.ร.บ.การศึกษาแห่งชาติ พ.ศ. 2542');
    expect(d.sections.map((s) => s.heading)).toEqual(['1. ข้อมูลกฎหมาย', '4. มาตราสำคัญ']);
  });

  it('extracts [[มาตรา N]] refs incl. /N suffix and marks [ดูเต็ม] sections', async () => {
    const fn = (await getFn()) as (md: string) => {
      sections: Array<{
        refs: Array<{ articleNo: number; articleSuffix?: string }>;
        hasSeeFull: boolean;
      }>;
    };
    const d = fn(DIGEST_MD);
    expect(d.sections[0].refs).toEqual([]);
    expect(d.sections[0].hasSeeFull).toBe(false);
    expect(d.sections[1].refs).toEqual([{ articleNo: 51, articleSuffix: '/1' }]);
    expect(d.sections[1].hasSeeFull).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// matchDigestArticleHeader — merged-header support (user 2026-08-05): the
// digest md restructured 12 cards to '**มาตรา N - มาตรา M** : content'.
// Single-article headers must keep parsing EXACTLY as before (regression).
// ---------------------------------------------------------------------------

describe('matchDigestArticleHeader — single-article regression', () => {
  it('parses shape 1 exactly as before (no no2/suffix2 keys)', () => {
    const h = matchDigestArticleHeader('**มาตรา 10** : สาระสำคัญ');
    expect(h).toEqual({ no: 10, rest: 'สาระสำคัญ' });
  });

  it('parses shape 2 (trailing ** stripped)', () => {
    expect(matchDigestArticleHeader('**มาตรา 10 : เนื้อความ**')).toEqual({
      no: 10,
      rest: 'เนื้อความ',
    });
  });

  it('parses word + /N suffixes', () => {
    expect(matchDigestArticleHeader('**มาตรา 10 ทวิ** : x')).toEqual({
      no: 10,
      suffix: 'ทวิ',
      rest: 'x',
    });
    expect(matchDigestArticleHeader('**มาตรา 51/1** : x')).toEqual({
      no: 51,
      suffix: '/1',
      rest: 'x',
    });
  });

  it('normalizes Thai digits', () => {
    expect(matchDigestArticleHeader('**มาตรา ๑๐** : x')).toEqual({ no: 10, rest: 'x' });
  });

  it('returns null for non-article lines', () => {
    expect(matchDigestArticleHeader('**มาตรา ก** : x')).toBeNull();
    expect(matchDigestArticleHeader('plain text')).toBeNull();
  });
});

describe('matchDigestArticleHeader — merged headers', () => {
  it('parses shape 1 (the digest md format: **มาตรา N - มาตรา M** : content)', () => {
    expect(matchDigestArticleHeader('**มาตรา 11 - มาตรา 12** : เนื้อหา')).toEqual({
      no: 11,
      no2: 12,
      rest: 'เนื้อหา',
    });
  });

  it('parses a 4-article span (มาตรา 70 - มาตรา 73)', () => {
    expect(matchDigestArticleHeader('**มาตรา 70 - มาตรา 73** : x')).toEqual({
      no: 70,
      no2: 73,
      rest: 'x',
    });
  });

  it('parses /N suffixes on both members (มาตรา 32/1 - มาตรา 32/2)', () => {
    expect(matchDigestArticleHeader('**มาตรา 32/1 - มาตรา 32/2** : x')).toEqual({
      no: 32,
      suffix: '/1',
      no2: 32,
      suffix2: '/2',
      rest: 'x',
    });
  });

  it('parses shape 2 (trailing ** stripped)', () => {
    expect(matchDigestArticleHeader('**มาตรา 11 - มาตรา 12 : เนื้อหา**')).toEqual({
      no: 11,
      no2: 12,
      rest: 'เนื้อหา',
    });
  });

  it('normalizes Thai digits in both members', () => {
    expect(matchDigestArticleHeader('**มาตรา ๑๑ - มาตรา ๑๒** : x')).toEqual({
      no: 11,
      no2: 12,
      rest: 'x',
    });
  });

  it('keeps single-article headers with `- มาตรา` in the content as SINGLE (no2 absent)', () => {
    // '**มาตรา 10** : - มาตรา 12 …' — the merged group must not fire after a
    // closed '**' shape-1 header (regression guard).
    expect(matchDigestArticleHeader('**มาตรา 10** : - มาตรา 12 วรรคสอง')).toEqual({
      no: 10,
      rest: '- มาตรา 12 วรรคสอง',
    });
  });
});
