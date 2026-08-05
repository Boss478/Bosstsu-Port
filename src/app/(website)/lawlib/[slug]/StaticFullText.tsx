/**
 * StaticFullText — crawler/no-JS full-text region (FR9, rev 5.5).
 *
 * Server-rendered mirror of the law's full text for digest-bearing pages:
 * the reader client is `ssr:false` (initial HTML = skeleton) AND the app
 * defaults to COMPACT — without this region the full law text would never
 * reach crawlers. Rendered AFTER the reader shell in page.tsx JSX
 * (incremental parsing paints the skeleton first).
 *
 * HARD RULES (loop-2/3/5 findings):
 *  - NO `id` attributes and NO `data-*` attributes anywhere (the app owns
 *    `id="มาตรา-…"` and `data-lawlib-*` exclusively — duplicates would break
 *    scroll/deep links and the FR14 selection handler);
 *  - NO interactive roles (plain headings/paragraphs; ArticleView's
 *    role="button" headers are NOT copied);
 *  - heading outline: h2 chapters / h3 ส่วนที่ / h4 มาตรา labels — single h1
 *    on the page stays the law title;
 *  - hidden via CSS (`.lawlib-static-full { display:none }` — display:none
 *    content IS indexed per Google's hidden-content policy; revealed to no-JS
 *    users via `@media (scripting: none)`); excluded from print.
 *
 * Plain-text rendering of ArticleToken streams: text tokens verbatim, ref
 * tokens as their display label (e.g. 'มาตรา 10') — no links, no tooltips.
 */

import type { Article, ArticleToken, Chapter, LawDoc } from '@/types/lawlib';

/** 'มาตรา 10' | 'มาตรา 10 ทวิ' | 'มาตรา 10/1' — plain article label. */
function articleLabel(no: number, suffix?: string): string {
  return `มาตรา ${no}${suffix ? (suffix.startsWith('/') ? suffix : ` ${suffix}`) : ''}`;
}

/** ArticleToken[] → plain text (refs become their display labels). */
function plainText(tokens: ArticleToken[]): string {
  let out = '';
  for (const tok of tokens) {
    if (tok.kind === 'text') out += tok.t;
    else out += tok.ref.display;
  }
  return out;
}

/** One มาตรา block: h4 label + paragraphs (+ repealed paragraphs). */
function ArticleBlock({ article }: { article: Article }) {
  const body = plainText(article.text).trim();
  const repealed = article.repealedParagraphs ?? [];
  return (
    <>
      <h4 className="mt-5 font-bold">{articleLabel(article.no, article.suffix)}</h4>
      {body !== '' && <p className="mt-1">{body}</p>}
      {repealed.map((r, i) => (
        <p key={i} className="mt-1">
          {r.paras !== '' ? `${r.paras} — ` : ''}
          {r.text}
        </p>
      ))}
    </>
  );
}

/** One chapter: h2 + (optional ส่วนที่ h3 groups) + มาตรา blocks. */
function ChapterBlock({ chapter }: { chapter: Chapter }) {
  const sections = chapter.sections ?? [];
  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold">{chapter.title}</h2>
      {sections.length > 0
        ? sections.map((sec, i) => (
            <section key={i} className="mt-4">
              {sec.title !== '' && <h3 className="font-bold">{sec.title}</h3>}
              {sec.articles.map((a) => (
                <ArticleBlock key={`${a.no}${a.suffix ?? ''}`} article={a} />
              ))}
            </section>
          ))
        : chapter.articles.map((a) => (
            <ArticleBlock key={`${a.no}${a.suffix ?? ''}`} article={a} />
          ))}
    </section>
  );
}

export default function StaticFullText({ law }: { law: LawDoc }) {
  return (
    <section className="lawlib-static-full" aria-hidden="true">
      {law.chapters.map((ch, i) => (
        <ChapterBlock key={i} chapter={ch} />
      ))}
    </section>
  );
}
