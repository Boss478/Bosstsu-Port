'use client';

/**
 * CompactView — digest renderer for the merged reader (rev 5.5, T4 +
 * user redesign 2026-08-05).
 *
 * Renders a DigestView (server-built) as the COMPACT view:
 *  - fixed heading "ฉบับย่อ — {LAW}" (user 2026-08-05; the digest md's own H1
 *    is metadata only) + section headings h2
 *  - chapter groups h3 (collapsible; first expanded — collapse state hoisted
 *    to the reader so digest-search jumps can auto-expand, loop-4 #6)
 *  - article cards: plain-DIV header (no heading tag — heading-inside-button
 *    is invalid, loop-5 #3) with ONE tooltip trigger BUTTON per article
 *    member (merged cards: "มาตรา 11 - มาตรา 12" as independent triggers);
 *    summary parts always visible. Hovering a member label opens the
 *    FULL-style tooltip; CLICK / tap opens a FLOATING POPOVER with the REAL
 *    article — like the glossary term tooltip (user 2026-08-05: "เหมือน hover
 *    คำศัพท์อะ") — rendered via the same ArticleView `singleKey`
 *    (byte-identical to FULL). Click-pinned (plan v6): Escape / X closes;
 *    hover never opens the popover.
 *  - term tokens → tooltip triggers (data-lawlib-term + getTriggerProps),
 *    colored per the loop-4 #8 contrast spec (blue-800/blue-300)
 *  - same-law refs → in-page buttons (jump rule, loop-1 #3); cross-law refs
 *    stay Links; seefull tokens → FULL switch
 *  - every line carries `id=lawlib-dline-<n>` + tabindex=-1 (digest-search
 *    jump target + non-visual focus cue — loop-4 #6)
 *
 * No dangerouslySetInnerHTML anywhere (loop-3 #2) — all React nodes.
 */

