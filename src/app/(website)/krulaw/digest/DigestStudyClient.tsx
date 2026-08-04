'use client';

/**
 * KruLAW — digest study-mode renderer (L5). Receives the server-built
 * DigestView (title + sections of render-ready lines) via DigestShell and
 * renders it as a readable study page: section headings, article cards with
 * deep links into the law reader, [[มาตรา N]] inline refs, [ดูเต็ม] chips,
 * a per-section มาตรา jump-strip, and มาตราสำคัญ chapter groups (หมวดที่
 * 1–9 + บทเฉพาะกาล, first expanded — collapse state is local component
 * state only; no localStorage).
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { THEMES, useTheme } from '@/components/ThemeProvider';
import type { Theme } from '@/components/ThemeProvider';
import type { DigestView, RenderChapterGroup, RenderLine, RenderToken } from './digest-view';

/** TH labels + icons per theme (plan §4.3 pattern: icon per current theme). */
const THEME_META: Record<Theme, { icon: string; labelTh: string }> = {
  light: { icon: 'fi-sr-sun', labelTh: 'สว่าง' },
  dark: { icon: 'fi-sr-moon', labelTh: 'มืด' },
  read: { icon: 'fi-sr-book', labelTh: 'อ่าน' },
};

/**
 * Compact 3-mode theme-cycle button — read mode must not be a dead-end on the
 * digest (navbar hidden there, no dock/gear). The `krulaw-theme-fab` class is
 * the print.css hide hook (Lane D's contract).
 */
function ThemeFab() {
  const { theme, setTheme } = useTheme();
  const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
  const meta = THEME_META[theme];
  const nextMeta = THEME_META[next];
  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={`โหมดปัจจุบัน: ${meta.labelTh} — สลับเป็น ${nextMeta.labelTh}`}
      className="krulaw-theme-fab fixed right-6 bottom-32 z-50 flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white/90 text-slate-700 shadow-md backdrop-blur transition-colors hover:border-blue-300 hover:text-blue-700 md:right-10 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-blue-500/60"
    >
      <i aria-hidden="true" className={`fi ${meta.icon} text-base leading-none`} />
    </button>
  );
}

/** Inline `~~…~~` strikethrough + `**…**` bold over plain text (unbalanced markers stay literal). */
function InlineText({ text }: { text: string }) {
  const strikeParts = text.split(/~~(.+?)~~/g);
  return (
    <>
      {strikeParts.map((part, i) =>
        i % 2 === 1 ? (
          <s key={i} className="text-slate-600 dark:text-slate-400">
            {part}
          </s>
        ) : (
          <BoldText key={i} text={part} />
        ),
      )}
    </>
  );
}

function BoldText({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-semibold text-slate-900 dark:text-white">
            {part}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  );
}

