'use client';

/**
 * LawLib — in-law article search (FR6).
 *
 * Controlled leaf: takes the law's flattened articles + an onJump callback.
 * Query normalization reuses `normalizeText` (Thai digits ๐-๙ → 0-9, NFC,
 * whitespace collapse + trim). Matching is normalized-substring over each
 * article's PLAIN text; the snippet highlights the matched term with safe
 * spans (never dangerouslySetInnerHTML). Clicking a result calls
 * `onJump(articleKey)`.
 *
 * NOTE on offsets: built content is already NFC + Thai-digit normalized, so
 * `plain === normalizeText(plain)` and match indices align 1:1 (the
 * per-keystroke normalize of `plain` is dropped — it would be a no-op).
 *
 * The query input is debounced (~180ms) so the per-keystroke scan over the
 * law's articles only runs after the user pauses typing.
 *
 * Snippets are clamped to วรรค boundaries (snippetWindow — plain text has
 * '\n' at วรรค separators) and rendered with whitespace-pre-line so the
 * '\n' shows as line breaks (SCRUTINY-L2).
 */
import { useEffect, useMemo, useState } from 'react';
import type { DigestSearchLine, SearchPanelProps } from '@/app/(website)/lawlib/lib/reader-props';
import { normalizeText } from '@/lib/lawlib/normalize';
import { articleLabel } from '@/lib/lawlib-reader';
import { articleKey, articlePlainText } from '@/lib/copy-print';
import { snippetWindow } from '@/lib/lawlib/snippet';

const DEBOUNCE_MS = 180;

interface Match {
  articleKey: string;
  plain: string;
  label: string;
  start: number;
  end: number;
}

/** First normalized-substring match in the article's plain text. */
function findMatch(plain: string, normQuery: string): { start: number; end: number } | null {
  const idx = plain.indexOf(normQuery);
  if (idx === -1) return null;
  return { start: idx, end: idx + normQuery.length };
}

