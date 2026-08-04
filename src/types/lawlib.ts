/**
 * LawLib — core data model (FROZEN at GATE 1 — changes need PM + senior sign-off).
 *
 * Produced by `parseLawMarkdown` (src/lib/lawlib/parser.ts), validated by
 * `validateLawDoc` (src/lib/lawlib/validate.ts), emitted as static JSON by
 * `npm run lawlib:build` (scripts/lawlib/build.ts).
 */

export interface LawDoc {
  slug: string;
  code: string;
  titleTh: string;
  subject: string;
  /** ภาค ก (general) | ภาค ข (specific) */
  part: 'ก' | 'ข';
  tags: string[];
  /** YYYY-MM-DD — the date a human verified the built JSON against the gazette text */
  verifiedAt: string;
  gazetteRef: string;
  editions: Array<{
    no: number;
    gazetteDate: string;
    effectiveDate: string;
    note: string;
  }>;
  /** NFC-normalized, unique terms, min term length 4 */
  definitions: Array<{ term: string; definition: string }>;
  chapters: Chapter[];
}

export interface Chapter {
  /** no = null → un-numbered chapter (บททั่วไป / บทเฉพาะกาล) */
  no: number | null;
  title: string;
  articles: Article[];
  /**
   * ส่วนที่ N nesting — articles under a section live in sections[].articles
   * (NOT articles[]); absent when the chapter has no sections.
   * no = null → section without a number; title may be empty.
   */
  sections?: Array<{ no: number | null; title: string; articles: Article[] }>;
}

export interface Article {
  no: number;
  /** 'ทวิ' | 'ตรี' | 'จัตวา' | 'เบญจ' | 'ฉ' | 'สัตต' | 'อัฏฐ' | 'นว' | '/1' ... */
  suffix?: string;
  text: ArticleToken[];
  amendedBy?: Array<{ editionNo: number; note: string }>;
  repealedParagraphs?: Array<{ paras: string; repealedBy: string; text: string }>;
}

export type ArticleToken =
  | { kind: 'text'; t: string } // NFC-normalized
  | {
      kind: 'ref';
      ref: {
        /** absent → same-law ref; present → cross-law ref (holds the law CODE verbatim) */
        lawSlug?: string;
        articleNo: number;
        articleSuffix?: string;
        display: string;
      };
    };
