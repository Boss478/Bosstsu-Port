import { describe, it, expect } from 'vitest';
import {
  articleKey,
  articlePlainText,
  buildCitation,
  copyText,
  copyArticle,
  printArticle,
  printLaw,
} from '@/lib/copy-print';
import { LawDocSchema } from '@/lib/lawlib/validate';
import type { Article, LawDoc } from '@/types/lawlib';
import sampleLawRaw from '@/data/lawlib/laws/sample.json';

// ---------------------------------------------------------------------------
// Fixture: the BUILT sample law JSON (src/data/lawlib/laws/sample.json) —
// exactly what the reader ships to the client. Doubles as a schema-validity
// pin for the build output.
// ---------------------------------------------------------------------------

const sampleLaw = sampleLawRaw as unknown as LawDoc;

const syntheticArticle = (overrides: Partial<Article>): Article => ({
  no: 99,
  text: [{ kind: 'text', t: 'บทความสังเคราะห์' }],
  ...overrides,
});

describe('sample.json fixture', () => {
  it('is a schema-valid LawDoc with chapters and definitions', () => {
    expect(LawDocSchema.safeParse(sampleLaw).success).toBe(true);
    expect(sampleLaw.chapters.length).toBeGreaterThan(0);
    expect(sampleLaw.definitions.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// articleKey — frozen contract: `${no}${suffix ?? ''}`
// ---------------------------------------------------------------------------

describe('articleKey', () => {
  it('is the bare number for a plain article', () => {
    expect(articleKey(sampleLaw.chapters[0].articles[0])).toBe('1'); // มาตรา 1
  });

  it('appends a Thai suffix WITHOUT a space (10ทวิ)', () => {
    const art = sampleLaw.chapters[1].articles.find((a) => a.suffix === 'ทวิ');
    expect(art).toBeDefined();
    expect(articleKey(art!)).toBe('10ทวิ');
  });

  it('appends a /N suffix verbatim (10/1)', () => {
    const art = sampleLaw.chapters[1].articles.find((a) => a.suffix === '/1');
    expect(art).toBeDefined();
    expect(articleKey(art!)).toBe('10/1');
  });

  it('omits the suffix when undefined', () => {
    expect(articleKey(syntheticArticle({ no: 42 }))).toBe('42');
  });
});

// ---------------------------------------------------------------------------
// articlePlainText — tokens joined verbatim; ref tokens contribute their
// display string; multi-วรรค = '\n' separator text-tokens between วรรค
// blocks (SCRUTINY-L1 — see parser pins).
// ---------------------------------------------------------------------------

describe('articlePlainText', () => {
  it('joins text tokens with ref displays (same-law ref mid-sentence)', () => {
    const art2 = sampleLaw.chapters[0].articles[1]; // text + [[มาตรา 10]]
    expect(articlePlainText(art2)).toBe(
      'ให้รัฐมนตรีว่าการกระทรวงศึกษาธิการรักษาการตามพระราชบัญญัตินี้ และให้มีอำนาจออกกฎกระทรวงกำหนดหลักเกณฑ์ตามมาตรา 10',
    );
  });

  it('renders cross-law ref displays inline (แห่ง auto-inserted)', () => {
    const art3 = sampleLaw.chapters[0].articles[2]; // text + cross-law ref + text
    expect(articlePlainText(art3)).toBe(
      'ผู้ใดฝ่าฝืนมาตรา 5 แห่งพ.ร.บ.ข้าราชการครูฯ 2547ต้องระวางโทษจำคุก',
    );
  });

  it("keeps the '\\n' separator between วรรค blocks (was run-on; SCRUTINY-L1 flip)", () => {
    const multiPara = syntheticArticle({
      text: [
        { kind: 'text', t: 'วรรคแรกของมาตรานี้' },
        { kind: 'text', t: '\n' },
        { kind: 'text', t: 'วรรคสองของมาตรานี้' },
      ],
    });
    expect(articlePlainText(multiPara)).toBe('วรรคแรกของมาตรานี้\nวรรคสองของมาตรานี้');
  });

  it('returns the ref display alone for a ref-only article', () => {
    const refOnly = syntheticArticle({
      text: [{ kind: 'ref', ref: { articleNo: 5, display: 'มาตรา 5' } }],
    });
    expect(articlePlainText(refOnly)).toBe('มาตรา 5');
  });
});

// ---------------------------------------------------------------------------
// buildCitation — exact shape: `${plain}\n\n— ${code} มาตรา ${key}`
// ---------------------------------------------------------------------------

describe('buildCitation', () => {
  it('produces the exact copy payload for a plain article', () => {
    const art1 = sampleLaw.chapters[0].articles[0];
    expect(buildCitation(art1, { code: sampleLaw.code })).toBe(
      `พระราชบัญญัตินี้เรียกว่า “พระราชบัญญัติตัวอย่างการศึกษา พ.ศ. 2550”\n\n— พ.ร.บ.ตัวอย่างการศึกษา 2550 มาตรา 1`,
    );
  });

  it('uses the spaced article label (มาตรา 10 ทวิ) in the citation line', () => {
    const art = sampleLaw.chapters[1].articles.find((a) => a.suffix === 'ทวิ')!;
    expect(buildCitation(art, { code: sampleLaw.code })).toBe(
      `ให้สถานศึกษาจัดการศึกษาโดยคำนึงถึงประโยชน์ของผู้เรียนเป็นสำคัญ\n\n— พ.ร.บ.ตัวอย่างการศึกษา 2550 มาตรา 10 ทวิ`,
    );
  });

  it('takes the code from the law argument, not the article', () => {
    const art1 = sampleLaw.chapters[0].articles[0];
    expect(buildCitation(art1, { code: 'กฎหมายอื่น 2569' })).toContain('— กฎหมายอื่น 2569 มาตรา 1');
  });

  it('preserves วรรค newlines in the copy payload (SCRUTINY-L1: L1-1 citation fix)', () => {
    const multi = syntheticArticle({
      text: [
        { kind: 'text', t: 'วรรคแรกของมาตรานี้' },
        { kind: 'text', t: '\n' },
        { kind: 'text', t: 'วรรคสองของมาตรานี้' },
      ],
    });
    expect(buildCitation(multi, { code: 'พ.ร.บ.ทดสอบ 2569' })).toBe(
      'วรรคแรกของมาตรานี้\nวรรคสองของมาตรานี้\n\n— พ.ร.บ.ทดสอบ 2569 มาตรา 99',
    );
  });
});

// ---------------------------------------------------------------------------
// SSR guards — all DOM access is window-guarded; in Node these resolve
// false / no-op instead of throwing (pure helpers are SSR-safe).
// ---------------------------------------------------------------------------

describe('browser-only functions — SSR guards', () => {
  const art1 = sampleLaw.chapters[0].articles[0];

  it('copyText resolves false when document is undefined (Node)', async () => {
    await expect(copyText('ข้อความ')).resolves.toBe(false);
  });

  it('copyArticle resolves false in Node (no clipboard, no document)', async () => {
    await expect(copyArticle(art1, { code: sampleLaw.code })).resolves.toBe(false);
  });

  it('printArticle is a no-op that does not throw in Node', () => {
    expect(() => printArticle(art1, { code: sampleLaw.code })).not.toThrow();
  });

  it('printLaw is a no-op that does not throw in Node', () => {
    expect(() => printLaw(sampleLaw)).not.toThrow();
  });
});
