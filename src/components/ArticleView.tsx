'use client';

/**
 * KruLAW — article renderer (FR2/FR3/FR4/FR14 render layer).
 *
 * law JSON → React spans:
 *  (a) chapters/sections headings + articles in document order
 *  (b) tokens: text → span; ref → trigger span (role=button, tabIndex=0,
 *      aria-expanded, aria-haspopup) with the display text
 *  (c) glossary marks over TEXT tokens only (never ref displays): per-law
 *      term index (longest-match-first, min length 4 EXCEPT
 *      SHORT_TERM_ALLOWLIST); hover/tap → definition tooltip
 *  (d) highlight/note layer: char offsets into the article's PLAIN text →
 *      <mark>; note marker icon per article that has notes
 *  (e) repealed paragraphs: collapsed dimmed bullets, tap to reveal
 *  (f) the article header number is ALSO a trigger (own text + history when
 *      amended)
 *
 * Never dangerouslySetInnerHTML — all content renders as React nodes (NFR7).
 */

import { memo, useMemo, useState } from 'react';
import type { Article, LawDoc } from '@/types/krulaw';
import {
  articleKeyOf,
  articleLabel,
  articlePlainText,
  flattenArticles,
  glossaryIndex,
  splitByTerms,
  type GlossaryTerm,
} from '@/lib/krulaw-reader';
import { mergeHighlightRanges } from '@/lib/highlight-store';
import type { TooltipContent, TooltipTriggerHandlers } from '@/hooks/useLawTooltip';

export interface ArticleHighlight {
  articleKey: string;
  start: number;
  end: number;
}

interface ArticleViewProps {
  law: LawDoc;
  highlights: ArticleHighlight[];
  /** Articles that have at least one note → marker icon. */
  noteKeys: ReadonlySet<string>;
  /** Temporary jump highlight (FR2 deep links / jump box) — cleared by parent. */
  flashKey: string | null;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}

type Segment =
  | {
      kind: 'text';
      text: string;
      /** Char offset of this segment inside the article's PLAIN text. */
      offset: number;
      term?: GlossaryTerm;
      content?: TooltipContent;
    }
  | {
      kind: 'ref';
      ref: { lawSlug?: string; articleNo: number; articleSuffix?: string; display: string };
      content: TooltipContent;
    };

interface ArticleRender {
  key: string;
  article: Article;
  plain: string;
  headerContent: TooltipContent;
  segments: Segment[];
}

/** Apply merged highlight ranges to one text segment (offset-anchored). */
function renderHighlightedText(
  text: string,
  offset: number,
  ranges: Array<{ start: number; end: number }>,
): React.ReactNode {
  if (ranges.length === 0) return text;
  const len = text.length;
  const pieces: Array<{ s: number; e: number; hl: boolean }> = [];
  let cursor = 0;
  for (const r of ranges) {
    if (r.end <= offset || r.start >= offset + len) continue;
    const s = Math.max(r.start, offset);
    const e = Math.min(r.end, offset + len);
    if (s > cursor) pieces.push({ s: cursor, e: s, hl: false });
    pieces.push({ s, e, hl: true });
    cursor = e;
  }
  if (cursor < len) pieces.push({ s: cursor, e: len, hl: false });
  return pieces.map((p, i) =>
    p.hl ? (
      <mark key={i} className="rounded-sm bg-amber-300/70 px-0.5 text-inherit dark:bg-amber-400/30">
        {text.slice(p.s, p.e)}
      </mark>
    ) : (
      <span key={i}>{text.slice(p.s, p.e)}</span>
    ),
  );
}

/**
 * Article renderer — memoized: `law` / `highlights` / `noteKeys` / `flashKey`
 * change rarely (highlights only on add/remove), and `getTriggerProps` is a
 * stable callback from useLawTooltip — so re-renders are skipped when only the
 * reader's panel/tooltip chrome changes (KrulawReaderClient re-renders then).
 */
