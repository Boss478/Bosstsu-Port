/**
 * KruLAW — reader-core shared helpers (Wave 2, lane B2).
 *
 * Owned by the reader-core lane. NOT part of the frozen parser/validate
 * surface (`src/lib/krulaw/**` untouched) — everything here derives from the
 * frozen LawDoc model and is consumed by client components only
 * (ArticleView / LawTooltip / TocSidebar / KrulawReaderClient).
 */

import type { Article, Chapter, LawDoc } from '@/types/krulaw';
import { SHORT_TERM_ALLOWLIST } from '@/lib/krulaw/validate'; // TEMP-A/B

// ---------------------------------------------------------------------------
// Structure helpers
// ---------------------------------------------------------------------------

export interface FlatArticle {
  chapter: Chapter;
  section: { no: number | null; title: string; articles: Article[] } | null;
  article: Article;
}

/** '10' | '10ทวิ' | '10/1' — canonical article key (frozen contract). */
export function articleKeyOf(article: Pick<Article, 'no' | 'suffix'>): string {
  return `${article.no}${article.suffix ?? ''}`;
}

/** 'มาตรา 10' | 'มาตรา 10 ทวิ' | 'มาตรา 10/1' — display label. */
export function articleLabel(no: number, suffix?: string): string {
  return `มาตรา ${no}${suffix ? (suffix.startsWith('/') ? suffix : ` ${suffix}`) : ''}`;
}

/** Flatten chapters → articles INCLUDING section-nested articles. */
export function flattenArticles(law: LawDoc): FlatArticle[] {
  const out: FlatArticle[] = [];
  for (const chapter of law.chapters) {
    for (const article of chapter.articles) {
      out.push({ chapter, section: null, article });
    }
    for (const section of chapter.sections ?? []) {
      for (const article of section.articles) {
        out.push({ chapter, section, article });
      }
    }
  }
  return out;
}

/** Plain text of an article = tokens joined (text verbatim + ref displays). */
export function articlePlainText(article: Article): string {
  return article.text.map((tok) => (tok.kind === 'text' ? tok.t : tok.ref.display)).join('');
}

/** Exact (no + suffix) target lookup over ALL articles (flatten sections). */
export function findArticle(law: LawDoc, no: number, suffix?: string): Article | undefined {
  return flattenArticles(law)
    .map((f) => f.article)
    .find((a) => a.no === no && (a.suffix ?? undefined) === suffix);
}

export function findArticleByKey(law: LawDoc, key: string): FlatArticle | undefined {
  return flattenArticles(law).find((f) => articleKeyOf(f.article) === key);
}

// ---------------------------------------------------------------------------
// Glossary marking (FR3) — shared between ArticleView (marks) and the
// glossary panel jump (first occurrence). Text is NFC-normalized at build
// (NFR8) so matching is direct; terms are unique + NFC (validation rule 3).
// ---------------------------------------------------------------------------

export interface GlossaryTerm {
  term: string;
  definition: string;
}

/**
 * Terms eligible for marking: min length 4 EXCEPT SHORT_TERM_ALLOWLIST,
 * sorted longest-first (longest-match-first at any position).
 */
export function glossaryIndex(law: LawDoc): GlossaryTerm[] {
  return law.definitions
    .filter((d) => d.term.length >= 4 || SHORT_TERM_ALLOWLIST.some((t) => t === d.term))
    .map((d) => ({ term: d.term, definition: d.definition }))
    .sort((a, b) => b.term.length - a.term.length);
}

export interface TextSegment {
  text: string;
  term?: GlossaryTerm;
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Split one TEXT token into term / non-term segments. The combined
 * alternation is ordered longest-first, so at any position the longest
 * term wins (leftmost-longest). Residual risk: a term inside a longer
 * non-term word is marked anyway — accepted + documented in the plan.
 */
export function splitByTerms(text: string, terms: GlossaryTerm[]): TextSegment[] {
  if (terms.length === 0 || text === '') return [{ text }];
  const re = new RegExp(`(${terms.map((t) => escapeRegExp(t.term)).join('|')})`, 'g');
  const byTerm = new Map(terms.map((t) => [t.term, t]));
  const parts = text.split(re);
  const out: TextSegment[] = [];
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === '') continue;
    const term = i % 2 === 1 ? byTerm.get(part) : undefined;
    out.push({ text: part, term });
  }
  return out;
}

// ---------------------------------------------------------------------------
// verifiedAt display (FR — BE era). Dates are frozen BUILD-TIME strings
// (YYYY-MM-DD, Buddhist era context) — a CUSTOM string parser shifts the year
// +543 WITHOUT touching Date (new Date() would interpret as CE Gregorian and
// the year would land in the wrong era). Pure + SSR-safe.
// ---------------------------------------------------------------------------

const THAI_MONTHS = [
  'มกราคม',
  'กุมภาพันธ์',
  'มีนาคม',
  'เมษายน',
  'พฤษภาคม',
  'มิถุนายน',
  'กรกฎาคม',
  'สิงหาคม',
  'กันยายน',
  'ตุลาคม',
  'พฤศจิกายน',
  'ธันวาคม',
] as const;

/** '2026-08-03' → '3 สิงหาคม 2569'; unparseable input returns verbatim. */
export function formatVerifiedAt(verifiedAt: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(verifiedAt);
  if (m === null) return verifiedAt;
  const year = Number(m[1]) + 543;
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return verifiedAt;
  return `${day} ${THAI_MONTHS[month - 1]} ${year}`;
}

/** First article (document order) whose marked segments contain the exact term. */
export function firstTermArticleKey(law: LawDoc, term: string): string | null {
  const terms = glossaryIndex(law);
  const target = term.normalize('NFC');
  for (const flat of flattenArticles(law)) {
    for (const tok of flat.article.text) {
      if (tok.kind !== 'text') continue;
      if (splitByTerms(tok.t, terms).some((s) => s.term !== undefined && s.term.term === target)) {
        return articleKeyOf(flat.article);
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Cross-law lazy loading (FR5) — registry is the build-emitted static-literal
// map; lookups are cached in a module map (one law JSON at a time).
//
// Bridge: cross-law refs carry the AUTHORED law code verbatim (frozen type),
// while registry keys are SLUGS. build.ts emits `codeToSlug` (keyed by
// planned-laws.json `code` — the form authors write in [[…|code]]) so refs
// resolve to built laws; planned-but-unbuilt codes fall through to null →
// "ยังไม่เปิดให้อ่าน".
// ---------------------------------------------------------------------------

const crossLawCache = new Map<string, Promise<LawDoc | null>>();

/** Lazy-load a law by code via the registry; null on miss (planned-but-unbuilt). */
export function loadCrossLaw(lawCode: string): Promise<LawDoc | null> {
  const cached = crossLawCache.get(lawCode);
  if (cached !== undefined) return cached;
  const promise = import('@/data/krulaw/registry')
    .then((mod) => {
      // Own-property guards only — prototype-chain keys (e.g. 'constructor')
      // must never reach the registry (would crash calling a non-loader).
      const slug = Object.hasOwn(mod.codeToSlug, lawCode) ? mod.codeToSlug[lawCode] : lawCode;
      return Object.hasOwn(mod.registry, slug) ? (mod.registry[slug]?.() ?? null) : null;
    })
    .catch(() => null);
  crossLawCache.set(lawCode, promise);
  return promise;
}
