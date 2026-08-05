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
  buildView,
  digestHasCard,
  tokenizeRenderText,
  type BuildViewOptions,
  type DigestChapterInfo,
  type DigestView,
  type RenderLine,
} from '@/lib/lawlib/digest-view';
import type { DigestDoc } from '@/lib/lawlib/parser';
import type { GlossaryTerm } from '@/lib/lawlib-reader';

const chapter = (no: number | null, title: string, articleKeys: string[]): DigestChapterInfo => ({
  no,
  title,
  articleKeys,
});

/** Synthetic article card line (fixtures — ids are constants, never asserted). */
const article = (key: string, label = `มาตรา ${key}`): RenderLine => ({
  kind: 'article',
  id: 'lawlib-dline-fixture',
  key,
  label,
  href: `/lawlib/national-education-act-2542#มาตรา-${key}`,
  parts: [{ kind: 'text', tokens: [{ kind: 'text', text: 'เนื้อหา' }] }],
});

const text = (t: string): RenderLine => ({
  kind: 'text',
  id: 'lawlib-dline-fixture',
  tokens: [{ kind: 'text', text: t }],
});

const h3 = (t: string): RenderLine => ({
  kind: 'h3',
  id: 'lawlib-dline-fixture',
  tokens: [{ kind: 'text', text: t }],
});

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
      {
        kind: 'quote' as const,
        id: 'lawlib-dline-fixture',
        tokens: [{ kind: 'text' as const, text: 'แก้ไขโดยฉบับที่ 2' }],
      },
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

// ---------------------------------------------------------------------------
// rev 5.5 — merged-reader token model (marker-aware + terms), digestHasCard,
// global lawlib-dline-<n> counter
// ---------------------------------------------------------------------------

const TERMS: GlossaryTerm[] = [{ term: 'การศึกษา', definition: 'ความหมายของการศึกษา' }];

const OPTS: BuildViewOptions = {
  slug: 'national-education-act-2542',
  href: '/lawlib/national-education-act-2542',
};

/** Minimal doc: one info section (marker/term/ref line) + one มาตรา section. */
const DOC: DigestDoc = {
  title: 'พจนานุกรมกฎหมาย — ทดสอบ',
  sections: [
    {
      heading: '1. ข้อมูลกฎหมาย',
      body: '**การศึกษา** : ~~ยกเลิก~~ ตาม [[มาตรา 10]]',
      refs: [{ articleNo: 10 }],
      hasSeeFull: false,
    },
    {
      heading: '4. มาตราสำคัญ',
      body: '**มาตรา 10** : สาระสำคัญ\n**มาตรา 20** : เนื้อความ',
      refs: [{ articleNo: 10 }, { articleNo: 20 }],
      hasSeeFull: false,
    },
  ],
};

describe('tokenizeRenderText — marker-aware + term segmentation', () => {
  it('consumes **bold** and ~~strike~~ pairs into flags (unbalanced markers stay literal)', () => {
    const tokens = tokenizeRenderText('**การศึกษา** : ~~ยกเลิก~~ **ไม่ปิด', []);
    expect(tokens).toEqual([
      { kind: 'text', text: 'การศึกษา', bold: true },
      { kind: 'text', text: ' : ' },
      { kind: 'text', text: 'ยกเลิก', strike: true },
      { kind: 'text', text: ' **ไม่ปิด' },
    ]);
  });

  it('splits terms via splitByTerms on plain runs, carrying run flags', () => {
    const tokens = tokenizeRenderText('**การศึกษา** ฉบับ', TERMS);
    expect(tokens).toEqual([
      { kind: 'term', term: 'การศึกษา', definition: 'ความหมายของการศึกษา', bold: true },
      { kind: 'text', text: ' ฉบับ' },
    ]);
  });

  it('keeps refs whole (never term-segmented) and in document order', () => {
    const view = buildView(DOC, new Map(), null, TERMS, OPTS);
    const info = view.sections[0];
    const t = info.lines.flatMap((l) => l.tokens);
    expect(t.map((x) => x.kind)).toEqual(['term', 'text', 'text', 'text', 'ref']);
    const ref = t.find((x) => x.kind === 'ref');
    expect(ref).toEqual({
      kind: 'ref',
      label: 'มาตรา 10',
      href: '/lawlib/national-education-act-2542#มาตรา-10',
    });
  });
});

describe('buildView — article cards + global dline ids', () => {
  it('builds article cards with slug-parametrized hrefs + section chips', () => {
    const view = buildView(DOC, new Map(), null, [], OPTS);
    const section = view.sections[1];
    expect(section.articles).toEqual([
      { key: '10', label: 'มาตรา 10', href: '/lawlib/national-education-act-2542#มาตรา-10' },
      { key: '20', label: 'มาตรา 20', href: '/lawlib/national-education-act-2542#มาตรา-20' },
    ]);
    const cards = section.lines.filter((l) => l.kind === 'article');
    expect(cards.map((c) => (c.kind === 'article' ? c.key : '?'))).toEqual(['10', '20']);
  });

  it('assigns lawlib-dline-<n> via ONE global counter across ≥2 sections (no restart)', () => {
    const view = buildView(DOC, new Map(), null, [], OPTS);
    const ids = view.sections.flatMap((s) => s.lines.map((l) => l.id));
    expect(ids.length).toBeGreaterThanOrEqual(3);
    expect(new Set(ids).size).toBe(ids.length); // all unique
    expect(ids[0]).toBe('lawlib-dline-1');
    // strict global sequence across sections
    const numbers = ids.map((id) => Number(id.replace('lawlib-dline-', '')));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    // section 2 starts AFTER section 1's counter (never restarts at 1)
    const s2 = view.sections[1].lines.map((l) => Number(l.id.replace('lawlib-dline-', '')));
    expect(s2[0]).toBeGreaterThan(1);
  });
});

