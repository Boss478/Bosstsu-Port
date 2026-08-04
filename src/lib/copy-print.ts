/**
 * KruLAW — copy & print helpers (FR12/FR13).
 *
 * FR13: print output is PLAIN LAW TEXT ONLY — no highlights, notes, tooltips,
 * or navigation chrome. Both `printArticle` and `printLaw` build a fresh,
 * self-contained print document from the LawDoc directly, so nothing
 * interactive can leak in. The print doc embeds Sarabun Regular as an
 * inlined base64 woff2 (NFR1 — no CDN font in print output; L1-4).
 *
 * All DOM access is window-guarded; the pure helpers (`articlePlainText`,
 * `articleKey`, `buildCitation`, `lawPrintMarkup`) are SSR-safe.
 */
import type { Article, LawDoc } from '@/types/krulaw';
import { articleKeyOf, articleLabel, articlePlainText } from '@/lib/krulaw-reader';

// Single source of truth lives in `lib/krulaw-reader.ts`; these aliases keep
// copy-print's historical public API stable (SearchPanel + reader core import
// them from here).
/** Article key — `${no}${suffix ?? ''}` (frozen contract). */
export const articleKey = articleKeyOf;
export { articlePlainText };

/**
 * FR12 — copy payload: article plain text + citation line.
 * `${plainText}\n\n— ${law.code} ${articleLabel(no, suffix)}`
 * (articleLabel gives the spaced form — 'มาตรา 10 ทวิ', never 'มาตรา 10ทวิ'.)
 */
export function buildCitation(article: Article, law: { code: string }): string {
  return `${articlePlainText(article)}\n\n— ${law.code} ${articleLabel(article.no, article.suffix)}`;
}