function Token({ token }: { token: RenderToken }) {
  if (token.kind === 'text') return <InlineText text={token.text} />;
  if (token.href === null) {
    // unresolved cross-law ref → plain text
    return <span>{token.label}</span>;
  }
  if (token.kind === 'seefull') {
    return (
      <Link
        href={token.href}
        className="ml-1 inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blue-700"
      >
        ดูเต็ม {token.label}
        <i aria-hidden="true" className="fi fi-sr-arrow-small-right text-[10px] leading-none" />
      </Link>
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

/** Body-line styling shared by top-level lines and article-card parts. */
type BodyKind = Exclude<RenderLine['kind'], 'article'>;

function BodyLine({ kind, tokens }: { kind: BodyKind; tokens: RenderToken[] }) {
  if (kind === 'h3') {
    return (
      <h3 className="mt-8 text-xl font-bold leading-relaxed text-slate-900 dark:text-white">
        {tokens.map((tok, i) => (
          <Token key={i} token={tok} />
        ))}
      </h3>
    );
  }
  if (kind === 'quote') {
    return (
      <p className="mt-3 border-l-4 border-amber-300 bg-amber-50 px-4 py-2 text-sm leading-relaxed text-slate-600 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-slate-300">
        {tokens.map((tok, i) => (
          <Token key={i} token={tok} />
        ))}
      </p>
    );
  }
  if (kind === 'bullet') {
    return (
      <p className="mt-2 flex gap-2 leading-relaxed text-slate-700 dark:text-slate-300">
        <span aria-hidden="true" className="shrink-0 select-none text-blue-500">
          •
        </span>
        <span>
          {tokens.map((tok, i) => (
            <Token key={i} token={tok} />
          ))}
        </span>
      </p>
    );
  }
  return (
    <p
      className={`mt-3 leading-relaxed text-slate-700 dark:text-slate-300 ${
        kind === 'numbered' ? 'pl-5' : ''
      }`}
    >
      {tokens.map((tok, i) => (
        <Token key={i} token={tok} />
      ))}
    </p>
  );
}

function Line({ line }: { line: RenderLine }) {
  if (line.kind === 'article') {
    return (
      <div className="krulaw-digest-card mt-4 rounded-xl border border-blue-100 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <Link
          href={line.href}
          className="text-lg font-bold leading-relaxed text-blue-700 hover:underline dark:text-blue-300"
        >
          {line.label}
          <i aria-hidden="true" className="fi fi-sr-arrow-small-right ml-1 text-sm" />
        </Link>
        {line.parts.map((part, j) => (
          <BodyLine key={j} kind={part.kind} tokens={part.tokens} />
        ))}
      </div>
    );
  }
  return <BodyLine kind={line.kind} tokens={line.tokens} />;
}

function Section({
  section,
  collapsed,
  onToggle,
}: {
  section: DigestView['sections'][number];
  collapsed: ReadonlySet<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <section className="mt-12">
      <h2 className="border-b-2 border-blue-100 pb-2 text-2xl font-bold leading-relaxed text-slate-900 dark:border-slate-700 dark:text-white">
        {section.heading}
      </h2>
      {section.articles.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600 dark:text-slate-400">
            สารบัญมาตรา
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {section.articles.map((a) => (
              <Link
                key={a.key}
                href={a.href}
                className="inline-flex items-center rounded-full border border-blue-200 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50 dark:border-slate-600 dark:text-blue-300 dark:hover:bg-slate-800"
              >
                {a.label}
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="mt-2">
        {section.lines.map((line, i) => (
          <Line key={i} line={line} />
        ))}
      </div>
      {section.groups !== undefined && (
        <div className="mt-2">
          {section.groups.map((group) => (
            <ChapterGroup
              key={group.id}
              group={group}
              collapsed={collapsed.has(group.id)}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Expandable chapter group ('หมวดที่ N <title> (N มาตรา)') — the group header
 * is the button (h3 wrapping a full-width button keeps the document outline);
 * the cards live in an aria-controls region that is hidden when collapsed.
 */
function ChapterGroup({
  group,
  collapsed,
  onToggle,
}: {
  group: RenderChapterGroup;
  collapsed: boolean;
  onToggle: (id: string) => void;
}) {
  const regionId = `digest-group-${group.id}`;
  return (
    <div className="mt-6">
      <h3>
        <button
          type="button"
          aria-expanded={!collapsed}
          aria-controls={regionId}
          onClick={() => onToggle(group.id)}
          className="flex w-full items-center justify-between gap-2 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-left text-base font-bold leading-relaxed text-slate-900 transition-colors hover:bg-blue-100/70 dark:border-slate-700 dark:bg-slate-800/60 dark:text-white dark:hover:bg-slate-800"
        >
          <span>
            {group.label}
            <span className="ml-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              ({group.articleCount} มาตรา)
            </span>
          </span>
          <i
            aria-hidden="true"
            className={`fi fi-sr-angle-small-down shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${
              collapsed ? '' : 'rotate-180'
            }`}
          />
        </button>
      </h3>
      <div id={regionId} hidden={collapsed} className="mt-2">
        {group.lines.map((line, i) => (
          <Line key={i} line={line} />
        ))}
      </div>
    </div>
  );
}

export default function DigestStudyClient({ view }: { view: DigestView }) {
  // Immersive-mode body hook (plan §4.7): navbar is hidden on digest — the
  // class lets global CSS (print/offsets) scope off it. Cleaned on unmount.
  useEffect(() => {
    document.body.classList.add('krulaw-immersive');
    return () => document.body.classList.remove('krulaw-immersive');
  }, []);

  // Chapter groups: first expanded, the rest collapsed. Computed from the
  // (deterministic, server-built) view prop → identical initial state on the
  // server and on hydration — no SSR divergence.
  const [collapsed, setCollapsed] = useState<ReadonlySet<string>>(() => {
    const groups = view.sections.flatMap((s) => s.groups ?? []);
    return new Set(groups.slice(1).map((g) => g.id));
  });

  const toggleGroup = (id: string): void => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <ThemeFab />
      <Link
        href="/krulaw"
        className="text-sm font-medium text-blue-700 hover:underline dark:text-blue-300"
      >
        ← กลับไปหน้ารายการกฎหมาย
      </Link>
      <h1 className="mt-4 text-3xl font-bold leading-relaxed text-slate-900 dark:text-white">
        {view.title}
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
        สรุปสาระสำคัญแบบอ่านง่าย — กดมาตราเพื่ออ่านฉบับเต็ม
      </p>
      {view.sections.map((section, i) => (
        <Section key={i} section={section} collapsed={collapsed} onToggle={toggleGroup} />
      ))}
    </div>
  );
}
