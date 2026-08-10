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
 *
 * T12b/T17 (ADR-019 D9 / ADR-021): the PANEL is CONTENT glass —
 * slider-driven fill via the content formula (contentGlassAlpha 0.5–0.95)
 * + content blur (6–8px), `.lawlib-glass-content` + sheen — a DISTINCT
 * surface from the dock/search chrome (which keeps the old fill + blur-xs
 * vars). The whole card is ONE uniform glass surface — no nested solid
 * wrapper; interactive hub buttons and the repealed badge keep their own
 * solid surfaces (contrast AA).
 */

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
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
 * T11 digest-ref content: a same-law ref carrying the COMPACT digest snippet
 * (ฉบับย่อ) of the referenced article + its repealed status. Modeled as
 * `kind: 'ref'` + extra fields ON PURPOSE — the TooltipContent union lives
 * in useLawTooltip.ts (T1, READ-ONLY), and `sameContent` compares refs by
 * article identity (lawSlug/articleNo/articleSuffix), so a digest-ref
 * behaves as a ref in the hook's content-gate / aria-expanded / pin-toggle
 * logic with zero hook changes. LawTooltip detects it duck-typed
 * (isDigestRefContent) and renders the compact branch; member-button refs
 * (no digest fields) keep the full-article ArticleBody branch.
 */
export type DigestRefContent = TooltipContent & {
  kind: 'ref';
  /** Compact digest snippet (ฉบับย่อ) of the referenced article. */
  digest: string;
  /** Repealed status → ถูกยกเลิก badge in the snippet. */
  repealed: boolean;
};

/** Duck-typed guard — digest-refs are structurally refs with `digest`. */
function isDigestRefContent(content: TooltipContent): content is DigestRefContent {
  return content.kind === 'ref' && 'digest' in content;
}

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
  /**
   * T19 — hover PREVIEW mode (user decision 2026-08-09): true → the body
   * opens clamped to ~5 rows + a one-way ดูเพิ่มเติม expand button; false →
   * full text directly (click-pin = intent to read; keyboard too). Default
   * false — pre-wiring callers/tests get the full text, unchanged.
   */
  preview?: boolean;
  /**
   * T28 — EXIT state (lives in useLawTooltip — unmount is hook-driven):
   * true → the root plays `lawlib-tooltip-out` (120ms --ease-ios-in, mirror
   * of the entry; transform-origin stays at the trigger-side placement
   * origin set at open) and the entry-direction data attr is dropped so the
   * exit animation-name wins the cascade. Keyboard/Esc/reduced-motion closes
   * never enter it (instant unmount — AC-4/AC-5).
   */
  closing?: boolean;
}

const GAP = 8;