/** Copy plain text with the modern async API, falling back to execCommand. */
export async function copyText(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || typeof document === 'undefined') return false;
  try {
    if (typeof navigator.clipboard?.writeText === 'function') {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Secure-context/unavailable clipboard → legacy fallback below.
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/** FR12 — copy an article (plain text + citation). Resolves true on success. */
export async function copyArticle(article: Article, law: { code: string }): Promise<boolean> {
  return copyText(buildCitation(article, law));
}

/** Escape HTML in law text before embedding in a print document. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Chapter-level markup for a whole-law print doc (page break per หมวด). */
function chapterPrintHtml(chapters: LawDoc['chapters']): string {
  return chapters
    .map((ch) => {
      const heading =
        ch.no === null ? escapeHtml(ch.title) : `หมวด ${ch.no} ${escapeHtml(ch.title)}`;
      const articleHtml = (articles: Article[]): string =>
        articles
          .map((a) => {
            const paragraphs = articlePlainText(a).split('\n');
            const body = paragraphs
              .map((p) => `<p class="krulaw-article-text">${escapeHtml(p)}</p>`)
              .join('');
            return `<div class="krulaw-article"><p class="krulaw-article-no">${escapeHtml(articleLabel(a.no, a.suffix))}</p>${body}</div>`;
          })
          .join('');
      const sections = (ch.sections ?? [])
        .map((s) => {
          const sectionTitle =
            s.title.length > 0
              ? `<h3 class="krulaw-section">${s.no === null ? escapeHtml(s.title) : `ส่วนที่ ${s.no} ${escapeHtml(s.title)}`}</h3>`
              : '';
          return `${sectionTitle}${articleHtml(s.articles)}`;
        })
        .join('');
      return `<section class="krulaw-chapter"><h2 class="krulaw-chapter-title">${heading}</h2>${articleHtml(ch.articles)}${sections}</section>`;
    })
    .join('');
}

/**
 * FR13 — whole-law print document (HTML string). Plain law text only:
 * title header + chapters (page break per หมวด) + articles. Suitable for a
 * print window/iframe or an in-app `sr-only`-style print root.
 */
export function lawPrintMarkup(law: LawDoc): string {
  return `
    <header class="krulaw-law-header">
      <h1 class="krulaw-law-title">${escapeHtml(law.titleTh)}</h1>
      <p class="krulaw-law-meta">${escapeHtml(law.subject)} · ประกาศราชกิจจานุเบกษา ${escapeHtml(law.gazetteRef)}</p>
    </header>
    ${chapterPrintHtml(law.chapters)}
  `;
}

/** Minimal self-contained HTML doc — Sarabun inlined (base64 woff2, NFR1),
 *  print CSS inline. The font data URI is passed in: printArticle/printLaw
 *  load it lazily so the ~41KB stays out of the reader bundle. */
function buildPrintDoc(title: string, bodyHtml: string, sarabunFont: string): string {
  return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @font-face {
    font-family: 'Sarabun';
    src: url(${sarabunFont}) format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  * { box-sizing: border-box; }
  body { font-family: 'Sarabun', 'Noto Sans Thai', Tahoma, sans-serif; color: #111827; margin: 0; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 16px; margin: 0 0 12px; }
  h3 { font-size: 14px; margin: 12px 0 8px; }
  .krulaw-law-meta { font-size: 12px; color: #4b5563; margin: 0 0 16px; }
  .krulaw-chapter { break-before: page; }
  .krulaw-chapter:first-of-type { break-before: auto; }
  .krulaw-article { break-inside: avoid; margin: 0 0 10px; }
  .krulaw-article-no { font-weight: 600; margin: 0; }
  .krulaw-article-text { margin: 0; }
  .krulaw-source { margin-top: 16px; font-size: 12px; color: #4b5563; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>${bodyHtml}</body>
</html>`;
}

/**
 * Sarabun Regular woff2 as a data URI — generated + committed module
 * (sarabun-regular-b64.ts), loaded lazily by printArticle/printLaw so the
 * ~41KB never enters the reader bundle (dynamic import = own chunk).
 */
async function loadSarabunRegular(): Promise<string> {
  const mod = await import('@/app/(website)/krulaw/sarabun-regular-b64');
  return mod.default;
}

/**
 * Open a print window (fallback: hidden iframe). Returns null when neither
 * works (e.g. popup blocked AND iframe refused — practically never).
 *
 * The window case is left open for the user to close (it behaves like a
 * print-preview tab). `window.print()` blocks the main thread in most
 * browsers until the dialog is dismissed, so the iframe cleanup scheduled
 * by the caller only runs after printing finishes.
 */
function openPrintTarget(html: string): { print: () => void; dispose: () => void } | null {
  const win = window.open('', '_blank', 'width=900,height=1100');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    return {
      print: () => {
        win.focus();
        win.print();
      },
      dispose: () => undefined, // user closes the window like a normal tab
    };
  }
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.position = 'fixed';
  iframe.style.left = '-10000px';
  iframe.style.width = '900px';
  iframe.style.height = '1100px';
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
  return {
    print: () => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    },
    dispose: () => iframe.remove(),
  };
}

/**
 * FR12 — print JUST this article (plain text + citation). Opens a dedicated
 * print target so the reader page itself is untouched. No-op when not in a
 * browser (SSR-safe). Async: loads the inlined Sarabun font first (lazy
 * chunk — keeps the ~41KB data URI out of the reader bundle).
 */
export async function printArticle(article: Article, law: { code: string }): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const sarabun = await loadSarabunRegular();
  const body = `
    <h1>${escapeHtml(articleLabel(article.no, article.suffix))}</h1>
    <p class="krulaw-article-text">${escapeHtml(articlePlainText(article)).replace(/\n/g, '<br />')}</p>
    <p class="krulaw-source">— ${escapeHtml(law.code)} ${escapeHtml(articleLabel(article.no, article.suffix))}</p>
  `;
  const target = openPrintTarget(
    buildPrintDoc(`${articleLabel(article.no, article.suffix)} — ${law.code}`, body, sarabun),
  );
  if (!target) return;
  target.print();
  // Iframe cleanup runs after the (blocking) print dialog is dismissed.
  window.setTimeout(() => target.dispose(), 1000);
}

/** FR13 — whole-law print via a dedicated print target. */
export async function printLaw(law: LawDoc): Promise<void> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const sarabun = await loadSarabunRegular();
  const target = openPrintTarget(
    buildPrintDoc(`${law.titleTh} — ฉบับรวม`, lawPrintMarkup(law), sarabun),
  );
  if (!target) return;
  target.print();
  window.setTimeout(() => target.dispose(), 1000);
}
