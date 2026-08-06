'use client';

/**
 * LawLib — tooltip portal (FR3/FR4/FR5). Rendered by LawlibReaderClient when
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
 *    note: ''). The block carries `.lawlib-amendment-notes` — T10b's
 *    "ซ่อนโน้ตการแก้ไข" hides it via body.lawlib-hide-amendment-notes
 *    (FULL + COMPACT share this portal) + "เปิดมาตรานี้" link + copy
 *    shortcut (full article + "— <code> มาตรา N" citation line)
 *  - cross-law ref → lazy registry load (cached); miss → "ยังไม่เปิดให้อ่าน"
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LawDoc } from '@/types/lawlib';
import {
  articleKeyOf,
  articleLabel,
  articlePlainText,
  findArticle,
  loadCrossLaw,
} from '@/lib/lawlib-reader';
import { copyText } from '@/lib/copy-print';
import { formatThaiBEDate } from '@/lib/lawlib/format';
import type { TooltipContent } from '@/hooks/useLawTooltip';

/**
 * Article-actions hub (ADR-019 D3/D7 — T10a): bookmark ± · notes read +
 * quick-write (autosave) + link to the full notes panel · copy (existing) ·
 * copy-link. Rendered INSIDE the registered tooltip root; the
 * "open notes panel" button goes through onClose (closeTooltip — the
 * sanctioned close path) before opening the drawer.
 */
export interface LawTooltipHub {
  /** Current tooltip article bookmarked? */
  isBookmarked: boolean;
  onToggleBookmark: () => void;
  /** Latest note text for the tooltip article ('' when none). */
  noteText: string;
  /** Autosave upsert: '' + existing → delete; '' + none → no-op. */
  onNoteSave: (text: string) => void;
  /** Close the tooltip (via onClose) + open the full notes panel. */
  onOpenNotes: () => void;
  /** Copy the deep link to this article. */
  onCopyLink: () => void;
}

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
  /**
   * Stable root id (plan commit 3): aria-describedby target for triggers.
   * Absent → the root renders without an id (pre-wiring callers).
   */
  tooltipId?: string;
  /**
   * Article-actions hub (T10a). Same-law ref content only; absent for
   * glossary/cross-law content and for pre-wiring callers (tests) → the hub
   * section is not rendered.
   */
  hub?: LawTooltipHub;
}

const GAP = 8;

/** Debounced autosave note box (ADR-019 D7 — โน้ตเขียนด่วน). Saves 500ms
 *  after the last keystroke, flushed on blur AND on unmount (a closing
 *  tooltip must not drop the last keystrokes). Ref mirrors are updated in
 *  effects (react-compiler: no ref writes during render). */
function QuickNoteBox({
  initialText,
  onSave,
  onOpenNotes,
}: {
  initialText: string;
  onSave: (text: string) => void;
  onOpenNotes: () => void;
}) {
  const [draft, setDraft] = useState(initialText);
  const [saved, setSaved] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest-draft / latest-onSave mirrors — read by the stable flush (a timer
  // callback can't see fresh state; the unmount flush must not be stale).
  const draftRef = useRef(initialText);
  const saveRef = useRef(onSave);

  useEffect(() => {
    draftRef.current = draft;
  });
  useEffect(() => {
    saveRef.current = onSave;
  });

  const flush = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    saveRef.current(draftRef.current);
    // The autosave must not be silent (a11y fix #14): announce via the
    // aria-live status, then clear after a beat.
    setSaved(true);
    if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSaved(false), 1500);
  }, []);

  // Flush on unmount: a closing tooltip must not drop the last keystrokes.
  // React 19 strict-mode double-mount: the first cleanup runs before the
  // user typed — flushing an empty draft is a no-op (onSave('') with no
  // existing note does not create one). The status timer is cleared so no
  // stale setState fires after unmount.
  useEffect(() => {
    return () => {
      flush();
      if (savedTimerRef.current !== null) clearTimeout(savedTimerRef.current);
    };
  }, [flush]);

  const handleChange = (value: string) => {
    setDraft(value);
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, 500);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          โน้ตด่วน
        </span>
        <button
          type="button"
          onClick={onOpenNotes}
          className="flex min-h-7 cursor-pointer items-center text-[11px] font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-300"
        >
          เปิดโน้ตทั้งแผง →
        </button>
      </div>
      <textarea
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={flush}
        rows={2}
        aria-label="โน้ตด่วนสำหรับมาตราที่เปิด"
        placeholder="จดโน้ตด่วน… (บันทึกอัตโนมัติ)"
        className="w-full resize-none rounded-lg border border-slate-200 bg-white p-2 text-xs leading-relaxed text-slate-700 placeholder:text-slate-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-400"
      />
      <p
        aria-live="polite"
        role="status"
        className="min-h-3.5 text-right text-[10px] text-slate-500 dark:text-slate-400"
      >
        {saved ? 'บันทึกแล้ว' : ''}
      </p>
    </div>
  );
}

/** Article-actions hub row: bookmark ± · copy-link (copy lives in the header
 *  row above). ALL controls live inside the registered tooltip root. */