export interface TooltipPosition {
  left: number;
  top: number;
  /** Entry-animation pivot: 'top' when placed BELOW the anchor (grows
   *  downward), 'bottom' when placed above (grows upward), and — T19 —
   *  'right'/'left' when placed BESIDE the anchor. transformOrigin maps 1:1
   *  (origin='right' → transformOrigin='right', anchored on the RIGHT edge
   *  of the tooltip, i.e. the edge AWAY from the trigger). */
  origin: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * W3-4 gap-aware placement. Horizontal: centered on the anchor, clamped into
 * the viewport. Vertical preference, in order:
 *  1. below the anchor with the full gap on BOTH sides (trigger gap + 8px
 *     viewport bottom margin)
 *  2. above the anchor with the full gap on BOTH sides
 *  3. RIGHT of the anchor (T19): `left = anchor.right + gap`, vertically
 *     centered on the anchor (clamped into the viewport) — fits when the
 *     tooltip fits beside it (never horizontally overlaps the trigger —
 *     kills the "covers the มาตรา being hovered" complaint for tall
 *     tooltips)
 *  4. LEFT of the anchor (T19): `left = anchor.left − w − gap`, same
 *     vertical clamp — fits when it clears the left edge
 *  5. below with a REDUCED viewport bottom margin — the W3-4 trigger-gap
 *     keeper, restored (T19-fix) as the pre-footerClear safety net: when
 *     BOTH side branches fail (vw too narrow) but the viewport can still
 *     fit the tooltip below WITHOUT the bottom margin, it goes below with
 *     the trigger gap — never overlapping the trigger; rejected when it
 *     would cross the site footer (same guard as 1)
 *  6. footerClear (T18-fix): nothing fits cleanly → prefer ending just
 *     above the site footer when that leaves ≥ gap of headroom (may still
 *     overlap the trigger — the documented unavoidable case)
 *  7. fallback: clamp into the viewport (may overlap the trigger)
 *
 * The trigger gap is the hard requirement: when the viewport can fit the
 * tooltip anywhere (below/above/side), it never overlaps the trigger. The
 * T19 side branches run AHEAD of the reduced-margin below (user preference)
 * — the reduced-margin below stays as the pre-footerClear safety net (the
 * W3-4 invariant holds even when the sides can't fit).
 *
 * T19 FOOTER GUARD (senior MAJOR): after the side branches' top clamp, a
 * side tooltip that would cross the site footer shifts UP to end just above
 * it when that leaves ≥ gap of headroom (horizontal separation keeps the
 * never-overlap-trigger invariant either way).
 */
export function computeTooltipPosition(
  anchorRect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom' | 'width'>,
  tooltipWidth: number,
  tooltipHeight: number,
  vw: number,
  vh: number,
  gap = GAP,
  /**
   * T18 — site footer's top edge in viewport coords (undefined = no footer →
   * behavior unchanged). The footer is in-flow content inside the viewport,
   * so "fits the viewport" ≠ "doesn't cover the footer" — the below-position
   * is rejected when it would cross the footer AND space above exists.
   */
  footerTop?: number,
): TooltipPosition {
  const centeredLeft = Math.min(
    Math.max(anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2, gap),
    Math.max(vw - tooltipWidth - gap, gap),
  );
  const below = anchorRect.bottom + gap;
  const above = anchorRect.top - tooltipHeight - gap;
  const overlapsFooter = (top: number) =>
    footerTop !== undefined && top < footerTop && top + tooltipHeight > footerTop;
  // T19 — side placement: vertically centered on the anchor (centerY =
  // (top+bottom)/2), clamped into the viewport with the full gap.
  const sideTop = () =>
    Math.max(
      gap,
      Math.min(
        (anchorRect.top + anchorRect.bottom) / 2 - tooltipHeight / 2,
        vh - tooltipHeight - gap,
      ),
    );
  // T19 — footer guard on the side branches: a side tooltip at a low anchor
  // can still cross the site footer; shift it up to end just above the
  // footer when that leaves ≥ gap of headroom, else keep the clamped top.
  const footerGuard = (top: number) =>
    footerTop !== undefined &&
    top + tooltipHeight > footerTop &&
    footerTop - tooltipHeight - gap >= gap
      ? footerTop - tooltipHeight - gap
      : top;
  let left = centeredLeft;
  let top: number;
  let origin: TooltipPosition['origin'];
  if (below + tooltipHeight <= vh - gap && !overlapsFooter(below)) {
    top = below;
    origin = 'top';
  } else if (above >= gap) {
    top = above;
    origin = 'bottom';
  } else {
    // T19 — side branches (right first, then left); each needs the tooltip
    // to fit the viewport HEIGHT with full gaps (h ≤ vh − 2·gap — otherwise
    // the vertical clamp would itself be degenerate).
    const rightLeft = anchorRect.right + gap;
    if (rightLeft + tooltipWidth <= vw - gap && tooltipHeight <= vh - 2 * gap) {
      left = rightLeft;
      top = footerGuard(sideTop());
      origin = 'right';
    } else {
      const leftLeft = anchorRect.left - tooltipWidth - gap;
      if (leftLeft >= gap && tooltipHeight <= vh - 2 * gap) {
        left = leftLeft;
        top = footerGuard(sideTop());
        origin = 'left';
      } else if (below + tooltipHeight <= vh && !overlapsFooter(below)) {
        // T19-fix (senior MAJOR): restored branch-3 — the reduced-margin
        // below as the pre-footerClear safety net. Both side branches fail
        // (vw too narrow) but the viewport still fits the tooltip below
        // WITHOUT the bottom margin (below + h ≤ vh) and it doesn't cross
        // the footer → place it at the trigger gap, never covering the
        // trigger (the W3-4 invariant preserved when sides can't help).
        top = below;
        origin = 'top';
      } else {
        // T18-fix: nothing fits cleanly — prefer ending just above the footer
        // when that leaves ≥ gap of headroom (minimizes harm; may still overlap
        // the trigger — unavoidable when the tooltip is taller than the space)
        const footerClear =
          footerTop !== undefined ? footerTop - tooltipHeight - gap : Number.NEGATIVE_INFINITY;
        top = footerClear >= gap ? footerClear : Math.max(above, gap);
        origin = 'bottom';
      }
    }
  }
  return { left, top, origin };
}

/** Debounced autosave note box (ADR-019 D7 — โน้ตเขียนด่วน). Saves 500ms
 *  after the last keystroke, flushed on blur AND on unmount (a closing
 *  tooltip must not drop the last keystrokes). Ref mirrors are updated in
 *  effects (react-compiler: no ref writes during render).
 *
 *  T16: COLLAPSED by default — an icon-only Quick-Note button (44px, matching
 *  the hub action buttons). Clicking expands the header row + textarea and
 *  moves focus INTO the textarea; clicking the × collapses again. The box
 *  stays MOUNTED across collapse/expand (only the inner section is
 *  conditionally rendered), so the draft, the 500ms autosave, the blur flush
 *  and the unmount flush all keep working exactly as before. An existing
 *  saved note (initialText !== '') is discoverable while collapsed: the
 *  aria-label becomes "โน้ตด่วน (มีโน้ต)" + a tiny amber dot — the LABEL is
 *  the non-color cue. */
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
  const [expanded, setExpanded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest-draft / latest-onSave mirrors — read by the stable flush (a timer
  // callback can't see fresh state; the unmount flush must not be stale).
  const draftRef = useRef(initialText);
  const saveRef = useRef(onSave);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const hasNote = initialText !== '';

  useEffect(() => {
    draftRef.current = draft;
  });
  useEffect(() => {
    saveRef.current = onSave;
  });

  // T16: move focus into the textarea on EXPAND only — the effect re-runs on
  // every `expanded` change, so typing while expanded never re-focuses.
  useEffect(() => {
    if (expanded) textareaRef.current?.focus();
  }, [expanded]);

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

  // ONE persistent toggle control: collapsed → the Quick-Note icon button;
  // expanded → the × in the header row. The button never unmounts, so focus
  // stays on it across collapse (no focus fall to body).
  const toggleButton = (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      aria-expanded={expanded}
      aria-label={expanded ? 'ปิดโน้ตด่วน' : hasNote ? 'โน้ตด่วน (มีโน้ต)' : 'โน้ตด่วน'}
      title={expanded ? 'ปิดโน้ตด่วน' : hasNote ? 'โน้ตด่วน (มีโน้ต)' : 'โน้ตด่วน'}
      className={
        expanded
          ? 'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-slate-500 shadow-xs transition-[transform,background-color,border-color] duration-150 hover:scale-110 hover:border-rose-400/80 hover:bg-white hover:text-rose-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:border-rose-400/60 dark:hover:text-rose-300'
          : 'relative inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-slate-600 shadow-xs backdrop-blur-xs transition-[transform,background-color,border-color] duration-150 hover:scale-105 hover:border-blue-400/80 hover:bg-white hover:text-blue-600 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:bg-slate-700/90 dark:hover:text-blue-300'
      }
    >
      <i
        aria-hidden="true"
        className={`fi ${expanded ? 'fi-sr-cross' : 'fi-sr-note-sticky'} text-[10px]`}
      />
      {!expanded && hasNote && (
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 ring-1.5 ring-white dark:ring-slate-900"
        />
      )}
    </button>
  );

  return (
    <div className="space-y-1.5">
      {expanded ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              โน้ตด่วน
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenNotes}
                className="flex min-h-7 cursor-pointer items-center text-[11px] font-medium text-blue-700 underline-offset-2 hover:underline dark:text-blue-300"
              >
                เปิดโน้ตทั้งแผง →
              </button>
              {toggleButton}
            </div>
          </div>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={flush}
            rows={2}
            aria-label="โน้ตด่วนสำหรับมาตราที่เปิด"
            placeholder="จดโน้ตด่วน… (บันทึกอัตโนมัติ)"
            className="w-full resize-none rounded-xl border border-slate-200/90 bg-white/90 p-2.5 text-xs leading-relaxed text-slate-700 placeholder:text-slate-400 shadow-xs backdrop-blur-xs focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-slate-700/80 dark:bg-slate-800/90 dark:text-slate-200 dark:placeholder:text-slate-400 dark:focus:bg-slate-800"
          />
          <p
            aria-live="polite"
            role="status"
            className="min-h-3.5 text-right text-[10px] text-slate-500 dark:text-slate-400"
          >
            {saved ? 'บันทึกแล้ว' : ''}
          </p>
        </>
      ) : (
        toggleButton
      )}
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
    <div className="space-y-2 border-t border-slate-200/60 pt-2.5 dark:border-slate-700/60">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={hub.onToggleBookmark}
          aria-pressed={hub.isBookmarked}
          aria-label={hub.isBookmarked ? 'นำออกจากที่คั่นหน้า' : 'เพิ่มที่คั่นหน้า'}
          className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium shadow-xs transition-[transform,background-color,border-color] duration-150 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            hub.isBookmarked
              ? 'border-blue-500/80 bg-blue-50/90 text-blue-600 shadow-xs ring-2 ring-blue-500/20 dark:border-blue-400/80 dark:bg-blue-950/70 dark:text-blue-300 dark:ring-blue-400/20'
              : 'border-slate-200/90 bg-white/90 text-slate-600 hover:border-blue-400/80 hover:bg-white hover:text-blue-600 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:bg-slate-700/90 dark:hover:text-blue-300'
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
          className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs font-medium shadow-xs transition-[transform,background-color,border-color] duration-150 hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
            linkCopied
              ? 'border-emerald-400/80 bg-emerald-50/90 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-950/50 dark:text-emerald-300'
              : 'border-slate-200/90 bg-white/90 text-slate-600 hover:border-blue-400/80 hover:bg-white hover:text-blue-600 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:bg-slate-700/90 dark:hover:text-blue-300'
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
          onClose();
          hub.onOpenNotes();
        }}
      />
    </div>
  );
}