export function SearchPanel({ articles, onJump, digestLines, onDigestLineJump }: SearchPanelProps) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce: results only recompute after the user pauses typing.
  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  // Plain text + display label per article (stable — static content).
  const byKey = useMemo(() => {
    const map = new Map<string, { plain: string; label: string }>();
    for (const a of articles) {
      map.set(articleKey(a), { plain: articlePlainText(a), label: articleLabel(a.no, a.suffix) });
    }
    return map;
  }, [articles]);

  // ─── Quick-jump (ADR-019 D7 — พิมพ์เลขมาตรา → ข้ามไป): a query that is
  //     JUST a number (Thai digits normalize via normalizeText) or
  //     "มาตรา N" becomes a direct jump — "32" → มาตรา 32. Parsed from the
  //     RAW query (the Enter key must work before the 180ms debounce);
  //     non-existent numbers get a helpful error instead of "no results".
  const jumpTarget = useMemo(() => {
    const q = normalizeText(query);
    const m = /^(?:มาตรา)?\s*(\d{1,3})$/.exec(q);
    if (m === null) return null;
    const no = Number(m[1]);
    const hit = articles.find((a) => a.no === no && (a.suffix === undefined || a.suffix === ''));
    return hit !== undefined ? { no, key: articleKey(hit) } : { no, key: null };
  }, [articles, query]);

  const normQuery = normalizeText(debouncedQuery);

  const results = useMemo<Match[]>(() => {
    if (normQuery.length === 0) return [];
    const matches: Match[] = [];
    for (const [key, { plain, label }] of byKey) {
      const m = findMatch(plain, normQuery);
      if (m) matches.push({ articleKey: key, plain, label, ...m });
    }
    return matches;
  }, [byKey, normQuery]);

  // Digest summary-line matches — COMPACT only (digestLines prop present).
  const digestResults = useMemo(() => {
    if (normQuery.length === 0 || digestLines === undefined) return [];
    const matches: DigestSearchLine[] = [];
    for (const line of digestLines) {
      if (normalizeText(line.text).includes(normQuery)) matches.push(line);
    }
    return matches;
  }, [digestLines, normQuery]);

  const hasDigestGroup = digestLines !== undefined;

  return (
    <section className="lawlib-panel flex flex-col overflow-hidden" aria-label="ค้นหามาตรา">
      <div className="border-b border-slate-200 px-4 py-3 dark:border-slate-700">
        <label htmlFor="lawlib-search-input" className="sr-only">
          ค้นหามาตรา
        </label>
        <div className="relative">
          <i
            aria-hidden="true"
            className="fi fi-sr-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400 dark:text-zinc-500"
          />
          <input
            id="lawlib-search-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              // Enter with a quick-jump target jumps immediately (the
              // debounce would otherwise swallow the keystroke).
              if (e.key === 'Enter' && jumpTarget !== null && jumpTarget.key !== null) {
                e.preventDefault();
                onJump(jumpTarget.key);
              }
            }}
            placeholder="ค้นหาข้อความในมาตรา เช่น เงินกู้ หรือ มาตรา 10"
            className="w-full min-h-11 rounded-full border border-slate-200 bg-white/60 py-2 pl-9 pr-4 text-sm text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-md dark:border-slate-700 dark:bg-slate-800/60 dark:text-zinc-200 dark:placeholder:text-zinc-500"
          />
        </div>
        {/* Quick-jump row (ADR-019 D7) — a pure มาตรา number jumps directly. */}
        {jumpTarget !== null &&
          (jumpTarget.key !== null ? (
            <button
              type="button"
              onClick={() => onJump(jumpTarget.key as string)}
              className="mt-2 flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 text-sm font-semibold text-blue-800 transition-colors hover:border-blue-400 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-500/50 dark:bg-blue-950/50 dark:text-blue-200"
            >
              ข้ามไป มาตรา {jumpTarget.no}
              <i aria-hidden="true" className="fi fi-sr-arrow-small-right text-xs" />
            </button>
          ) : (
            <p
              role="status"
              className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200"
            >
              ไม่พบมาตรา {jumpTarget.no} ในกฎหมายฉบับนี้ — ลองพิมพ์คำค้นแทน
            </p>
          ))}
        {normQuery.length > 0 && (
          <p role="status" className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
            {results.length === 0 && digestResults.length === 0
              ? 'ไม่พบผลการค้นหา'
              : hasDigestGroup
                ? `พบ ${results.length} มาตรา, ${digestResults.length} รายการในเวอร์ชันย่อ`
                : `พบ ${results.length} มาตรา`}
          </p>
        )}
      </div>

      {normQuery.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          พิมพ์คำค้นเพื่อค้นหามาตราในกฎหมายฉบับนี้
        </p>
      ) : results.length === 0 && digestResults.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          ไม่พบผลการค้นหา{' '}
          <span className="font-medium text-zinc-700 dark:text-zinc-200">“{normQuery}”</span>
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {results.length > 0 && (
            <ul className="divide-y divide-slate-200 dark:divide-slate-700">
              {results.map((r) => {
                const w = snippetWindow(r.plain, r.start, r.end - r.start);
                const before = r.plain.slice(w.start, r.start);
                const matched = r.plain.slice(r.start, r.end);
                const after = r.plain.slice(r.end, w.end);
                return (
                  <li key={r.articleKey}>
                    <button
                      type="button"
                      onClick={() => onJump(r.articleKey)}
                      className="block w-full px-4 py-3 text-left transition-colors hover:bg-blue-50/70 focus:outline-none focus-visible:bg-blue-50/70 dark:hover:bg-slate-800/70 dark:focus-visible:bg-slate-800/70"
                    >
                      <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
                        {r.label}
                      </span>
                      <span className="mt-0.5 block whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {w.ellipsisBefore && '…'}
                        {before}
                        {matched.length > 0 ? (
                          <mark className="rounded bg-amber-200/80 px-0.5 text-inherit dark:bg-amber-500/30">
                            {matched}
                          </mark>
                        ) : (
                          matched
                        )}
                        {after}
                        {w.ellipsisAfter && '…'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {hasDigestGroup && digestResults.length > 0 && (
            <div
              role="group"
              aria-labelledby="lawlib-digest-group-label"
              className="border-t border-slate-200 dark:border-slate-700"
            >
              <h3
                id="lawlib-digest-group-label"
                className="px-4 pb-1 pt-3 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
              >
                ในเวอร์ชันย่อ
              </h3>
              <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                {digestResults.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => onDigestLineJump?.(r.id)}
                      aria-label={`ในเวอร์ชันย่อ — ${r.section} — ${r.text}`}
                      className="block w-full px-4 py-3 text-left transition-colors hover:bg-blue-50/70 focus:outline-none focus-visible:bg-blue-50/70 dark:hover:bg-slate-800/70 dark:focus-visible:bg-slate-800/70"
                    >
                      <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                        {r.section}
                      </span>
                      <span className="mt-0.5 block whitespace-pre-line text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {r.text.slice(0, 96)}
                        {r.text.length > 96 && '…'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
