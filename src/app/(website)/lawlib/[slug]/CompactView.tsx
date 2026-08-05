'use client';

/**
 * CompactView — digest renderer for the merged reader (rev 5.5, T4).
 *
 * Renders a DigestView (server-built) as the COMPACT view:
 *  - digest title as a visible h2 (migrates the deleted digest page's keyword
 *    anchor — loop-5 #3) + section headings h2
 *  - chapter groups h3 (collapsible; first expanded — collapse state hoisted
 *    to the reader so digest-search jumps can auto-expand, loop-4 #6)
 *  - article cards: BUTTON header with NO heading tag (heading-inside-button
 *    is invalid — loop-5 #3), summary parts always visible; hover/tap expand
 *    renders the REAL article via ArticleView `singleKey` (byte-identical to
 *    FULL — user's "the same in the full version"); while expanded the card
 *    button is hidden (ArticleView header is the sole มาตรา-N trigger)
 *  - term tokens → tooltip triggers (data-lawlib-term + getTriggerProps),
 *    colored per the loop-4 #8 contrast spec (blue-800/blue-300)
 *  - same-law refs → in-page buttons (jump rule, loop-1 #3); cross-law refs
 *    stay Links; seefull tokens → FULL switch
 *  - every line carries `id=lawlib-dline-<n>` + tabindex=-1 (digest-search
 *    jump target + non-visual focus cue — loop-4 #6); flash class applied
 *
 * No dangerouslySetInnerHTML anywhere (loop-3 #2) — all React nodes.
 */

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { LawDoc } from '@/types/lawlib';
import type { DigestView, RenderLine, RenderSection, RenderToken } from '@/lib/lawlib/digest-view';
import type { ArticleHighlight } from '@/components/ArticleView';
import ArticleView from '@/components/ArticleView';
import type { TooltipContent, TooltipTriggerHandlers } from '@/hooks/useLawTooltip';
import DigestToc from './DigestToc';