describe('digestHasCard — compact jump rule', () => {
  it('true for keys with digest cards, false for absent keys / empty views', () => {
    const view = buildView(DOC, new Map(), null, [], OPTS);
    expect(digestHasCard(view, '10')).toBe(true);
    expect(digestHasCard(view, '20')).toBe(true);
    expect(digestHasCard(view, '11')).toBe(false);
    const empty: DigestView = { title: '', sections: [] };
    expect(digestHasCard(empty, '10')).toBe(false);
  });
});

describe('buildView — per-มาตรา concise history (user 2026-08-05)', () => {
  it('collects `- ประวัติ: …` bullets into article history, excluding them from parts', () => {
    const doc: DigestDoc = {
      title: 't',
      sections: [
        {
          heading: '4. มาตราสำคัญ',
          body: '**มาตรา 37** : สาระสำคัญ\n- ประวัติ: ฉบับที่ 3 (2553) แก้ไข: แทนทั้งมาตรา',
          refs: [{ articleNo: 37 }],
          hasSeeFull: false,
        },
      ],
    };
    const view = buildView(doc, new Map(), null, [], OPTS);
    const card = view.sections[0].lines.find(
      (l): l is Extract<RenderLine, { kind: 'article' }> => l.kind === 'article',
    );
    expect(card?.history).toEqual(['ฉบับที่ 3 (2553) แก้ไข: แทนทั้งมาตรา']);
    // the bullet is NOT in the rendered parts (popover-only, card summary clean)
    const partText = card?.parts
      .flatMap((p) => p.tokens)
      .filter((t) => t.kind === 'text')
      .map((t) => t.text)
      .join('');
    expect(partText).not.toContain('ประวัติ:');
  });

  it('ignores non-ประวัติ bullets (stay in parts)', () => {
    const doc: DigestDoc = {
      title: 't',
      sections: [
        {
          heading: '4. มาตราสำคัญ',
          body: '**มาตรา 8** : สาระ\n- วรรคสองของมาตรานี้',
          refs: [{ articleNo: 8 }],
          hasSeeFull: false,
        },
      ],
    };
    const view = buildView(doc, new Map(), null, [], OPTS);
    const card = view.sections[0].lines.find(
      (l): l is Extract<RenderLine, { kind: 'article' }> => l.kind === 'article',
    );
    expect(card?.history).toBeUndefined();
    expect(card?.parts.length).toBe(2); // header text + the bullet
  });
});

// ---------------------------------------------------------------------------
// Merged article headers ('**มาตรา 11 - มาตรา 12** : …', user 2026-08-05) —
// ONE card (anchor = first key) + one jump chip per member key.
// ---------------------------------------------------------------------------

describe('buildView — merged article headers (user 2026-08-05)', () => {
  it('builds ONE merged card: first-key anchor, keys, merged label, per-member chips', () => {
    const doc: DigestDoc = {
      title: 't',
      sections: [
        {
          heading: '4. มาตราสำคัญ',
          body: '**มาตรา 11 - มาตรา 12** : สาระสำคัญ',
          refs: [],
          hasSeeFull: false,
        },
      ],
    };
    const view = buildView(doc, new Map(), null, [], OPTS);
    const section = view.sections[0];
    // one chip per member key — own label, merged (first-key) anchor
    expect(section.articles).toEqual([
      { key: '11', label: 'มาตรา 11', href: '/lawlib/national-education-act-2542#มาตรา-11' },
      { key: '12', label: 'มาตรา 12', href: '/lawlib/national-education-act-2542#มาตรา-11' },
    ]);
    const card = section.lines.find(
      (l): l is Extract<RenderLine, { kind: 'article' }> => l.kind === 'article',
    );
    expect(card?.key).toBe('11');
    expect(card?.keys).toEqual(['11', '12']);
    expect(card?.label).toBe('มาตรา 11 - มาตรา 12');
    expect(card?.href).toBe('/lawlib/national-education-act-2542#มาตรา-11');
    // jump rule covers EVERY member key
    expect(digestHasCard(view, '11')).toBe(true);
    expect(digestHasCard(view, '12')).toBe(true);
  });

  it('groups a merged มาตรา 70 - มาตรา 73 card into the บทเฉพาะกาล group (key = first member)', () => {
    const doc: DigestDoc = {
      title: 't',
      sections: [
        {
          heading: '4. มาตราสำคัญ',
          body: '**มาตรา 69** : สาระ\n### บทเฉพาะกาล\n**มาตรา 70 - มาตรา 73** : บทเฉพาะกาล\n**มาตรา 78** : สาระ',
          refs: [],
          hasSeeFull: false,
        },
      ],
    };
    const view = buildView(doc, new Map(), ACT_2542_CHAPTERS, [], OPTS);
    const section = view.sections[0];
    expect(section.groups?.map((g) => g.label)).toEqual([
      'หมวดที่ 9 เทคโนโลยีเพื่อการศึกษา',
      'บทเฉพาะกาล',
    ]);
    const last = section.groups![section.groups!.length - 1];
    expect(last.label).toBe('บทเฉพาะกาล');
    expect(last.articleCount).toBe(2); // cards, not member keys
    const keys = last.lines
      .filter((l): l is Extract<RenderLine, { kind: 'article' }> => l.kind === 'article')
      .map((l) => l.key);
    expect(keys).toEqual(['70', '78']);
  });
});