function ArticleHub({ hub, onClose }: { hub: LawTooltipHub; onClose: () => void }) {
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = async () => {
    await hub.onCopyLink();
    setLinkCopied(true);
    window.setTimeout(() => setLinkCopied(false), 2000);
  };

  return (
    <div className="space-y-2 border-t border-slate-100 pt-2 dark:border-slate-800">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={hub.onToggleBookmark}
          aria-pressed={hub.isBookmarked}
          aria-label={hub.isBookmarked ? 'นำออกจากที่คั่นหน้า' : 'เพิ่มที่คั่นหน้า'}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            hub.isBookmarked
              ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500/60 dark:bg-blue-950/50 dark:text-blue-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-blue-300'
          }`}
        >
          <i
            aria-hidden="true"
            className="fi fi-sr-bookmark text-[10px] text-blue-600 dark:text-blue-300"
          />
          {hub.isBookmarked ? 'ที่คั่นแล้ว' : 'ที่คั่น'}
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label="คัดลอกลิงก์มาตรานี้"
          className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            linkCopied
              ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-300'
              : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-blue-300'
          }`}
        >
          <i
            aria-hidden="true"
            className={`fi ${linkCopied ? 'fi-sr-check-circle' : 'fi-sr-link'} text-[10px]`}
          />
          {linkCopied ? 'คัดลอกลิงก์แล้ว' : 'คัดลอกลิงก์'}
        </button>
      </div>
      <QuickNoteBox
        initialText={hub.noteText}
        onSave={hub.onNoteSave}
        onOpenNotes={() => {
          // The sanctioned close path — the hub never bypasses closeTooltip
          // (constraint from the T10a intake: buttons call onClose).
          onClose();
          hub.onOpenNotes();
        }}
      />
    </div>
  );
}

/** มาตรา N [suffix] — display label for citations. */
function ArticleBody({
  law,
  article,
  code,
  onOpenArticle,
  onClose,
  crossHref,
  hub,
}: {
  law: LawDoc;
  article: { no: number; suffix?: string };
  code: string;
  onOpenArticle: (articleKey: string) => void;
  onClose: () => void;
  /** Cross-law: full page link instead of the same-page anchor. */
  crossHref?: string;
  /** T10a article-actions hub — same-law refs only (see LawTooltipProps). */
  hub?: LawTooltipHub;
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
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-blue-300"
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
            <ul className="lawlib-amendment-notes space-y-1 rounded-lg bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {target.amendedBy.map((am, i) => {
                const edition = law.editions.find((e) => e.no === am.editionNo);
                return (
                  <li key={i}>
                    {/* Authored full line (law md marker note — user 2026-08-05):
                        e.g. 'ฉบับที่ 2 (2545) - แก้ไข: กระทรวง: … -> …' — shown
                        verbatim; empty notes fall back to the legacy format. */}
                    {am.note !== ''
                      ? am.note
                      : `แก้ไขโดยฉบับที่ ${am.editionNo}${edition ? ` (${formatThaiBEDate(edition.gazetteDate)})` : ''}`}
                  </li>
                );
              })}
            </ul>
          )}
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">ไม่พบมาตรานี้ในข้อมูลปัจจุบัน</p>
      )}

      {hub !== undefined && (
        // Keyed by article: a ref→ref swap (same portal root, replaced
        // content) must REMOUNT the hub — the QuickNoteBox draft resets to
        // the new article's note and the unmount flush saves any pending
        // draft to the OLD article (BLOCKER fix, T10a review).
        <ArticleHub key={key} hub={hub} onClose={onClose} />
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 dark:border-slate-800">
        {crossHref !== undefined ? (
          <a
            href={crossHref}
            className="flex min-h-7 items-center text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
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
            className="flex min-h-7 items-center text-xs font-medium text-blue-700 hover:underline dark:text-blue-300"
          >
            เปิดมาตรานี้
          </a>
        )}
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
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
      crossHref={`/lawlib/${doc.slug}#มาตรา-${articleKeyOf({ no: articleNo, suffix: articleSuffix })}`}
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
  tooltipId,
  hub,
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

  // The hub root is role="dialog" — give it an accessible name (senior
  // review of 28d6bae; hub only mounts for ref content). articleLabel
  // already includes the มาตรา prefix ("มาตรา 1").
  const dialogLabel =
    hub !== undefined && content.kind !== 'glossary'
      ? articleLabel(content.articleNo, content.articleSuffix)
      : undefined;

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
        hub={hub}
      />
    );

  return createPortal(
    <div
      id={tooltipId}
      ref={(el) => {
        rootRef.current = el;
        registerTooltipEl(el);
      }}
      // Interactive hub content (bookmark/notes/copy/copy-link) makes the
      // root a non-modal DIALOG; glossary-only content keeps role="tooltip"
      // (a11y fix #7 — role=tooltip must not contain interactive elements).
      role={hub !== undefined ? 'dialog' : 'tooltip'}
      aria-label={dialogLabel}
      aria-modal={hub !== undefined ? 'false' : undefined}
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
          ? 'lawlib-tooltip fixed inset-x-0 bottom-0 z-[70] max-h-[75vh] origin-bottom overflow-y-auto rounded-t-2xl border-t border-slate-200 bg-white p-4 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900'
          : 'lawlib-tooltip fixed z-[70] w-[min(92vw,28rem)] rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-900'
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
              className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:text-slate-800 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
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