interface CompactViewProps {
  view: DigestView;
  law: LawDoc;
  /** Reader settings → the SAME typography controls as FULL apply (parity). */
  fontSizeClass: string;
  widthClass: string;
  lineHeight: number;
  /** Expanded card article key (null = none). */
  expandedKey: string | null;
  /** How the current expansion started — hover must NEVER move focus (loop-4 #3). */
  expandedSource: 'hover' | 'interaction' | null;
  /** Toggle a card's expanded state (source: how the user triggered it). */
  onToggleCard: (key: string, source: 'hover' | 'interaction') => void;
  /** Collapse the expanded card (Escape / ย่อ / hover-out). */
  onCollapseCard: () => void;
  /** Jump rule (chips + same-law refs): card if exists, else FULL + jump. */
  onNavigate: (key: string) => void;
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

/** Inline token renderer — text/term with bold/strike, refs, seefull. */
function TokenView({
  token,
  slug,
  onNavigate,
  onSeeFull,
  getTriggerProps,
  isTooltipOpen,
}: {
  token: RenderToken;
  slug: string;
  onNavigate: (key: string) => void;
  onSeeFull: (key: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}) {
  if (token.kind === 'text' || token.kind === 'term') {
    const content = token.kind === 'text' ? token.text : token.term;
    const plain =
      token.kind === 'term' ? (
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
          className="cursor-pointer rounded-sm border-b-2 border-dashed border-blue-400/70 font-medium text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-500/60 dark:text-blue-300 dark:hover:bg-blue-950/40"
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
        className="ml-1 inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
      >
        ดูเต็ม {token.label}
        <i aria-hidden="true" className="fi fi-sr-arrow-small-right text-[10px] leading-none" />
      </button>
    );
  }
  // same-law ref → in-page button (jump rule); cross-law ref → Link
  if (isSameLawHref(token.href, slug)) {
    return (
      <button
        type="button"
        onClick={() => {
          const key = keyFromHref(token.href!);
          if (key !== null) onNavigate(key);
        }}
        className="cursor-pointer rounded-sm font-medium text-blue-700 underline decoration-dotted underline-offset-4 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-blue-300 dark:hover:bg-blue-950/40"
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

function TokenList({
  tokens,
  slug,
  onNavigate,
  onSeeFull,
  getTriggerProps,
  isTooltipOpen,
}: {
  tokens: RenderToken[];
  slug: string;
  onNavigate: (key: string) => void;
  onSeeFull: (key: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}) {
  return (
    <>
      {tokens.map((tok, i) => (
        <TokenView
          key={i}
          token={tok}
          slug={slug}
          onNavigate={onNavigate}
          onSeeFull={onSeeFull}
          getTriggerProps={getTriggerProps}
          isTooltipOpen={isTooltipOpen}
        />
      ))}
    </>
  );
}

/** Article card — summary + hover/tap expand to the real article. */
function ArticleCard({
  line,
  law,
  expanded,
  expandedSource,
  onToggleCard,
  onCollapseCard,
  onNavigate,
  onSeeFull,
  highlights,
  noteKeys,
  flashKey,
  getTriggerProps,
  isTooltipOpen,
}: {
  line: Extract<RenderLine, { kind: 'article' }>;
  law: LawDoc;
  expanded: boolean;
  expandedSource: 'hover' | 'interaction' | null;
  onToggleCard: (key: string, source: 'hover' | 'interaction') => void;
  onCollapseCard: () => void;
  onNavigate: (key: string) => void;
  onSeeFull: (key: string) => void;
  highlights: ArticleHighlight[];
  noteKeys: ReadonlySet<string>;
  flashKey: string | null;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}) {
  const cardRef = useRef<HTMLDivElement | null>(null);

  // Focus handoff (loop-4 #3): on interaction-driven expand, move focus to the
  // ArticleView header (the new sole มาตรา-N trigger); hover never focuses.
  useEffect(() => {
    if (!expanded) return;
    if (expandedSource === 'hover') return;
    const root = cardRef.current;
    if (root === null) return;
    const t = root.querySelector<HTMLElement>('[data-lawlib-trigger]');
    if (t !== null && t !== document.activeElement) t.focus();
  }, [expanded, expandedSource]);

  const isFlash = flashKey === line.key;

  return (
    <div
      ref={cardRef}
      id={line.id}
      tabIndex={-1}
      data-lawlib-card={line.key}
      onMouseEnter={() => onToggleCard(line.key, 'hover')}
      onMouseLeave={() => {
        // collapse on hover-out ONLY when focus is not inside the card
        // (loop-4 #3: blur-collapse destroys the focus target mid-interaction)
        if (!cardRef.current?.contains(document.activeElement)) onCollapseCard();
      }}
      className={`lawlib-digest-card rounded-xl border border-slate-200 bg-white px-4 py-3 transition-colors dark:border-slate-700 dark:bg-slate-900 ${
        isFlash ? 'ring-2 ring-amber-300 dark:ring-amber-500/50' : ''
      }`}
    >
      {!expanded ? (
        <button
          type="button"
          aria-expanded={false}
          onClick={() => onToggleCard(line.key, 'interaction')}
          className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg text-left text-base font-bold leading-relaxed text-slate-900 transition-colors hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:text-white dark:hover:text-blue-300"
        >
          <span>{line.label}</span>
          <i
            aria-hidden="true"
            className="fi fi-sr-angle-small-down text-xs text-slate-400 transition-transform dark:text-slate-500"
          />
        </button>
      ) : (
        <div className="mb-3 flex min-h-11 items-center justify-between gap-2">
          <span className="text-base font-bold leading-relaxed text-slate-900 dark:text-white">
            {line.label}
          </span>
          <button
            type="button"
            onClick={onCollapseCard}
            className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <i aria-hidden="true" className="fi fi-sr-angle-small-up text-[10px]" />
            ย่อ
          </button>
        </div>
      )}
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
              onNavigate={onNavigate}
              onSeeFull={onSeeFull}
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
            />
          </p>
        ))}
      </div>
      {expanded && (
        <>
          <div className="mt-3">
            <ArticleView
              law={law}
              highlights={highlights}
              noteKeys={noteKeys}
              flashKey={flashKey}
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
              singleKey={line.key}
            />
          </div>
          <div className="mt-2">
            <button
              type="button"
              onClick={() => onSeeFull(line.key)}
              className="inline-flex min-h-9 cursor-pointer items-center gap-1 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              ดูฉบับเต็มที่ {line.label}
              <i
                aria-hidden="true"
                className="fi fi-sr-arrow-small-right text-[10px] leading-none"
              />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/** One body line (non-article) with dline id (flash applied directly via DOM). */
function BodyLineView({
  line,
  slug,
  onNavigate,
  onSeeFull,
  getTriggerProps,
  isTooltipOpen,
}: {
  line: Exclude<RenderLine, { kind: 'article' }>;
  slug: string;
  onNavigate: (key: string) => void;
  onSeeFull: (key: string) => void;
  getTriggerProps: (content: TooltipContent) => TooltipTriggerHandlers;
  isTooltipOpen: (content: TooltipContent) => boolean;
}) {
  const tokens = (
    <TokenList
      tokens={line.tokens}
      slug={slug}
      onNavigate={onNavigate}
      onSeeFull={onSeeFull}
      getTriggerProps={getTriggerProps}
      isTooltipOpen={isTooltipOpen}
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
  expandedSource,
  onToggleCard,
  onCollapseCard,
  onNavigate,
  onSeeFull,
  highlights,
  noteKeys,
  flashKey,
  getTriggerProps,
  isTooltipOpen,
}: {
  group: { id: string; label: string; articleCount: number; lines: RenderLine[] };
  collapsed: boolean;
  onToggleGroup: (id: string) => void;
  law: LawDoc;
  expandedKey: string | null;
  expandedSource: 'hover' | 'interaction' | null;
  onToggleCard: (key: string, source: 'hover' | 'interaction') => void;
  onCollapseCard: () => void;
  onNavigate: (key: string) => void;
  onSeeFull: (key: string) => void;
  highlights: ArticleHighlight[];
  noteKeys: ReadonlySet<string>;
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
              expanded={expandedKey === line.key}
              expandedSource={expandedSource}
              onToggleCard={onToggleCard}
              onCollapseCard={onCollapseCard}
              onNavigate={onNavigate}
              onSeeFull={onSeeFull}
              highlights={highlights}
              noteKeys={noteKeys}
              flashKey={flashKey}
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
            />
          ) : (
            <BodyLineView
              key={line.id}
              line={line}
              slug={law.slug}
              onNavigate={onNavigate}
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
  expandedSource,
  onToggleCard,
  onCollapseCard,
  onNavigate,
  onSeeFull,
  highlights,
  noteKeys,
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
  expandedSource: 'hover' | 'interaction' | null;
  onToggleCard: (key: string, source: 'hover' | 'interaction') => void;
  onCollapseCard: () => void;
  onNavigate: (key: string) => void;
  onSeeFull: (key: string) => void;
  highlights: ArticleHighlight[];
  noteKeys: ReadonlySet<string>;
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
        expanded={expandedKey === line.key}
        expandedSource={expandedSource}
        onToggleCard={onToggleCard}
        onCollapseCard={onCollapseCard}
        onNavigate={onNavigate}
        onSeeFull={onSeeFull}
        highlights={highlights}
        noteKeys={noteKeys}
        flashKey={flashKey}
        getTriggerProps={getTriggerProps}
        isTooltipOpen={isTooltipOpen}
      />
    ) : (
      <BodyLineView
        key={line.id}
        line={line}
        slug={law.slug}
        onNavigate={onNavigate}
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
                  className="inline-flex min-h-9 cursor-pointer items-center rounded-full border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:text-blue-300 dark:hover:bg-slate-800"
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
                expandedSource={expandedSource}
                onToggleCard={onToggleCard}
                onCollapseCard={onCollapseCard}
                onNavigate={onNavigate}
                onSeeFull={onSeeFull}
                highlights={highlights}
                noteKeys={noteKeys}
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
  onToggleCard,
  onCollapseCard,
  onNavigate,
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
  return (
    <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
      <div className="mb-6 lg:mb-0">
        <DigestToc
          view={view}
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
          {view.title !== '' && (
            <h2 className="mt-6 text-xl font-bold leading-relaxed text-slate-900 first:mt-0 dark:text-white">
              {view.title}
            </h2>
          )}
          {view.sections.map((section, i) => (
            <SectionView
              key={section.heading}
              section={section}
              sectionIndex={i}
              law={law}
              expandedKey={expandedKey}
              expandedSource={expandedSource}
              onToggleCard={onToggleCard}
              onCollapseCard={onCollapseCard}
              onNavigate={onNavigate}
              onSeeFull={onSeeFull}
              highlights={highlights}
              noteKeys={noteKeys}
              flashKey={flashKey}
              collapsedGroups={collapsedGroups}
              onToggleGroup={onToggleGroup}
              getTriggerProps={getTriggerProps}
              isTooltipOpen={isTooltipOpen}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
