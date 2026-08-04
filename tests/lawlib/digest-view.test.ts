// ===========================================================================
// LawLib digest — chapter-grouping builder (L5 final fix wave).
//
// buildChapterGroups splits the flat มาตราสำคัญ card stream into expandable
// chapter groups using the target law's chapter table (src/data/lawlib/laws/
// national-education-act-2542.json) + the digest's own `### บทเฉพาะกาล`
// heading. Deterministic: synthetic RenderLine fixtures only.
// ===========================================================================

import { describe, it, expect } from 'vitest';
import {
  buildChapterGroups,
  type DigestChapterInfo,
  type RenderLine,
} from '@/app/(website)/lawlib/digest/digest-view';

const chapter = (no: number | null, title: string, articleKeys: string[]): DigestChapterInfo => ({
  no,
  title,
  articleKeys,
});

/** Synthetic article card line. */
const article = (key: string, label = `มาตรา ${key}`): RenderLine => ({
  kind: 'article',
  key,
  label,
  href: `/lawlib/national-education-act-2542#มาตรา-${key}`,
  parts: [{ kind: 'text', tokens: [{ kind: 'text', text: 'เนื้อหา' }] }],
});

const text = (t: string): RenderLine => ({ kind: 'text', tokens: [{ kind: 'text', text: t }] });

const h3 = (t: string): RenderLine => ({ kind: 'h3', tokens: [{ kind: 'text', text: t }] });

/** Real chapter table of the พ.ร.บ.การศึกษาแห่งชาติ digest's target law. */
const ACT_2542_CHAPTERS: DigestChapterInfo[] = [
  chapter(1, 'บททั่วไป ความมุ่งหมายและหลักการ', ['7', '8', '9']),
  chapter(2, 'สิทธิและหน้าที่ทางการศึกษา', ['10', '11', '12', '13', '14']),
  chapter(4, 'แนวการจัดการศึกษา', ['22', '23', '24', '25', '26', '27', '28', '29', '30']),
  chapter(6, 'มาตรฐานและการประกันคุณภาพการศึกษา', ['47', '48', '49', '50', '51']),
  chapter(7, 'ครู คณาจารย์ และบุคลากรทางการศึกษา', ['51/1', '52', '53', '54', '55', '56', '57']),
  chapter(9, 'เทคโนโลยีเพื่อการศึกษา', ['63', '64', '65', '66', '67', '68', '69']),
  chapter(null, 'บทเฉพาะกาล', ['70', '71', '72', '73', '74', '75', '76', '77', '78']),
];

describe('buildChapterGroups — digest chapter grouping', () => {
  it('groups articles by numbered-chapter boundaries with หมวดที่ N labels + counts', () => {
    const lines = [article('7'), article('8'), article('9'), article('10'), article('14')];
    const result = buildChapterGroups(lines, ACT_2542_CHAPTERS);

    expect(result).not.toBeNull();
    expect(result!.preamble).toEqual([]);
    expect(result!.groups.map((g) => g.label)).toEqual([
      'หมวดที่ 1 บททั่วไป ความมุ่งหมายและหลักการ',
      'หมวดที่ 2 สิทธิและหน้าที่ทางการศึกษา',
    ]);
    expect(result!.groups.map((g) => g.articleCount)).toEqual([3, 2]);
    expect(result!.groups.map((g) => g.id)).toEqual(['ch-1', 'ch-2']);
    expect(result!.groups[0].lines.map((l) => (l.kind === 'article' ? l.key : '?'))).toEqual([
      '7',
      '8',
      '9',
    ]);
  });

  it('consumes a matching `### บทเฉพาะกาล` heading as the group header (never a body line)', () => {
    const lines = [article('69'), h3('บทเฉพาะกาล'), article('70'), article('78')];
    const result = buildChapterGroups(lines, ACT_2542_CHAPTERS);

    expect(result!.groups.map((g) => g.label)).toEqual([
      'หมวดที่ 9 เทคโนโลยีเพื่อการศึกษา',
      'บทเฉพาะกาล',
    ]);
    expect(result!.groups[1].articleCount).toBe(2);
    // the h3 is the header of group 2 — not rendered as a line anywhere
    const allLines = [...result!.preamble, ...result!.groups.flatMap((g) => g.lines)];
    expect(allLines.some((l) => l.kind === 'h3')).toBe(false);
    expect(result!.groups[1].lines.map((l) => (l.kind === 'article' ? l.key : '?'))).toEqual([
      '70',
      '78',
    ]);
  });

  it('keeps lines before the first boundary in the section preamble', () => {
    const lines = [text('(ตรวจสอบแล้ว … รูปแบบ: มาตรา N : ข้อความ)'), article('7')];
    const result = buildChapterGroups(lines, ACT_2542_CHAPTERS);

    expect(result!.preamble).toEqual([text('(ตรวจสอบแล้ว … รูปแบบ: มาตรา N : ข้อความ)')]);
    expect(result!.groups).toHaveLength(1);
  });

  it('keeps non-article continuation lines inside the open group', () => {
    const lines = [
      article('10'),
      text('วรรคสองของมาตรา 10'),
      { kind: 'quote' as const, tokens: [{ kind: 'text' as const, text: 'แก้ไขโดยฉบับที่ 2' }] },
      article('22'),
    ];
    const result = buildChapterGroups(lines, ACT_2542_CHAPTERS);

    expect(result!.groups.map((g) => g.label)).toEqual([
      'หมวดที่ 2 สิทธิและหน้าที่ทางการศึกษา',
      'หมวดที่ 4 แนวการจัดการศึกษา',
    ]);
    expect(result!.groups[0].lines.map((l) => (l.kind === 'article' ? l.key : l.kind))).toEqual([
      '10',
      'text',
      'quote',
    ]);
  });

  it('splits suffixed article keys across chapter boundaries (51 vs 51/1)', () => {
    const lines = [article('51'), article('51/1'), article('52')];
    const result = buildChapterGroups(lines, ACT_2542_CHAPTERS);

    expect(result!.groups.map((g) => g.label)).toEqual([
      'หมวดที่ 6 มาตรฐานและการประกันคุณภาพการศึกษา',
      'หมวดที่ 7 ครู คณาจารย์ และบุคลากรทางการศึกษา',
    ]);
    expect(result!.groups[1].articleCount).toBe(2);
  });

  it('returns null for an empty chapter table (flat-model fallback)', () => {
    expect(buildChapterGroups([article('7')], [])).toBeNull();
  });

  it('returns empty groups when no article matches (flat-model fallback for non-law sections)', () => {
    const lines = [text('ข้อมูลกฎหมาย…'), text('ประกาศ: ราชกิจจานุเบกษา')];
    const result = buildChapterGroups(lines, ACT_2542_CHAPTERS);

    expect(result!.groups).toEqual([]);
    expect(result!.preamble).toEqual(lines);
  });
});