import { Fragment, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { LawDoc } from '@/types/lawlib';
import type { DigestView, RenderLine, RenderSection, RenderToken } from '@/lib/lawlib/digest-view';
import type { ArticleHighlight } from '@/components/ArticleView';
import ArticleView from '@/components/ArticleView';
import { articleLabel, findArticleByKey } from '@/lib/lawlib-reader';
import type { TooltipContent, TooltipTriggerHandlers } from '@/hooks/useLawTooltip';
import DigestToc from './DigestToc';

interface CompactViewProps {
  view: DigestView;
  law: LawDoc;
  /** Reader settings → the SAME typography controls as FULL apply (parity). */
  fontSizeClass: string;
  widthClass: string;
  lineHeight: number;
  /** Popover article key (null = closed). */
  expandedKey: string | null;
  /** How the popover opened — interaction-only since the hover path was
   *  removed (Track E); kept as the honest open-mode record. */
  expandedSource: 'interaction' | null;
  /**
   * Stable tooltip root id (plan commit 3): member buttons reference it via
   * aria-describedby while their tooltip is open (FULL header parity).
   */
  tooltipId: string;
  /** Open/toggle the popover (memberKey = the exact member button clicked —
   *  Esc/X focus restore target + activeKey). */
  onToggleCard: (key: string, memberKey?: string) => void;
  /** Immediate close (X button / Escape). */
  onCollapseCard: () => void;
  /** Jump rule (chips): card if exists, else FULL + jump. */
  onNavigate: (key: string) => void;
  /** Body refs (same-law, in card text): unified popover routing (compact +
   *  card → popover, else the jump rule). */
  onOpenRef: (key: string) => void;
  /** ดูฉบับเต็ม / seefull: switch to FULL + jump. */
  onSeeFull: (key: string) => void;
  /** Expand a chapter group (TOC click on a collapsed group). */
  onExpandGroup: (groupId: string) => void;
  /** Active article key (jump/expand) — TOC มาตรา entries highlight (FULL parity). */
  activeArticleKey: string | null;
  highlights: ArticleHighlight[];
  noteKeys: ReadonlySet<string>;
  flashKey: string | null;
  collapsedGroups: ReadonlySet<string>;
  onToggleGroup: (groupId: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}

/** Extract the article key from a deep-link href (`#มาตรา-<key>` → key). */
function keyFromHref(href: string): string | null {
  const m = /#มาตรา-([^#]+)$/.exec(href);
  return m !== null ? m[1] : null;
}

/** Is this href a same-law deep link (jump rule applies)? */
function isSameLawHref(href: string, slug: string): boolean {
  return href.startsWith(`/lawlib/${slug}#มาตรา-`);
}

/** Inline token renderer — text/term with bold/strike, refs, seefull.
 *  `interactive=false` renders a hover-inert static block (the merged history
 *  section — user 2026-08-05: hover must not affect it): terms become plain
 *  text (no tooltip triggers), refs/seefull become plain labels. */
function TokenView({
  token,
  slug,
  onOpenRef,
  onSeeFull,
  getTriggerProps,
  isTooltipOpen,
  interactive = true,
}: {
  token: RenderToken;
  slug: string;
  onOpenRef: (key: string) => void;
  onSeeFull: (key: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
  interactive?: boolean;
}) {
  if (token.kind === 'text' || token.kind === 'term') {
    const content = token.kind === 'text' ? token.text : token.term;
    const plain =
      token.kind === 'term' && interactive ? (
        <span
          role="button"
          tabIndex={0}
          aria-expanded={isTooltipOpen({
            kind: 'glossary',
            term: token.term,
            definition: token.definition,
          })}
          aria-haspopup="true"
          data-lawlib-trigger
          data-lawlib-term={token.term}
          className="lawlib-chip-hit cursor-pointer rounded-sm border-b-2 border-dashed border-blue-400/70 font-medium text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-500/60 dark:text-blue-300 dark:hover:bg-blue-950/40"
          {...getTriggerProps({ kind: 'glossary', term: token.term, definition: token.definition })}
        >
          {content}
        </span>
      ) : (
        <span>{content}</span>
      );
    const strong =
      token.bold === true ? (
        <strong className="font-semibold text-slate-900 dark:text-white">{plain}</strong>
      ) : (
        plain
      );
    return token.strike === true ? (
      <s className="text-slate-600 dark:text-slate-400">{strong}</s>
    ) : (
      strong
    );
  }
  if (token.kind === 'ref' && !interactive) {
    // History mode (user 2026-08-05): hovering มาตรา shows the article INFO
    // via the tooltip FIRST; the jump button lives INSIDE the tooltip (the
    // reader's handleTooltipOpenArticle → jump rule). Content is rebuilt from
    // the href hash (the digest render model only carries label+href).
    const key = token.href !== null ? keyFromHref(token.href) : null;
    const m = key !== null ? /^(\d+)(.*)$/.exec(key) : null;
    if (token.href === null || m === null) return <span>{token.label}</span>;
    const content: TooltipContent = {
      kind: 'ref',
      articleNo: Number(m[1]),
      ...(m[2] !== '' ? { articleSuffix: m[2] } : {}),
      display: token.label,
    };
    return (
      <span
        role="button"
        tabIndex={0}
        aria-expanded={isTooltipOpen(content)}
        aria-haspopup="true"
        data-lawlib-trigger
        className="lawlib-chip-hit cursor-pointer rounded-sm font-medium text-blue-700 underline decoration-dotted underline-offset-4 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/40"
        {...getTriggerProps(content)}
      >
        {token.label}
      </span>
    );
  }
  if (token.href === null) {
    // unresolved cross-law ref → plain text
    return <span>{token.label}</span>;
  }
  if (token.kind === 'seefull') {
    return (
      <button
        type="button"
        onClick={() => {
          const key = keyFromHref(token.href!);
          if (key !== null) onSeeFull(key);
        }}
        className="ml-1 inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
      >
        ดูเต็ม {token.label}
        <i aria-hidden="true" className="fi fi-sr-arrow-small-right text-[10px] leading-none" />
      </button>
    );
  }
  // same-law ref → in-page button (unified popover routing); cross-law ref → Link
  if (isSameLawHref(token.href, slug)) {
    return (
      <button
        type="button"
        onClick={() => {
          const key = keyFromHref(token.href!);
          if (key !== null) onOpenRef(key);
        }}
        className="cursor-pointer rounded-sm font-medium text-blue-700 underline decoration-dotted underline-offset-4 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/40 py-1.5 -my-1.5"
      >
        {token.label}
      </button>
    );
  }
  return (
    <Link
      href={token.href}
      className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200"
    >
      {token.label}
    </Link>
  );
}

/** Shared digest token list — exported for the reader's merged history block. */
export function TokenList({
  tokens,
  slug,
  onOpenRef,
  onSeeFull,
  getTriggerProps,
  isTooltipOpen,
  interactive = true,
}: {
  tokens: RenderToken[];
  slug: string;
  onOpenRef: (key: string) => void;
  onSeeFull: (key: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
  interactive?: boolean;
}) {
  return (
    <>
      {tokens.map((tok, i) => (
        <TokenView
          key={i}
          token={tok}
          slug={slug}
          onOpenRef={onOpenRef}
          onSeeFull={onSeeFull}
          getTriggerProps={getTriggerProps}
          isTooltipOpen={isTooltipOpen}
          interactive={interactive}
        />
      ))}
    </>
  );
}

/** Article card — summary always; click/tap opens the floating full-article
 *  popover (click-pinned; Esc / X closes). The header is a plain DIV holding
 *  one tooltip trigger BUTTON per article member (merged cards: one per มาตรา
 *  + ' - ' separator) — hovering/focusing a member shows ITS tooltip (FULL
 *  parity); clicking it opens the card popover. Hover NEVER opens the popover
 *  (user 2026-08-05, plan v6). */
function ArticleCard({
  line,
  law,
  isOpen,
  popoverId,
  tooltipId,
  onToggleCard,
  onOpenRef,
  onSeeFull,
  flashKey,
  getTriggerProps,
  isTooltipOpen,
}: {
  line: Extract<RenderLine, { kind: 'article' }>;
  law: LawDoc;
  /** Popover open for this card (aria-expanded on every member button). */
  isOpen: boolean;
  /** Popover root id (aria-controls on the member buttons — APG two-relation
   *  pattern; multiple triggers may reference one dialog). */
  popoverId: string;
  tooltipId: string;
  onToggleCard: (key: string, memberKey?: string) => void;
  onOpenRef: (key: string) => void;
  onSeeFull: (key: string) => void;
  flashKey: string | null;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}) {
  // Merged cards (line.keys): flash when ANY member key is the target.
  const isFlash =
    flashKey !== null && (flashKey === line.key || line.keys?.includes(flashKey) === true);

  return (
    <div
      id={line.id}
      tabIndex={-1}
      data-lawlib-card={line.key}
      {...(line.keys !== undefined ? { 'data-lawlib-card-members': line.keys.join(' ') } : {})}
      onClick={(e) => {
        // Body-tap path (loop-5 BLOCKER fix): clicks on member buttons,
        // tooltip triggers, other buttons and links keep their OWN handlers —
        // only non-interactive card surface (body text, header padding) toggles
        // the popover (double-fire guard).
        const target = e.target as HTMLElement | null;
        if (target !== null && target.closest('[data-lawlib-trigger],button,a') !== null) return;
        onToggleCard(line.key, 'interaction');
      }}
      className={`lawlib-digest-card cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors dark:border-slate-700 dark:bg-slate-900 ${
        isFlash ? 'ring-2 ring-amber-300 dark:ring-amber-500/50' : ''
      } ${isOpen ? 'border-blue-300 dark:border-blue-600/60' : ''}`}
    >
      {/* Header: plain div (NOT a button — interactive-in-interactive is
          invalid, loop-1 OQ1) with ONE trigger button per member + a
          decorative search icon. Label styling = FULL header trigger
          (ArticleView.tsx:283) byte-for-byte. */}
      <div className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg text-left text-base font-bold leading-relaxed text-slate-900 dark:text-white">
        <span className="flex min-w-0 flex-wrap items-center">
          {(line.keys ?? [line.key]).map((key, i) => {
            // Tooltip content from the member KEY via the existing key-regex
            // precedent (TokenView history-mode) — NEVER findArticleByKey
            // (73 buttons × O(63) scan per re-render, plan v5 #2).
            const m = /^(\d+)(.*)$/.exec(key);
            if (m === null) return <span key={key}>{key}</span>;
            const label = articleLabel(Number(m[1]), m[2] !== '' ? m[2] : undefined);
            const content: TooltipContent = {
              kind: 'ref',
              articleNo: Number(m[1]),
              ...(m[2] !== '' ? { articleSuffix: m[2] } : {}),
              display: label,
            };
            return (
              <Fragment key={key}>
                {i > 0 && (
                  <span aria-hidden="true" className="mx-2 text-slate-400 dark:text-slate-500">
                    -
                  </span>
                )}
                <button
                  type="button"
                  data-lawlib-member={key}
                  data-lawlib-trigger
                  aria-haspopup="dialog"
                  aria-controls={popoverId}
                  aria-expanded={isOpen}
                  aria-describedby={isTooltipOpen(content) ? tooltipId : undefined}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-lg font-bold text-blue-800 underline decoration-dotted decoration-blue-400/70 underline-offset-4 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/40"
                  {...getTriggerProps(content)}
                  onPointerUp={undefined}
                  onClick={() => onToggleCard(line.key, key)}
                >
                  {label}
                </button>
              </Fragment>
            );
          })}
        </span>
        <i
          aria-hidden="true"
          className="fi fi-sr-search text-xs text-slate-400 dark:text-slate-500"
        />
      </div>
      <div className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {line.parts.map((part, i) => (
          <p
            key={i}
            className={
              part.kind === 'quote'
                ? 'border-l-4 border-amber-300 pl-3 dark:border-amber-500/40'
                : ''
            }
          >
            <TokenList
              tokens={part.tokens}
              slug={law.slug}
              onOpenRef={onOpenRef}
              onSeeFull={onSeeFull}
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
            />
          </p>
        ))}
      </div>
    </div>
  );
}

/** Floating full-article popover — the compact "click like the term tooltip"
 *  (user 2026-08-05). Renders the REAL article via ArticleView singleKey;
 *  positioned beside its card (falls below on narrow screens); Esc / X
 *  closes (click-pinned — no hover close, plan v6). role="dialog" with
 *  aria-modal="false" + a stable id (the member buttons' aria-controls). */
function ArticlePopover({
  line,
  law,
  source,
  popoverId,
  onClose,
  onSeeFull,
  highlights,
  noteKeys,
  flashKey,
  getTriggerProps,
  isTooltipOpen,
}: {
  line: Extract<RenderLine, { kind: 'article' }>;
  law: LawDoc;
  source: 'interaction' | null;
  popoverId: string;
  onClose: () => void;
  onSeeFull: (key: string) => void;
  highlights: ArticleHighlight[];
  noteKeys: ReadonlySet<string>;
  flashKey: string | null;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Position beside the card once, at open (transient popover — no re-layout
  // tracking; like the term tooltip's captured anchor). T9 (mobile audit):
  // the popover's height is content-driven up to min(70vh, 42rem), so the
  // lazy top reserves that WORST CASE — a bare `vh - 120` margin let the
  // bottom edge land 83-318px below the fold at 375px. The mount
  // useLayoutEffect below then corrects for the REAL height before paint.
  const [pos] = useState<{ left: number; top: number; width: number }>(() => {
    const card = document.querySelector<HTMLElement>(
      `[data-lawlib-card="${CSS.escape(line.key)}"]`,
    );
    if (card === null) return { left: 16, top: 80, width: Math.min(416, window.innerWidth - 32) };
    const r = card.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const gap = 12;
    const width = Math.min(416, vw - 32);
    const maxHeightPx = Math.min(0.7 * vh, 42 * 16); // min(70vh, 42rem)
    const fitTop = (top: number) => Math.max(8, Math.min(top, vh - maxHeightPx - 16));
    let left = r.right + gap;
    const top = fitTop(r.top);
    if (left + width > vw - 8) {
      left = r.left - width - gap;
      if (left < 8) {
        // narrow screens → below the card
        return { left: Math.max(8, r.left), top: fitTop(r.bottom + 8), width };
      }
    }
    return { left: Math.max(8, left), top, width };
  });

  // T9 (mobile audit — popover clamp): the lazy reservation covers the
  // worst case; if the REAL height still exceeds it on a short viewport,
  // pull the top up so the bottom edge clears the fold by 12px. Direct
  // style write (no setState — the compiler set-state-in-effect rule stays
  // untouched; same pattern as LawTooltip's position effect). Runs once —
  // the popover mounts fresh per open and its content is synchronous.
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (el === null) return;
    const vh = window.innerHeight;
    const current = parseFloat(el.style.top);
    if (!Number.isFinite(current)) return;
    const height = el.getBoundingClientRect().height;
    const clamped = Math.min(current, vh - height - 12);
    if (clamped < current) el.style.top = `${Math.max(8, clamped)}px`;
  }, []);

  // Focus handoff (loop-4 #3): the hover-open path is gone (Track E), so
  // every mounted popover is interaction-opened — move focus to the
  // ArticleView header trigger. Fallback (loop-3 MINOR): no trigger rendered
  // (findArticleByKey miss) → the X close button, then the popover root.
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    const t = root.querySelector<HTMLElement>('[data-lawlib-trigger]');
    if (t !== null && t !== document.activeElement) {
      t.focus();
      return;
    }
    const closeBtn = root.querySelector<HTMLButtonElement>('button');
    if (closeBtn !== null && closeBtn !== document.activeElement) {
      closeBtn.focus();
      return;
    }
    if (root !== document.activeElement) root.focus();
  }, [source]);

  return (
    <div
      ref={rootRef}
      id={popoverId}
      data-lawlib-popover
      role="dialog"
      aria-modal="false"
      aria-label={`${line.label} ฉบับเต็ม`}
      tabIndex={-1}
      style={{
        position: 'fixed',
        left: pos.left,
        top: pos.top,
        width: pos.width,
        maxHeight: 'min(70vh, 42rem)',
        zIndex: 40,
      }}
      className="lawlib-popover flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
    >
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-200 px-4 py-2.5 dark:border-slate-700">
        <span className="text-sm font-bold leading-relaxed text-slate-900 dark:text-white">
          {line.label}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="ปิด"
          className="flex h-11 w-11 cursor-pointer items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-colors hover:text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:bg-slate-800 dark:text-slate-400 dark:hover:text-white"
        >
          <i aria-hidden="true" className="fi fi-sr-cross text-[10px]" />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        {/* Merged card (line.keys, user 2026-08-05): stack the REAL article
            of EVERY member key — each ArticleView renders its own header,
            amendment markers and tooltips; a divider + label separates them. */}
        {line.keys !== undefined && line.keys.length > 1 ? (
          line.keys.map((k, i) => {
            const flat = findArticleByKey(law, k);
            const label =
              flat !== undefined ? articleLabel(flat.article.no, flat.article.suffix) : k;
            return (
              <div
                key={k}
                className={i > 0 ? 'mt-4 border-t border-slate-200 pt-4 dark:border-slate-700' : ''}
              >
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                  {label}
                </p>
                <ArticleView
                  law={law}
                  highlights={highlights}
                  noteKeys={noteKeys}
                  flashKey={flashKey}
                  getTriggerProps={getTriggerProps}
                  isTooltipOpen={isTooltipOpen}
                  singleKey={k}
                />
              </div>
            );
          })
        ) : (
          <ArticleView
            law={law}
            highlights={highlights}
            noteKeys={noteKeys}
            flashKey={flashKey}
            getTriggerProps={getTriggerProps}
            isTooltipOpen={isTooltipOpen}
            singleKey={line.key}
          />
        )}
      </div>
      <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-2.5 dark:border-slate-700">
        <button
          type="button"
          onClick={() => onSeeFull(line.key)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ดูฉบับเต็มที่ {line.label}
          <i aria-hidden="true" className="fi fi-sr-arrow-small-right text-[10px] leading-none" />
        </button>
        <span className="text-xs text-slate-400 dark:text-slate-500">Esc ปิด</span>
      </footer>
    </div>
  );
}

/** One body line (non-article) with dline id (flash applied directly via DOM).
 *  Exported for the reader's merged history block (both views).
 *  `interactive=false` → hover-inert terms (history section — user 2026-08-05). */
export function BodyLineView({
  line,
  slug,
  onOpenRef,
  onSeeFull,
  getTriggerProps,
  isTooltipOpen,
  interactive = true,
}: {
  line: Exclude<RenderLine, { kind: 'article' }>;
  slug: string;
  onOpenRef: (key: string) => void;
  onSeeFull: (key: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
  interactive?: boolean;
}) {
  const tokens = (
    <TokenList
      tokens={line.tokens}
      slug={slug}
      onOpenRef={onOpenRef}
      onSeeFull={onSeeFull}
      getTriggerProps={getTriggerProps}
      isTooltipOpen={isTooltipOpen}
      interactive={interactive}
    />
  );
  if (line.kind === 'h3') {
    return (
      <h3
        id={line.id}
        tabIndex={-1}
        className={`mt-6 text-lg font-bold leading-relaxed text-slate-900 dark:text-white`}
      >
        {tokens}
      </h3>
    );
  }
  if (line.kind === 'quote') {
    return (
      <p
        id={line.id}
        tabIndex={-1}
        className={`mt-3 border-l-4 border-amber-300 bg-amber-50 px-4 py-2 text-sm leading-relaxed text-slate-600 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-slate-300`}
      >
        {tokens}
      </p>
    );
  }
  if (line.kind === 'bullet') {
    return (
      <p
        id={line.id}
        tabIndex={-1}
        className={`mt-2 flex gap-2 leading-relaxed text-slate-700 dark:text-slate-300`}
      >
        <span aria-hidden="true" className="shrink-0 select-none text-blue-500">
          •
        </span>
        <span>{tokens}</span>
      </p>
    );
  }
  return (
    <p
      id={line.id}
      tabIndex={-1}
      className={`mt-3 leading-relaxed text-slate-700 dark:text-slate-300 ${
        line.kind === 'numbered' ? 'pl-5' : ''
      }`}
    >
      {tokens}
    </p>
  );
}

/** Chapter group with collapsible h3 header. */
function ChapterGroupView({
  group,
  collapsed,
  onToggleGroup,
  law,
  expandedKey,
  popoverId,
  tooltipId,
  onToggleCard,
  onOpenRef,
  onSeeFull,
  flashKey,
  getTriggerProps,
  isTooltipOpen,
}: {
  group: { id: string; label: string; articleCount: number; lines: RenderLine[] };
  collapsed: boolean;
  onToggleGroup: (id: string) => void;
  law: LawDoc;
  expandedKey: string | null;
  popoverId: string;
  tooltipId: string;
  onToggleCard: (key: string, memberKey?: string) => void;
  onOpenRef: (key: string) => void;
  onSeeFull: (key: string) => void;
  flashKey: string | null;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}) {
  return (
    <div className="mt-4">
      {/* h3 wrapping the disclosure button — valid HTML, heading-tree pin
          (loop-5 #3: h3 = chapter-group headers). */}
      <h3 className="mb-2 text-lg font-bold leading-relaxed text-slate-900 dark:text-white">
        <button
          type="button"
          aria-expanded={!collapsed}
          onClick={() => onToggleGroup(group.id)}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-left text-base font-bold leading-relaxed text-slate-900 transition-colors hover:bg-blue-100/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:hover:bg-slate-800"
        >
          <span>
            {group.label}
            <span className="ml-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
              ({group.articleCount} มาตรา)
            </span>
          </span>
          <i
            aria-hidden="true"
            className={`fi fi-sr-angle-small-down text-xs text-slate-400 transition-transform dark:text-slate-500 ${
              collapsed ? '' : 'rotate-180'
            }`}
          />
        </button>
      </h3>
      <div id={`${group.id}-region`} hidden={collapsed} className="mt-2 space-y-3">
        {group.lines.map((line) =>
          line.kind === 'article' ? (
            <ArticleCard
              key={line.key}
              line={line}
              law={law}
              isOpen={expandedKey === line.key}
              popoverId={popoverId}
              tooltipId={tooltipId}
              onToggleCard={onToggleCard}
              onOpenRef={onOpenRef}
              onSeeFull={onSeeFull}
              flashKey={flashKey}
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
            />
          ) : (
            <BodyLineView
              key={line.id}
              line={line}
              slug={law.slug}
              onOpenRef={onOpenRef}
              onSeeFull={onSeeFull}
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
            />
          ),
        )}
      </div>
    </div>
  );
}

/** One digest section: heading + chips + lines (flat or chapter groups).
 *  Sections WITH chapter groups (มาตราสำคัญ-style) render the groups DIRECTLY —
 *  no section heading, no chips (redundant with the self-labeled หมวดที่ N
 *  groups — user decision 2026-08-05). */
function SectionView({
  section,
  sectionIndex,
  law,
  expandedKey,
  popoverId,
  tooltipId,
  onToggleCard,
  onNavigate,
  onOpenRef,
  onSeeFull,
  flashKey,
  collapsedGroups,
  onToggleGroup,
  getTriggerProps,
  isTooltipOpen,
}: {
  section: RenderSection;
  sectionIndex: number;
  law: LawDoc;
  expandedKey: string | null;
  popoverId: string;
  tooltipId: string;
  onToggleCard: (key: string, memberKey?: string) => void;
  /** Jump rule — section jump chips. */
  onNavigate: (key: string) => void;
  onOpenRef: (key: string) => void;
  onSeeFull: (key: string) => void;
  flashKey: string | null;
  collapsedGroups: ReadonlySet<string>;
  onToggleGroup: (id: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}) {
  const hasGroups = section.groups !== undefined;
  const renderLine = (line: RenderLine) =>
    line.kind === 'article' ? (
      <ArticleCard
        key={line.key}
        line={line}
        law={law}
        isOpen={expandedKey === line.key}
        popoverId={popoverId}
        tooltipId={tooltipId}
        onToggleCard={onToggleCard}
        onOpenRef={onOpenRef}
        onSeeFull={onSeeFull}
        flashKey={flashKey}
        getTriggerProps={getTriggerProps}
        isTooltipOpen={isTooltipOpen}
      />
    ) : (
      <BodyLineView
        key={line.id}
        line={line}
        slug={law.slug}
        onOpenRef={onOpenRef}
        onSeeFull={onSeeFull}
        getTriggerProps={getTriggerProps}
        isTooltipOpen={isTooltipOpen}
      />
    );

  return (
    <section className="mt-8" aria-label={hasGroups ? 'มาตราสำคัญ' : section.heading}>
      {!hasGroups && (
        <>
          <h2
            id={`digest-sec-${sectionIndex}`}
            className="scroll-mt-20 text-xl font-bold leading-relaxed text-slate-900 dark:text-white"
          >
            {section.heading}
          </h2>
          {section.articles.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {section.articles.map((chip) => (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => onNavigate(chip.key)}
                  className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:text-blue-300 dark:hover:bg-slate-800"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}
        </>
      )}
      <div className="mt-2">
        {hasGroups ? (
          <>
            {section.lines.map(renderLine)}
            {section.groups!.map((group) => (
              <ChapterGroupView
                key={group.id}
                group={group}
                collapsed={collapsedGroups.has(group.id)}
                onToggleGroup={onToggleGroup}
                law={law}
                expandedKey={expandedKey}
                popoverId={popoverId}
                tooltipId={tooltipId}
                onToggleCard={onToggleCard}
                onOpenRef={onOpenRef}
                onSeeFull={onSeeFull}
                flashKey={flashKey}
                getTriggerProps={getTriggerProps}
                isTooltipOpen={isTooltipOpen}
              />
            ))}
          </>
        ) : (
          section.lines.map(renderLine)
        )}
      </div>
    </section>
  );
}

export default function CompactView({
  view,
  law,
  fontSizeClass,
  widthClass,
  lineHeight,
  expandedKey,
  expandedSource,
  tooltipId,
  onToggleCard,
  onCollapseCard,
  onNavigate,
  onOpenRef,
  onSeeFull,
  onExpandGroup,
  activeArticleKey,
  highlights,
  noteKeys,
  flashKey,
  collapsedGroups,
  onToggleGroup,
  getTriggerProps,
  isTooltipOpen,
}: CompactViewProps) {
  // Popover root id — stable across open/close; member buttons reference it
  // via aria-controls (plan v6 #7: multiple triggers, one dialog = APG-accepted).
  const popoverId = useId();

  // The popover's article line (looked up by key — rendered once at the root).
  const expandedLine = (() => {
    if (expandedKey === null) return null;
    for (const s of view.sections) {
      const lines = [...s.lines, ...(s.groups ?? []).flatMap((g) => g.lines)];
      const hit = lines.find(
        (l): l is Extract<RenderLine, { kind: 'article' }> =>
          l.kind === 'article' && l.key === expandedKey,
      );
      if (hit !== undefined) return hit;
    }
    return null;
  })();

  return (
    <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
      <div className="mb-6 lg:mb-0">
        <DigestToc
          view={view}
          startIndex={2}
          collapsedGroups={collapsedGroups}
          onExpandGroup={onExpandGroup}
          onNavigate={onNavigate}
          activeArticleKey={activeArticleKey}
        />
      </div>
      {/* Same main card frame as FULL (lawlib-article-card) — card inside card
          (user decision 2026-08-05); reader typography settings apply. */}
      <div
        className={`lawlib-article-card mx-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6 ${widthClass}`}
      >
        <div style={{ lineHeight }} className={`min-w-0 ${fontSizeClass} leading-relaxed`}>
          {/* Compact heading (user 2026-08-05): fixed "ฉบับย่อ — {LAW}" format —
              the digest md's own H1 is metadata only, never displayed. Carries
              the law-name keywords (loop-5 #3 SEO anchor). */}
          <h2 className="mt-6 text-xl font-bold leading-relaxed text-slate-900 first:mt-0 dark:text-white">
            ฉบับย่อ — {law.titleTh}
          </h2>
          {/* Sections 0-1 (ข้อมูลกฎหมาย / ประวัติการแก้ไข) are rendered in the
              reader HEADER (merged history block, both views — user 2026-08-05);
              the compact body starts at section 2 (คำนิยามสำคัญ). */}
          {view.sections.slice(2).map((section, i) => (
            <SectionView
              key={section.heading}
              section={section}
              sectionIndex={i + 2}
              law={law}
              expandedKey={expandedKey}
              popoverId={popoverId}
              tooltipId={tooltipId}
              onToggleCard={onToggleCard}
              onNavigate={onNavigate}
              onOpenRef={onOpenRef}
              onSeeFull={onSeeFull}
              flashKey={flashKey}
              collapsedGroups={collapsedGroups}
              onToggleGroup={onToggleGroup}
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
            />
          ))}
        </div>
      </div>

      {/* Floating full-article popover (click-pinned — like the term tooltip,
          user 2026-08-05). */}
      {expandedLine !== null && expandedKey !== null && (
        <ArticlePopover
          line={expandedLine}
          law={law}
          source={expandedSource}
          popoverId={popoverId}
          onClose={onCollapseCard}
          onSeeFull={onSeeFull}
          highlights={highlights}
          noteKeys={noteKeys}
          flashKey={flashKey}
          getTriggerProps={getTriggerProps}
          isTooltipOpen={isTooltipOpen}
        />
      )}
    </div>
  );
}