/**
 * T19 — 5-row hover preview + ดูเพิ่มเติม (user decision 2026-08-09): hover
 * tooltips open clamped to ~5 rows with a ONE-WAY expand button; click-pin
 * opens full text directly (click = intent to read — the reader passes
 * preview={false} then). Shared by ALL THREE tooltip bodies (full article,
 * digest-ref, glossary definition).
 *
 * Structure rules (senior MAJOR):
 *  - the button is a SIBLING OUTSIDE the clamped element — line-clamp would
 *    clip an inner button
 *  - the collapsed branch carries NO max-h/overflow on the clamped element
 *    (that combo silently disables -webkit-line-clamp); the caller's own
 *    scroll container stays OUTSIDE this component
 *  - expanded → full text, button hidden (one-way expand — no ดูน้อยลง)
 */
function PreviewClamp({
  expanded,
  onExpand,
  children,
}: {
  expanded: boolean;
  onExpand: () => void;
  children: ReactNode;
}) {
  // T19-fix (senior NIT): the clamped region carries a stable id and the
  // ดูเพิ่มเติม button points at it via aria-controls. useId — the id must
  // survive the expand flip (same component instance, conditional return).
  const clampId = useId();
  if (expanded) return <>{children}</>;
  return (
    <>
      <div id={clampId} className="line-clamp-5">
        {children}
      </div>
      <button
        type="button"
        onClick={onExpand}
        aria-controls={clampId}
        // Renders ONLY while collapsed — the controlled region is collapsed
        // by definition whenever this button exists.
        aria-expanded={false}
        // T19-fix (senior NIT): no mt-2 — the parent scroll container owns
        // the vertical gap (space-y-2 on all three bodies).
        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3 text-xs font-medium text-slate-600 shadow-xs backdrop-blur-xs transition-[transform,background-color,border-color] duration-150 hover:scale-[1.02] hover:border-blue-400/80 hover:bg-white hover:text-blue-600 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:bg-slate-700/90 dark:hover:text-blue-300"
      >
        ดูเพิ่มเติม
        <i aria-hidden="true" className="fi fi-sr-arrow-down text-[10px] leading-none" />
      </button>
    </>
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
  previewExpanded,
  onExpandPreview,
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
  /** T19 preview state lifted to the LawTooltip root (expand re-positions). */
  previewExpanded: boolean;
  onExpandPreview: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const key = articleKeyOf(article);
  const label = articleLabel(article.no, article.suffix);
  const target = findArticle(law, article.no, article.suffix);

  const handleCopy = async () => {
    if (!target) return;
    const ok = await copyText(`${articlePlainText(target)}\n\n— ${code} ${label}`);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
          {target !== undefined &&
            target.repealedParagraphs !== undefined &&
            target.repealedParagraphs.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-200/80 bg-red-50/90 px-2.5 py-0.5 text-[11px] font-semibold leading-relaxed text-red-700 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-300">
                <i aria-hidden="true" className="fi fi-sr-exclamation text-[10px]" />
                ถูกยกเลิก
              </span>
            )}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border border-slate-200/90 bg-white/90 px-3 text-xs text-slate-600 shadow-xs backdrop-blur-xs transition-[transform,background-color,border-color] duration-150 hover:scale-105 hover:border-blue-400/80 hover:bg-white hover:text-blue-600 active:scale-95 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-blue-400/60 dark:hover:bg-slate-700/90 dark:hover:text-blue-300"
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
            className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 text-[15px] leading-relaxed text-slate-800 dark:text-slate-200"
          >
            <PreviewClamp expanded={previewExpanded} onExpand={onExpandPreview}>
              {articlePlainText(target)
                .split(/\n+/)
                .filter((p) => p.trim() !== '')
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </PreviewClamp>
          </div>

          {target.amendedBy !== undefined && target.amendedBy.length > 0 && (
            <ul className="lawlib-amendment-notes space-y-1 rounded-xl border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
              {target.amendedBy.map((am, i) => {
                const edition = law.editions.find((e) => e.no === am.editionNo);
                return (
                  <li key={i}>
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

      {hub !== undefined && <ArticleHub key={key} hub={hub} onClose={onClose} />}

      <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 dark:border-slate-700/60">
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

/**
 * T11 digest-ref body: the COMPACT ฉบับย่อ snippet of the referenced article
 * (+ ถูกยกเลิก badge when repealed) + the article-actions hub (same-law refs
 * carry the hub) + ดูฉบับเต็ม → the reader's onOpenArticle (sanctioned close
 * path: handleTooltipOpenArticle closes the tooltip, then opens the compact
 * ArticlePopover for in-digest articles / jumps FULL otherwise).
 */
function DigestRefBody({
  content,
  code,
  onOpenArticle,
  onClose,
  hub,
  previewExpanded,
  onExpandPreview,
}: {
  content: DigestRefContent;
  code: string;
  onOpenArticle: (articleKey: string) => void;
  onClose: () => void;
  hub?: LawTooltipHub;
  /** T19 preview state lifted to the LawTooltip root (expand re-positions). */
  previewExpanded: boolean;
  onExpandPreview: () => void;
}) {
  const label = articleLabel(content.articleNo, content.articleSuffix);
  const key = articleKeyOf({ no: content.articleNo, suffix: content.articleSuffix });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{label}</span>
        {content.repealed && (
          <span className="inline-flex items-center gap-1 rounded-full border border-red-200/80 bg-red-50/90 px-2.5 py-0.5 text-[11px] font-semibold leading-relaxed text-red-700 dark:border-red-500/40 dark:bg-red-950/50 dark:text-red-300">
            <i aria-hidden="true" className="fi fi-sr-exclamation text-[10px]" />
            ถูกยกเลิก
          </span>
        )}
      </div>
      {content.digest !== '' ? (
        <div
          aria-live="polite"
          className="max-h-[60vh] space-y-2 overflow-y-auto whitespace-pre-line pr-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200"
        >
          <PreviewClamp expanded={previewExpanded} onExpand={onExpandPreview}>
            {content.digest}
          </PreviewClamp>
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">ไม่พบข้อมูลฉบับย่อของมาตรานี้</p>
      )}
      {hub !== undefined && <ArticleHub key={key} hub={hub} onClose={onClose} />}
      <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 pt-2.5 dark:border-slate-700/60">
        <button
          type="button"
          onClick={() => onOpenArticle(key)}
          className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition-[transform,background-color,border-color] duration-150 hover:scale-105 hover:bg-blue-700 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ดูฉบับเต็ม
          <i aria-hidden="true" className="fi fi-sr-arrow-small-right text-[10px] leading-none" />
        </button>
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
  previewExpanded,
  onExpandPreview,
}: {
  lawCode: string;
  articleNo: number;
  articleSuffix?: string;
  onOpenArticle: (articleKey: string) => void;
  onClose: () => void;
  /** T19 preview state lifted to the LawTooltip root (expand re-positions). */
  previewExpanded: boolean;
  onExpandPreview: () => void;
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
      previewExpanded={previewExpanded}
      onExpandPreview={onExpandPreview}
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
  preview = false,
  closing = false,
}: LawTooltipProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  // T19 — hover preview: clamp + ดูเพิ่มเติม when `preview` (hover-open),
  // full text from the start when not (click-pin / keyboard / pre-wiring).
  const [expanded, setExpanded] = useState(!preview);
  const handleExpandPreview = useCallback(() => setExpanded(true), []);
  // T19 (senior MINOR) — expanded-reset on content swap: hover A → expand →
  // hover B within the 150ms grace would otherwise open B pre-expanded (the
  // tooltip stays MOUNTED — the hook swaps content in place). Render-time
  // derived reset (React-sanctioned "storing information from previous
  // renders" — NOT an effect, which would trip set-state-in-effect). The
  // `preview` term also catches the hover→pin re-open on the SAME content:
  // click flips preview to false → reset to expanded (click = intent to read).
  const [prevContent, setPrevContent] = useState(content);
  const [prevPreview, setPrevPreview] = useState(preview);
  if (prevContent !== content || prevPreview !== preview) {
    setPrevContent(content);
    setPrevPreview(preview);
    setExpanded(!preview);
  }

  // Position once measured — direct style writes (no setState), so the
  // compiler set-state-in-effect rule stays untouched. Visibility flips after
  // the first measurement → no flash at the origin corner. W3-4: the
  // placement lives in computeTooltipPosition (gap-aware flip/clamp — never
  // overlaps the trigger when the viewport can fit the tooltip anywhere).
  // T19: `expanded` in the deps — clicking ดูเพิ่มเติม grows the tooltip, so
  // the position must be recomputed (footer-aware side flips included).
  useLayoutEffect(() => {
    const el = rootRef.current;
    if (el === null || sheet) {
      // Sheet variant (or no root yet): never positions, so it never sets
      // the rise vars — clear any vars a PREVIOUS desktop placement left
      // on this node (desktop→mobile resize keeps the tooltip mounted for
      // the exit hold) so the sheet's exit keeps the keyframe DEFAULTS
      // (down drift), never a stale side/above direction. For the normal
      // tooltip path the vars stay set through the closing phase — the
      // exit keyframe reads them (lawlib-tooltip-out) — and die with the
      // element on unmount.
      el?.style.removeProperty('--lawlib-tooltip-rise-x');
      el?.style.removeProperty('--lawlib-tooltip-rise-y');
      return;
    }
    const rect = el.getBoundingClientRect();
    // T18 — read the footer once at open (footer is in-flow content; the
    // tooltip closes on scrollend so no reposition reactivity is needed).
    const footerTop = document.getElementById('site-footer')?.getBoundingClientRect().y;
    const { left, top, origin } = computeTooltipPosition(
      anchorRect,
      rect.width,
      rect.height,
      window.innerWidth,
      window.innerHeight,
      undefined,
      footerTop,
    );
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    // T28 (AC-1) — placement-directional ENTRY rise: below → translateY(4px)
    // (the keyframe default — lawlib-tooltip-in unchanged), above → −4px,
    // right → translateX(4px), left → −4px. Consumed by
    // lawlib-tooltip-in-dir (lawlib-tooltip[data-tooltip-rise]); the sheet
    // variant never reaches this effect and keeps the keyframe defaults.
    el.style.setProperty(
      '--lawlib-tooltip-rise-x',
      origin === 'left' ? '-4px' : origin === 'right' ? '4px' : '0px',
    );
    el.style.setProperty(
      '--lawlib-tooltip-rise-y',
      origin === 'top' ? '4px' : origin === 'bottom' ? '-4px' : '0px',
    );
    // Entry animation pivots from the anchor edge (below → top origin, flipped
    // above → bottom origin; T19 side placement → 'left'/'right' edge, the
    // edge AWAY from the trigger); the sheet variant pivots from bottom-center.
    // The SAME inline origin drives the exit (T28 AC-2): `lawlib-tooltip-out`
    // scales toward this pivot → the tooltip fades toward the trigger.
    el.style.transformOrigin = origin;
    el.style.visibility = 'visible';
  }, [anchorRect, content, sheet, expanded]);

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
        <div
          aria-live="polite"
          className="max-h-[60vh] space-y-2 overflow-y-auto pr-1 text-sm leading-relaxed text-slate-800 dark:text-slate-200"
        >
          <PreviewClamp expanded={expanded} onExpand={handleExpandPreview}>
            {content.definition}
          </PreviewClamp>
        </div>
      </div>
    ) : isDigestRefContent(content) ? (
      // T11 compact digest ref — ฉบับย่อ snippet + ดูฉบับเต็ม (opened via the
      // reader's sanctioned onOpenArticle path) + the article-actions hub.
      <DigestRefBody
        content={content}
        code={law.code}
        onOpenArticle={onOpenArticle}
        onClose={onClose}
        hub={hub}
        previewExpanded={expanded}
        onExpandPreview={handleExpandPreview}
      />
    ) : content.lawSlug !== undefined ? (
      <CrossLawArticle
        key={content.lawSlug}
        lawCode={content.lawSlug}
        articleNo={content.articleNo}
        articleSuffix={content.articleSuffix}
        onOpenArticle={onOpenArticle}
        onClose={onClose}
        previewExpanded={expanded}
        onExpandPreview={handleExpandPreview}
      />
    ) : (
      <ArticleBody
        law={law}
        article={{ no: content.articleNo, suffix: content.articleSuffix }}
        code={law.code}
        onOpenArticle={onOpenArticle}
        onClose={onClose}
        hub={hub}
        previewExpanded={expanded}
        onExpandPreview={handleExpandPreview}
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
        // literal would silently fall back to the sans-serif stack). Prepend
        // the reader's --lawlib-font-family so an Itim/Sarabun reader sees its
        // chosen family; the var only resolves where an ancestor defines it
        // (falls back to Sarabun for glossary/cross-law surfaces).
        fontFamily: 'var(--lawlib-font-family), var(--font-sarabun), "Noto Sans Thai", sans-serif',
        ...(sheet ? undefined : { left: 0, top: 0, visibility: 'hidden' }),
      }}
      // T28 — entry-direction override + exit state on the SAME root: while
      // open, `data-tooltip-rise` selects the direction-aware entry keyframe
      // (lawlib-tooltip-in-dir); while closing it is REMOVED so the
      // `lawlib-tooltip-out` class's animation-name wins the cascade (the
      // exit must never be overridden by a stale entry-name). T34 (ADR-024
      // D2): NO view-transition-name on the tooltip — `.lawlib-glass-content`
      // carries backdrop-filter, and Chrome captures a BLANK snapshot for
      // backdrop-filter + view-transition-name (vanish during theme VT).
      data-tooltip-rise={closing ? undefined : ''}
      className={
        sheet
          ? `lawlib-tooltip lawlib-glass-content lawlib-glass-sheen fixed inset-x-0 bottom-0 z-[70] max-h-[75vh] origin-bottom overflow-y-auto rounded-t-2xl border-t border-slate-200/80 px-4 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/70${closing ? ' lawlib-tooltip-out' : ''}`
          : `lawlib-tooltip lawlib-glass-content lawlib-glass-sheen fixed z-[70] max-h-[calc(100vh-2rem)] w-[min(92vw,28rem)] overflow-y-auto rounded-2xl border border-slate-200/80 p-4 shadow-2xl shadow-slate-900/10 outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700/70 dark:shadow-black/40${closing ? ' lawlib-tooltip-out' : ''}`
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
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-slate-200/90 bg-white/90 text-slate-500 shadow-xs transition-[transform,background-color,border-color] duration-150 hover:scale-105 hover:text-slate-800 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-400 dark:hover:text-white"
            >
              <i aria-hidden="true" className="fi fi-sr-cross text-[10px]" />
            </button>
          </div>
        </>
      )}
      {/* Uniform glass surface: the whole tooltip card shares the single
          glass surface without a nested static background container. */}
      <div className="space-y-3">{inner}</div>
    </div>,
    document.body,
  );
}
