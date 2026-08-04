'use client';

/**
 * KruLAW — tooltip portal (FR3/FR4/FR5). Rendered by KrulawReaderClient when
 * the hook has an open tooltip. Single portal to document.body; fixed
 * positioning near the trigger with viewport-safe flip; <640px viewport →
 * bottom-sheet panel. Content is announced on OPEN via aria-live (never on
 * focus — full-article announce-on-focus would be intrusive).
 *
 * Content:
 *  - glossary term → definition
 *  - ref → TARGET article full text (plain-text join, max-height 60vh +
 *    internal scroll, NO truncation) + history block ONLY when amendedBy is
 *    non-empty ("แก้ไขโดยฉบับที่ N (gazette date) — note"; the "— note"
 *    segment renders only when the note is non-empty — bare markers carry
 *    note: '') + "เปิดมาตรานี้" link + copy shortcut (full article +
 *    "— <code> มาตรา N" citation line)
 *  - cross-law ref → lazy registry load (cached); miss → "ยังไม่เปิดให้อ่าน"
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LawDoc } from '@/types/krulaw';
import {
  articleKeyOf,
  articleLabel,
  articlePlainText,
  findArticle,
  loadCrossLaw,
} from '@/lib/krulaw-reader';
import { copyText } from '@/lib/copy-print';
import { formatThaiBEDate } from '@/lib/krulaw/format';
import type { TooltipContent } from '@/hooks/useLawTooltip';

interface LawTooltipProps {
  content: TooltipContent;
  anchorRect: DOMRect;
  sheet: boolean;
  law: LawDoc;
  onClose: () => void;
  /** Same-law "เปิดมาตรานี้" → ReaderClient scroll + highlight + close. */
  onOpenArticle: (articleKey: string) => void;
  registerTooltipEl: (el: HTMLElement | null) => void;
  onPointerLeave: (e: React.PointerEvent<HTMLElement>) => void;
  /** Keyboard-opened (Enter/Space on a trigger) → focus the root on mount. */
  focusOnOpen?: boolean;
}

const GAP = 8;

