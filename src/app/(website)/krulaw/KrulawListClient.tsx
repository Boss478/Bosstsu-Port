'use client';

/**
 * KruLAW — law list client (FR1 + SCRUTINY-L1-3 full-text promotion).
 *
 * Browse mode (empty query): laws grouped by ภาค → subject. Search mode:
 * metadata hits (title/code/subject/tags/definitionTerms) ranked FIRST, then
 * full-text hits over the built registry (lazy load-all, cached) with top-2
 * มาตรา snippets (clamped to วรรค boundaries — snippetWindow) deep-linking
 * to `/krulaw/<slug>#มาตรา-N`. Combined results capped at 20.
 *
 * The 'sample' fixture is preview-only: it NEVER appears in the list. An
 * index containing only the sample (or nothing at all) renders a distinct
 * "ยังไม่มีกฎหมายให้อ่าน" empty-library state — NOT the no-results copy.
 */

import { startTransition, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import SearchInput from '@/components/SearchInput';
import { EmptyState } from '@/components/EmptyState';
import {
  articleKeyOf,
  articleLabel,
  articlePlainText,
  flattenArticles,
  formatVerifiedAt,
} from '@/lib/krulaw-reader';
import { normalizeText } from '@/lib/krulaw/normalize';
import { snippetWindow } from '@/lib/krulaw/snippet';
import type { LawDoc } from '@/types/krulaw';

export interface KrulawIndexEntry {
  slug: string;
  code: string;
  titleTh: string;
  subject: string;
  part: 'ก' | 'ข';
  tags: string[];
  verifiedAt: string;
  editionCount: number;
  articleCount: number;
  definitionTerms: string[];
}

interface SubjectGroup {
  subject: string;
  laws: KrulawIndexEntry[];
}

interface PartGroup {
  part: 'ก' | 'ข';
  subjects: SubjectGroup[];
}

interface FullTextHit {
  articleKey: string;
  label: string;
  before: string;
  matched: string;
  after: string;
  ellipsisBefore: boolean;
  ellipsisAfter: boolean;
}

interface FullTextLawResult {
  slug: string;
  titleTh: string;
  code: string;
  hits: FullTextHit[];
}

const DEBOUNCE_MS = 180;
const MAX_RESULTS = 20;

/**
 * SDO part taxonomy (SCRUTINY-L4-1): ภาค ก = กฎหมาย-ข้าราชการที่ดี ·
 * ภาค ข = กฎหมายการศึกษา. The labels ARE the SDO subjects — not the
 * generic กฎหมายทั่วไป/กฎหมายเฉพาะ forms.
 */
const PART_LABELS: Record<'ก' | 'ข', string> = {
  ก: 'กฎหมาย-ข้าราชการที่ดี',
  ข: 'กฎหมายการศึกษา',
};

/** Registry load-all cache — each law JSON is imported once per session. */
const lawCache = new Map<string, LawDoc>();

async function loadBuiltLaws(slugs: string[]): Promise<LawDoc[]> {
  const missing = slugs.filter((s) => !lawCache.has(s));
  if (missing.length > 0) {
    const mod = await import('@/data/krulaw/registry');
    await Promise.all(
      missing.map(async (slug) => {
        if (!Object.hasOwn(mod.registry, slug)) return;
        try {
          lawCache.set(slug, await mod.registry[slug]!());
        } catch {
          // a broken law JSON must not kill the whole search
        }
      }),
    );
  }
  return slugs.flatMap((s) => (lawCache.has(s) ? [lawCache.get(s) as LawDoc] : []));
}

function searchLaws(docs: LawDoc[], q: string): FullTextLawResult[] {
  const out: FullTextLawResult[] = [];
  for (const doc of docs) {
    const hits: FullTextHit[] = [];
    for (const flat of flattenArticles(doc)) {
      const plain = articlePlainText(flat.article);
      // Query is lowercased by normalizeQuery — the source must be too, or a
      // Latin query ("unesco") misses uppercase content ("UNESCO"). Thai has
      // no case, and A–Z/a–z folding is code-unit 1:1, so the lowercased
      // index maps 1:1 back into the ORIGINAL plain — every slice below
      // (snippet window + <mark>) comes from `plain`, never plainLower.
      const plainLower = plain.toLowerCase();
      const idx = plainLower.indexOf(q);
      if (idx === -1) continue;
      const w = snippetWindow(plainLower, idx, q.length);
      hits.push({
        articleKey: articleKeyOf(flat.article),
        label: articleLabel(flat.article.no, flat.article.suffix),
        before: plain.slice(w.start, idx),
        matched: plain.slice(idx, idx + q.length),
        after: plain.slice(idx + q.length, w.end),
        ellipsisBefore: w.ellipsisBefore,
        ellipsisAfter: w.ellipsisAfter,
      });
      if (hits.length === 2) break;
    }
    if (hits.length > 0) {
      out.push({ slug: doc.slug, titleTh: doc.titleTh, code: doc.code, hits });
    }
  }
  return out;
}

function normalizeQuery(s: string): string {
  return normalizeText(s).toLowerCase();
}

export default function KrulawListClient({ laws }: { laws: KrulawIndexEntry[] }) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  /** Full-text results, tagged with the query they belong to (never stale). */
  const [fullTextFor, setFullTextFor] = useState<{
    q: string;
    results: FullTextLawResult[];
  }>({ q: '', results: [] });
  const [searching, setSearching] = useState(false);

  // The sample fixture is a local preview — never shown in the list.
  const visibleLaws = useMemo(() => laws.filter((law) => law.slug !== 'sample'), [laws]);

  // Debounce: searches only run after the user pauses typing.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  const q = normalizeQuery(debouncedQuery);

  const metaMatches = useMemo(() => {
    if (q === '') return visibleLaws;
    return visibleLaws.filter((law) =>
      [law.titleTh, law.code, law.subject, ...law.tags, ...law.definitionTerms].some((field) =>
        normalizeQuery(field).includes(q),
      ),
    );
  }, [visibleLaws, q]);

  // Full-text pass over laws NOT already matched by metadata (dedupe):
  // registry lazy load-all (cached) → articlePlainText scan → law-level
  // results with top-2 มาตรา snippets. State writes are deferred out of the
  // effect body (compiler rule) via startTransition; the .then/.catch
  // callbacks are external async completions and may setState directly.
  useEffect(() => {
    if (q === '') return; // browse mode — fullTextFor/searching are ignored
    const metaSlugs = new Set(metaMatches.map((m) => m.slug));
    const slugs = visibleLaws.filter((l) => !metaSlugs.has(l.slug)).map((l) => l.slug);
    let cancelled = false;
    if (slugs.length === 0) {
      startTransition(() => {
        setFullTextFor({ q, results: [] });
        setSearching(false);
      });
      return;
    }
    startTransition(() => setSearching(true));
    loadBuiltLaws(slugs)
      .then((docs) => {
        if (cancelled) return;
        setFullTextFor({ q, results: searchLaws(docs, q) });
        setSearching(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFullTextFor({ q, results: [] });
        setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [q, metaMatches, visibleLaws]);

  const groups = useMemo<PartGroup[]>(() => {
    const parts: PartGroup[] = [
      { part: 'ก', subjects: [] },
      { part: 'ข', subjects: [] },
    ];
    const byPart = new Map<'ก' | 'ข', Map<string, KrulawIndexEntry[]>>();
    for (const law of visibleLaws) {
      let subjects = byPart.get(law.part);
      if (subjects === undefined) {
        subjects = new Map();
        byPart.set(law.part, subjects);
      }
      const list = subjects.get(law.subject) ?? [];
      list.push(law);
      subjects.set(law.subject, list);
    }
    for (const part of parts) {
      const subjects = byPart.get(part.part);
      if (subjects === undefined) continue;
      part.subjects = [...subjects.entries()]
        .map(([subject, list]) => ({ subject, laws: list }))
        .sort((a, b) => a.subject.localeCompare(b.subject, 'th'));
    }
    return parts.filter((p) => p.subjects.length > 0);
  }, [visibleLaws]);

  // Distinct empty-library state: nothing built (or only the sample).
  if (visibleLaws.length === 0) {
    return (
      <EmptyState
        title="ยังไม่มีกฎหมายให้อ่าน"
        message="คลังกฎหมายกำลังอยู่ระหว่างการเตรียมเนื้อหา — โปรดรอการอัปเดต"
        icon="fi-sr-books"
      />
    );
  }

  const shownMeta = metaMatches.slice(0, MAX_RESULTS);
  const ft = fullTextFor.q === q ? fullTextFor.results : null;
  const shownFullText = (ft ?? []).slice(0, Math.max(0, MAX_RESULTS - shownMeta.length));
  const resultCount = shownMeta.length + shownFullText.length;
  const isSearching = q !== '' && searching;
  const noResults = resultCount === 0 && !isSearching;

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="ค้นหาชื่อกฎหมาย / คำสำคัญ / เนื้อหา…"
        />
        <p className="text-xs text-slate-600 dark:text-slate-400">
          {visibleLaws.length} ฉบับในคลัง
          {q !== '' && ` · ${noResults ? 'ไม่มีฉบับที่ตรง' : `${resultCount} ฉบับที่ตรง`}`}
        </p>
      </div>

      {q === '' ? (
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.part} aria-label={`ภาค ${group.part}`}>
              <h2 className="mb-4 text-lg font-bold leading-relaxed text-slate-800 dark:text-slate-100">
                ภาค {group.part}
                <span className="ml-2 text-sm font-normal text-slate-600 dark:text-slate-400">
                  {PART_LABELS[group.part]}
                </span>
              </h2>
              {group.subjects.map((subject) => (
                <div key={subject.subject} className="mb-6">
                  <h3 className="mb-2.5 text-sm font-semibold leading-relaxed text-slate-600 dark:text-slate-400">
                    {subject.subject}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {subject.laws.map((law) => (
                      <Link
                        key={law.slug}
                        href={`/krulaw/${law.slug}`}
                        className="group krulaw-list-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/60"
                      >
                        <h4 className="text-[15px] font-bold leading-relaxed text-slate-900 group-hover:text-blue-800 dark:text-slate-100 dark:group-hover:text-blue-300">
                          {law.titleTh}
                        </h4>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {law.code}
                        </p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {law.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                            >
                              {tag}
                            </span>
                          ))}
                          {law.definitionTerms.slice(0, 4).map((term) => (
                            <span
                              key={term}
                              className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1">
                            <i aria-hidden="true" className="fi fi-sr-layers text-[10px]" />
                            รวม {law.editionCount} ฉบับ
                          </span>
                          <span>{law.articleCount} มาตรา</span>
                          <span className="flex items-center gap-1">
                            <i aria-hidden="true" className="fi fi-sr-calendar text-[10px]" />
                            ตรวจสอบล่าสุด {formatVerifiedAt(law.verifiedAt)}
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      ) : noResults ? (
        <EmptyState
          title="ไม่พบกฎหมายที่ตรงกับคำค้น"
          message="ลองค้นด้วยคำอื่น เช่น ชื่อกฎหมาย หมวดหมู่ หรือบทนิยาม"
          icon="fi-sr-search"
        />
      ) : (
        <div className="space-y-4">
          {isSearching && (
            <p role="status" className="text-sm text-slate-600 dark:text-slate-400">
              กำลังค้นหาในเนื้อหาฉบับเต็ม…
            </p>
          )}
          {shownMeta.map((law) => (
            <Link
              key={law.slug}
              href={`/krulaw/${law.slug}`}
              className="group block krulaw-list-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/60"
            >
              <h4 className="text-[15px] font-bold leading-relaxed text-slate-900 group-hover:text-blue-800 dark:text-slate-100 dark:group-hover:text-blue-300">
                {law.titleTh}
              </h4>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">{law.code}</p>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {law.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Link>
          ))}
          {shownFullText.map((r) => (
            <Link
              key={`ft-${r.slug}`}
              href={`/krulaw/${r.slug}#มาตรา-${r.hits[0].articleKey}`}
              className="group block krulaw-list-card rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-[border-color,transform,box-shadow] hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-500/60"
            >
              <h4 className="text-[15px] font-bold leading-relaxed text-slate-900 group-hover:text-blue-800 dark:text-slate-100 dark:group-hover:text-blue-300">
                {r.titleTh}
              </h4>
              <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                {r.code} — ข้อความในเนื้อหา
              </p>
              <div className="mt-2.5 space-y-2">
                {r.hits.map((h) => (
                  <p
                    key={h.articleKey}
                    className="whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-[13px] leading-relaxed text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    <span className="font-semibold text-blue-700 dark:text-blue-300">
                      {h.label}:{' '}
                    </span>
                    {h.ellipsisBefore && '…'}
                    {h.before}
                    <mark className="rounded bg-amber-200/80 px-0.5 text-inherit dark:bg-amber-500/30">
                      {h.matched}
                    </mark>
                    {h.after}
                    {h.ellipsisAfter && '…'}
                  </p>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