function ArticleView({
  law,
  highlights,
  noteKeys,
  flashKey,
  getTriggerProps,
  isTooltipOpen,
}: ArticleViewProps) {
  // --- per-law render model (memoized: segments + glossary marks + offsets) --
  const model = useMemo(() => {
    const terms = glossaryIndex(law);
    const byKey = new Map<string, ArticleRender>();
    for (const flat of flattenArticles(law)) {
      const article = flat.article;
      const key = articleKeyOf(article);
      const segments: Segment[] = [];
      let offset = 0;
      for (const tok of article.text) {
        if (tok.kind === 'text') {
          for (const s of splitByTerms(tok.t, terms)) {
            const content =
              s.term !== undefined
                ? ({ kind: 'glossary', term: s.term.term, definition: s.term.definition } as const)
                : undefined;
            segments.push({ kind: 'text', text: s.text, offset, term: s.term, content });
            offset += s.text.length;
          }
        } else {
          segments.push({
            kind: 'ref',
            ref: tok.ref,
            content: {
              kind: 'ref',
              lawSlug: tok.ref.lawSlug,
              articleNo: tok.ref.articleNo,
              articleSuffix: tok.ref.articleSuffix,
              display: tok.ref.display,
            },
          });
          offset += tok.ref.display.length;
        }
      }
      const render: ArticleRender = {
        key,
        article,
        plain: articlePlainText(article),
        headerContent: {
          kind: 'ref',
          articleNo: article.no,
          articleSuffix: article.suffix,
          display: articleLabel(article.no, article.suffix),
        },
        segments,
      };
      byKey.set(key, render);
    }
    return { byKey };
  }, [law]);

  // --- highlight ranges: group by article → clamp+merge (shared core) -------
  const highlightRanges = useMemo(() => {
    const grouped = new Map<string, Array<{ start: number; end: number }>>();
    for (const h of highlights) {
      const entry = model.byKey.get(h.articleKey);
      if (entry === undefined) continue;
      const list = grouped.get(h.articleKey) ?? [];
      list.push({ start: h.start, end: h.end });
      grouped.set(h.articleKey, list);
    }
    const out = new Map<string, Array<{ start: number; end: number }>>();
    for (const [key, list] of grouped) {
      const entry = model.byKey.get(key);
      if (entry === undefined) continue;
      out.set(key, mergeHighlightRanges(entry.plain, list));
    }
    return out;
  }, [highlights, model]);

  // --- repealed paragraph reveal state (per article + index) ----------------
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set());
  const toggleRevealed = (id: string) => {
    setRevealed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Reduced motion: skip the flash ring entirely and let the global CSS media
  // query kill the transition/scroll smoothing (client-only tree — safe read).
  const reducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Dynamic heading level: h3 for chapter-level articles, h4 inside ส่วนที่. */
  const renderArticle = (render: ArticleRender | undefined, level: 3 | 4): React.ReactNode => {
    if (render === undefined) return null;
    const { article, key } = render;
    const ranges = highlightRanges.get(key) ?? [];
    const hasNotes = noteKeys.has(key);
    const isFlash = flashKey === key && !reducedMotion;
    const Heading = level === 3 ? 'h3' : 'h4';

    return (
      <article
        key={key}
        id={`มาตรา-${key}`}
        data-krulaw-article={key}
        className={`krulaw-article scroll-mt-20 rounded-xl px-1 py-3 transition-colors duration-500 ${
          isFlash
            ? 'bg-amber-50 ring-2 ring-amber-300 dark:bg-amber-950/30 dark:ring-amber-500/50'
            : ''
        }`}
      >
        <Heading className="mb-1.5 flex items-center gap-2">
          <span
            role="button"
            tabIndex={0}
            aria-expanded={isTooltipOpen(render.headerContent)}
            aria-haspopup="true"
            data-krulaw-trigger
            className="inline-flex cursor-pointer items-center rounded-lg font-bold text-blue-800 underline decoration-dotted decoration-blue-400/70 underline-offset-4 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/40"
            {...getTriggerProps(render.headerContent)}
          >
            {articleLabel(article.no, article.suffix)}
          </span>
          {hasNotes && (
            <i
              aria-label="มีบันทึก"
              title="มีบันทึก"
              className="fi fi-sr-note-sticky text-xs text-amber-600 dark:text-amber-400"
            />
          )}
        </Heading>

        <div
          data-krulaw-body
          data-krulaw-article={key}
          className="space-y-2 whitespace-pre-line text-slate-800 dark:text-slate-200"
        >
          {render.segments.map((seg, i) =>
            seg.kind === 'text' ? (
              seg.term !== undefined && seg.content !== undefined ? (
                <span
                  key={i}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isTooltipOpen(seg.content)}
                  aria-haspopup="true"
                  data-krulaw-trigger
                  data-krulaw-term={seg.term.term}
                  className="cursor-pointer rounded-sm border-b-2 border-dashed border-amber-400/80 font-medium text-amber-800 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-500/60 dark:text-amber-300 dark:hover:bg-amber-950/40"
                  {...getTriggerProps(seg.content)}
                >
                  {renderHighlightedText(seg.text, seg.offset, ranges)}
                </span>
              ) : (
                <span key={i}>{renderHighlightedText(seg.text, seg.offset, ranges)}</span>
              )
            ) : (
              <span
                key={i}
                role="button"
                tabIndex={0}
                aria-expanded={isTooltipOpen(seg.content)}
                aria-haspopup="true"
                data-krulaw-trigger
                className="cursor-pointer font-medium text-blue-700 underline decoration-dotted underline-offset-4 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/40"
                {...getTriggerProps(seg.content)}
              >
                {seg.ref.display}
              </span>
            ),
          )}
        </div>

        {article.repealedParagraphs !== undefined && article.repealedParagraphs.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {article.repealedParagraphs.map((rp, i) => {
              const id = `${key}:${i}`;
              const open = revealed.has(id);
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => toggleRevealed(id)}
                    aria-expanded={open}
                    className="krulaw-repealed w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-1.5 text-left text-xs leading-relaxed text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-400 dark:hover:text-slate-300"
                  >
                    <span className="flex items-center gap-1.5 font-medium">
                      <i
                        aria-hidden="true"
                        className={`fi fi-sr-angle-small-down text-[10px] transition-transform ${
                          open ? 'rotate-180' : ''
                        }`}
                      />
                      {rp.paras} — ถูกยกเลิกโดย {rp.repealedBy}
                    </span>
                    {/* Always in the DOM (print shows it regardless of expand
                        state); Tailwind `hidden` keeps it off-screen + out of
                        the a11y tree when collapsed (print CSS overrides). */}
                    <span
                      className={`krulaw-repealed-text mt-1.5 block whitespace-pre-line text-slate-600 dark:text-slate-300 ${
                        open ? '' : 'hidden'
                      }`}
                    >
                      {rp.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-2">
      {law.chapters.map((chapter, ci) => (
        <section
          key={ci}
          aria-label={`${chapter.no !== null ? `หมวด ${chapter.no} ` : ''}${chapter.title}`}
          className="krulaw-chapter"
        >
          <h2 className="mb-4 mt-8 flex flex-wrap items-baseline gap-x-2 text-xl font-bold leading-relaxed text-slate-900 first:mt-0 dark:text-white">
            {chapter.no !== null && (
              <span className="text-blue-700 dark:text-blue-300">หมวด {chapter.no}</span>
            )}
            <span>{chapter.title}</span>
          </h2>

          {chapter.articles.map((a) => renderArticle(model.byKey.get(articleKeyOf(a)), 3))}

          {chapter.sections?.map((section, si) => (
            <div key={si} className="mt-6">
              {(section.no !== null || section.title !== '') && (
                <h3 className="mb-3 flex flex-wrap items-baseline gap-x-2 text-lg font-semibold leading-relaxed text-slate-800 dark:text-slate-100">
                  {section.no !== null && (
                    <span className="text-blue-700/80 dark:text-blue-300/80">
                      ส่วนที่ {section.no}
                    </span>
                  )}
                  {section.title !== '' && <span>{section.title}</span>}
                </h3>
              )}
              {section.articles.map((a) => renderArticle(model.byKey.get(articleKeyOf(a)), 4))}
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

export default memo(ArticleView);