/** มาตรา N [suffix] — display label for citations. */
function ArticleBody({
  law,
  article,
  code,
  onOpenArticle,
  onClose,
  crossHref,
}: {
  law: LawDoc;
  article: { no: number; suffix?: string };
  code: string;
  onOpenArticle: (articleKey: string) => void;
  onClose: () => void;
  /** Cross-law: full page link instead of the same-page anchor. */
  crossHref?: string;
}) {
  const [copied, setCopied] = useState(false);
  const key = articleKeyOf(article);
  const label = articleLabel(article.no, article.suffix);
  const target = findArticle(law, article.no, article.suffix);

  const handleCopy = async () => {
    if (!target) return;
    // Same payload shape as buildCitation (copy-print.ts): blank line before
    // the citation line.
    const ok = await copyText(`${articlePlainText(target)}\n\n— ${code} ${label}`);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-blue-300"
        >
          <i
            aria-hidden="true"
            className={`fi ${copied ? 'fi-sr-check-circle text-emerald-600' : 'fi-sr-copy'} mr-1 text-[10px]`}
          />
          {copied ? 'คัดลอกแล้ว' : 'คัดลอก'}
        </button>
      </div>

      {target ? (
        <>
          <div
            aria-live="polite"
            className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 text-[15px] leading-relaxed text-slate-700 dark:text-slate-200"
          >
            {articlePlainText(target)
              .split(/\n+/)
              .filter((p) => p.trim() !== '')
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>

          {target.amendedBy !== undefined && target.amendedBy.length > 0 && (
            <ul className="space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {target.amendedBy.map((am, i) => {
                const edition = law.editions.find((e) => e.no === am.editionNo);
                return (
                  <li key={i}>
                    แก้ไขโดยฉบับที่ {am.editionNo}
                    {edition ? ` (${formatThaiBEDate(edition.gazetteDate)})` : ''}
                    {am.note !== '' ? ` — ${am.note}` : ''}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">ไม่พบมาตรานี้ในข้อมูลปัจจุบัน</p>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        {crossHref !== undefined ? (
          <a
            href={crossHref}
            className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
          >
            เปิดมาตรานี้
          </a>
        ) : (
          <a
            href={`#มาตรา-${key}`}
            onClick={(e) => {
              e.preventDefault();
              onOpenArticle(key);
              onClose();
            }}
            className="text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
          >
            เปิดมาตรานี้
          </a>
        )}
        <span className="text-[11px] text-slate-400 dark:text-slate-500">
          — {code} {label}
        </span>
      </div>
    </div>
  );
}

/** Cross-law resolution — keyed by lawCode so each law restarts at 'loading'. */
function CrossLawArticle({
  lawCode,
  articleNo,
  articleSuffix,
  onOpenArticle,
  onClose,
}: {
  lawCode: string;
  articleNo: number;
  articleSuffix?: string;
  onOpenArticle: (articleKey: string) => void;
  onClose: () => void;
}) {
  const [doc, setDoc] = useState<LawDoc | null | 'loading'>('loading');

  // Async load (cached in the lib module map) — setState happens in .then,
  // never synchronously in the effect body. Component is keyed by lawCode in
  // the parent, so a new ref resets to 'loading' on remount.
  useEffect(() => {
    let alive = true;
    void loadCrossLaw(lawCode).then((d) => {
      if (alive) setDoc(d);
    });
    return () => {
      alive = false;
    };
  }, [lawCode]);

  if (doc === 'loading') {
    return <p className="text-sm text-slate-500 dark:text-slate-400">กำลังโหลดกฎหมายที่อ้างถึง…</p>;
  }
  if (doc === null) {
    return (
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
          ยังไม่เปิดให้อ่าน
        </p>
        <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          กฎหมายที่อ้างถึงนี้อยู่ระหว่างเตรียมเนื้อหา — เมื่อเปิดให้อ่านแล้ว
          ระบบจะแสดงมาตราอ้างอิงโดยอัตโนมัติ
        </p>
      </div>
    );
  }
  return (
    <ArticleBody
      law={doc}
      article={{ no: articleNo, suffix: articleSuffix }}
      code={doc.code}
      onOpenArticle={onOpenArticle}
      onClose={onClose}
      crossHref={`/krulaw/${doc.slug}#มาตรา-${articleKeyOf({ no: articleNo, suffix: articleSuffix })}`}
    />
  );
}

export default function LawTooltip({
  content,
  anchorRect,
  sheet,
  law,
  onClose,
  onOpenArticle,
  registerTooltipEl,
  onPointerLeave,
  focusOnOpen = false,
}: LawTooltipProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Position once measured — direct style writes (no setState), so the
  // compiler set-state-in-effect rule stays untouched. Visibility flips after
  // the first measurement → no flash at the origin corner.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (el === null || sheet) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const left = Math.min(
      Math.max(anchorRect.left + anchorRect.width / 2 - rect.width / 2, GAP),
      Math.max(vw - rect.width - GAP, GAP),
    );
    const below = anchorRect.bottom + GAP;
    const top =
      below + rect.height <= vh - GAP ? below : Math.max(anchorRect.top - rect.height - GAP, GAP);
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    // Entry animation pivots from the anchor edge (below → top origin, flipped
    // above → bottom origin); the sheet variant pivots from bottom-center.
    el.style.transformOrigin = top === below ? 'top' : 'bottom';
    el.style.visibility = 'visible';
  }, [anchorRect, content, sheet]);

  // Keyboard-opened → move focus INTO the tooltip so Tab cycles its actions
  // (คัดลอก → เปิดมาตรานี้). Mouse/touch opens leave focus on the trigger.
  useEffect(() => {
    if (focusOnOpen) rootRef.current?.focus();
  }, [focusOnOpen]);

  if (typeof document === 'undefined') return null;

  const inner =
    content.kind === 'glossary' ? (
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {content.term}
          </span>
        </div>
        <p
          aria-live="polite"
          className="max-h-[60vh] overflow-y-auto pr-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200"
        >
          {content.definition}
        </p>
      </div>
    ) : content.lawSlug !== undefined ? (
      <CrossLawArticle
        key={content.lawSlug}
        lawCode={content.lawSlug}
        articleNo={content.articleNo}
        articleSuffix={content.articleSuffix}
        onOpenArticle={onOpenArticle}
        onClose={onClose}
      />
    ) : (
      <ArticleBody
        law={law}
        article={{ no: content.articleNo, suffix: content.articleSuffix }}
        code={law.code}
        onOpenArticle={onOpenArticle}
        onClose={onClose}
      />
    );

  return createPortal(
    <div
      ref={(el) => {
        rootRef.current = el;
        registerTooltipEl(el);
      }}
      role="tooltip"
      tabIndex={-1}
      onPointerLeave={onPointerLeave}
      style={{
        // The tooltip renders outside the Sarabun wrapper (portal to body) —
        // resolve the font through the ROOT layout's variable instead of a
        // literal 'Sarabun' (next/font/local hashes the family name, so the
        // literal would silently fall back to the sans-serif stack).
        fontFamily: 'var(--font-sarabun), "Noto Sans Thai", sans-serif',
        ...(sheet ? undefined : { left: 0, top: 0, visibility: 'hidden' }),
      }}
      className={
        sheet
          ? 'krulaw-tooltip fixed inset-x-0 bottom-0 z-[70] max-h-[75vh] origin-bottom overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900'
          : 'krulaw-tooltip fixed z-[70] w-[min(92vw,28rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl outline-none dark:border-slate-700 dark:bg-slate-900'
      }
    >
      {sheet && (
        <>
          {/* grab handle — bottom-sheet affordance (discoverability) */}
          <div
            aria-hidden="true"
            className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-600"
          />
          <div className="mb-2 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              aria-label="ปิด"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
            >
              <i aria-hidden="true" className="fi fi-sr-cross text-[10px]" />
            </button>
          </div>
        </>
      )}
      {inner}
    </div>,
    document.body,
  );
}
